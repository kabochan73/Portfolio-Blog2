# バックエンド（Laravel）設計

対象: `backend/`

## 1. 全体方針

- **APIオンリー構成**: ビューを持たない純粋なJSON API。未認証時は常に401 JSONを返す
  （Laravelデフォルトの`login`名前付きルートへのリダイレクトはしない）。
- **認証方式**: Sanctum の SPA Cookie認証（`$middleware->statefulApi()`）。Bearerトークンではなく、
  `SANCTUM_STATEFUL_DOMAINS`に登録したフロントエンドのオリジンからのリクエストのみ、httpOnlyな
  セッションcookieで認証される。CSRF対策として`/sanctum/csrf-cookie`から発行される`XSRF-TOKEN` cookieを
  フロントエンドが`X-XSRF-TOKEN`ヘッダーに載せて送る。
- コントローラーは「公開用」（`PostController`, `TagController`）と「管理用」（`Admin/PostController`, `Admin/TagController`）に分離。

## 2. データベース設計

### テーブル一覧

| テーブル | 用途 |
|---|---|
| `users` | 認証専用ユーザー（実運用は1名想定だが複数管理者にも耐える設計） |
| `posts` | 記事 |
| `tags` | タグ |
| `post_tag` | Post⇔Tagの中間テーブル |
| `sessions`, `cache`, `jobs`, `personal_access_tokens` | Laravel標準スケルトン（Sanctumトークンは未使用） |

### カラム定義

**`users`**: `id`, `name`, `email`(unique), `password`, `remember_token`, timestamps

**`posts`**:
| カラム | 型 | 備考 |
|---|---|---|
| `id` | bigint PK | |
| `user_id` | FK → users | 投稿者。作成時に`auth()->id()`を自動セット |
| `title` | string | 最大30文字 |
| `slug` | string, unique | 最大30文字、`alpha_dash` |
| `body` | text | Markdown |
| `thumbnail_url` | string, nullable | Railway Bucket上の画像URL |
| `status` | string, default `'draft'` | PHP enum `PostStatus`でキャスト（`draft`/`published`） |
| timestamps | | |

**`tags`**: `id`, `name`(unique, 最大12文字), timestamps

**`post_tag`**: `post_id`（FK, `cascadeOnDelete()`）, `tag_id`（FK, `cascadeOnDelete()`）, 複合主キー `[post_id, tag_id]`

- **excerpt・published_atは追加しない**: 一覧の説明文表示は無し、日付表示は`created_at`をそのまま使う
- **category・comment・likeは追加しない**（今回のスコープ外）

### PHP Enum

```php
// app/Enums/PostStatus.php
enum PostStatus: string
{
    case Draft = 'draft';
    case Published = 'published';
}
```

`Post`モデルの`casts()`で`'status' => PostStatus::class`。バリデーションは`Rule::enum(PostStatus::class)`。

### モデル

```php
// app/Models/Post.php
class Post extends Model
{
    protected function casts(): array
    {
        return ['status' => PostStatus::class];
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
```

## 3. APIルート一覧（`routes/api.php`）

| メソッド | パス | 認証 | 備考 |
|---|---|---|---|
| POST | `/api/login` | 不要 | |
| POST | `/api/logout` | 必要 | |
| GET | `/api/user` | 必要 | |
| GET | `/api/posts` | 不要 | 公開記事(`status=published`)のみ |
| GET | `/api/posts/{slug}` | 不要 | 公開記事のみ、下書き/不存在は404 |
| GET | `/api/tags` | 不要 | 全件、名前順 |
| `apiResource` | `/api/admin/posts[/{post}]` | 必要 | `PostPolicy`による所有者ベース認可 |
| `apiResource` | `/api/admin/tags[/{tag}]` | 必要 | Policy無し、`auth:sanctum`のみ |

- 新規登録・パスワード変更・パスワードリセットのルートは無し
- ページネーション・検索・タグによる絞り込みAPIは無し（全件取得、フロント側でフィルタ）

## 4. 認証・認可

### 認証（AuthController）

- `login()`: インラインバリデーション、`Auth::attempt($credentials)`。**ユーザー不存在とパスワード誤りを
  区別しない**（列挙攻撃対策、失敗時は`email`フィールドに統一エラー）。成功時は`session()->regenerate()`
  （セッション固定化対策）。
- `logout()`: `Auth::guard('web')->logout()` → `session()->invalidate()` → `session()->regenerateToken()`。

### 認可（PostPolicy）

所有者ベースの認可を`app/Policies/PostPolicy.php`で実装。

| メソッド | ロジック |
|---|---|
| `viewAny` | 認証済みなら許可 |
| `view` | 認証済みなら許可 |
| `create` | 認証済みなら許可 |
| `update` | `$user->id === $post->user_id` |
| `delete` | `$user->id === $post->user_id` |

`Admin\PostController`は`HasMiddleware`インターフェースを実装し、静的な`middleware()`メソッドで
`can:` ミドルウェアをアクションごとに`only`指定して割り当てる（Laravel 11以降はコントローラーに
`$this->middleware()`インスタンスメソッドが無くなったため、`authorizeResource()`は使えない）。

```php
public static function middleware(): array
{
    return [
        new Middleware('can:viewAny,'.Post::class, only: ['index']),
        new Middleware('can:view,post', only: ['show']),
        new Middleware('can:create,'.Post::class, only: ['store']),
        new Middleware('can:update,post', only: ['update']),
        new Middleware('can:delete,post', only: ['destroy']),
    ];
}
```

`store()`時は`$post->user_id`にログインユーザーIDを自動セット。

実運用は単一管理者のみだが、Pestテストでは2ユーザーをfactoryで用意し、
**他人の投稿を更新/削除しようとすると403になる**ことを検証する。

Tagは所有権の概念が無い共有の分類語彙のため、Policyは作らず`auth:sanctum`ミドルウェアのみで認可する
（無理にPolicyを被せない）。

## 5. バリデーション（`app/Http/Requests/Admin/`）

- **`StorePostRequest`**: `title`(required, max:30) / `slug`(required, max:30, `alpha_dash`,
  `Rule::unique('posts','slug')`) / `body`(required, string) / `status`(required, `Rule::enum(PostStatus::class)`) /
  `tag_ids`(nullable, array) / `tag_ids.*`(`Rule::exists('tags','id')`)
- **`UpdatePostRequest`**: 上記に`sometimes`を追加した部分更新版。`slug`一意制約は自分自身を除外。
  **`tag_ids`未送信時は既存タグを維持する**（`$request->has('tag_ids')`の場合のみsync）。
- **`StoreTagRequest`**: `name`(required, max:12, `Rule::unique('tags','name')`)
- **`UpdateTagRequest`**: 同上 + 自分自身との重複は許可

## 6. 例外ハンドリング

`ModelNotFoundException`はLaravel内部で`NotFoundHttpException`に変換されてからレンダリングされるため、
**変換後の`NotFoundHttpException`をcatch**し、`{"message": "Not Found."}`に統一（内部クラス名の漏洩防止）。
`shouldRenderJsonWhen`で`api/*`パスは常にJSONレンダリングを強制。

## 7. 画像ストレージ

- `config/filesystems.php`の`FILESYSTEM_DISK`環境変数でディスク切り替え
  - ローカル: `local`ディスク（`storage/app/public` + `storage:link`）
  - 本番: `s3`ディスク（Railway Bucket、S3互換オブジェクトストレージ）
- 記事作成・編集時にアップロードした画像はBucketに保存し、`posts.thumbnail_url`にURLのみ保持

## 8. CORS

`config/cors.php`を明示配置。Cookie認証（`credentials:'include'`）のため`supports_credentials:true`、
ワイルドカードではなく`FRONTEND_URL`環境変数由来の明示的なオリジンのみ許可
（credentials併用時はブラウザがワイルドカードオリジンを拒否するため必須）。
`paths`には`api/*`に加え`sanctum/csrf-cookie`と`up`（ヘルスチェック）も含める。

## 9. テスト

Pest（Feature test）で以下をカバー:
- 公開API（公開記事のみ一覧/詳細に出る、下書きは404）
- 管理API（未ログイン401、CRUD、バリデーションエラー、`tag_ids`未送信時の挙動）
- 認証（ログイン成功/失敗、列挙攻撃対策、ログアウト）
- **Policy（他人の投稿への更新/削除が403になること）**

## 10. デプロイ

- Railwayに個別デプロイ、Dockerfile（Nginx + PHP-FPM + Supervisor構成）
- 起動時に`php artisan migrate --force` + シード（失敗しても継続）
- `railway.toml`でヘルスチェックパス`/up`
- 環境変数: `FRONTEND_URL`, `SANCTUM_STATEFUL_DOMAINS`, `SESSION_DOMAIN`, `SESSION_COOKIE`,
  `ADMIN_EMAIL`/`ADMIN_PASSWORD`, `FILESYSTEM_DISK`, Bucket接続情報

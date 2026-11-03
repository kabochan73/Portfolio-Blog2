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
| `thumbnail_path` | string, nullable | Railway Bucket上のオブジェクトキー（URLではない。バケットは非公開のため、APIレスポンスでは`PostResource`が7日間有効な署名付きURLを`thumbnail_url`として計算して返す） |
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
| POST | `/api/login` | 不要 | `throttle:login`でレート制限（email+IPキーで毎分5回まで） |
| POST | `/api/logout` | 必要 | |
| GET | `/api/user` | 必要 | |
| GET | `/api/posts` | 不要 | 公開記事(`status=published`)のみ |
| GET | `/api/posts/{slug}` | 不要 | 公開記事のみ、下書き/不存在は404 |
| GET | `/api/tags` | 不要 | 全件、名前順 |
| `apiResource` | `/api/admin/posts[/{post}]` | 必要 | `PostPolicy`による所有者ベース認可 |
| `apiResource` | `/api/admin/tags[/{tag}]` | 必要 | Policy無し、`auth:sanctum`のみ |
| POST | `/api/admin/uploads/thumbnail` | 必要 | 画像（最大5MB）をS3にアップロードし`thumbnail_path`とプレビュー用署名付きURLを返す |

- 新規登録・パスワード変更・パスワードリセットのルートは無し
- ページネーション・検索・タグによる絞り込みAPIは無し（全件取得、フロント側でフィルタ）

## 4. 認証・認可

### 認証（AuthController）

- `login()`: インラインバリデーション、`Auth::attempt($credentials)`。**ユーザー不存在とパスワード誤りを
  区別しない**（列挙攻撃対策、失敗時は`email`フィールドに統一エラー）。成功時は`session()->regenerate()`
  （セッション固定化対策）。
- `logout()`: `Auth::guard('web')->logout()` → `session()->invalidate()` → `session()->regenerateToken()`。
- **ブルートフォース対策**: `AppServiceProvider`に`login`という名前のRateLimiterを登録し、
  `email+IP`をキーに毎分5回まで制限（`routes/api.php`で`/api/login`に`throttle:login`を適用）。
  IPベースのため、Railway環境では`bootstrap/app.php`で`trustProxies(at: '*')`を設定しないと
  `Request::ip()`がRailwayの内部プロキシのIPを返してしまい、実質的に無効化される点に注意。

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

- `Admin\UploadController`は`FILESYSTEM_DISK`に関わらず常に`Storage::disk('s3')`を明示指定
  （`league/flysystem-aws-s3-v3`）。ローカル・本番とも同じRailway Bucket（S3互換オブジェクトストレージ）を使う。
- **Railway Bucketsは非公開**（公開バケット機能自体が無い）。保存時は`thumbnails/{uuid}.{ext}`という
  オブジェクトキーのみを`posts.thumbnail_path`に保存し、APIレスポンス時に`PostResource`が
  `Storage::disk('s3')->temporaryUrl($path, now()->addDays(7))`で7日間有効な署名付きURLを都度生成して返す
  （2時間のISRキャッシュ窓より十分長い）。
- アップロード自体が失敗した場合（`storeAs()`が`false`を返す。`'throw' => false`設定のため例外化されない）は
  502を返す（`temporaryUrl()`に空パスを渡すと分かりにくいAWS SDKのバリデーションエラーになるため、
  事前にチェックしている）。

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

- Railwayに個別デプロイ。`Dockerfile.prod`はcomposerイメージで`--no-dev`インストールする
  ビルドステージと、`php:8.4-cli`で`php artisan serve`を直接動かすだけのシンプルな構成
  （Nginx/PHP-FPM/Supervisorなどは使わない）。
  - 本番環境にリポジトリ直下の`bootstrap/cache/packages.php`（devパッケージ込みで生成済み）を
    そのまま持ち込むと`--no-dev`構成と食い違って起動時エラーになるため、ビルド時に一度削除して
    `php artisan package:discover`で作り直している。
- Railwayの**GitHub連携**（`railway service source connect`）で`main`ブランチを直接ウォッチしており、
  pushされると自動でビルド・デプロイされる（GitHub Actions経由のデプロイは行っていない。CIのみ）。
- デプロイ間の`deploy.preDeployCommand`で`sh -c "php artisan migrate --force && php artisan db:seed --force"`
  を実行。**このコマンドが失敗した場合、デプロイ自体が止まる**（Railwayの仕様。「失敗しても継続」ではない）。
  `&&`チェーンはシェル経由で呼ばないと機能しない点に注意（最初`sh -c`無しで書いていて、`migrate`だけ実行され
  `db:seed`が静かにスキップされるハマりどころがあった）。
- 環境変数: `FRONTEND_URL`, `SANCTUM_STATEFUL_DOMAINS`, `SESSION_SAME_SITE=none`, `SESSION_SECURE_COOKIE=true`,
  `SESSION_COOKIE`, `ADMIN_EMAIL`/`ADMIN_PASSWORD`, `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`/`AWS_BUCKET`/
  `AWS_ENDPOINT`/`AWS_DEFAULT_REGION`（Bucket接続情報）
- `bootstrap/app.php`で`trustProxies(at: '*')`を設定（Railwayの内部プロキシ経由でリクエストが来るため、
  これが無いと`Request::ip()`がプロキシのIPを返してしまい、ログイン試行のレート制限が無効化される）。

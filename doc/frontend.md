# フロントエンド（Next.js）設計

対象: `frontend/`（バックエンドは `../backend`、`docker-compose.yml`で連携）

## 1. 全体方針

- Next.js（App Router）+ TypeScript。
- **`app/`配下はルーティング専用**（`page.tsx`, `layout.tsx`, `route.ts`など規約ファイルのみ）。
  コンポーネントは`app/`配下に置かず、トップレベルの`components/`に分離する。
- **`.client`/`.server`のファイル命名規則は採用しない**。`"use client"`ディレクティブと通常のNext.js規約のみで
  Server/Client境界を区別する（参考プロジェクトにあった命名規則・`server-only`パッケージは今回は導入しない）。

## 2. フォルダ構成

```
frontend/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                 ホーム
│   │   └── posts/[slug]/page.tsx    記事詳細
│   ├── admin/
│   │   ├── layout.tsx               認証ガード（CSR、useAuthState購読）
│   │   ├── page.tsx                 投稿一覧（ステータスタブ）
│   │   ├── posts/new/page.tsx       新規作成
│   │   ├── posts/[id]/page.tsx      投稿詳細（閲覧のみ）
│   │   ├── posts/[id]/edit/page.tsx 編集
│   │   └── tags/page.tsx            タグ管理
│   ├── login/page.tsx               ログイン（どこからもリンクしない、URL直打ちのみ）
│   ├── api/revalidate/route.ts      ISR再検証エンドポイント
│   └── not-found.tsx
├── components/
│   ├── ui/            Button, Card, Pill, TagBadge, TextInput（公開/管理共通の基礎UI）
│   ├── posts/          PostList, PostBrowser, PostForm, MarkdownContent/Preview など
│   ├── tags/            Sidebar（公開・管理画面で共用、propsでデータだけ渡し分け）
│   └── admin/            AdminHeader（ログアウトボタン含む）, AdminPostList
├── lib/
│   ├── http.ts                     共通fetchラッパー、ApiErrorクラス、CSRF処理(ensureCsrfCookie)
│   ├── public/
│   │   └── api.ts                  getPosts, getPost, getTags（認証不要、読み取り専用、ISR）
│   └── admin/
│       ├── api.posts.ts            管理用Post CRUD
│       ├── api.tags.ts             管理用Tag CRUD
│       ├── api.uploads.ts          サムネイルアップロード
│       ├── auth.ts                 login/logout/checkAuth、認証状態(useAuthState)
│       └── revalidate.ts           /api/revalidateを叩くヘルパー
├── tests/                           ソースツリーをミラーしたJestテスト（コロケーションしない）
├── types/
└── proxy.ts                        `/admin`配下のcookie有無チェック
```

- 当初`components/ui/`は無く、各ページで直接スタイルを書いていたが、デザインが固まった段階で
  `Button`/`Card`/`Pill`/`TagBadge`/`TextInput`として共通化した。

## 3. ページ構成

**公開**
| パス | 内容 |
|---|---|
| `/` | ホーム。記事一覧＋サイドバー（プロフィール・タグ一覧・件数）。タグ絞り込みはクライアント側stateのみ、URL変化なし |
| `/posts/[slug]` | 記事詳細。本文中心の1カラムレイアウト（サイドバー・関連記事は無し） |
| `/login` | ログインフォーム。ヘッダー等どこからもリンクしない |

**管理画面（要認証、完全CSR）**
| パス | 内容 |
|---|---|
| `/admin` | 投稿一覧（ステータスタブ：全て/公開/下書き） |
| `/admin/posts/[id]` | 投稿詳細（閲覧のみ、編集ボタンで`/edit`へ） |
| `/admin/posts/[id]/edit` | 編集フォーム |
| `/admin/posts/new` | 新規作成フォーム |
| `/admin/tags` | タグ管理（作成・編集・削除） |

- Aboutページは無し
- ページネーション・検索機能は実装しない（全件取得＋クライアント側フィルタのみ）
- 下書き専用プレビューページは作らない（作成/編集フォーム自体にプレビュータブがあるため不要）

## 4. レンダリング方針

- **公開ページ**はどちらもServer Componentで、どちらも同じfetchキャッシュ設定を使う:
  ```ts
  fetch(url, { next: { revalidate: 7200, tags: [...] } })
  ```
  - `/`: タグ`["posts", "tags"]`
  - `/posts/[slug]`: タグ`["posts", "post:${slug}"]`

  **ページ単位のレンダリング方式はfetchの設定だけで決まらない**点に注意。`/`は静的ルートなので
  ビルド/初回アクセス時に静的生成されるISR（`npm run build`の出力で`○`=Static）。`/posts/[slug]`は
  `generateStaticParams`でビルド時に既存の全slugを静的生成（同出力で`●`=SSG）。`dynamicParams`は
  デフォルト`true`のため、ビルド後に作られた新しい記事（事前生成リストに無いslug）も初回アクセス時に
  レンダリング＋キャッシュされる（フォールバック動作、ビルドは壊れない）。中の`fetch`自体はどちらも
  同じく2時間キャッシュされる。
  - 管理画面での作成・更新・削除後、`/api/revalidate`を呼んで該当タグを即時`revalidateTag`（時間ベース2時間を保険として併用）
  - タグ絞り込みなどインタラクティブな部分だけを薄いClient Componentに切り出し、Server Component側で
    事前にレンダリング済みのリストをpropsとして渡す（Client Component側でデータフェッチはしない）
- **管理画面**: 完全にCSR。Client Componentがマウント後に`lib/admin/*`からfetchする。キャッシュ無し。

## 5. API通信

- fetch APIのみ（axios等は不使用）
- `lib/http.ts`: `ApiError`クラス（`status`, `message`, `errors`＝Laravelの422バリデーションエラー形式）。
  Cookie認証のため`credentials:"include"`、状態変更リクエスト前に`ensureCsrfCookie()`を呼び
  `X-XSRF-TOKEN`ヘッダーを付与。401時は認証状態をクリアする。
- `lib/public/api.ts`: 認証不要のGET専用。Laravel APIリソースの`{data:...}`ラップを剥がして返す。
  バックエンド未接続時もtry/catchで例外を投げず空配列/nullを返す。
- `lib/admin/api.posts.ts` / `api.tags.ts`: `list`/`create`/`update`/`delete`のCRUD関数群

## 6. 認証

- **`lib/admin/auth.ts`**: 認証状態を`{ status: "unknown"|"guest"|"authenticated"; user? }`で管理し、
  `useSyncExternalStore`で通知（`useAuthState()`）。httpOnly cookieはJSから読めないため、
  `checkAuth()`（`GET /api/user`への問い合わせ）を経由して非同期に確認する。
- **保護ルート（2層構成）**:
  1. `proxy.ts`: `/admin`配下へのアクセス時、セッションcookieの**有無**だけを見る楽観的チェック。
     無ければ`/login`へリダイレクト。
  2. `app/admin/layout.tsx`: `useAuthState()`を購読し、`"unknown"`なら`checkAuth()`、`"guest"`なら
     `/login`へ実際にリダイレクト。cookieはあるが期限切れ、というケースをここで捕捉する。
- ログイン成功時は`setAuthenticatedUser(user)`して`/admin`へ遷移。
- **`AdminHeader`にログアウトボタン**を設置。ログアウトは`await logout(); router.push("/")`。

### 同一オリジン化プロキシ（本番で必須だった対応）

`lib/http.ts`のCSRF対応は、`/sanctum/csrf-cookie`が発行する`XSRF-TOKEN`Cookieを`document.cookie`から
JSで読み取り、`X-XSRF-TOKEN`ヘッダーに載せて送る方式。**この`document.cookie`は同じホスト名のCookieしか
見えない。** backend/frontendは本番で別ホスト名（`*.up.railway.app`のサブドメインが異なる）のため、
素の状態ではこの読み取りが常に失敗し、ログインを含む全ての状態変更リクエストが`CSRF token mismatch`
（419）で落ちる（ローカルは`localhost`の別ポート同士なのでCookieが共有され、気づきにくい）。

対策として`next.config.ts`の`rewrites()`で`/api/:path*`・`/sanctum/:path*`をバックエンドへ透過プロキシし、
ブラウザからは常に自分自身のオリジンに見えるようにしている。これによりSanctumのセッション/XSRF-TOKEN
Cookieもフロントエンドのホスト名で発行されたことになり、`document.cookie`から正しく読める。
`NEXT_PUBLIC_API_URL`は（バックエンドの絶対URLではなく）相対パス`/api`のみで、実際のプロキシ先は
サーバー専用の`API_URL`環境変数から`next.config.ts`が解決する。

**注意点**: `rewrites()`の宛先URLは`next build`実行時に`.next/routes-manifest.json`へ固定され、
リクエストごとに再評価されるわけではない。そのため`API_URL`は（ブラウザに公開しないという理由だけでなく）
Dockerのビルド時ARGとして明示的に渡す必要がある（`frontend/Dockerfile.prod`）。これを忘れると
ビルド時のデフォルト値（`localhost:8000`）のままプロキシ先が固定され、本番で`ECONNREFUSED`になる。

## 7. UIデザイン

デザインモックアップ（スクリーンショット）を元にした仕様。

- **全体**: グレースケール基調、角丸カードデザイン。**ダークモードは実装しない**（単一のライトテーマ）。
- **レスポンシブ対応必須**: モバイル幅ではサイドバーが記事一覧の下に回り込む。PC幅（`sm:`以上）では
  サイドバーが`position: sticky`でスクロールしても上部に固定される。ヘッダーも縮小対応。
- **ヘッダー**: サイトタイトル＋サブタイトル、ナビ（Home/Articles）。Loginリンクは表示しない。
- **ホーム**: 記事カード（サムネイル画像・タイトル・タグpill・日付。技術タグバッジや説明文(excerpt)は無し）
  ＋サイドバー（プロフィールカード：アバター・名前・自己紹介／タグ一覧：件数付き、クリックでクライアント側絞り込み）。
  記事は**古い順**（`oldest()`）に表示。
- **記事詳細**: 「← 一覧に戻る」リンク、タグpill、タイトル、日付のみ（読了時間・シェア機能は無し）、
  アイキャッチ画像、Markdown本文（見出し・段落・シンタックスハイライト付きコードブロック）。
  **サイドバーは無し**（本文中心の1カラムレイアウト）。関連記事機能も無し
  （実装時にサイドバーのタグが詳細ページでは非インタラクティブになる不自然さから、シンプル化のため削除した）。
- **プロフィール情報**（名前・自己紹介・写真）はDBに持たず、フロントエンドにハードコード
  （`components/tags/Sidebar.tsx`。SNSリンクは無し）

## 8. Markdown

- 表示: `react-markdown` + `remark-gfm`
- コードブロックのシンタックスハイライト: `rehype-pretty-code` + `shiki`
- 編集: 専用エディタライブラリは使わず、**テキストエリア＋プレビュータブ切替を自作**
  （`PostForm`が編集/プレビューのタブを持ち、プレビュー時はテキストエリアの内容をそのままMarkdownレンダリングする）

## 9. フォーム

- react-hook-form + zod
- Laravelの422バリデーションエラーをreact-hook-formの`setError`にマッピング（フィールド一致するもののみ、
  一致しなければフォーム末尾の汎用エラーにフォールバック）
- **サムネイル画像アップロード**（`PostForm`）: ファイル選択時に`lib/admin/api.uploads.ts`の
  `uploadThumbnail()`で即座にS3へアップロードし、返ってきた署名付きURLでプレビュー表示。
  フォーム送信時の`thumbnail_path`はアップロードで触った場合のみペイロードに含める
  （未操作時は`undefined`のまま送らず、既存のサムネイルを上書きしないようにしている）。
  アップロードは`FormData`で送るため、`lib/http.ts`の`authFetch`は`body instanceof FormData`の場合
  `Content-Type`を強制上書きしない（ブラウザが自動設定するmultipartのboundaryを壊さないため）。

## 10. エラーハンドリング

- 削除・作成・更新は個別のエラーstate（`deleteError`など）で表示。グローバルトースト通知は無し。
- **楽観的更新はAPI成功後にのみ行う**（先にstateを変更しない。削除失敗時にstateがずれるのを防ぐ）

## 11. テスト

- Jest + Testing Library。`tests/`配下にソースツリーをミラーして配置（コロケーションはしない）。
- UIコンポーネント（`Button`, `Card`, `Pill`, `TagBadge`, `TextInput`）だけでなく、`lib/`層
  （`http.ts`, `admin/auth.ts`, `admin/revalidate.ts`, `admin/api.posts.ts`/`api.tags.ts`, `public/api.ts`）
  と`/api/revalidate`のRoute Handlerもカバー。49 tests。
- `jest.config.ts`に`moduleNameMapper`で`@/*`エイリアスを明示登録している（SWCは通常のimportを
  ビルド時に解決するが、`jest.mock("@/...")`の文字列引数はJest自身の解決系を通るため別途必要）。

## 12. デプロイ

- `next.config.ts`で`output:"standalone"` + `rewrites()`（6章参照）
- Railwayに個別デプロイ。`Dockerfile.prod`はマルチステージ（deps → builder → runner）で、
  standalone出力をコピーするだけの軽量な最終イメージ。
- Railwayの**GitHub連携**（`railway service source connect`）で`main`への push を直接ウォッチしており、
  自動でビルド・デプロイされる（GitHub Actions経由のデプロイは行っていない。CIのみ）。
- 環境変数:
  - `NEXT_PUBLIC_API_URL=/api`（相対パス。ブラウザは`rewrites()`経由でバックエンドへプロキシされる）
  - `API_URL`（Next.jsサーバー→backend。`rewrites()`の宛先解決にも使う）
  - `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SESSION_COOKIE_NAME`
  - `NEXT_PUBLIC_*`群に加えて`API_URL`も**ビルド時ARG**として`Dockerfile.prod`に渡す必要がある
    （6章の注意点を参照。`rewrites()`の宛先はビルド時に固定されるため）。

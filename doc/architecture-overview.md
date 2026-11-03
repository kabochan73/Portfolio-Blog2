# アーキテクチャ概要

## 構成

```
Blog-Portfolio2/
├── backend/    Laravel（PHP 8.4）— API専用バックエンド
├── frontend/   Next.js（App Router, TypeScript）
└── docker-compose.yml  ローカル開発用（backend + frontend + DB連携）
```

- バックエンドとフロントエンドは完全に分離した別プロセス（Laravelはビューを持たない純粋なJSON API）。
- ローカルは `docker-compose.yml` で連携。
- 本番は両方とも Railway に個別デプロイ（独自ドメインは未取得、Railwayの自動生成ドメイン`*.up.railway.app`をそのまま使用）。
- **Sanctum SPA Cookie認証のCSRF（`X-XSRF-TOKEN`）はJSが`document.cookie`からトークンを読む仕組みのため、
  本来はフロント/バックが同一ホスト名である必要がある。** backend/frontendは別ホスト名
  （`*.up.railway.app`のサブドメインが異なる）で動いており、素の状態ではJSからCookieが読めずCSRF検証が常に失敗する。
  これをNext.jsの`rewrites()`（`frontend/next.config.ts`）で`/api`・`/sanctum`をバックエンドへ透過プロキシし、
  ブラウザからは常に同一オリジンに見える構成にすることで解決している（独自ドメイン取得は不要）。

## 技術スタック

| 層 | 技術 |
|---|---|
| バックエンド | Laravel 13, PHP 8.4, Laravel Sanctum（SPA Cookie認証）, PostgreSQL, Pest（テスト）, Laravel Pint（整形） |
| フロントエンド | Next.js 16（App Router）, React 19, TypeScript, Tailwind CSS, react-hook-form + zod, react-markdown + remark-gfm, rehype-pretty-code + shiki, Jest + Testing Library |
| ストレージ | ローカル/本番とも`s3`ディスク（Railway Bucket, S3互換、非公開バケットのため署名付きURLで配信） |
| インフラ | Railway（Dockerfileビルド、GitHub連携で`main`への push を検知して自動デプロイ）, Docker/Docker Compose（ローカル）, GitHub Actions（CIのみ。デプロイはActionsからは行わない） |

## ドメインモデル

- **User**（管理者）: 認証専用。ロール概念は無し。実運用は自分（1名）のみを想定するが、
  `Post`に`user_id`（投稿者）を持たせ、コード上は複数管理者にも耐えられる所有者ベース設計にしている。
- **Post**（記事）: `title`, `slug`（unique）, `body`（Markdown）, `thumbnail_path`（S3オブジェクトキー、
  APIレスポンスでは7日間有効な署名付きURLとして`thumbnail_url`に計算して返す）, `status`（`draft`/`published`、
  PHP enum `PostStatus`でキャスト）, `user_id`（投稿者）
- **Tag**（タグ）: `name`（unique）
- Post ⇔ Tag は多対多（中間テーブル `post_tag`、カスケード削除）
- **意図的にスコープ外**: カテゴリ、コメント、いいね、ページネーション、検索、複数ロール、
  パスワード変更/リセット、新規登録、excerpt（一覧の説明文）、公開日時（`published_at`は追加せず`created_at`を使用）

## 認証・認可の方針

- Sanctum SPA Cookie認証（`Auth::attempt()` + セッション）、CSRF対策に`/sanctum/csrf-cookie` + `X-XSRF-TOKEN`
- ログイン/ログアウト/認証状態確認のみ実装（新規登録・パスワード変更・パスワードリセットは無し）
- 管理者アカウントはシーダーで作成（`ADMIN_EMAIL`/`ADMIN_PASSWORD`環境変数）
- **PostPolicy**による所有者ベース認可（詳細は[backend.md](./backend.md)）: 閲覧・作成は認証済みなら誰でも、
  更新・削除は自分の投稿のみ
- Tagには所有権の概念が無いためPolicyを作らず、`auth:sanctum`ミドルウェアのみで認可

## レンダリング方針

- **公開ページ**はどちらもServer Componentで、どちらも静的生成+ISR（`npm run build`の出力で確認可能）:
  - `/`（一覧）: 静的ルートのため最初から静的生成+ISR（`○`=Static）
  - `/posts/[slug]`（詳細）: `generateStaticParams`でビルド時に既存の全slugを静的生成+ISR（`●`=SSG）。
    `dynamicParams`はデフォルトで`true`のため、ビルド後に作られた新しい記事（事前生成リストに無いslug）も
    初回アクセス時にレンダリングされてキャッシュされる（フォールバック動作）。中の`fetch`自体はどちらも
    `next:{revalidate:7200, tags:[...]}`でキャッシュされる
  - 管理操作後は、どちらも`/api/revalidate`で該当タグを即時`revalidateTag`（時間ベース2時間を保険として併用）
- **管理画面**（`/admin/**`）: 完全にCSR（Client Component、Cookie認証状態に依存する動的データのためキャッシュ無し）

## API/画面の対応関係

| バックエンドAPI | フロントエンドの利用箇所 |
|---|---|
| `GET /api/posts`, `GET /api/posts/{slug}`, `GET /api/tags`（認証不要） | `lib/public/api.ts`（Server Componentからのフェッチ、ISRキャッシュ付き） |
| `GET /sanctum/csrf-cookie`（Sanctum標準） | `lib/http.ts`の`ensureCsrfCookie()` |
| `POST /api/login`（`throttle:login`でレート制限）, `POST /api/logout`, `GET /api/user`（`auth:sanctum`） | `lib/admin/auth.ts`, `app/login/page.tsx` |
| `/api/admin/posts`, `/api/admin/tags`（`apiResource`, `auth:sanctum` + PostPolicy） | `lib/admin/api.posts.ts`, `lib/admin/api.tags.ts` |
| `POST /api/admin/uploads/thumbnail`（`auth:sanctum`） | `lib/admin/api.uploads.ts`。サムネイル画像をS3にアップロードし、`thumbnail_path`とプレビュー用の署名付きURLを返す |
| （管理操作後）`POST /api/revalidate` | Next.js自身のRoute Handler。ISRタグの再検証 |

上記すべて、ブラウザからは`frontend/next.config.ts`の`rewrites()`経由で同一オリジンとして呼ばれる
（`/api/*`, `/sanctum/*`をバックエンドへ透過プロキシ）。

詳細は [backend.md](./backend.md) / [frontend.md](./frontend.md) を参照。

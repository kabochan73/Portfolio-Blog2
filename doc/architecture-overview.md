# アーキテクチャ概要

## 構成

```
Blog-Portfolio2/
├── backend/    Laravel（PHP 8.3+）— API専用バックエンド
├── frontend/   Next.js（App Router, TypeScript）
└── docker-compose.yml  ローカル開発用（backend + frontend + DB連携）
```

- バックエンドとフロントエンドは完全に分離した別プロセス（Laravelはビューを持たない純粋なJSON API）。
- ローカルは `docker-compose.yml` で連携。
- 本番は両方とも Railway に個別デプロイ。
- **Sanctum SPA Cookie認証を採用するため、本番は独自ドメインを取得し、フロント/バックを同一トップレベルドメインの
  異なるサブドメイン（例: `app.example.com` / `api.example.com`）で運用する**（Railwayの自動生成ドメイン
  `*.up.railway.app` はサブドメインが異なるためCookie共有が成立しない）。

## 技術スタック

| 層 | 技術 |
|---|---|
| バックエンド | Laravel（最新安定版）, PHP 8.3+, Laravel Sanctum（SPA Cookie認証）, PostgreSQL, Pest（テスト）, Laravel Pint（整形） |
| フロントエンド | Next.js（App Router）, React, TypeScript, Tailwind CSS, react-hook-form + zod, react-markdown + remark-gfm, rehype-pretty-code + shiki, Jest + Testing Library |
| ストレージ | ローカル: `local`ディスク / 本番: `s3`ディスク（Railway Bucket, S3互換） |
| インフラ | Railway（Dockerfileビルド）, Docker/Docker Compose（ローカル）, GitHub Actions（CI） |

## ドメインモデル

- **User**（管理者）: 認証専用。ロール概念は無し。実運用は自分（1名）のみを想定するが、
  `Post`に`user_id`（投稿者）を持たせ、コード上は複数管理者にも耐えられる所有者ベース設計にしている。
- **Post**（記事）: `title`, `slug`（unique）, `body`（Markdown）, `thumbnail_url`, `status`（`draft`/`published`、
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

- **公開ページ**（`/`, `/posts/[slug]`）: Server Component + オンデマンドISR
  （`cache:"force-cache"` + `next:{revalidate:7200, tags:[...]}`、管理操作後は`/api/revalidate`で即時再検証）
- **管理画面**（`/admin/**`）: 完全にCSR（Client Component、Cookie認証状態に依存する動的データのためキャッシュ無し）

## API/画面の対応関係

| バックエンドAPI | フロントエンドの利用箇所 |
|---|---|
| `GET /api/posts`, `GET /api/posts/{slug}`, `GET /api/tags`（認証不要） | `lib/public/api.ts`（Server Componentからのフェッチ、ISRキャッシュ付き） |
| `GET /sanctum/csrf-cookie`（Sanctum標準） | `lib/http.ts`の`ensureCsrfCookie()` |
| `POST /api/login`, `POST /api/logout`, `GET /api/user`（`auth:sanctum`） | `lib/admin/auth.ts`, `app/login/page.tsx` |
| `/api/admin/posts`, `/api/admin/tags`（`apiResource`, `auth:sanctum` + PostPolicy） | `lib/admin/api.posts.ts`, `lib/admin/api.tags.ts` |
| （管理操作後）`POST /api/revalidate` | Next.js自身のRoute Handler。ISRタグの再検証 |

詳細は [backend.md](./backend.md) / [frontend.md](./frontend.md) を参照。

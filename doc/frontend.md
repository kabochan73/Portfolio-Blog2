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
│   ├── posts/       PostList, PostBrowser, PostForm など
│   ├── tags/         Sidebar など
│   └── admin/         AdminHeader（ログアウトボタン含む）, AdminPostList, AdminPostBrowser など
├── lib/
│   ├── http.ts                     共通fetchラッパー、ApiErrorクラス、CSRF処理(ensureCsrfCookie)
│   ├── public/
│   │   └── api.ts                  getPosts, getPost, getTags（認証不要、読み取り専用、ISR）
│   └── admin/
│       ├── api.posts.ts            管理用Post CRUD
│       ├── api.tags.ts             管理用Tag CRUD
│       └── auth.ts                 login/logout/checkAuth、認証状態(useAuthState)
├── types/
└── proxy.ts                        `/admin`配下のcookie有無チェック
```

## 3. ページ構成

**公開**
| パス | 内容 |
|---|---|
| `/` | ホーム。記事一覧＋サイドバー（プロフィール・タグ一覧・件数）。タグ絞り込みはクライアント側stateのみ、URL変化なし |
| `/posts/[slug]` | 記事詳細。本文＋関連記事（タグ一致数でフロント側ソート、上位3件） |
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

- **公開ページ**: Server Component + オンデマンドISR。
  ```ts
  fetch(url, { next: { revalidate: 7200, tags: [...] } })
  ```
  - `/`: タグ`["posts", "tags"]`
  - `/posts/[slug]`: タグ`["posts", "post:${slug}"]`
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

## 7. UIデザイン

デザインモックアップ（スクリーンショット）を元にした仕様。

- **全体**: グレースケール基調、角丸カードデザイン。**ダークモードは実装しない**（単一のライトテーマ）。
- **レスポンシブ対応必須**: モバイル幅でサイドバーが記事一覧/詳細の下に回り込む、ヘッダーも縮小対応。
- **ヘッダー**: サイトタイトル＋サブタイトル、ナビ（Home/Articles）。Loginリンクは表示しない。
- **ホーム**: 記事カード（サムネイル画像・タイトル・タグpill・日付・矢印アイコン。技術タグバッジや説明文(excerpt)は無し）
  ＋サイドバー（プロフィールカード：アバター・名前・肩書き・自己紹介・SNSリンク／タグ一覧：件数付き、クリックでクライアント側絞り込み）
- **記事詳細**: 「← 一覧に戻る」リンク、タグpill、タイトル、日付のみ（読了時間・シェア機能は無し）、
  アイキャッチ画像、Markdown本文（見出し・段落・シンタックスハイライト付きコードブロック）、
  サイドバー（プロフィール＋タグ一覧＋関連記事3件）
- **プロフィール情報**（名前・肩書き・自己紹介・SNSリンク）はDBに持たず、フロントエンドにハードコード

## 8. Markdown

- 表示: `react-markdown` + `remark-gfm`
- コードブロックのシンタックスハイライト: `rehype-pretty-code` + `shiki`
- 編集: 専用エディタライブラリは使わず、**テキストエリア＋プレビュータブ切替を自作**
  （`PostForm`が編集/プレビューのタブを持ち、プレビュー時はテキストエリアの内容をそのままMarkdownレンダリングする）

## 9. フォーム

- react-hook-form + zod
- Laravelの422バリデーションエラーをreact-hook-formの`setError`にマッピング（フィールド一致するもののみ、
  一致しなければフォーム末尾の汎用エラーにフォールバック）

## 10. エラーハンドリング

- 削除・作成・更新は個別のエラーstate（`deleteError`など）で表示。グローバルトースト通知は無し。
- **楽観的更新はAPI成功後にのみ行う**（先にstateを変更しない。削除失敗時にstateがずれるのを防ぐ）

## 11. テスト

- Jest + Testing Library。表示系コンポーネント（`PostList`, `Sidebar`など）を中心にテスト。

## 12. デプロイ

- `next.config.ts`で`output:"standalone"`
- Railwayに個別デプロイ（マルチステージDockerfile、ビルド時に`NEXT_PUBLIC_API_URL`等をビルド引数として注入）
- 環境変数: `NEXT_PUBLIC_API_URL`（ブラウザ→backend直接）, `API_URL`（Next.jsサーバー→backend）,
  `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SESSION_COOKIE_NAME`

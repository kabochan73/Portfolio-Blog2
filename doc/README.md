# Blog-Portfolio2 設計ドキュメント

ポートフォリオとして提出するブログアプリの設計まとめ。
既存の `Blog-Portfolio`（`../Blog-Portfolio/doc/`）を参考にしつつ、要件に合わせて取捨選択・拡張した内容。

- [architecture-overview.md](./architecture-overview.md) — 全体構成・技術スタック・インフラ
- [backend.md](./backend.md) — Laravel バックエンド（DB設計・API・認証認可・ストレージ）
- [frontend.md](./frontend.md) — Next.js フロントエンド（ページ構成・フォルダ構成・レンダリング方針・UI）

## このアプリのひとことまとめ

「記事（Post）＋タグ（Tag）」のシンプルな多対多構成のブログ。単一管理者（自分専用）が
Markdownで記事を書き、公開側は認証不要の読み取り専用、管理画面はSanctum SPA Cookie認証必須の
フルCRUD、という2層構成。参考プロジェクトと異なり、Policyによる所有者ベースの認可、PHP enum、
Railway Bucketへの画像アップロードなど「実装として一段しっかりさせる」方向の拡張を行っている。

- バックエンド: Laravel + Sanctum(SPA Cookie認証) + PostgreSQL + Policy、Railway + Docker
- フロントエンド: Next.js (App Router) + TypeScript + Tailwind CSS、公開ページはSC+ISR/管理画面はCSR、Railway + Docker
- 2026-09 設計フェーズ（このドキュメントは実装開始前の設計確定内容）

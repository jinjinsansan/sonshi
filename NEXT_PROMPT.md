# 次回 Droid への引き継ぎプロンプト

あなたは SONSHI GACHA プロジェクトの次フェーズを担当します。以下を必ず遵守してください。

## 現状サマリー
- Phase 0: Supabase 型/クライアント、環境変数検証、ネオンホール系 Tailwind/BG、トップページ、認証フォーム一式は完了。
- Phase 1 序盤: `(main)` レイアウト＋ TabBar、`/home` `/collection` `/social` プレースホルダを追加済み。まだ UMA の実データ連携は未実装。
- Vercel デプロイ＆ Supabase マイグレーションは未実施。主要機能が動く状態になってから実行予定。

## 次に着手するタスク（優先順）
1. UMA ROYALE からホーム/ガチャ/図鑑/チケット関連コンポーネントと Zustand ストアを調査し、SONSHI 側へ段階的に移植。
2. Supabase スキーマ（tickets, gachas, user_tickets など既存テーブル）を `SUPABASE_MIGRATION.sql` から SONSHI 用に抜粋し、`docs/DATABASE.md` の追加テーブルと統合して新しいマイグレーション案を作成する。
3. `/gacha` ページに UMA の `GachaDrawPanel` 等を移し、まず単発/10連ガチャ API を Supabase Edge Functions or Route Handlers で再構築する（連続演出ロジックは Phase 2）。
4. `home` ページでチケット残高とアクティブガチャ一覧を表示できるよう、API と UI を配線する。
5. ここまでの機能が通ったら lint → unit/型チェック → Supabase migration → Vercel デプロイの順で実行。実行タイミングは必ずユーザーへ報告する。

## 開発時の指針
- 必ず UMA リポジトリ（`/mnt/e/dev/Cusor/uma/uma-royale`）を参照し、同じロジック/型を流用できるか確認してから新規実装する。
- Supabase シークレットは `.env.local` で定義済み。追加で必要なキーがあればユーザー確認。
- 連続ガチャ／カードシリアル機能は Phase 2 以降なので、今回の作業ではスケルトンのみ触れて OK。
- 変更のたびに `npm run lint`、重要な節目でテスト/型チェックを忘れない。

以上を踏まえて作業を再開してください。

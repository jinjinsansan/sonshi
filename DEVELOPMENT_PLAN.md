# SONSHIガチャ 開発計画書

## 1. 参照元とドキュメント
- **既存実装参照先**: `/mnt/e/dev/Cusor/uma/uma-royale`（UMA ROYALE 本体）
- **仕様ファイル**: `docs/FEATURES.md`, `docs/PAGES.md`, `docs/DATABASE.md`, `docs/MULTI_GACHA_SCENARIO.md`
- **本計画書の目的**: UMA ROYALE の機能を再実装しつつ、SONSHI専用の新機能（連続ガチャ、カードシリアル、紹介/LIME連携、管理パネル拡張等）を段階的に構築するためのロードマップを示す。
- **Droid運用メモ**: 今後 sonshigacha プロジェクトで立ち上げる Droid は常に上記 UMA ROYALE フォルダを参照し、実装・UI・APIのベースラインとすること。

## 2. フェーズ概要
| フェーズ | 目的 | 主な成果物 |
|----------|------|------------|
| Phase 0 | プロジェクト雛形 / 環境整備 | Next.js セットアップ, Tailwind/Framer/Zustand/Supabase 初期設定, `.env.local.example` 更新 |
| Phase 1 | UMA ROYALE ベース機能移植 | 認証, チケット/ガチャ(単発), コレクション, API/BFF 層, Admin β |
| Phase 2 | SONSHI 追加機能 (連続ガチャ, カードシリアル, 友達紹介, LINE特典) | 新DBテーブル・API, 新UI 4画面, multi セッション管理 |
| Phase 3 | 管理者機能拡張 & 確率/RTP/天井, KPI ダッシュボード | Admin SPA 追加ルート, 可視化, 設定UI |
| Phase 4 | 仕上げ (演出映像統合, CDN/R2, 決済/LINE webhook, E2E検証) | Media prefetch, webhook 実装, E2E/Load テスト, リリース準備 |

## 3. UMA ROYALE から移植する必須機能
1. **認証/セッション**: Supabase Auth + Server Actions + SSR ミドルウェア（`src/lib/supabase/*`）を再構築。Auth 画面はSONSHIデザインに置換。
2. **チケット管理**: `/api/tickets`, ログインボーナス, one.lat 決済 webhook, user_tickets スキーマを UMA 準拠で実装。
3. **単発ガチャフロー**: `/gacha/single` UI, `/api/gachas/[id]/pull` 相当のAPI, gacha_history 書き込み, コレクション反映。
4. **カード/コレクションUI**: Collection Grid, 詳細モーダル, Zustand + SWR のパターンを UMA から流用しつつ SONSHI スタイル適用。
5. **Admin ベース**: ダッシュボード骨格, Supabase Service Client, 簡易 CRUD を UMA の `/admin` 実装から派生。

## 4. SONSHI 新規機能の追加計画
### 4.1 連続ガチャ (2/5/10連)
- **DB**: `multi_gacha_sessions` (docs/DATABASE.md) を作成。
- **API**:
  - `POST /api/gacha/multi/start` : チケット検証→結果プリロード→`scenario_path` 生成。
  - `POST /api/gacha/multi/[sessionId]/next` : 次回結果＋対応映像メタ返却。
  - `GET /api/gacha/multi/[sessionId]` : 進捗と結果一覧取得。
- **演出制御**: `docs/MULTI_GACHA_SCENARIO.md` の `phase` `heatLevel` アルゴリズムを `lib/gacha/scenario.ts` として実装し、Cloudflare R2 動画のメタデータと紐付け。
- **UI**:
  - `/gacha/multi` : 連ガチャ種別選択 + コスト/報酬説明。
  - `/gacha/multi/[sessionId]` : 動画表示, NEXTレバー, 進捗リング, ミニカード列, 最終まとめ結果。

### 4.2 デジタルカード & シリアル
- **DB**: `cards`, `card_inventory`。`cards.max_supply` 到達時は抽選プールから除外。
- **ガチャ連携**: 単発/連続共に排出カード決定時に `card_inventory` を発行、`#serial/max_supply` をレスポンスへ含め UI に表示。
- **UI**: カード枠テーマ（N/R/SR/SSR/UR）と `card_style` に応じた演出。コレクションでフィルタ（レア度/人物/スタイル）。
- **Admin**: `/admin/cards`, `/admin/cards/[id]` で CRUD, シリアル・保有者検索, CSV エクスポート。

### 4.3 友達紹介 & LINE特典
- **Referrals**: `referrals` テーブル, invite ランディング `/invite/[code]`, `/mypage/invite` UI。登録完了時に `status -> completed`、報酬配布で `ticket_granted`。
- **LINE Follow Bonus**: `line_follows`, `/api/line/webhook` で follow イベント to ユーザー紐付け, 未付与なら free ticket 加算。

### 4.4 確率/RTP/天井
- **DB**: `gacha_probability` + 既存 UMA プール情報。
- **管理UI**: `/admin/probability` でスライダー, 天井設定, 変更履歴 (Supabase table or JSON)。
- **ロジック**: ガチャ実行時に (確率 + 在庫 + 天井 + RTP 目標) を考慮する `lib/gacha/pool.ts` を新設。

### 4.5 管理者拡張
- `/admin/users`, `/admin/referrals`, `/admin/stats` 各ページを実装。Supabase service client を活用し aggregated metrics を取得。チャートは Recharts or Tremor を採用。

## 5. 実装タスク詳細
### Phase 0
1. Next.js 14 + App Router + TypeScript + Tailwind 4 + ESLint 9 をセットアップ。
2. Base デザイン（ネオン/パチスロ調）: global CSS, color tokens, font (Orbitron + Noto Sans JP など)。
3. Supabase SDK, Resend, Line SDK, one.lat client, Zustand, Framer Motion を導入。

### Phase 1
1. Auth スタック (login/register/reset/onboarding) を UMA 参考に構築。
2. 共通 UI コンポーネント（ボタン/カード/タブ/レバー）作成。
3. `/gacha`, `/gacha/single`, `/collection`, `/mypage` (概要版) を移植。
4. API: `/api/gacha/single`, `/api/tickets`, `/api/collection`, `/api/gacha/history`。
5. Admin ベース `/admin` (メトリクス dummy), service client 配線。

### Phase 2
1. DB マイグレーション（cards, card_inventory, referrals, line_follows, gacha_probability, multi_gacha_sessions）。
2. 連続ガチャ API/UI, シナリオジェネレーター, R2 動画メタ管理。
3. カードシリアル UI + コレクション強化 + Admin/cards。
4. 紹介機能 UI/API + invite landing + ticket配布ロジック。
5. LINE webhook 受信 + user link API。

### Phase 3
1. Admin users/referrals/probability/stats 各ページ。
2. 確率設定画面と RTP/天井ロジック反映。
3. KPI 可視化（売上/ガチャ回数/ユーザー/カード消費）。

### Phase 4
1. 動画/音声の Cloudflare R2 取り込み & prefetch。
2. one.lat/LINE webhook 本番鍵での統合テスト。
3. E2E (Playwright) & パフォーマンステスト, Lighthouse。
4. リリース手順書作成, モニタリング（Logflare/Sentry）設定。

## 6. テスト & 検証
- **ユニット**: シナリオ生成, 確率/天井ロジック, カード在庫更新。
- **API**: Supabase Row Level Security を考慮した integration テスト。
- **UI**: 連続ガチャ UX, NEXT レバー, 進捗同期。
- **Webhooks**: one.lat 決済 / LINE follow を mock で再現。

## 7. 運用メモ
- UMA ROYALE 更新差分を定期的に確認し、再利用可能なライブラリ化を検討。
- Supabase マイグレーションは `supabase/migrations` で管理し、cards/refs など新テーブルを含める。
- Cloudflare R2 には `public/animations/*` と `public/cards/*` をアップロードし、`NEXT_PUBLIC_R2_PUBLIC_BASE_URL` を `.env.local.example` に追記。
- 今後新規 Droid を起動する際は、本計画書と UMA 参照パスを初回メッセージに含め、両プロジェクトの同期を維持すること。

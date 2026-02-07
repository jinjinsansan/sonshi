# ガチャ映像の注意事項・仕様書

このドキュメントは、尊師ガチャの映像演出システムの重要な仕様と注意事項をまとめたものです。

---

## 📋 目次

1. [イントロ映像（ready-go）の必須要件](#1-イントロ映像ready-goの必須要件)
2. [ガチャの基本仕様](#2-ガチャの基本仕様)
3. [高速化の必須実装](#3-高速化の必須実装パチスロ並みのテンポ)
4. [動画ファイルの要件](#4-動画ファイルの要件)
5. [今後の開発計画](#5-今後の開発計画)

---

## 1. イントロ映像（ready-go）の必須要件

### ✅ 必ず1本目にイントロ映像が必要

**理由**: iOSの音声制約を回避するため

### 技術的背景

#### iOSの厳格な制約
```
ユーザーがガチャボタンをクリック
  ↓
setTimeout(100ms) + API fetch（数百ms）
  ↓
ユーザーインタラクションが切断される
  ↓
1本目の動画: autoPlayで再生開始
  ↓
iOS: 「これはユーザー操作ではない」→ 音声ブロック ❌
```

#### 2本目以降は正常
```
ユーザーがNEXTボタンをクリック
  ↓
即座にhandleNext()実行（遅延なし）
  ↓
ユーザーインタラクションが維持される
  ↓
2本目以降の動画: 音声付きで再生可能 ✅
```

### 解決策：イントロ映像戦略

**1本目をイントロ映像として扱う**
- 長さ: 2秒程度
- 内容: 「READY!」「GO!」などのテキストアニメーション
- 音声: **なしでOK**（イントロ演出なので音声不要）
- 役割: iOSの制約を回避するための意図的な無音映像

**2本目以降が本編**
- 音声付きで完璧に動作
- パチスロ風の演出が可能
- ユーザー体験を損なわない

### 実装例（5連ガチャの場合）

```typescript
const DEV_FIVE_KEYS = [
  "２秒readygo.mp4",           // 1本目: 2秒イントロ（音声なし）← 必須！
  "尊師チャンスロゴ.mp4",      // 2本目: 本編開始（音声あり）
  "ダブル激熱.mp4",            // 3本目: 演出（音声あり）
  "灼熱チャンス.mp4",          // 4本目: 演出（音声あり）
  "激熱漢字レインボー.mp4",    // 5本目: 演出（音声あり）
  "伊東登場.mp4",              // 6本目: フィナーレ（音声あり）
];

// 期間設定
durationSeconds: isIntro ? 2 : 4  // 1本目だけ2秒
```

### ⚠️ 重要な注意点

- **イントロ映像を削除してはいけない**
  - 削除すると1本目の音声が出なくなる
  - iPhoneユーザーの体験が著しく悪化する

- **イントロ映像の長さ**
  - 2-3秒が最適
  - 長すぎるとテンポが悪い
  - 短すぎると演出として不自然

- **すべての連数ガチャに適用**
  - 5連ガチャ: 6本の動画（1本イントロ + 5本本編）
  - 10連ガチャ: 11本の動画（1本イントロ + 10本本編）

---

## 2. ガチャの基本仕様

### カード発行枚数

**重要**: 複数の動画を見ても、**カードは1枚のみ発行**

```
5連ガチャ = 6本の動画 → 1枚のカード獲得
10連ガチャ = 11本の動画 → 1枚のカード獲得
```

### 動画の役割：シナリオ演出

動画は「カードを複数もらう」ためではなく、「レア度の期待値を高める演出」のために使用します。

#### 例：5連ガチャのシナリオ

```
1本目: ２秒readygo.mp4 (イントロ)
2本目: 尊師チャンスロゴ.mp4 → 「おっ、何か来るぞ？」
3本目: ダブル激熱.mp4 → 「激熱！期待大！」
4本目: 灼熱チャンス.mp4 → 「さらに熱くなってきた！」
5本目: 激熱漢字レインボー.mp4 → 「これは...！」
6本目: 伊東登場.mp4 → 「確定演出！」

最後に: URカード1枚獲得
```

#### シナリオ設計の考え方

**通常パターン（Rカード）**
```
1. イントロ
2. 通常演出
3. 通常演出
4. 通常演出
5. 通常演出
6. 通常結果
→ Rカード獲得
```

**激アツパターン（SRカード）**
```
1. イントロ
2. チャンスロゴ
3. 激アツ演出
4. 灼熱演出
5. さらに熱い演出
6. 期待の結果
→ SRカード獲得
```

**確定パターン（URカード）**
```
1. イントロ
2. チャンスロゴ
3. ダブル激熱
4. 灼熱チャンス
5. レインボー演出
6. キャラ登場（確定演出）
→ URカード確定獲得
```

### シナリオとカードの紐付け

**最終的な完成版の仕様**:

```typescript
// シナリオテンプレート
const SCENARIO_TEMPLATES = {
  // 5連用
  five_normal_R: ["intro", "normal1", "normal2", "normal3", "normal4", "result_normal"],
  five_hot_SR: ["intro", "chance", "hot", "super_hot", "rainbow", "result_sr"],
  five_jackpot_UR: ["intro", "chance", "double_hot", "ultra_hot", "rainbow", "character_appear"],
  
  // 10連用
  ten_normal_R: ["intro", "normal1", ..., "result_normal"],  // 11本
  ten_hot_SR: ["intro", "chance", ..., "result_sr"],          // 11本
  ten_jackpot_UR: ["intro", "chance", ..., "character_appear"], // 11本
};

// カードとシナリオの紐付け
const GACHA_CONFIG = {
  "5連ガチャA": {
    scenario: "five_normal_R",
    card: "尊師カードA",
    rarity: "R"
  },
  "5連ガチャB": {
    scenario: "five_jackpot_UR",
    card: "尊師カードB（UR）",
    rarity: "UR"
  },
  "10連ガチャC": {
    scenario: "ten_hot_SR",
    card: "伊東カード",
    rarity: "SR"
  }
};
```

### 今後の開発内容

#### 1. 4秒映像の追加開発

現在の開発用映像（6本）に加えて、様々なパターンの4秒映像を作成：

```
通常演出系:
- 通常演出1.mp4
- 通常演出2.mp4
- 通常演出3.mp4

チャンス演出系:
- 尊師チャンスロゴ.mp4 ✅ 完成
- チャンス演出2.mp4
- チャンス演出3.mp4

激アツ演出系:
- ダブル激熱.mp4 ✅ 完成
- トリプル激熱.mp4
- 超激アツ.mp4

超激アツ演出系:
- 灼熱チャンス.mp4 ✅ 完成
- 激熱漢字レインボー.mp4 ✅ 完成
- プレミアム演出1.mp4

確定演出系:
- 伊東登場.mp4 ✅ 完成
- 神田登場.mp4
- 尊師登場.mp4
```

#### 2. 複数カードの作成

```
Rカード:
- 尊師カード（通常）
- 弟子カード（通常）
- 信者カード（通常）

SRカード:
- 尊師カード（レア）
- 伊東カード（レア）
- 神田カード（レア）

URカード:
- 尊師カード（ウルトラレア）
- 伊東カード（ウルトラレア）
- 神田カード（ウルトラレア）
```

#### 3. シナリオパターンの拡張

```
5連ガチャ:
- パターンA: 通常→Rカード
- パターンB: 激アツ→SRカード
- パターンC: 確定演出→URカード

10連ガチャ:
- パターンD: 長い通常演出→Rカード
- パターンE: 段階的に熱くなる→SRカード
- パターンF: 最初から激アツ→URカード確定
```

---

## 3. 高速化の必須実装（パチスロ並みのテンポ）

### ⚠️ 今後も必ず適用すること

**この実装は今後のすべてのガチャで必須**です。

### 問題：API呼び出しによる遅延

#### 以前の実装（遅い - 150-500ms遅延）

```typescript
// ❌ 毎回APIを呼び出して待つ
const handleNext = async () => {
  const response = await fetch('/api/gacha/multi/next');  // 100-300ms待機
  const data = await response.json();
  video.src = data.scenario.videoUrl;  // 50-200ms待機
  // 合計: 150-500ms遅延
};
```

**問題点**:
- NEXTボタンを押してから動画が始まるまで0.15-0.5秒待つ
- パチスロのようなテンポの良さが出ない
- ユーザー体験が悪い

### 解決策：全動画URL事前取得

#### 現在の実装（速い - 0-50ms遅延）

```typescript
// ✅ セッション開始時に全動画URLを取得
const session = {
  scenario: [
    { videoUrl: "/dev-videos/２秒readygo.mp4", durationSeconds: 2 },
    { videoUrl: "/dev-videos/尊師チャンスロゴ.mp4", durationSeconds: 4 },
    { videoUrl: "/dev-videos/ダブル激熱.mp4", durationSeconds: 4 },
    // ... 全6本分
  ]
};

// ✅ NEXTボタン押下時は即座に再生
const handleNext = async () => {
  const nextVideo = session.scenario[currentPull];  // 0ms（メモリから即座）
  video.src = nextVideo.videoUrl;  // 0-50ms（prefetch済みなら即座）
  
  // API呼び出しは並行実行（待たない）
  fetch('/api/gacha/multi/next');  // バックグラウンドで実行
};
```

### 技術的な仕組み

#### 1. セッション開始時（1回だけ）

```typescript
// POST /api/gacha/multi/start
{
  sessionId: "abc123",
  totalPulls: 5,
  scenario: [
    // 全動画の情報をまとめて返す
    { index: 1, videoUrl: "...", durationSeconds: 2 },
    { index: 2, videoUrl: "...", durationSeconds: 4 },
    { index: 3, videoUrl: "...", durationSeconds: 4 },
    { index: 4, videoUrl: "...", durationSeconds: 4 },
    { index: 5, videoUrl: "...", durationSeconds: 4 },
    { index: 6, videoUrl: "...", durationSeconds: 4 }
  ],
  results: [
    // 全カード情報もまとめて返す
    { cardId: "...", name: "...", rarity: "UR" }
  ]
}
```

#### 2. Prefetch（先読み）

```typescript
// 次の2-3本の動画を事前にダウンロード
useEffect(() => {
  session.scenario.slice(currentIndex, currentIndex + 3).forEach((step) => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "video";
    link.href = step.videoUrl;
    document.head.appendChild(link);
  });
}, [currentIndex]);
```

#### 3. 即座の動画切り替え

```typescript
const handleNext = async () => {
  // ★ メモリから即座に取得
  const nextIndex = session.currentPull;
  const nextScenario = session.scenario[nextIndex];
  
  // ★ 即座に動画開始
  if (videoRef.current && nextScenario.videoUrl) {
    videoRef.current.src = nextScenario.videoUrl;  // 0-50ms
    setActiveStep(nextScenario);
  }
  
  // ★ API呼び出しは並行実行（待たない）
  fetch('/api/gacha/multi/next');  // バックグラウンドで実行
};
```

### パフォーマンス比較

| 項目 | 以前 | 現在 | 改善 |
|------|------|------|------|
| API待機時間 | 100-300ms | 0ms（並行実行） | ✅ 100-300ms削減 |
| 動画読み込み | 50-200ms | 0-50ms（prefetch） | ✅ 最大200ms削減 |
| **合計遅延** | **150-500ms** | **0-50ms** | **✅ 最大450ms削減** |
| 体感 | 「遅い」 | 「即座」 | **✅ パチスロ並み** |

### 実装上の注意点

#### ✅ 必ず実装すること

1. **セッション開始時に全シナリオを返す**
   ```typescript
   // API: /api/gacha/multi/start
   return {
     scenario: buildScenario(rarities),  // 全動画情報
     results: allResults  // 全カード情報
   };
   ```

2. **フロントエンドでsession.scenarioを保持**
   ```typescript
   const [session, setSession] = useState<SessionResponse | null>(null);
   // session.scenario に全動画情報が入っている
   ```

3. **handleNextでsession.scenarioから取得**
   ```typescript
   const nextVideo = session.scenario[currentPull];
   video.src = nextVideo.videoUrl;
   ```

4. **Prefetchを実装**
   ```typescript
   // 次の2-3本を事前ダウンロード
   ```

#### ❌ やってはいけないこと

1. **毎回APIを呼んで動画URLを取得**
   ```typescript
   // ❌ 遅い！
   const response = await fetch('/api/next');
   const data = await response.json();
   video.src = data.videoUrl;
   ```

2. **API呼び出しを待ってから動画開始**
   ```typescript
   // ❌ 遅い！
   await fetch('/api/next');  // ← ここで待つな
   video.src = nextUrl;
   ```

3. **Prefetchを削除**
   ```typescript
   // ❌ 遅くなる！
   // Prefetchは必須
   ```

---

## 4. 動画ファイルの要件

### ファイルサイズ

| 動画 | 推奨サイズ | 最大サイズ | 理由 |
|------|-----------|-----------|------|
| イントロ（2秒） | 500KB-1MB | 2MB | 軽量でOK |
| 通常演出（4秒） | 5-8MB | 10MB | バランス重視 |
| 激アツ演出（4秒） | 5-10MB | 12MB | 高品質可 |
| 確定演出（4秒） | 5-10MB | 12MB | 高品質可 |

### ⚠️ 重要な制限

**14MBを超える動画は使用不可**
- 神田清人登場.mp4（14MB）でiPhone表示不具合が発生
- 圧縮しても表示されない場合がある
- 保険として軽量版を用意すること

### エンコード設定（推奨）

```bash
# ffmpegでの最適化例
ffmpeg -i input.mp4 \
  -vcodec h264 \
  -crf 23 \
  -preset medium \
  -vf scale=720:-1 \
  -r 30 \
  -acodec aac \
  -b:a 128k \
  output.mp4

# パラメータ説明:
# -crf 23: 品質（18-28推奨、小さいほど高品質）
# -preset medium: エンコード速度（slow=高品質、fast=低品質）
# -vf scale=720:-1: 解像度（720pまたは1080p推奨）
# -r 30: フレームレート（30fps推奨）
# -acodec aac: 音声コーデック
# -b:a 128k: 音声ビットレート
```

### ファイル名規則

```
✅ 良い例:
- ２秒readygo.mp4
- 尊師チャンスロゴ.mp4
- ダブル激熱.mp4

❌ 避けるべき:
- video1.mp4（内容が分からない）
- test_final_v3.mp4（管理しにくい）
- 神田清人登場 (1).mp4（スペース・括弧は避ける）
```

### 配置場所

```
public/
  dev-videos/          # 開発用動画
    ２秒readygo.mp4
    尊師チャンスロゴ.mp4
    ダブル激熱.mp4
    ...
  
  videos/              # 本番用動画（将来）
    intro/
    normal/
    hot/
    super_hot/
    jackpot/
```

---

## 5. 今後の開発計画

### Phase 1: 開発用5連ガチャ（完了）

✅ イントロ映像実装
✅ 6本の動画シナリオ実装
✅ 高速化実装
✅ iPhone対応

### Phase 2: シナリオパターン拡張（次のステップ）

**目標**: 3つのレア度に対応したシナリオ

```
1. 通常シナリオ（Rカード）
   - 地味な演出
   - 期待値低め
   - 6本の通常動画

2. 激アツシナリオ（SRカード）
   - 段階的に熱くなる演出
   - 期待値高め
   - 6本の激アツ動画

3. 確定シナリオ（URカード）
   - 最初から激アツ
   - レインボー演出
   - キャラ登場で確定
   - 6本のプレミアム動画
```

**必要な動画数**:
- 通常: 5本（イントロ除く）× 3パターン = 15本
- 激アツ: 5本 × 3パターン = 15本
- 確定: 5本 × 3パターン = 15本
- **合計**: 約45本の4秒動画

### Phase 3: 10連ガチャ実装

**仕様**:
- 11本の動画（1本イントロ + 10本本編）
- より長い演出でドキドキ感を演出
- 最終的に1枚のカード獲得

**シナリオ例**:
```
1. イントロ（2秒）
2-4. 通常演出（12秒）
5-7. チャンス演出（12秒）
8-10. 激アツ演出（12秒）
11. 確定演出（4秒）
→ URカード獲得
```

### Phase 4: 複数カード・複数ガチャ種類

**ガチャ種類の例**:

```
尊師ガチャA（5連）:
- シナリオ: 通常パターン
- カード: 尊師Rカード
- 価格: チケット5枚

尊師ガチャB（5連）:
- シナリオ: 激アツパターン
- カード: 尊師SRカード
- 価格: チケット10枚

伊東ガチャ（10連）:
- シナリオ: 確定パターン
- カード: 伊東URカード
- 価格: チケット50枚

神田ガチャ（10連）:
- シナリオ: プレミアムパターン
- カード: 神田URカード
- 価格: チケット100枚
```

### Phase 5: 本番環境最適化

**CDN配信最適化**:
- Cloudflare R2での動画配信
- エッジキャッシュの活用
- 地域別の最適化

**パフォーマンス監視**:
- 動画読み込み時間の計測
- ユーザー体験の分析
- A/Bテストの実施

---

## 📚 参考資料

### 関連ファイル

```
src/
  lib/gacha/
    scenario.ts          # シナリオビルダー
    pool.ts              # カードプール管理
  
  components/gacha/
    multi-gacha-session.tsx  # メインコンポーネント
  
  app/api/gacha/
    multi/
      start/route.ts     # セッション開始API
      [sessionId]/
        route.ts         # セッション取得API
        next/route.ts    # 次の動画取得API

public/
  dev-videos/            # 開発用動画
```

### 重要な技術ドキュメント

- [iOS Safari音声制約](https://developer.apple.com/documentation/webkit/wkwebview)
- [HTML5 Video API](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement)
- [Prefetch/Preload](https://web.dev/preload-responsive-images/)

---

## ✅ チェックリスト

新しいガチャを実装する際は、以下を確認してください：

### 必須項目

- [ ] 1本目にイントロ映像（2秒、音声なし）を配置
- [ ] 全動画URLをセッション開始時に取得
- [ ] Prefetchを実装
- [ ] handleNextでsession.scenarioから即座に取得
- [ ] 動画ファイルサイズが12MB以下
- [ ] iPhone実機でテスト済み

### 推奨項目

- [ ] 3つのレア度に対応したシナリオパターン
- [ ] 動画のエンコード最適化
- [ ] 保険用の軽量動画を用意
- [ ] 複数回連続実行でのテスト

---

**最終更新**: 2026-02-07
**作成者**: Droid
**バージョン**: 1.0.0

# 連続ガチャ 演出シナリオ設計

## コンセプト

連続ガチャ（2連・5連・10連）は、パチスロの連続演出のように
ユーザーが1回ごとにボタンを押して、演出が段階的に盛り上がっていく仕組み。

参考: DMMパチタウン「ハラキリチャンス」
https://p-town.dmm.com/specials/2840

## 重要な原則

1. 自動再生ではない。ユーザーが毎回「NEXT」ボタンを押す
2. 前の結果が次の演出に影響する（シナリオ分岐）
3. 後半になるほど演出が長く、派手になる
4. 最後の1回が最もドラマチック

## 映像カテゴリ

連続ガチャ用に以下のカテゴリの映像を用意する。

### イントロ系（1〜3回目用）3〜5秒
- intro_normal_01〜05.mp4 - 通常の導入（結果がN, R）
- intro_hot_01〜03.mp4 - 熱い導入（結果がSR以上）

### ミッド系（4〜6回目用）5〜8秒
- mid_normal_01〜05.mp4 - 通常の中盤
- mid_hot_01〜03.mp4 - 熱い中盤
- mid_super_01〜02.mp4 - 超熱い中盤（SSR以上）

### ビルドアップ系（7〜9回目用）8〜12秒
- buildup_normal_01〜03.mp4 - 通常のビルドアップ
- buildup_hot_01〜03.mp4 - 熱いビルドアップ
- buildup_super_01〜02.mp4 - 超熱いビルドアップ

### フィナーレ系（最終回用）15〜20秒
- finale_normal_01〜03.mp4 - 通常の最終回（N, R）
- finale_hot_01〜03.mp4 - 熱い最終回（SR）
- finale_super_01〜02.mp4 - 超熱い最終回（SSR）
- finale_jackpot_01.mp4 - 大当たり最終回（UR）

## シナリオ分岐ロジック

### 映像選択アルゴリズム

```typescript
function selectVideo(
  pullNumber: number,
  totalPulls: number,
  currentResult: Rarity,
  previousResults: Rarity[]
): VideoSelection {

  // フェーズ判定
  const phase = getPhase(pullNumber, totalPulls);

  // 熱さレベル判定
  const heatLevel = getHeatLevel(currentResult, previousResults);

  // 映像選択
  return pickVideo(phase, heatLevel);
}

function getPhase(pull: number, total: number): Phase {
  if (pull === total) return 'finale';
  const ratio = pull / total;
  if (ratio <= 0.3) return 'intro';
  if (ratio <= 0.6) return 'mid';
  return 'buildup';
}

function getHeatLevel(
  current: Rarity,
  previous: Rarity[]
): 'normal' | 'hot' | 'super' {
  // UR → super
  if (current === 'UR') return 'super';
  // SSR → super
  if (current === 'SSR') return 'super';
  // SR → hot
  if (current === 'SR') return 'hot';
  // 連続でR以上 → hot
  const recentRares = previous.slice(-2).filter(r => r !== 'N').length;
  if (recentRares >= 2 && current === 'R') return 'hot';
  // それ以外 → normal
  return 'normal';
}
```

### 10連ガチャのシナリオ例

#### パターンA: 最後にUR（ドラマチック）

| 回 | 結果 | フェーズ | 熱さ | 映像 | 秒数 |
|----|------|---------|------|------|------|
| 1 | N | intro | normal | intro_normal_01 | 3秒 |
| 2 | N | intro | normal | intro_normal_02 | 3秒 |
| 3 | R | intro | normal | intro_normal_03 | 5秒 |
| 4 | N | mid | normal | mid_normal_01 | 5秒 |
| 5 | SR | mid | hot | mid_hot_01 | 8秒 |
| 6 | N | mid | normal | mid_normal_02 | 5秒 |
| 7 | R | buildup | normal | buildup_normal_01 | 8秒 |
| 8 | R | buildup | hot | buildup_hot_01 | 10秒 |
| 9 | SSR | buildup | super | buildup_super_01 | 12秒 |
| 10 | UR | finale | jackpot | finale_jackpot_01 | 20秒 |

#### パターンB: 全部N（ハズレ）

| 回 | 結果 | フェーズ | 熱さ | 映像 | 秒数 |
|----|------|---------|------|------|------|
| 1 | N | intro | normal | intro_normal_01 | 3秒 |
| 2 | N | intro | normal | intro_normal_03 | 3秒 |
| 3 | N | intro | normal | intro_normal_05 | 3秒 |
| 4 | N | mid | normal | mid_normal_01 | 5秒 |
| 5 | N | mid | normal | mid_normal_03 | 5秒 |
| 6 | N | mid | normal | mid_normal_05 | 5秒 |
| 7 | N | buildup | normal | buildup_normal_01 | 8秒 |
| 8 | N | buildup | normal | buildup_normal_02 | 8秒 |
| 9 | N | buildup | normal | buildup_normal_03 | 8秒 |
| 10 | N | finale | normal | finale_normal_01 | 15秒 |

## NEXTボタンのUI仕様

### デザイン
- パチスロのSTARTレバーを模したデザイン
- 大きく、押したくなる形状
- ネオンカラーのグロー効果
- 押すとレバーが下がるアニメーション

### 状態管理
- 映像再生中: ボタン非表示 or 無効化
- 映像終了後: ボタンが「ガシャン！」と出現
- 押した瞬間: レバーが下がるアニメーション → 次の映像再生
- 最終回終了後: 「結果を見る」ボタンに変化

### 進捗表示
- 画面上部に「3/10」のようなドット表示
- 完了した回はネオンカラーで点灯
- 現在の回は点滅
- 未完了はグレー

### 結果ミニカード表示
- 画面の左端or下端に、これまでの結果カードが小さく並ぶ
- レア度に応じた枠色
- 新しい結果が出るたびにスライドインアニメーション

## まとめ結果画面（全回終了後）

### 表示内容
- 全カードの一覧（大きめのカード表示）
- 今回のベストカード（最もレアなカード）を中央に大きく
- レア度ごとの集計
- 「シェア」ボタン（X, LINE）
- 「もう一度回す」ボタン
- 「コレクションを見る」ボタン

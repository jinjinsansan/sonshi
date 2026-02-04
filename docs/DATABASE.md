# SONSHIガチャ データベース設計

## UMA ROYALEから継承するテーブル

以下はUMA ROYALE（../umagacha）の既存テーブルを参考に作成する。

- users（Supabase Auth連携）
- tickets（チケット管理）
- gacha_results（ガチャ結果履歴）
- payments（決済履歴）

## 新規テーブル

### cards（デジタルカードマスター）

```sql
CREATE TABLE cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  rarity TEXT NOT NULL CHECK (rarity IN ('N', 'R', 'SR', 'SSR', 'UR')),
  max_supply INTEGER NOT NULL,
  current_supply INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  person_name TEXT,
  card_style TEXT CHECK (card_style IN ('realphoto', '3d', 'illustration', 'pixel')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

| カラム | 型 | 説明 |
|--------|------|------|
| id | UUID | 主キー |
| name | TEXT | カード名（例：「尊師 ゴールドVer.」） |
| description | TEXT | カード説明 |
| image_url | TEXT | カード画像URL（Cloudflare R2） |
| rarity | TEXT | レア度（N, R, SR, SSR, UR） |
| max_supply | INTEGER | 最大発行枚数 |
| current_supply | INTEGER | 現在の発行枚数 |
| is_active | BOOLEAN | 有効/無効 |
| person_name | TEXT | モチーフの人物名 |
| card_style | TEXT | スタイル（realphoto, 3d, illustration, pixel） |

### card_inventory（発行済みカード管理）

```sql
CREATE TABLE card_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID REFERENCES cards(id),
  serial_number INTEGER NOT NULL,
  owner_id UUID REFERENCES auth.users(id),
  obtained_at TIMESTAMPTZ DEFAULT NOW(),
  obtained_via TEXT NOT NULL CHECK (obtained_via IN ('single_gacha', 'multi_gacha', 'trade', 'admin_grant')),
  gacha_result_id UUID,
  UNIQUE(card_id, serial_number)
);
```

| カラム | 型 | 説明 |
|--------|------|------|
| id | UUID | 主キー |
| card_id | UUID | カードマスターID |
| serial_number | INTEGER | シリアル番号（1, 2, 3...） |
| owner_id | UUID | 保有者のユーザーID |
| obtained_at | TIMESTAMPTZ | 取得日時 |
| obtained_via | TEXT | 取得方法 |
| gacha_result_id | UUID | どのガチャ結果から得たか |

### referrals（友達紹介）

```sql
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES auth.users(id),
  referred_id UUID REFERENCES auth.users(id),
  referral_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rewarded')),
  ticket_granted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

| カラム | 型 | 説明 |
|--------|------|------|
| referrer_id | UUID | 紹介した人 |
| referred_id | UUID | 紹介された人 |
| referral_code | TEXT | 紹介コード（一意） |
| status | TEXT | pending→completed→rewarded |
| ticket_granted | BOOLEAN | チケット付与済みか |

### line_follows（LINE公式追加）

```sql
CREATE TABLE line_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  line_user_id TEXT,
  ticket_granted BOOLEAN DEFAULT false,
  followed_at TIMESTAMPTZ DEFAULT NOW()
);
```

| カラム | 型 | 説明 |
|--------|------|------|
| user_id | UUID | サイトのユーザーID |
| line_user_id | TEXT | LINEユーザーID |
| ticket_granted | BOOLEAN | チケット付与済みか |

### gacha_probability（確率設定）

```sql
CREATE TABLE gacha_probability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rarity TEXT NOT NULL CHECK (rarity IN ('N', 'R', 'SR', 'SSR', 'UR')),
  probability DECIMAL NOT NULL,
  rtp_weight DECIMAL,
  pity_threshold INTEGER,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

| カラム | 型 | 説明 |
|--------|------|------|
| rarity | TEXT | レア度 |
| probability | DECIMAL | 排出確率（0.50 = 50%） |
| rtp_weight | DECIMAL | RTP用の重み |
| pity_threshold | INTEGER | 天井回数（N回でSR以上確定） |

### デフォルト確率設定

```sql
INSERT INTO gacha_probability (rarity, probability) VALUES
  ('N', 0.50),
  ('R', 0.30),
  ('SR', 0.15),
  ('SSR', 0.04),
  ('UR', 0.01);
```

### multi_gacha_sessions（連続ガチャセッション）

```sql
CREATE TABLE multi_gacha_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  session_type TEXT NOT NULL CHECK (session_type IN ('double', 'five', 'ten')),
  total_pulls INTEGER NOT NULL,
  current_pull INTEGER DEFAULT 0,
  scenario_path JSONB DEFAULT '[]',
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'cancelled')),
  results JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

| カラム | 型 | 説明 |
|--------|------|------|
| session_type | TEXT | double(2連), five(5連), ten(10連) |
| total_pulls | INTEGER | 合計回数 |
| current_pull | INTEGER | 現在何回目 |
| scenario_path | JSONB | シナリオ分岐の記録 |
| results | JSONB | 各回の結果 |

#### scenario_path の構造例

```json
[
  {"pull": 1, "rarity": "N", "video": "intro_normal_01.mp4", "duration": 3},
  {"pull": 2, "rarity": "R", "video": "intro_hot_01.mp4", "duration": 5},
  {"pull": 3, "rarity": "N", "video": "mid_normal_01.mp4", "duration": 5},
  {"pull": 4, "rarity": "SR", "video": "mid_hot_01.mp4", "duration": 8},
  {"pull": 5, "rarity": "N", "video": "mid_normal_02.mp4", "duration": 5},
  {"pull": 6, "rarity": "R", "video": "buildup_01.mp4", "duration": 8},
  {"pull": 7, "rarity": "SSR", "video": "buildup_hot_01.mp4", "duration": 10},
  {"pull": 8, "rarity": "N", "video": "climax_normal_01.mp4", "duration": 10},
  {"pull": 9, "rarity": "R", "video": "climax_02.mp4", "duration": 12},
  {"pull": 10, "rarity": "UR", "video": "finale_jackpot_01.mp4", "duration": 20}
]
```

## インデックス

```sql
CREATE INDEX idx_card_inventory_owner ON card_inventory(owner_id);
CREATE INDEX idx_card_inventory_card ON card_inventory(card_id);
CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_referrals_code ON referrals(referral_code);
CREATE INDEX idx_multi_gacha_user ON multi_gacha_sessions(user_id);
CREATE INDEX idx_cards_rarity ON cards(rarity);
CREATE INDEX idx_cards_active ON cards(is_active);
```

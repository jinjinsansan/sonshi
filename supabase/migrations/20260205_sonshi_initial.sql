-- ============================================
-- SONSHI GACHA Supabase Migration SQL
-- ============================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ticket_types
-- ============================================

CREATE TABLE IF NOT EXISTS ticket_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  color VARCHAR(20),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO ticket_types (name, code, color, sort_order)
VALUES
  ('フリーチケット', 'free', 'green', 1),
  ('ベーシックチケット', 'basic', 'yellow', 2),
  ('エピックチケット', 'epic', 'orange', 3),
  ('プレミアムチケット', 'premium', 'red', 4),
  ('EXチケット', 'ex', 'purple', 5)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- gachas
-- ============================================

CREATE TABLE IF NOT EXISTS gachas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  ticket_type_id UUID REFERENCES ticket_types(id) NOT NULL,
  color VARCHAR(20),
  min_rarity INT NOT NULL CHECK (min_rarity >= 1 AND min_rarity <= 5),
  max_rarity INT NOT NULL CHECK (max_rarity >= 1 AND max_rarity <= 5),
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
DECLARE
  free_id UUID;
  basic_id UUID;
  epic_id UUID;
  premium_id UUID;
  ex_id UUID;
BEGIN
  SELECT id INTO free_id FROM ticket_types WHERE code = 'free';
  SELECT id INTO basic_id FROM ticket_types WHERE code = 'basic';
  SELECT id INTO epic_id FROM ticket_types WHERE code = 'epic';
  SELECT id INTO premium_id FROM ticket_types WHERE code = 'premium';
  SELECT id INTO ex_id FROM ticket_types WHERE code = 'ex';

  INSERT INTO gachas (name, ticket_type_id, color, min_rarity, max_rarity, sort_order, is_active)
  VALUES
    ('フリー', free_id, 'green', 1, 3, 1, true),
    ('ベーシック', basic_id, 'yellow', 1, 4, 2, true),
    ('エピック', epic_id, 'orange', 2, 4, 3, true),
    ('プレミアム', premium_id, 'red', 3, 5, 4, true),
    ('EX', ex_id, 'purple', 4, 5, 5, true)
  ON CONFLICT DO NOTHING;
END $$;

-- ============================================
-- user_tickets
-- ============================================

CREATE TABLE IF NOT EXISTS user_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ticket_type_id UUID REFERENCES ticket_types(id) NOT NULL,
  quantity INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- cards
-- ============================================

CREATE TABLE IF NOT EXISTS cards (
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

-- ============================================
-- card_inventory
-- ============================================

CREATE TABLE IF NOT EXISTS card_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID REFERENCES cards(id) NOT NULL,
  serial_number INTEGER NOT NULL CHECK (serial_number > 0),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  obtained_at TIMESTAMPTZ DEFAULT NOW(),
  obtained_via TEXT NOT NULL CHECK (obtained_via IN ('single_gacha', 'multi_gacha', 'trade', 'admin_grant')),
  gacha_result_id UUID,
  UNIQUE(card_id, serial_number)
);

-- ============================================
-- referrals
-- ============================================

CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referred_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referral_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rewarded')),
  ticket_granted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================
-- line_follows
-- ============================================

CREATE TABLE IF NOT EXISTS line_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  line_user_id TEXT,
  ticket_granted BOOLEAN DEFAULT false,
  followed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- gacha_probability
-- ============================================

CREATE TABLE IF NOT EXISTS gacha_probability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rarity TEXT NOT NULL CHECK (rarity IN ('N', 'R', 'SR', 'SSR', 'UR')),
  probability DECIMAL NOT NULL,
  rtp_weight DECIMAL,
  pity_threshold INTEGER,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO gacha_probability (rarity, probability)
VALUES
  ('N', 0.50),
  ('R', 0.30),
  ('SR', 0.15),
  ('SSR', 0.04),
  ('UR', 0.01)
ON CONFLICT DO NOTHING;

-- ============================================
-- multi_gacha_sessions
-- ============================================

CREATE TABLE IF NOT EXISTS multi_gacha_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('double', 'five', 'ten')),
  total_pulls INTEGER NOT NULL,
  current_pull INTEGER DEFAULT 0,
  scenario_path JSONB DEFAULT '[]',
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'cancelled')),
  results JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================
-- Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_tickets_user ON user_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tickets_type ON user_tickets(ticket_type_id);
CREATE INDEX IF NOT EXISTS idx_card_inventory_owner ON card_inventory(owner_id);
CREATE INDEX IF NOT EXISTS idx_card_inventory_card ON card_inventory(card_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_multi_gacha_user ON multi_gacha_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_rarity ON cards(rarity);
CREATE INDEX IF NOT EXISTS idx_cards_active ON cards(is_active);
CREATE INDEX IF NOT EXISTS idx_line_follows_user ON line_follows(user_id);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE ticket_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE gachas ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE gacha_probability ENABLE ROW LEVEL SECURITY;
ALTER TABLE multi_gacha_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view ticket_types" ON ticket_types;
DROP POLICY IF EXISTS "Anyone can view active gachas" ON gachas;
DROP POLICY IF EXISTS "Anyone can view active cards" ON cards;
DROP POLICY IF EXISTS "Anyone can view active gacha_probability" ON gacha_probability;
DROP POLICY IF EXISTS "Users can view own tickets" ON user_tickets;
DROP POLICY IF EXISTS "Users can view own inventory" ON card_inventory;
DROP POLICY IF EXISTS "Users can view own referrals" ON referrals;
DROP POLICY IF EXISTS "Users can view own line follows" ON line_follows;
DROP POLICY IF EXISTS "Users can view own sessions" ON multi_gacha_sessions;
DROP POLICY IF EXISTS "Users can create own sessions" ON multi_gacha_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON multi_gacha_sessions;

CREATE POLICY "Anyone can view ticket_types" ON ticket_types
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view active gachas" ON gachas
  FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view active cards" ON cards
  FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view active gacha_probability" ON gacha_probability
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view own tickets" ON user_tickets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own inventory" ON card_inventory
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can view own referrals" ON referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Users can view own line follows" ON line_follows
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own sessions" ON multi_gacha_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions" ON multi_gacha_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON multi_gacha_sessions
  FOR UPDATE USING (auth.uid() = user_id);

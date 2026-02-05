-- ============================================
-- SONSHI GACHA Login Bonus & History
-- ============================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- login_bonus_claims
-- ============================================

CREATE TABLE IF NOT EXISTS login_bonus_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  claimed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_bonus_claims_user ON login_bonus_claims(user_id);

-- ============================================
-- gacha_results
-- ============================================

CREATE TABLE IF NOT EXISTS gacha_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  gacha_id UUID REFERENCES gachas(id) ON DELETE SET NULL,
  card_id UUID REFERENCES cards(id) ON DELETE SET NULL,
  obtained_via TEXT NOT NULL CHECK (obtained_via IN ('single_gacha', 'multi_gacha')),
  session_id UUID REFERENCES multi_gacha_sessions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gacha_results_user ON gacha_results(user_id);
CREATE INDEX IF NOT EXISTS idx_gacha_results_gacha ON gacha_results(gacha_id);
CREATE INDEX IF NOT EXISTS idx_gacha_results_card ON gacha_results(card_id);
CREATE INDEX IF NOT EXISTS idx_gacha_results_created ON gacha_results(created_at);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE login_bonus_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE gacha_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own login bonus" ON login_bonus_claims;
DROP POLICY IF EXISTS "Users can insert own login bonus" ON login_bonus_claims;
DROP POLICY IF EXISTS "Users can view own gacha results" ON gacha_results;
DROP POLICY IF EXISTS "Users can insert own gacha results" ON gacha_results;

CREATE POLICY "Users can view own login bonus" ON login_bonus_claims
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own login bonus" ON login_bonus_claims
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own gacha results" ON gacha_results
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own gacha results" ON gacha_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

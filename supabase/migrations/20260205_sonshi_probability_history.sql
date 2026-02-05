-- ============================================
-- SONSHI GACHA Probability History
-- ============================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS gacha_probability_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_email TEXT,
  snapshot JSONB NOT NULL,
  total_probability DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gacha_probability_history_created ON gacha_probability_history(created_at);
CREATE INDEX IF NOT EXISTS idx_gacha_probability_history_admin ON gacha_probability_history(admin_user_id);

ALTER TABLE gacha_probability_history ENABLE ROW LEVEL SECURITY;

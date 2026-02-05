-- ============================================
-- SONSHI GACHA Custom Auth Tables
-- ============================================

CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES app_users(id) ON DELETE CASCADE NOT NULL,
  session_token_hash TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth_email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES app_users(id) ON DELETE CASCADE NOT NULL,
  token_hash TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth_password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES app_users(id) ON DELETE CASCADE NOT NULL,
  token_hash TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth_email_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES app_users(id) ON DELETE CASCADE NOT NULL,
  new_email TEXT NOT NULL,
  token_hash TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_users_email ON app_users(email);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires ON auth_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_auth_email_verifications_user ON auth_email_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_password_resets_user ON auth_password_resets(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_email_changes_user ON auth_email_changes(user_id);

ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_password_resets ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_email_changes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Replace auth.users references with app_users
-- ============================================

ALTER TABLE user_tickets DROP CONSTRAINT IF EXISTS user_tickets_user_id_fkey;
ALTER TABLE user_tickets
  ADD CONSTRAINT user_tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE;

ALTER TABLE card_inventory DROP CONSTRAINT IF EXISTS card_inventory_owner_id_fkey;
ALTER TABLE card_inventory
  ADD CONSTRAINT card_inventory_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES app_users(id) ON DELETE CASCADE;

ALTER TABLE referrals DROP CONSTRAINT IF EXISTS referrals_referrer_id_fkey;
ALTER TABLE referrals
  ADD CONSTRAINT referrals_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES app_users(id) ON DELETE SET NULL;

ALTER TABLE referrals DROP CONSTRAINT IF EXISTS referrals_referred_id_fkey;
ALTER TABLE referrals
  ADD CONSTRAINT referrals_referred_id_fkey FOREIGN KEY (referred_id) REFERENCES app_users(id) ON DELETE SET NULL;

ALTER TABLE line_follows DROP CONSTRAINT IF EXISTS line_follows_user_id_fkey;
ALTER TABLE line_follows
  ADD CONSTRAINT line_follows_user_id_fkey FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE;

ALTER TABLE multi_gacha_sessions DROP CONSTRAINT IF EXISTS multi_gacha_sessions_user_id_fkey;
ALTER TABLE multi_gacha_sessions
  ADD CONSTRAINT multi_gacha_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE;

ALTER TABLE login_bonus_claims DROP CONSTRAINT IF EXISTS login_bonus_claims_user_id_fkey;
ALTER TABLE login_bonus_claims
  ADD CONSTRAINT login_bonus_claims_user_id_fkey FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE;

ALTER TABLE gacha_results DROP CONSTRAINT IF EXISTS gacha_results_user_id_fkey;
ALTER TABLE gacha_results
  ADD CONSTRAINT gacha_results_user_id_fkey FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE;

ALTER TABLE gacha_probability_history DROP CONSTRAINT IF EXISTS gacha_probability_history_admin_user_id_fkey;
ALTER TABLE gacha_probability_history
  ADD CONSTRAINT gacha_probability_history_admin_user_id_fkey FOREIGN KEY (admin_user_id) REFERENCES app_users(id) ON DELETE SET NULL;

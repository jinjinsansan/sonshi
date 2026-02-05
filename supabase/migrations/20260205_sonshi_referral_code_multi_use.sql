-- ============================================
-- Allow multiple uses of referral codes
-- ============================================

ALTER TABLE referrals
  DROP CONSTRAINT IF EXISTS referrals_referral_code_key;

CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);

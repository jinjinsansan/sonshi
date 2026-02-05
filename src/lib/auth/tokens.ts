import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { generateToken, hashToken } from "@/lib/auth/crypto";

const EMAIL_VERIFICATION_HOURS = 24;
const PASSWORD_RESET_HOURS = 2;
const EMAIL_CHANGE_HOURS = 24;

function buildExpiry(hours: number) {
  const expires = new Date();
  expires.setHours(expires.getHours() + hours);
  return expires.toISOString();
}

export async function createEmailVerificationToken(userId: string) {
  const supabase = getSupabaseServiceClient();
  const token = generateToken();
  await supabase.from("auth_email_verifications").insert({
    user_id: userId,
    token_hash: hashToken(token),
    expires_at: buildExpiry(EMAIL_VERIFICATION_HOURS),
  });
  return token;
}

export async function consumeEmailVerificationToken(token: string) {
  const supabase = getSupabaseServiceClient();
  const tokenHash = hashToken(token);
  const { data } = await supabase
    .from("auth_email_verifications")
    .select("id, user_id, expires_at")
    .eq("token_hash", tokenHash)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (!data) return null;

  await supabase.from("auth_email_verifications").delete().eq("id", data.id);
  return data.user_id;
}

export async function createPasswordResetToken(userId: string) {
  const supabase = getSupabaseServiceClient();
  const token = generateToken();
  await supabase.from("auth_password_resets").insert({
    user_id: userId,
    token_hash: hashToken(token),
    expires_at: buildExpiry(PASSWORD_RESET_HOURS),
  });
  return token;
}

export async function consumePasswordResetToken(token: string) {
  const supabase = getSupabaseServiceClient();
  const tokenHash = hashToken(token);
  const { data } = await supabase
    .from("auth_password_resets")
    .select("id, user_id, expires_at")
    .eq("token_hash", tokenHash)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (!data) return null;

  await supabase.from("auth_password_resets").delete().eq("id", data.id);
  return data.user_id;
}

export async function createEmailChangeToken(userId: string, newEmail: string) {
  const supabase = getSupabaseServiceClient();
  const token = generateToken();
  await supabase.from("auth_email_changes").insert({
    user_id: userId,
    new_email: newEmail,
    token_hash: hashToken(token),
    expires_at: buildExpiry(EMAIL_CHANGE_HOURS),
  });
  return token;
}

export async function consumeEmailChangeToken(token: string) {
  const supabase = getSupabaseServiceClient();
  const tokenHash = hashToken(token);
  const { data } = await supabase
    .from("auth_email_changes")
    .select("id, user_id, new_email, expires_at")
    .eq("token_hash", tokenHash)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (!data) return null;

  await supabase.from("auth_email_changes").delete().eq("id", data.id);
  return { userId: data.user_id, newEmail: data.new_email };
}

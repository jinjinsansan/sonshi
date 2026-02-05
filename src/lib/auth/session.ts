import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { generateToken, hashToken } from "@/lib/auth/crypto";

const SESSION_COOKIE_NAME = "sonshi_session";
const SESSION_TTL_DAYS = 14;

export type AuthUser = {
  id: string;
  email: string;
  emailVerified: boolean;
};

type SessionRecord = {
  id: string;
  user_id: string;
  expires_at: string;
  app_users: { id: string; email: string; email_verified: boolean } | null;
};

function getSessionExpiryDate() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_TTL_DAYS);
  return expiresAt;
}

function buildAuthUser(record: SessionRecord): AuthUser | null {
  if (!record.app_users) return null;
  return {
    id: record.app_users.id,
    email: record.app_users.email,
    emailVerified: record.app_users.email_verified,
  };
}

async function fetchSession(token: string): Promise<SessionRecord | null> {
  const supabase = getSupabaseServiceClient();
  const tokenHash = hashToken(token);
  const { data } = await supabase
    .from("auth_sessions")
    .select("id, user_id, expires_at, app_users ( id, email, email_verified )")
    .eq("session_token_hash", tokenHash)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (!data) return null;

  await supabase
    .from("auth_sessions")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", data.id);

  return data as SessionRecord;
}

export async function createSession(userId: string) {
  const supabase = getSupabaseServiceClient();
  const token = generateToken();
  const expiresAt = getSessionExpiryDate();

  await supabase.from("auth_sessions").insert({
    user_id: userId,
    session_token_hash: hashToken(token),
    expires_at: expiresAt.toISOString(),
  });

  return { token, expiresAt };
}

export async function deleteSession(token: string) {
  const supabase = getSupabaseServiceClient();
  await supabase
    .from("auth_sessions")
    .delete()
    .eq("session_token_hash", hashToken(token));
}

export async function getServerAuthUser(): Promise<AuthUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await fetchSession(token);
  return session ? buildAuthUser(session) : null;
}

export async function getRequestAuthUser(request: NextRequest): Promise<AuthUser | null> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await fetchSession(token);
  return session ? buildAuthUser(session) : null;
}

export async function attachSessionCookie(
  response: NextResponse,
  token: string,
  expiresAt: Date
): Promise<NextResponse> {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
  return response;
}

export async function setServerSessionCookie(token: string, expiresAt: Date) {
  const store = await cookies();
  store.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearServerSessionCookie() {
  const store = await cookies();
  store.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
}

export function clearResponseSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
}

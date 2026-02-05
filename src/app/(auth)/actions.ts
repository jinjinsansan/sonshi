"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { sendEmailChangeVerificationEmail, sendPasswordResetEmail, sendSignupVerificationEmail } from "@/lib/auth/emails";
import { hashPassword, verifyPassword } from "@/lib/auth/crypto";
import {
  createEmailChangeToken,
  createEmailVerificationToken,
  createPasswordResetToken,
  consumeEmailVerificationToken,
  consumeEmailChangeToken,
  consumePasswordResetToken,
} from "@/lib/auth/tokens";
import {
  clearServerSessionCookie,
  createSession,
  deleteSession,
  getServerAuthUser,
  setServerSessionCookie,
} from "@/lib/auth/session";
import { publicEnv } from "@/lib/env";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

export type AuthActionState = {
  status: "idle" | "error";
  message?: string;
};

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
    acceptTerms: z.coerce.boolean().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "パスワードが一致しません",
    path: ["confirmPassword"],
  })
  .refine((data) => data.acceptTerms, {
    message: "利用規約への同意が必要です",
    path: ["acceptTerms"],
  });

const passwordResetSchema = z.object({
  email: z.string().email(),
});

const passwordUpdateSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "パスワードが一致しません",
    path: ["confirmPassword"],
  });

const emailChangeSchema = z.object({
  email: z.string().email(),
});

export async function signInAction(
  _: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { status: "error", message: "メールアドレスとパスワードを確認してください" };
  }

  const supabase = getSupabaseServiceClient();
  const email = parsed.data.email.toLowerCase();
  const { data: user } = await supabase
    .from("app_users")
    .select("id, email, password_hash, email_verified")
    .eq("email", email)
    .maybeSingle();

  if (!user || !verifyPassword(parsed.data.password, user.password_hash)) {
    return { status: "error", message: "メールアドレスまたはパスワードが違います" };
  }

  if (!user.email_verified) {
    return { status: "error", message: "メール認証が完了していません。受信メールをご確認ください。" };
  }

  const { token, expiresAt } = await createSession(user.id);
  setServerSessionCookie(token, expiresAt);
  await supabase.from("app_users").update({ last_login_at: new Date().toISOString() }).eq("id", user.id);

  redirect("/gacha");
}

export async function signUpAction(
  _: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    acceptTerms: formData.get("acceptTerms"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "入力内容を確認してください";
    return { status: "error", message: firstError };
  }

  const supabase = getSupabaseServiceClient();
  const email = parsed.data.email.toLowerCase();
  const { data: existing } = await supabase
    .from("app_users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    return { status: "error", message: "既に登録済みのメールアドレスです" };
  }

  const passwordHash = hashPassword(parsed.data.password);
  const { data: user, error } = await supabase
    .from("app_users")
    .insert({ email, password_hash: passwordHash })
    .select("id")
    .single();

  if (error || !user) {
    return { status: "error", message: "登録に失敗しました" };
  }

  const token = await createEmailVerificationToken(user.id);
  const verifyUrl = new URL("/auth/verify", publicEnv.NEXT_PUBLIC_SITE_URL);
  verifyUrl.searchParams.set("token", token);
  await sendSignupVerificationEmail(email, verifyUrl.toString());

  redirect("/login?signup=1");
}

export async function requestPasswordResetAction(
  _: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = passwordResetSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { status: "error", message: "メールアドレスを確認してください" };
  }

  const supabase = getSupabaseServiceClient();
  const email = parsed.data.email.toLowerCase();
  const { data: user } = await supabase
    .from("app_users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (user) {
    const token = await createPasswordResetToken(user.id);
    const resetUrl = new URL("/reset/confirm", publicEnv.NEXT_PUBLIC_SITE_URL);
    resetUrl.searchParams.set("token", token);
    await sendPasswordResetEmail(email, resetUrl.toString());
  }

  redirect("/login?reset=1");
}

export async function verifyEmailAction(token: string) {
  const userId = await consumeEmailVerificationToken(token);
  if (!userId) {
    return { status: "error", message: "リンクの有効期限が切れました。" } as const;
  }

  const supabase = getSupabaseServiceClient();
  await supabase
    .from("app_users")
    .update({ email_verified: true, updated_at: new Date().toISOString() })
    .eq("id", userId);

  return { status: "ok" } as const;
}

export async function resetPasswordAction(
  _: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = passwordUpdateSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "入力内容を確認してください";
    return { status: "error", message: firstError };
  }

  const userId = await consumePasswordResetToken(parsed.data.token);
  if (!userId) {
    return { status: "error", message: "リンクの有効期限が切れています" };
  }

  const supabase = getSupabaseServiceClient();
  await supabase
    .from("app_users")
    .update({ password_hash: hashPassword(parsed.data.password), updated_at: new Date().toISOString() })
    .eq("id", userId);

  redirect("/login?reset=done");
}

export async function requestEmailChangeAction(
  _: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = emailChangeSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { status: "error", message: "メールアドレスを確認してください" };
  }

  const user = await getServerAuthUser();
  if (!user) {
    return { status: "error", message: "認証が必要です" };
  }

  const newEmail = parsed.data.email.toLowerCase();
  const supabase = getSupabaseServiceClient();
  const { data: existing } = await supabase
    .from("app_users")
    .select("id")
    .eq("email", newEmail)
    .maybeSingle();

  if (existing) {
    return { status: "error", message: "既に登録済みのメールアドレスです" };
  }

  const token = await createEmailChangeToken(user.id, newEmail);
  const changeUrl = new URL("/auth/email-change", publicEnv.NEXT_PUBLIC_SITE_URL);
  changeUrl.searchParams.set("token", token);
  await sendEmailChangeVerificationEmail(newEmail, changeUrl.toString());

  return { status: "idle" };
}

export async function confirmEmailChangeAction(token: string) {
  const payload = await consumeEmailChangeToken(token);
  if (!payload) {
    return { status: "error", message: "リンクの有効期限が切れました。" } as const;
  }

  const supabase = getSupabaseServiceClient();
  const { data: existing } = await supabase
    .from("app_users")
    .select("id")
    .eq("email", payload.newEmail.toLowerCase())
    .maybeSingle();

  if (existing) {
    return { status: "error", message: "既に登録済みのメールアドレスです" } as const;
  }

  await supabase
    .from("app_users")
    .update({ email: payload.newEmail.toLowerCase(), email_verified: true, updated_at: new Date().toISOString() })
    .eq("id", payload.userId);

  return { status: "ok" } as const;
}

export async function signOutAction() {
  const store = await cookies();
  const token = store.get("sonshi_session")?.value;
  if (token) {
    await deleteSession(token);
  }
  clearServerSessionCookie();
  redirect("/");
}

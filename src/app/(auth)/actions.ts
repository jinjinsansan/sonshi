"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getSupabaseActionClient } from "@/lib/supabase/server";
import { publicEnv } from "@/lib/env";

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

  const supabase = getSupabaseActionClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { status: "error", message: error.message };
  }

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

  const supabase = getSupabaseActionClient();
  const redirectTo = `${publicEnv.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/auth/callback`;
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: redirectTo,
    },
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  redirect("/login?signup=1");
}

const passwordResetSchema = z.object({
  email: z.string().email(),
});

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

  const supabase = getSupabaseActionClient();
  const redirectTo = `${publicEnv.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/auth/callback`;
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, { redirectTo });

  if (error) {
    return { status: "error", message: error.message };
  }

  redirect("/login?reset=1");
}

export async function signOutAction() {
  const supabase = getSupabaseActionClient();
  await supabase.auth.signOut();
  redirect("/");
}

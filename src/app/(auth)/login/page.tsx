"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import type { AuthActionState, ResendVerificationState } from "../actions";
import { resendVerificationAction, signInAction } from "../actions";

const initialState: AuthActionState = { status: "idle" };
const resendInitialState: ResendVerificationState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-4 w-full rounded-full bg-[#ffe347] py-3 font-display text-sm tracking-[0.35em] text-white shadow-[0_0_22px_rgba(255,255,0,0.45)] disabled:opacity-60"
    >
      {pending ? "SIGNING IN" : "SIGN IN"}
    </button>
  );
}

function LoginForm() {
  const [state, action] = useFormState(signInAction, initialState);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="text-xs uppercase tracking-[0.3em] text-zinc-400">Email</label>
        <input
          name="email"
          type="email"
          required
          className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-neon-blue"
          placeholder="user@example.com"
        />
      </div>
      <div>
        <label className="text-xs uppercase tracking-[0.3em] text-zinc-400">Password</label>
        <input
          name="password"
          type="password"
          required
          minLength={6}
          className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-neon-blue"
          placeholder="••••••••"
        />
      </div>

      {state.status === "error" && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200">
          {state.message ?? "ログインに失敗しました"}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}

function ResendButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full border border-white/20 py-3 text-[11px] uppercase tracking-[0.35em] text-white transition hover:border-neon-blue disabled:opacity-60"
    >
      {pending ? "SENDING" : "認証メールを再送"}
    </button>
  );
}

function ResendVerificationForm() {
  const [state, action] = useFormState(resendVerificationAction, resendInitialState);

  return (
    <form action={action} className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-left">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-neon-blue">メールが届いていませんか？</p>
        <p className="mt-1 text-xs text-zinc-400">登録済みアドレスへ認証メールを再送します。</p>
      </div>
      <div>
        <label className="text-[11px] uppercase tracking-[0.3em] text-zinc-400">Email</label>
        <input
          name="email"
          type="email"
          required
          className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none focus:border-neon-blue"
          placeholder="user@example.com"
        />
      </div>
      {state.status === "error" && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs text-red-200">
          {state.message ?? "送信に失敗しました"}
        </p>
      )}
      {state.status === "success" && (
        <p className="rounded-xl border border-neon-blue/30 bg-neon-blue/10 px-4 py-2 text-xs text-neon-blue">
          {state.message ?? "送信しました"}
        </p>
      )}
      <ResendButton />
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.5em] text-neon-blue">Entrance</p>
        <h1 className="mt-2 font-display text-3xl text-white">ホール入場</h1>
        <p className="text-sm text-zinc-400">登録メールアドレスでログインしてください。</p>
      </div>
      <LoginForm />
      <ResendVerificationForm />
      <div className="flex flex-col gap-2 text-center text-xs text-zinc-400">
        <Link href="/register" className="text-neon-yellow">
          アカウントを作成
        </Link>
        <Link href="/reset" className="text-neon-blue">
          パスワードをお忘れの方はこちら
        </Link>
      </div>
    </div>
  );
}

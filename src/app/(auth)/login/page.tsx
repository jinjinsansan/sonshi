"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import type { AuthActionState } from "../actions";
import { signInAction } from "../actions";

const initialState: AuthActionState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-4 w-full rounded-full bg-neon-yellow py-3 font-display text-sm tracking-[0.35em] text-black shadow-[0_0_25px_rgba(255,255,0,0.45)] disabled:opacity-60"
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

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.5em] text-neon-blue">Entrance</p>
        <h1 className="mt-2 font-display text-3xl text-white">ホール入場</h1>
        <p className="text-sm text-zinc-400">登録メールアドレスでログインしてください。</p>
      </div>
      <LoginForm />
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

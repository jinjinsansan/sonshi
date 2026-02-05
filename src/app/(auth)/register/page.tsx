"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import type { AuthActionState } from "../actions";
import { signUpAction } from "../actions";

const initialState: AuthActionState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-4 w-full rounded-full bg-[#ffe347] py-3 font-display text-sm tracking-[0.35em] text-white shadow-[0_0_22px_rgba(255,255,0,0.45)] disabled:opacity-60"
    >
      {pending ? "CREATING" : "CREATE"}
    </button>
  );
}

function RegisterForm() {
  const [state, action] = useFormState(signUpAction, initialState);

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
      <div>
        <label className="text-xs uppercase tracking-[0.3em] text-zinc-400">Confirm Password</label>
        <input
          name="confirmPassword"
          type="password"
          required
          minLength={6}
          className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-neon-blue"
          placeholder="••••••••"
        />
      </div>
      <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-xs text-zinc-300">
        <input type="checkbox" name="acceptTerms" value="true" required className="h-4 w-4 accent-neon-yellow" />
        利用規約とプライバシーポリシーに同意します
      </label>

      {state.status === "error" && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200">
          {state.message ?? "登録に失敗しました"}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.5em] text-neon-blue">Entry Ticket</p>
        <h1 className="mt-2 font-display text-3xl text-white">アカウント作成</h1>
        <p className="text-sm text-zinc-400">メール認証後にホールへ入場できます。</p>
      </div>
      <RegisterForm />
      <div className="text-center text-xs text-zinc-400">
        既にアカウントをお持ちですか？ {" "}
        <Link href="/login" className="text-neon-yellow">
          ログインする
        </Link>
      </div>
    </div>
  );
}

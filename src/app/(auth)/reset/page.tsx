"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import type { AuthActionState } from "../actions";
import { requestPasswordResetAction } from "../actions";

const initialState: AuthActionState = { status: "idle" };
const primaryButtonClass =
  "mt-4 w-full rounded-full bg-gradient-to-r from-[#ff2d95] via-[#ff8c3a] to-[#fff65c] py-3 font-display text-sm tracking-[0.35em] text-[#120714] shadow-[0_0_28px_rgba(255,246,92,0.6)] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fff65c]/70 disabled:opacity-60";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={primaryButtonClass}>
      {pending ? "SENDING" : "SEND LINK"}
    </button>
  );
}

function ResetForm() {
  const [state, action] = useFormState(requestPasswordResetAction, initialState);

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

      {state.status === "error" && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200">
          {state.message ?? "送信に失敗しました"}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}

export default function ResetPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.5em] text-neon-blue">Password Reset</p>
        <h1 className="mt-2 font-display text-3xl text-white">再発行リンクを送信</h1>
        <p className="text-sm text-zinc-400">登録済みメールアドレス宛にリセット用リンクを送信します。</p>
      </div>
      <ResetForm />
      <div className="text-center text-xs text-zinc-400">
        <Link href="/login" className="text-neon-yellow">
          ログイン画面に戻る
        </Link>
      </div>
    </div>
  );
}

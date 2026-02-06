"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { resetPasswordAction, type AuthActionState } from "../../actions";

const initialState: AuthActionState = { status: "idle" };
const primaryButtonClass =
  "mt-4 w-full rounded-full bg-gradient-to-r from-[#ff2d95] via-[#ff8c3a] to-[#fff65c] py-3 font-display text-sm tracking-[0.35em] text-[#120714] shadow-[0_0_28px_rgba(255,246,92,0.6)] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fff65c]/70 disabled:opacity-60";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={primaryButtonClass}>
      {pending ? "RESETTING" : "RESET PASSWORD"}
    </button>
  );
}

function ResetConfirmContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [state, action] = useFormState(resetPasswordAction, initialState);

  if (!token) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-2xl text-white">リンクが無効です</h1>
        <p className="text-sm text-zinc-400">再度パスワード再設定をリクエストしてください。</p>
        <Link href="/reset" className="text-neon-blue">
          再設定リンクを送信
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.5em] text-neon-blue">Reset Password</p>
        <h1 className="mt-2 font-display text-3xl text-white">新しいパスワード</h1>
        <p className="text-sm text-zinc-400">新しいパスワードを入力してください。</p>
      </div>
      <form action={action} className="space-y-4">
        <input type="hidden" name="token" value={token} />
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
        {state.status === "error" && (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200">
            {state.message ?? "再設定に失敗しました"}
          </p>
        )}
        <SubmitButton />
      </form>
      <div className="text-center text-xs text-zinc-400">
        <Link href="/login" className="text-neon-yellow">
          ログイン画面に戻る
        </Link>
      </div>
    </div>
  );
}

export default function ResetConfirmPage() {
  return (
    <Suspense fallback={<div className="text-white">Loading...</div>}>
      <ResetConfirmContent />
    </Suspense>
  );
}

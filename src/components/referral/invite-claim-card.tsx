"use client";

import Link from "next/link";
import { useState } from "react";

type Props = {
  code: string;
};

export function InviteClaimCard({ code }: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "unauthorized">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const handleClaim = async () => {
    setStatus("loading");
    setMessage(null);
    try {
      const response = await fetch("/api/referral/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await response.json();
      if (response.status === 401) {
        setStatus("unauthorized");
        setMessage("ログイン後に特典を受け取れます。");
        return;
      }
      if (!response.ok) {
        throw new Error(data?.error ?? "紹介特典の付与に失敗しました");
      }
      setStatus("success");
      setMessage(data?.message ?? "フリーチケットを付与しました");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "予期せぬエラーが発生しました");
    }
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-hall-panel/80 p-6 shadow-panel-inset">
      <p className="text-xs uppercase tracking-[0.4em] text-neon-blue">Invite Bonus</p>
      <p className="mt-3 text-sm text-zinc-200">紹介コードを適用してフリーチケット1枚を受け取れます。</p>
      <button
        type="button"
        onClick={handleClaim}
        disabled={status === "loading" || status === "success"}
        className="mt-4 w-full rounded-full bg-gradient-to-r from-neon-pink to-neon-yellow py-3 font-display text-sm uppercase tracking-[0.35em] text-black disabled:opacity-60"
      >
        {status === "loading" ? "APPLYING" : status === "success" ? "CLAIMED" : "特典を受け取る"}
      </button>
      {message && (
        <p className="mt-3 text-sm text-zinc-300">
          {message}
        </p>
      )}
      {status === "unauthorized" && (
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-400">
          <Link href="/login" className="text-neon-yellow">
            ログインする
          </Link>
          <Link href="/register" className="text-neon-blue">
            新規登録する
          </Link>
        </div>
      )}
    </div>
  );
}

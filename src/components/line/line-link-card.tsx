"use client";

import { useState } from "react";

type Props = {
  addFriendUrl?: string | null;
};

export function LineLinkCard({ addFriendUrl }: Props) {
  const [lineUserId, setLineUserId] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const handleLink = async () => {
    if (!lineUserId.trim()) {
      setStatus("error");
      setMessage("LINEユーザーIDを入力してください");
      return;
    }
    setStatus("loading");
    setMessage(null);
    try {
      const response = await fetch("/api/line/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lineUserId: lineUserId.trim() }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error ?? "連携に失敗しました");
      }
      setStatus("success");
      setMessage(data?.message ?? "連携しました");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "予期せぬエラーが発生しました");
    }
  };

  return (
    <div className="space-y-4 rounded-3xl border border-white/10 bg-hall-panel/80 p-6 shadow-panel-inset">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-neon-blue">LINE BONUS</p>
        <h2 className="mt-2 font-display text-2xl text-white">LINE公式追加でフリーチケット</h2>
        <p className="text-sm text-zinc-300">
          LINE公式アカウントを追加後、LINEユーザーIDを入力して連携してください。
        </p>
      </div>

      {addFriendUrl && (
        <a
          href={addFriendUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-neon-pink to-neon-yellow px-5 py-3 text-xs uppercase tracking-[0.35em] text-black shadow-neon"
        >
          LINE公式を追加
        </a>
      )}

      <div className="space-y-2">
        <label className="text-xs uppercase tracking-[0.35em] text-zinc-400">LINE USER ID</label>
        <input
          value={lineUserId}
          onChange={(event) => setLineUserId(event.target.value)}
          placeholder="Uxxxxxxxxxxxx"
          className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-neon-blue"
        />
        <button
          type="button"
          onClick={handleLink}
          disabled={status === "loading"}
          className="w-full rounded-full border border-white/15 px-4 py-3 text-xs uppercase tracking-[0.35em] text-white/80 transition hover:border-neon-blue hover:text-white disabled:opacity-60"
        >
          {status === "loading" ? "LINKING" : "連携する"}
        </button>
      </div>

      {message && (
        <p className={status === "error" ? "text-sm text-red-300" : "text-sm text-neon-blue"}>{message}</p>
      )}
    </div>
  );
}

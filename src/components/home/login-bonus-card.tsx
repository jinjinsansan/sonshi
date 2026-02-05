"use client";

import { useEffect, useState } from "react";
import { Ticket } from "lucide-react";

type BonusState = {
  status: "idle" | "success" | "error" | "claimed";
  message?: string;
  nextResetAt?: string;
};

export function LoginBonusCard() {
  const [claiming, setClaiming] = useState(false);
  const [state, setState] = useState<BonusState>({ status: "idle" });

  useEffect(() => {
    let mounted = true;
    fetch("/api/tickets/bonus")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "取得に失敗しました");
        return data;
      })
      .then((data) => {
        if (!mounted) return;
        if (data.claimed) {
          setState({ status: "claimed", nextResetAt: data.nextResetAt });
        }
      })
      .catch(() => {
        /* ignore */
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleClaim = async () => {
    setClaiming(true);
    try {
      const response = await fetch("/api/tickets/bonus", { method: "POST" });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error ?? "取得に失敗しました");
      }
      setState({ status: "success", message: data.message, nextResetAt: data.nextResetAt });
    } catch (error) {
      setState({ status: "error", message: error instanceof Error ? error.message : "予期せぬエラー" });
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-hall-panel/80 to-hall-surface/80 p-6 shadow-panel-inset">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neon-yellow/20 text-neon-yellow">
          <Ticket className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-neon-yellow">LOGIN BONUS</p>
          <h3 className="font-display text-xl text-white">本日のフリーチケット</h3>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <p className="text-4xl font-display text-white">+1</p>
          <p className="text-xs text-zinc-400">FREE TICKET</p>
          {state.nextResetAt && (
            <p className="mt-1 text-[0.65rem] text-zinc-500">
              次回受取: {new Date(state.nextResetAt).toLocaleString("ja-JP")}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={handleClaim}
          disabled={claiming || state.status === "claimed"}
          className="rounded-full bg-gradient-to-r from-neon-pink to-neon-yellow px-6 py-3 text-xs uppercase tracking-[0.35em] text-black disabled:opacity-60"
        >
          {state.status === "claimed" ? "受取済" : claiming ? "付与中..." : "受け取る"}
        </button>
      </div>

      {state.status === "error" && (
        <p className="mt-3 text-sm text-red-300">{state.message ?? "エラーが発生しました"}</p>
      )}
      {state.status === "success" && (
        <p className="mt-3 text-sm text-neon-blue">{state.message ?? "付与しました"}</p>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { GachaDefinition } from "@/constants/gacha";

type Props = {
  gachas: GachaDefinition[];
};

const PULL_OPTIONS = [2, 5, 10];

export function MultiGachaLobby({ gachas }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startSession = async (gachaId: string, totalPulls: number) => {
    setError(null);
    setPending(`${gachaId}-${totalPulls}`);
    try {
      const response = await fetch("/api/gacha/multi/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gachaId, totalPulls }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error ?? "開始に失敗しました");
      }
      router.push(`/gacha/multi/${data.sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "予期せぬエラーが発生しました");
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}
      <div className="space-y-4">
        {gachas.map((gacha) => (
          <article
            key={gacha.id}
            className={`rounded-3xl border border-white/10 bg-gradient-to-br ${gacha.gradient} p-6 shadow-panel-inset`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-zinc-200">{gacha.ticketLabel}</p>
                <h2 className="font-display text-2xl text-white">{gacha.name}連続ガチャ</h2>
              </div>
              <span className="text-xs uppercase tracking-[0.3em] text-neon-yellow">{gacha.priceLabel ?? "TICKET"}</span>
            </div>
            <p className="mt-2 text-sm text-zinc-200">
              {gacha.description || "連続演出でまとめて回します。"}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {PULL_OPTIONS.map((count) => {
                const key = `${gacha.id}-${count}`;
                const isPending = pending === key;
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={Boolean(pending)}
                    onClick={() => startSession(gacha.id, count)}
                    className="flex items-center gap-2 rounded-full bg-black/40 px-5 py-2 text-xs uppercase tracking-[0.35em] text-white/90 disabled:opacity-60"
                  >
                    {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                    {count}連開始
                  </button>
                );
              })}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

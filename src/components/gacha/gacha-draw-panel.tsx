"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { Loader2, Sparkles } from "lucide-react";

type DrawResult = {
  cardId: string;
  name: string;
  rarity: string;
  imageUrl?: string | null;
  serialNumber?: number | null;
};

type PullResponse = {
  ticket: string;
  results: DrawResult[];
  remaining?: number | null;
  error?: string;
};

const RARITY_LABELS: Record<string, string> = {
  N: "N",
  R: "R",
  SR: "SR",
  SSR: "SSR",
  UR: "UR",
};

type Props = {
  gachaId: string;
};

export function GachaDrawPanel({ gachaId }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<DrawResult[]>([]);
  const [remaining, setRemaining] = useState<number | null>(null);

  const runDraw = (repeat: number) => {
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/gachas/${gachaId}/pull`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ repeat }),
        });

        const data: PullResponse = await response.json();
        if (!response.ok || data.error) {
          setError(data.error ?? "抽選に失敗しました");
          setResults([]);
          setRemaining(null);
          return;
        }

        setResults(Array.isArray(data.results) ? data.results : []);
        setRemaining(typeof data.remaining === "number" ? data.remaining : null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "予期せぬエラーが発生しました");
        setResults([]);
        setRemaining(null);
      }
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => runDraw(1)}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-neon-pink to-neon-yellow px-6 py-3 text-xs uppercase tracking-[0.35em] text-black shadow-neon disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "1回ガチャ"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => runDraw(10)}
          className="flex flex-1 items-center justify-center gap-2 rounded-full border border-white/20 bg-hall-panel/70 px-6 py-3 text-xs uppercase tracking-[0.35em] text-white disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "10連ガチャ"}
        </button>
      </div>

      {typeof remaining === "number" && (
        <p className="text-xs uppercase tracking-[0.4em] text-neon-blue">
          残高: {remaining}
        </p>
      )}

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {results.length === 0 ? (
        <p className="text-center text-sm text-zinc-400">まだ結果はありません</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {results.map((result, index) => (
            <div
              key={`${result.cardId}-${index}`}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-hall-panel/80 p-3 shadow-panel-inset"
            >
              {result.imageUrl ? (
                <Image
                  src={result.imageUrl}
                  alt={result.name}
                  width={56}
                  height={56}
                  unoptimized
                  className="h-14 w-14 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-black/30 text-[0.6rem] text-zinc-400">
                  NO IMAGE
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-display text-base text-white">{result.name}</p>
                  <span className="flex items-center gap-1 text-xs text-neon-yellow">
                    <Sparkles className="h-3.5 w-3.5" />
                    {RARITY_LABELS[result.rarity] ?? result.rarity}
                  </span>
                </div>
                {result.serialNumber ? (
                  <p className="mt-1 text-xs text-zinc-400">#{result.serialNumber}</p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

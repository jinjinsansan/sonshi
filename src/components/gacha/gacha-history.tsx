"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

type HistoryEntry = {
  id: string;
  created_at: string;
  obtained_via: string;
  cards: { name: string; rarity: string } | null;
  gachas: { name: string; ticket_types: { code: string; name: string } | null } | null;
};

type Props = {
  title?: string;
  limit?: number;
};

const RARITY_LABELS: Record<string, string> = {
  N: "N",
  R: "R",
  SR: "SR",
  SSR: "SSR",
  UR: "UR",
};

export function GachaHistory({ title = "最近の結果", limit = 10 }: Props) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch("/api/gacha/history")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "取得に失敗しました");
        return data.history as HistoryEntry[];
      })
      .then((items) => {
        if (mounted) setHistory(items.slice(0, limit));
      })
      .catch((err: Error) => {
        if (mounted) setError(err.message);
      });

    return () => {
      mounted = false;
    };
  }, [limit]);

  return (
    <div className="rounded-3xl border border-white/10 bg-hall-panel/80 shadow-panel-inset">
      <div className="border-b border-white/5 px-4 py-3">
        <p className="font-display text-base text-white">{title}</p>
        <p className="text-xs text-zinc-400">直近 {history.length} 件を表示</p>
      </div>
      <div className="divide-y divide-white/5">
        {error ? (
          <div className="px-4 py-3 text-xs text-red-300">{error}</div>
        ) : history.length === 0 ? (
          <div className="px-4 py-3 text-xs text-zinc-400">履歴がありません</div>
        ) : (
          history.map((entry) => (
            <div key={entry.id} className="px-4 py-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-display text-white">{entry.cards?.name ?? "-"}</span>
                <span className="text-xs text-neon-yellow">
                  {RARITY_LABELS[entry.cards?.rarity ?? ""] ?? entry.cards?.rarity ?? "-"}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[0.7rem] text-zinc-400">
                <span>
                  {entry.gachas?.name ?? ""} ({entry.gachas?.ticket_types?.code ?? ""})
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(entry.created_at).toLocaleString("ja-JP")}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

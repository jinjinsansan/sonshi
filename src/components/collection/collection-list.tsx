"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

type CollectionItem = {
  card_id: string;
  serial_number: number;
  obtained_at: string | null;
  cards: {
    id: string;
    name: string;
    rarity: string;
    description: string | null;
    image_url: string | null;
    max_supply: number | null;
    current_supply: number | null;
    person_name: string | null;
    card_style: string | null;
  } | null;
};

type ApiResponse = {
  totalOwned: number;
  distinctOwned: number;
  totalAvailable: number;
  collection: CollectionItem[];
  cards: { id: string; name: string; rarity: string; image_url: string | null }[];
};

const RARITY_LABELS: Record<string, string> = {
  N: "N",
  R: "R",
  SR: "SR",
  SSR: "SSR",
  UR: "UR",
};

export function CollectionList() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [sort, setSort] = useState<"recent" | "rarity" | "name">("recent");

  useEffect(() => {
    let mounted = true;
    fetch("/api/collection")
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error ?? "取得に失敗しました");
        return json as ApiResponse;
      })
      .then((payload) => {
        if (mounted) setData(payload);
      })
      .catch((err: Error) => {
        if (mounted) setError(err.message);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    const lower = keyword.toLowerCase();
    const list = data.collection.filter((item) => {
      const name = item.cards?.name?.toLowerCase() ?? "";
      return name.includes(lower);
    });

    if (sort === "rarity") {
      return list.sort((a, b) => (b.cards?.rarity ?? "").localeCompare(a.cards?.rarity ?? ""));
    }
    if (sort === "name") {
      return list.sort((a, b) => (a.cards?.name ?? "").localeCompare(b.cards?.name ?? ""));
    }
    return list.sort((a, b) => (b.obtained_at ?? "").localeCompare(a.obtained_at ?? ""));
  }, [data, keyword, sort]);

  if (error) {
    return <p className="text-sm text-red-400">{error}</p>;
  }

  if (!data) {
    return <p className="text-sm text-zinc-400">ロード中...</p>;
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-white/10 bg-hall-panel/80 p-4 shadow-panel-inset">
        <p className="text-xs uppercase tracking-[0.4em] text-zinc-400">Progress</p>
        <p className="mt-2 text-sm text-zinc-300">
          所持 {data.distinctOwned} / {data.totalAvailable}（総枚数 {data.totalOwned}）
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          className="min-w-[200px] flex-1 rounded-2xl border border-white/10 bg-black/20 px-4 py-2 text-sm text-white outline-none focus:border-neon-blue"
          placeholder="カード名で検索"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as "recent" | "rarity" | "name")}
          className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white"
        >
          <option value="recent">最近取得</option>
          <option value="rarity">レア度順</option>
          <option value="name">名前順</option>
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.length === 0 ? (
          <p className="text-sm text-zinc-400">該当するカードがありません</p>
        ) : (
          filtered.map((item) => {
            const card = item.cards;
            if (!card) return null;
            return (
              <div
                key={`${item.card_id}-${item.serial_number}`}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-hall-panel/80 p-3 shadow-panel-inset"
              >
                {card.image_url ? (
                  <Image
                    src={card.image_url}
                    alt={card.name}
                    width={64}
                    height={64}
                    unoptimized
                    className="h-16 w-16 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-black/30 text-[0.6rem] text-zinc-400">
                    NO IMAGE
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-display text-base text-white">{card.name}</p>
                    <span className="text-xs text-neon-yellow">
                      {RARITY_LABELS[card.rarity] ?? card.rarity}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-400">
                    #{item.serial_number}
                  </p>
                  {card.person_name && (
                    <p className="text-xs text-zinc-500">{card.person_name}</p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

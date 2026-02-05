"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

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

const RARITY_ORDER: Record<string, number> = {
  N: 1,
  R: 2,
  SR: 3,
  SSR: 4,
  UR: 5,
};

export function CollectionList() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [sort, setSort] = useState<"recent" | "rarity" | "name">("recent");
  const [rarityFilter, setRarityFilter] = useState("all");
  const [personFilter, setPersonFilter] = useState("all");
  const [styleFilter, setStyleFilter] = useState("all");

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

  const filterOptions = useMemo(() => {
    if (!data) {
      return { persons: [], styles: [], rarities: [] };
    }
    const persons = Array.from(
      new Set(
        data.collection
          .map((item) => item.cards?.person_name)
          .filter((value): value is string => Boolean(value))
      )
    ).sort();
    const styles = Array.from(
      new Set(
        data.collection
          .map((item) => item.cards?.card_style)
          .filter((value): value is string => Boolean(value))
      )
    ).sort();
    const rarities = Array.from(
      new Set(
        data.collection
          .map((item) => item.cards?.rarity)
          .filter((value): value is string => Boolean(value))
      )
    ).sort((a, b) => (RARITY_ORDER[b] ?? 0) - (RARITY_ORDER[a] ?? 0));

    return { persons, styles, rarities };
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const lower = keyword.toLowerCase();
    const list = data.collection.filter((item) => {
      const name = item.cards?.name?.toLowerCase() ?? "";
      const rarity = item.cards?.rarity ?? "";
      const person = item.cards?.person_name ?? "";
      const style = item.cards?.card_style ?? "";
      const matchesKeyword = name.includes(lower);
      const matchesRarity = rarityFilter === "all" || rarity === rarityFilter;
      const matchesPerson = personFilter === "all" || person === personFilter;
      const matchesStyle = styleFilter === "all" || style === styleFilter;
      return matchesKeyword && matchesRarity && matchesPerson && matchesStyle;
    });

    if (sort === "rarity") {
      return list.sort(
        (a, b) => (RARITY_ORDER[b.cards?.rarity ?? ""] ?? 0) - (RARITY_ORDER[a.cards?.rarity ?? ""] ?? 0)
      );
    }
    if (sort === "name") {
      return list.sort((a, b) => (a.cards?.name ?? "").localeCompare(b.cards?.name ?? ""));
    }
    return list.sort((a, b) => (b.obtained_at ?? "").localeCompare(a.obtained_at ?? ""));
  }, [data, keyword, sort, rarityFilter, personFilter, styleFilter]);

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
          value={rarityFilter}
          onChange={(e) => setRarityFilter(e.target.value)}
          className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white"
        >
          <option value="all">レア度</option>
          {filterOptions.rarities.map((rarity) => (
            <option key={rarity} value={rarity}>
              {RARITY_LABELS[rarity] ?? rarity}
            </option>
          ))}
        </select>
        <select
          value={personFilter}
          onChange={(e) => setPersonFilter(e.target.value)}
          className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white"
        >
          <option value="all">人物</option>
          {filterOptions.persons.map((person) => (
            <option key={person} value={person}>
              {person}
            </option>
          ))}
        </select>
        <select
          value={styleFilter}
          onChange={(e) => setStyleFilter(e.target.value)}
          className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white"
        >
          <option value="all">スタイル</option>
          {filterOptions.styles.map((style) => (
            <option key={style} value={style}>
              {style}
            </option>
          ))}
        </select>
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
              <Link
                key={`${item.card_id}-${item.serial_number}`}
                href={`/collection/${item.card_id}`}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-hall-panel/80 p-3 shadow-panel-inset transition hover:border-neon-blue"
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
                  {(card.person_name || card.card_style) && (
                    <p className="text-xs text-zinc-500">
                      {card.person_name ?? ""}
                      {card.person_name && card.card_style ? " / " : ""}
                      {card.card_style ?? ""}
                    </p>
                  )}
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

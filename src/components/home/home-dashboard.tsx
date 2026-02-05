"use client";

import Link from "next/link";
import { LoginBonusCard } from "@/components/home/login-bonus-card";
import { TicketBalanceCarousel } from "@/components/home/ticket-balance-carousel";
import { useMainApp } from "@/components/providers/main-app-provider";
import { GACHA_DEFINITIONS } from "@/constants/gacha";
import { canonicalizeGachaId } from "@/lib/utils/gacha";
import type { TicketBalanceItem } from "@/lib/utils/tickets";

const FALLBACK_TICKETS: TicketBalanceItem[] = [
  { code: "free", name: "フリーチケット", quantity: 0, colorToken: "neon-blue", sortOrder: 0 },
  { code: "basic", name: "ベーシック", quantity: 0, colorToken: "neon-yellow", sortOrder: 1 },
  { code: "epic", name: "エピック", quantity: 0, colorToken: "neon-pink", sortOrder: 2 },
  { code: "premium", name: "プレミアム", quantity: 0, colorToken: "neon-purple", sortOrder: 3 },
  { code: "ex", name: "EX", quantity: 0, colorToken: "glow-green", sortOrder: 4 },
];

const RARITY_LABELS = ["N", "R", "SR", "SSR", "UR"];

function formatRarity(range: [number, number]) {
  const label = (value: number) => RARITY_LABELS[value - 1] ?? `★${value}`;
  return `${label(range[0])}〜${label(range[1])}`;
}

export function HomeDashboard() {
  const { snapshot } = useMainApp();
  const tickets = snapshot.tickets.length > 0 ? snapshot.tickets : FALLBACK_TICKETS;
  const tiers = snapshot.gachaCatalog.length > 0 ? snapshot.gachaCatalog : GACHA_DEFINITIONS;

  return (
    <section className="mx-auto w-full max-w-md space-y-10">
      <div className="space-y-3 rounded-3xl border border-white/10 bg-black/30 px-6 py-7 shadow-[0_20px_45px_rgba(0,0,0,0.45)]">
        <p className="text-xs uppercase tracking-[0.5em] text-neon-yellow">SONSHI HALL</p>
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl text-white">ネオンホールダッシュボード</h1>
            <p className="mt-2 text-sm text-zinc-300">
              チケット残高と開催中のガチャ熱をまとめて確認。ホールの最新状態をここで把握できます。
            </p>
          </div>
          <Link
            href="/mypage"
            className="rounded-full border border-white/20 px-4 py-2 text-[10px] uppercase tracking-[0.4em] text-white/80 transition hover:border-neon-blue hover:text-white"
          >
            MYPAGE
          </Link>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <div className="space-y-1">
            <p className="uppercase tracking-[0.4em] text-neon-yellow">Tickets</p>
            <p>本日のチケット残高</p>
          </div>
          <Link href="/mypage/tickets" className="text-xs uppercase tracking-[0.35em] text-neon-blue">
            履歴を見る
          </Link>
        </div>
        <TicketBalanceCarousel tickets={tickets} />
      </section>

      <section className="space-y-3">
        <p className="text-xs uppercase tracking-[0.4em] text-neon-yellow">Login Bonus</p>
        <LoginBonusCard />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-neon-yellow">Gacha Lineup</p>
            <h2 className="font-display text-2xl text-white">開催中のガチャ</h2>
          </div>
          <Link href="/gacha" className="text-xs uppercase tracking-[0.35em] text-neon-blue">
            もっと見る
          </Link>
        </div>
        <div className="space-y-4">
          {tiers.map((tier) => {
            const slug = canonicalizeGachaId(tier.id) ?? tier.id;
            return (
              <article
                key={tier.id}
                className={`relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${tier.gradient} p-6 shadow-panel-inset`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xl text-white">{tier.name}ガチャ</h3>
                  <span className="text-xs uppercase tracking-[0.3em] text-neon-blue">
                    {formatRarity(tier.rarityRange)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-zinc-200">
                  {tier.description || "ネオンホールの最新ラインナップです。"}
                </p>
                {tier.featuredNote && (
                  <p className="mt-2 text-[11px] uppercase tracking-[0.35em] text-yellow-200">{tier.featuredNote}</p>
                )}
                <div className="mt-4 flex items-center justify-between text-xs text-zinc-300">
                  <span>{tier.ticketLabel}</span>
                  <span>{tier.priceLabel || "TICKET"}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/gacha/${slug}`}
                    className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-neon-pink to-neon-yellow px-5 py-2 text-xs uppercase tracking-[0.35em] text-black shadow-neon"
                  >
                    1回ガチャ
                  </Link>
                  <Link
                    href="/gacha/multi"
                    className="inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-2 text-xs uppercase tracking-[0.35em] text-white/80 transition hover:border-neon-blue hover:text-white"
                  >
                    10連ガチャ
                  </Link>
                  <Link
                    href={`/gacha/${slug}#rates`}
                    className="inline-flex items-center justify-center rounded-full border border-transparent px-5 py-2 text-xs uppercase tracking-[0.35em] text-white/80 underline-offset-4 hover:text-white hover:underline"
                  >
                    提供割合
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <Link
        href="/mypage/tickets"
        className="flex h-14 items-center justify-center rounded-full bg-gradient-to-r from-neon-pink to-neon-yellow text-sm uppercase tracking-[0.35em] text-black shadow-neon transition hover:opacity-90"
      >
        チケット購入へ
      </Link>
    </section>
  );
}

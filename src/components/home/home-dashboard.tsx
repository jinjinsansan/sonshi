"use client";

import Image from "next/image";
import Link from "next/link";
import { LoginBonusCard } from "@/components/home/login-bonus-card";
import { TicketBalanceCarousel } from "@/components/home/ticket-balance-carousel";
import { useMainApp } from "@/components/providers/main-app-provider";
import { GACHA_DEFINITIONS } from "@/constants/gacha";
import { useLoginBonus } from "@/hooks/use-login-bonus";
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

function getTicketColor(ticketLabel?: string | null) {
  if (!ticketLabel) return { bg: "from-[#1d0b2b] to-[#070109]", accent: "text-white" };
  const key = canonicalizeGachaId(ticketLabel) ?? "";
  switch (key) {
    case "free":
      return { bg: "from-[#061130] to-[#04050e]", accent: "text-neon-blue" };
    case "basic":
      return { bg: "from-[#2a1a02] via-[#3f2607] to-[#0b0502]", accent: "text-amber-200" };
    case "epic":
      return { bg: "from-[#2b0013] via-[#45011f] to-[#080006]", accent: "text-rose-200" };
    case "premium":
      return { bg: "from-[#1c0030] via-[#2b014a] to-[#05000a]", accent: "text-purple-200" };
    case "ex":
      return { bg: "from-[#012b1a] via-[#024031] to-[#010c06]", accent: "text-green-200" };
    default:
      return { bg: "from-[#160a1d] via-[#1f0f2c] to-[#050107]", accent: "text-white" };
  }
}

export function HomeDashboard() {
  const { snapshot } = useMainApp();
  const tickets = snapshot.tickets.length > 0 ? snapshot.tickets : FALLBACK_TICKETS;
  const tiers = snapshot.gachaCatalog.length > 0 ? snapshot.gachaCatalog : GACHA_DEFINITIONS;
  const loginBonus = useLoginBonus();

  return (
    <section className="mx-auto w-full max-w-md space-y-10">
      <h1 className="font-display text-4xl tracking-[0.05em] text-transparent drop-shadow-[0_0_25px_rgba(255,246,92,0.35)] bg-gradient-to-r from-[#fff65c] via-[#ff9b3d] to-[#ff2d95] bg-clip-text">
        チケットホール
      </h1>

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
        <LoginBonusCard state={loginBonus.state} claiming={loginBonus.claiming} onClaim={loginBonus.claim} />
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-neon-yellow">Ticket Inventory</p>
          <h2 className="font-display text-2xl text-white">保有チケット</h2>
        </div>
        <div className="space-y-4">
          {tiers.map((tier) => {
            const slug = canonicalizeGachaId(tier.id) ?? tier.id;
            const ticketKey = canonicalizeGachaId(tier.ticketLabel ?? "");
            const isFreeGacha = slug === "free" || ticketKey === "free" || tier.name.includes("フリー");

            if (slug === "basic") {
              const ticketColors = getTicketColor(tier.ticketLabel);
              return (
                <article
                  key={tier.id}
                  className={`flex items-center justify-between gap-4 rounded-3xl border border-white/12 bg-gradient-to-br ${ticketColors.bg} px-5 py-4 shadow-panel-inset`}
                >
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.4em] text-amber-300">1階フロア</p>
                    <h3 className="font-display text-xl text-white">1階ガチャ</h3>
                    <p className="text-[0.75rem] text-white/70">スタンダードなネオン演出がお楽しみいただけます。</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-display text-white">BASIC</p>
                      <span className="text-[0.7rem] text-amber-200/80">TICKET FLOOR</span>
                    </div>
                    <div className="flex gap-2 text-[0.65rem] text-amber-100/90">
                      <span className="rounded-full border border-white/20 px-3 py-1 uppercase tracking-[0.35em]">
                        {formatRarity(tier.rarityRange)}
                      </span>
                      <span className="rounded-full border border-white/10 px-3 py-1 uppercase tracking-[0.35em]">
                        1st FLOOR
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative h-16 w-32">
                      <Image
                        src="/ticket-illustration-basic.svg"
                        alt="Basic ticket"
                        fill
                        sizes="128px"
                        className="object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.4)]"
                      />
                    </div>
                    <Link
                      href={`/gacha/${slug}`}
                      className="inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-2 text-[0.7rem] uppercase tracking-[0.35em] text-white/85 transition hover:border-neon-yellow hover:text-white"
                    >
                      ガチャへ
                    </Link>
                  </div>
                </article>
              );
            }

            if (slug === "epic") {
              return (
                <article
                  key={tier.id}
                  className="flex items-center gap-5 rounded-3xl border border-white/12 bg-gradient-to-br from-[#2b0014] via-[#430029] to-[#070008] px-5 py-4 shadow-panel-inset"
                >
                  <div className="flex-1 space-y-2">
                    <p className="text-xs uppercase tracking-[0.4em] text-rose-200">2階フロア</p>
                    <h3 className="font-display text-xl text-white">2階ガチャ</h3>
                    <p className="text-[0.75rem] text-white/75">熱量が一気に上がるエピック演出。ライティングが濃い贅沢空間を再現。</p>
                    <div className="flex items-center gap-3 text-[0.65rem] text-white/80">
                      <span className="rounded-full border border-white/20 px-3 py-1 uppercase tracking-[0.35em]">
                        {formatRarity(tier.rarityRange)}
                      </span>
                      <span className="rounded-full border border-white/10 px-3 py-1 uppercase tracking-[0.35em] text-rose-200">
                        2nd FLOOR
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative h-20 w-32">
                      <Image
                        src="/ticket-illustration-epic.svg"
                        alt="Epic ticket"
                        fill
                        sizes="128px"
                        className="object-contain drop-shadow-[0_25px_35px_rgba(0,0,0,0.45)]"
                      />
                    </div>
                    <Link
                      href={`/gacha/${slug}`}
                      className="inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-2 text-[0.7rem] uppercase tracking-[0.35em] text-white/85 transition hover:border-neon-pink hover:text-white"
                    >
                      ガチャへ
                    </Link>
                  </div>
                </article>
              );
            }

            if (slug === "premium") {
              return (
                <article
                  key={tier.id}
                  className="flex items-center gap-5 rounded-3xl border border-white/12 bg-gradient-to-br from-[#1c0030] via-[#2f0150] to-[#05000a] px-5 py-4 shadow-panel-inset"
                >
                  <div className="flex-1 space-y-2">
                    <p className="text-xs uppercase tracking-[0.4em] text-purple-200">3階フロア</p>
                    <h3 className="font-display text-xl text-white">3階ガチャ</h3>
                    <p className="text-[0.75rem] text-white/75">光と霧が交差するプレミアムフロア。重厚な演出と希少カードが待っています。</p>
                    <div className="flex items-center gap-3 text-[0.65rem] text-white/80">
                      <span className="rounded-full border border-white/20 px-3 py-1 uppercase tracking-[0.35em]">
                        {formatRarity(tier.rarityRange)}
                      </span>
                      <span className="rounded-full border border-white/10 px-3 py-1 uppercase tracking-[0.35em] text-purple-200">
                        3rd FLOOR
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative h-20 w-32">
                      <Image
                        src="/ticket-illustration-premium.svg"
                        alt="Premium ticket"
                        fill
                        sizes="136px"
                        className="object-contain drop-shadow-[0_28px_38px_rgba(0,0,0,0.5)]"
                      />
                    </div>
                    <Link
                      href={`/gacha/${slug}`}
                      className="inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-2 text-[0.7rem] uppercase tracking-[0.35em] text-white/85 transition hover:border-neon-purple hover:text-white"
                    >
                      ガチャへ
                    </Link>
                  </div>
                </article>
              );
            }

            if (slug === "ex") {
              return (
                <article
                  key={tier.id}
                  className="flex items-center gap-5 rounded-3xl border border-white/12 bg-gradient-to-br from-[#032415] via-[#064030] to-[#010b06] px-5 py-4 shadow-panel-inset"
                >
                  <div className="flex-1 space-y-2">
                    <p className="text-xs uppercase tracking-[0.4em] text-emerald-200">VIPフロア</p>
                    <h3 className="font-display text-xl text-white">VIPガチャ</h3>
                    <p className="text-[0.75rem] text-white/75">最上階のプライベートホール。フィナーレ演出とEXカードがここで待っています。</p>
                    <div className="flex items-center gap-3 text-[0.65rem] text-white/80">
                      <span className="rounded-full border border-white/20 px-3 py-1 uppercase tracking-[0.35em]">
                        {formatRarity(tier.rarityRange)}
                      </span>
                      <span className="rounded-full border border-white/10 px-3 py-1 uppercase tracking-[0.35em] text-emerald-200">
                        VIP FLOOR
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative h-20 w-32">
                      <Image
                        src="/ticket-illustration-vip.svg"
                        alt="VIP ticket"
                        fill
                        sizes="136px"
                        className="object-contain drop-shadow-[0_32px_40px_rgba(0,0,0,0.55)]"
                      />
                    </div>
                    <Link
                      href={`/gacha/${slug}`}
                      className="inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-2 text-[0.7rem] uppercase tracking-[0.35em] text-white/85 transition hover:border-green-300 hover:text-white"
                    >
                      ガチャへ
                    </Link>
                  </div>
                </article>
              );
            }

            if (isFreeGacha) {
              return (
                <article
                  key={tier.id}
                  className="flex items-center justify-between gap-4 rounded-3xl border border-white/10 bg-gradient-to-br from-[#0b0416] via-[#1a0a22] to-[#050006] px-5 py-4 shadow-panel-inset"
                >
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.4em] text-neon-yellow">FREE GACHA</p>
                    <h3 className="font-display text-xl text-white">フリーガチャ</h3>
                    <p className="text-[0.75rem] text-white/70">ログインボーナスのチケットで挑戦できます。</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-4xl font-display text-white">{loginBonus.state.quantity ?? 0}</p>
                      <span className="text-[0.7rem] text-zinc-300">LOGIN BONUS TICKETS</span>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-[0.55rem] uppercase tracking-[0.4em] ${
                        loginBonus.state.claimed ? "bg-lime-300/20 text-lime-200" : "bg-amber-300/20 text-amber-200"
                      }`}
                    >
                      {loginBonus.state.claimed ? "CLAIMED" : "READY"}
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative h-16 w-28">
                      <Image
                        src="/ticket-illustration.svg"
                        alt="Free ticket"
                        fill
                        sizes="112px"
                        className="object-contain drop-shadow-[0_15px_25px_rgba(0,0,0,0.35)]"
                      />
                    </div>
                    <Link
                      href={`/gacha/${slug}`}
                      className="inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-2 text-[0.7rem] uppercase tracking-[0.35em] text-white/80 transition hover:border-neon-blue hover:text-white"
                    >
                      ガチャへ
                    </Link>
                  </div>
                </article>
              );
            }

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
        className="flex h-14 items-center justify-center rounded-full bg-[#ffe347] text-sm font-semibold uppercase tracking-[0.35em] text-[#2a1000] transition hover:bg-[#ffef7a]"
      >
        チケット購入へ
      </Link>
    </section>
  );
}

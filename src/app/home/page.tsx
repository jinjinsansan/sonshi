import Link from "next/link";
import { LoginBonusCard } from "@/components/home/login-bonus-card";
import { TicketBalanceCarousel } from "@/components/home/ticket-balance-carousel";
import { GACHA_DEFINITIONS } from "@/constants/gacha";
import { fetchGachaCatalog } from "@/lib/utils/gacha";
import { fetchTicketBalances, type TicketBalanceItem } from "@/lib/utils/tickets";

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

export default async function SonshiHome() {
  const [ticketBalances, gachaTiers] = await Promise.all([
    fetchTicketBalances().catch(() => FALLBACK_TICKETS),
    fetchGachaCatalog().catch(() => GACHA_DEFINITIONS),
  ]);

  const tickets = ticketBalances.length > 0 ? ticketBalances : FALLBACK_TICKETS;
  const tiers = gachaTiers.length > 0 ? gachaTiers : GACHA_DEFINITIONS;

  return (
    <section className="space-y-10">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.6em] text-neon-yellow">HOME FLOOR</p>
        <h1 className="font-display text-3xl text-white">ホールダッシュボード</h1>
        <p className="text-sm text-zinc-300">チケット残高と開催中のガチャをまとめて確認できます。</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.4em] text-zinc-400">
          <span>Tickets</span>
          <Link href="/menu" className="text-neon-blue">
            履歴を見る
          </Link>
        </div>
        <TicketBalanceCarousel tickets={tickets} />
      </div>

      <LoginBonusCard />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl text-white">開催中のガチャ</h2>
          <Link href="/gacha" className="text-xs uppercase tracking-[0.35em] text-neon-yellow">
            もっと見る
          </Link>
        </div>
        <div className="space-y-4">
          {tiers.map((tier) => (
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
                <p className="mt-2 text-xs uppercase tracking-[0.4em] text-neon-yellow">
                  {tier.featuredNote}
                </p>
              )}
              <div className="mt-4 flex items-center justify-between text-xs text-zinc-300">
                <span>{tier.ticketLabel}</span>
                <span>{tier.priceLabel || "TICKET"}</span>
              </div>
              <div className="mt-4">
                <Link
                  href="/gacha"
                  className="inline-flex items-center justify-center rounded-full border border-white/15 px-5 py-2 text-xs uppercase tracking-[0.35em] text-white/80 transition hover:border-neon-blue hover:text-white"
                >
                  ガチャへ
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";
import Image from "next/image";
import { GACHA_DEFINITIONS } from "@/constants/gacha";
import { canonicalizeGachaId, fetchGachaCatalog } from "@/lib/utils/gacha";
import { TicketBalanceCarousel } from "@/components/home/ticket-balance-carousel";
import { fetchTicketBalances, type TicketBalanceItem } from "@/lib/utils/tickets";

const RARITY_LABELS = ["N", "R", "SR", "SSR", "UR"];

const FALLBACK_TICKETS: TicketBalanceItem[] = [
  { code: "free", name: "フリーチケット", quantity: 0, colorToken: "neon-blue", sortOrder: 0 },
  { code: "basic", name: "ベーシック", quantity: 0, colorToken: "neon-yellow", sortOrder: 1 },
  { code: "epic", name: "エピック", quantity: 0, colorToken: "neon-pink", sortOrder: 2 },
  { code: "premium", name: "プレミアム", quantity: 0, colorToken: "neon-purple", sortOrder: 3 },
  { code: "ex", name: "EX", quantity: 0, colorToken: "glow-green", sortOrder: 4 },
];

function formatRarity(range: [number, number]) {
  const label = (value: number) => RARITY_LABELS[value - 1] ?? `★${value}`;
  return `${label(range[0])}〜${label(range[1])}`;
}

const FLOOR_ORDER = ["free", "basic", "epic", "premium", "ex"];

function getIllustrationSrc(code: string) {
  switch (code) {
    case "free":
      return "/ticket-illustration.svg";
    case "basic":
      return "/ticket-illustration-basic.svg";
    case "epic":
      return "/ticket-illustration-epic.svg";
    case "premium":
      return "/ticket-illustration-premium.svg";
    case "ex":
      return "/ticket-illustration-vip.svg";
    default:
      return "/ticket-illustration.svg";
  }
}

const FLOOR_META: Record<
  string,
  {
    badge: string;
    title: string;
    subtitle: string;
    gradient: string;
    accent: string;
    description: string;
  }
> = {
  free: {
    badge: "text-neon-blue",
    title: "フリーガチャ",
    subtitle: "FREE FLOOR",
    gradient: "from-[#061430] via-[#0c1f49] to-[#05060e]",
    accent: "text-neon-blue",
    description: "ログインボーナスで入場できる定番フロア。",
  },
  basic: {
    badge: "text-amber-200",
    title: "1階ガチャ",
    subtitle: "1ST FLOOR",
    gradient: "from-[#2a1a02] via-[#3f2607] to-[#0b0502]",
    accent: "text-amber-200",
    description: "スタンダードな演出が味わえる基本フロア。",
  },
  epic: {
    badge: "text-rose-200",
    title: "2階ガチャ",
    subtitle: "2ND FLOOR",
    gradient: "from-[#2b0014] via-[#430029] to-[#070008]",
    accent: "text-rose-200",
    description: "エピック演出が連続する上級フロア。",
  },
  premium: {
    badge: "text-purple-200",
    title: "3階ガチャ",
    subtitle: "3RD FLOOR",
    gradient: "from-[#1c0030] via-[#2f0150] to-[#05000a]",
    accent: "text-purple-200",
    description: "プレミアム演出に特化した上階フロア。",
  },
  ex: {
    badge: "text-emerald-200",
    title: "VIPガチャ",
    subtitle: "VIP FLOOR",
    gradient: "from-[#032415] via-[#064030] to-[#010b06]",
    accent: "text-emerald-200",
    description: "最高峰のVIP演出が堪能できる最上階。",
  },
};

export default async function GachaPage() {
  const [catalog, ticketBalances] = await Promise.all([
    fetchGachaCatalog().catch(() => GACHA_DEFINITIONS),
    fetchTicketBalances().catch(() => FALLBACK_TICKETS),
  ]);
  const items = catalog.length > 0 ? catalog : GACHA_DEFINITIONS;
  const tickets = ticketBalances.length > 0 ? ticketBalances : FALLBACK_TICKETS;

  const floorCards = FLOOR_ORDER.map((floorId) => {
    const match = items.find((item) => canonicalizeGachaId(item.id) === floorId) ?? null;
    const slug = match ? canonicalizeGachaId(match.id) ?? match.id : floorId;
    return { floorId, match, slug };
  });

  return (
    <section className="space-y-10">
      <h1 className="font-display text-4xl tracking-[0.05em] text-transparent drop-shadow-[0_0_25px_rgba(255,246,92,0.35)] bg-gradient-to-r from-[#fff65c] via-[#ff9b3d] to-[#ff2d95] bg-clip-text">
        ガチャホール
      </h1>

      <section className="space-y-3 rounded-3xl border border-white/10 bg-black/30 px-5 py-5">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-neon-yellow">
          <span>Tickets</span>
          <Link href="/mypage/tickets" className="text-[11px] text-neon-blue">
            残高履歴
          </Link>
        </div>
        <TicketBalanceCarousel tickets={tickets} />
      </section>

      <section className="space-y-4">
        {floorCards.map(({ floorId, match, slug }) => {
          const meta = FLOOR_META[floorId];
          if (!meta) return null;
          return (
            <article
              key={floorId}
              className={`flex flex-col gap-5 rounded-3xl border border-white/12 bg-gradient-to-br ${meta.gradient} px-6 py-5 shadow-panel-inset`}
            >
              <div className="flex flex-col gap-2">
                <p className={`text-[0.55rem] uppercase tracking-[0.45em] ${meta.badge}`}>{meta.subtitle}</p>
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-2xl text-white">{meta.title}</h2>
                  <span className="text-xs uppercase tracking-[0.35em] text-white/80">
                    {match ? formatRarity(match.rarityRange) : "---"}
                  </span>
                </div>
                <p className="text-sm text-white/75">{match?.description || meta.description}</p>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm text-white/70">
                  <p>{match?.ticketLabel ?? "TICKET"}</p>
                  <p>{match?.priceLabel ?? ""}</p>
                </div>
                <div className="flex items-baseline gap-2">
                  <Link
                    href={`/gacha/${slug}`}
                    className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-neon-pink to-neon-yellow px-5 py-2 text-xs uppercase tracking-[0.35em] text-black shadow-neon"
                  >
                    ガチャへ
                  </Link>
                  <Link
                    href={`/gacha/${slug}#rates`}
                    className="inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-2 text-xs uppercase tracking-[0.35em] text-white/80"
                  >
                    提供割合
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="relative h-16 w-32">
                  <Image
                    src={getIllustrationSrc(floorId)}
                    alt={`${meta.title} ticket`}
                    fill
                    sizes="128px"
                    className="object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.45)]"
                  />
                </div>
                {match?.featuredNote ? (
                  <span className="text-xs uppercase tracking-[0.3em] text-neon-yellow">{match.featuredNote}</span>
                ) : null}
              </div>
            </article>
          );
        })}
      </section>

      <Link
        href="/purchase"
        className="flex h-14 items-center justify-center rounded-full bg-[#ffe347] text-sm font-semibold uppercase tracking-[0.35em] text-[#2a1000] transition hover:bg-[#ffef7a]"
      >
        チケット購入へ
      </Link>
    </section>
  );
}

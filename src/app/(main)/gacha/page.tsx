import Image from "next/image";
import Link from "next/link";
import { TicketBalanceCarousel } from "@/components/home/ticket-balance-carousel";
import { fetchTicketBalances, type TicketBalanceItem } from "@/lib/utils/tickets";
import { GachaV4Player } from "@/components/gacha/gacha-v4-player";

const FALLBACK_TICKETS: TicketBalanceItem[] = [
  { code: "free", name: "フリーチケット", quantity: 0, colorToken: "neon-blue", sortOrder: 0 },
  { code: "basic", name: "ベーシックチケット", quantity: 0, colorToken: "neon-yellow", sortOrder: 1 },
  { code: "epic", name: "エピックチケット", quantity: 0, colorToken: "neon-pink", sortOrder: 2 },
  { code: "premium", name: "プレミアムチケット", quantity: 0, colorToken: "neon-purple", sortOrder: 3 },
  { code: "ex", name: "EXチケット", quantity: 0, colorToken: "glow-green", sortOrder: 4 },
];

const GACHA_CARDS = [
  {
    id: "ito",
    title: "伊藤ガチャ",
    description:
      "いつも仕事を失敗ばかりしてしまう伊藤は超厳しい尊師に認めてもらうことが出来るのか？",
    ticketNote: "ガチャは１チケット消費します",
    icon: "/ito.png",
    badge: "text-neon-blue",
    accent: "from-[#3bd9ff]/35 via-transparent to-transparent",
  },
  {
    id: "kanda",
    title: "神田ガチャ",
    description:
      "世紀末覇者カンダと戦に挑むバトルチャレンジガチャ神田を倒すことが出来るのか？",
    ticketNote: "ガチャは１チケットを消費します",
    icon: null,
    badge: "text-rose-200",
    accent: "from-[#ff6b6b]/30 via-transparent to-transparent",
    ribbon: "準備中",
  },
];

function DisabledRoundButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      disabled
      className="group relative h-32 w-32 cursor-not-allowed rounded-full opacity-50"
    >
      <div className="absolute inset-0 rounded-full border-[5px] border-zinc-500 bg-black shadow-[0_0_18px_rgba(0,0,0,0.6)]" />
      <div className="absolute inset-3 rounded-full border border-zinc-600 bg-gradient-to-b from-zinc-200 via-zinc-400 to-zinc-500 shadow-[inset_0_3px_6px_rgba(255,255,255,0.85),inset_0_-3px_6px_rgba(0,0,0,0.55),0_6px_12px_rgba(0,0,0,0.6)]" />
      <div className="absolute inset-0 flex flex-col items-center justify-center px-3 text-center">
        <span className="relative z-10 text-[0.7rem] font-bold leading-tight tracking-[0.12em] text-zinc-800 drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]">
          {label}
        </span>
        <span className="relative z-10 mt-1 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-700">
          START
        </span>
      </div>
      <div className="absolute inset-3 rounded-full bg-gradient-to-br from-white/50 to-transparent opacity-60 pointer-events-none" />
    </button>
  );
}

export default async function GachaPage() {
  const ticketBalances = await fetchTicketBalances().catch(() => FALLBACK_TICKETS);
  const tickets = ticketBalances.length > 0 ? ticketBalances : FALLBACK_TICKETS;

  return (
    <section className="space-y-10">
      <div className="space-y-2 text-center">
        <div className="relative inline-block">
          <div className="absolute -inset-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-pink-500/15 blur-2xl" />
          <h1 className="relative font-display text-5xl font-bold tracking-[0.05em] text-transparent bg-gradient-to-r from-[#fff65c] via-[#ff9b3d] to-[#ff2d95] bg-clip-text drop-shadow-[0_0_50px_rgba(255,246,92,0.8)] drop-shadow-[0_0_90px_rgba(255,157,61,0.6)] drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]">
            ガチャホール
          </h1>
        </div>
        <p className="text-sm text-white/70">尊師と仲間たちのカードをコレクションしよう</p>
      </div>

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
        {GACHA_CARDS.map((card) => (
          <article
            key={card.id}
            className="relative overflow-hidden rounded-3xl border border-white/12 px-6 py-6 shadow-[0_20px_55px_rgba(0,0,0,0.55)]"
          >
            <div className="absolute inset-0 bg-white/5 backdrop-blur-xl" />
            <div className={`absolute inset-0 bg-gradient-to-br ${card.accent}`} />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),transparent_60%)]" />
            <div className="absolute inset-0 border border-white/10" />
            {card.ribbon ? (
              <div className="absolute right-[-70px] top-6 z-20 rotate-45 border border-white/20 bg-white/10 px-16 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-white/80 backdrop-blur-md shadow-[0_10px_25px_rgba(0,0,0,0.35)]">
                {card.ribbon}
              </div>
            ) : null}
            <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {card.icon ? (
                    <div className="relative h-12 w-12 overflow-hidden rounded-full border border-white/30 bg-white/10 shadow-[0_0_20px_rgba(59,217,255,0.35)]">
                      <Image src={card.icon} alt={`${card.title} アイコン`} fill sizes="48px" className="object-cover" />
                    </div>
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-[10px] font-semibold text-white/70">
                      準備中
                    </div>
                  )}
                  <div>
                    <p className={`inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.35em] ${card.badge}`}>
                      GACHA
                    </p>
                    <h3 className="mt-2 font-display text-2xl text-white">{card.title}</h3>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-white/85">{card.description}</p>
                <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[0.7rem] text-white/75">
                  {card.ticketNote}
                </span>
              </div>
              <div className="flex w-full justify-center sm:w-auto sm:justify-end">
                {card.id === "kanda" ? (
                  <DisabledRoundButton label="ガチャを始める" />
                ) : (
                  <GachaV4Player playLabel="ガチャを始める" playVariant="round" />
                )}
              </div>
            </div>
          </article>
        ))}
      </section>

    </section>
  );
}

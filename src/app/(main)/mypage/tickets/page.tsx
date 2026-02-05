import Link from "next/link";
import { LoginBonusCard } from "@/components/home/login-bonus-card";
import { TicketBalanceCarousel } from "@/components/home/ticket-balance-carousel";
import { getServerAuthUser } from "@/lib/auth/session";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { loadTicketBalances } from "@/lib/data/tickets";
import { redirect } from "next/navigation";

const PACKS = [
  {
    name: "BOOST 5",
    tickets: 5,
    price: "¥1,200 (予定)",
    note: "one.lat決済と連動予定",
    available: false,
  },
  {
    name: "DELUXE 10",
    tickets: 10,
    price: "¥2,200 (予定)",
    note: "購入で限定演出アンロック",
    available: false,
  },
  {
    name: "ULTRA 30",
    tickets: 30,
    price: "¥5,800 (予定)",
    note: "SR+1確定チケットを同梱予定",
    available: false,
  },
];

type TicketEvent = {
  label: string;
  amount: number;
  date: string;
  meta: string;
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("ja-JP", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default async function TicketPage() {
  const user = await getServerAuthUser();
  if (!user) {
    redirect("/login");
  }

  const supabase = getSupabaseServiceClient();
  const [tickets, bonusClaimsResult, referralRowsResult, lineFollowResult] = await Promise.all([
    loadTicketBalances(user.id),
    supabase
      .from("login_bonus_claims")
      .select("claimed_at")
      .eq("user_id", user.id)
      .order("claimed_at", { ascending: false })
      .limit(10),
    supabase
      .from("referrals")
      .select("id, referrer_id, referred_id, referral_code, status, ticket_granted, completed_at, created_at")
      .or(`referrer_id.eq.${user.id},referred_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("line_follows")
      .select("ticket_granted, line_user_id, followed_at")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle(),
  ]);

  const bonusEvents: TicketEvent[] = (bonusClaimsResult.data ?? []).map((claim) => ({
    label: "ログインボーナス",
    amount: 1,
    date: claim.claimed_at,
    meta: "FREE TICKET",
  }));

  const referralEvents: TicketEvent[] = (referralRowsResult.data ?? []).flatMap((row) => {
    if (!row.ticket_granted) return [];
    const when = row.completed_at ?? row.created_at ?? new Date().toISOString();
    const entries: TicketEvent[] = [];
    if (row.referrer_id === user.id) {
      entries.push({
        label: "招待ボーナス",
        amount: 1,
        date: when,
        meta: `CODE ${row.referral_code ?? ""}`,
      });
    }
    if (row.referred_id === user.id) {
      entries.push({
        label: "招待特典受取",
        amount: 1,
        date: when,
        meta: `CODE ${row.referral_code ?? ""}`,
      });
    }
    return entries;
  });

  const lineEvents: TicketEvent[] = lineFollowResult.data?.ticket_granted
    ? [
        {
          label: "LINE追加特典",
          amount: 1,
          date: lineFollowResult.data.followed_at ?? new Date().toISOString(),
          meta: lineFollowResult.data.line_user_id
            ? `LINE ${lineFollowResult.data.line_user_id.slice(0, 6)}…`
            : "LINE連携済",
        },
      ]
    : [];

  const ticketEvents = [...bonusEvents, ...referralEvents, ...lineEvents]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.5em] text-neon-yellow">Tickets</p>
          <h1 className="font-display text-3xl text-white">チケット管理</h1>
          <p className="text-sm text-zinc-300">保有チケットと獲得状況をまとめて確認できます。</p>
        </div>
        <Link
          href="/mypage"
          className="inline-flex rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/80 transition hover:border-neon-blue hover:text-white"
        >
          戻る
        </Link>
      </div>

      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.4em] text-zinc-400">Balance</p>
        <TicketBalanceCarousel tickets={tickets} />
      </div>

      <LoginBonusCard />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.4em] text-neon-blue">Ticket Log</p>
          <span className="text-[11px] text-zinc-400">直近 {ticketEvents.length} 件</span>
        </div>
        <div className="space-y-3 rounded-3xl border border-white/10 bg-black/25 p-5 shadow-panel-inset">
          {ticketEvents.length === 0 ? (
            <p className="text-sm text-zinc-400">まだ取得ログがありません。</p>
          ) : (
            ticketEvents.map((event, index) => (
              <div key={`${event.label}-${event.date}-${index}`} className="flex items-center justify-between gap-4 border-b border-white/5 pb-3 last:border-b-0 last:pb-0">
                <div>
                  <p className="font-display text-sm text-white">{event.label}</p>
                  <p className="text-[11px] text-zinc-400">{event.meta}</p>
                </div>
                <div className="text-right text-sm text-neon-yellow">+{event.amount}</div>
                <div className="text-right text-[11px] text-zinc-400">{formatDateTime(event.date)}</div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.4em] text-neon-yellow">Ticket Packs</p>
          <Link href="/purchase" className="text-[11px] uppercase tracking-[0.35em] text-neon-blue">
            詳細を見る
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {PACKS.map((pack) => (
            <div key={pack.name} className="rounded-3xl border border-white/10 bg-black/25 p-5 shadow-panel-inset">
              <p className="text-xs uppercase tracking-[0.4em] text-zinc-400">{pack.name}</p>
              <p className="mt-2 font-display text-3xl text-white">{pack.tickets}</p>
              <p className="text-sm text-zinc-400">TICKETS</p>
              <p className="mt-3 text-sm text-neon-yellow">{pack.price}</p>
              <p className="text-xs text-zinc-500">{pack.note}</p>
              <button
                type="button"
                disabled={!pack.available}
                className="mt-4 w-full rounded-full border border-white/15 px-4 py-2 text-[11px] uppercase tracking-[0.3em] text-white/70 disabled:opacity-60"
              >
                {pack.available ? "購入" : "COMING SOON"}
              </button>
            </div>
          ))}
        </div>
        <p className="text-xs text-zinc-400">
          決済回りはスキップ指示に従い、現在はログインボーナス・紹介・LINE特典でチケットを配布しています。
        </p>
      </section>
    </section>
  );
}

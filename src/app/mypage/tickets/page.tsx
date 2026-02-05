import Link from "next/link";
import { LoginBonusCard } from "@/components/home/login-bonus-card";
import { TicketBalanceCarousel } from "@/components/home/ticket-balance-carousel";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { TicketBalanceItem } from "@/lib/utils/tickets";

const FALLBACK_TICKETS: TicketBalanceItem[] = [
  { code: "free", name: "フリーチケット", quantity: 0, colorToken: null, sortOrder: 1 },
  { code: "paid", name: "有償チケット", quantity: 0, colorToken: null, sortOrder: 2 },
  { code: "bonus", name: "ボーナスチケット", quantity: 0, colorToken: null, sortOrder: 3 },
];

async function loadTicketBalances(): Promise<TicketBalanceItem[]> {
  const supabase = getSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return FALLBACK_TICKETS;
  }

  const { data: ticketTypes, error: ticketTypeError } = await supabase
    .from("ticket_types")
    .select("id, name, code, color, sort_order")
    .order("sort_order", { ascending: true });

  if (ticketTypeError || !ticketTypes) {
    return FALLBACK_TICKETS;
  }

  const { data: balances, error: balanceError } = await supabase
    .from("user_tickets")
    .select("ticket_type_id, quantity")
    .eq("user_id", session.user.id);

  if (balanceError) {
    return FALLBACK_TICKETS;
  }

  const quantityByType = new Map(
    balances?.map((item) => [item.ticket_type_id, item.quantity ?? 0]) ?? []
  );

  const tickets = ticketTypes.map((type, index) => ({
    code: type.code,
    name: type.name,
    colorToken: type.color,
    sortOrder: type.sort_order ?? index,
    quantity: quantityByType.get(type.id) ?? 0,
  }));

  return tickets.length > 0 ? tickets : FALLBACK_TICKETS;
}

export default async function TicketPage() {
  const tickets = await loadTicketBalances();

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

      <div className="rounded-3xl border border-white/10 bg-hall-panel/80 p-5 text-xs text-zinc-400 shadow-panel-inset">
        決済機能は後日実装予定です。現在はログインボーナス・紹介・LINE特典でチケットを獲得できます。
      </div>
    </section>
  );
}

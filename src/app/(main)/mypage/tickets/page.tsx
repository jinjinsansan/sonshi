import Link from "next/link";
import { LoginBonusCard } from "@/components/home/login-bonus-card";
import { TicketBalanceCarousel } from "@/components/home/ticket-balance-carousel";
import { getServerAuthUser } from "@/lib/auth/session";
import { loadTicketBalances } from "@/lib/data/tickets";
import { redirect } from "next/navigation";

export default async function TicketPage() {
  const user = await getServerAuthUser();
  if (!user) {
    redirect("/login");
  }

  const tickets = await loadTicketBalances(user.id);

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

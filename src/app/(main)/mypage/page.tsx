import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginBonusCard } from "@/components/home/login-bonus-card";
import { TicketBalanceCarousel } from "@/components/home/ticket-balance-carousel";
import { GachaHistory } from "@/components/gacha/gacha-history";
import { getServerAuthUser } from "@/lib/auth/session";
import { loadTicketBalances } from "@/lib/data/tickets";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("ja-JP");
}

export default async function MyPage() {
  const user = await getServerAuthUser();
  if (!user) {
    redirect("/login");
  }

  const supabase = getSupabaseServiceClient();

  const [
    tickets,
    inventoryResult,
    cardsResult,
    referralResult,
    inviteCodeResult,
    lineFollowResult,
  ] = await Promise.all([
    loadTicketBalances(user.id),
    supabase
      .from("card_inventory")
      .select("card_id, obtained_at")
      .eq("owner_id", user.id)
      .order("obtained_at", { ascending: false }),
    supabase
      .from("cards")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("referrals")
      .select("id, status, ticket_granted, completed_at, created_at")
      .eq("referrer_id", user.id)
      .not("referred_id", "is", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("referrals")
      .select("referral_code")
      .eq("referrer_id", user.id)
      .is("referred_id", null)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("line_follows")
      .select("ticket_granted, followed_at")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle(),
  ]);

  const inventory = inventoryResult.data ?? [];
  const totalOwned = inventory.length;
  const distinctOwned = new Set(inventory.map((item) => item.card_id)).size;
  const totalCatalog = cardsResult.count ?? 0;
  const completion = totalCatalog > 0 ? Math.round((distinctOwned / totalCatalog) * 100) : 0;
  const latestObtainedAt = inventory[0]?.obtained_at ?? null;

  const referralRows = referralResult.data ?? [];
  const totalInvites = referralRows.length;
  const rewardedInvites = referralRows.filter((row) => row.status === "rewarded").length;
  const inviteCode = inviteCodeResult.data?.referral_code ?? null;

  const lineFollow = lineFollowResult.data ?? null;
  const lineStatus = lineFollow
    ? lineFollow.ticket_granted
      ? "特典受取済"
      : "連携済み"
    : "未連携";

  const totalTickets = tickets.reduce((sum, ticket) => sum + (ticket.quantity ?? 0), 0);
  const freeTicket = tickets.find((ticket) => ticket.code === "free");

  const quickLinks = [
    {
      title: "友達紹介",
      description: "紹介成立で双方+1枚",
      href: "/mypage/invite",
      stat: inviteCode ? `CODE: ${inviteCode}` : "CODE未発行",
      meta: `${rewardedInvites}/${totalInvites || 0} 人が特典獲得`,
    },
    {
      title: "LINE特典",
      description: "LINE公式追加で1枚プレゼント",
      href: "/mypage/line",
      stat: lineStatus,
      meta: lineFollow?.followed_at ? `連携日 ${formatDate(lineFollow.followed_at)}` : "最短30秒",
    },
    {
      title: "チケット管理",
      description: "残高・履歴・購入申込",
      href: "/mypage/tickets",
      stat: `${totalTickets} 枚`,
      meta: freeTicket ? `FREE ${freeTicket.quantity}枚` : "FREE 0枚",
    },
    {
      title: "ガチャ履歴",
      description: "直近の結果をまとめて確認",
      href: "/mypage/history",
      stat: latestObtainedAt ? formatDate(latestObtainedAt) : "未プレイ",
      meta: "履歴ページへ",
    },
  ];

  return (
    <section className="space-y-8">
      <div className="space-y-3 rounded-3xl border border-white/10 bg-black/30 px-6 py-7 shadow-[0_20px_45px_rgba(0,0,0,0.35)]">
        <p className="text-xs uppercase tracking-[0.5em] text-neon-blue">SONSHI DASHBOARD</p>
        <div className="space-y-1">
          <h1 className="font-display text-3xl text-white">ネオンホール マイページ</h1>
          <p className="text-sm text-zinc-300">ログイン中: {user.email}</p>
        </div>
        <p className="text-sm text-zinc-400">
          チケット残高、カードコレクション、招待状況、特典連携をここでまとめて確認できます。
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-black/25 p-5 shadow-panel-inset">
          <p className="text-xs uppercase tracking-[0.4em] text-neon-yellow">Tickets</p>
          <p className="mt-2 font-display text-3xl text-white">{totalTickets} 枚</p>
          <p className="text-sm text-zinc-400">
            FREE {freeTicket?.quantity ?? 0} / TOTAL {totalTickets}
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-black/25 p-5 shadow-panel-inset">
          <p className="text-xs uppercase tracking-[0.4em] text-neon-purple">Collection</p>
          <p className="mt-2 font-display text-3xl text-white">
            {distinctOwned}/{totalCatalog || "-"}
          </p>
          <p className="text-sm text-zinc-400">コンプ率 {completion}% ・ 所持 {totalOwned} 枚</p>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <div>
            <p className="uppercase tracking-[0.4em] text-neon-yellow">Tickets</p>
            <p>現在の残高</p>
          </div>
          <Link href="/mypage/tickets" className="text-[11px] uppercase tracking-[0.35em] text-neon-blue">
            詳細を見る
          </Link>
        </div>
        <TicketBalanceCarousel tickets={tickets} />
      </section>

      <section className="space-y-3">
        <p className="text-xs uppercase tracking-[0.4em] text-neon-yellow">Login Bonus</p>
        <LoginBonusCard />
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {quickLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-3xl border border-white/10 bg-black/25 p-5 shadow-panel-inset transition hover:border-neon-blue"
          >
            <p className="text-xs uppercase tracking-[0.35em] text-zinc-400">{item.title}</p>
            <h2 className="mt-2 font-display text-xl text-white">{item.description}</h2>
            <p className="mt-3 text-sm text-neon-yellow">{item.stat}</p>
            <p className="text-xs text-zinc-400">{item.meta}</p>
            <span className="mt-4 inline-flex items-center text-[11px] uppercase tracking-[0.35em] text-neon-blue">
              TAP TO MANAGE →
            </span>
          </Link>
        ))}
      </section>

      <section className="space-y-3">
        <p className="text-xs uppercase tracking-[0.4em] text-neon-purple">History</p>
        <GachaHistory title="最近のガチャ履歴" limit={6} />
      </section>
    </section>
  );
}

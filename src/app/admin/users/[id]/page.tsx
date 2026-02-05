import Link from "next/link";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { requireAdminSession } from "@/lib/admin";

type AdminUserDetailProps = {
  params: Promise<{ id: string }>;
};

const RARITY_LABELS: Record<string, string> = {
  N: "N",
  R: "R",
  SR: "SR",
  SSR: "SSR",
  UR: "UR",
};

export default async function AdminUserDetailPage({ params }: AdminUserDetailProps) {
  await requireAdminSession();
  const { id } = await params;
  const svc = getSupabaseServiceClient();

  const [userResp, ticketResp, historyResp, inventoryResp, referralResp] = await Promise.all([
    svc.auth.admin.getUserById(id),
    svc.from("user_tickets").select("quantity, ticket_types(code, name)").eq("user_id", id),
    svc
      .from("gacha_results")
      .select("id, created_at, obtained_via, cards(name, rarity), gachas(name)")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(30),
    svc
      .from("card_inventory")
      .select("id, serial_number, obtained_at, cards(name, rarity)")
      .eq("owner_id", id)
      .order("obtained_at", { ascending: false })
      .limit(30),
    svc
      .from("referrals")
      .select("id, referral_code, status, ticket_granted, created_at, completed_at, referrer_id, referred_id")
      .or(`referrer_id.eq.${id},referred_id.eq.${id}`)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const user = userResp.data?.user;
  if (!user) {
    return (
      <section className="space-y-6">
        <p className="text-sm text-red-300">ユーザーが見つかりません。</p>
        <Link href="/admin/users" className="text-neon-blue">
          一覧へ戻る
        </Link>
      </section>
    );
  }

  const tickets = ticketResp.data ?? [];
  const history = historyResp.data ?? [];
  const inventory = inventoryResp.data ?? [];
  const referrals = referralResp.data ?? [];

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.5em] text-neon-yellow">User Detail</p>
          <h2 className="font-display text-2xl text-white">{user.email ?? "(no email)"}</h2>
          <p className="text-xs text-zinc-400">{user.id}</p>
        </div>
        <Link
          href="/admin/users"
          className="rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/80 transition hover:border-neon-blue hover:text-white"
        >
          戻る
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-hall-panel/80 p-5 shadow-panel-inset">
          <p className="text-xs uppercase tracking-[0.4em] text-zinc-400">Tickets</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-300">
            {tickets.length === 0 ? (
              <span className="text-zinc-500">チケットなし</span>
            ) : (
              tickets.map((ticket, index) => (
                <span key={`${ticket.ticket_types?.code}-${index}`} className="rounded-full border border-white/10 px-2 py-1">
                  {ticket.ticket_types?.name ?? ticket.ticket_types?.code ?? "-"}: {ticket.quantity ?? 0}
                </span>
              ))
            )}
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-hall-panel/80 p-5 shadow-panel-inset">
          <p className="text-xs uppercase tracking-[0.4em] text-zinc-400">Referrals</p>
          {referrals.length === 0 ? (
            <p className="mt-3 text-xs text-zinc-500">紹介履歴がありません。</p>
          ) : (
            <div className="mt-3 space-y-2 text-xs text-zinc-300">
              {referrals.map((referral) => (
                <div key={referral.id} className="border-b border-white/5 pb-2">
                  <p className="text-white">{referral.referral_code}</p>
                  <p className="text-zinc-400">status: {referral.status}</p>
                  <p className="text-zinc-400">
                    ticket: {referral.ticket_granted ? "付与済み" : "未付与"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-hall-panel/80 p-5 shadow-panel-inset">
          <p className="text-xs uppercase tracking-[0.4em] text-zinc-400">Gacha History</p>
          {history.length === 0 ? (
            <p className="mt-3 text-xs text-zinc-500">履歴がありません。</p>
          ) : (
            <div className="mt-3 space-y-2 text-xs text-zinc-300">
              {history.map((entry) => (
                <div key={entry.id} className="border-b border-white/5 pb-2">
                  <p className="text-white">{entry.cards?.name ?? "-"}</p>
                  <p className="text-zinc-400">
                    {entry.gachas?.name ?? ""} / {entry.obtained_via}
                  </p>
                  <p className="text-zinc-400">
                    {entry.cards?.rarity ? RARITY_LABELS[entry.cards?.rarity] ?? entry.cards?.rarity : "-"} ・
                    {entry.created_at ? new Date(entry.created_at).toLocaleString("ja-JP") : "-"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-3xl border border-white/10 bg-hall-panel/80 p-5 shadow-panel-inset">
          <p className="text-xs uppercase tracking-[0.4em] text-zinc-400">Inventory</p>
          {inventory.length === 0 ? (
            <p className="mt-3 text-xs text-zinc-500">所持カードがありません。</p>
          ) : (
            <div className="mt-3 space-y-2 text-xs text-zinc-300">
              {inventory.map((entry) => (
                <div key={entry.id} className="border-b border-white/5 pb-2">
                  <p className="text-white">{entry.cards?.name ?? "-"}</p>
                  <p className="text-zinc-400">
                    #{entry.serial_number ?? "-"} ・
                    {entry.cards?.rarity ? RARITY_LABELS[entry.cards?.rarity] ?? entry.cards?.rarity : "-"}
                  </p>
                  <p className="text-zinc-400">
                    {entry.obtained_at ? new Date(entry.obtained_at).toLocaleString("ja-JP") : "-"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

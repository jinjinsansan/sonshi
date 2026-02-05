import Link from "next/link";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { requireAdminSession } from "@/lib/admin";

type ReferralsPageProps = {
  searchParams: Promise<{ status?: string }>;
};

export default async function AdminReferralsPage({ searchParams }: ReferralsPageProps) {
  await requireAdminSession();
  const { status } = await searchParams;
  const svc = getSupabaseServiceClient();

  let query = svc
    .from("referrals")
    .select("id, referral_code, referrer_id, referred_id, status, ticket_granted, created_at, completed_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (status) {
    query = query.eq("status", status);
  }

  const { data: referrals } = await query;

  const statuses = ["pending", "completed", "rewarded"];

  return (
    <section className="space-y-6">
      <div className="glass-panel space-y-4 px-6 py-5">
        <div>
          <p className="text-xs uppercase tracking-[0.5em] text-neon-yellow">Referrals</p>
          <h2 className="font-display text-2xl text-white">紹介管理</h2>
          <p className="text-sm text-zinc-300">紹介コードと進捗状況を確認します。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/referrals"
            className="rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/80 transition hover:border-neon-blue hover:text-white"
          >
            ALL
          </Link>
          {statuses.map((value) => (
            <Link
              key={value}
              href={`/admin/referrals?status=${value}`}
              className="rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/80 transition hover:border-neon-blue hover:text-white"
            >
              {value}
            </Link>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-hall-panel/80 p-5 shadow-panel-inset">
        {(referrals ?? []).length === 0 ? (
          <p className="text-sm text-zinc-400">紹介履歴がありません。</p>
        ) : (
          <div className="space-y-3 text-xs">
            {referrals?.map((referral) => (
              <div key={referral.id} className="border-b border-white/5 pb-3">
                <p className="font-display text-sm text-white">{referral.referral_code}</p>
                <p className="text-zinc-400">紹介者: {referral.referrer_id ?? "-"}</p>
                <p className="text-zinc-400">被紹介者: {referral.referred_id ?? "-"}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-zinc-300">
                  <span>status: {referral.status}</span>
                  <span>ticket: {referral.ticket_granted ? "付与済み" : "未付与"}</span>
                  <span>
                    作成: {referral.created_at ? new Date(referral.created_at).toLocaleString("ja-JP") : "-"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

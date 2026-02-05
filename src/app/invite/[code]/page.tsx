import Link from "next/link";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { InviteClaimCard } from "@/components/referral/invite-claim-card";

type InvitePageProps = {
  params: Promise<{ code: string }>;
};

export default async function InviteLanding({ params }: InvitePageProps) {
  const { code } = await params;
  const serviceSupabase = getSupabaseServiceClient();
  const { data: referral } = await serviceSupabase
    .from("referrals")
    .select("referrer_id")
    .eq("referral_code", code)
    .limit(1)
    .maybeSingle();

  if (!referral) {
    return (
      <section className="space-y-6">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.5em] text-neon-pink">Invite</p>
          <h1 className="font-display text-3xl text-white">招待コードが無効です</h1>
          <p className="text-sm text-zinc-300">正しい招待リンクからアクセスしてください。</p>
        </div>
        <Link
          href="/"
          className="inline-flex rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/80 transition hover:border-neon-blue hover:text-white"
        >
          トップへ戻る
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.5em] text-neon-blue">Invite</p>
        <h1 className="font-display text-3xl text-white">招待リンクへようこそ</h1>
        <p className="text-sm text-zinc-300">登録後に特典を受け取るとフリーチケットが付与されます。</p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-hall-panel/80 p-5 shadow-panel-inset">
        <p className="text-xs uppercase tracking-[0.4em] text-zinc-400">招待コード</p>
        <p className="mt-2 font-display text-2xl text-white">{code}</p>
        {referral.referrer_id && (
          <p className="mt-2 text-xs text-zinc-500">紹介者ID: {referral.referrer_id.slice(0, 8)}</p>
        )}
      </div>

      <InviteClaimCard code={code} />
    </section>
  );
}

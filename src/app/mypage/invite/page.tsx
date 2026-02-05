import Link from "next/link";
import { ReferralInvitePanel } from "@/components/referral/referral-invite-panel";

export default function InvitePage() {
  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.5em] text-neon-yellow">Invite</p>
          <h1 className="font-display text-3xl text-white">友達を招待する</h1>
          <p className="text-sm text-zinc-300">紹介リンク経由で登録が完了すると双方にフリーチケットを付与します。</p>
        </div>
        <Link
          href="/mypage"
          className="rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/80 transition hover:border-neon-blue hover:text-white"
        >
          戻る
        </Link>
      </div>

      <ReferralInvitePanel />
    </section>
  );
}

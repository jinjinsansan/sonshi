import Link from "next/link";
import { LineLinkCard } from "@/components/line/line-link-card";

function normalizeUrl(value?: string) {
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `https://${value}`;
}

export default function LineBonusPage() {
  const addFriendUrl = normalizeUrl(process.env.LINE_ADD_FRIEND_URL);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.5em] text-neon-blue">LINE</p>
          <h1 className="font-display text-3xl text-white">LINE特典</h1>
          <p className="text-sm text-zinc-300">LINE公式アカウント追加でフリーチケットを獲得できます。</p>
        </div>
        <Link
          href="/mypage"
          className="rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/80 transition hover:border-neon-blue hover:text-white"
        >
          戻る
        </Link>
      </div>

      <LineLinkCard addFriendUrl={addFriendUrl} />
    </section>
  );
}

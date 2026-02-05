import Link from "next/link";
import { redirect } from "next/navigation";
import { LineLinkCard } from "@/components/line/line-link-card";
import { getServerAuthUser } from "@/lib/auth/session";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

function normalizeUrl(value?: string) {
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `https://${value}`;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("ja-JP");
}

export default async function LineBonusPage() {
  const user = await getServerAuthUser();
  if (!user) {
    redirect("/login");
  }

  const supabase = getSupabaseServiceClient();
  const { data: lineFollow } = await supabase
    .from("line_follows")
    .select("line_user_id, ticket_granted, followed_at")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  const statusLabel = lineFollow
    ? lineFollow.ticket_granted
      ? "特典受取済 (+1)"
      : "連携済み・処理待ち"
    : "未連携";
  const statusNote = lineFollow
    ? `連携日: ${formatDate(lineFollow.followed_at)}`
    : "LINEユーザーIDを入力して連携してください";

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

      <div className="rounded-3xl border border-white/10 bg-black/25 p-5 shadow-panel-inset">
        <p className="text-xs uppercase tracking-[0.4em] text-neon-yellow">現在のステータス</p>
        <p className="mt-2 font-display text-2xl text-white">{statusLabel}</p>
        <p className="text-sm text-zinc-400">{statusNote}</p>
        {lineFollow?.line_user_id && (
          <p className="text-xs text-zinc-500">LINE ID: {lineFollow.line_user_id}</p>
        )}
      </div>

      <LineLinkCard addFriendUrl={addFriendUrl} />
    </section>
  );
}

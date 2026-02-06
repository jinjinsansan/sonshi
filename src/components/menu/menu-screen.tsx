"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useFormStatus } from "react-dom";
import { signOutAction } from "@/app/(auth)/actions";
import { useMainApp } from "@/components/providers/main-app-provider";

const sections = [
  {
    title: "ガチャ / コレクション",
    links: [
      { title: "ホーム", description: "最新ガチャとチケット残高", href: "/home" },
      { title: "ガチャ一覧", description: "単発・連続ガチャ", href: "/gacha" },
      { title: "コレクション", description: "所持カード管理", href: "/collection" },
    ],
  },
  {
    title: "チケット / 特典",
    links: [
      { title: "マイページ", description: "全体ダッシュボード", href: "/mypage" },
      { title: "チケット管理", description: "残高・履歴・購入", href: "/mypage/tickets", badge: "NEW" },
      { title: "友達紹介", description: "コード共有で+1枚", href: "/mypage/invite" },
      { title: "LINE特典", description: "LINE追加で+1枚", href: "/mypage/line" },
      { title: "チケット購入(準備中)", description: "有償パックを近日提供", href: "/purchase", badge: "SOON" },
    ],
  },
  {
    title: "サポート / 設定",
    links: [
      { title: "ヘルプセンター", description: "よくある質問 (準備中)", href: "mailto:support@sonshigacha.com", badge: "EMAIL" },
      { title: "パスワード変更", description: "メール経由で更新", href: "/reset" },
      { title: "利用規約", description: "注意事項を確認", href: "/terms" },
    ],
  },
];

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("ja-JP", { month: "short", day: "numeric" });
}

export function MenuScreen() {
  const { snapshot } = useMainApp();
  const stats = useMemo(() => {
    const totalTickets = snapshot.tickets.reduce((sum, ticket) => sum + (ticket.quantity ?? 0), 0);
    const freeTicket = snapshot.tickets.find((ticket) => ticket.code === "free")?.quantity ?? 0;
    return { totalTickets, freeTicket };
  }, [snapshot.tickets]);

  return (
    <section className="space-y-8">
      <div className="space-y-3 rounded-3xl border border-white/10 bg-black/30 px-6 py-7 shadow-[0_20px_45px_rgba(0,0,0,0.35)]">
        <p className="text-xs uppercase tracking-[0.5em] text-neon-yellow">MENU</p>
        <div className="space-y-1">
          <h1 className="font-display text-3xl text-white">プレイヤー設定</h1>
          <p className="text-sm text-zinc-300">{snapshot.user?.email ?? "unknown"}</p>
        </div>
        <div className="flex flex-wrap gap-6 text-sm text-zinc-400">
          <p>Tickets: {stats.totalTickets}枚 (FREE {stats.freeTicket})</p>
          <p>Last Login: {formatDate(snapshot.user?.lastLoginAt)}</p>
        </div>
      </div>

      {sections.map((section) => (
        <div key={section.title} className="space-y-3">
          <p className="text-xs uppercase tracking-[0.4em] text-zinc-400">{section.title}</p>
          <div className="space-y-3">
            {section.links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center justify-between rounded-3xl border border-white/10 bg-black/25 px-5 py-4 shadow-panel-inset transition hover:border-neon-blue"
              >
                <div>
                  <p className="font-display text-lg text-white">{link.title}</p>
                  <p className="text-sm text-zinc-400">{link.description}</p>
                </div>
                {link.badge && (
                  <span className="rounded-full border border-white/20 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-neon-yellow">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      ))}

      <div className="space-y-3 rounded-3xl border border-white/10 bg-black/25 px-5 py-6 shadow-panel-inset">
        <p className="text-xs uppercase tracking-[0.4em] text-red-300">Sign Out</p>
        <p className="text-sm text-zinc-400">端末の共有時は必ずサインアウトしてください。</p>
        <form action={signOutAction}>
          <SignOutButton />
        </form>
      </div>
    </section>
  );
}

function SignOutButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 w-full rounded-full border border-white/20 px-4 py-3 text-[11px] uppercase tracking-[0.35em] text-white transition hover:border-neon-pink hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "SIGNING OUT..." : "SIGN OUT"}
    </button>
  );
}

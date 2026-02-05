import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerAuthUser } from "@/lib/auth/session";

const modules = [
  {
    title: "タイムライン",
    description: "プレイヤーの獲得カードやハイライト演出を共有するSNSフィード。",
    status: "IN DESIGN",
  },
  {
    title: "カードシェア",
    description: "所持カードを並べてSNS用のスクリーンショットを生成。",
    status: "COMING SOON",
  },
  {
    title: "ランキング",
    description: "連続ガチャ完走やUR獲得者を週次ランキングで表示。",
    status: "PLANNING",
  },
];

const communityLinks = [
  { label: "公式X", href: "https://twitter.com" },
  { label: "コミュニティDiscord", href: "https://discord.com" },
];

export default async function SocialPage() {
  const user = await getServerAuthUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.5em] text-neon-blue">Social</p>
        <h1 className="font-display text-3xl text-white">ソーシャルハブ（準備中）</h1>
        <p className="text-sm text-zinc-300">UMA ROYALE のコミュニティ機能をベースに、ガチャ結果の共有やリアルタイム演出を展開します。</p>
      </div>

      <div className="grid gap-4">
        {modules.map((module) => (
          <div key={module.title} className="rounded-3xl border border-white/10 bg-black/25 p-5 shadow-panel-inset">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl text-white">{module.title}</h2>
              <span className="rounded-full border border-white/15 px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-neon-yellow">
                {module.status}
              </span>
            </div>
            <p className="mt-2 text-sm text-zinc-400">{module.description}</p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-white/10 bg-black/25 p-5 shadow-panel-inset">
        <p className="text-xs uppercase tracking-[0.4em] text-neon-yellow">コミュニティリンク</p>
        <p className="mt-2 text-sm text-zinc-400">リリースまでの最新情報は下記SNSでご案内します。</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {communityLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-white/15 px-4 py-2 text-[11px] uppercase tracking-[0.35em] text-white/80 transition hover:border-neon-blue hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </div>
        <p className="mt-4 text-xs text-zinc-500">※ 実際のリンクはローンチ時に差し替えます。</p>
      </div>

      <Link
        href="/home"
        className="flex h-12 items-center justify-center rounded-full border border-white/15 text-[11px] uppercase tracking-[0.35em] text-white"
      >
        ホームへ戻る
      </Link>
    </section>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerAuthUser } from "@/lib/auth/session";

const roadmap = [
  {
    title: "タイムライン",
    description: "獲得カードや神引き演出を自動で共有。ハイライトをピン留めして仲間にアピール。",
    status: "NEXT",
    badgeColor: "text-neon-yellow",
  },
  {
    title: "カードシェア",
    description: "手持ちカードを並べてSNS用のスクショをワンクリ生成。背景テンプレとロゴを合成。",
    status: "NEXT",
    badgeColor: "text-neon-pink",
  },
  {
    title: "ランキング",
    description: "UR獲得・連続完走・追撃成功率などを週次で集計し、トッププレイヤーを表彰。",
    status: "PLANNING",
    badgeColor: "text-neon-blue",
  },
];

const communityLinks = [
  { label: "公式X", href: "https://x.com" },
  { label: "Discord", href: "https://discord.com" },
];

export default async function SocialPage() {
  const user = await getServerAuthUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <section className="space-y-8">
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#0b1022] via-[#0f1c38] to-[#060812] p-6 shadow-panel-inset">
        <p className="text-xs uppercase tracking-[0.5em] text-neon-blue">Social</p>
        <div className="mt-2 space-y-2">
          <h1 className="font-display text-3xl text-white">ソーシャルハブ</h1>
          <p className="text-sm text-white/75">
            UMAプロジェクトのフレンド機能をベースに、尊師ガチャのハイライト共有とコミュニティ連携を準備中です。
          </p>
          <div className="flex flex-wrap gap-2 text-[11px] text-white/70">
            <span className="rounded-full border border-white/15 px-3 py-1">フレンド招待・申請</span>
            <span className="rounded-full border border-white/15 px-3 py-1">カード自慢スクショ</span>
            <span className="rounded-full border border-white/15 px-3 py-1">ランキング</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {roadmap.map((item) => (
          <div key={item.title} className="rounded-3xl border border-white/10 bg-black/25 p-5 shadow-panel-inset">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-xl text-white">{item.title}</h2>
              <span className={`text-[10px] uppercase tracking-[0.35em] ${item.badgeColor}`}>{item.status}</span>
            </div>
            <p className="mt-2 text-sm text-zinc-300 leading-relaxed">{item.description}</p>
            <p className="mt-3 text-[11px] text-zinc-500">実装後、設定なく自動で反映予定</p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-white/10 bg-black/35 p-5 shadow-panel-inset">
        <p className="text-xs uppercase tracking-[0.4em] text-neon-yellow">コミュニティ</p>
        <p className="mt-2 text-sm text-zinc-300">リリース情報・イベント告知は各SNSで配信します。フォローしてお待ちください。</p>
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
        <p className="mt-4 text-xs text-zinc-500">※ UMAのフレンド・ギフトAPIを統合後、ガチャ結果のシェア機能を有効化します。</p>
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

import Link from "next/link";

const menuItems = [
  {
    title: "友達紹介",
    description: "紹介コードを共有してフリーチケットを獲得する",
    href: "/mypage/invite",
  },
  {
    title: "LINE特典",
    description: "LINE公式追加でフリーチケットを受け取る",
    href: "/mypage/line",
  },
  {
    title: "チケット管理",
    description: "保有チケットの残数や履歴を確認",
    href: "/mypage/tickets",
  },
  {
    title: "ガチャ履歴",
    description: "獲得したカードの履歴を一覧表示",
    href: "/mypage/history",
  },
];

export default function MyPage() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.5em] text-neon-blue">My Page</p>
        <h1 className="font-display text-3xl text-white">マイページ</h1>
        <p className="text-sm text-zinc-300">チケットや紹介機能の管理をまとめて確認できます。</p>
      </div>

      <div className="grid gap-4">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-3xl border border-white/10 bg-hall-panel/80 p-5 shadow-panel-inset transition hover:border-neon-blue"
          >
            <h2 className="font-display text-xl text-white">{item.title}</h2>
            <p className="mt-2 text-sm text-zinc-400">{item.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

import Link from "next/link";

const featureCards = [
  {
    title: "連続ガチャシナリオ",
    description:
      "NEXTレバーを押すたびに演出が進化。事前計算された10連の結果を熱量に応じて映像にマッピングします。",
  },
  {
    title: "シリアル付きカード",
    description:
      "カードごとに max supply を管理し、排出時に #03/10 のようなシリアルを即発行。コレクション画面にも反映。",
  },
  {
    title: "紹介 & LINE特典",
    description:
      "紹介リンク経由の登録やLINE公式追加で自動的にフリーチケットを付与。Webhook 連携も計画済みです。",
  },
];

const statHighlights = [
  { label: "Phase", value: "0 → 1", hint: "基盤構築中" },
  { label: "Stack", value: "Next 16 / Supabase", hint: "SSR + App Router" },
  { label: "UI Tone", value: "Neon Hall", hint: "パチスロホール" },
];

export default function Home() {
  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-hall-background text-white">
      <div className="pointer-events-none absolute inset-0 bg-hall-grid opacity-40" />
      <div className="pointer-events-none absolute inset-0 blur-3xl">
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-neon-pink/30 via-transparent to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-neon-blue/20 via-transparent to-transparent" />
      </div>

      <main className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col gap-16 px-6 py-16 lg:px-12">
        <section className="glass-panel relative overflow-hidden p-8 md:p-12">
          <div className="absolute inset-0 bg-gradient-to-r from-neon-pink/15 via-transparent to-neon-blue/20 opacity-80" />
          <div className="relative flex flex-col gap-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="space-y-4 md:max-w-3xl">
                <p className="font-display text-xs uppercase tracking-[0.6em] text-neon-yellow">
                  SONSHI GACHA HALL
                </p>
                <h1 className="font-display text-4xl tracking-tight text-white drop-shadow lg:text-5xl">
                  ネオン煌めく尊師ホールで<br className="hidden sm:block" />
                  連続演出ガチャを体感せよ
                </h1>
                <p className="max-w-2xl text-base text-zinc-200">
                  UMA ROYALE で磨いた Supabase × Next.js の実装を土台に、連続ガチャ、
                  シリアルカード、紹介インセンティブなど SONSHI 専用の体験を段階的に実装していきます。
                </p>
              </div>
              <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-hall-surface/80 p-6 text-sm shadow-panel-inset">
                {statHighlights.map((stat) => (
                  <div key={stat.label} className="flex items-baseline justify-between gap-6">
                    <span className="text-zinc-400">{stat.label}</span>
                    <div className="text-right">
                      <p className="font-display text-lg text-neon-blue">{stat.value}</p>
                      <p className="text-xs text-zinc-400">{stat.hint}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/gacha"
                className="group flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-neon-pink to-neon-yellow px-8 py-3 font-display text-sm uppercase tracking-[0.4em] text-black shadow-neon transition lg:w-auto"
              >
                ENTER HALL
                <span className="text-base text-black/60 group-hover:text-black">→</span>
              </Link>
              <Link
                href="https://github.com/jinjinsansan/sonshi/tree/main/docs"
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center justify-center rounded-full border border-white/15 px-8 py-3 text-sm uppercase tracking-[0.3em] text-white/80 transition hover:border-neon-blue hover:text-white lg:w-auto"
              >
                DEVELOPMENT PLAN
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featureCards.map((feature) => (
            <article
              key={feature.title}
              className="relative overflow-hidden rounded-3xl border border-white/8 bg-hall-panel/80 p-6 shadow-panel-inset"
            >
              <div className="absolute inset-0 opacity-40 mix-blend-screen">
                <div className="h-full w-full bg-[radial-gradient(circle_at_top,rgba(48,240,255,0.25),transparent_70%)]" />
              </div>
              <div className="relative flex h-full flex-col gap-4">
                <h3 className="font-display text-xl text-white">{feature.title}</h3>
                <div className="neon-divider" />
                <p className="text-sm text-zinc-300">{feature.description}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="mb-10 grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="glass-panel relative overflow-hidden p-8">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent" />
            <div className="relative space-y-4">
              <p className="font-display text-xs uppercase tracking-[0.5em] text-neon-purple">
                NEXT UP
              </p>
              <h2 className="font-display text-2xl">Phase 1 → Phase 2 の主タスク</h2>
              <ul className="space-y-3 text-sm text-zinc-200">
                <li>・ 認証 / チケット / 単発ガチャを UMA から移植し UI を SONSHI スタイルに再設計</li>
                <li>・ `multi_gacha_sessions` テーブルとシナリオジェネレーターで連続演出APIを構築</li>
                <li>・ カードシリアル、コレクション、管理画面の CRUD を Supabase Service Role で実装</li>
              </ul>
            </div>
          </div>
          <div className="rounded-3xl border border-white/8 bg-gradient-to-b from-hall-panel to-hall-surface p-6 shadow-panel-inset">
            <p className="text-sm text-zinc-400">最新状況</p>
            <p className="font-display text-4xl text-neon-yellow">SETUP</p>
            <p className="text-sm text-zinc-300">
              Supabase クライアント / 環境変数 / デザイン基盤を整備。次は既存 UMA の機能移植へ。
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

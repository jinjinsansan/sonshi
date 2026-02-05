import Link from "next/link";

export default function HistoryPage() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.5em] text-neon-purple">History</p>
        <h1 className="font-display text-3xl text-white">ガチャ履歴</h1>
        <p className="text-sm text-zinc-300">単発・連続ガチャの履歴表示は準備中です。</p>
      </div>
      <div className="rounded-3xl border border-white/10 bg-hall-panel/80 p-6 text-sm text-zinc-400 shadow-panel-inset">
        Phase 2 で履歴一覧・詳細カード表示を追加予定です。
      </div>
      <Link
        href="/mypage"
        className="inline-flex rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/80 transition hover:border-neon-blue hover:text-white"
      >
        戻る
      </Link>
    </section>
  );
}

import Link from "next/link";
import { GachaHistory } from "@/components/gacha/gacha-history";

export default function HistoryPage() {
  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.5em] text-neon-purple">History</p>
          <h1 className="font-display text-3xl text-white">ガチャ履歴</h1>
          <p className="text-sm text-zinc-300">単発・連続ガチャの履歴をまとめて確認できます。</p>
        </div>
        <Link
          href="/mypage"
          className="inline-flex rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/80 transition hover:border-neon-blue hover:text-white"
        >
          戻る
        </Link>
      </div>

      <GachaHistory title="直近のガチャ履歴" limit={30} />
    </section>
  );
}

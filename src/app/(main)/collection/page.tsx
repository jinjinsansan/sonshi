import { CollectionList } from "@/components/collection/collection-list";

export default function CollectionPage() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.5em] text-neon-purple">Collection</p>
        <div className="relative inline-block">
          <div className="absolute -inset-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-pink-500/15 blur-2xl" />
          <h1 className="relative font-display text-3xl font-bold tracking-[0.05em] text-transparent bg-gradient-to-r from-[#fff65c] via-[#ff9b3d] to-[#ff2d95] bg-clip-text drop-shadow-[0_0_40px_rgba(255,246,92,0.75)] drop-shadow-[0_0_70px_rgba(255,157,61,0.55)] drop-shadow-[0_4px_18px_rgba(0,0,0,0.8)]">
            カードコレクション
          </h1>
        </div>
        <p className="text-sm text-zinc-300">獲得したカードとシリアルを確認できます。</p>
      </div>
      <CollectionList />
    </section>
  );
}

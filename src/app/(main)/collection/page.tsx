import { CollectionList } from "@/components/collection/collection-list";

export default function CollectionPage() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.5em] text-neon-purple">Collection</p>
        <h1 className="font-display text-3xl text-white">カードコレクション</h1>
        <p className="text-sm text-zinc-300">獲得したカードとシリアルを確認できます。</p>
      </div>
      <CollectionList />
    </section>
  );
}

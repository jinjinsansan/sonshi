import { MultiGachaDemo } from "@/components/gacha/multi-gacha-demo";

export default function GachaDemoPage() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.5em] text-neon-purple">DEMO</p>
        <h1 className="font-display text-3xl text-white">10連ガチャ デモ（開発用）</h1>
        <p className="text-sm text-zinc-300">ローカル配置の映像とカードでUI/UXを確認するためのテストページです。</p>
      </div>
      <MultiGachaDemo />
    </section>
  );
}

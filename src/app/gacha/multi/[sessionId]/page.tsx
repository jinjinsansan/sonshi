import { MultiGachaSession } from "@/components/gacha/multi-gacha-session";

type Params = {
  params: Promise<{ sessionId: string }>;
};

export default async function MultiGachaSessionPage({ params }: Params) {
  const resolved = await params;
  const sessionId = resolved.sessionId;

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.5em] text-neon-purple">SESSION</p>
        <h1 className="font-display text-3xl text-white">連続ガチャ演出</h1>
        <p className="text-sm text-zinc-300">結果はNEXTボタンで順番に開示されます。</p>
      </div>
      <MultiGachaSession sessionId={sessionId} />
    </section>
  );
}

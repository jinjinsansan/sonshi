import { MultiGachaLobby } from "@/components/gacha/multi-gacha-lobby";
import { GACHA_DEFINITIONS } from "@/constants/gacha";
import { fetchGachaCatalog } from "@/lib/utils/gacha";

export default async function MultiGachaPage() {
  const catalog = await fetchGachaCatalog().catch(() => GACHA_DEFINITIONS);
  const gachas = catalog.length > 0 ? catalog : GACHA_DEFINITIONS;

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.5em] text-neon-blue">MULTI GACHA</p>
        <h1 className="font-display text-3xl text-white">連続ガチャ</h1>
        <p className="text-sm text-zinc-300">NEXTボタンで連続演出を進めます。</p>
      </div>
      <MultiGachaLobby gachas={gachas} />
    </section>
  );
}

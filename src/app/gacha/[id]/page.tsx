import { notFound } from "next/navigation";
import { GachaDrawPanel } from "@/components/gacha/gacha-draw-panel";
import { GachaHistory } from "@/components/gacha/gacha-history";
import { GACHA_DEFINITIONS } from "@/constants/gacha";
import {
  buildGachaSearchKey,
  canonicalizeGachaId,
  fetchGachaCatalog,
  gachaIdMatches,
} from "@/lib/utils/gacha";

type Params = {
  params: Promise<{ id: string }>;
};

const RARITY_LABELS = ["N", "R", "SR", "SSR", "UR"];

function formatRarity(range: [number, number]) {
  const label = (value: number) => RARITY_LABELS[value - 1] ?? `★${value}`;
  return `${label(range[0])}〜${label(range[1])}`;
}

export default async function GachaDetailPage({ params }: Params) {
  const resolvedParams = await params;
  const slugParam = resolvedParams.id;
  const requestedSlug = Array.isArray(slugParam) ? slugParam[0] : slugParam;

  if (!requestedSlug || typeof requestedSlug !== "string") {
    notFound();
  }

  const canonicalSlug = canonicalizeGachaId(requestedSlug);
  const searchKey = canonicalSlug ?? buildGachaSearchKey(requestedSlug) ?? requestedSlug.toLowerCase();

  const catalog = await fetchGachaCatalog().catch(() => GACHA_DEFINITIONS);
  const detail = catalog.find((item) => gachaIdMatches(item.id, searchKey))
    ?? GACHA_DEFINITIONS.find((item) => gachaIdMatches(item.id, searchKey));

  if (!detail) {
    notFound();
  }

  const resolvedGachaId = canonicalizeGachaId(detail.id) ?? detail.id;

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-hall-panel/80 p-6 shadow-panel-inset">
        <p className="text-xs uppercase tracking-[0.5em] text-neon-blue">{detail.ticketLabel}</p>
        <h1 className="mt-3 font-display text-3xl text-white">{detail.name}ガチャ</h1>
        <p className="mt-2 text-sm text-zinc-300">
          {detail.description || "演出と結果は準備が整い次第アップデートします。"}
        </p>
        <div className="mt-4 flex items-center justify-between text-xs text-zinc-400">
          <span>排出レンジ: {formatRarity(detail.rarityRange)}</span>
          <span>{detail.priceLabel || "TICKET"}</span>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-hall-panel/80 p-6 shadow-panel-inset">
        <p className="text-xs uppercase tracking-[0.4em] text-neon-yellow">Draw</p>
        <h2 className="mt-3 font-display text-2xl text-white">ガチャを回す</h2>
        <p className="text-sm text-zinc-400">単発・10連を順次実装中です。</p>
        <div className="mt-6">
          <GachaDrawPanel gachaId={resolvedGachaId} />
        </div>
      </div>

      <GachaHistory title="直近のガチャ履歴" limit={10} />
    </section>
  );
}

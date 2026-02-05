import Link from "next/link";
import { GACHA_DEFINITIONS } from "@/constants/gacha";
import { fetchGachaCatalog } from "@/lib/utils/gacha";

const RARITY_LABELS = ["N", "R", "SR", "SSR", "UR"];

function formatRarity(range: [number, number]) {
  const label = (value: number) => RARITY_LABELS[value - 1] ?? `★${value}`;
  return `${label(range[0])}〜${label(range[1])}`;
}

export default async function GachaPage() {
  const catalog = await fetchGachaCatalog().catch(() => GACHA_DEFINITIONS);
  const items = catalog.length > 0 ? catalog : GACHA_DEFINITIONS;

  return (
    <section className="space-y-8">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.6em] text-neon-blue">GACHA FLOOR</p>
        <h1 className="font-display text-3xl text-white">ガチャラインナップ</h1>
        <p className="text-sm text-zinc-300">チケット種別ごとに演出と排出レンジが変化します。</p>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <article
            key={item.id}
            className={`relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${item.gradient} p-6 shadow-panel-inset`}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl text-white">{item.name}ガチャ</h2>
              <span className="text-xs uppercase tracking-[0.3em] text-neon-yellow">
                {formatRarity(item.rarityRange)}
              </span>
            </div>
            <p className="mt-2 text-sm text-zinc-200">
              {item.description || "準備中のガチャ情報を順次追加していきます。"}
            </p>
            {item.featuredNote && (
              <p className="mt-3 text-xs uppercase tracking-[0.4em] text-neon-pink">
                {item.featuredNote}
              </p>
            )}
            <div className="mt-4 flex items-center justify-between text-xs text-zinc-300">
              <span>{item.ticketLabel}</span>
              <span>{item.priceLabel || "TICKET"}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={`/gacha/${item.id}`}
                className="rounded-full bg-gradient-to-r from-neon-pink to-neon-yellow px-5 py-2 text-xs uppercase tracking-[0.35em] text-black"
              >
                1回ガチャ
              </Link>
              <span className="rounded-full border border-white/15 px-5 py-2 text-xs uppercase tracking-[0.35em] text-white/80">
                10連準備中
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

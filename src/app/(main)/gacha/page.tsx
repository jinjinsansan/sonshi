import Link from "next/link";
import { Sparkles, Video, Zap } from "lucide-react";
import { GACHA_DEFINITIONS } from "@/constants/gacha";
import { canonicalizeGachaId, fetchGachaCatalog } from "@/lib/utils/gacha";

const RARITY_LABELS = ["N", "R", "SR", "SSR", "UR"];

const CATEGORIES = [
  { value: "pickup", label: "PICK UP", description: "今週の演出強化ガチャ" },
  { value: "limited", label: "LIMITED", description: "期間限定ライン" },
  { value: "ex", label: "EX", description: "最高峰のEXホール" },
];

const ANIMATIONS = [
  { key: "burst", name: "NEON BURST", duration: 4, note: "極彩色の一斉点灯" },
  { key: "warp", name: "WARP GATE", duration: 6, note: "ワープ映像から尊師登場" },
  { key: "impact", name: "IMPACT REEL", duration: 5, note: "メーターMAX演出" },
  { key: "rush", name: "SONSHI RUSH", duration: 8, note: "連打系カットイン" },
];

function formatRarity(range: [number, number]) {
  const label = (value: number) => RARITY_LABELS[value - 1] ?? `★${value}`;
  return `${label(range[0])}〜${label(range[1])}`;
}

export default async function GachaPage() {
  const catalog = await fetchGachaCatalog().catch(() => GACHA_DEFINITIONS);
  const items = catalog.length > 0 ? catalog : GACHA_DEFINITIONS;
  const featured = items.filter((item) => item.featuredNote).slice(0, 3);

  return (
    <section className="space-y-10">
      <header className="space-y-4">
        <p className="text-xs uppercase tracking-[0.6em] text-neon-blue">GACHA CONTROL</p>
        <div className="space-y-2">
          <h1 className="font-display text-4xl text-white">ガチャ演出ハブ</h1>
          <p className="text-sm text-zinc-300">
            カテゴリ別の演出強化、提供割合、スキップ設定を確認してからホールに挑みましょう。
          </p>
        </div>
        <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.35em] text-white/70">
          <span className="rounded-full border border-white/20 px-3 py-1">演出表</span>
          <span className="rounded-full border border-white/20 px-3 py-1">提供割合</span>
          <Link href="/menu" className="rounded-full border border-white/20 px-3 py-1 text-neon-yellow">
            チケット購入
          </Link>
        </div>
      </header>

      <section className="space-y-4">
        <div className="flex flex-wrap gap-3">
          {CATEGORIES.map((category) => (
            <div
              key={category.value}
              className="flex flex-1 min-w-[150px] flex-col gap-1 rounded-2xl border border-white/10 bg-black/40 px-4 py-3"
            >
              <p className="text-xs uppercase tracking-[0.4em] text-neon-yellow">{category.label}</p>
              <p className="text-xs text-zinc-400">{category.description}</p>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {featured.map((item) => {
            const slug = canonicalizeGachaId(item.id) ?? item.id;
            return (
              <article
                key={item.id}
                className="rounded-3xl border border-white/10 bg-black/40 p-6 shadow-[0_25px_45px_rgba(0,0,0,0.5)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.4em] text-neon-blue">FEATURED</p>
                    <h2 className="font-display text-2xl text-white">{item.name}ガチャ</h2>
                    <p className="text-sm text-zinc-300">{item.description}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.35em] text-neon-yellow">
                    <Sparkles className="h-4 w-4" /> {item.featuredNote}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-zinc-300">
                  <span>{item.ticketLabel}</span>
                  <span>|</span>
                  <span>{item.priceLabel || "TICKET"}</span>
                  <span>|</span>
                  <span>{formatRarity(item.rarityRange)}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/gacha/${slug}`}
                    className="rounded-full bg-gradient-to-r from-neon-pink to-neon-yellow px-5 py-2 text-xs uppercase tracking-[0.35em] text-black shadow-neon"
                  >
                    1回ガチャ
                  </Link>
                  <Link
                    href="/gacha/multi"
                    className="rounded-full border border-white/20 px-5 py-2 text-xs uppercase tracking-[0.35em] text-white/80"
                  >
                    10連ガチャ
                  </Link>
                  <Link
                    href={`/gacha/${slug}#rates`}
                    className="rounded-full border border-transparent px-5 py-2 text-xs uppercase tracking-[0.35em] text-white/80 underline-offset-4 hover:text-white hover:underline"
                  >
                    提供割合
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="space-y-4" id="lineup">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-neon-yellow">All Lineup</p>
            <h3 className="font-display text-2xl text白">全ガチャ一覧</h3>
          </div>
          <Link href="/collection" className="text-xs uppercase tracking-[0.35em] text-neon-blue">
            図鑑で確認
          </Link>
        </div>
        <div className="space-y-4">
          {items.map((item) => {
            const slug = canonicalizeGachaId(item.id) ?? item.id;
            return (
              <article
                key={item.id}
                className={`relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${item.gradient} p-6 shadow-panel-inset`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-display text-xl text-white">{item.name}ガチャ</h4>
                  <span className="text-xs uppercase tracking-[0.3em] text-neon-yellow">
                    {formatRarity(item.rarityRange)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-zinc-200">
                  {item.description || "ネオンホールのラインナップです。"}
                </p>
                <div className="mt-4 flex items-center justify-between text-xs text-zinc-300">
                  <span>{item.ticketLabel}</span>
                  <span>{item.priceLabel || "TICKET"}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/gacha/${slug}`}
                    className="rounded-full bg-gradient-to-r from-neon-pink to-neon-yellow px-5 py-2 text-xs uppercase tracking-[0.35em] text-black shadow-neon"
                  >
                    1回ガチャ
                  </Link>
                  <Link
                    href="/gacha/multi"
                    className="rounded-full border border-white/20 px-5 py-2 text-xs uppercase tracking-[0.35em] text-white/80"
                  >
                    10連ガチャ
                  </Link>
                  <Link
                    href={`/gacha/${slug}#rates`}
                    className="rounded-full border border-transparent px-5 py-2 text-xs uppercase tracking-[0.35em] text-white/80 underline-offset-4 hover:text-white hover:underline"
                  >
                    提供割合
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <article className="rounded-3xl border border-white/10 bg-black/40 p-6">
          <div className="flex items-center gap-2 text-base text-white">
            <Video className="h-5 w-5 text-neon-blue" /> 演出バリエーション
          </div>
          <p className="mt-2 text-sm text-zinc-400">次期アップデートで演出選択を段階的に解放予定です。</p>
          <div className="mt-4 space-y-3">
            {ANIMATIONS.map((animation) => (
              <div
                key={animation.key}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm"
              >
                <div>
                  <p className="text-white">{animation.name}</p>
                  <p className="text-xs text-zinc-400">{animation.note}</p>
                </div>
                <span className="text-xs text-zinc-300">{animation.duration}s</span>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-3xl border border-white/10 bg-black/40 p-6">
          <div className="flex items-center gap-2 text-base text-white">
            <Zap className="h-5 w-5 text-neon-yellow" /> 即時スキップ設定
          </div>
          <p className="mt-2 text-sm text-zinc-300">
            次回アップデートで演出スキップトグルを実装予定。チャージ後すぐ結果を見たい方向けの高速モードです。
          </p>
          <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
            <span className="text-xs uppercase tracking-[0.4em] text-zinc-400">STATUS</span>
            <span className="text-sm text-neon-yellow">COMING SOON</span>
          </div>
        </article>
      </section>
    </section>
  );
}

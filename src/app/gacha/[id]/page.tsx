import { notFound } from "next/navigation";
import { GACHA_DEFINITIONS } from "@/constants/gacha";
import {
  buildGachaSearchKey,
  canonicalizeGachaId,
  fetchGachaCatalog,
  gachaIdMatches,
} from "@/lib/utils/gacha";
import { GachaV2Player } from "@/components/gacha/gacha-v2-player";

type Params = {
  params: Promise<{ id: string }>;
};

const RARITY_LABELS = ["N", "R", "SR", "SSR", "UR"];

function formatRarity(range: [number, number]) {
  const label = (value: number) => RARITY_LABELS[value - 1] ?? `★${value}`;
  return `${label(range[0])}〜${label(range[1])}`;
}

const DETAIL_THEMES: Record<
  string,
  {
    title: string;
    badge: string;
    gradient: string;
    border: string;
    description: string;
    ticketLabel: string;
    singleButtonClass: string;
    multiButtonClass: string;
  }
> = {
  free: {
    title: "フリーガチャ",
    badge: "フリーフロア",
    gradient: "from-[#061430] via-[#0c1f49] to-[#05060e]",
    border: "border-white/10",
    description: "ログインボーナスで挑戦できる入門フロア。",
    ticketLabel: "フリーチケット",
    singleButtonClass: "bg-gradient-to-r from-[#51d8ff] to-[#2d9bff] text-[#041226] shadow-[0_20px_40px_rgba(81,216,255,0.35)]",
    multiButtonClass: "bg-[#11335c] text-white shadow-[0_15px_30px_rgba(17,51,92,0.45)]",
  },
  basic: {
    title: "1階ガチャ",
    badge: "1階フロア",
    gradient: "from-[#2a1a02] via-[#3f2607] to-[#0b0502]",
    border: "border-white/12",
    description: "スタンダードな演出とチケットで楽しめる階層。",
    ticketLabel: "ベーシックチケット",
    singleButtonClass: "bg-gradient-to-r from-[#ffd161] to-[#ffb347] text-[#3b1800] shadow-[0_20px_40px_rgba(255,177,71,0.4)]",
    multiButtonClass: "bg-[#6a3b02] text-white shadow-[0_15px_35px_rgba(106,59,2,0.45)]",
  },
  epic: {
    title: "2階ガチャ",
    badge: "2階フロア",
    gradient: "from-[#2b0014] via-[#430029] to-[#070008]",
    border: "border-white/12",
    description: "熱量高めのエピック演出が連続する上級フロア。",
    ticketLabel: "エピックチケット",
    singleButtonClass: "bg-gradient-to-r from-[#ff4dab] to-[#ff2d95] text-white shadow-[0_20px_45px_rgba(255,77,171,0.35)]",
    multiButtonClass: "bg-[#5d0030] text-white shadow-[0_20px_45px_rgba(93,0,48,0.45)]",
  },
  premium: {
    title: "3階ガチャ",
    badge: "3階フロア",
    gradient: "from-[#1c0030] via-[#2f0150] to-[#05000a]",
    border: "border-white/12",
    description: "霧と光に包まれたプレミアム演出を味わえる階層。",
    ticketLabel: "プレミアムチケット",
    singleButtonClass: "bg-gradient-to-r from-[#c084fc] to-[#a855f7] text-[#210035] shadow-[0_20px_45px_rgba(168,85,247,0.35)]",
    multiButtonClass: "bg-[#3a045c] text-white shadow-[0_20px_45px_rgba(58,4,92,0.5)]",
  },
  ex: {
    title: "VIPガチャ",
    badge: "VIPフロア",
    gradient: "from-[#032415] via-[#064030] to-[#010b06]",
    border: "border-white/12",
    description: "最上階のプライベートホールでEX演出を解放。",
    ticketLabel: "VIPチケット",
    singleButtonClass: "bg-gradient-to-r from-[#36f0b7] to-[#14d08f] text-[#032617] shadow-[0_20px_40px_rgba(20,208,143,0.45)]",
    multiButtonClass: "bg-[#0b3a27] text-white shadow-[0_20px_40px_rgba(11,58,39,0.45)]",
  },
};

const DEFAULT_THEME = {
  title: "ガチャ",
  badge: "ホール",
  gradient: "from-hall-panel to-hall-background",
  border: "border-white/10",
  description: "演出と結果は順次アップデート予定です。",
  ticketLabel: "チケット",
  singleButtonClass: undefined,
  multiButtonClass: undefined,
};

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
  const theme = DETAIL_THEMES[resolvedGachaId] ?? {
    ...DEFAULT_THEME,
    title: `${detail.name}ガチャ`,
    badge: detail.ticketLabel ?? DEFAULT_THEME.badge,
    ticketLabel: detail.ticketLabel ?? DEFAULT_THEME.ticketLabel,
  };
  const heroTitle = theme.title ?? `${detail.name}ガチャ`;

  return (
    <section className="space-y-8">
      <div className="space-y-2 text-center">
        <div className="relative inline-block">
          <div className="absolute -inset-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-pink-500/15 blur-2xl" />
          <h1 className="relative font-display text-5xl font-bold tracking-[0.05em] text-transparent bg-gradient-to-r from-[#fff65c] via-[#ff9b3d] to-[#ff2d95] bg-clip-text drop-shadow-[0_0_50px_rgba(255,246,92,0.8)] drop-shadow-[0_0_90px_rgba(255,157,61,0.6)] drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]">
            {heroTitle}
          </h1>
        </div>
      </div>

      <article
        className={`space-y-5 rounded-3xl border ${theme.border} bg-gradient-to-br ${theme.gradient} px-6 py-6 shadow-panel-inset`}
      >
        <div className="space-y-3 text-white">
          <p className="text-xs uppercase tracking-[0.4em] text-white/70">{theme.badge}</p>
          <p className="text-sm text-white/80">{detail.description || theme.description}</p>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-white/80">
            <span>排出レンジ: {formatRarity(detail.rarityRange)}</span>
            <span>必要チケット: {theme.ticketLabel}</span>
          </div>
        </div>
        <GachaV2Player playLabel="ガチャを回す" />
      </article>
    </section>
  );
}

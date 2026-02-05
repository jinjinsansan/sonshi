export type GachaDefinition = {
  id: "free" | "basic" | "epic" | "premium" | "ex";
  name: string;
  rarityRange: [number, number];
  ticketLabel: string;
  description: string;
  priceLabel: string;
  gradient: string;
  featuredNote?: string;
};

export const GACHA_DEFINITIONS: GachaDefinition[] = [
  {
    id: "free",
    name: "フリー",
    rarityRange: [1, 3],
    ticketLabel: "フリーチケット",
    description: "デイリーボーナスで挑戦できるライトなガチャ。",
    priceLabel: "FREE / DAY",
    gradient: "from-neon-blue/35 to-hall-background",
  },
  {
    id: "basic",
    name: "ベーシック",
    rarityRange: [1, 4],
    ticketLabel: "ベーシックチケット",
    description: "ネオンホール定番のスタンダードライン。",
    priceLabel: "¥1,100",
    gradient: "from-neon-yellow/30 to-hall-background",
  },
  {
    id: "epic",
    name: "エピック",
    rarityRange: [2, 4],
    ticketLabel: "エピックチケット",
    description: "演出が少し熱くなる中級者向けライン。",
    priceLabel: "¥5,500",
    gradient: "from-neon-pink/30 to-hall-background",
    featuredNote: "10連でSR以上確定",
  },
  {
    id: "premium",
    name: "プレミアム",
    rarityRange: [3, 5],
    ticketLabel: "プレミアムチケット",
    description: "フィナーレ演出も狙える上位ライン。",
    priceLabel: "¥11,000",
    gradient: "from-neon-purple/35 to-hall-background",
    featuredNote: "SSR排出率アップ",
  },
  {
    id: "ex",
    name: "EX",
    rarityRange: [4, 5],
    ticketLabel: "EXチケット",
    description: "最上位レアを狙うハイローラー向け。",
    priceLabel: "¥110,000",
    gradient: "from-glow-green/30 to-hall-background",
    featuredNote: "演出完全解放",
  },
];

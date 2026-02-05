export const RARITY_ORDER = ["N", "R", "SR", "SSR", "UR"] as const;
export type Rarity = (typeof RARITY_ORDER)[number];

const RARITY_INDEX = new Map(RARITY_ORDER.map((rarity, index) => [rarity, index]));

export function getRarityRank(rarity?: string | null) {
  if (!rarity) return -1;
  return RARITY_INDEX.get(rarity as Rarity) ?? -1;
}

export function isRarityAtLeast(rarity: string | null | undefined, minimum: Rarity) {
  return getRarityRank(rarity) >= getRarityRank(minimum);
}

export function isRarityAtOrBelow(rarity: string | null | undefined, maximum: Rarity) {
  const rank = getRarityRank(rarity);
  return rank >= 0 && rank <= getRarityRank(maximum);
}

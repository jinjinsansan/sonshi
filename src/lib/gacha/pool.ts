import { pickWeighted } from "@/lib/utils/api";
import type { Rarity } from "@/lib/gacha/rarity";
import { isRarityAtLeast } from "@/lib/gacha/rarity";

type WeightRow = {
  rarity: string;
  probability: number | null;
  rtp_weight?: number | null;
};

export type RarityWeight = { item: Rarity; weight: number };

export function buildRarityWeights(rows: WeightRow[]): RarityWeight[] {
  return rows.map((row) => ({
    item: row.rarity as Rarity,
    weight: Math.max(0, Number(row.probability ?? 0) * (Number(row.rtp_weight ?? 1) || 0)),
  }));
}

export function pickRarity(weights: RarityWeight[], minimum?: Rarity | null) {
  if (weights.length === 0) return null;
  const filtered = minimum
    ? weights.filter((entry) => isRarityAtLeast(entry.item, minimum))
    : weights;
  const pool = filtered.length > 0 ? filtered : weights;
  return pickWeighted(pool);
}

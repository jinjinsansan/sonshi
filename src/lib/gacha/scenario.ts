import { publicEnv } from "@/lib/env";

export type Rarity = "N" | "R" | "SR" | "SSR" | "UR";
export type Phase = "intro" | "mid" | "buildup" | "finale";
export type HeatLevel = "normal" | "hot" | "super" | "jackpot";

export type ScenarioStep = {
  index: number;
  phase: Phase;
  heat: HeatLevel;
  rarity: Rarity;
  videoKey: string;
  videoUrl?: string | null;
};

const VIDEO_LIBRARY: Record<Phase, Partial<Record<HeatLevel, string[]>>> = {
  intro: {
    normal: ["intro_normal_01.mp4", "intro_normal_02.mp4", "intro_normal_03.mp4", "intro_normal_04.mp4", "intro_normal_05.mp4"],
    hot: ["intro_hot_01.mp4", "intro_hot_02.mp4", "intro_hot_03.mp4"],
  },
  mid: {
    normal: ["mid_normal_01.mp4", "mid_normal_02.mp4", "mid_normal_03.mp4", "mid_normal_04.mp4", "mid_normal_05.mp4"],
    hot: ["mid_hot_01.mp4", "mid_hot_02.mp4", "mid_hot_03.mp4"],
    super: ["mid_super_01.mp4", "mid_super_02.mp4"],
  },
  buildup: {
    normal: ["buildup_normal_01.mp4", "buildup_normal_02.mp4", "buildup_normal_03.mp4"],
    hot: ["buildup_hot_01.mp4", "buildup_hot_02.mp4", "buildup_hot_03.mp4"],
    super: ["buildup_super_01.mp4", "buildup_super_02.mp4"],
  },
  finale: {
    normal: ["finale_normal_01.mp4", "finale_normal_02.mp4", "finale_normal_03.mp4"],
    hot: ["finale_hot_01.mp4", "finale_hot_02.mp4", "finale_hot_03.mp4"],
    super: ["finale_super_01.mp4", "finale_super_02.mp4"],
    jackpot: ["finale_jackpot_01.mp4"],
  },
};

const BASE_URL = publicEnv.NEXT_PUBLIC_R2_PUBLIC_BASE_URL?.replace(/\/$/, "");

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function getPhase(pullNumber: number, total: number): Phase {
  if (pullNumber >= total) return "finale";
  const ratio = pullNumber / total;
  if (ratio <= 0.3) return "intro";
  if (ratio <= 0.6) return "mid";
  return "buildup";
}

function getHeatLevel(current: Rarity, previous: Rarity[]): HeatLevel {
  if (current === "UR" || current === "SSR") return "super";
  if (current === "SR") return "hot";
  const recentRares = previous.slice(-2).filter((rarity) => rarity !== "N").length;
  if (recentRares >= 2 && current === "R") return "hot";
  return "normal";
}

function resolveVideoKey(phase: Phase, heat: HeatLevel) {
  const pool = VIDEO_LIBRARY[phase];
  const direct = pool[heat];
  if (direct && direct.length > 0) return pickRandom(direct);
  const fallback = pool.normal ?? [];
  return fallback.length > 0 ? pickRandom(fallback) : "";
}

function buildVideoUrl(key: string) {
  if (!key || !BASE_URL) return null;
  return `${BASE_URL}/${key}`;
}

export function buildScenario(rarities: Rarity[]): ScenarioStep[] {
  return rarities.map((rarity, index) => {
    const pullNumber = index + 1;
    const phase = getPhase(pullNumber, rarities.length);
    const baseHeat = getHeatLevel(rarity, rarities.slice(0, index));
    const heat: HeatLevel = phase === "finale" && rarity === "UR" ? "jackpot" : baseHeat;
    const videoKey = resolveVideoKey(phase, heat);
    return {
      index: pullNumber,
      phase,
      heat,
      rarity,
      videoKey,
      videoUrl: buildVideoUrl(videoKey),
    };
  });
}

import { publicEnv } from "@/lib/env";
import type { Rarity } from "@/lib/gacha/rarity";
export type { Rarity } from "@/lib/gacha/rarity";
export type Phase = "intro" | "mid" | "buildup" | "finale";
export type HeatLevel = "normal" | "hot" | "super" | "jackpot";

export type ScenarioStep = {
  index: number;
  phase: Phase;
  heat: HeatLevel;
  rarity: Rarity;
  videoKey: string;
  videoUrl?: string | null;
  durationSeconds: number;
};

// 開発用：public/配下の実際の動画ファイル
const VIDEO_LIBRARY: Record<Phase, Partial<Record<HeatLevel, string[]>>> = {
  intro: {
    normal: ["/gekia-tsu.mp4"],
    hot: ["/gekia-tsu2.mp4"],
  },
  mid: {
    normal: ["/gekia-tsu.mp4"],
    hot: ["/gekia-tsu2.mp4"],
    super: ["/kakutei.mp4"],
  },
  buildup: {
    normal: ["/gekia-tsu.mp4"],
    hot: ["/gekia-tsu2.mp4"],
    super: ["/kakutei.mp4"],
  },
  finale: {
    normal: ["/gekia-tsu.mp4"],
    hot: ["/gekia-tsu2.mp4"],
    super: ["/kakutei.mp4"],
    jackpot: ["/kakutei.mp4"],
  },
};

// 開発用：5連ガチャ時に固定で再生する6本（1本目はイントロ、2-6本目は音声付き4秒映像）
const DEV_FIVE_KEYS = [
  "ready-go.mp4",           // 1本目: 2秒のイントロ（音声なしでOK）
  "尊師チャンスロゴ.mp4",
  "超激アツ.mp4",
  "天国モード突入.mp4",
  "確定イエーイ.mp4",
  "確定.mp4",
];

const BASE_URL = publicEnv.NEXT_PUBLIC_R2_PUBLIC_BASE_URL?.replace(/\/$/, "");

type DurationRange = { min: number; max: number };

const PHASE_DURATION: Record<Phase, DurationRange> = {
  intro: { min: 3, max: 5 },
  mid: { min: 5, max: 8 },
  buildup: { min: 8, max: 12 },
  finale: { min: 15, max: 20 },
};

const DOUBLE_DURATION: DurationRange[] = [
  { min: 8, max: 10 },
  { min: 15, max: 20 },
];

const FIVE_DURATION: DurationRange[] = [
  { min: 3, max: 5 },
  { min: 3, max: 5 },
  { min: 5, max: 8 },
  { min: 5, max: 8 },
  { min: 15, max: 20 },
];

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function pickInRange(range: DurationRange): number {
  const { min, max } = range;
  return Math.round(Math.random() * (max - min) + min);
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

function getDuration(pullNumber: number, total: number, phase: Phase): number {
  if (total === 2) {
    const range = DOUBLE_DURATION[Math.min(pullNumber - 1, DOUBLE_DURATION.length - 1)];
    return pickInRange(range);
  }

  if (total === 5) {
    const range = FIVE_DURATION[Math.min(pullNumber - 1, FIVE_DURATION.length - 1)];
    return pickInRange(range);
  }

  const range = PHASE_DURATION[phase];
  return pickInRange(range);
}

function resolveVideoKey(phase: Phase, heat: HeatLevel) {
  const pool = VIDEO_LIBRARY[phase];
  const direct = pool[heat];
  if (direct && direct.length > 0) return pickRandom(direct);
  const fallback = pool.normal ?? [];
  return fallback.length > 0 ? pickRandom(fallback) : "";
}

function buildVideoUrl(key: string) {
  if (!key) return null;
  // 開発環境：keyが既に/で始まる場合はそのまま返す
  if (key.startsWith("/")) return key;
  // 本番環境：R2のURLを使用
  if (!BASE_URL) return null;
  return `${BASE_URL}/${key}`;
}

export function buildScenario(rarities: Rarity[]): ScenarioStep[] {
  // 開発用：5連ガチャは固定の6本を順番に再生する（1本目はイントロ）
  if (rarities.length === 5) {
    return DEV_FIVE_KEYS.map((key, idx) => {
      const videoUrl = buildVideoUrl(`/dev-videos/${encodeURIComponent(key)}`);
      const isFinal = idx === DEV_FIVE_KEYS.length - 1;
      const isIntro = idx === 0; // 1本目はイントロ
      return {
        index: idx + 1,
        phase: isFinal ? "finale" : "mid",
        heat: "hot",
        rarity: isIntro ? rarities[0] : rarities[idx - 1], // 1本目は最初のrarity、2本目以降はずれる
        videoKey: key,
        durationSeconds: isIntro ? 2 : 4, // 1本目は2秒、それ以外は4秒
        videoUrl,
      } as ScenarioStep;
    });
  }

  return rarities.map((rarity, index) => {
    const pullNumber = index + 1;
    const phase = getPhase(pullNumber, rarities.length);
    const baseHeat = getHeatLevel(rarity, rarities.slice(0, index));
    const heat: HeatLevel = phase === "finale" && rarity === "UR" ? "jackpot" : baseHeat;
    const durationSeconds = getDuration(pullNumber, rarities.length, phase);
    const videoKey = resolveVideoKey(phase, heat);
    return {
      index: pullNumber,
      phase,
      heat,
      rarity,
      videoKey,
      durationSeconds,
      videoUrl: buildVideoUrl(videoKey),
    };
  });
}

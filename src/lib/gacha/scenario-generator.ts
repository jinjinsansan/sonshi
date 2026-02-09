import { DONDEN_PATTERNS, GROUP_RULES } from "@/lib/gacha/scenario-constants";

export interface Scenario {
  star: number;
  videos: string[];
  isDonden: boolean;
  dondenType?: "win" | "small_win" | "lose";
  hasTsuigeki: boolean;
  tsuigekiResult?: "success" | "fail";
  cardCount: number;
}

export interface Settings {
  rtp: { [star: number]: number };
  donden: { win: number; small_win: number; lose: number };
  tsuigeki: {
    [star: number]: {
      successRate: number;
      cardCountOnSuccess: number;
      thirdCardRate?: number;
    };
  };
}

const EARLY_EXIT_VIDEOS = new Set(["T02", "E03", "E04", "E05", "G04", "G05"]);

const DEFAULT_SETTINGS: Settings = {
  rtp: {
    1: 30.0,
    2: 25.0,
    3: 20.0,
    4: 10.0,
    5: 6.0,
    6: 4.0,
    7: 2.5,
    8: 1.3,
    9: 0.7,
    10: 0.3,
    11: 0.15,
    12: 0.05,
  },
  donden: {
    win: 0.5,
    small_win: 1.0,
    lose: 2.0,
  },
  tsuigeki: {
    10: { successRate: 50, cardCountOnSuccess: 2 },
    11: { successRate: 80, cardCountOnSuccess: 2 },
    12: { successRate: 100, cardCountOnSuccess: 2, thirdCardRate: 30 },
  },
};

function getGroupByStar(star: number): "A" | "B" | "C" | "D" | "E" {
  if (star <= 3) return "A";
  if (star <= 5) return "B";
  if (star <= 7) return "C";
  if (star <= 9) return "D";
  return "E";
}

export function drawStar(rtpSettings: { [star: number]: number }): number {
  const roll = Math.random() * 100;
  let cumulative = 0;

  for (let star = 1; star <= 12; star += 1) {
    cumulative += rtpSettings[star] || 0;
    if (roll < cumulative) {
      return star;
    }
  }

  return 1;
}

export function checkDonden(dondenSettings: { win: number; small_win: number; lose: number }) {
  const roll = Math.random() * 100;

  if (roll < dondenSettings.win) {
    return { isDonden: true, type: "win" as const };
  }

  if (roll < dondenSettings.win + dondenSettings.small_win) {
    return { isDonden: true, type: "small_win" as const };
  }

  if (roll < dondenSettings.win + dondenSettings.small_win + dondenSettings.lose) {
    return { isDonden: true, type: "lose" as const };
  }

  return { isDonden: false, type: undefined } as const;
}

function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function isEarlyExit(videoId: string) {
  return EARLY_EXIT_VIDEOS.has(videoId);
}

function generateDondenScenario(type: "win" | "small_win" | "lose"): Scenario {
  const pattern = DONDEN_PATTERNS[type];
  const videos = pattern.map((entry) => pickRandom(entry.options));
  const star = type === "win" ? 12 : type === "small_win" ? 8 : 3;

  return {
    star,
    videos,
    isDonden: true,
    dondenType: type,
    hasTsuigeki: false,
    tsuigekiResult: undefined,
    cardCount: type === "win" ? 2 : type === "small_win" ? 1 : 0,
  };
}

function generateNormalScenario(
  star: number,
  tsuigekiSettings: Settings["tsuigeki"]
): Scenario {
  const group = getGroupByStar(star);
  const ruleSet = GROUP_RULES[group];
  const rules = ruleSet.rules as Record<number, { allowed?: readonly string[]; forbidden?: readonly string[] }>;

  // コマの再生順序: 1(待機) → 2(カウントダウン+暗転統合) → 4(チャレンジ) → 5(証拠) → 6(顔) → 7(追撃準備)
  // ※3コマ目(暗転)は2コマ目に統合されたため削除
  const KOMA_ORDER = [1, 2, 4, 5, 6, 7];

  const videos: string[] = [];
  let earlyExit = false;

  for (let i = 0; i < KOMA_ORDER.length; i += 1) {
    const koma = KOMA_ORDER[i];
    const slotRules = rules[koma] ?? { allowed: [], forbidden: [] };
    const allowed = slotRules.allowed ?? [];
    const pool = allowed.length > 0 ? allowed : slotRules.forbidden ?? [];
    const candidates = allowed.length > 0 ? allowed : pool;
    const selected = pickRandom(candidates);
    videos.push(selected);

    // 早期終了チェックは元のコマ番号（4,5,6）で判定
    if (koma >= 4 && koma <= 6 && isEarlyExit(selected)) {
      earlyExit = true;
      break;
    }
  }

  let hasTsuigeki = false;
  let tsuigekiResult: "success" | "fail" | undefined;
  let cardCount = 1;

  if (star >= 10 && !earlyExit) {
    const lastVideo = videos[videos.length - 1];

    if (lastVideo === "G01") {
      hasTsuigeki = true;
      const settings = tsuigekiSettings[star];

      if (settings) {
        const successRoll = Math.random() * 100;
        tsuigekiResult = successRoll < settings.successRate ? "success" : "fail";
        videos.push(tsuigekiResult === "success" ? "H01" : "H02");

        if (tsuigekiResult === "success") {
          cardCount = settings.cardCountOnSuccess;

          if (star === 12 && settings.thirdCardRate) {
            const thirdRoll = Math.random() * 100;
            if (thirdRoll < settings.thirdCardRate) {
              cardCount = 3;
            }
          }
        }
      }
    }
  }

  if (star === 11 && !hasTsuigeki) {
    cardCount = 2;
  }

  if (star === 12 && !hasTsuigeki) {
    cardCount = Math.random() < 0.3 ? 3 : 2;
  }

  return {
    star,
    videos,
    isDonden: false,
    hasTsuigeki,
    tsuigekiResult,
    cardCount,
  };
}

export function generateScenario(settings?: Settings): Scenario {
  const resolved = settings ?? DEFAULT_SETTINGS;

  const dondenCheck = checkDonden(resolved.donden);
  if (dondenCheck.isDonden && dondenCheck.type) {
    return generateDondenScenario(dondenCheck.type);
  }

  const star = drawStar(resolved.rtp);
  return generateNormalScenario(star, resolved.tsuigeki);
}

export const DEFAULT_SCENARIO_SETTINGS = DEFAULT_SETTINGS;

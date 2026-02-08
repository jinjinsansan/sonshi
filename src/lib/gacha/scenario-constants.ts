/**
 * 尊師ガチャ v2 - シナリオ定数
 */

export const VIDEOS = {
  STANDBY: {
    S01: { name: "イエロー", color: "yellow", hint: "unknown" },
    S02: { name: "レインボー", color: "rainbow", hint: "big_win" },
    S03: { name: "グレー", color: "gray", hint: "lose" },
    S04: { name: "ブルー", color: "blue", hint: "small_win" },
    S05: { name: "レッド", color: "red", hint: "unknown" },
    S06: { name: "ホワイト", color: "white", hint: "unknown" },
  },

  COUNTDOWN: {
    C01: { name: "876", color: "rainbow", hint: "big_win" },
    C02: { name: "234", color: "yellow", hint: "unknown" },
    C03: { name: "528", color: "blue", hint: "small_win" },
    C04: { name: "なんで？", color: "red", hint: "lose" },
    C05: { name: "無想陰影", color: "gray", hint: "lose" },
    C06: { name: "助けて…", color: "gray", hint: "lose" },
  },

  BLACKOUT: {
    B01: { name: "ブラックアウト", color: "black", hint: "reset" },
  },

  SONSHI_CHALLENGE: {
    T01: { name: "イエロー", color: "yellow", hint: "unknown" },
    T02: { name: "グレー", color: "gray", hint: "lose" },
    T03: { name: "レインボー", color: "rainbow", hint: "big_win" },
    T04: { name: "ブルー", color: "blue", hint: "small_win" },
    T05: { name: "ブラック", color: "black", hint: "lose" },
    T06: { name: "ホワイト", color: "white", hint: "unknown" },
  },

  EVIDENCE: {
    E01: { name: "まだまだ", color: "yellow", hint: "unknown" },
    E02: { name: "ワンチャン", color: "blue", hint: "small_win" },
    E03: { name: "お前はクビ", color: "gray", hint: "lose" },
    E04: { name: "お前はダメ", color: "gray", hint: "lose" },
    E05: { name: "無能乙", color: "gray", hint: "lose" },
    E06: { name: "尊師降臨", color: "rainbow", hint: "big_win" },
  },

  FACE: {
    F01: { name: "尊師！尊師！", color: "rainbow", hint: "big_win" },
    F02: { name: "残念でした", color: "gray", hint: "lose" },
    F03: { name: "なんでそうなるの？", color: "gray", hint: "lose" },
    F04: { name: "まだやる？", color: "blue", hint: "small_win" },
    F05: { name: "うーん…", color: "yellow", hint: "unknown" },
    F06: { name: "尊師様ァ！", color: "rainbow", hint: "big_win" },
  },

  TSUIGEKI_READY: {
    G01: { name: "追撃チャンス", color: "rainbow", next: "tsuigeki" },
    G02: { name: "ご苦労様でした", color: "white", next: "result" },
    G03: { name: "お疲れっす", color: "blue", hint: "win", next: "result" },
    G04: { name: "お布施しろ", color: "gray", hint: "lose", next: "result" },
    G05: { name: "ガチで死ね", color: "gray", hint: "lose", next: "result" },
    G06: { name: "笑笑笑笑笑笑", color: "yellow", hint: "big_win", next: "result" },
  },

  TSUIGEKI: {
    H01: { name: "追撃成功", result: "success" },
    H02: { name: "追撃失敗", result: "fail" },
  },
} as const;

export const GROUP_RULES = {
  A: {
    stars: [1, 2, 3],
    rules: {
      1: { allowed: ["S01", "S03", "S05", "S06"], forbidden: ["S02", "S04"] },
      2: { allowed: ["C04", "C05", "C06"], forbidden: ["C01", "C02", "C03"] },
      3: { allowed: ["B01"], forbidden: [] },
      4: { allowed: ["T02", "T04", "T06"], forbidden: ["T01", "T03", "T05"] },
      5: { allowed: ["E03", "E04", "E05"], forbidden: ["E01", "E02", "E06"] },
      6: { allowed: ["F02", "F03", "F05"], forbidden: ["F01", "F04", "F06"] },
      7: { allowed: ["G02", "G04", "G05"], forbidden: ["G01", "G03", "G06"] },
    },
  },

  B: {
    stars: [4, 5],
    rules: {
      1: { allowed: ["S01", "S03", "S05", "S06"], forbidden: ["S02", "S04"] },
      2: { allowed: ["C02", "C03", "C04", "C05", "C06"], forbidden: ["C01"] },
      3: { allowed: ["B01"], forbidden: [] },
      4: { allowed: ["T02", "T04", "T06"], forbidden: ["T03"] },
      5: { allowed: ["E02", "E03", "E04", "E05"], forbidden: ["E01", "E06"] },
      6: { allowed: ["F02", "F03", "F05"], forbidden: ["F01", "F06"] },
      7: { allowed: ["G02", "G03", "G04", "G05"], forbidden: ["G01", "G06"] },
    },
  },

  C: {
    stars: [6, 7],
    rules: {
      1: { allowed: ["S01", "S04", "S05", "S06"], forbidden: ["S02", "S03"] },
      2: { allowed: ["C02", "C03", "C04", "C05"], forbidden: ["C01", "C06"] },
      3: { allowed: ["B01"], forbidden: [] },
      4: { allowed: ["T01", "T04"], forbidden: ["T02", "T05"] },
      5: { allowed: ["E01", "E02", "E06"], forbidden: ["E03", "E04", "E05"] },
      6: { allowed: ["F04", "F05"], forbidden: ["F01", "F02", "F03", "F06"] },
      7: { allowed: ["G01", "G03", "G06"], forbidden: ["G02", "G04", "G05"] },
    },
  },

  D: {
    stars: [8, 9],
    rules: {
      1: { allowed: ["S01", "S02", "S04", "S06"], forbidden: ["S03", "S05"] },
      2: { allowed: ["C01", "C02", "C03"], forbidden: ["C04", "C05", "C06"] },
      3: { allowed: ["B01"], forbidden: [] },
      4: { allowed: ["T01", "T03"], forbidden: ["T02", "T05"] },
      5: { allowed: ["E01", "E06"], forbidden: ["E03", "E04", "E05"] },
      6: { allowed: ["F01", "F06"], forbidden: ["F02", "F03", "F05"] },
      7: { allowed: ["G01", "G03", "G06"], forbidden: ["G02", "G04", "G05"] },
    },
  },

  E: {
    stars: [10, 11, 12],
    rules: {
      1: { allowed: ["S02", "S04", "S06"], forbidden: ["S03", "S05"] },
      2: { allowed: ["C01", "C02", "C03"], forbidden: ["C04", "C05", "C06"] },
      3: { allowed: ["B01"], forbidden: [] },
      4: { allowed: ["T01", "T03"], forbidden: ["T02", "T05"] },
      5: { allowed: ["E01", "E06"], forbidden: ["E03", "E04", "E05"] },
      6: { allowed: ["F01", "F06"], forbidden: ["F02", "F03", "F05"] },
      7: { allowed: ["G01", "G06"], forbidden: ["G02", "G04", "G05"] },
    },
  },
} as const;

export const DONDEN_PATTERNS = {
  win: [
    { koma: 1, options: ["S03"] },
    { koma: 2, options: ["C05", "C06"] },
    { koma: 3, options: ["B01"] },
    { koma: 4, options: ["T02", "T04"] },
    { koma: 5, options: ["E03", "E05"] },
    { koma: 6, options: ["F02"] },
    { koma: 7, options: ["G06"] },
  ],

  small_win: [
    { koma: 1, options: ["S05"] },
    { koma: 2, options: ["C04"] },
    { koma: 3, options: ["B01"] },
    { koma: 4, options: ["T04"] },
    { koma: 5, options: ["E05"] },
    { koma: 6, options: ["F05"] },
    { koma: 7, options: ["G03"] },
  ],

  lose: [
    { koma: 1, options: ["S02", "S04"] },
    { koma: 2, options: ["C01"] },
    { koma: 3, options: ["B01"] },
    { koma: 4, options: ["T03"] },
    { koma: 5, options: ["E06"] },
    { koma: 6, options: ["F01"] },
    { koma: 7, options: ["G04", "G05"] },
  ],
} as const;

export function getVideoPath(videoId: string): string {
  const komaMap: Record<string, number> = {
    S: 1,
    C: 2,
    B: 3,
    T: 4,
    E: 5,
    F: 6,
    G: 7,
    H: 8,
  };

  const prefix = videoId[0];
  const koma = komaMap[prefix] || 0;
  return `/videos/${koma}_${videoId}.mp4`;
}

export function getVideoInfo(videoId: string): { name: string; color?: string; hint?: string } | null {
  const prefix = videoId[0];
  const categories: Record<string, keyof typeof VIDEOS> = {
    S: "STANDBY",
    C: "COUNTDOWN",
    B: "BLACKOUT",
    T: "SONSHI_CHALLENGE",
    E: "EVIDENCE",
    F: "FACE",
    G: "TSUIGEKI_READY",
    H: "TSUIGEKI",
  };

  const category = categories[prefix];
  if (!category) return null;
  const info = (VIDEOS[category] as Record<string, { name: string; color?: string; hint?: string }>)[videoId];
  return info ?? null;
}

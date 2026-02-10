import { randomChoice } from "./utils";
import { DondenSetting, Video, VideoCategory, VideoSequenceItem } from "./types";

type JudgeType = "continue" | "lose";

export function selectStandby(
  star: number,
  isDonden: boolean,
  dondenType: DondenSetting["type"] | undefined,
  videos: Video[]
): Video {
  const standbyVideos = videos.filter((v) => v.category === "standby" && v.is_active);

  const s02 = standbyVideos.find((v) => v.video_id === "S02");
  const s03 = standbyVideos.find((v) => v.video_id === "S03");

  if (isDonden && dondenType === "lose_to_win" && s03) {
    return s03;
  }
  if (isDonden && dondenType === "win_to_lose" && s02) {
    return s02;
  }

  if (star >= 10 && s02) {
    return Math.random() < 0.4 ? s02 : randomChoice(standbyVideos.filter((v) => v.video_id !== "S03"));
  }
  if (star >= 8 && s02) {
    return Math.random() < 0.2 ? s02 : randomChoice(standbyVideos.filter((v) => v.video_id !== "S03"));
  }
  if (star >= 4) {
    return randomChoice(standbyVideos.filter((v) => v.video_id !== "S03"));
  }
  if (s03 && Math.random() < 0.3) {
    return s03;
  }
  return randomChoice(standbyVideos.filter((v) => v.video_id !== "S02"));
}

export function selectCountdown(
  star: number,
  isDonden: boolean,
  dondenType: DondenSetting["type"] | undefined,
  videos: Video[]
): Video {
  const countdownVideos = videos.filter((v) => v.category === "countdown" && v.is_active);
  const hot = countdownVideos.filter((v) => ["C01", "C02", "C03", "C04"].includes(v.video_id));
  const cold = countdownVideos.filter((v) => ["C05", "C06"].includes(v.video_id));
  const c04 = countdownVideos.find((v) => v.video_id === "C04") ?? randomChoice(hot);

  if (isDonden && dondenType === "lose_to_win") {
    return randomChoice(cold);
  }
  if (isDonden && dondenType === "win_to_lose") {
    return Math.random() < 0.5 ? c04 : randomChoice(hot);
  }

  if (star >= 10) {
    return Math.random() < 0.5 ? c04 : randomChoice(hot);
  }
  if (star >= 8) {
    return Math.random() < 0.8 ? randomChoice(hot) : randomChoice(cold);
  }
  if (star >= 6) {
    return Math.random() < 0.6 ? randomChoice(hot) : randomChoice(cold);
  }
  if (star >= 4) {
    return randomChoice(countdownVideos);
  }
  return Math.random() < 0.7 ? randomChoice(cold) : randomChoice(hot);
}

export function selectYokoku(
  star: number,
  result: "win" | "lose",
  isDonden: boolean,
  progress: number,
  videos: Video[]
): Video | null {
  const yokoku = videos.filter((v) => v.category === "yokoku" && v.is_active);
  const frankelAppear = yokoku.find((v) => v.video_id === "Y01");
  const kakeruAppear = yokoku.find((v) => v.video_id === "Y03");

  if (result === "win" && !isDonden && frankelAppear) {
    const frankelRate = Math.min(star * 5, 50);
    if (Math.random() * 100 < frankelRate) return frankelAppear;
  }

  if (result === "lose" && !isDonden && kakeruAppear) {
    const kakeruRate = progress * 40;
    if (Math.random() * 100 < kakeruRate) return kakeruAppear;
  }

  if (isDonden && result === "win" && progress < 0.8 && kakeruAppear) {
    if (Math.random() < 0.3) return kakeruAppear;
  }
  if (isDonden && result === "lose" && progress < 0.8 && frankelAppear) {
    if (Math.random() < 0.3) return frankelAppear;
  }

  return null;
}

export function selectJudge(
  judgeType: JudgeType,
  usedIds: Set<string>,
  videos: Video[]
): Video | null {
  const pool = videos.filter(
    (v) => v.category === "judge" && v.video_type === judgeType && v.is_active && !usedIds.has(v.video_id)
  );
  if (pool.length === 0) {
    const fallback = videos.filter((v) => v.category === "judge" && v.video_type === judgeType && v.is_active);
    return fallback.length > 0 ? randomChoice(fallback) : null;
  }
  return randomChoice(pool);
}

export function selectReaction(
  star: number,
  result: "win" | "lose",
  isDonden: boolean,
  progress: number,
  videos: Video[]
): Video | null {
  const ito = videos.filter((v) => v.category === "reaction_ito" && v.is_active);
  const guri = videos.filter((v) => v.category === "reaction_guri" && v.is_active);
  const reactionVideos = Math.random() < 0.5 ? ito : guri;

  const positive = reactionVideos.filter((v) => v.video_type === "positive" || v.video_type === "very_positive");
  const negative = reactionVideos.filter((v) => v.video_type === "negative" || v.video_type === "very_negative");

  if (result === "win" && !isDonden) {
    const veryPositive = reactionVideos.find((v) => v.video_type === "very_positive");
    if (star >= 8 && veryPositive && Math.random() < 0.4) return veryPositive;
    return positive.length ? randomChoice(positive) : null;
  }

  if (result === "lose" && !isDonden) {
    const veryNegative = reactionVideos.find((v) => v.video_type === "very_negative");
    if (progress > 0.6 && veryNegative && Math.random() < 0.4) return veryNegative;
    return negative.length ? randomChoice(negative) : null;
  }

  if (isDonden) {
    if (result === "win") {
      return negative.length ? randomChoice(negative) : null;
    }
    return positive.length ? randomChoice(positive) : null;
  }

  return null;
}

export function addSequenceItem(
  sequence: VideoSequenceItem[],
  video: Video | null,
  order: number,
  mapCategory?: VideoCategory
): number {
  if (!video) return order;
  sequence.push({
    order,
    video_id: video.video_id,
    category: mapCategory ?? video.category,
    filename: video.filename,
    hint_level: video.hint_level,
  });
  return order + 1;
}

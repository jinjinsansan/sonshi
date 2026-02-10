import { randomUUID } from "crypto";
import { selectCountdown, selectJudge, selectReaction, selectStandby, selectYokoku } from "./selectors";
import { findVideoByType, randomInt, toSequenceItem } from "./utils";
import {
  DondenSetting,
  Scenario,
  ScenarioResult,
  Video,
  VideoSequenceItem,
  RtpSetting,
} from "./types";

type DondenCheck = { isDonden: boolean; type?: DondenSetting["type"] };

export function drawStar(rtpSettings: RtpSetting[]): number {
  const ordered = [...rtpSettings].sort((a, b) => a.star - b.star);
  const roll = Math.random() * 100;
  let cumulative = 0;
  for (const setting of ordered) {
    cumulative += Number(setting.probability);
    if (roll < cumulative) return setting.star;
  }
  return ordered[0]?.star ?? 1;
}

export function checkDonden(
  star: number,
  currentResult: ScenarioResult,
  dondenSettings: DondenSetting[]
): DondenCheck {
  for (const setting of dondenSettings) {
    if (setting.is_active === false) continue;
    if (setting.min_star && star < setting.min_star) continue;
    if (setting.max_star && star > setting.max_star) continue;

    if (setting.type === "lose_to_win" && currentResult !== "lose") continue;
    if (setting.type === "win_to_lose" && currentResult !== "win") continue;

    if (Math.random() * 100 < Number(setting.probability)) {
      return { isDonden: true, type: setting.type };
    }
  }
  return { isDonden: false };
}

export function buildVideoSequence(
  star: number,
  result: ScenarioResult,
  komaCount: number,
  isDonden: boolean,
  dondenType: DondenSetting["type"] | undefined,
  videos: Video[]
): VideoSequenceItem[] {
  const sequence: VideoSequenceItem[] = [];
  let order = 1;

  const standby = selectStandby(star, isDonden, dondenType, videos);
  sequence.push(toSequenceItem(order++, standby));

  const countdown = selectCountdown(star, isDonden, dondenType, videos);
  sequence.push(toSequenceItem(order++, countdown));

  const middleKomaCount = Math.max(0, komaCount - 3); // standby, countdown, result
  const judgeUsed = new Set<string>();

  for (let i = 0; i < middleKomaCount; i += 1) {
    const isLast = i === middleKomaCount - 1;
    const progress = middleKomaCount === 0 ? 1 : i / middleKomaCount;

    // 予告（20%）
    if (!isLast && Math.random() < 0.2) {
      const yokoku = selectYokoku(star, result, isDonden, progress, videos);
      if (yokoku) sequence.push(toSequenceItem(order++, yokoku));
    }

    const judgeType: "continue" | "lose" = isLast && result === "lose" && !isDonden ? "lose" : "continue";
    const judge = selectJudge(judgeType, judgeUsed, videos);
    if (judge) {
      sequence.push(toSequenceItem(order++, judge));
      judgeUsed.add(judge.video_id);
    }

    // リアクション（30%）
    if (!isLast && Math.random() < 0.3) {
      const reaction = selectReaction(star, result, isDonden, progress, videos);
      if (reaction) sequence.push(toSequenceItem(order++, reaction));
    }
  }

  // どんでん演出前置き
  if (isDonden && dondenType) {
    if (dondenType === "lose_to_win") {
      const frankel = findVideoByType(videos, "yokoku", "super_positive");
      sequence.push(toSequenceItem(order++, frankel));
    } else if (dondenType === "win_to_lose") {
      const kakeru = findVideoByType(videos, "yokoku", "danger");
      sequence.push(toSequenceItem(order++, kakeru));
    }
  }

  const resultType = result === "win" ? "win" : "lose";
  const resultVideo = findVideoByType(videos, "result", resultType);
  sequence.push(toSequenceItem(order++, resultVideo));

  return sequence;
}

export function generateScenario(
  rtpSettings: RtpSetting[],
  dondenSettings: DondenSetting[],
  videos: Video[]
): Scenario {
  const star = drawStar(rtpSettings);
  const baseResult: ScenarioResult = star >= 4 ? "win" : "lose";

  const donden = checkDonden(star, baseResult, dondenSettings);
  const isDonden = donden.isDonden;
  const dondenType = donden.type;
  const result: ScenarioResult = isDonden ? (baseResult === "win" ? "lose" : "win") : baseResult;

  const rtpSetting = rtpSettings.find((r) => r.star === star);
  const minKoma = rtpSetting?.min_koma ?? 3;
  const maxKoma = rtpSetting?.max_koma ?? 12;
  const komaCount = randomInt(minKoma, maxKoma);

  const video_sequence = buildVideoSequence(star, result, komaCount, isDonden, dondenType, videos);

  let has_tsuigeki = false;
  let tsuigeki_result: "success" | "fail" | undefined;
  let card_count = result === "win" ? 1 : 0;

  if (star >= 10 && result === "win") {
    has_tsuigeki = true;
    const successRate = star === 10 ? 50 : star === 11 ? 80 : 100;
    tsuigeki_result = Math.random() * 100 < successRate ? "success" : "fail";

    // 置き換え: 最後の結果を追撃チャンスに差し替え
    const chance = findVideoByType(videos, "result", "tsuigeki_chance");
    const resVideo = findVideoByType(
      videos,
      "result",
      tsuigeki_result === "success" ? "tsuigeki_success" : "tsuigeki_fail"
    );

    if (video_sequence.length > 0) {
      video_sequence[video_sequence.length - 1] = toSequenceItem(video_sequence.length, chance);
      video_sequence.push(toSequenceItem(video_sequence.length + 1, resVideo));
    } else {
      video_sequence.push(toSequenceItem(1, chance));
      video_sequence.push(toSequenceItem(2, resVideo));
    }

    if (tsuigeki_result === "success") {
      card_count = star === 12 ? (Math.random() < 0.3 ? 3 : 2) : 2;
    }
  }

  return {
    id: randomUUID(),
    star,
    result,
    is_donden: isDonden,
    donden_type: dondenType,
    has_tsuigeki,
    tsuigeki_result,
    card_count,
    video_sequence,
  };
}

import { loadRtpSettings } from "@/lib/gacha/v3/data";
import { drawStar } from "@/lib/gacha/v3/generator";
import { randomChoice } from "../v3/utils";
import { loadChaseSettings, loadDondenRateSettings, loadStoryScenarios, loadStoryVideos } from "./data";
import { StoryPlay, StoryScenario, StorySequenceItem, StoryVideo, StoryResult } from "./types";

const RESULT_CARD_COUNTS: Record<StoryResult, number> = {
  lose: 0,
  small_win: 1,
  win: 1,
  big_win: 2,
  jackpot: 3,
};

function pickScenarioByWeight(list: StoryScenario[]): StoryScenario {
  const total = list.reduce((sum, s) => sum + (s.weight ?? 0), 0);
  const roll = Math.random() * total;
  let acc = 0;
  for (const s of list) {
    acc += s.weight ?? 0;
    if (roll <= acc) return s;
  }
  return list[0];
}

function buildSequence(scenario: StoryScenario, videos: StoryVideo[]): StorySequenceItem[] {
  const map = new Map(videos.map((v) => [v.id, v]));
  return scenario.video_sequence.map((id, idx) => {
    const v = map.get(id);
    if (!v) throw new Error(`story video missing: ${id}`);
    return {
      order: idx + 1,
      video_id: v.id,
      filename: v.filename,
      category: v.category,
      duration_seconds: v.duration_seconds,
    };
  });
}

function resolveChaseCardCount(
  star: number,
  chaseResult: "success" | "fail" | undefined,
  setting?: { success_rate: number; card_count_on_success: number; third_card_rate: number | null }
) {
  if (chaseResult !== "success") return 1;
  if (!setting) return 1;
  const baseCount = Math.max(1, Math.round(setting.card_count_on_success));
  if (star === 12 && setting.third_card_rate !== null && setting.third_card_rate !== undefined) {
    const minCount = Math.max(2, baseCount - 1);
    const roll = Math.random() * 100;
    return roll < setting.third_card_rate ? baseCount : minCount;
  }
  return baseCount;
}

export async function generateStoryPlay(): Promise<StoryPlay> {
  const [rtpSettings, scenarios, videos, dondenRates, chaseSettings] = await Promise.all([
    loadRtpSettings(),
    loadStoryScenarios(),
    loadStoryVideos(),
    loadDondenRateSettings(),
    loadChaseSettings(),
  ]);

  const star = drawStar(rtpSettings);
  const starScenarios = scenarios.filter((s) => s.star_rating === star);
  const dondenPool = starScenarios.filter((s) => s.is_donden === true);
  const normalPool = starScenarios.filter((s) => s.is_donden !== true);

  const dondenRate = dondenRates[star] ?? 0;
  const useDonden = dondenPool.length > 0 && Math.random() * 100 < dondenRate;
  const basePool = useDonden ? dondenPool : normalPool;
  const pool = basePool.length ? basePool : starScenarios.length ? starScenarios : scenarios;

  let scenario = pool.length ? pickScenarioByWeight(pool) : randomChoice(scenarios);
  let chaseResult: "success" | "fail" | undefined = scenario.has_chase ? scenario.chase_result : undefined;

  if (scenario.has_chase) {
    const setting = chaseSettings[star];
    if (setting) {
      const successRoll = Math.random() * 100;
      const desiredResult = successRoll < setting.success_rate ? "success" : "fail";
      const chasePool = pool.filter((s) => s.has_chase && s.chase_result === desiredResult);
      if (chasePool.length) {
        scenario = pickScenarioByWeight(chasePool);
      }
      chaseResult = desiredResult;
    }
  }

  const resolvedStar = scenario.star_rating ?? star;
  const video_sequence = buildSequence(scenario, videos);
  const card_count = scenario.has_chase
    ? resolveChaseCardCount(resolvedStar, chaseResult, chaseSettings[resolvedStar])
    : RESULT_CARD_COUNTS[scenario.result] ?? 0;

  return {
    star: resolvedStar,
    scenario_id: scenario.id,
    result: scenario.result,
    video_sequence,
    has_chase: scenario.has_chase,
    chase_result: chaseResult,
    is_donden: scenario.is_donden === true,
    card_count,
  };
}

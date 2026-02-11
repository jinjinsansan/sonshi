import { loadRtpSettings } from "@/lib/gacha/v3/data";
import { drawStar } from "@/lib/gacha/v3/generator";
import { randomChoice } from "../v3/utils";
import { loadDondenRates, loadStoryScenarios, loadStoryVideos } from "./data";
import { StoryPlay, StoryScenario, StorySequenceItem, StoryVideo } from "./types";

type DondenType = "win" | "small_win" | "lose";

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

function pickDondenType(rates: { win: number; small_win: number; lose: number }): DondenType | null {
  const roll = Math.random() * 100;
  if (roll < rates.win) return "win";
  if (roll < rates.win + rates.small_win) return "small_win";
  if (roll < rates.win + rates.small_win + rates.lose) return "lose";
  return null;
}

function matchesDondenResult(result: StoryScenario["result"], type: DondenType) {
  if (type === "lose") return result === "lose";
  if (type === "small_win") return result === "small_win";
  return result === "win" || result === "big_win" || result === "jackpot";
}

export async function generateStoryPlay(): Promise<StoryPlay> {
  const [rtpSettings, scenarios, videos, dondenRates] = await Promise.all([
    loadRtpSettings(),
    loadStoryScenarios(),
    loadStoryVideos(),
    loadDondenRates(),
  ]);

  const dondenType = pickDondenType(dondenRates);
  const dondenScenarios = scenarios.filter((s) => s.is_donden === true);

  if (dondenType && dondenScenarios.length) {
    const resultFiltered = dondenScenarios.filter((s) => matchesDondenResult(s.result, dondenType));
    const dondenPool = resultFiltered.length ? resultFiltered : dondenScenarios;
    const scenario = pickScenarioByWeight(dondenPool);
    const video_sequence = buildSequence(scenario, videos);

    return {
      star: scenario.star_rating,
      scenario_id: scenario.id,
      result: scenario.result,
      video_sequence,
      has_chase: scenario.has_chase,
      chase_result: scenario.chase_result,
    };
  }

  const star = drawStar(rtpSettings);

  // filter scenarios by star
  const candidates = scenarios.filter((s) => s.star_rating === star && s.is_donden !== true);
  const pool = candidates.length ? candidates : scenarios.filter((s) => s.star_rating === star) || scenarios;
  const scenario = pool.length ? pickScenarioByWeight(pool) : randomChoice(scenarios);
  const video_sequence = buildSequence(scenario, videos);

  return {
    star,
    scenario_id: scenario.id,
    result: scenario.result,
    video_sequence,
    has_chase: scenario.has_chase,
    chase_result: scenario.chase_result,
  };
}

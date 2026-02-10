import { loadRtpSettings } from "@/lib/gacha/v3/data";
import { checkDonden, drawStar } from "@/lib/gacha/v3/generator";
import { randomChoice } from "../v3/utils";
import { loadStoryScenarios, loadStoryVideos } from "./data";
import { StoryPlay, StoryScenario, StorySequenceItem, StoryVideo } from "./types";

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

export async function generateStoryPlay(): Promise<StoryPlay> {
  const [rtpSettings, scenarios, videos] = await Promise.all([
    loadRtpSettings(),
    loadStoryScenarios(),
    loadStoryVideos(),
  ]);

  const star = drawStar(rtpSettings);

  // filter scenarios by star
  const candidates = scenarios.filter((s) => s.star_rating === star && s.is_donden !== true);
  const dondenCandidates = scenarios.filter((s) => s.star_rating === star && s.is_donden === true);

  const donden = checkDonden(star, "win", []); // use existing turnabout settings; current base result unused in story
  const useDonden = donden.isDonden && dondenCandidates.length > 0;

  const pool = useDonden && dondenCandidates.length ? dondenCandidates : candidates.length ? candidates : scenarios.filter((s) => s.star_rating === star) || scenarios;
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

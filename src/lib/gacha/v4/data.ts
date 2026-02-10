import { getSupabaseServiceClient } from "@/lib/supabase/service";
import {
  StoryScenario,
  StoryScenarioDbRow,
  StoryVideo,
  StoryVideoDbRow,
  storyScenarioSchema,
  storyVideoSchema,
} from "./types";

const FALLBACK_VIDEOS: StoryVideo[] = [
  { id: "OP01", category: "opening", filename: "op_start.mp4", duration_seconds: 6, description: "今日こそ頑張るぞ！" },
  { id: "OP02", category: "opening", filename: "op_go_buy.mp4", duration_seconds: 6, description: "馬券買いに行きます！" },
  { id: "OP03", category: "opening", filename: "op_data.mp4", duration_seconds: 6, description: "データ整理します！" },
  { id: "MS01", category: "miss", filename: "miss_ticket_lost.mp4", duration_seconds: 6, description: "あれ...馬券が..." },
  { id: "MS02", category: "miss", filename: "miss_wrong_ticket.mp4", duration_seconds: 6, description: "やばい！！" },
  { id: "MS03", category: "miss", filename: "miss_deadline.mp4", duration_seconds: 6, description: "時間がない！" },
  { id: "MS04", category: "miss", filename: "miss_odds.mp4", duration_seconds: 6, description: "えっ...違う..." },
  { id: "MS05", category: "miss", filename: "miss_disaster.mp4", duration_seconds: 6, description: "終わった..." },
  { id: "HP01", category: "help", filename: "help_guri_advice.mp4", duration_seconds: 6, description: "落ち着け、こうすればいい" },
  { id: "HP02", category: "help", filename: "help_guri_encourage.mp4", duration_seconds: 6, description: "お前ならできる" },
  { id: "HP03", category: "help", filename: "help_takigawa_hint.mp4", duration_seconds: 6, description: "勝負の世界ではな..." },
  { id: "HP04", category: "help", filename: "help_frankel.mp4", duration_seconds: 8, description: "フランケル登場" },
  { id: "TR01", category: "trouble", filename: "trouble_kakeru.mp4", duration_seconds: 6, description: "無理無理〜" },
  { id: "TR02", category: "trouble", filename: "trouble_takigawa.mp4", duration_seconds: 6, description: "甘いんだよ！" },
  { id: "TR03", category: "trouble", filename: "trouble_more_miss.mp4", duration_seconds: 6, description: "またやった..." },
  { id: "IT01", category: "recovery", filename: "ito_recover.mp4", duration_seconds: 6, description: "やるしかない！" },
  { id: "IT02", category: "recovery", filename: "ito_fullpower.mp4", duration_seconds: 6, description: "全力でやります！" },
  { id: "SN01", category: "reaction", filename: "sonshi_angry.mp4", duration_seconds: 6, description: "何やってんだ！" },
  { id: "SN02", category: "reaction", filename: "sonshi_disappointed.mp4", duration_seconds: 6, description: "話にならん..." },
  { id: "SN03", category: "reaction", filename: "sonshi_watching.mp4", duration_seconds: 6, description: "..." },
  { id: "SN04", category: "reaction", filename: "sonshi_thinking.mp4", duration_seconds: 6, description: "ふむ..." },
  { id: "SN05", category: "reaction", filename: "sonshi_smirk.mp4", duration_seconds: 8, description: "ニヤリ" },
  { id: "JD01", category: "judge", filename: "judge_fired.mp4", duration_seconds: 8, description: "お前はクビだ" },
  { id: "JD02", category: "judge", filename: "judge_die.mp4", duration_seconds: 8, description: "お前は死ね" },
  { id: "JD03", category: "judge", filename: "judge_approved.mp4", duration_seconds: 8, description: "認めてやろう" },
  { id: "JD04", category: "judge", filename: "judge_laugh.mp4", duration_seconds: 8, description: "wwwwww" },
  { id: "JD05", category: "judge", filename: "judge_sonshi.mp4", duration_seconds: 8, description: "お前も尊師だ" },
  { id: "TS01", category: "chase", filename: "tsuigeki_chance.mp4", duration_seconds: 8, description: "まだだ..." },
  { id: "TS02", category: "chase", filename: "tsuigeki_success.mp4", duration_seconds: 8, description: "大勝利！" },
  { id: "TS03", category: "chase", filename: "tsuigeki_fail.mp4", duration_seconds: 8, description: "惜しかった..." },
];

export const FALLBACK_SCENARIOS: StoryScenario[] = [
  { id: "seed-1a", name: "★1 即ハズレA", star_rating: 1, result: "lose", video_sequence: ["OP01","MS01","JD01"], has_chase: false, weight: 100 },
  { id: "seed-1b", name: "★1 即ハズレB", star_rating: 1, result: "lose", video_sequence: ["OP02","MS05","JD02"], has_chase: false, weight: 80 },
  { id: "seed-2a", name: "★2 ミスハズレA", star_rating: 2, result: "lose", video_sequence: ["OP01","MS02","SN01","JD01"], has_chase: false, weight: 100 },
  { id: "seed-2b", name: "★2 ミスハズレB", star_rating: 2, result: "lose", video_sequence: ["OP03","MS04","SN02","JD02"], has_chase: false, weight: 80 },
  { id: "seed-3a", name: "★3 ハズレ緩急A", star_rating: 3, result: "lose", video_sequence: ["OP01","MS03","TR02","JD01"], has_chase: false, weight: 90 },
  { id: "seed-3b", name: "★3 ハズレ緩急B", star_rating: 3, result: "lose", video_sequence: ["OP02","MS04","SN01","JD02"], has_chase: false, weight: 90 },
  { id: "seed-4a", name: "★4 小当たりA", star_rating: 4, result: "small_win", video_sequence: ["OP01","MS02","HP01","JD03"], has_chase: false, weight: 100 },
  { id: "seed-4b", name: "★4 小当たりB", star_rating: 4, result: "small_win", video_sequence: ["OP02","MS01","HP02","JD03"], has_chase: false, weight: 80 },
  { id: "seed-5a", name: "★5 小当たり観察", star_rating: 5, result: "small_win", video_sequence: ["OP03","MS03","HP03","SN03","JD03"], has_chase: false, weight: 100 },
  { id: "seed-6a", name: "★6 当たり反撃", star_rating: 6, result: "win", video_sequence: ["OP01","MS02","HP02","IT01","JD03"], has_chase: false, weight: 100 },
  { id: "seed-7a", name: "★7 当たり試練", star_rating: 7, result: "win", video_sequence: ["OP02","MS03","TR01","HP03","IT02","JD03"], has_chase: false, weight: 100 },
  { id: "seed-8a", name: "★8 大当たり予告", star_rating: 8, result: "big_win", video_sequence: ["OP03","MS04","TR02","HP04","IT02","SN05","JD04"], has_chase: false, weight: 100 },
  { id: "seed-9a", name: "★9 激アツフランケル", star_rating: 9, result: "big_win", video_sequence: ["OP02","MS05","TR03","HP04","IT02","SN05","JD04"], has_chase: false, weight: 100 },
  { id: "seed-10a", name: "★10 追撃チャンス", star_rating: 10, result: "big_win", video_sequence: ["OP01","MS03","TR02","HP04","IT02","SN05","JD04","TS01","TS02"], has_chase: true, chase_result: "success", weight: 100 },
  { id: "seed-11a", name: "★11 神レア", star_rating: 11, result: "jackpot", video_sequence: ["OP02","MS04","TR02","HP04","IT02","SN05","JD05","TS01","TS02"], has_chase: true, chase_result: "success", weight: 100 },
  { id: "seed-12a", name: "★12 超神", star_rating: 12, result: "jackpot", video_sequence: ["OP03","MS05","TR02","HP04","IT02","SN05","JD05","TS01","TS02"], has_chase: true, chase_result: "success", weight: 120 },
];

export async function loadStoryVideos(): Promise<StoryVideo[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase.from("story_videos").select("id, category, filename, duration_seconds, description");
  if (error) {
    console.error("loadStoryVideos error", error);
    return FALLBACK_VIDEOS;
  }
  const parsed: StoryVideo[] = [];
  for (const row of data as StoryVideoDbRow[]) {
    const safe = storyVideoSchema.safeParse(row);
    if (safe.success) {
      parsed.push({ ...safe.data, category: safe.data.category as StoryVideo["category"] });
    }
  }
  return parsed.length ? parsed : FALLBACK_VIDEOS;
}

export async function loadStoryScenarios(): Promise<StoryScenario[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase.from("story_scenarios").select("id, name, star_rating, result, video_sequence, has_chase, chase_result, is_donden, weight").eq("is_active", true);
  if (error) {
    console.error("loadStoryScenarios error", error);
    return FALLBACK_SCENARIOS;
  }
  const parsed: StoryScenario[] = [];
  for (const row of data as StoryScenarioDbRow[]) {
    const safe = storyScenarioSchema.safeParse(row);
    if (safe.success) {
      parsed.push({
        ...safe.data,
        video_sequence: safe.data.video_sequence,
        result: safe.data.result as StoryScenario["result"],
        star_rating: Number(safe.data.star_rating),
        has_chase: Boolean(safe.data.has_chase),
        chase_result: safe.data.chase_result as StoryScenario["chase_result"],
        is_donden: safe.data.is_donden,
        weight: safe.data.weight ?? 100,
      });
    }
  }
  return parsed.length ? parsed : FALLBACK_SCENARIOS;
}

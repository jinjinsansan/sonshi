import { getSupabaseServiceClient } from "@/lib/supabase/service";
import {
  DondenSetting,
  DondenSettingDbRow,
  RtpSetting,
  RtpSettingDbRow,
  Video,
  VideoDbRow,
} from "./types";
import { dondenSettingSchema, rtpSettingSchema, videoSchema } from "./types";

// Fallback definitions from the V3 specification
export const FALLBACK_VIDEOS: Video[] = [
  { id: "", video_id: "S01", category: "standby", filename: "S01.mp4", name: "イエロー", hint_level: 0, video_type: null, is_active: true },
  { id: "", video_id: "S02", category: "standby", filename: "S02.mp4", name: "レインボー", hint_level: 40, video_type: null, is_active: true },
  { id: "", video_id: "S03", category: "standby", filename: "S03.mp4", name: "グレー", hint_level: -20, video_type: null, is_active: true },
  { id: "", video_id: "S04", category: "standby", filename: "S04.mp4", name: "ブルー", hint_level: 10, video_type: null, is_active: true },
  { id: "", video_id: "S05", category: "standby", filename: "S05.mp4", name: "レッド", hint_level: 0, video_type: null, is_active: true },
  { id: "", video_id: "S06", category: "standby", filename: "S06.mp4", name: "ホワイト", hint_level: 0, video_type: null, is_active: true },

  { id: "", video_id: "C01", category: "countdown", filename: "C01.mp4", name: "876", hint_level: 20, video_type: null, is_active: true },
  { id: "", video_id: "C02", category: "countdown", filename: "C02.mp4", name: "8765", hint_level: 20, video_type: null, is_active: true },
  { id: "", video_id: "C03", category: "countdown", filename: "C03.mp4", name: "87", hint_level: 20, video_type: null, is_active: true },
  { id: "", video_id: "C04", category: "countdown", filename: "C04.mp4", name: "87654321", hint_level: 50, video_type: null, is_active: true },
  { id: "", video_id: "C05", category: "countdown", filename: "C05.mp4", name: "4321", hint_level: -20, video_type: null, is_active: true },
  { id: "", video_id: "C06", category: "countdown", filename: "C06.mp4", name: "321", hint_level: -20, video_type: null, is_active: true },

  { id: "", video_id: "A01", category: "judge", filename: "3_continue.mp4", name: "審判開始（継続）", hint_level: 10, video_type: "continue", is_active: true },
  { id: "", video_id: "A02", category: "judge", filename: "3_lose.mp4", name: "審判開始（ハズレ）", hint_level: -30, video_type: "lose", is_active: true },
  { id: "", video_id: "A03", category: "judge", filename: "4_continue.mp4", name: "第一の試練（継続）", hint_level: 15, video_type: "continue", is_active: true },
  { id: "", video_id: "A04", category: "judge", filename: "4_lose.mp4", name: "第一の試練（ハズレ）", hint_level: -40, video_type: "lose", is_active: true },
  { id: "", video_id: "A05", category: "judge", filename: "5_continue.mp4", name: "第二の試練（継続）", hint_level: 20, video_type: "continue", is_active: true },
  { id: "", video_id: "A06", category: "judge", filename: "5_lose.mp4", name: "第二の試練（ハズレ）", hint_level: -50, video_type: "lose", is_active: true },
  { id: "", video_id: "A07", category: "judge", filename: "6_continue.mp4", name: "最終審判（継続）", hint_level: 30, video_type: "continue", is_active: true },
  { id: "", video_id: "A08", category: "judge", filename: "6_lose.mp4", name: "最終審判（ハズレ）", hint_level: -60, video_type: "lose", is_active: true },

  { id: "", video_id: "B01", category: "reaction_ito", filename: "ito_scared.mp4", name: "伊東（怯える）", hint_level: -10, video_type: "negative", is_active: true },
  { id: "", video_id: "B02", category: "reaction_ito", filename: "ito_relieved.mp4", name: "伊東（安堵）", hint_level: 10, video_type: "positive", is_active: true },
  { id: "", video_id: "B03", category: "reaction_ito", filename: "ito_laugh.mp4", name: "伊東（笑う）", hint_level: 30, video_type: "very_positive", is_active: true },
  { id: "", video_id: "B04", category: "reaction_ito", filename: "ito_cry.mp4", name: "伊東（泣く）", hint_level: -40, video_type: "very_negative", is_active: true },

  { id: "", video_id: "B05", category: "reaction_guri", filename: "guri_scared.mp4", name: "グリ（震える）", hint_level: -10, video_type: "negative", is_active: true },
  { id: "", video_id: "B06", category: "reaction_guri", filename: "guri_relieved.mp4", name: "グリ（ホッとする）", hint_level: 10, video_type: "positive", is_active: true },
  { id: "", video_id: "B07", category: "reaction_guri", filename: "guri_laugh.mp4", name: "グリ（笑う）", hint_level: 30, video_type: "very_positive", is_active: true },
  { id: "", video_id: "B08", category: "reaction_guri", filename: "guri_cry.mp4", name: "グリ（落ち込む）", hint_level: -40, video_type: "very_negative", is_active: true },

  { id: "", video_id: "Y01", category: "yokoku", filename: "frankel_appear.mp4", name: "フランケル登場", hint_level: 50, video_type: "super_positive", is_active: true },
  { id: "", video_id: "Y02", category: "yokoku", filename: "frankel_win.mp4", name: "フランケル勝利", hint_level: 100, video_type: "win_confirm", is_active: true },
  { id: "", video_id: "Y03", category: "yokoku", filename: "kakeru_appear.mp4", name: "かけるくん登場", hint_level: -30, video_type: "danger", is_active: true },
  { id: "", video_id: "Y04", category: "yokoku", filename: "kakeru_fail.mp4", name: "かけるくん失敗", hint_level: -50, video_type: "lose_hint", is_active: true },

  { id: "", video_id: "R01", category: "result", filename: "7_win.mp4", name: "当たり", hint_level: 100, video_type: "win", is_active: true },
  { id: "", video_id: "R02", category: "result", filename: "7_lose.mp4", name: "ハズレ", hint_level: -100, video_type: "lose", is_active: true },
  { id: "", video_id: "R03", category: "result", filename: "7_tsuigeki.mp4", name: "追撃チャンス", hint_level: 50, video_type: "tsuigeki_chance", is_active: true },
  { id: "", video_id: "R04", category: "result", filename: "8_success.mp4", name: "追撃成功", hint_level: 100, video_type: "tsuigeki_success", is_active: true },
  { id: "", video_id: "R05", category: "result", filename: "8_fail.mp4", name: "追撃失敗", hint_level: -50, video_type: "tsuigeki_fail", is_active: true },
];

export const FALLBACK_RTP: RtpSetting[] = [
  { star: 1, probability: 30.0, min_koma: 3, max_koma: 5 },
  { star: 2, probability: 25.0, min_koma: 3, max_koma: 5 },
  { star: 3, probability: 20.0, min_koma: 4, max_koma: 6 },
  { star: 4, probability: 10.0, min_koma: 5, max_koma: 7 },
  { star: 5, probability: 6.0, min_koma: 5, max_koma: 8 },
  { star: 6, probability: 4.0, min_koma: 6, max_koma: 9 },
  { star: 7, probability: 2.5, min_koma: 6, max_koma: 10 },
  { star: 8, probability: 1.3, min_koma: 7, max_koma: 11 },
  { star: 9, probability: 0.7, min_koma: 7, max_koma: 12 },
  { star: 10, probability: 0.3, min_koma: 8, max_koma: 14 },
  { star: 11, probability: 0.15, min_koma: 9, max_koma: 15 },
  { star: 12, probability: 0.05, min_koma: 10, max_koma: 16 },
];

export const FALLBACK_DONDEN: DondenSetting[] = [
  { type: "lose_to_win", probability: 5.0, min_star: 8, max_star: 12 },
  { type: "win_to_lose", probability: 3.0, min_star: 1, max_star: 3 },
];

export async function loadVideos(): Promise<Video[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase.from("videos").select("*").eq("is_active", true).order("sort_order");
  if (error) {
    console.error("loadVideos error", error);
    return FALLBACK_VIDEOS;
  }
  const parsed: Video[] = [];
  for (const row of data as VideoDbRow[]) {
    const safe = videoSchema.safeParse(row);
    if (safe.success) {
      const video: Video = {
        ...safe.data,
        category: safe.data.category as Video["category"],
        video_type: (safe.data.video_type as Video["video_type"]) ?? null,
      };
      parsed.push(video);
    }
  }
  return parsed.length ? parsed : FALLBACK_VIDEOS;
}

export async function loadRtpSettings(): Promise<RtpSetting[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase.from("rtp_settings").select("star, probability, min_koma, max_koma");
  if (error) {
    console.error("loadRtpSettings error", error);
    return FALLBACK_RTP;
  }
  const parsed: RtpSetting[] = [];
  for (const row of data as RtpSettingDbRow[]) {
    const safe = rtpSettingSchema.safeParse(row);
    if (safe.success) parsed.push({ ...safe.data });
  }
  return parsed.length ? parsed : FALLBACK_RTP;
}

export async function loadDondenSettings(): Promise<DondenSetting[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase.from("donden_settings").select("type, probability, min_star, max_star, is_active");
  if (error) {
    console.error("loadDondenSettings error", error);
    return FALLBACK_DONDEN;
  }
  const parsed: DondenSetting[] = [];
  for (const row of data as DondenSettingDbRow[]) {
    const safe = dondenSettingSchema.safeParse(row);
    if (safe.success) parsed.push({ ...safe.data });
  }
  return parsed.length ? parsed : FALLBACK_DONDEN;
}

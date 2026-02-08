import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { DEFAULT_SCENARIO_SETTINGS, type Settings } from "@/lib/gacha/scenario-generator";

type RtpRow = { star: number; probability: number };
type DondenRow = { type: string; probability: number };
type TsuigekiRow = {
  star: number;
  success_rate: number;
  card_count_on_success: number;
  third_card_rate: number | null;
};

export async function loadScenarioSettings(): Promise<Settings> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseServiceClient() as any;

  const [rtpRes, dondenRes, tsuigekiRes] = await Promise.all([
    supabase.from("rtp_settings").select("star, probability").order("star", { ascending: true }),
    supabase.from("donden_settings").select("type, probability"),
    supabase.from("tsuigeki_settings").select(
      "star, success_rate, card_count_on_success, third_card_rate"
    ),
  ]);

  const settings: Settings = {
    rtp: { ...DEFAULT_SCENARIO_SETTINGS.rtp },
    donden: { ...DEFAULT_SCENARIO_SETTINGS.donden },
    tsuigeki: { ...DEFAULT_SCENARIO_SETTINGS.tsuigeki },
  };

  if (rtpRes?.data) {
    for (const row of rtpRes.data as RtpRow[]) {
      if (row.star) {
        settings.rtp[row.star] = Number(row.probability ?? 0);
      }
    }
  }

  if (dondenRes?.data) {
    for (const row of dondenRes.data as DondenRow[]) {
      if (row.type === "win") settings.donden.win = Number(row.probability ?? 0);
      if (row.type === "small_win") settings.donden.small_win = Number(row.probability ?? 0);
      if (row.type === "lose") settings.donden.lose = Number(row.probability ?? 0);
    }
  }

  if (tsuigekiRes?.data) {
    for (const row of tsuigekiRes.data as TsuigekiRow[]) {
      settings.tsuigeki[row.star] = {
        successRate: Number(row.success_rate ?? 0),
        cardCountOnSuccess: Number(row.card_count_on_success ?? 1),
        thirdCardRate: row.third_card_rate !== null ? Number(row.third_card_rate) : undefined,
      };
    }
  }

  return settings;
}

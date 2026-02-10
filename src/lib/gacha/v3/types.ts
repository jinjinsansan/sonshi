import { z } from "zod";

export type VideoCategory =
  | "standby"
  | "countdown"
  | "judge"
  | "reaction_ito"
  | "reaction_guri"
  | "yokoku"
  | "result";

export type VideoType =
  | "continue"
  | "lose"
  | "win"
  | "tsuigeki_chance"
  | "tsuigeki_success"
  | "tsuigeki_fail"
  | "positive"
  | "very_positive"
  | "negative"
  | "very_negative"
  | "super_positive"
  | "win_confirm"
  | "danger"
  | "lose_hint"
  | null;

export type Video = {
  id: string;
  video_id: string;
  category: VideoCategory;
  filename: string;
  name: string;
  description?: string | null;
  hint_level: number;
  video_type: VideoType;
  duration?: number | null;
  is_active: boolean;
  sort_order?: number | null;
};

export type RtpSetting = {
  star: number;
  probability: number;
  min_koma: number;
  max_koma: number;
};

export type DondenSetting = {
  type: "lose_to_win" | "win_to_lose";
  probability: number;
  min_star?: number | null;
  max_star?: number | null;
  is_active?: boolean | null;
};

export type VideoSequenceItem = {
  order: number;
  video_id: string;
  category: VideoCategory;
  filename: string;
  hint_level: number;
};

export type ScenarioResult = "win" | "lose";

export type Scenario = {
  id: string;
  star: number;
  result: ScenarioResult;
  is_donden: boolean;
  donden_type?: DondenSetting["type"];
  has_tsuigeki: boolean;
  tsuigeki_result?: "success" | "fail";
  card_count: number;
  video_sequence: VideoSequenceItem[];
};

export const videoSchema = z.object({
  id: z.string().uuid(),
  video_id: z.string(),
  category: z.string(),
  filename: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  hint_level: z.number(),
  video_type: z.string().nullable(),
  duration: z.number().nullable().optional(),
  is_active: z.boolean(),
  sort_order: z.number().nullable().optional(),
});

export const rtpSettingSchema = z.object({
  star: z.number(),
  probability: z.number(),
  min_koma: z.number(),
  max_koma: z.number(),
});

export const dondenSettingSchema = z.object({
  type: z.union([z.literal("lose_to_win"), z.literal("win_to_lose")]),
  probability: z.number(),
  min_star: z.number().nullable().optional(),
  max_star: z.number().nullable().optional(),
  is_active: z.boolean().nullable().optional(),
});

export type VideoDbRow = z.infer<typeof videoSchema>;
export type RtpSettingDbRow = z.infer<typeof rtpSettingSchema>;
export type DondenSettingDbRow = z.infer<typeof dondenSettingSchema>;

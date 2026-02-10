import { z } from "zod";

export type StoryResult = "lose" | "small_win" | "win" | "big_win" | "jackpot";

export type StoryVideoCategory =
  | "opening"
  | "miss"
  | "help"
  | "trouble"
  | "recovery"
  | "reaction"
  | "judge"
  | "chase";

export type StoryVideo = {
  id: string; // OP01, MS01 ...
  category: StoryVideoCategory;
  filename: string;
  duration_seconds: number;
  description?: string | null;
};

export type StoryScenario = {
  id: string;
  name: string;
  star_rating: number;
  result: StoryResult;
  video_sequence: string[];
  has_chase: boolean;
  chase_result?: "success" | "fail";
  is_donden?: boolean | null;
  weight: number;
};

export type StorySequenceItem = {
  order: number;
  video_id: string;
  filename: string;
  category: StoryVideoCategory;
  duration_seconds: number;
};

export type StoryPlay = {
  star: number;
  scenario_id: string;
  result: StoryResult;
  video_sequence: StorySequenceItem[];
  has_chase: boolean;
  chase_result?: "success" | "fail";
};

export const storyVideoSchema = z.object({
  id: z.string(),
  category: z.string(),
  filename: z.string(),
  duration_seconds: z.number(),
  description: z.string().nullable().optional(),
});

export const storyScenarioSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  star_rating: z.number(),
  result: z.string(),
  video_sequence: z.array(z.string()),
  has_chase: z.boolean(),
  chase_result: z.string().nullable().optional(),
  is_donden: z.boolean().nullable().optional(),
  weight: z.number().optional().default(100),
});

export type StoryVideoDbRow = z.infer<typeof storyVideoSchema>;
export type StoryScenarioDbRow = z.infer<typeof storyScenarioSchema>;

import { NextResponse, type NextRequest } from "next/server";
import { getVideoPath } from "@/lib/gacha/scenario-constants";
import { getServerEnv } from "@/lib/env";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { getRequestAuthUser } from "@/lib/auth/session";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: Params) {
  const { GACHA_V2_ENABLED } = getServerEnv();
  if (!GACHA_V2_ENABLED) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const user = await getRequestAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseServiceClient() as any;
  const { data } = await supabase
    .from("gacha_history")
    .select("scenario")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data?.scenario) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const videos = Array.isArray(data.scenario?.videos)
    ? data.scenario.videos.map((videoId: string) => ({
        id: videoId,
        url: getVideoPath(videoId),
        duration: null,
      }))
    : [];

  return NextResponse.json({ videos });
}

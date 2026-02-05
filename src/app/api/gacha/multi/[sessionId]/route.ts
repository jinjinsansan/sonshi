import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/route-client";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  const { supabase: authSupabase, applyCookies } = createSupabaseRouteClient(request);
  const {
    data: { user },
    error: userError,
  } = await authSupabase.auth.getUser();

  if (userError || !user) {
    return applyCookies(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
  }

  const { sessionId } = await context.params;
  const serviceSupabase = getSupabaseServiceClient();

  const { data: session, error } = await serviceSupabase
    .from("multi_gacha_sessions")
    .select("id, user_id, total_pulls, current_pull, status, scenario_path, results")
    .eq("id", sessionId)
    .maybeSingle();

  if (error || !session) {
    return applyCookies(NextResponse.json({ error: error?.message ?? "セッションが見つかりません" }, { status: 404 }));
  }

  if (session.user_id !== user.id) {
    return applyCookies(NextResponse.json({ error: "Forbidden" }, { status: 403 }));
  }

  return applyCookies(
    NextResponse.json({
      sessionId: session.id,
      totalPulls: session.total_pulls,
      currentPull: session.current_pull ?? 0,
      status: session.status ?? "in_progress",
      scenario: session.scenario_path ?? [],
      results: session.results ?? [],
    })
  );
}

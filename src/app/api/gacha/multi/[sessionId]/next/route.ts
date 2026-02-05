import { NextResponse, type NextRequest } from "next/server";
import { getRequestAuthUser } from "@/lib/auth/session";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  const user = await getRequestAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await context.params;
  const serviceSupabase = getSupabaseServiceClient();

  const { data: session, error } = await serviceSupabase
    .from("multi_gacha_sessions")
    .select("id, user_id, total_pulls, current_pull, status, scenario_path, results")
    .eq("id", sessionId)
    .maybeSingle();

  if (error || !session) {
    return NextResponse.json({ error: error?.message ?? "セッションが見つかりません" }, { status: 404 });
  }

  if (session.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const totalPulls = session.total_pulls ?? 0;
  const currentPull = session.current_pull ?? 0;
  const results = Array.isArray(session.results) ? session.results : [];
  const scenario = Array.isArray(session.scenario_path) ? session.scenario_path : [];

  if (currentPull >= totalPulls) {
    return NextResponse.json({
      done: true,
      status: session.status ?? "completed",
      currentPull,
      totalPulls,
      results,
    });
  }

  const nextIndex = currentPull + 1;
  const nextResult = results[nextIndex - 1] ?? null;
  const nextScenario = scenario[nextIndex - 1] ?? null;
  const isFinal = nextIndex >= totalPulls;
  const nextStatus = isFinal ? "completed" : "in_progress";

  const updatePayload: Record<string, unknown> = {
    current_pull: nextIndex,
    status: nextStatus,
  };
  if (isFinal) {
    updatePayload.completed_at = new Date().toISOString();
  }

  const { error: updateError } = await serviceSupabase
    .from("multi_gacha_sessions")
    .update(updatePayload)
    .eq("id", sessionId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    currentPull: nextIndex,
    totalPulls,
    status: nextStatus,
    result: nextResult,
    scenario: nextScenario,
    done: isFinal,
  });
}

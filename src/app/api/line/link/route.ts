import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/route-client";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

async function getUser(request: NextRequest) {
  const { supabase, applyCookies } = createSupabaseRouteClient(request);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return { applyCookies, user, error };
}

export async function POST(request: NextRequest) {
  const { applyCookies, user, error } = await getUser(request);
  if (error || !user) {
    return applyCookies(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
  }

  const body = await request.json().catch(() => ({}));
  const lineUserId = typeof body.lineUserId === "string" ? body.lineUserId.trim() : "";
  if (!lineUserId) {
    return applyCookies(NextResponse.json({ error: "LINEユーザーIDを入力してください" }, { status: 400 }));
  }

  const serviceSupabase = getSupabaseServiceClient();
  const { data: existing } = await serviceSupabase
    .from("line_follows")
    .select("id, ticket_granted")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (existing?.ticket_granted) {
    return applyCookies(NextResponse.json({ message: "既に特典を受け取っています" }, { status: 200 }));
  }

  const payload = {
    id: existing?.id,
    user_id: user.id,
    line_user_id: lineUserId,
    followed_at: new Date().toISOString(),
    ticket_granted: existing?.ticket_granted ?? false,
  };

  const { error: upsertError } = await serviceSupabase
    .from("line_follows")
    .upsert(payload, { onConflict: "user_id" });

  if (upsertError) {
    return applyCookies(NextResponse.json({ error: upsertError.message }, { status: 500 }));
  }

  return applyCookies(NextResponse.json({ message: "LINE連携を保存しました" }, { status: 200 }));
}

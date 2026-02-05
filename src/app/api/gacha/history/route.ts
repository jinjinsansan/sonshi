import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/route-client";

export async function GET(request: NextRequest) {
  const { supabase, applyCookies } = createSupabaseRouteClient(request);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return applyCookies(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
  }

  const { data, error: historyError } = await supabase
    .from("gacha_results")
    .select(
      `id, created_at, obtained_via,
       cards (name, rarity),
       gachas (name, ticket_types (code, name))
      `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (historyError) {
    return applyCookies(NextResponse.json({ error: historyError.message }, { status: 500 }));
  }

  return applyCookies(NextResponse.json({ history: data ?? [] }));
}

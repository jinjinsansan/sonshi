import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/route-client";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

const RESET_HOUR = 10;

function getWindow(now = new Date()) {
  const windowStart = new Date(now);
  windowStart.setHours(RESET_HOUR, 0, 0, 0);
  if (now < windowStart) {
    windowStart.setDate(windowStart.getDate() - 1);
  }
  const nextResetAt = new Date(windowStart);
  nextResetAt.setDate(windowStart.getDate() + 1);
  return { windowStart, nextResetAt };
}

async function getUser(request: NextRequest) {
  const { supabase, applyCookies } = createSupabaseRouteClient(request);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return { supabase, applyCookies, user, error };
}

export async function GET(request: NextRequest) {
  const { applyCookies, user, error } = await getUser(request);
  if (error || !user) {
    return applyCookies(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
  }

  const serviceSupabase = getSupabaseServiceClient();
  const { windowStart, nextResetAt } = getWindow();
  const { data } = await serviceSupabase
    .from("login_bonus_claims")
    .select("claimed_at")
    .eq("user_id", user.id)
    .order("claimed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const claimed = data ? new Date(data.claimed_at) >= windowStart : false;
  return applyCookies(
    NextResponse.json({
      claimed,
      nextResetAt: nextResetAt.toISOString(),
      windowStart: windowStart.toISOString(),
    })
  );
}

export async function POST(request: NextRequest) {
  const { applyCookies, user, error } = await getUser(request);
  if (error || !user) {
    return applyCookies(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
  }

  const serviceSupabase = getSupabaseServiceClient();
  const { windowStart, nextResetAt } = getWindow();

  const { data: lastClaim } = await serviceSupabase
    .from("login_bonus_claims")
    .select("claimed_at")
    .eq("user_id", user.id)
    .order("claimed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastClaim && new Date(lastClaim.claimed_at) >= windowStart) {
    return applyCookies(
      NextResponse.json(
        {
          error: "本日は受け取り済みです",
          nextResetAt: nextResetAt.toISOString(),
        },
        { status: 400 }
      )
    );
  }

  const now = new Date();

  const { data: ticketType } = await serviceSupabase
    .from("ticket_types")
    .select("id, code")
    .eq("code", "free")
    .limit(1)
    .maybeSingle();

  if (!ticketType) {
    return applyCookies(NextResponse.json({ error: "freeチケットが未定義です" }, { status: 500 }));
  }

  const { data: current } = await serviceSupabase
    .from("user_tickets")
    .select("id, quantity")
    .eq("user_id", user.id)
    .eq("ticket_type_id", ticketType.id)
    .limit(1)
    .maybeSingle();

  const newQuantity = (current?.quantity ?? 0) + 1;
  const upsertPayload = {
    id: current?.id,
    user_id: user.id,
    ticket_type_id: ticketType.id,
    quantity: newQuantity,
  };

  const { error: upsertError } = await serviceSupabase
    .from("user_tickets")
    .upsert(upsertPayload, { onConflict: "user_id,ticket_type_id" });

  if (upsertError) {
    return applyCookies(NextResponse.json({ error: upsertError.message }, { status: 500 }));
  }

  const { error: claimError } = await serviceSupabase.from("login_bonus_claims").insert({
    user_id: user.id,
    claimed_at: now.toISOString(),
  });

  if (claimError) {
    return applyCookies(NextResponse.json({ error: claimError.message }, { status: 500 }));
  }

  return applyCookies(
    NextResponse.json(
      {
        ticket: "free",
        amount: 1,
        message: "フリーチケットを付与しました",
        nextResetAt: nextResetAt.toISOString(),
        quantity: newQuantity,
      },
      { status: 200 }
    )
  );
}

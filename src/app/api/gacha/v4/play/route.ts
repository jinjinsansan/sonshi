import { randomUUID } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getRequestAuthUser } from "@/lib/auth/session";
import { getServerEnv } from "@/lib/env";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { generateStoryPlay } from "@/lib/gacha/v4/generator";

const FREE_PLAY_EMAILS = ["goldbenchan@gmail.com", "goldbencha@gmail.com"];

export async function POST(request: NextRequest) {
  const { GACHA_V3_ENABLED } = getServerEnv();
  if (GACHA_V3_ENABLED === false) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const user = await getRequestAuthUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userEmail = user.email?.toLowerCase() ?? "";
  const isFreeUser = FREE_PLAY_EMAILS.includes(userEmail);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseServiceClient() as any;

  if (!isFreeUser) {
    const { data: ticketType } = await supabase.from("ticket_types").select("id").eq("code", "basic").maybeSingle();
    if (!ticketType?.id) return NextResponse.json({ error: "ticket type not found" }, { status: 500 });

    const { data: balance } = await supabase
      .from("user_tickets")
      .select("id, quantity")
      .eq("user_id", user.id)
      .eq("ticket_type_id", ticketType.id)
      .maybeSingle();

    const qty = balance?.quantity ?? 0;
    if (qty < 1) return NextResponse.json({ error: "チケットが不足しています" }, { status: 400 });

    const { error: updateErr } = await supabase
      .from("user_tickets")
      .upsert({ id: balance?.id, user_id: user.id, ticket_type_id: ticketType.id, quantity: qty - 1 }, { onConflict: "user_id,ticket_type_id" });
    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  try {
    const story = await generateStoryPlay();
    const gachaId = randomUUID();

    const cardCount =
      story.result === "lose"
        ? 0
        : story.result === "small_win" || story.result === "win"
          ? 1
          : story.result === "big_win"
            ? 2
            : 3; // jackpot

    const insertPayload = {
      id: gachaId,
      user_id: user.id,
      star: story.star,
      result: story.result,
      is_donden: false,
      donden_type: null,
      has_tsuigeki: story.has_chase,
      tsuigeki_result: story.chase_result,
      card_count: cardCount,
      cards_count: cardCount,
      koma_count: story.video_sequence.length,
      video_sequence: story.video_sequence,
      scenario: story,
      story_scenario_id: story.scenario_id,
    };

    const { error: insertErr } = await supabase.from("gacha_history").insert(insertPayload);
    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

    return NextResponse.json({ success: true, gacha_id: gachaId, story });
  } catch (err) {
    console.error("gacha v4 play error", err);
    return NextResponse.json({ error: "Failed to start gacha" }, { status: 500 });
  }
}

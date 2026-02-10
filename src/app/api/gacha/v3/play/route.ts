import { randomUUID } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getRequestAuthUser } from "@/lib/auth/session";
import { getServerEnv } from "@/lib/env";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { generateScenario } from "@/lib/gacha/v3/generator";
import { loadDondenSettings, loadRtpSettings, loadVideos } from "@/lib/gacha/v3/data";
import { Scenario } from "@/lib/gacha/v3/types";

const FREE_PLAY_EMAILS = ["goldbenchan@gmail.com", "goldbencha@gmail.com"];

export async function POST(request: NextRequest) {
  const { GACHA_V3_ENABLED } = getServerEnv();
  if (GACHA_V3_ENABLED === false) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const user = await getRequestAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userEmail = user.email?.toLowerCase() ?? "";
  const isFreeUser = FREE_PLAY_EMAILS.includes(userEmail);

  // Ticket deduction (reusing basic ticket)
  const supabase = getSupabaseServiceClient();
  if (!isFreeUser) {
    const { data: ticketType } = await supabase
      .from("ticket_types")
      .select("id")
      .eq("code", "basic")
      .maybeSingle();

    if (!ticketType?.id) {
      return NextResponse.json({ error: "ticket type not found" }, { status: 500 });
    }

    const { data: balance } = await supabase
      .from("user_tickets")
      .select("id, quantity")
      .eq("user_id", user.id)
      .eq("ticket_type_id", ticketType.id)
      .maybeSingle();

    const qty = balance?.quantity ?? 0;
    if (qty < 1) {
      return NextResponse.json({ error: "チケットが不足しています" }, { status: 400 });
    }

    const { error: updateErr } = await supabase
      .from("user_tickets")
      .upsert(
        {
          id: balance?.id,
          user_id: user.id,
          ticket_type_id: ticketType.id,
          quantity: qty - 1,
        },
        { onConflict: "user_id,ticket_type_id" }
      );

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }
  }

  try {
    const [rtpSettings, dondenSettings, videos] = await Promise.all([
      loadRtpSettings(),
      loadDondenSettings(),
      loadVideos(),
    ]);

    const scenario: Scenario = generateScenario(rtpSettings, dondenSettings, videos);
    const gachaId = randomUUID();

    const insertPayload = {
      id: gachaId,
      user_id: user.id,
      star: scenario.star,
      result: scenario.result,
      is_donden: scenario.is_donden,
      donden_type: scenario.donden_type,
      has_tsuigeki: scenario.has_tsuigeki,
      tsuigeki_result: scenario.tsuigeki_result,
      card_count: scenario.card_count,
      cards_count: scenario.card_count,
      koma_count: scenario.video_sequence.length,
      video_sequence: scenario.video_sequence,
      scenario,
    };

    // 型は既存スキーマとの差異があるため挿入時は緩和
    const { error: insertErr } = await supabase.from("gacha_history").insert(insertPayload as unknown as Record<string, unknown>);
    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, gacha_id: gachaId, scenario });
  } catch (error) {
    console.error("gacha v3 play error", error);
    return NextResponse.json({ error: "Failed to start gacha" }, { status: 500 });
  }
}

import { randomUUID } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { generateScenario } from "@/lib/gacha/scenario-generator";
import { loadScenarioSettings } from "@/lib/gacha/settings";
import { getRequestAuthUser } from "@/lib/auth/session";
import { getServerEnv } from "@/lib/env";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

const FREE_PLAY_EMAILS = ["goldbenchan@gmail.com", "goldbencha@gmail.com"];

export async function POST(request: NextRequest) {
  const { GACHA_V2_ENABLED } = getServerEnv();
  if (!GACHA_V2_ENABLED) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const user = await getRequestAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userEmail = user.email?.toLowerCase() ?? "";
  const isFreeUser = FREE_PLAY_EMAILS.includes(userEmail);

  try {
    const settings = await loadScenarioSettings();
    const scenario = generateScenario(settings);
    const gachaId = randomUUID();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getSupabaseServiceClient() as any;

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

    const { error: insertErr } = await supabase.from("gacha_history").insert({
      id: gachaId,
      user_id: user.id,
      star: scenario.star,
      scenario,
      is_donden: scenario.isDonden,
      donden_type: scenario.dondenType,
      has_tsuigeki: scenario.hasTsuigeki,
      tsuigeki_result: scenario.tsuigekiResult,
      cards_count: scenario.cardCount,
    });

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      gacha_id: gachaId,
      star: scenario.star,
      scenario,
    });
  } catch (error) {
    console.error("gacha play error", error);
    return NextResponse.json({ error: "Failed to start gacha" }, { status: 500 });
  }
}

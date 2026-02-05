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

  const { data, error: collectionError } = await supabase
    .from("card_inventory")
    .select(
      `card_id, serial_number, obtained_at,
       cards (id, name, rarity, description, image_url, max_supply, current_supply, person_name, card_style)
      `
    )
    .eq("owner_id", user.id)
    .order("obtained_at", { ascending: false });

  if (collectionError) {
    return applyCookies(NextResponse.json({ error: collectionError.message }, { status: 500 }));
  }

  const totalOwned = data?.length ?? 0;
  const distinctOwned = new Set((data ?? []).map((item) => item.card_id)).size;

  const { data: allCards, error: cardsError } = await supabase
    .from("cards")
    .select("id, name, rarity, image_url")
    .eq("is_active", true)
    .order("rarity", { ascending: false });

  if (cardsError) {
    return applyCookies(NextResponse.json({ error: cardsError.message }, { status: 500 }));
  }

  return applyCookies(
    NextResponse.json({
      totalOwned,
      distinctOwned,
      totalAvailable: allCards?.length ?? 0,
      collection: data ?? [],
      cards: allCards ?? [],
    })
  );
}

import { NextResponse, type NextRequest } from "next/server";
import { getRequestAuthUser } from "@/lib/auth/session";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

export async function GET(request: NextRequest) {
  const user = await getRequestAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServiceClient();

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
    return NextResponse.json({ error: collectionError.message }, { status: 500 });
  }

  const totalOwned = data?.length ?? 0;
  const distinctOwned = new Set((data ?? []).map((item) => item.card_id)).size;

  const { data: allCards, error: cardsError } = await supabase
    .from("cards")
    .select("id, name, rarity, image_url")
    .eq("is_active", true)
    .order("rarity", { ascending: false });

  if (cardsError) {
    return NextResponse.json({ error: cardsError.message }, { status: 500 });
  }

  return NextResponse.json({
    totalOwned,
    distinctOwned,
    totalAvailable: allCards?.length ?? 0,
    collection: data ?? [],
    cards: allCards ?? [],
  });
}

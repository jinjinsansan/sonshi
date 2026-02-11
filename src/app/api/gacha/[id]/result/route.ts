/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse, type NextRequest } from "next/server";
import { getServerEnv } from "@/lib/env";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { getRequestAuthUser } from "@/lib/auth/session";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: Params) {
  const { GACHA_V2_ENABLED } = getServerEnv();
  if (!GACHA_V2_ENABLED) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const user = await getRequestAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient();
  const svc = supabase as any;
  const { data: history } = await svc
    .from("gacha_history")
    .select("id, star, cards_count")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!history) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  type ResultRow = { id: string; card_id: string | null };
  const { data: primaryResults } = await svc
    .from("gacha_results")
    .select("id, card_id")
    .eq("user_id", user.id)
    .eq("history_id", (history as any).id);

  let existingResults = (primaryResults ?? []) as ResultRow[];

  if (!existingResults.length) {
    const { data: fallbackResults } = await svc
      .from("gacha_results")
      .select("id, card_id")
      .eq("user_id", user.id)
      .eq("gacha_id", (history as any).id);
    existingResults = (fallbackResults ?? []) as ResultRow[];
  }

  if (existingResults.length > 0) {
    const ids = existingResults.map((r: ResultRow) => r.id);
    type InventoryRow = { card_id: string | null; serial_number: number; gacha_result_id: string | null };
    const { data: inventoryRows } = await svc
      .from("card_inventory")
      .select("card_id, serial_number, gacha_result_id")
      .in("gacha_result_id", ids);

    const cardIds = existingResults.map((r: ResultRow) => r.card_id).filter(Boolean) as string[];
    type CardInfo = { id: string; name: string | null; star: number | null; image_url: string | null };
    const { data: cards } = cardIds.length
      ? await svc.from("cards").select("id, name, star, image_url").in("id", cardIds)
      : { data: [] as CardInfo[] };

    const cardsList = (cards ?? []) as CardInfo[];

    const cardInfo = (inventoryRows ?? [])
      .filter((row: InventoryRow) => !!row.card_id)
      .map((row: InventoryRow) => {
        const info = cardsList.find((c: CardInfo) => c.id === row.card_id);
        return {
          id: row.card_id as string,
          name: info?.name ?? undefined,
          star: info?.star ?? undefined,
          image_url: info?.image_url ?? undefined,
          serial_number: row.serial_number,
        };
      });

    return NextResponse.json({ star: history.star, cards: cardInfo, card_count: history.cards_count });
  }

  type CardRow = {
    id: string;
    name: string | null;
    star: number | null;
    image_url: string | null;
    max_supply: number | null;
    current_supply: number | null;
    is_active: boolean | null;
  };

  const { data: candidates } = await svc
    .from("cards")
    .select("id, name, star, image_url, max_supply, current_supply, is_active")
    .eq("is_active", true)
    .eq("star", history.star);

  let pool = (candidates ?? []) as CardRow[];
  if (!pool.length) {
    const { data: fallback } = await svc
      .from("cards")
      .select("id, name, star, image_url, max_supply, current_supply, is_active")
      .eq("is_active", true);
    pool = (fallback ?? []) as CardRow[];
  }

  if (!pool.length) {
    return NextResponse.json({ error: "No cards available" }, { status: 400 });
  }

  const usage = new Map<string, number>();
  const picked: { id: string; name: string; star: number; image_url?: string | null; serial_number: number }[] = [];

  const pickCard = () => {
    for (let attempt = 0; attempt < pool.length * 2; attempt += 1) {
      const card = pool[Math.floor(Math.random() * pool.length)] as CardRow;
      const current = card.current_supply ?? 0;
      const used = usage.get(card.id) ?? 0;
      const max = card.max_supply ?? Number.MAX_SAFE_INTEGER;
      if (current + used < max) {
        const serial = current + used + 1;
        usage.set(card.id, used + 1);
        picked.push({
          id: card.id,
          name: card.name ?? "カード",
          star: card.star ?? history.star,
          image_url: card.image_url,
          serial_number: serial,
        });
        return true;
      }
    }
    return false;
  };

  for (let i = 0; i < (history.cards_count ?? 1); i += 1) {
    if (!pickCard()) {
      break;
    }
  }

  if (!picked.length) {
    return NextResponse.json({ error: "在庫が不足しています" }, { status: 400 });
  }

  const resultRows = picked.map((c) => ({
    user_id: user.id,
    gacha_id: null,
    history_id: history.id,
    card_id: c.id,
    obtained_via: "gacha_v2",
    session_id: null,
  }));

  const { data: insertedResults, error: resErr } = await supabase
    .from("gacha_results")
    .insert(resultRows)
    .select("id, card_id");

  if (resErr) {
    return NextResponse.json({ error: resErr.message }, { status: 500 });
  }

  const inventoryRows = insertedResults.map((row: { id: string; card_id: string | null }, idx: number) => ({
    card_id: row.card_id ?? picked[idx]?.id ?? "",
    owner_id: user.id,
    serial_number: picked[idx]?.serial_number ?? 1,
    obtained_via: "gacha_v2",
    gacha_result_id: row.id,
  }));

  const { error: invErr } = await supabase.from("card_inventory").insert(inventoryRows);
  if (invErr) {
    return NextResponse.json({ error: invErr.message }, { status: 500 });
  }

  for (const card of picked) {
    const used = usage.get(card.id) ?? 0;
    if (used > 0) {
      const current = (pool.find((c) => c.id === card.id) as CardRow | undefined)?.current_supply ?? 0;
      await supabase.from("cards").update({ current_supply: current + used }).eq("id", card.id);
    }
  }

  return NextResponse.json({ star: history.star, cards: picked, card_count: history.cards_count });
}

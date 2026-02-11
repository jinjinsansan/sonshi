/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse, type NextRequest } from "next/server";
import { getRequestAuthUser } from "@/lib/auth/session";
import { getServerEnv } from "@/lib/env";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

type CardRow = {
  id: string;
  name: string | null;
  star: number | null;
  image_url: string | null;
  max_supply: number | null;
  current_supply: number | null;
  is_active: boolean | null;
};

type HistoryRow = {
  id: string;
  user_id: string;
  star: number;
  cards_count: number | null;
  card_count: number | null;
};

export async function POST(request: NextRequest) {
  const { GACHA_V3_ENABLED } = getServerEnv();
  if (GACHA_V3_ENABLED === false) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const user = await getRequestAuthUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const gachaId = typeof body?.gacha_id === "string" ? body.gacha_id : null;
  if (!gachaId) {
    return NextResponse.json({ error: "gacha_id is required" }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient() as any;

  const { data: history, error: historyErr } = await supabase
    .from("gacha_history")
    .select("id, user_id, star, cards_count, card_count")
    .eq("id", gachaId)
    .maybeSingle();

  if (historyErr) {
    return NextResponse.json({ error: historyErr.message }, { status: 500 });
  }

  if (!history || history.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const historyRow = history as HistoryRow;
  const targetCount = Math.max(0, historyRow.cards_count ?? historyRow.card_count ?? 1);

  const { data: existingResults, error: existingErr } = await supabase
    .from("gacha_results")
    .select("id, card_id")
    .eq("history_id", historyRow.id)
    .eq("user_id", user.id);

  if (existingErr) {
    return NextResponse.json({ error: existingErr.message }, { status: 500 });
  }

  if (existingResults && existingResults.length) {
    return NextResponse.json(await buildResponseFromExisting(supabase, historyRow, existingResults));
  }

  if (targetCount === 0) {
    return NextResponse.json({ star: historyRow.star, cards: [], card_count: 0 });
  }

  const { data: candidates, error: cardsErr } = await supabase
    .from("cards")
    .select("id, name, star, image_url, max_supply, current_supply, is_active")
    .eq("is_active", true)
    .eq("star", historyRow.star);

  if (cardsErr) {
    return NextResponse.json({ error: cardsErr.message }, { status: 500 });
  }

  let pool = (candidates ?? []) as CardRow[];

  if (!pool.length) {
    const { data: fallbackPool, error: fallbackErr } = await supabase
      .from("cards")
      .select("id, name, star, image_url, max_supply, current_supply, is_active")
      .eq("is_active", true);
    if (fallbackErr) {
      return NextResponse.json({ error: fallbackErr.message }, { status: 500 });
    }
    pool = (fallbackPool ?? []) as CardRow[];
  }

  if (!pool.length) {
    return NextResponse.json({ error: "No cards available" }, { status: 400 });
  }

  const usage = new Map<string, number>();
  const picked: { id: string; name: string; star: number; image_url?: string | null; serial_number: number }[] = [];

  const tryPick = () => {
    for (let attempt = 0; attempt < pool.length * 2; attempt += 1) {
      const candidate = pool[Math.floor(Math.random() * pool.length)] as CardRow;
      const current = candidate.current_supply ?? 0;
      const used = usage.get(candidate.id) ?? 0;
      const max = candidate.max_supply ?? Number.MAX_SAFE_INTEGER;
      if (current + used < max) {
        const serial = current + used + 1;
        usage.set(candidate.id, used + 1);
        picked.push({
          id: candidate.id,
          name: candidate.name ?? "カード",
          star: candidate.star ?? historyRow.star,
          image_url: candidate.image_url,
          serial_number: serial,
        });
        return true;
      }
    }
    return false;
  };

  for (let i = 0; i < targetCount; i += 1) {
    if (!tryPick()) break;
  }

  if (!picked.length) {
    return NextResponse.json({ error: "Card supply exhausted" }, { status: 400 });
  }

  const insertPayload = picked.map((card) => ({
    user_id: user.id,
    gacha_id: null,
    history_id: historyRow.id,
    card_id: card.id,
    obtained_via: "gacha_v4",
    session_id: null,
  }));

  const { data: insertedResults, error: insertErr } = await supabase
    .from("gacha_results")
    .insert(insertPayload)
    .select("id, card_id");

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  const inventoryRows = insertedResults.map((row: { id: string; card_id: string | null }, idx: number) => ({
    card_id: row.card_id ?? picked[idx]?.id ?? "",
    owner_id: user.id,
    serial_number: picked[idx]?.serial_number ?? 1,
    obtained_via: "gacha_v4",
    gacha_result_id: row.id,
  }));

  const { error: inventoryErr } = await supabase.from("card_inventory").insert(inventoryRows);
  if (inventoryErr) {
    return NextResponse.json({ error: inventoryErr.message }, { status: 500 });
  }

  for (const [cardId, used] of usage.entries()) {
    if (!used) continue;
    const { data: currentRow } = await supabase
      .from("cards")
      .select("current_supply")
      .eq("id", cardId)
      .maybeSingle();
    const current = currentRow?.current_supply ?? 0;
    await supabase.from("cards").update({ current_supply: current + used }).eq("id", cardId);
  }

  return NextResponse.json({
    star: historyRow.star,
    cards: picked,
    card_count: targetCount,
  });
}

async function buildResponseFromExisting(
  supabase: any,
  history: HistoryRow,
  existingResults: { id: string; card_id: string | null }[],
) {
  const resultIds = existingResults.map((row) => row.id);
  const { data: inventoryRows } = await supabase
    .from("card_inventory")
    .select("card_id, serial_number, gacha_result_id")
    .in("gacha_result_id", resultIds);

  const cardIds = existingResults.map((row) => row.card_id).filter(Boolean) as string[];
  const { data: cards } = cardIds.length
    ? await supabase.from("cards").select("id, name, star, image_url").in("id", cardIds)
    : { data: [] };

  const cardCatalog = (cards ?? []) as { id: string; name: string | null; star: number | null; image_url: string | null }[];

  const mapped = (inventoryRows ?? [])
    .filter((row: { card_id: string | null }) => !!row.card_id)
    .map((row: { card_id: string; serial_number: number; gacha_result_id: string | null }) => {
      const info = cardCatalog.find((c) => c.id === row.card_id);
      return {
        id: row.card_id,
        name: info?.name ?? "カード",
        star: info?.star ?? history.star,
        image_url: info?.image_url,
        serial_number: row.serial_number,
      };
    });

  return {
    star: history.star,
    cards: mapped,
    card_count: Math.max(0, history.cards_count ?? history.card_count ?? mapped.length ?? 0),
  };
}

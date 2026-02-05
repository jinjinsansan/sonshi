import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/route-client";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { buildScenario, type Rarity } from "@/lib/gacha/scenario";
import { pickWeighted } from "@/lib/utils/api";
import { canonicalizeGachaId, gachaIdMatches } from "@/lib/utils/gacha";
import type { Database } from "@/types/database";

type DbGacha = Database["public"]["Tables"]["gachas"]["Row"] & {
  ticket_types: Pick<Database["public"]["Tables"]["ticket_types"]["Row"], "id" | "name" | "code"> | null;
};

type CardRow = Pick<
  Database["public"]["Tables"]["cards"]["Row"],
  "id" | "name" | "rarity" | "image_url" | "max_supply" | "current_supply" | "is_active"
>;

type DrawResult = {
  cardId: string;
  name: string;
  rarity: Rarity;
  imageUrl?: string | null;
  serialNumber?: number | null;
};

const SESSION_TYPE_BY_PULLS: Record<number, "double" | "five" | "ten"> = {
  2: "double",
  5: "five",
  10: "ten",
};

function pickRandom<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

export async function POST(request: NextRequest) {
  const { supabase: authSupabase, applyCookies } = createSupabaseRouteClient(request);
  const {
    data: { user },
    error: userError,
  } = await authSupabase.auth.getUser();

  if (userError || !user) {
    return applyCookies(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
  }

  const body = await request.json().catch(() => ({}));
  const requestedGacha = typeof body.gachaId === "string" ? body.gachaId : body.ticketCode;
  const totalPulls = Number(body.totalPulls ?? body.total) || 0;
  const sessionType = SESSION_TYPE_BY_PULLS[totalPulls];

  if (!requestedGacha || !sessionType) {
    return applyCookies(NextResponse.json({ error: "連続ガチャの指定が不正です" }, { status: 400 }));
  }

  const resolvedSlug = canonicalizeGachaId(requestedGacha) ?? requestedGacha.toLowerCase();
  const serviceSupabase = getSupabaseServiceClient();

  const { data: gachaRows, error: gachaError } = await serviceSupabase
    .from("gachas")
    .select("*, ticket_types(id, name, code)")
    .eq("is_active", true)
    .returns<DbGacha[]>();

  if (gachaError) {
    return applyCookies(NextResponse.json({ error: gachaError.message }, { status: 500 }));
  }

  const gacha = (gachaRows ?? []).find((entry) => {
    const identifiers = [
      entry.ticket_types?.code,
      entry.ticket_types?.name,
      entry.name,
      entry.id,
    ];
    return identifiers.some((candidate) => gachaIdMatches(candidate ?? null, resolvedSlug));
  });

  if (!gacha) {
    return applyCookies(NextResponse.json({ error: "ガチャが見つかりません" }, { status: 404 }));
  }

  const { data: balance, error: balanceError } = await serviceSupabase
    .from("user_tickets")
    .select("id, quantity")
    .eq("user_id", user.id)
    .eq("ticket_type_id", gacha.ticket_type_id)
    .limit(1)
    .maybeSingle();

  if (balanceError) {
    return applyCookies(NextResponse.json({ error: balanceError.message }, { status: 500 }));
  }

  if (!balance || (balance.quantity ?? 0) < totalPulls) {
    return applyCookies(NextResponse.json({ error: "チケットが不足しています" }, { status: 400 }));
  }

  const { data: cards, error: cardsError } = await serviceSupabase
    .from("cards")
    .select("id, name, rarity, image_url, max_supply, current_supply, is_active")
    .eq("is_active", true);

  if (cardsError) {
    return applyCookies(NextResponse.json({ error: cardsError.message }, { status: 500 }));
  }

  const availableCards = (cards ?? []).filter((card) => {
    const current = card.current_supply ?? 0;
    return card.max_supply > current;
  });

  if (availableCards.length === 0) {
    return applyCookies(NextResponse.json({ error: "排出可能なカードがありません" }, { status: 400 }));
  }

  const { data: probabilities, error: probabilityError } = await serviceSupabase
    .from("gacha_probability")
    .select("rarity, probability")
    .eq("is_active", true);

  if (probabilityError) {
    return applyCookies(NextResponse.json({ error: probabilityError.message }, { status: 500 }));
  }

  const rarityWeights = (probabilities ?? []).map((item) => ({
    item: item.rarity as Rarity,
    weight: Number(item.probability) || 0,
  }));

  const cardsByRarity = new Map<string, CardRow[]>();
  const supplyMap = new Map<string, number>();
  const limitMap = new Map<string, number>();
  for (const card of availableCards) {
    const list = cardsByRarity.get(card.rarity) ?? [];
    list.push(card);
    cardsByRarity.set(card.rarity, list);
    supplyMap.set(card.id, card.current_supply ?? 0);
    limitMap.set(card.id, card.max_supply);
  }

  const usageMap = new Map<string, number>();

  const pickEligibleCard = (desiredRarity?: string | null) => {
    const pool = desiredRarity ? cardsByRarity.get(desiredRarity) ?? [] : availableCards;
    const eligible = pool.filter((card) => {
      const used = usageMap.get(card.id) ?? 0;
      const maxSupply = limitMap.get(card.id) ?? card.max_supply;
      const current = supplyMap.get(card.id) ?? 0;
      return current + used < maxSupply;
    });
    if (eligible.length === 0) return null;
    return pickRandom(eligible);
  };

  const results: DrawResult[] = [];
  for (let i = 0; i < totalPulls; i += 1) {
    const desiredRarity = rarityWeights.length > 0 ? pickWeighted(rarityWeights) : null;
    const picked = pickEligibleCard(desiredRarity) ?? pickEligibleCard();
    if (!picked) {
      return applyCookies(NextResponse.json({ error: "カード在庫が不足しています" }, { status: 400 }));
    }
    const used = (usageMap.get(picked.id) ?? 0) + 1;
    usageMap.set(picked.id, used);
    const currentSupply = supplyMap.get(picked.id) ?? 0;
    const serialNumber = currentSupply + used;

    results.push({
      cardId: picked.id,
      name: picked.name,
      rarity: picked.rarity as Rarity,
      imageUrl: picked.image_url,
      serialNumber,
    });
  }

  const scenario = buildScenario(results.map((result) => result.rarity));

  const { data: rpcData, error: rpcError } = await serviceSupabase.rpc(
    "start_multi_gacha",
    {
      p_user_id: user.id,
      p_gacha_id: gacha.id,
      p_ticket_type_id: gacha.ticket_type_id,
      p_total_pulls: totalPulls,
      p_session_type: sessionType,
      p_results: results,
      p_scenario: scenario,
    }
  );

  if (rpcError) {
    const message = rpcError.message;
    if (message.includes("INSUFFICIENT_TICKETS")) {
      return applyCookies(NextResponse.json({ error: "チケットが不足しています" }, { status: 400 }));
    }
    if (message.includes("CARD_SUPPLY_EXCEEDED") || message.includes("duplicate key")) {
      return applyCookies(NextResponse.json({ error: "カード在庫が不足しています" }, { status: 400 }));
    }
    return applyCookies(NextResponse.json({ error: message }, { status: 500 }));
  }

  const payload = Array.isArray(rpcData) ? rpcData[0] : rpcData;
  if (!payload?.session_id) {
    return applyCookies(NextResponse.json({ error: "セッション作成に失敗しました" }, { status: 500 }));
  }

  return applyCookies(
    NextResponse.json({
      sessionId: payload.session_id,
      totalPulls,
      currentPull: 0,
      status: "in_progress",
      remaining: payload.remaining_quantity ?? (balance.quantity ?? 0) - totalPulls,
    })
  );
}

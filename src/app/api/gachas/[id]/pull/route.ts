import { NextRequest, NextResponse } from "next/server";
import { getRequestAuthUser } from "@/lib/auth/session";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { buildRarityWeights, pickRarity } from "@/lib/gacha/pool";
import { isRarityAtOrBelow } from "@/lib/gacha/rarity";
import { canonicalizeGachaId, gachaIdMatches } from "@/lib/utils/gacha";
import type { Database } from "@/types/database";

const FREE_USER_EMAIL = "goldbenchan@gmail.com";
const DEMO_CARD_IMAGE = "/iraira.png";
const DEMO_CARD_NAME = "デモカード: イライラ尊師";

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
  rarity: string;
  imageUrl?: string | null;
  serialNumber?: number | null;
};

function pickRandom<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

async function ensureDemoCard(serviceSupabase: ReturnType<typeof getSupabaseServiceClient>) {
  const { data: existing } = await serviceSupabase
    .from("cards")
    .select("id, name, rarity, image_url, max_supply, current_supply, is_active")
    .eq("name", DEMO_CARD_NAME)
    .limit(1)
    .maybeSingle();

  if (!existing) {
    await serviceSupabase.from("cards").insert({
      name: DEMO_CARD_NAME,
      rarity: "UR",
      max_supply: 99999,
      current_supply: 0,
      image_url: DEMO_CARD_IMAGE,
      description: "開発用デモカード（自動投入）",
      person_name: "尊師",
      card_style: "illustration",
      is_active: true,
    });
  }

  const { data: cards } = await serviceSupabase
    .from("cards")
    .select("id, name, rarity, image_url, max_supply, current_supply, is_active")
    .eq("is_active", true);

  return cards ?? [];
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const resolvedSlug = canonicalizeGachaId(id) ?? id.toLowerCase();
  const body = await request.json().catch(() => ({ repeat: 1 }));
  const repeat = Math.min(Math.max(Number(body.repeat) || 1, 1), 10);

  const user = await getRequestAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isFreeUser = user.email?.toLowerCase() === FREE_USER_EMAIL;

  const serviceSupabase = getSupabaseServiceClient();

  const { data: gachaRows, error: gachaError } = await serviceSupabase
    .from("gachas")
    .select("*, ticket_types(id, name, code)")
    .eq("is_active", true)
    .returns<DbGacha[]>();

  if (gachaError) {
    return NextResponse.json({ error: gachaError.message }, { status: 500 });
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
    return NextResponse.json({ error: "ガチャが見つかりません" }, { status: 404 });
  }

  const { data: balance, error: balanceError } = await serviceSupabase
    .from("user_tickets")
    .select("id, quantity")
    .eq("user_id", user.id)
    .eq("ticket_type_id", gacha.ticket_type_id)
    .limit(1)
    .maybeSingle();

  if (balanceError) {
    return NextResponse.json({ error: balanceError.message }, { status: 500 });
  }

  if (isFreeUser) {
    const { error: upsertError } = await serviceSupabase.from("user_tickets").upsert(
      {
        id: balance?.id,
        user_id: user.id,
        ticket_type_id: gacha.ticket_type_id,
        quantity: 9999,
      },
      { onConflict: "user_id,ticket_type_id" }
    );

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }
  } else {
    if (!balance || (balance.quantity ?? 0) < repeat) {
      return NextResponse.json({ error: "チケットが不足しています" }, { status: 400 });
    }
  }

  const { data: cards, error: cardsError } = await serviceSupabase
    .from("cards")
    .select("id, name, rarity, image_url, max_supply, current_supply, is_active")
    .eq("is_active", true);

  if (cardsError) {
    return NextResponse.json({ error: cardsError.message }, { status: 500 });
  }

  let availableCards = (cards ?? []).filter((card) => {
    const current = card.current_supply ?? 0;
    return card.max_supply > current;
  });

  if (availableCards.length === 0) {
    if (isFreeUser) {
      const seeded = await ensureDemoCard(serviceSupabase);
      availableCards = seeded.filter((card) => (card.max_supply ?? 0) > (card.current_supply ?? 0));
    }

    if (availableCards.length === 0) {
      return NextResponse.json({ error: "排出可能なカードがありません" }, { status: 400 });
    }
  }

  const { data: probabilities, error: probabilityError } = await serviceSupabase
    .from("gacha_probability")
    .select("rarity, probability, rtp_weight, pity_threshold")
    .eq("is_active", true);

  if (probabilityError) {
    return NextResponse.json({ error: probabilityError.message }, { status: 500 });
  }

  const rarityWeights = buildRarityWeights(probabilities ?? []);

  const pityThreshold = (probabilities ?? []).find((row) => row.rarity === "SR")?.pity_threshold;
  let pityCounter = 0;
  if (pityThreshold && pityThreshold > 0) {
    const { data: history } = await serviceSupabase
      .from("gacha_results")
      .select("id, cards(rarity)")
      .eq("user_id", user.id)
      .eq("gacha_id", gacha.id)
      .order("created_at", { ascending: false })
      .limit(pityThreshold);

    (history ?? []).every((entry) => {
      if (isRarityAtOrBelow(entry.cards?.rarity, "SR")) {
        pityCounter += 1;
        return true;
      }
      return false;
    });
  }

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
  for (let i = 0; i < repeat; i += 1) {
    const shouldGuarantee = !!pityThreshold && pityCounter >= pityThreshold;
    const minRarity = shouldGuarantee ? "SR" : null;
    const desiredRarity = pickRarity(rarityWeights, minRarity);
    const picked = pickEligibleCard(desiredRarity) ?? pickEligibleCard();
    if (!picked) {
      return NextResponse.json({ error: "カード在庫が不足しています" }, { status: 400 });
    }
    if (shouldGuarantee) {
      pityCounter = 0;
    } else if (isRarityAtOrBelow(picked.rarity, "SR")) {
      pityCounter += 1;
    } else {
      pityCounter = 0;
    }
    const used = (usageMap.get(picked.id) ?? 0) + 1;
    usageMap.set(picked.id, used);
    const currentSupply = supplyMap.get(picked.id) ?? 0;
    const serialNumber = currentSupply + used;

    results.push({
      cardId: picked.id,
      name: picked.name,
      rarity: picked.rarity,
      imageUrl: picked.image_url,
      serialNumber,
    });
  }

  if (isFreeUser) {
    await serviceSupabase.from("user_tickets").upsert(
      {
        id: balance?.id,
        user_id: user.id,
        ticket_type_id: gacha.ticket_type_id,
        quantity: 9999,
      },
      { onConflict: "user_id,ticket_type_id" }
    );
  } else {
    const currentQuantity = balance?.quantity ?? 0;
    const newQuantity = currentQuantity - repeat;
    const { error: ticketUpdateError } = await serviceSupabase
      .from("user_tickets")
      .update({ quantity: newQuantity })
      .eq("user_id", user.id)
      .eq("ticket_type_id", gacha.ticket_type_id);

    if (ticketUpdateError) {
      return NextResponse.json({ error: ticketUpdateError.message }, { status: 500 });
    }
  }

  for (const [cardId, used] of usageMap.entries()) {
    const currentSupply = supplyMap.get(cardId) ?? 0;
    const { error: supplyError } = await serviceSupabase
      .from("cards")
      .update({ current_supply: currentSupply + used })
      .eq("id", cardId);

    if (supplyError) {
      return NextResponse.json({ error: supplyError.message }, { status: 500 });
    }
  }

  const inventoryRows = results.map((result) => ({
    card_id: result.cardId,
    owner_id: user.id,
    serial_number: result.serialNumber ?? 0,
    obtained_via: repeat > 1 ? "multi_gacha" : "single_gacha",
  }));

  const { error: inventoryError } = await serviceSupabase
    .from("card_inventory")
    .insert(inventoryRows);

  if (inventoryError) {
    return NextResponse.json({ error: inventoryError.message }, { status: 500 });
  }

  const historyRows = results.map((result) => ({
    user_id: user.id,
    gacha_id: gacha.id,
    card_id: result.cardId,
    obtained_via: repeat > 1 ? "multi_gacha" : "single_gacha",
  }));

  const { error: historyError } = await serviceSupabase
    .from("gacha_results")
    .insert(historyRows);

  if (historyError) {
    return NextResponse.json({ error: historyError.message }, { status: 500 });
  }

  return NextResponse.json({
    ticket: gacha.ticket_types?.name ?? gacha.name,
    results,
    remaining: isFreeUser ? 9999 : Math.max((balance?.quantity ?? 0) - repeat, 0),
  });
}

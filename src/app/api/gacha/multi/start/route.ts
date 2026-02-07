import { NextResponse, type NextRequest } from "next/server";
import { getRequestAuthUser } from "@/lib/auth/session";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { buildScenario, type Rarity } from "@/lib/gacha/scenario";
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

export async function POST(request: NextRequest) {
  const user = await getRequestAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isFreeUser = user.email?.toLowerCase() === FREE_USER_EMAIL;

  const body = await request.json().catch(() => ({}));
  const requestedGacha = typeof body.gachaId === "string" ? body.gachaId : body.ticketCode;
  const totalPulls = Number(body.totalPulls ?? body.total) || 0;
  const sessionType = SESSION_TYPE_BY_PULLS[totalPulls];

  if (!requestedGacha || !sessionType) {
    return NextResponse.json({ error: "連続ガチャの指定が不正です" }, { status: 400 });
  }

  const resolvedSlug = canonicalizeGachaId(requestedGacha) ?? requestedGacha.toLowerCase();
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

  const originalBalance = balance?.quantity ?? 0;

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
    if (!balance || originalBalance < totalPulls) {
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
  for (let i = 0; i < totalPulls; i += 1) {
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
      rarity: picked.rarity as Rarity,
      imageUrl: picked.image_url,
      serialNumber,
    });
  }

  const scenario = buildScenario(results.map((result) => result.rarity));

  let sessionId: string;

  if (isFreeUser) {
    // フリーユーザーはRPCを使わず直接DB操作（チケットチェックを回避）
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
      obtained_via: "multi_gacha",
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
      obtained_via: "multi_gacha",
    }));

    const { error: historyError } = await serviceSupabase
      .from("gacha_results")
      .insert(historyRows);

    if (historyError) {
      return NextResponse.json({ error: historyError.message }, { status: 500 });
    }

    const { data: sessionData, error: sessionError } = await serviceSupabase
      .from("multi_gacha_sessions")
      .insert({
        user_id: user.id,
        session_type: sessionType,
        total_pulls: totalPulls,
        current_pull: 0,
        scenario_path: scenario,
        status: "in_progress",
        results: results,
      })
      .select("id")
      .single();

    if (sessionError || !sessionData) {
      return NextResponse.json({ error: "セッション作成に失敗しました" }, { status: 500 });
    }

    sessionId = sessionData.id;

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
        return NextResponse.json({ error: "チケットが不足しています" }, { status: 400 });
      }
      if (message.includes("CARD_SUPPLY_EXCEEDED") || message.includes("duplicate key")) {
        return NextResponse.json({ error: "カード在庫が不足しています" }, { status: 400 });
      }
      return NextResponse.json({ error: message }, { status: 500 });
    }

    const payload = Array.isArray(rpcData) ? rpcData[0] : rpcData;
    if (!payload?.session_id) {
      return NextResponse.json({ error: "セッション作成に失敗しました" }, { status: 500 });
    }

    sessionId = payload.session_id;
  }

  return NextResponse.json({
    sessionId,
    totalPulls,
    currentPull: 0,
    status: "in_progress",
    remaining: isFreeUser ? 9999 : 0,
  });
}

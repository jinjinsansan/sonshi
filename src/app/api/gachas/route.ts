import { NextResponse, type NextRequest } from "next/server";
import { GACHA_DEFINITIONS } from "@/constants/gacha";
import { TICKET_THEMES, type TicketCode } from "@/constants/tickets";
import { buildGachaSearchKey, canonicalizeGachaId } from "@/lib/utils/gacha";
import { createSupabaseRouteClient } from "@/lib/supabase/route-client";
import type { Database } from "@/types/database";

type DbGacha = Database["public"]["Tables"]["gachas"]["Row"] & {
  ticket_types: Pick<Database["public"]["Tables"]["ticket_types"]["Row"], "name" | "code" | "color">;
};

function selectFallbackId(...values: (string | null | undefined)[]) {
  for (const value of values) {
    const key = buildGachaSearchKey(value);
    if (key) {
      return key;
    }
  }
  return "";
}

function resolveGradient(code?: string | null) {
  const theme = TICKET_THEMES[code as TicketCode];
  return theme?.gradient ?? "from-hall-panel to-hall-background";
}

function mapDbToDefinition(gacha: DbGacha) {
  const normalizedCode =
    canonicalizeGachaId(gacha.ticket_types?.code) ??
    canonicalizeGachaId(gacha.ticket_types?.name) ??
    canonicalizeGachaId(gacha.name);

  const fallbackId = selectFallbackId(
    gacha.ticket_types?.code,
    gacha.ticket_types?.name,
    gacha.name,
    gacha.id
  );

  return {
    id: (normalizedCode ?? fallbackId) as (typeof GACHA_DEFINITIONS)[number]["id"],
    name: gacha.name,
    rarityRange: [gacha.min_rarity, gacha.max_rarity] as [number, number],
    ticketLabel: gacha.ticket_types.name,
    description: "",
    priceLabel: "",
    gradient: resolveGradient(gacha.ticket_types?.code),
  };
}

export async function GET(request: NextRequest) {
  const { supabase, applyCookies } = createSupabaseRouteClient(request);

  const { data, error } = await supabase
    .from("gachas")
    .select("*, ticket_types(name, code, color)")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    return applyCookies(NextResponse.json({ gachas: GACHA_DEFINITIONS }, { status: 200 }));
  }

  const mapped = ((data ?? []) as DbGacha[]).map(mapDbToDefinition);
  const payload = mapped.length > 0 ? mapped : GACHA_DEFINITIONS;
  return applyCookies(NextResponse.json({ gachas: payload }, { status: 200 }));
}

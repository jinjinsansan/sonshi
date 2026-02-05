import { GACHA_DEFINITIONS } from "@/constants/gacha";
import { DEFAULT_TICKET_BALANCES, loadTicketBalances } from "@/lib/data/tickets";
import { loadActiveGachaDefinitions } from "@/lib/data/gacha";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import type { TicketBalanceItem } from "@/lib/utils/tickets";

export type MainAppSnapshot = {
  user: {
    id: string;
    email: string | null;
    lastLoginAt: string | null;
  } | null;
  tickets: TicketBalanceItem[];
  gachaCatalog: typeof GACHA_DEFINITIONS;
  lastUpdated: string;
};

export async function loadMainAppSnapshot(userId?: string | null): Promise<MainAppSnapshot> {
  if (!userId) {
    return {
      user: null,
      tickets: DEFAULT_TICKET_BALANCES,
      gachaCatalog: GACHA_DEFINITIONS,
      lastUpdated: new Date().toISOString(),
    };
  }

  const supabase = getSupabaseServiceClient();
  const [{ data: userRow }, tickets, gachaCatalog] = await Promise.all([
    supabase.from("app_users").select("id, email, last_login_at").eq("id", userId).maybeSingle(),
    loadTicketBalances(userId),
    loadActiveGachaDefinitions(),
  ]);

  const snapshot: MainAppSnapshot = {
    user: userRow
      ? {
          id: userRow.id,
          email: userRow.email,
          lastLoginAt: userRow.last_login_at,
        }
      : { id: userId, email: null, lastLoginAt: null },
    tickets: tickets ?? DEFAULT_TICKET_BALANCES,
    gachaCatalog: gachaCatalog ?? GACHA_DEFINITIONS,
    lastUpdated: new Date().toISOString(),
  };

  return snapshot;
}

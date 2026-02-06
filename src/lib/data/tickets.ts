import { getSupabaseServiceClient } from "@/lib/supabase/service";
import type { Database } from "@/types/database";
import type { TicketBalanceItem } from "@/lib/utils/tickets";

export const DEFAULT_TICKET_BALANCES: TicketBalanceItem[] = [
  { code: "free", name: "フリーチケット", quantity: 0, colorToken: null, sortOrder: 0 },
  { code: "basic", name: "ベーシックチケット", quantity: 0, colorToken: null, sortOrder: 1 },
  { code: "epic", name: "エピックチケット", quantity: 0, colorToken: null, sortOrder: 2 },
  { code: "premium", name: "プレミアムチケット", quantity: 0, colorToken: null, sortOrder: 3 },
  { code: "ex", name: "EXチケット", quantity: 0, colorToken: null, sortOrder: 4 },
];

export async function loadTicketBalances(userId?: string | null): Promise<TicketBalanceItem[]> {
  if (!userId) {
    return DEFAULT_TICKET_BALANCES;
  }

  const supabase = getSupabaseServiceClient();
  type TicketBalanceRow = Database["public"]["Functions"]["get_ticket_balances"]["Returns"][number];

  const { data, error } = await supabase.rpc("get_ticket_balances", {
    p_user_id: userId,
  });

  if (error || !data || data.length === 0) {
    return DEFAULT_TICKET_BALANCES;
  }

  return (data as TicketBalanceRow[]).map((row, index) => ({
    code: row.code ?? "",
    name: row.name ?? "",
    colorToken: row.color,
    sortOrder: row.sort_order ?? index,
    quantity: row.quantity ?? 0,
  }));
}

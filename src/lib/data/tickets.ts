import { getSupabaseServiceClient } from "@/lib/supabase/service";
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

  const { data: ticketTypes, error: ticketTypeError } = await supabase
    .from("ticket_types")
    .select("id, name, code, color, sort_order")
    .order("sort_order", { ascending: true });

  if (ticketTypeError || !ticketTypes || ticketTypes.length === 0) {
    return DEFAULT_TICKET_BALANCES;
  }

  const { data: balances, error: balanceError } = await supabase
    .from("user_tickets")
    .select("ticket_type_id, quantity")
    .eq("user_id", userId);

  if (balanceError) {
    return DEFAULT_TICKET_BALANCES;
  }

  const quantityByType = new Map(
    (balances ?? []).map((item) => [item.ticket_type_id, item.quantity ?? 0])
  );

  const mapped = ticketTypes.map((type, index) => ({
    code: type.code,
    name: type.name,
    colorToken: type.color,
    sortOrder: type.sort_order ?? index,
    quantity: quantityByType.get(type.id) ?? 0,
  }));

  return mapped.length > 0 ? mapped : DEFAULT_TICKET_BALANCES;
}

import { NextResponse, type NextRequest } from "next/server";
import { getRequestAuthUser } from "@/lib/auth/session";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

export async function GET(request: NextRequest) {
  const user = await getRequestAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServiceClient();

  const { data: ticketTypes, error: ticketTypeError } = await supabase
    .from("ticket_types")
    .select("id, name, code, color, sort_order")
    .order("sort_order", { ascending: true });

  if (ticketTypeError) {
    return NextResponse.json({ error: ticketTypeError.message }, { status: 500 });
  }

  const { data: balances, error: balanceError } = await supabase
    .from("user_tickets")
    .select("ticket_type_id, quantity")
    .eq("user_id", user.id);

  if (balanceError) {
    return NextResponse.json({ error: balanceError.message }, { status: 500 });
  }

  const quantityByType = new Map(
    balances?.map((item) => [item.ticket_type_id, item.quantity ?? 0]) ?? []
  );

  const tickets = (ticketTypes ?? []).map((type, index) => ({
    code: type.code,
    name: type.name,
    colorToken: type.color,
    sortOrder: type.sort_order ?? index,
    quantity: quantityByType.get(type.id) ?? 0,
  }));

  return NextResponse.json({ tickets });
}

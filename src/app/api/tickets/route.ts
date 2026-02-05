import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/route-client";

export async function GET(request: NextRequest) {
  const { supabase, applyCookies } = createSupabaseRouteClient(request);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return applyCookies(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
  }

  const { data: ticketTypes, error: ticketTypeError } = await supabase
    .from("ticket_types")
    .select("id, name, code, color, sort_order")
    .order("sort_order", { ascending: true });

  if (ticketTypeError) {
    return applyCookies(NextResponse.json({ error: ticketTypeError.message }, { status: 500 }));
  }

  const { data: balances, error: balanceError } = await supabase
    .from("user_tickets")
    .select("ticket_type_id, quantity")
    .eq("user_id", user.id);

  if (balanceError) {
    return applyCookies(NextResponse.json({ error: balanceError.message }, { status: 500 }));
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

  return applyCookies(NextResponse.json({ tickets }));
}

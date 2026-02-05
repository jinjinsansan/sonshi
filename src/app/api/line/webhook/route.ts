import { NextResponse, type NextRequest } from "next/server";
import crypto from "crypto";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { getServerEnv } from "@/lib/env";

type LineWebhookEvent = {
  type: string;
  source?: {
    userId?: string;
  };
};

type LineWebhookBody = {
  events?: LineWebhookEvent[];
};

function verifySignature(secret: string, body: string, signature?: string | null) {
  if (!signature) return false;
  const hash = crypto.createHmac("sha256", secret).update(body).digest("base64");
  const expected = Buffer.from(hash);
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(expected, actual);
}

async function grantFreeTicket(serviceSupabase: ReturnType<typeof getSupabaseServiceClient>, userId: string) {
  const { data: ticketType } = await serviceSupabase
    .from("ticket_types")
    .select("id")
    .eq("code", "free")
    .limit(1)
    .maybeSingle();

  if (!ticketType) {
    return { error: "freeチケットが未定義です" };
  }

  const { data: current } = await serviceSupabase
    .from("user_tickets")
    .select("id, quantity")
    .eq("user_id", userId)
    .eq("ticket_type_id", ticketType.id)
    .limit(1)
    .maybeSingle();

  const newQuantity = (current?.quantity ?? 0) + 1;
  const { error } = await serviceSupabase
    .from("user_tickets")
    .upsert(
      {
        id: current?.id,
        user_id: userId,
        ticket_type_id: ticketType.id,
        quantity: newQuantity,
      },
      { onConflict: "user_id,ticket_type_id" }
    );

  return { error: error?.message, quantity: newQuantity };
}

export async function POST(request: NextRequest) {
  const { LINE_CHANNEL_SECRET } = getServerEnv();
  if (!LINE_CHANNEL_SECRET) {
    return NextResponse.json({ error: "LINE channel secret missing" }, { status: 500 });
  }

  const signature = request.headers.get("x-line-signature");
  const bodyText = await request.text();
  if (!verifySignature(LINE_CHANNEL_SECRET, bodyText, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(bodyText) as LineWebhookBody;
  const events = payload.events ?? [];
  const serviceSupabase = getSupabaseServiceClient();

  for (const event of events) {
    if (event.type !== "follow") continue;
    const lineUserId = event.source?.userId;
    if (!lineUserId) continue;

    const { data: follow } = await serviceSupabase
      .from("line_follows")
      .select("id, user_id, ticket_granted")
      .eq("line_user_id", lineUserId)
      .limit(1)
      .maybeSingle();

    if (!follow || follow.ticket_granted) continue;

    const grantResult = await grantFreeTicket(serviceSupabase, follow.user_id);
    if (grantResult.error) {
      continue;
    }

    await serviceSupabase
      .from("line_follows")
      .update({ ticket_granted: true, followed_at: new Date().toISOString() })
      .eq("id", follow.id);
  }

  return NextResponse.json({ ok: true });
}

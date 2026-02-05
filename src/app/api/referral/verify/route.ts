import { NextResponse, type NextRequest } from "next/server";
import { getRequestAuthUser } from "@/lib/auth/session";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

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
  const user = await getRequestAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const referralCode = typeof body.code === "string" ? body.code.trim() : "";
  if (!referralCode) {
    return NextResponse.json({ error: "紹介コードを入力してください" }, { status: 400 });
  }

  const serviceSupabase = getSupabaseServiceClient();
  const { data: existingReferral } = await serviceSupabase
    .from("referrals")
    .select("id")
    .eq("referred_id", user.id)
    .limit(1)
    .maybeSingle();

  if (existingReferral) {
    return NextResponse.json({ error: "既に紹介特典を受け取っています" }, { status: 400 });
  }

  let { data: codeOwner } = await serviceSupabase
    .from("referrals")
    .select("referrer_id, referral_code")
    .eq("referral_code", referralCode)
    .is("referred_id", null)
    .limit(1)
    .maybeSingle();

  if (!codeOwner) {
    const { data: anyRow } = await serviceSupabase
      .from("referrals")
      .select("referrer_id, referral_code")
      .eq("referral_code", referralCode)
      .limit(1)
      .maybeSingle();
    codeOwner = anyRow ?? null;
  }

  if (!codeOwner?.referrer_id) {
    return NextResponse.json({ error: "紹介コードが無効です" }, { status: 404 });
  }

  if (codeOwner.referrer_id === user.id) {
    return NextResponse.json({ error: "自分のコードは利用できません" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const { data: referralRow, error: referralError } = await serviceSupabase
    .from("referrals")
    .insert({
      referrer_id: codeOwner.referrer_id,
      referred_id: user.id,
      referral_code: referralCode,
      status: "completed",
      ticket_granted: false,
      completed_at: now,
    })
    .select("id")
    .single();

  if (referralError || !referralRow) {
    return NextResponse.json({ error: referralError?.message ?? "紹介処理に失敗しました" }, { status: 500 });
  }

  const [referrerGrant, referredGrant] = await Promise.all([
    grantFreeTicket(serviceSupabase, codeOwner.referrer_id),
    grantFreeTicket(serviceSupabase, user.id),
  ]);

  if (referrerGrant.error || referredGrant.error) {
    return NextResponse.json(
      { error: referrerGrant.error ?? referredGrant.error ?? "チケット付与に失敗しました" },
      { status: 500 }
    );
  }

  const { error: updateError } = await serviceSupabase
    .from("referrals")
    .update({ status: "rewarded", ticket_granted: true })
    .eq("id", referralRow.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    message: "フリーチケットを付与しました",
    referrerQuantity: referrerGrant.quantity,
    referredQuantity: referredGrant.quantity,
  });
}

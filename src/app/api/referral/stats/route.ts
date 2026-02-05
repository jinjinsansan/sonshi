import { NextResponse, type NextRequest } from "next/server";
import { getRequestAuthUser } from "@/lib/auth/session";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

export async function GET(request: NextRequest) {
  const user = await getRequestAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceSupabase = getSupabaseServiceClient();
  const { data: codeRow } = await serviceSupabase
    .from("referrals")
    .select("referral_code")
    .eq("referrer_id", user.id)
    .is("referred_id", null)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const { data: referrals, error: referralError } = await serviceSupabase
    .from("referrals")
    .select("id, referral_code, referred_id, status, ticket_granted, created_at, completed_at")
    .eq("referrer_id", user.id)
    .not("referred_id", "is", null)
    .order("created_at", { ascending: false });

  if (referralError) {
    return NextResponse.json({ error: referralError.message }, { status: 500 });
  }

  const list = referrals ?? [];
  const rewarded = list.filter((item) => item.status === "rewarded").length;

  return NextResponse.json({
    code: codeRow?.referral_code ?? null,
    totalInvited: list.length,
    rewardedCount: rewarded,
    referrals: list,
  });
}

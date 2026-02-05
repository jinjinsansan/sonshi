import { NextResponse, type NextRequest } from "next/server";
import { getRequestAuthUser } from "@/lib/auth/session";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { publicEnv } from "@/lib/env";

const CODE_LENGTH = 8;
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateCode() {
  let result = "";
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    result += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return result;
}

function buildInviteUrl(code: string) {
  const base = publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  return `${base}/invite/${code}`;
}

export async function GET(request: NextRequest) {
  const user = await getRequestAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceSupabase = getSupabaseServiceClient();
  const { data: existing } = await serviceSupabase
    .from("referrals")
    .select("referral_code")
    .eq("referrer_id", user.id)
    .is("referred_id", null)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  let referralCode = existing?.referral_code ?? null;

  if (!referralCode) {
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const candidate = generateCode();
      const { data: collision } = await serviceSupabase
        .from("referrals")
        .select("referrer_id")
        .eq("referral_code", candidate)
        .limit(1)
        .maybeSingle();

      if (collision) {
        continue;
      }

      const { error: insertError } = await serviceSupabase.from("referrals").insert({
        referrer_id: user.id,
        referral_code: candidate,
        status: "pending",
        ticket_granted: false,
      });

      if (!insertError) {
        referralCode = candidate;
        break;
      }
    }
  }

  if (!referralCode) {
    return NextResponse.json({ error: "紹介コードの生成に失敗しました" }, { status: 500 });
  }

  return NextResponse.json({
    code: referralCode,
    inviteUrl: buildInviteUrl(referralCode),
  });
}

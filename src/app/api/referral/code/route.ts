import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/route-client";
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

async function getUser(request: NextRequest) {
  const { supabase, applyCookies } = createSupabaseRouteClient(request);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return { applyCookies, user, error };
}

function buildInviteUrl(code: string) {
  const base = publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  return `${base}/invite/${code}`;
}

export async function GET(request: NextRequest) {
  const { applyCookies, user, error } = await getUser(request);
  if (error || !user) {
    return applyCookies(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
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
    return applyCookies(
      NextResponse.json({ error: "紹介コードの生成に失敗しました" }, { status: 500 })
    );
  }

  return applyCookies(
    NextResponse.json({
      code: referralCode,
      inviteUrl: buildInviteUrl(referralCode),
    })
  );
}

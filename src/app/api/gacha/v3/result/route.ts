import { NextRequest, NextResponse } from "next/server";
import { getRequestAuthUser } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const user = await getRequestAuthUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 本番ではgacha_idから発行カードを引くが、開発中は固定カードを返す
  const body = await request.json().catch(() => ({}));
  const gachaId = body?.gacha_id as string | undefined;
  if (!gachaId) {
    // allow fallback but note missing id
    console.warn("gacha_id missing in v3/result request");
  }

  const card = {
    id: "demo-iraira",
    name: "イライラ尊師",
    image_url: "/iraira.png",
    star: 1,
    serial_number: 1,
  };

  return NextResponse.json({ cards: [card], card_count: 1, star: card.star, gacha_id: gachaId });
}

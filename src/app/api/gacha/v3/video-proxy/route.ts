import { NextResponse, type NextRequest } from "next/server";
import { getVideoPathV3 } from "@/lib/gacha/v3/utils";

export async function GET(request: NextRequest) {
  const file = request.nextUrl.searchParams.get("file");
  if (!file) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  // If R2 base is set, just redirect to that URL; otherwise fallback to local /videos
  const target = getVideoPathV3(file);

  // If target is same-origin /videos, we can redirect; browsers will fetch from public dir
  // For R2 (external), redirect preserves caching and avoids server relay
  return NextResponse.redirect(target);
}

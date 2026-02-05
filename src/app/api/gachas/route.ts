import { NextResponse } from "next/server";
import { loadActiveGachaDefinitions } from "@/lib/data/gacha";
export async function GET() {
  const payload = await loadActiveGachaDefinitions();
  return NextResponse.json({ gachas: payload }, { status: 200 });
}

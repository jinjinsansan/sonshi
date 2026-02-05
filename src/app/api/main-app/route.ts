import { NextResponse, type NextRequest } from "next/server";
import { loadMainAppSnapshot } from "@/lib/app/main-app";
import { getRequestAuthUser } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const user = await getRequestAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const snapshot = await loadMainAppSnapshot(user.id);
  return NextResponse.json(snapshot);
}

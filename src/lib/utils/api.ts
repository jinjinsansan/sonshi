import { publicEnv } from "@/lib/env";

export function resolveApiUrl(path: string) {
  if (typeof window === "undefined") {
    const origin = publicEnv.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return `${origin}${path}`;
  }

  return path;
}

export function pickWeighted<T>(items: { item: T; weight: number }[]): T | null {
  const total = items.reduce((sum, entry) => sum + entry.weight, 0);
  if (total <= 0) return null;
  let rand = Math.random() * total;
  for (const entry of items) {
    rand -= entry.weight;
    if (rand <= 0) return entry.item;
  }
  return items.at(-1)?.item ?? null;
}

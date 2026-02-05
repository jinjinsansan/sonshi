import { GACHA_DEFINITIONS, type GachaDefinition } from "@/constants/gacha";
import { resolveApiUrl } from "@/lib/utils/api";

const CANONICAL_GACHA_IDS = new Set(
  GACHA_DEFINITIONS.map((definition) => definition.id)
);

const GACHA_LABEL_TO_ID = new Map<string, (typeof GACHA_DEFINITIONS)[number]["id"]>();

for (const definition of GACHA_DEFINITIONS) {
  const aliases = new Set<string>();
  aliases.add(definition.name);
  aliases.add(definition.ticketLabel);
  aliases.add(`${definition.name}ガチャ`);
  aliases.add(`${definition.name}チケット`);
  aliases.add(`${definition.ticketLabel}ガチャ`);
  aliases.add(`${definition.ticketLabel}チケット`);
  for (const alias of aliases) {
    const key = normalizeInput(alias);
    if (key) {
      GACHA_LABEL_TO_ID.set(key, definition.id);
    }
  }
}

const EN_SUFFIX_PATTERN = /(?:[-_\s]*(?:gacha|ticket))+$/g;
const JP_SUFFIX_PATTERN = /(?:ガチャ|チケット)+$/g;

function normalizeInput(value?: string | null) {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim().toLowerCase();
}

function stripSuffixes(value: string) {
  if (!value) return value;
  let result = value.replace(EN_SUFFIX_PATTERN, "");
  result = result.replace(JP_SUFFIX_PATTERN, "");
  return result.trim();
}

export function canonicalizeGachaId(value?: string | null) {
  const normalized = normalizeInput(value);
  if (!normalized) {
    return null;
  }

  if (CANONICAL_GACHA_IDS.has(normalized as (typeof GACHA_DEFINITIONS)[number]["id"])) {
    return normalized as (typeof GACHA_DEFINITIONS)[number]["id"];
  }

  const directLabel = GACHA_LABEL_TO_ID.get(normalized);
  if (directLabel) {
    return directLabel;
  }

  const stripped = stripSuffixes(normalized);
  if (stripped) {
    if (CANONICAL_GACHA_IDS.has(stripped as (typeof GACHA_DEFINITIONS)[number]["id"])) {
      return stripped as (typeof GACHA_DEFINITIONS)[number]["id"];
    }
    const strippedLabel = GACHA_LABEL_TO_ID.get(stripped);
    if (strippedLabel) {
      return strippedLabel;
    }
  }

  return null;
}

export function buildGachaSearchKey(value?: string | null) {
  const canonical = canonicalizeGachaId(value);
  if (canonical) {
    return canonical;
  }

  const normalized = normalizeInput(value);
  if (!normalized) {
    return null;
  }

  const stripped = stripSuffixes(normalized);
  return stripped || normalized;
}

export function gachaIdMatches(a?: string | null, b?: string | null) {
  const keyA = buildGachaSearchKey(a);
  const keyB = buildGachaSearchKey(b);
  if (!keyA || !keyB) {
    return false;
  }
  return keyA === keyB;
}

function normalizeFetchedGachas<T extends { id: string }>(items: T[]): T[] {
  return items.map((item) => {
    const canonical = canonicalizeGachaId(item.id);
    if (!canonical) {
      return item;
    }
    if (item.id === canonical) {
      return item;
    }
    return {
      ...item,
      id: canonical,
    };
  });
}

export async function fetchGachaCatalog(): Promise<GachaDefinition[]> {
  const endpoint = resolveApiUrl("/api/gachas");
  const response = await fetch(endpoint, { next: { revalidate: 60 } });

  if (!response.ok) {
    throw new Error("ガチャ一覧の取得に失敗しました");
  }

  const data = await response.json();
  const payload = Array.isArray(data) ? data : data?.gachas ?? [];
  return normalizeFetchedGachas(payload as GachaDefinition[]);
}

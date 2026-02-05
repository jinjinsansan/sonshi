import Link from "next/link";
import { revalidatePath } from "next/cache";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { requireAdminSession } from "@/lib/admin";

const RARITIES = ["N", "R", "SR", "SSR", "UR"];
const CARD_STYLES = ["realphoto", "3d", "illustration", "pixel"];

async function createCard(formData: FormData) {
  "use server";
  await requireAdminSession();
  const svc = getSupabaseServiceClient();

  const name = String(formData.get("name") ?? "").trim();
  const rarity = String(formData.get("rarity") ?? "N").trim();
  const max_supply = Number(formData.get("max_supply") ?? 0);
  const image_url = String(formData.get("image_url") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const person_name = String(formData.get("person_name") ?? "").trim() || null;
  const card_style = String(formData.get("card_style") ?? "").trim() || null;

  if (!name || !image_url || !RARITIES.includes(rarity) || max_supply <= 0) {
    return;
  }

  await svc.from("cards").insert({
    name,
    rarity,
    max_supply,
    image_url,
    description,
    person_name,
    card_style,
    is_active: true,
  });

  revalidatePath("/admin/cards");
}

async function updateCard(formData: FormData) {
  "use server";
  await requireAdminSession();
  const svc = getSupabaseServiceClient();

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const rarity = String(formData.get("rarity") ?? "N").trim();
  const max_supply = Number(formData.get("max_supply") ?? 0);
  const image_url = String(formData.get("image_url") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const person_name = String(formData.get("person_name") ?? "").trim() || null;
  const card_style = String(formData.get("card_style") ?? "").trim() || null;
  const is_active = formData.get("is_active") === "on";

  if (!id || !name || !RARITIES.includes(rarity) || max_supply <= 0) {
    return;
  }

  await svc
    .from("cards")
    .update({
      name,
      rarity,
      max_supply,
      image_url,
      description,
      person_name,
      card_style,
      is_active,
    })
    .eq("id", id);

  revalidatePath("/admin/cards");
}

async function deleteCard(formData: FormData) {
  "use server";
  await requireAdminSession();
  const svc = getSupabaseServiceClient();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await svc.from("cards").delete().eq("id", id);
  revalidatePath("/admin/cards");
}

type AdminCardsPageProps = {
  searchParams: Promise<{ q?: string; rarity?: string }>;
};

export default async function AdminCardsPage({ searchParams }: AdminCardsPageProps) {
  await requireAdminSession();
  const svc = getSupabaseServiceClient();
  const { q, rarity } = await searchParams;
  const query = q?.trim() ?? "";
  const selectedRarity = RARITIES.includes(rarity ?? "") ? (rarity as string) : "";

  let cardsQuery = svc
    .from("cards")
    .select("id, name, rarity, max_supply, current_supply, image_url, description, person_name, card_style, is_active")
    .order("rarity")
    .order("name");

  if (query) {
    cardsQuery = cardsQuery.ilike("name", `%${query}%`);
  }

  if (selectedRarity) {
    cardsQuery = cardsQuery.eq("rarity", selectedRarity);
  }

  const { data: cards } = await cardsQuery;

  return (
    <section className="space-y-6">
      <div className="glass-panel space-y-4 px-6 py-5">
        <div>
          <p className="text-xs uppercase tracking-[0.5em] text-neon-yellow">Cards</p>
          <h2 className="font-display text-2xl text-white">カード管理</h2>
          <p className="text-sm text-zinc-300">カードの追加・編集・在庫状況を管理します。</p>
        </div>
        <form action="/admin/cards" method="get" className="flex flex-wrap gap-2">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="カード名で検索"
            className="flex-1 rounded-2xl border border-white/10 bg-black/20 px-4 py-2 text-sm text-white"
          />
          <select
            name="rarity"
            defaultValue={selectedRarity}
            className="rounded-2xl border border-white/10 bg-black/20 px-4 py-2 text-sm text-white"
          >
            <option value="">全レア度</option>
            {RARITIES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/80 transition hover:border-neon-blue hover:text-white"
          >
            検索
          </button>
          <Link
            href="/admin/cards"
            className="rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/70 transition hover:border-neon-blue hover:text-white"
          >
            クリア
          </Link>
        </form>
        <form action={createCard} className="grid gap-3 md:grid-cols-2">
          <input
            name="name"
            placeholder="カード名"
            className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white"
            required
          />
          <select
            name="rarity"
            className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white"
            defaultValue="N"
          >
            {RARITIES.map((rarity) => (
              <option key={rarity} value={rarity}>
                {rarity}
              </option>
            ))}
          </select>
          <input
            name="max_supply"
            type="number"
            min={1}
            placeholder="最大発行数"
            className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white"
            required
          />
          <input
            name="image_url"
            placeholder="カード画像URL"
            className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white"
            required
          />
          <input
            name="person_name"
            placeholder="人物名 (任意)"
            className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white"
          />
          <select
            name="card_style"
            className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white"
            defaultValue=""
          >
            <option value="">スタイル (任意)</option>
            {CARD_STYLES.map((style) => (
              <option key={style} value={style}>
                {style}
              </option>
            ))}
          </select>
          <input
            name="description"
            placeholder="説明 (任意)"
            className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white md:col-span-2"
          />
          <button
            type="submit"
            className="rounded-full bg-gradient-to-r from-neon-pink to-neon-yellow px-6 py-3 text-xs uppercase tracking-[0.4em] text-black shadow-neon md:col-span-2"
          >
            追加
          </button>
        </form>
      </div>

      <div className="grid gap-4">
        {(cards ?? []).length === 0 ? (
          <p className="text-sm text-zinc-400">登録済みカードがありません。</p>
        ) : (
          (cards ?? []).map((card) => (
            <div key={card.id} className="rounded-3xl border border-white/10 bg-hall-panel/80 p-5 shadow-panel-inset">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-display text-lg text-white">{card.name}</p>
                  <p className="text-xs text-zinc-400">
                    {card.rarity} ・ {card.current_supply ?? 0}/{card.max_supply} ・ {card.is_active ? "公開中" : "非公開"}
                  </p>
                </div>
                <Link
                  href={`/admin/cards/${card.id}`}
                  className="rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/80 transition hover:border-neon-blue hover:text-white"
                >
                  詳細
                </Link>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <form action={updateCard} className="contents">
                  <input type="hidden" name="id" value={card.id} />
                <input
                  name="name"
                  defaultValue={card.name}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white"
                />
                <select
                  name="rarity"
                  defaultValue={card.rarity}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white"
                >
                  {RARITIES.map((rarity) => (
                    <option key={rarity} value={rarity}>
                      {rarity}
                    </option>
                  ))}
                </select>
                <input
                  name="max_supply"
                  type="number"
                  min={1}
                  defaultValue={card.max_supply}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white"
                />
                <input
                  name="image_url"
                  defaultValue={card.image_url}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white"
                />
                <input
                  name="person_name"
                  defaultValue={card.person_name ?? ""}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white"
                />
                <select
                  name="card_style"
                  defaultValue={card.card_style ?? ""}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white"
                >
                  <option value="">スタイル (任意)</option>
                  {CARD_STYLES.map((style) => (
                    <option key={style} value={style}>
                      {style}
                    </option>
                  ))}
                </select>
                <input
                  name="description"
                  defaultValue={card.description ?? ""}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white md:col-span-2"
                />
                  <label className="flex items-center gap-2 text-xs text-zinc-300">
                    <input type="checkbox" name="is_active" defaultChecked={card.is_active ?? true} /> 公開する
                  </label>
                  <div className="flex flex-wrap gap-2 md:col-span-2">
                    <button
                      type="submit"
                      className="rounded-full border border-white/15 px-5 py-2 text-xs uppercase tracking-[0.3em] text-white/80 transition hover:border-neon-blue hover:text-white"
                    >
                      保存
                    </button>
                  </div>
                </form>
                <form action={deleteCard} className="md:col-span-2">
                  <input type="hidden" name="id" value={card.id} />
                  <button
                    type="submit"
                    className="rounded-full border border-red-400/40 px-5 py-2 text-xs uppercase tracking-[0.3em] text-red-200 transition hover:border-red-300 hover:text-red-100"
                  >
                    削除
                  </button>
                </form>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

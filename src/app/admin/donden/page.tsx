/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { requireAdminSession } from "@/lib/admin";

const STARS = Array.from({ length: 12 }, (_, idx) => idx + 1);

const DEFAULT_RATES: Record<number, number> = {
  1: 0,
  2: 0,
  3: 20,
  4: 15,
  5: 15,
  6: 20,
  7: 20,
  8: 20,
  9: 15,
  10: 15,
  11: 10,
  12: 10,
};

async function updateDonden(formData: FormData) {
  "use server";
  await requireAdminSession();
  const svc = getSupabaseServiceClient();
  const table = (svc as any).from("donden_rate_settings");

  const rows = STARS.map((star) => {
    const rateRaw = formData.get(`rate_${star}`);
    const rate = Number(rateRaw ?? 0);
    return {
      star_rating: star,
      donden_rate: Number.isFinite(rate) ? rate : 0,
    };
  });

  await Promise.all(
    rows.map((row) =>
      table.upsert(
        { star_rating: row.star_rating, donden_rate: row.donden_rate, updated_at: new Date().toISOString() },
        { onConflict: "star_rating" }
      )
    )
  );

  revalidatePath("/admin/donden");
  redirect("/admin/donden");
}

export default async function AdminDondenPage() {
  await requireAdminSession();
  const svc = getSupabaseServiceClient();
  const table = (svc as any).from("donden_rate_settings");
  const { data } = await table.select("star_rating, donden_rate").order("star_rating", { ascending: true });
  const rateMap = new Map<number, number>(
    (data ?? []).map((row: { star_rating: number; donden_rate?: number | null }) => [row.star_rating, Number(row.donden_rate ?? 0)])
  );

  const { data: scenarioRows } = await (svc as any)
    .from("story_scenarios")
    .select("star_rating")
    .eq("is_donden", true);
  const dondenStars = new Set<number>((scenarioRows ?? []).map((row: { star_rating: number }) => Number(row.star_rating)));

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.4em] text-neon-yellow">DONDEN</p>
        <h1 className="font-display text-2xl text-white">どんでん返し設定</h1>
        <p className="text-sm text-zinc-300">
          ガチャ実行時にどんでん返しシナリオが選ばれる確率を★ごとに設定します（%）。0%にすると発生しません。
        </p>
      </div>

      <form action={updateDonden} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {STARS.map((star) => {
            const isAvailable = dondenStars.has(star);
            const defaultRate = isAvailable ? rateMap.get(star) ?? DEFAULT_RATES[star] ?? 0 : 0;
            return (
              <div key={star} className="rounded-2xl border border-white/10 bg-hall-panel/80 p-4 shadow-panel-inset">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">★{star}</p>
                  {!isAvailable && <span className="text-xs text-zinc-500">どんでんシナリオなし</span>}
                </div>
                <label className="mt-2 block text-sm text-white">どんでん返し発生率 (%)</label>
                <input
                  name={`rate_${star}`}
                  defaultValue={defaultRate}
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  readOnly={!isAvailable}
                  className={`mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white ${
                    isAvailable ? "" : "cursor-not-allowed opacity-60"
                  }`}
                />
              </div>
            );
          })}
        </div>
        <button
          type="submit"
          className="w-full rounded-xl bg-gradient-to-r from-neon-pink to-neon-yellow px-6 py-3 text-sm font-semibold text-black shadow-neon transition hover:brightness-105"
        >
          保存
        </button>
      </form>
    </section>
  );
}

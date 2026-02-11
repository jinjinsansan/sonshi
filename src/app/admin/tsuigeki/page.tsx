/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { requireAdminSession } from "@/lib/admin";

const STARS = [10, 11, 12];

const DEFAULTS: Record<number, { success_rate: number; card_count_on_success: number; third_card_rate: number | null }> = {
  10: { success_rate: 60, card_count_on_success: 2, third_card_rate: 0 },
  11: { success_rate: 75, card_count_on_success: 2, third_card_rate: 0 },
  12: { success_rate: 90, card_count_on_success: 3, third_card_rate: 50 },
};

async function updateTsuigeki(formData: FormData) {
  "use server";
  await requireAdminSession();
  const svc = getSupabaseServiceClient();
  const table = (svc as any).from("tsuigeki_settings");

  const rows = STARS.map((star) => {
    const successRate = Number(formData.get(`success_${star}`) ?? 0);
    const cardCount = Number(formData.get(`count_${star}`) ?? 1);
    const thirdRateRaw = formData.get(`third_${star}`);
    const thirdRate = thirdRateRaw ? Number(thirdRateRaw) : null;
    return {
      star,
      success_rate: Number.isFinite(successRate) ? successRate : 0,
      card_count_on_success: Number.isFinite(cardCount) ? cardCount : 1,
      third_card_rate: thirdRate !== null && Number.isFinite(thirdRate) ? thirdRate : null,
    };
  });

  await Promise.all(
    rows.map((row) =>
      table
        .upsert(
          {
            star: row.star,
            success_rate: row.success_rate,
            card_count_on_success: row.card_count_on_success,
            third_card_rate: row.third_card_rate,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "star" }
        )
    )
  );

  revalidatePath("/admin/tsuigeki");
  redirect("/admin/tsuigeki");
}

export default async function AdminTsuigekiPage() {
  await requireAdminSession();
  const svc = getSupabaseServiceClient();
  const table = (svc as any).from("tsuigeki_settings");
  const { data } = await table
    .select("star, success_rate, card_count_on_success, third_card_rate")
    .order("star", { ascending: true });

  const map = new Map<number, { success_rate: number; card_count_on_success: number; third_card_rate: number | null }>(
    (data ?? []).map((row: { star: number; success_rate?: number | null; card_count_on_success?: number | null; third_card_rate?: number | null }) => [row.star, {
      success_rate: Number(row.success_rate ?? 0),
      card_count_on_success: Number(row.card_count_on_success ?? 1),
      third_card_rate: row.third_card_rate !== null && row.third_card_rate !== undefined ? Number(row.third_card_rate) : null,
    }])
  );

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.4em] text-neon-yellow">TSUIGEKI</p>
        <h1 className="font-display text-2xl text-white">追撃設定</h1>
        <p className="text-sm text-zinc-300">★10〜12 の追撃成功率とカード枚数を設定します。</p>
      </div>

      <form action={updateTsuigeki} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {STARS.map((star) => {
            const row = map.get(star) ?? DEFAULTS[star];
            return (
              <div key={star} className="rounded-2xl border border-white/10 bg-hall-panel/80 p-4 shadow-panel-inset">
                <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">★{star}</p>
                <label className="mt-2 block text-sm text-white">成功率 (%)</label>
                <input
                  name={`success_${star}`}
                  defaultValue={row?.success_rate ?? 0}
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                />
                <label className="mt-3 block text-sm text-white">成功時カード枚数</label>
                <input
                  name={`count_${star}`}
                  defaultValue={row?.card_count_on_success ?? 1}
                  type="number"
                  min="1"
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                />
                {star === 12 && (
                  <>
                    <label className="mt-3 block text-sm text-white">3枚目追加率 (%)</label>
                    <input
                      name={`third_${star}`}
                      defaultValue={row?.third_card_rate ?? 0}
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>
        <button
          type="submit"
          className="rounded-full bg-gradient-to-r from-neon-pink to-neon-yellow px-5 py-2 text-sm font-semibold text-black shadow-neon"
        >
          保存
        </button>
      </form>
    </section>
  );
}

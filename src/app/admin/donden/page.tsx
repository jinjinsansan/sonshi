/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { requireAdminSession } from "@/lib/admin";

const TYPES: { key: string; label: string }[] = [
  { key: "win", label: "大当たり" },
  { key: "small_win", label: "小当たり" },
  { key: "lose", label: "ハズレ" },
];

async function updateDonden(formData: FormData) {
  "use server";
  await requireAdminSession();
  const svc = getSupabaseServiceClient();
  const table = (svc as any).from("donden_settings");

  const entries = TYPES.map((t) => {
    const probability = Number(formData.get(`probability_${t.key}`) ?? 0);
    return { type: t.key, probability: Number.isFinite(probability) ? probability : 0 };
  });

  await Promise.all(
    entries.map((entry) =>
      table
        .upsert({ type: entry.type, probability: entry.probability, updated_at: new Date().toISOString() }, { onConflict: "type" })
    )
  );

  revalidatePath("/admin/donden");
  redirect("/admin/donden");
}

export default async function AdminDondenPage() {
  await requireAdminSession();
  const svc = getSupabaseServiceClient();
  const table = (svc as any).from("donden_settings");
  const { data } = await table.select("type, probability");
  const map = new Map<string, number>(
    (data ?? []).map((row: { type: string; probability?: number | null }) => [row.type, Number(row.probability ?? 0)])
  );

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.4em] text-neon-yellow">DONDEN</p>
        <h1 className="font-display text-2xl text-white">どんでん返し設定</h1>
        <p className="text-sm text-zinc-300">win / small_win / lose の発生割合を設定します（%）。</p>
      </div>

      <form action={updateDonden} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {TYPES.map((t) => (
            <div key={t.key} className="rounded-2xl border border-white/10 bg-hall-panel/80 p-4 shadow-panel-inset">
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">{t.label}</p>
              <label className="mt-2 block text-sm text-white">確率 (%)</label>
              <input
                name={`probability_${t.key}`}
                defaultValue={map.get(t.key) ?? 0}
                type="number"
                step="0.01"
                min="0"
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
              />
            </div>
          ))}
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

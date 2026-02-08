/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { requireAdminSession } from "@/lib/admin";

async function updateRtp(formData: FormData) {
  "use server";
  await requireAdminSession();
  const svc = getSupabaseServiceClient();
  const table = (svc as any).from("rtp_settings");

  const stars = formData.getAll("star").map((v) => Number(v));
  const rows = stars.map((star) => {
    const probability = Number(formData.get(`probability_${star}`) ?? 0);
    return { star, probability: Number.isFinite(probability) ? probability : 0 };
  });

  await Promise.all(
    rows.map((row) =>
      table
        .upsert({ star: row.star, probability: row.probability, updated_at: new Date().toISOString() }, { onConflict: "star" })
    )
  );

  revalidatePath("/admin/rtp");
  redirect("/admin/rtp");
}

type PageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminRtpPage({ searchParams }: PageProps) {
  await requireAdminSession();
  const svc = getSupabaseServiceClient();
  const table = (svc as any).from("rtp_settings");
  const { error } = await searchParams;

  const { data } = await table
    .select("star, probability")
    .order("star", { ascending: true });

  const rows = (data ?? []) as { star: number; probability?: number | null }[];
  const total = rows.reduce((sum: number, row) => sum + Number(row.probability ?? 0), 0).toFixed(4);

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.4em] text-neon-yellow">RTP</p>
        <h1 className="font-display text-2xl text-white">★別 RTP 設定</h1>
        <p className="text-sm text-zinc-300">★1〜★12 の出現確率を設定します。</p>
        <p className="text-xs text-zinc-400">合計: {total}%</p>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
      </div>

      <form action={updateRtp} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {rows.map((row) => (
            <div key={row.star} className="rounded-2xl border border-white/10 bg-hall-panel/80 p-4 shadow-panel-inset">
              <input type="hidden" name="star" value={row.star} />
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">★{row.star}</p>
              <label className="mt-2 block text-sm text-white">確率 (%)</label>
              <input
                name={`probability_${row.star}`}
                defaultValue={row.probability ?? 0}
                type="number"
                step="0.0001"
                min="0"
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
              />
            </div>
          ))}
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

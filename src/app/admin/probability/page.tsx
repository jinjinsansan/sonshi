import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { requireAdminSession } from "@/lib/admin";
import { RARITY_ORDER } from "@/lib/gacha/rarity";

async function updateProbability(formData: FormData) {
  "use server";
  const session = await requireAdminSession();
  const svc = getSupabaseServiceClient();

  const rowIds = formData.getAll("row_id").map((value) => String(value));
  const rows = rowIds.map((id) => {
    const probability = Number(formData.get(`probability_${id}`) ?? 0);
    const rtpWeight = Number(formData.get(`rtp_weight_${id}`) ?? 1);
    const pityThresholdValue = formData.get(`pity_threshold_${id}`);
    const pityThreshold = pityThresholdValue ? Number(pityThresholdValue) : null;
    const isActive = formData.get(`is_active_${id}`) === "on";

    return {
      id,
      probability: Number.isFinite(probability) ? probability : 0,
      rtp_weight: Number.isFinite(rtpWeight) ? rtpWeight : 1,
      pity_threshold: Number.isFinite(pityThreshold ?? NaN) ? pityThreshold : null,
      is_active: isActive,
    };
  });

  const total = rows
    .filter((row) => row.is_active)
    .reduce((sum, row) => sum + (Number(row.probability) || 0), 0);

  if (Math.abs(total - 1) > 0.01) {
    redirect(`/admin/probability?error=${encodeURIComponent("確率合計を1.0にしてください")}`);
  }

  await Promise.all(
    rows.map((row) =>
      svc
        .from("gacha_probability")
        .update({
          probability: row.probability,
          rtp_weight: row.rtp_weight,
          pity_threshold: row.pity_threshold,
          is_active: row.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id)
    )
  );

  await svc.from("gacha_probability_history").insert({
    admin_user_id: session.user.id,
    admin_email: session.user.email ?? null,
    snapshot: rows,
    total_probability: total,
  });

  revalidatePath("/admin/probability");
  redirect("/admin/probability");
}

type ProbabilityPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminProbabilityPage({ searchParams }: ProbabilityPageProps) {
  await requireAdminSession();
  const svc = getSupabaseServiceClient();
  const { error } = await searchParams;

  const { data: rows } = await svc
    .from("gacha_probability")
    .select("id, rarity, probability, rtp_weight, pity_threshold, is_active, updated_at")
    .order("updated_at", { ascending: false });

  const { data: history } = await svc
    .from("gacha_probability_history")
    .select("id, admin_email, snapshot, total_probability, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  const sorted = [...(rows ?? [])].sort(
    (a, b) => RARITY_ORDER.indexOf(a.rarity as (typeof RARITY_ORDER)[number]) - RARITY_ORDER.indexOf(b.rarity as (typeof RARITY_ORDER)[number])
  );

  const total = sorted
    .filter((row) => row.is_active)
    .reduce((sum, row) => sum + (Number(row.probability) || 0), 0);

  const historyEntries = (history ?? []).map((entry) => {
    const snapshot = Array.isArray(entry.snapshot) ? entry.snapshot : [];
    const rows = snapshot.filter((row) => typeof row === "object" && row !== null) as Array<
      Record<string, unknown>
    >;
    const getRank = (rarity: unknown) => {
      const value = RARITY_ORDER.includes(rarity as (typeof RARITY_ORDER)[number])
        ? (rarity as (typeof RARITY_ORDER)[number])
        : null;
      return value ? RARITY_ORDER.indexOf(value) : 99;
    };
    const ordered = [...rows].sort((a, b) => getRank(a.rarity) - getRank(b.rarity));

    return {
      ...entry,
      ordered,
    };
  });

  return (
    <section className="space-y-6">
      <div className="glass-panel space-y-4 px-6 py-5">
        <div>
          <p className="text-xs uppercase tracking-[0.5em] text-neon-yellow">Probability</p>
          <h2 className="font-display text-2xl text-white">確率・RTP・天井</h2>
          <p className="text-sm text-zinc-300">確率合計は1.0になるよう調整してください。</p>
        </div>
        {error && <p className="text-sm text-red-300">{decodeURIComponent(error)}</p>}
        <p className="text-xs text-zinc-400">現在の合計: {total.toFixed(3)}</p>
      </div>

      <form action={updateProbability} className="space-y-4">
        {(sorted ?? []).map((row) => (
          <div
            key={row.id}
            className="rounded-3xl border border-white/10 bg-hall-panel/80 p-5 shadow-panel-inset"
          >
            <input type="hidden" name="row_id" value={row.id} />
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-display text-lg text-white">{row.rarity}</p>
                <p className="text-xs text-zinc-400">更新: {row.updated_at ? new Date(row.updated_at).toLocaleString("ja-JP") : "-"}</p>
              </div>
              <label className="flex items-center gap-2 text-xs text-zinc-300">
                <input type="checkbox" name={`is_active_${row.id}`} defaultChecked={row.is_active ?? true} /> 有効
              </label>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <label className="space-y-2 text-xs text-zinc-300">
                <span>排出確率</span>
                <input
                  name={`probability_${row.id}`}
                  type="number"
                  step="0.001"
                  min={0}
                  defaultValue={row.probability ?? 0}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white"
                />
              </label>
              <label className="space-y-2 text-xs text-zinc-300">
                <span>RTP重み</span>
                <input
                  name={`rtp_weight_${row.id}`}
                  type="number"
                  step="0.1"
                  min={0}
                  defaultValue={row.rtp_weight ?? 1}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white"
                />
              </label>
              <label className="space-y-2 text-xs text-zinc-300">
                <span>天井回数</span>
                <input
                  name={`pity_threshold_${row.id}`}
                  type="number"
                  min={0}
                  defaultValue={row.pity_threshold ?? ""}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white"
                />
              </label>
            </div>
          </div>
        ))}

        <button
          type="submit"
          className="w-full rounded-full bg-gradient-to-r from-neon-pink to-neon-yellow px-6 py-3 text-xs uppercase tracking-[0.4em] text-black shadow-neon"
        >
          保存
        </button>
      </form>

      <div className="space-y-4">
        <div className="glass-panel space-y-2 px-6 py-4">
          <p className="text-xs uppercase tracking-[0.5em] text-neon-yellow">History</p>
          <h3 className="font-display text-xl text-white">変更履歴</h3>
          <p className="text-xs text-zinc-400">直近10件の確率更新履歴です。</p>
        </div>
        {historyEntries.length === 0 ? (
          <p className="text-sm text-zinc-500">履歴がありません。</p>
        ) : (
          historyEntries.map((entry) => (
            <div key={entry.id} className="rounded-3xl border border-white/10 bg-hall-panel/80 p-5 shadow-panel-inset">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm text-white">{entry.admin_email ?? "(no email)"}</p>
                  <p className="text-xs text-zinc-400">
                    {entry.created_at ? new Date(entry.created_at).toLocaleString("ja-JP") : "-"}
                  </p>
                </div>
                <p className="text-xs text-zinc-300">合計: {Number(entry.total_probability ?? 0).toFixed(3)}</p>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-5">
                {entry.ordered.map((row, index) => (
                  <div key={`${entry.id}-${row.rarity ?? "row"}-${index}`} className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-zinc-300">
                    <p className="text-white">{String(row.rarity ?? "-")}</p>
                    <p>確率: {Number(row.probability ?? 0).toFixed(3)}</p>
                    <p>RTP: {Number(row.rtp_weight ?? 1).toFixed(1)}</p>
                    <p>天井: {String(row.pity_threshold ?? "-")}</p>
                    <p>{Boolean(row.is_active) ? "有効" : "無効"}</p>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

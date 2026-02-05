import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { requireAdminSession } from "@/lib/admin";
import { RARITY_ORDER } from "@/lib/gacha/rarity";

export default async function AdminStatsPage() {
  await requireAdminSession();
  const svc = getSupabaseServiceClient();

  const authSchema = (svc as typeof svc & { schema?: (schema: string) => typeof svc }).schema?.("auth") ?? (svc as typeof svc);
  const [usersResp, pullsResp, cardsResp, inventoryResp, resultsResp, authCountResp] = await Promise.all([
    svc.auth.admin.listUsers({ page: 1, perPage: 1 }),
    svc.from("gacha_results").select("id", { count: "exact", head: true }),
    svc.from("cards").select("id", { count: "exact", head: true }),
    svc.from("card_inventory").select("id", { count: "exact", head: true }),
    svc
      .from("gacha_results")
      .select("id, cards(rarity)")
      .order("created_at", { ascending: false })
      .limit(500),
    authSchema.from("users").select("id", { count: "exact", head: true }),
  ]);

  const stats = [
    { label: "ユーザー", value: authCountResp.count ?? usersResp.data?.users?.length ?? 0 },
    { label: "総ガチャ回数", value: pullsResp.count ?? 0 },
    { label: "カード種", value: cardsResp.count ?? 0 },
    { label: "在庫総数", value: inventoryResp.count ?? 0 },
  ];

  const rarityCounts = new Map(RARITY_ORDER.map((rarity) => [rarity, 0]));
  (resultsResp.data ?? []).forEach((row) => {
    const rarity = row.cards?.rarity as (typeof RARITY_ORDER)[number] | undefined;
    if (!rarity) return;
    rarityCounts.set(rarity, (rarityCounts.get(rarity) ?? 0) + 1);
  });

  return (
    <section className="space-y-6">
      <div className="glass-panel space-y-4 px-6 py-5">
        <div>
          <p className="text-xs uppercase tracking-[0.5em] text-neon-yellow">Stats</p>
          <h2 className="font-display text-2xl text-white">KPIダッシュボード</h2>
          <p className="text-sm text-zinc-300">直近500件のガチャ結果からレア度比率を集計します。</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-3xl border border-white/10 bg-hall-panel/80 p-4 text-center shadow-panel-inset"
          >
            <p className="text-xs uppercase tracking-[0.4em] text-zinc-400">{stat.label}</p>
            <p className="mt-2 font-display text-2xl text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-white/10 bg-hall-panel/80 p-5 shadow-panel-inset">
        <p className="text-sm text-white">レア度別排出（直近500件）</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {RARITY_ORDER.map((rarity) => (
            <div key={rarity} className="flex items-center justify-between text-sm text-zinc-300">
              <span>{rarity}</span>
              <span>{rarityCounts.get(rarity) ?? 0}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

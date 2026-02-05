import Link from "next/link";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { requireAdminSession } from "@/lib/admin";

const shortcuts = [
  {
    title: "カード管理",
    description: "カードマスタ・在庫・シリアルを管理",
    href: "/admin/cards",
  },
  {
    title: "ユーザー管理",
    description: "ユーザー一覧とチケット付与",
    href: "/admin/users",
  },
  {
    title: "紹介管理",
    description: "紹介コードと進捗の確認",
    href: "/admin/referrals",
  },
  {
    title: "確率設定",
    description: "確率・RTP・天井の調整",
    href: "/admin/probability",
  },
  {
    title: "統計",
    description: "KPIと直近の排出データ",
    href: "/admin/stats",
  },
];

export default async function AdminPage() {
  await requireAdminSession();
  const svc = getSupabaseServiceClient();

  const authSchema = (svc as typeof svc & { schema?: (schema: string) => typeof svc }).schema?.("auth") ?? (svc as typeof svc);
  const [usersResp, cardsResp, pullsResp, inventoryResp, referralsResp, authCountResp] = await Promise.all([
    svc.auth.admin.listUsers({ page: 1, perPage: 1 }),
    svc.from("cards").select("id", { count: "exact", head: true }),
    svc.from("gacha_results").select("id", { count: "exact", head: true }),
    svc.from("card_inventory").select("id", { count: "exact", head: true }),
    svc.from("referrals").select("id", { count: "exact", head: true }),
    authSchema.from("users").select("id", { count: "exact", head: true }),
  ]);

  const stats = [
    { label: "ユーザー", value: authCountResp.count ?? usersResp.data?.users?.length ?? 0 },
    { label: "カード", value: cardsResp.count ?? 0 },
    { label: "ガチャ結果", value: pullsResp.count ?? 0 },
    { label: "在庫", value: inventoryResp.count ?? 0 },
    { label: "紹介", value: referralsResp.count ?? 0 },
  ];

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-5">
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

      <div className="grid gap-4 md:grid-cols-2">
        {shortcuts.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-3xl border border-white/10 bg-hall-panel/80 p-5 shadow-panel-inset transition hover:border-neon-blue"
          >
            <h2 className="font-display text-xl text-white">{item.title}</h2>
            <p className="mt-2 text-sm text-zinc-400">{item.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

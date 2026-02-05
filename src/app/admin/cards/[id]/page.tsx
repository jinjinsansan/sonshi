import Link from "next/link";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { requireAdminSession } from "@/lib/admin";

type CardDetailProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminCardDetailPage({ params }: CardDetailProps) {
  await requireAdminSession();
  const { id } = await params;
  const svc = getSupabaseServiceClient();

  const { data: card } = await svc
    .from("cards")
    .select("id, name, rarity, max_supply, current_supply")
    .eq("id", id)
    .maybeSingle();

  const { data: inventory } = await svc
    .from("card_inventory")
    .select("id, owner_id, serial_number, obtained_at")
    .eq("card_id", id)
    .order("serial_number", { ascending: true });

  const ownerIds = Array.from(new Set((inventory ?? []).map((row) => row.owner_id)));
  const ownerEmails = new Map<string, string>();

  await Promise.all(
    ownerIds.slice(0, 30).map(async (ownerId) => {
      const { data } = await svc.auth.admin.getUserById(ownerId);
      if (data?.user?.email) {
        ownerEmails.set(ownerId, data.user.email);
      }
    })
  );

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.5em] text-neon-yellow">Card Owners</p>
          <h2 className="font-display text-2xl text-white">{card?.name ?? "カード詳細"}</h2>
          <p className="text-sm text-zinc-400">
            {card?.rarity ?? "-"} ・ {card?.current_supply ?? 0}/{card?.max_supply ?? 0}
          </p>
        </div>
        <Link
          href="/admin/cards"
          className="rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/80 transition hover:border-neon-blue hover:text-white"
        >
          戻る
        </Link>
      </div>

      <div className="rounded-3xl border border-white/10 bg-hall-panel/80 p-5 shadow-panel-inset">
        {(inventory ?? []).length === 0 ? (
          <p className="text-sm text-zinc-400">保有者がいません。</p>
        ) : (
          <div className="space-y-2 text-sm">
            {inventory?.map((row) => (
              <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-2">
                <div>
                  <p className="font-display text-white">#{row.serial_number}</p>
                  <p className="text-xs text-zinc-400">{row.owner_id}</p>
                </div>
                <div className="text-xs text-zinc-300">
                  {ownerEmails.get(row.owner_id) ?? ""}
                </div>
                <div className="text-xs text-zinc-400">
                  {row.obtained_at ? new Date(row.obtained_at).toLocaleString("ja-JP") : "-"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

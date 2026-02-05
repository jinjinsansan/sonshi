import Link from "next/link";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { requireAdminSession } from "@/lib/admin";

type CardDetailProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ owner?: string; serial?: string }>;
};

export default async function AdminCardDetailPage({ params, searchParams }: CardDetailProps) {
  await requireAdminSession();
  const { id } = await params;
  const { owner, serial } = await searchParams;
  const ownerFilter = owner?.trim() ?? "";
  const serialFilter = serial ? Number(serial) : null;
  const svc = getSupabaseServiceClient();

  const { data: card } = await svc
    .from("cards")
    .select("id, name, rarity, max_supply, current_supply")
    .eq("id", id)
    .maybeSingle();

  let inventoryQuery = svc
    .from("card_inventory")
    .select("id, owner_id, serial_number, obtained_at")
    .eq("card_id", id)
    .order("serial_number", { ascending: true });

  if (ownerFilter) {
    inventoryQuery = inventoryQuery.eq("owner_id", ownerFilter);
  }

  if (Number.isFinite(serialFilter)) {
    inventoryQuery = inventoryQuery.eq("serial_number", serialFilter as number);
  }

  const { data: inventory } = await inventoryQuery;

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

  const csvHeader = "serial_number,owner_id,email,obtained_at";
  const csvRows = (inventory ?? []).map((row) => {
    const email = ownerEmails.get(row.owner_id) ?? "";
    const obtained = row.obtained_at ? new Date(row.obtained_at).toISOString() : "";
    return `${row.serial_number ?? ""},${row.owner_id},${email},${obtained}`;
  });
  const csvContent = [csvHeader, ...csvRows].join("\n");
  const csvHref = `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`;

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

      <form action={`/admin/cards/${id}`} method="get" className="flex flex-wrap gap-2">
        <input
          name="owner"
          defaultValue={ownerFilter}
          placeholder="owner_idで絞り込み"
          className="flex-1 rounded-2xl border border-white/10 bg-black/20 px-4 py-2 text-sm text-white"
        />
        <input
          name="serial"
          defaultValue={serial ?? ""}
          placeholder="シリアル番号"
          className="w-40 rounded-2xl border border-white/10 bg-black/20 px-4 py-2 text-sm text-white"
        />
        <button
          type="submit"
          className="rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/80 transition hover:border-neon-blue hover:text-white"
        >
          絞り込み
        </button>
        <Link
          href={`/admin/cards/${id}`}
          className="rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/70 transition hover:border-neon-blue hover:text-white"
        >
          クリア
        </Link>
        <a
          href={csvHref}
          download={`${card?.name ?? "card"}_owners.csv`}
          className="rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/70 transition hover:border-neon-blue hover:text-white"
        >
          CSV
        </a>
      </form>

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

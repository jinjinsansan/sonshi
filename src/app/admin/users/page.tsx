import Link from "next/link";
import { revalidatePath } from "next/cache";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { requireAdminSession } from "@/lib/admin";

async function grantTicket(formData: FormData) {
  "use server";
  await requireAdminSession();
  const svc = getSupabaseServiceClient();

  const userId = String(formData.get("user_id") ?? "").trim();
  const ticketTypeId = String(formData.get("ticket_type_id") ?? "").trim();
  const amount = Number(formData.get("amount") ?? 0);
  if (!userId || !ticketTypeId || amount <= 0) return;

  const { data: existing } = await svc
    .from("user_tickets")
    .select("id, quantity")
    .eq("user_id", userId)
    .eq("ticket_type_id", ticketTypeId)
    .limit(1)
    .maybeSingle();

  const nextQuantity = (existing?.quantity ?? 0) + amount;
  await svc.from("user_tickets").upsert({
    id: existing?.id,
    user_id: userId,
    ticket_type_id: ticketTypeId,
    quantity: nextQuantity,
  });

  revalidatePath("/admin/users");
}

type AdminUsersPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  await requireAdminSession();
  const svc = getSupabaseServiceClient();
  const { q } = await searchParams;
  const query = q?.trim().toLowerCase() ?? "";

  const [usersResp, ticketTypesResp] = await Promise.all([
    svc.auth.admin.listUsers({ page: 1, perPage: 50 }),
    svc.from("ticket_types").select("id, code, name").order("sort_order"),
  ]);

  const users = usersResp.data?.users ?? [];
  const filteredUsers = query
    ? users.filter((user) =>
        user.email?.toLowerCase().includes(query) || user.id.toLowerCase().includes(query)
      )
    : users;
  const ticketTypes = ticketTypesResp.data ?? [];

  const userIds = filteredUsers.map((user) => user.id);
  const { data: balances } = userIds.length
    ? await svc
        .from("user_tickets")
        .select("user_id, quantity, ticket_types(code)")
        .in("user_id", userIds)
    : { data: [] };

  const ticketsByUser = new Map<string, { code: string; quantity: number }[]>();
  (balances ?? []).forEach((row) => {
    const list = ticketsByUser.get(row.user_id) ?? [];
    list.push({ code: row.ticket_types?.code ?? "-", quantity: row.quantity ?? 0 });
    ticketsByUser.set(row.user_id, list);
  });

  return (
    <section className="space-y-6">
      <div className="glass-panel space-y-4 px-6 py-5">
        <div>
          <p className="text-xs uppercase tracking-[0.5em] text-neon-yellow">Users</p>
          <h2 className="font-display text-2xl text-white">ユーザー管理</h2>
          <p className="text-sm text-zinc-300">チケット付与とユーザー一覧を確認できます。</p>
        </div>
        <form action="/admin/users" method="get" className="flex flex-wrap gap-2">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="メール or ユーザーIDで検索"
            className="flex-1 rounded-2xl border border-white/10 bg-black/20 px-4 py-2 text-sm text-white"
          />
          <button
            type="submit"
            className="rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/80 transition hover:border-neon-blue hover:text-white"
          >
            検索
          </button>
          <Link
            href="/admin/users"
            className="rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/70 transition hover:border-neon-blue hover:text-white"
          >
            クリア
          </Link>
        </form>
        <form action={grantTicket} className="grid gap-3 md:grid-cols-4">
          <input
            name="user_id"
            placeholder="ユーザーID"
            className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white md:col-span-2"
            required
          />
          <select
            name="ticket_type_id"
            className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white"
            required
          >
            <option value="">チケット種別</option>
            {ticketTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name} ({type.code})
              </option>
            ))}
          </select>
          <input
            name="amount"
            type="number"
            min={1}
            placeholder="付与枚数"
            className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white"
            required
          />
          <button
            type="submit"
            className="rounded-full bg-gradient-to-r from-neon-pink to-neon-yellow px-6 py-3 text-xs uppercase tracking-[0.4em] text-black shadow-neon md:col-span-4"
          >
            付与する
          </button>
        </form>
      </div>

      <div className="rounded-3xl border border-white/10 bg-hall-panel/80 p-5 shadow-panel-inset">
        {filteredUsers.length === 0 ? (
          <p className="text-sm text-zinc-400">該当ユーザーが存在しません。</p>
        ) : (
          <div className="space-y-3 text-sm">
            {filteredUsers.map((user) => (
              <div key={user.id} className="border-b border-white/5 pb-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-display text-white">{user.email ?? "(no email)"}</p>
                    <p className="text-xs text-zinc-400">{user.id}</p>
                  </div>
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-white/70 transition hover:border-neon-blue hover:text-white"
                  >
                    詳細
                  </Link>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-300">
                  {(ticketsByUser.get(user.id) ?? []).length === 0 ? (
                    <span className="text-zinc-500">チケットなし</span>
                  ) : (
                    (ticketsByUser.get(user.id) ?? []).map((ticket, index) => (
                      <span key={`${user.id}-${ticket.code}-${index}`} className="rounded-full border border-white/10 px-2 py-1">
                        {ticket.code}: {ticket.quantity}
                      </span>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

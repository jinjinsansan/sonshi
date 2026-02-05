import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerAuthUser } from "@/lib/auth/session";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

const RARITY_LABELS: Record<string, string> = {
  N: "N",
  R: "R",
  SR: "SR",
  SSR: "SSR",
  UR: "UR",
};

type CardDetailProps = {
  params: Promise<{ cardId: string }>;
};

export default async function CardDetailPage({ params }: CardDetailProps) {
  const { cardId } = await params;
  const user = await getServerAuthUser();
  if (!user) {
    redirect("/login");
  }

  const supabase = getSupabaseServiceClient();

  const { data: inventory, error } = await supabase
    .from("card_inventory")
    .select(
      `serial_number, obtained_at,
       cards (id, name, rarity, description, image_url, max_supply, current_supply, person_name, card_style)`
    )
    .eq("owner_id", user.id)
    .eq("card_id", cardId)
    .order("serial_number", { ascending: true });

  if (error) {
    return (
      <section className="space-y-6">
        <p className="text-sm text-red-300">{error.message}</p>
        <Link href="/collection" className="text-neon-blue">
          コレクションへ戻る
        </Link>
      </section>
    );
  }

  if (!inventory || inventory.length === 0) {
    return (
      <section className="space-y-6">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.5em] text-neon-purple">Collection</p>
          <h1 className="font-display text-3xl text-white">カード未所持</h1>
          <p className="text-sm text-zinc-400">このカードはまだ所持していません。</p>
        </div>
        <Link
          href="/collection"
          className="inline-flex rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/80 transition hover:border-neon-blue hover:text-white"
        >
          コレクションへ戻る
        </Link>
      </section>
    );
  }

  const card = inventory[0].cards;
  const latestObtainedTimestamp = inventory.reduce((latest, entry) => {
    if (!entry.obtained_at) return latest;
    const timestamp = new Date(entry.obtained_at).getTime();
    return timestamp > latest ? timestamp : latest;
  }, 0);
  const latestObtainedAt = latestObtainedTimestamp ? new Date(latestObtainedTimestamp) : null;

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.5em] text-neon-purple">Collection</p>
          <h1 className="font-display text-3xl text-white">{card?.name ?? "カード詳細"}</h1>
          {card?.description && <p className="text-sm text-zinc-300">{card.description}</p>}
        </div>
        <Link
          href="/collection"
          className="rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/80 transition hover:border-neon-blue hover:text-white"
        >
          戻る
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr,1fr]">
        <div className="rounded-3xl border border-white/10 bg-hall-panel/80 p-6 shadow-panel-inset">
          {card?.image_url ? (
            <Image
              src={card.image_url}
              alt={card.name ?? "card"}
              width={560}
              height={760}
              unoptimized
              className="w-full rounded-2xl object-cover"
            />
          ) : (
            <div className="flex h-[360px] items-center justify-center rounded-2xl bg-black/30 text-sm text-zinc-400">
              NO IMAGE
            </div>
          )}
        </div>
        <div className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-hall-panel/80 p-5 shadow-panel-inset">
            <p className="text-xs uppercase tracking-[0.4em] text-neon-yellow">Rarity</p>
            <p className="mt-2 font-display text-3xl text-white">
              {RARITY_LABELS[card?.rarity ?? ""] ?? card?.rarity ?? "-"}
            </p>
            <p className="mt-2 text-sm text-zinc-400">
              {card?.person_name ?? ""}
              {card?.person_name && card?.card_style ? " / " : ""}
              {card?.card_style ?? ""}
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-hall-panel/80 p-5 shadow-panel-inset">
            <p className="text-xs uppercase tracking-[0.4em] text-neon-blue">Supply</p>
            <p className="mt-2 text-2xl text-white">
              {card?.current_supply ?? 0} / {card?.max_supply ?? 0}
            </p>
            <p className="mt-1 text-xs text-zinc-500">発行済み / 最大発行枚数</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-hall-panel/80 p-5 shadow-panel-inset">
            <p className="text-xs uppercase tracking-[0.4em] text-zinc-400">Owned Serials</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {inventory.map((entry) => (
                <span
                  key={`${cardId}-${entry.serial_number}`}
                  className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/80"
                >
                  #{entry.serial_number}
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs text-zinc-500">
              最新取得: {latestObtainedAt ? latestObtainedAt.toLocaleString("ja-JP") : "-"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

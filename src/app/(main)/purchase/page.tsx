import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerAuthUser } from "@/lib/auth/session";

const PACKS = [
  {
    name: "FREE DAILY",
    tickets: 1,
    price: "ログインボーナス",
    desc: "毎日10時リセットで受取",
    available: true,
    cta: "/mypage/tickets",
  },
  {
    name: "NEON 5",
    tickets: 5,
    price: "¥1,200 (予定)",
    desc: "one.lat決済と連動予定",
    available: false,
  },
  {
    name: "RUSH 10",
    tickets: 10,
    price: "¥2,200 (予定)",
    desc: "限定演出＆SR+保証チケットを検討中",
    available: false,
  },
  {
    name: "SONSHI 30",
    tickets: 30,
    price: "¥5,800 (予定)",
    desc: "UR抽選メーター加算を計画",
    available: false,
  },
];

const NOTES = [
  "決済回りはスキップ指示のため、現在はログインボーナス・紹介・LINE特典でチケットを配布しています。",
  "有償パックは one.lat 決済 + Webhook で残高に反映予定です。",
  "購入履歴は実装時に user_tickets とは別の payments / ticket_transactions テーブルで管理します。",
];

export default async function PurchasePage() {
  const user = await getServerAuthUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.5em] text-neon-yellow">Ticket Packs</p>
        <h1 className="font-display text-3xl text-white">チケット購入（準備中）</h1>
        <p className="text-sm text-zinc-300">有償パックはUMA仕様を踏襲しつつ、決済フロー実装後に解放します。</p>
      </div>

      <div className="grid gap-4">
        {PACKS.map((pack) => (
          <div key={pack.name} className="rounded-3xl border border-white/10 bg-black/25 p-5 shadow-panel-inset">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-zinc-400">{pack.name}</p>
                <p className="font-display text-4xl text-white">{pack.tickets}</p>
                <p className="text-sm text-zinc-400">TICKETS</p>
              </div>
              <span className="rounded-full border border-white/15 px-4 py-2 text-[11px] uppercase tracking-[0.35em] text-neon-yellow">
                {pack.price}
              </span>
            </div>
            <p className="mt-3 text-sm text-zinc-400">{pack.desc}</p>
            {pack.available ? (
              <Link
                href={pack.cta ?? "/mypage/tickets"}
                className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-neon-pink to-neon-yellow px-4 py-3 text-[11px] uppercase tracking-[0.35em] text-black"
              >
                FREEで受け取る
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="mt-4 w-full rounded-full border border-white/15 px-4 py-3 text-[11px] uppercase tracking-[0.35em] text-white/60"
              >
                COMING SOON
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-2 rounded-3xl border border-white/10 bg-black/25 px-5 py-5 text-sm text-zinc-300 shadow-panel-inset">
        {NOTES.map((note) => (
          <p key={note}>・{note}</p>
        ))}
      </div>

      <Link
        href="/mypage/tickets"
        className="flex h-12 items-center justify-center rounded-full border border-white/15 text-[11px] uppercase tracking-[0.35em] text-white"
      >
        チケット管理へ戻る
      </Link>
    </section>
  );
}

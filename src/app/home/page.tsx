export default function SonshiHome() {
  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-hall-panel/80 p-6 shadow-panel-inset">
        <p className="text-xs uppercase tracking-[0.4em] text-neon-blue">Tickets</p>
        <h2 className="mt-3 font-display text-3xl text-white">チケット残高</h2>
        <p className="text-sm text-zinc-400">Supabase の user_tickets から後ほど連携します。</p>
      </div>
      <div className="rounded-3xl border border-white/10 bg-hall-panel/80 p-6 shadow-panel-inset">
        <p className="text-xs uppercase tracking-[0.4em] text-neon-yellow">Gacha</p>
        <h2 className="mt-3 font-display text-2xl text-white">開催中のガチャ</h2>
        <p className="text-sm text-zinc-400">UMA の `GACHA_DEFINITIONS` を移植後、ここにリスト表示します。</p>
      </div>
    </section>
  );
}

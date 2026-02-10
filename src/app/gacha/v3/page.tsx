"use client";

import { GachaV3Player } from "@/components/gacha/gacha-v3-player";

export default function GachaV3Page() {
  return (
    <section className="space-y-6">
      <div className="space-y-2 text-center">
        <p className="text-xs uppercase tracking-[0.5em] text-neon-purple">Gacha V3</p>
        <h1 className="font-display text-3xl text-white">新演出ガチャ</h1>
        <p className="text-sm text-zinc-300">V3シナリオ（可変コマ + どんでん + 追撃）</p>
      </div>
      <GachaV3Player />
    </section>
  );
}

"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { MultiGachaSession } from "@/components/gacha/multi-gacha-session";

type Props = {
  gachaId: string;
};

function GachaDetailExperience({ gachaId }: Props) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);

  const startSession = async () => {
    setPending(true);
    setError(null);
    setFinished(false);
    try {
      const res = await fetch("/api/gacha/multi/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gachaId, totalPulls: 10 }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error ?? "開始に失敗しました");
      }
      setSessionId(data.sessionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "開始に失敗しました");
    } finally {
      setPending(false);
    }
  };

  if (sessionId) {
    return <MultiGachaSession sessionId={sessionId} onFinished={() => setFinished(true)} fullscreenMode />;
  }

  if (finished) {
    return (
      <div className="rounded-3xl border border-white/15 bg-black/30 p-5 text-center shadow-panel-inset">
        <h2 className="font-display text-xl text-white">演出完了</h2>
        <button
          type="button"
          onClick={() => {
            setSessionId(null);
            setError(null);
            setFinished(false);
          }}
          className="mt-4 inline-flex items-center justify-center rounded-full border border-white/15 px-4 py-3 text-[11px] uppercase tracking-[0.35em] text-white transition hover:border-neon-blue"
        >
          同じガチャでもう一度回す
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/15 bg-black/30 p-5 text-center shadow-panel-inset">
      <h2 className="font-display text-xl text-white">10連演出を体験</h2>
      <p className="mt-1 text-sm text-zinc-300">NEXTで進む演出→結果排出（開発用デモカード/映像）</p>
      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
      <button
        type="button"
        onClick={startSession}
        disabled={pending}
        className="mt-4 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-neon-pink to-neon-yellow px-5 py-3 text-[11px] uppercase tracking-[0.35em] text-black shadow-[0_0_18px_rgba(255,246,92,0.35)] disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "10連を始める"}
      </button>
    </div>
  );
}

export default GachaDetailExperience;

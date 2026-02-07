"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Loader2 } from "lucide-react";
import { MultiGachaSession } from "@/components/gacha/multi-gacha-session";

type Props = {
  gachaId: string;
};

const GACHA_THEME_COLORS: Record<string, {
  ringColor: string;
  glowColor: string;
  ledColor: string;
}> = {
  free: {
    ringColor: "border-neon-blue",
    glowColor: "shadow-neon-blue/50",
    ledColor: "bg-neon-blue",
  },
  basic: {
    ringColor: "border-amber-400",
    glowColor: "shadow-amber-400/50",
    ledColor: "bg-amber-400",
  },
  epic: {
    ringColor: "border-neon-pink",
    glowColor: "shadow-neon-pink/50",
    ledColor: "bg-neon-pink",
  },
  premium: {
    ringColor: "border-neon-purple",
    glowColor: "shadow-neon-purple/50",
    ledColor: "bg-neon-purple",
  },
  ex: {
    ringColor: "border-emerald-400",
    glowColor: "shadow-emerald-400/50",
    ledColor: "bg-emerald-400",
  },
};

function GachaDetailExperience({ gachaId }: Props) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);

  const theme = GACHA_THEME_COLORS[gachaId] || GACHA_THEME_COLORS.free;

  const startSession = async (pulls: number) => {
    setPending(true);
    setError(null);
    setFinished(false);
    try {
      const res = await fetch("/api/gacha/multi/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gachaId, totalPulls: pulls }),
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
      <div className="rounded-3xl border border-white/15 bg-black/30 p-8 text-center shadow-panel-inset">
        <div className="space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">COMPLETE</p>
            <h2 className="mt-1 font-display text-2xl text-white">演出完了</h2>
          </div>
          <button
            type="button"
            onClick={() => {
              setSessionId(null);
              setError(null);
              setFinished(false);
            }}
            className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/10 px-6 py-3 text-xs uppercase tracking-[0.35em] text-white transition hover:bg-white/20"
          >
            同じガチャでもう一度回す
          </button>
        </div>
      </div>
    );
  }

  const loadingOverlay = pending && typeof window !== "undefined" ? createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-16 w-16 animate-spin text-neon-yellow" />
        <p className="text-lg uppercase tracking-[0.4em] text-white/80">Loading...</p>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      {loadingOverlay}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-900 shadow-2xl">
        {/* 筐体の上部装飾 */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-white/10 via-white/30 to-white/10" />
        
        <div className="p-6 sm:p-8">
          <div className="mb-8 text-center">
            <h2 className="font-display text-2xl text-white drop-shadow-md">ガチャ開始</h2>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-center">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* ボタンエリア */}
          <div className="flex flex-row items-start justify-center gap-5 py-4">
            
            {/* 1連ボタン */}
            <div className="flex flex-col items-center gap-3 group">
              <div className="relative">
                <div className={`absolute -inset-4 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity ${theme.ledColor}`} />
                <button
                  type="button"
                  onClick={() => startSession(1)}
                  disabled={pending}
                  className="relative h-24 w-24 rounded-full transition-transform active:scale-95 disabled:opacity-60"
                >
                  {/* 外側リング (発光部) */}
                  <div className={`absolute inset-0 rounded-full border-[5px] ${theme.ringColor} bg-black shadow-[0_0_15px_rgba(0,0,0,0.5)] ${theme.glowColor} drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]`} />
                  
                  {/* 内側ボタン (シルバーメタリック) */}
                  <div className="absolute inset-2 rounded-full bg-gradient-to-b from-zinc-200 via-zinc-400 to-zinc-500 shadow-[inset_0_2px_5px_rgba(255,255,255,0.8),inset_0_-2px_5px_rgba(0,0,0,0.5),0_5px_10px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center border border-zinc-600">
                    <span className="font-display text-4xl font-bold text-zinc-800 drop-shadow-[0_1px_0_rgba(255,255,255,0.5)]">1</span>
                    <span className="text-[9px] font-bold text-zinc-700 tracking-widest mt-[-2px]">REN</span>
                  </div>
                  
                  {/* ハイライト */}
                  <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/40 to-transparent opacity-50 pointer-events-none" />
                </button>
              </div>
              <div className="text-[10px] font-bold text-amber-400 tracking-wider drop-shadow-md">SINGLE</div>
            </div>

            {/* 5連ボタン */}
            <div className="flex flex-col items-center gap-3 group">
              <div className="relative">
                <div className={`absolute -inset-4 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity ${theme.ledColor}`} />
                <button
                  type="button"
                  onClick={() => startSession(5)}
                  disabled={pending}
                  className="relative h-24 w-24 rounded-full transition-transform active:scale-95 disabled:opacity-60"
                >
                  {/* 外側リング */}
                  <div className={`absolute inset-0 rounded-full border-[5px] ${theme.ringColor} bg-black shadow-[0_0_15px_rgba(0,0,0,0.5)] ${theme.glowColor} drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]`} />
                  
                  {/* 内側ボタン */}
                  <div className="absolute inset-2 rounded-full bg-gradient-to-b from-zinc-200 via-zinc-400 to-zinc-500 shadow-[inset_0_2px_5px_rgba(255,255,255,0.8),inset_0_-2px_5px_rgba(0,0,0,0.5),0_5px_10px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center border border-zinc-600">
                    <span className="font-display text-4xl font-bold text-zinc-800 drop-shadow-[0_1px_0_rgba(255,255,255,0.5)]">5</span>
                    <span className="text-[9px] font-bold text-zinc-700 tracking-widest mt-[-2px]">REN</span>
                  </div>
                  
                  {/* ハイライト */}
                  <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/40 to-transparent opacity-50 pointer-events-none" />
                </button>
              </div>
              <div className="text-[10px] font-bold text-amber-400 tracking-wider drop-shadow-md">MULTI</div>
            </div>

            {/* 10連ボタン */}
            <div className="flex flex-col items-center gap-3 group">
              <div className="relative">
                <div className={`absolute -inset-4 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity ${theme.ledColor}`} />
                <button
                  type="button"
                  onClick={() => startSession(10)}
                  disabled={pending}
                  className="relative h-24 w-24 rounded-full transition-transform active:scale-95 disabled:opacity-60"
                >
                  {/* 外側リング */}
                  <div className={`absolute inset-0 rounded-full border-[5px] ${theme.ringColor} bg-black shadow-[0_0_15px_rgba(0,0,0,0.5)] ${theme.glowColor} drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]`} />
                  
                  {/* 内側ボタン */}
                  <div className="absolute inset-2 rounded-full bg-gradient-to-b from-zinc-200 via-zinc-400 to-zinc-500 shadow-[inset_0_2px_5px_rgba(255,255,255,0.8),inset_0_-2px_5px_rgba(0,0,0,0.5),0_5px_10px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center border border-zinc-600">
                    <span className="font-display text-4xl font-bold text-zinc-800 drop-shadow-[0_1px_0_rgba(255,255,255,0.5)]">10</span>
                    <span className="text-[9px] font-bold text-zinc-700 tracking-widest mt-[-2px]">REN</span>
                  </div>
                  
                  {/* ハイライト */}
                  <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/40 to-transparent opacity-50 pointer-events-none" />
                </button>
              </div>
              <div className="text-[10px] font-bold text-amber-400 tracking-wider drop-shadow-md">MAX</div>
            </div>

          </div>
          
          <div className="text-center text-xs text-zinc-500 mt-4">
            <p>※ボタンを押すと演出が始まります</p>
          </div>
        </div>
      </div>
    </>
  );
}

export default GachaDetailExperience;

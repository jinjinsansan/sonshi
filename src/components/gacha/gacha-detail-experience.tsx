"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Loader2 } from "lucide-react";
import { MultiGachaSession } from "@/components/gacha/multi-gacha-session";

type Props = {
  gachaId: string;
};

const GACHA_THEME_COLORS: Record<string, {
  primary: string;
  secondary: string;
  glow: string;
  text: string;
}> = {
  free: {
    primary: "from-[#51d8ff] to-[#2d9bff]",
    secondary: "from-[#3aa3d4] to-[#1f7ab8]",
    glow: "rgba(81,216,255,0.6)",
    text: "text-[#041226]",
  },
  basic: {
    primary: "from-[#ffd161] to-[#ffb347]",
    secondary: "from-[#d4a944] to-[#b8882f]",
    glow: "rgba(255,177,71,0.6)",
    text: "text-[#3b1800]",
  },
  epic: {
    primary: "from-[#ff4dab] to-[#ff2d95]",
    secondary: "from-[#d43886] to-[#b81f6e]",
    glow: "rgba(255,77,171,0.6)",
    text: "text-white",
  },
  premium: {
    primary: "from-[#c084fc] to-[#a855f7]",
    secondary: "from-[#9d6ac8] to-[#8340c4]",
    glow: "rgba(168,85,247,0.6)",
    text: "text-[#210035]",
  },
  ex: {
    primary: "from-[#36f0b7] to-[#14d08f]",
    secondary: "from-[#2bbf92] to-[#0fa26e]",
    glow: "rgba(20,208,143,0.6)",
    text: "text-[#032617]",
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
      <div className="rounded-3xl border border-white/15 bg-black/30 p-8 shadow-panel-inset">
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">GACHA PANEL</p>
            <h2 className="mt-1 font-display text-2xl text-white">ガチャを始める</h2>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-3 text-center">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            {/* 1連ガチャボタン */}
            <button
              type="button"
              onClick={() => startSession(1)}
              disabled={pending}
              className="group relative overflow-hidden rounded-3xl transition-all active:scale-95 disabled:opacity-60"
            >
              <div className={`absolute inset-0 bg-gradient-to-b ${theme.primary} opacity-90`} />
              <div className={`absolute inset-0 bg-gradient-to-t ${theme.secondary} opacity-50`} />
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/40" />
              <div className={`absolute -inset-1 bg-gradient-to-r ${theme.primary} blur-xl opacity-60 group-hover:opacity-80`} />
              
              <div className="relative flex flex-col items-center justify-center px-6 py-8">
                <div className={`font-display text-5xl font-bold ${theme.text} drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]`}>
                  1
                </div>
                <div className={`mt-1 text-xs uppercase tracking-[0.3em] ${theme.text} opacity-90`}>
                  連
                </div>
                <div className="mt-3 text-[10px] uppercase tracking-[0.35em] text-white/80">
                  SINGLE
                </div>
              </div>
              
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
            </button>

            {/* 5連ガチャボタン */}
            <button
              type="button"
              onClick={() => startSession(5)}
              disabled={pending}
              className="group relative overflow-hidden rounded-3xl transition-all active:scale-95 disabled:opacity-60"
            >
              <div className={`absolute inset-0 bg-gradient-to-b ${theme.primary} opacity-90`} />
              <div className={`absolute inset-0 bg-gradient-to-t ${theme.secondary} opacity-50`} />
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/40" />
              <div className={`absolute -inset-1 bg-gradient-to-r ${theme.primary} blur-xl opacity-60 group-hover:opacity-80`} />
              
              <div className="relative flex flex-col items-center justify-center px-6 py-8">
                <div className={`font-display text-5xl font-bold ${theme.text} drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]`}>
                  5
                </div>
                <div className={`mt-1 text-xs uppercase tracking-[0.3em] ${theme.text} opacity-90`}>
                  連
                </div>
                <div className="mt-3 text-[10px] uppercase tracking-[0.35em] text-white/80">
                  MULTI
                </div>
              </div>
              
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
            </button>

            {/* 10連ガチャボタン */}
            <button
              type="button"
              onClick={() => startSession(10)}
              disabled={pending}
              className="group relative overflow-hidden rounded-3xl transition-all active:scale-95 disabled:opacity-60"
            >
              <div className={`absolute inset-0 bg-gradient-to-b ${theme.primary} opacity-90`} />
              <div className={`absolute inset-0 bg-gradient-to-t ${theme.secondary} opacity-50`} />
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/40" />
              <div className={`absolute -inset-1 bg-gradient-to-r ${theme.primary} blur-xl opacity-60 group-hover:opacity-80`} />
              
              <div className="relative flex flex-col items-center justify-center px-6 py-8">
                <div className={`font-display text-5xl font-bold ${theme.text} drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]`}>
                  10
                </div>
                <div className={`mt-1 text-xs uppercase tracking-[0.3em] ${theme.text} opacity-90`}>
                  連
                </div>
                <div className="mt-3 text-[10px] uppercase tracking-[0.35em] text-white/80">
                  PREMIUM
                </div>
              </div>
              
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
            </button>
          </div>

          <div className="text-center text-xs text-white/50">
            <p>ボタンを押してガチャを開始</p>
          </div>
        </div>
      </div>
    </>
  );
}

export default GachaDetailExperience;

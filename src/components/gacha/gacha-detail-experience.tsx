"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Loader2 } from "lucide-react";
import { MultiGachaSession } from "@/components/gacha/multi-gacha-session";

type Props = {
  gachaId: string;
};

const GACHA_THEME_COLORS: Record<string, {
  outerFrom: string;
  outerVia: string;
  outerTo: string;
  innerFrom: string;
  innerTo: string;
  glowRgb: string;
  shadowColor: string;
  text: string;
}> = {
  free: {
    outerFrom: "#2d9bff",
    outerVia: "#51d8ff",
    outerTo: "#2087d4",
    innerFrom: "#51d8ff",
    innerTo: "#2d9bff",
    glowRgb: "45,155,255",
    shadowColor: "rgba(45,155,255,0.6)",
    text: "text-[#041226]",
  },
  basic: {
    outerFrom: "#ffb347",
    outerVia: "#ffd161",
    outerTo: "#e89f30",
    innerFrom: "#ffd161",
    innerTo: "#ffb347",
    glowRgb: "255,177,71",
    shadowColor: "rgba(255,177,71,0.6)",
    text: "text-[#3b1800]",
  },
  epic: {
    outerFrom: "#ff2d95",
    outerVia: "#ff4dab",
    outerTo: "#d4247a",
    innerFrom: "#ff4dab",
    innerTo: "#ff2d95",
    glowRgb: "255,45,149",
    shadowColor: "rgba(255,45,149,0.6)",
    text: "text-white",
  },
  premium: {
    outerFrom: "#a855f7",
    outerVia: "#c084fc",
    outerTo: "#8b3fce",
    innerFrom: "#c084fc",
    innerTo: "#a855f7",
    glowRgb: "168,85,247",
    shadowColor: "rgba(168,85,247,0.6)",
    text: "text-white",
  },
  ex: {
    outerFrom: "#14d08f",
    outerVia: "#36f0b7",
    outerTo: "#0fa872",
    innerFrom: "#36f0b7",
    innerTo: "#14d08f",
    glowRgb: "20,208,143",
    shadowColor: "rgba(20,208,143,0.6)",
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

          <div className="flex items-center justify-center gap-6">
            {/* 1連ボタン */}
            <button
              type="button"
              onClick={() => startSession(1)}
              disabled={pending}
              className="group relative h-40 w-40 rounded-full transition-all active:scale-95 disabled:opacity-60"
              style={{
                background: `linear-gradient(to bottom, ${theme.outerFrom}, ${theme.outerVia}, ${theme.outerTo})`,
                boxShadow: `0 8px 32px ${theme.shadowColor}, 0 0 80px ${theme.shadowColor}, inset 0 2px 8px rgba(255,255,255,0.3), inset 0 -4px 12px rgba(0,0,0,0.4)`,
              }}
            >
              <div
                className="absolute inset-2 rounded-full"
                style={{
                  background: `linear-gradient(to bottom, ${theme.innerFrom}, ${theme.innerTo})`,
                  boxShadow: 'inset 0 2px 12px rgba(255,255,255,0.4), inset 0 -2px 8px rgba(0,0,0,0.3)',
                }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`relative z-10 font-display text-6xl font-bold ${theme.text} drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]`}>
                  1
                </span>
                <span className={`relative z-10 text-xs tracking-[0.3em] ${theme.text} opacity-90`}>
                  連
                </span>
              </div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-transparent to-white/20" />
              <div
                className="absolute -inset-2 animate-pulse rounded-full blur-xl group-hover:opacity-70"
                style={{ background: `rgba(${theme.glowRgb},0.3)` }}
              />
            </button>

            {/* 5連ボタン */}
            <button
              type="button"
              onClick={() => startSession(5)}
              disabled={pending}
              className="group relative h-40 w-40 rounded-full transition-all active:scale-95 disabled:opacity-60"
              style={{
                background: `linear-gradient(to bottom, ${theme.outerFrom}, ${theme.outerVia}, ${theme.outerTo})`,
                boxShadow: `0 8px 32px ${theme.shadowColor}, 0 0 80px ${theme.shadowColor}, inset 0 2px 8px rgba(255,255,255,0.3), inset 0 -4px 12px rgba(0,0,0,0.4)`,
              }}
            >
              <div
                className="absolute inset-2 rounded-full"
                style={{
                  background: `linear-gradient(to bottom, ${theme.innerFrom}, ${theme.innerTo})`,
                  boxShadow: 'inset 0 2px 12px rgba(255,255,255,0.4), inset 0 -2px 8px rgba(0,0,0,0.3)',
                }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`relative z-10 font-display text-6xl font-bold ${theme.text} drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]`}>
                  5
                </span>
                <span className={`relative z-10 text-xs tracking-[0.3em] ${theme.text} opacity-90`}>
                  連
                </span>
              </div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-transparent to-white/20" />
              <div
                className="absolute -inset-2 animate-pulse rounded-full blur-xl group-hover:opacity-70"
                style={{ background: `rgba(${theme.glowRgb},0.3)` }}
              />
            </button>

            {/* 10連ボタン */}
            <button
              type="button"
              onClick={() => startSession(10)}
              disabled={pending}
              className="group relative h-40 w-40 rounded-full transition-all active:scale-95 disabled:opacity-60"
              style={{
                background: `linear-gradient(to bottom, ${theme.outerFrom}, ${theme.outerVia}, ${theme.outerTo})`,
                boxShadow: `0 8px 32px ${theme.shadowColor}, 0 0 80px ${theme.shadowColor}, inset 0 2px 8px rgba(255,255,255,0.3), inset 0 -4px 12px rgba(0,0,0,0.4)`,
              }}
            >
              <div
                className="absolute inset-2 rounded-full"
                style={{
                  background: `linear-gradient(to bottom, ${theme.innerFrom}, ${theme.innerTo})`,
                  boxShadow: 'inset 0 2px 12px rgba(255,255,255,0.4), inset 0 -2px 8px rgba(0,0,0,0.3)',
                }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`relative z-10 font-display text-6xl font-bold ${theme.text} drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]`}>
                  10
                </span>
                <span className={`relative z-10 text-xs tracking-[0.3em] ${theme.text} opacity-90`}>
                  連
                </span>
              </div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-transparent to-white/20" />
              <div
                className="absolute -inset-2 animate-pulse rounded-full blur-xl group-hover:opacity-70"
                style={{ background: `rgba(${theme.glowRgb},0.3)` }}
              />
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

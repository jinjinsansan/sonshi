"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Scenario, VideoSequenceItem } from "@/lib/gacha/v3/types";
import { getVideoPathV3 } from "@/lib/gacha/v3/utils";

type Status = "idle" | "loading" | "playing" | "result" | "error";

type Props = {
  playLabel?: string;
  playClassName?: string;
};

const DEFAULT_PLAY_CLASS =
  "w-full max-w-md rounded-[14px] border border-[#f1f3f5] bg-gradient-to-b from-[#fefefe] via-[#d8dce4] to-[#aab0bc] " +
  "px-8 py-4 text-base font-bold tracking-[0.08em] text-[#1a2230] shadow-[0_14px_30px_rgba(0,0,0,0.28),inset_0_2px_0_rgba(255,255,255,0.85),inset_0_-3px_0_rgba(0,0,0,0.2)] " +
  "transition hover:brightness-105 active:translate-y-0.5 disabled:opacity-60";

type GachaPlayResponse = { success: true; gacha_id: string; scenario: Scenario };

export function GachaV3Player({ playLabel = "ガチャを回す", playClassName }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [canAdvance, setCanAdvance] = useState(false);
  const [isAuto, setIsAuto] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isAutoRef = useRef(false);

  const currentVideo: VideoSequenceItem | null = useMemo(() => {
    if (!scenario) return null;
    return scenario.video_sequence[currentIndex] ?? null;
  }, [scenario, currentIndex]);

  const start = useCallback(async () => {
    setStatus("loading");
    setError(null);
    setScenario(null);
    setCurrentIndex(0);
    setCanAdvance(false);
    setIsAuto(false);
    isAutoRef.current = false;
    try {
      const res = await fetch("/api/gacha/v3/play", { method: "POST" });
      const data = (await res.json()) as GachaPlayResponse | { error?: string };
      if (!res.ok || "error" in data) throw new Error((data as { error?: string }).error ?? "start failed");

      const v3 = (data as GachaPlayResponse).scenario;
      setScenario(v3);
      setStatus("playing");
      setCurrentIndex(0);
      setCanAdvance(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "開始に失敗しました");
      setStatus("error");
    }
  }, []);

  const handleNext = useCallback(() => {
    if (!scenario || !canAdvance) return;
    setCanAdvance(false);
    const next = currentIndex + 1;
    if (next < scenario.video_sequence.length) {
      setCurrentIndex(next);
      const node = videoRef.current;
      if (node) {
        node.load();
        void node.play();
      }
    } else {
      setStatus("result");
    }
  }, [canAdvance, currentIndex, scenario]);

  const handleEnded = useCallback(() => {
    if (!scenario) return;
    if (isAutoRef.current) {
      setTimeout(() => {
        setCurrentIndex((prev) => {
          const next = prev + 1;
          if (next < scenario.video_sequence.length) {
            const node = videoRef.current;
            if (node) {
              setTimeout(() => {
                node.load();
                void node.play();
              }, 0);
            }
          } else {
            setStatus("result");
          }
          return next;
        });
      }, 300);
    } else {
      setCanAdvance(true);
    }
  }, [scenario]);

  const handleSkip = useCallback(() => {
    if (!scenario) return;
    setStatus("result");
    setCanAdvance(false);
  }, [scenario]);

  // isAuto反映
  useEffect(() => {
    isAutoRef.current = isAuto;
  }, [isAuto]);

  // ESCで閉じる
  useEffect(() => {
    if (status !== "playing") return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setStatus("idle");
        setScenario(null);
        setCurrentIndex(0);
        setIsAuto(false);
        isAutoRef.current = false;
      }
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [status]);

  // 全画面オーバーレイ中はスクロール抑制＆nav非表示（V2同様）
  useEffect(() => {
    if (status === "playing") {
      document.body.style.overflow = "hidden";
      const tabBar = document.querySelector("nav") as HTMLElement | null;
      if (tabBar) tabBar.style.display = "none";
    } else {
      document.body.style.overflow = "";
      const tabBar = document.querySelector("nav") as HTMLElement | null;
      if (tabBar) tabBar.style.display = "";
      isAutoRef.current = false;
    }
  }, [status]);

  const total = scenario?.video_sequence.length ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <button
          type="button"
          onClick={start}
          disabled={status === "loading" || status === "playing"}
          className={playClassName ?? DEFAULT_PLAY_CLASS}
        >
          {status === "playing" ? "再生中" : playLabel}
        </button>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {status === "playing" && currentVideo && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black">
          <video
            key={currentVideo.video_id}
            ref={videoRef}
            src={getVideoPathV3(currentVideo.filename)}
            className="h-full w-full object-contain"
            playsInline
            autoPlay
            controls={false}
            onPlay={() => {
              if (!isAutoRef.current) setCanAdvance(true);
            }}
            onEnded={handleEnded}
            onError={handleEnded}
          />

          <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-12">
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={handleNext}
                disabled={!canAdvance || isAuto}
                className="pointer-events-auto group relative h-32 w-32 rounded-full bg-gradient-to-b from-red-500 via-red-600 to-red-700 shadow-[0_8px_32px_rgba(220,38,38,0.6),0_0_80px_rgba(220,38,38,0.4),inset_0_2px_8px_rgba(255,255,255,0.3),inset_0_-4px_12px_rgba(0,0,0,0.4)] transition-all hover:shadow-[0_8px_40px_rgba(220,38,38,0.8),0_0_100px_rgba(220,38,38,0.6)] active:scale-95 disabled:opacity-50"
              >
                <div className="absolute inset-2 rounded-full bg-gradient-to-b from-red-400 to-red-600 shadow-[inset_0_2px_12px_rgba(255,255,255,0.4),inset_0_-2px_8px_rgba(0,0,0,0.3)]" />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="relative z-10 font-display text-2xl font-bold uppercase tracking-[0.2em] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                    {currentIndex === total - 1 ? "結果" : "NEXT"}
                  </span>
                  <span className="relative z-10 mt-1 text-[10px] uppercase tracking-[0.3em] text-white/80">
                    {currentIndex === total - 1 ? "Result" : "次へ"}
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsAuto(!isAuto)}
                className={`pointer-events-auto group relative h-32 w-32 rounded-full transition-all active:scale-95 ${
                  isAuto
                    ? "bg-gradient-to-b from-yellow-400 via-yellow-500 to-yellow-600 shadow-[0_8px_32px_rgba(234,179,8,0.7),0_0_80px_rgba(234,179,8,0.5),inset_0_2px_8px_rgba(255,255,255,0.4),inset_0_-4px_12px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_40px_rgba(234,179,8,0.9),0_0_100px_rgba(234,179,8,0.7)]"
                    : "bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-900 shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_60px_rgba(0,0,0,0.4),inset_0_2px_8px_rgba(255,255,255,0.2),inset_0_-4px_12px_rgba(0,0,0,0.5)] hover:shadow-[0_8px_40px_rgba(0,0,0,0.8),0_0_80px_rgba(0,0,0,0.6)]"
                }`}
              >
                <div
                  className={`absolute inset-2 rounded-full shadow-[inset_0_2px_12px_rgba(255,255,255,0.4),inset_0_-2px_8px_rgba(0,0,0,0.3)] ${
                    isAuto
                      ? "bg-gradient-to-b from-yellow-300 to-yellow-500"
                      : "bg-gradient-to-b from-zinc-600 to-zinc-800"
                  }`}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="relative z-10 font-display text-2xl font-bold uppercase tracking-[0.2em] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                    AUTO
                  </span>
                  <span className="relative z-10 mt-1 text-[10px] uppercase tracking-[0.3em] text-white/80">
                    {isAuto ? "ON" : "OFF"}
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={handleSkip}
                className="pointer-events-auto group relative h-32 w-32 rounded-full bg-gradient-to-b from-zinc-800 via-zinc-900 to-black shadow-[0_8px_32px_rgba(0,0,0,0.8),0_0_80px_rgba(0,0,0,0.6),inset_0_2px_8px_rgba(255,255,255,0.2),inset_0_-4px_12px_rgba(0,0,0,0.6)] transition-all hover:shadow-[0_8px_40px_rgba(0,0,0,0.9),0_0_100px_rgba(0,0,0,0.7)] active:scale-95"
              >
                <div className="absolute inset-2 rounded-full bg-gradient-to-b from-zinc-700 to-zinc-900 shadow-[inset_0_2px_12px_rgba(255,255,255,0.3),inset_0_-2px_8px_rgba(0,0,0,0.5)]" />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="relative z-10 font-display text-2xl font-bold uppercase tracking-[0.2em] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                    SKIP
                  </span>
                  <span className="relative z-10 mt-1 text-[10px] uppercase tracking-[0.3em] text-white/80">
                    スキップ
                  </span>
                </div>
              </button>
            </div>
          </div>

          <div className="absolute left-4 top-4 rounded-full bg-black/70 px-4 py-2 text-sm uppercase tracking-[0.3em] text-white/90 shadow-lg">
            {currentIndex + 1} / {total}
          </div>

          <button
            type="button"
            onClick={() => {
              setStatus("idle");
              setScenario(null);
              setCurrentIndex(0);
              setIsAuto(false);
              isAutoRef.current = false;
            }}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white/90 shadow-lg transition hover:bg-black/90 hover:text-white"
            title="閉じる (ESC)"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {status === "result" && scenario && (
        <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-neon-yellow">Result</p>
          <p className="text-lg font-display text-white">★{scenario.star}</p>
          <p className="text-sm text-white/80">カード {scenario.card_count} 枚</p>
          <button
            type="button"
            onClick={() => setStatus("idle")}
            className="mt-2 rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white"
          >
            もう一度
          </button>
        </div>
      )}
    </div>
  );
}

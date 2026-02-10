"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { StoryPlay, StorySequenceItem } from "@/lib/gacha/v4/types";
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

type GachaPlayResponse = { success: true; gacha_id: string; story: StoryPlay };

export function GachaV4Player({ playLabel = "ガチャを回す", playClassName }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [story, setStory] = useState<StoryPlay | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [canAdvance, setCanAdvance] = useState(false);
  const [isAuto, setIsAuto] = useState(false);
  const [isSkip, setIsSkip] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isAutoRef = useRef(false);

  const currentVideo: StorySequenceItem | null = useMemo(() => {
    if (!story) return null;
    return story.video_sequence[currentIndex] ?? null;
  }, [story, currentIndex]);

  const start = useCallback(async () => {
    setStatus("loading");
    setError(null);
    setStory(null);
    setCurrentIndex(0);
    setCanAdvance(false);
    setIsAuto(false);
    setIsSkip(false);
    isAutoRef.current = false;
    try {
      const res = await fetch("/api/gacha/v4/play", { method: "POST" });
      const data = (await res.json()) as GachaPlayResponse | { error?: string };
      if (!res.ok || "error" in data) throw new Error((data as { error?: string }).error ?? "start failed");

      const storyRes = (data as GachaPlayResponse).story;
      setStory(storyRes);
      setStatus("playing");
      setCurrentIndex(0);
      setCanAdvance(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "開始に失敗しました");
      setStatus("error");
    }
  }, []);

  const advance = useCallback(() => {
    if (!story) return;
    setCanAdvance(false);
    const next = currentIndex + 1;
    if (next < story.video_sequence.length) {
      setCurrentIndex(next);
      const node = videoRef.current;
      if (node) {
        node.load();
        void node.play();
      }
      return;
    }
    setStatus("result");
  }, [currentIndex, story]);

  const handleEnded = useCallback(() => {
    if (!story) return;
    if (isSkip) {
      setStatus("result");
      return;
    }

    if (isAutoRef.current) {
      setTimeout(() => advance(), 120);
    } else {
      setCanAdvance(true);
    }
  }, [advance, isSkip, story]);

  const handleSkip = useCallback(() => {
    if (!story) return;
    setIsSkip(true);
    setCanAdvance(false);
    setStatus("result");
  }, [story]);

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
        setStory(null);
        setCurrentIndex(0);
        setIsAuto(false);
        isAutoRef.current = false;
      }
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [status]);

  // 全画面中はスクロール抑制＆nav非表示
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

          {/* Footer buttons (no counter) */}
          <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-12">
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={advance}
                disabled={!canAdvance || isAuto}
                className="pointer-events-auto group relative h-32 w-32 rounded-full bg-gradient-to-b from-red-500 via-red-600 to-red-700 shadow-[0_8px_32px_rgba(220,38,38,0.6),0_0_80px_rgba(220,38,38,0.4),inset_0_2px_8px_rgba(255,255,255,0.3),inset_0_-4px_12px_rgba(0,0,0,0.4)] transition-all hover:shadow-[0_8px_40px_rgba(220,38,38,0.8),0_0_100px_rgba(220,38,38,0.6)] active:scale-95 disabled:opacity-50"
              >
                <div className="absolute inset-2 rounded-full bg-gradient-to-b from-red-400 to-red-600 shadow-[inset_0_2px_12px_rgba(255,255,255,0.4),inset_0_-2px_8px_rgba(0,0,0,0.3)]" />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="relative z-10 font-display text-2xl font-bold uppercase tracking-[0.2em] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                    NEXT
                  </span>
                  <span className="relative z-10 mt-1 text-[10px] uppercase tracking-[0.3em] text-white/80">次へ</span>
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
                  <span className="relative z-10 mt-1 text-[10px] uppercase tracking-[0.3em] text-white/80">{isAuto ? "ON" : "OFF"}</span>
                </div>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSkip}
            className="absolute right-4 top-4 z-[130] flex h-12 items-center gap-2 rounded-full bg-black/80 px-4 text-sm font-semibold uppercase tracking-[0.2em] text-white shadow-lg transition hover:bg-black"
          >
            SKIP
          </button>
        </div>
      )}

      {status === "result" && story && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black">
          <ResultTelop result={story.result} hasChase={story.has_chase} />
          <button
            type="button"
            onClick={() => setStatus("idle")}
            className="absolute bottom-10 rounded-full border border-white/30 bg-white/10 px-6 py-3 text-xs uppercase tracking-[0.3em] text-white shadow-lg"
          >
            もう一度
          </button>
        </div>
      )}
    </div>
  );
}

type TelopProps = { result: StoryPlay["result"]; hasChase: boolean };

function ResultTelop({ result, hasChase }: TelopProps) {
  let bg = "from-black via-gray-900 to-black";
  let main = "ハズレ";
  let sub = "残念...";
  let duration = 3000;
  let mainClass = "text-red-400";

  if (result === "small_win" || result === "win") {
    bg = "from-indigo-900 via-purple-800 to-blue-800";
    main = "当たり！";
    sub = "おめでとう！";
    mainClass = "text-amber-200";
    duration = 4000;
  }
  if (result === "big_win") {
    bg = "from-amber-500 via-orange-500 to-amber-700";
    main = "大当たり！！";
    sub = "凄いっす！！";
    mainClass = "text-amber-100";
    duration = 5000;
  }
  if (result === "jackpot") {
    bg = "from-pink-500 via-purple-500 to-emerald-400";
    main = "超大当たり！！！";
    sub = "伝説降臨！！！";
    mainClass = "bg-gradient-to-r from-red-200 via-yellow-200 to-blue-200 bg-clip-text text-transparent";
    duration = 6000;
  }
  if (hasChase && (result === "big_win" || result === "jackpot")) {
    // for chase state heading into TS01
    bg = "from-purple-800 via-amber-600 to-yellow-500";
    main = "追撃チャンス！";
    sub = "まだ終わらない...";
    mainClass = "text-amber-200";
    duration = 3000;
  }

  useEffect(() => {
    const t = setTimeout(() => {
      // auto close handled by parent via state reset
    }, duration);
    return () => clearTimeout(t);
  }, [duration]);

  return (
    <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${bg} animate-[pulse_2s_ease-in-out_infinite]`}>
      <div className="text-center drop-shadow-[0_8px_24px_rgba(0,0,0,0.8)]">
        <div className={`text-6xl font-black tracking-[0.08em] sm:text-7xl md:text-8xl ${mainClass}`}>
          {main}
        </div>
        <div className="mt-4 text-xl font-semibold text-white/90">{sub}</div>
      </div>
    </div>
  );
}

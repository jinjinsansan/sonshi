"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type ScenarioResponse = {
  gacha_id: string;
  star: number;
  scenario: { videos: string[] };
};

type VideoEntry = { id: string; url: string; duration: number | null };

type ResultResponse = {
  star: number;
  cards: { id?: string; name?: string; star?: number; serial_number?: number; image_url?: string | null }[];
  card_count: number;
};

type Status = "idle" | "loading" | "playing" | "result" | "error";

type Props = {
  playLabel?: string;
  playClassName?: string;
};

const DEFAULT_PLAY_CLASS =
  "w-full max-w-md rounded-[14px] border border-[#f1f3f5] bg-gradient-to-b from-[#fefefe] via-[#d8dce4] to-[#aab0bc] " +
  "px-8 py-4 text-base font-bold tracking-[0.08em] text-[#1a2230] shadow-[0_14px_30px_rgba(0,0,0,0.28),inset_0_2px_0_rgba(255,255,255,0.85),inset_0_-3px_0_rgba(0,0,0,0.2)] " +
  "transition hover:brightness-105 active:translate-y-0.5 disabled:opacity-60";

export function GachaV2Player({ playLabel = "ガチャを回す", playClassName }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [gachaId, setGachaId] = useState<string | null>(null);
  const [videos, setVideos] = useState<VideoEntry[]>([]);
  const [current, setCurrent] = useState(0);
  const [result, setResult] = useState<ResultResponse | null>(null);
  const [canAdvance, setCanAdvance] = useState(false);
  const [isAuto, setIsAuto] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const start = useCallback(async () => {
    setStatus("loading");
    setError(null);
    setResult(null);
    setCurrent(0);
    setCanAdvance(false);
    setIsAuto(false);
    try {
      const res = await fetch("/api/gacha/play", { method: "POST" });
      const data = (await res.json()) as ScenarioResponse | { error?: string };
      if (!res.ok || "error" in data) throw new Error((data as { error?: string }).error ?? "start failed");

      const id = (data as ScenarioResponse).gacha_id;
      setGachaId(id);

      const videosRes = await fetch(`/api/gacha/${id}/videos`);
      const videosData = (await videosRes.json()) as { videos?: VideoEntry[]; error?: string };
      if (!videosRes.ok || videosData.error) throw new Error(videosData.error ?? "videos failed");

      setVideos(videosData.videos ?? []);
      setStatus("playing");
      setCurrent(0);
      setCanAdvance(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "開始に失敗しました");
      setStatus("error");
    }
  }, []);

  const fetchResult = useCallback(async (id: string) => {
    const res = await fetch(`/api/gacha/${id}/result`);
    const data = (await res.json()) as ResultResponse | { error?: string };
    if (!res.ok || "error" in data) throw new Error((data as { error?: string }).error ?? "result failed");
    setResult(data as ResultResponse);
    setStatus("result");
  }, []);

  const handleSkip = useCallback(async () => {
    if (!gachaId) return;
    try {
      await fetch(`/api/gacha/${gachaId}/skip`, { method: "POST" });
      await fetchResult(gachaId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "スキップに失敗しました");
      setStatus("error");
    }
  }, [fetchResult, gachaId]);

  const handleEnded = useCallback(() => {
    if (!gachaId) return;
    
    // AUTOモードの場合は自動的に次へ進む
    if (isAuto) {
      setTimeout(() => {
        const next = current + 1;
        if (next < videos.length) {
          setCurrent(next);
          // AUTOモード時はcanAdvanceを操作しない（次の動画終了時に再度判定）
          const node = videoRef.current;
          if (node) {
            node.load();
            void node.play();
          }
        } else {
          // 最後のコマまで到達したら結果を取得
          fetchResult(gachaId).catch((err) => {
            setError(err instanceof Error ? err.message : "結果取得に失敗しました");
            setStatus("error");
          });
        }
      }, 500); // AUTO時は少し間を置いてから次へ
    } else {
      // 手動モードの場合のみcanAdvanceをtrueにする
      setCanAdvance(true);
    }
  }, [gachaId, isAuto, current, videos.length, fetchResult]);

  const handleNext = useCallback(async () => {
    if (!gachaId || !canAdvance) return;

    setCanAdvance(false); // 即座にリセット

    const next = current + 1;
    if (next < videos.length) {
      setCurrent(next);
      const node = videoRef.current;
      if (node) {
        node.load();
        void node.play();
      }
      return;
    }

    try {
      await fetchResult(gachaId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "結果取得に失敗しました");
      setStatus("error");
    }
  }, [canAdvance, current, fetchResult, gachaId, videos.length]);

  const currentVideo = useMemo(() => videos[current], [videos, current]);

  // 次の2-3本を先読みして切り替えラグを減らす
  useEffect(() => {
    if (status !== "playing") return;
    const links: HTMLLinkElement[] = [];
    videos.slice(current, current + 3).forEach((entry) => {
      if (!entry?.url) return;
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "video";
      link.href = entry.url;
      document.head.appendChild(link);
      links.push(link);
    });
    return () => {
      links.forEach((l) => document.head.removeChild(l));
    };
  }, [current, status, videos]);

  // ESCキーで全画面モードから抜ける
  useEffect(() => {
    if (status !== "playing") return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setStatus("idle");
        setCurrent(0);
        setGachaId(null);
        setVideos([]);
        setIsAuto(false);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [status]);

  // ガチャ再生中はフッターメニューを非表示にする
  useEffect(() => {
    if (status === "playing") {
      // フッターメニューを非表示
      document.body.style.overflow = "hidden";
      const tabBar = document.querySelector("nav") as HTMLElement;
      if (tabBar) {
        tabBar.style.display = "none";
      }
    } else {
      // 元に戻す
      document.body.style.overflow = "";
      const tabBar = document.querySelector("nav") as HTMLElement;
      if (tabBar) {
        tabBar.style.display = "";
      }
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
            key={currentVideo.id}
            ref={videoRef}
            src={currentVideo.url}
            className="h-full w-full object-contain"
            playsInline
            autoPlay
            controls={false}
            onPlay={() => {
              // 動画が再生開始されたらNEXTボタンを押せるようにする（AUTOモード時を除く）
              if (!isAuto) {
                setCanAdvance(true);
              }
            }}
            onEnded={handleEnded}
            onError={handleEnded}
          />
          
          <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-12">
            <div className="flex items-center gap-6">
              {/* NEXTボタン */}
              <button
                type="button"
                onClick={handleNext}
                disabled={!canAdvance || isAuto}
                className="pointer-events-auto group relative h-32 w-32 rounded-full bg-gradient-to-b from-red-500 via-red-600 to-red-700 shadow-[0_8px_32px_rgba(220,38,38,0.6),0_0_80px_rgba(220,38,38,0.4),inset_0_2px_8px_rgba(255,255,255,0.3),inset_0_-4px_12px_rgba(0,0,0,0.4)] transition-all hover:shadow-[0_8px_40px_rgba(220,38,38,0.8),0_0_100px_rgba(220,38,38,0.6)] active:scale-95 disabled:opacity-50"
              >
                <div className="absolute inset-2 rounded-full bg-gradient-to-b from-red-400 to-red-600 shadow-[inset_0_2px_12px_rgba(255,255,255,0.4),inset_0_-2px_8px_rgba(0,0,0,0.3)]" />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="relative z-10 font-display text-2xl font-bold uppercase tracking-[0.2em] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                    {current === videos.length - 1 ? "結果" : "NEXT"}
                  </span>
                  <span className="relative z-10 mt-1 text-[10px] uppercase tracking-[0.3em] text-white/80">
                    {current === videos.length - 1 ? "Result" : "次へ"}
                  </span>
                </div>
              </button>

              {/* AUTOボタン */}
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

              {/* SKIPボタン */}
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
            {current + 1} / {videos.length}
          </div>

          <button
            type="button"
            onClick={() => {
              setStatus("idle");
              setCurrent(0);
              setGachaId(null);
              setVideos([]);
              setIsAuto(false);
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

      {status === "result" && result && (
        <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-neon-yellow">Result</p>
          <p className="text-lg font-display text-white">★{result.star}</p>
          <p className="text-sm text-white/80">カード {result.card_count} 枚</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(result.cards ?? []).map((card, idx) => (
              <div key={card.id ?? idx} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-white">{card.name ?? "カード"}</p>
                <p className="text-sm text-white/70">★{card.star ?? result.star}</p>
                {card.serial_number != null && (
                  <p className="text-[11px] text-white/60">No. {card.serial_number}</p>
                )}
              </div>
            ))}
          </div>
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

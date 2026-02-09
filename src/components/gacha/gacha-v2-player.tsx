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
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const start = useCallback(async () => {
    setStatus("loading");
    setError(null);
    setResult(null);
    setCurrent(0);
    setCanAdvance(false);
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
    setCanAdvance(true);
  }, [gachaId]);

  const handleLoaded = useCallback(() => {
    setCanAdvance(true);
  }, []);

  const handleNext = useCallback(async () => {
    if (!gachaId || !canAdvance) return;

    const next = current + 1;
    if (next < videos.length) {
      setCurrent(next);
      setCanAdvance(false);
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
        {status === "playing" && (
          <button
            type="button"
            onClick={handleSkip}
            className="text-[11px] uppercase tracking-[0.28em] text-white/80 underline-offset-4 hover:text-white"
          >
            Skip
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {status === "playing" && currentVideo && (
        <div className="space-y-3 rounded-2xl border border-white/10 bg-black/60 p-3">
          <div className="relative w-full overflow-hidden rounded-xl bg-black">
            <video
              key={currentVideo.id}
              ref={videoRef}
              src={currentVideo.url}
              className="h-[70vh] w-full object-contain"
              playsInline
              autoPlay
              controls={false}
              onLoadedData={handleLoaded}
              onEnded={handleEnded}
              onError={handleEnded}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-white/70">
            <span>
              {current + 1} / {videos.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleNext}
                disabled={!canAdvance}
                className="rounded-full bg-gradient-to-b from-[#ff6b6b] to-[#d91c1c] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.35em] text-white shadow-[0_10px_25px_rgba(217,28,28,0.45)] disabled:opacity-50"
              >
                {current === videos.length - 1 ? "結果へ" : "NEXT"}
              </button>
              <button
                type="button"
                onClick={handleSkip}
                className="rounded-full border border-white/40 bg-black px-4 py-2 text-[11px] uppercase tracking-[0.3em] text-white hover:bg-white/10"
              >
                SKIP
              </button>
            </div>
          </div>
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

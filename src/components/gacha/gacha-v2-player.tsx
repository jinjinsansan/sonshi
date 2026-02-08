"use client";

import { useCallback, useMemo, useRef, useState } from "react";

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

export function GachaV2Player() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [gachaId, setGachaId] = useState<string | null>(null);
  const [videos, setVideos] = useState<VideoEntry[]>([]);
  const [current, setCurrent] = useState(0);
  const [result, setResult] = useState<ResultResponse | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const start = useCallback(async () => {
    setStatus("loading");
    setError(null);
    setResult(null);
    setCurrent(0);
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

  const handleEnded = useCallback(async () => {
    if (!gachaId) return;
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
  }, [current, fetchResult, gachaId, videos.length]);

  const currentVideo = useMemo(() => videos[current], [videos, current]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={start}
          disabled={status === "loading" || status === "playing"}
          className="rounded-full bg-gradient-to-r from-neon-pink to-neon-yellow px-5 py-2 text-sm font-semibold text-black shadow-neon disabled:opacity-50"
        >
          {status === "playing" ? "再生中" : "PLAY"}
        </button>
        {status === "playing" && (
          <button
            type="button"
            onClick={handleSkip}
            className="rounded-full border border-white/30 px-4 py-2 text-xs uppercase tracking-[0.25em] text-white"
          >
            Skip
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {status === "playing" && currentVideo && (
        <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
          <video
            key={currentVideo.id}
            ref={videoRef}
            src={currentVideo.url}
            className="w-full rounded-xl bg-black"
            playsInline
            autoPlay
            controls={false}
            onEnded={handleEnded}
            onError={handleEnded}
          />
          <p className="mt-2 text-xs text-white/70">
            {current + 1} / {videos.length}
          </p>
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

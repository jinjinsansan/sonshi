"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Play } from "lucide-react";
import type { HeatLevel, Phase } from "@/lib/gacha/scenario";

type ScenarioStep = {
  index: number;
  phase: Phase;
  heat: HeatLevel;
  rarity: string;
  videoKey: string;
  videoUrl?: string | null;
  durationSeconds: number;
};

type DrawResult = {
  cardId: string;
  name: string;
  rarity: string;
  imageUrl?: string | null;
  serialNumber?: number | null;
};

type SessionResponse = {
  sessionId: string;
  totalPulls: number;
  currentPull: number;
  status: string;
  scenario: ScenarioStep[];
  results: DrawResult[];
};

type NextResponse = {
  currentPull: number;
  totalPulls: number;
  status: string;
  result: DrawResult | null;
  scenario: ScenarioStep | null;
  done: boolean;
  error?: string;
};

const RARITY_LABELS: Record<string, string> = {
  N: "N",
  R: "R",
  SR: "SR",
  SSR: "SSR",
  UR: "UR",
};

const RARITY_RANK: Record<string, number> = {
  N: 1,
  R: 2,
  SR: 3,
  SSR: 4,
  UR: 5,
};

const RARITY_COLOR: Record<string, string> = {
  N: "border-white/15 text-white",
  R: "border-neon-blue/60 text-neon-blue",
  SR: "border-purple-400/70 text-purple-200",
  SSR: "border-amber-300/70 text-amber-200",
  UR: "border-white/30 text-white bg-gradient-to-r from-neon-pink/15 to-neon-yellow/15",
};

type Props = {
  sessionId: string;
};

export function MultiGachaSession({ sessionId }: Props) {
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [revealed, setRevealed] = useState<DrawResult[]>([]);
  const [activeStep, setActiveStep] = useState<ScenarioStep | null>(null);
  const [queuedResult, setQueuedResult] = useState<DrawResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [canAdvance, setCanAdvance] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  const prefetchCache = useRef(new Set<string>());
  const preconnectCache = useRef(new Set<string>());
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch(`/api/gacha/multi/${sessionId}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "取得に失敗しました");
        return data as SessionResponse;
      })
      .then((data) => {
        if (!mounted) return;
        setSession(data);
        const current = data.currentPull ?? 0;
        setRevealed(data.results.slice(0, current));
        setShowSummary(data.status === "completed" || current >= data.totalPulls);
      })
      .catch((err: Error) => {
        if (mounted) setError(err.message);
      });

    return () => {
      mounted = false;
    };
  }, [sessionId]);

  const totalPulls = session?.totalPulls ?? 0;
  const completedCount = revealed.length;
  const isCompleted = showSummary || completedCount >= totalPulls;

  const activeIndex = activeStep?.index ?? null;

  useEffect(() => {
    return () => {
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!session?.scenario || session.scenario.length === 0) return;
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (connection?.saveData) return;

    const currentIndex = Math.max(0, (activeIndex ?? completedCount) - 1);
    const endIndex = Math.min(session.scenario.length, currentIndex + 3);

    session.scenario.slice(currentIndex, endIndex).forEach((step) => {
      if (!step.videoUrl) return;
      if (!prefetchCache.current.has(step.videoUrl)) {
        const link = document.createElement("link");
        link.rel = "preload";
        link.as = "video";
        link.href = step.videoUrl;
        link.type = "video/mp4";
        link.crossOrigin = "anonymous";
        document.head.appendChild(link);
        prefetchCache.current.add(step.videoUrl);
      }

      try {
        const origin = new URL(step.videoUrl).origin;
        if (!preconnectCache.current.has(origin)) {
          const link = document.createElement("link");
          link.rel = "preconnect";
          link.href = origin;
          link.crossOrigin = "anonymous";
          document.head.appendChild(link);
          preconnectCache.current.add(origin);
        }
      } catch {
        // ignore invalid URLs
      }
    });
  }, [activeIndex, completedCount, session?.scenario]);

  const progressDots = useMemo(() => {
    return Array.from({ length: totalPulls }).map((_, index) => {
      const position = index + 1;
      let state = "bg-white/10";
      if (position <= completedCount) state = "bg-neon-blue";
      if (position === activeIndex) state = "bg-neon-yellow animate-pulse";
      return <span key={position} className={`h-2 w-2 rounded-full transition ${state}`} />;
    });
  }, [activeIndex, completedCount, totalPulls]);

  const handleStepEnd = useCallback(
    (force = false) => {
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }

      if (!activeStep && !force) return;

      setIsPlaying(false);
      setCanAdvance(true);

      if (queuedResult && activeStep) {
        setRevealed((prev) => {
          const next = [...prev];
          next[activeStep.index - 1] = queuedResult;
          return next;
        });
      }

      setQueuedResult(null);

      const finished = (activeStep?.index ?? completedCount) >= totalPulls;
      if (finished) {
        setShowSummary(true);
        setSession((prev) => (prev ? { ...prev, status: "completed", currentPull: totalPulls } : prev));
      }
    },
    [activeStep, completedCount, queuedResult, totalPulls]
  );

  const handleNext = async () => {
    if (!session || pending || isPlaying || isCompleted) return;
    setError(null);
    setPending(true);
    setCanAdvance(false);
    try {
      const response = await fetch(`/api/gacha/multi/${sessionId}/next`, { method: "POST" });
      const data: NextResponse = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error ?? "取得に失敗しました");
      }

      setSession((prev) => (prev ? { ...prev, currentPull: data.currentPull, status: data.status } : prev));
      setActiveStep(data.scenario ?? null);
      setQueuedResult(data.result ?? null);

      // フォールバック（動画の再生イベントが来ない場合も進行させる）
      const durationMs = Math.max((data.scenario?.durationSeconds ?? 8) * 1000, 3000);
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = setTimeout(() => handleStepEnd(true), durationMs);

      if (data.scenario?.videoUrl) {
        setIsPlaying(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "予期せぬエラーが発生しました");
      setCanAdvance(true);
    } finally {
      setPending(false);
    }
  };

  const bestCard = useMemo(() => {
    const source = showSummary ? session?.results ?? [] : revealed;
    if (!source.length) return null;
    return [...source].reduce((prev, curr) => {
      const prevRank = RARITY_RANK[prev.rarity] ?? 0;
      const currRank = RARITY_RANK[curr.rarity] ?? 0;
      if (currRank > prevRank) return curr;
      if (currRank === prevRank) return curr; // 後着優先
      return prev;
    });
  }, [revealed, session?.results, showSummary]);

  const rarityCounts = useMemo(() => {
    const source = showSummary ? session?.results ?? [] : revealed;
    return source.reduce<Record<string, number>>((acc, item) => {
      acc[item.rarity] = (acc[item.rarity] ?? 0) + 1;
      return acc;
    }, {});
  }, [revealed, session?.results, showSummary]);

  if (error) {
    return <p className="text-sm text-red-400">{error}</p>;
  }

  if (!session) {
    return <p className="text-sm text-zinc-400">ロード中...</p>;
  }

  const displayResults = showSummary ? session.results : revealed;
  const buttonDisabled = pending || isPlaying || isCompleted;
  const buttonLabel = isCompleted ? "完了" : session.currentPull === 0 ? "START" : isPlaying ? "再生中" : "NEXT";
  const statusLabel = isPlaying ? "映像再生中..." : isCompleted ? "演出完了" : "ボタンを押して次へ";

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-hall-panel/80 p-6 shadow-panel-inset">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.4em] text-neon-blue">
            {Math.min(session.currentPull, totalPulls)}/{totalPulls}
          </p>
          <div className="flex items-center gap-2">{progressDots}</div>
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-zinc-300">
          {activeStep?.videoUrl ? (
            <video
              key={activeStep.videoUrl}
              src={activeStep.videoUrl}
              preload="auto"
              autoPlay
              muted
              playsInline
              controls={false}
              onEnded={() => handleStepEnd()}
              onError={() => handleStepEnd(true)}
              className="h-60 w-full rounded-xl object-cover shadow-lg"
            />
          ) : (
            <div className="flex h-60 flex-col items-center justify-center gap-2 rounded-xl bg-black/40 text-center text-xs uppercase tracking-[0.4em] text-zinc-400">
              <Play className="h-6 w-6 text-neon-yellow" />
              {activeStep ? activeStep.videoKey : "READY"}
            </div>
          )}
          {activeStep && (
            <div className="mt-3 flex items-center justify-between text-[11px] uppercase tracking-[0.35em] text-zinc-400">
              <span>
                {activeStep.phase} / {activeStep.heat}
              </span>
              <span>{activeStep.durationSeconds}s</span>
            </div>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <p className="text-xs text-zinc-400">{statusLabel}</p>
          <button
            type="button"
            onClick={handleNext}
            disabled={buttonDisabled || !canAdvance}
            className="relative overflow-hidden rounded-full border border-white/15 bg-gradient-to-r from-neon-pink to-neon-yellow px-6 py-3 text-xs uppercase tracking-[0.35em] text-black shadow-[0_0_18px_rgba(255,246,92,0.35)] transition hover:brightness-105 disabled:opacity-60"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : buttonLabel}
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-hall-panel/80 p-6 shadow-panel-inset">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.4em] text-neon-yellow">Results</p>
          <p className="text-[11px] text-zinc-400">ミニカードは開示済みのみ表示</p>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          {displayResults.length === 0 ? (
            <span className="text-xs text-zinc-500">まだ結果はありません</span>
          ) : (
            displayResults.map((result, index) => {
              const color = RARITY_COLOR[result.rarity] ?? "border-white/15 text-white";
              return (
                <div
                  key={`${result.cardId}-${index}`}
                  className={`min-w-[120px] rounded-2xl border bg-black/40 p-3 text-xs ${color}`}
                >
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.3em]">
                    <span>{RARITY_LABELS[result.rarity] ?? result.rarity}</span>
                    {result.serialNumber ? <span>#{result.serialNumber}</span> : null}
                  </div>
                  <p className="mt-2 line-clamp-2 text-white">{result.name}</p>
                </div>
              );
            })
          )}
        </div>

        {showSummary && (
          <div className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-black/25 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-neon-blue">まとめ結果</p>
                <p className="text-sm text-zinc-300">全カードを開示しました</p>
              </div>
              {bestCard && (
                <div className="rounded-2xl border border-neon-yellow/50 bg-black/40 px-4 py-3 text-xs text-neon-yellow">
                  ベスト: {bestCard.name} ({RARITY_LABELS[bestCard.rarity] ?? bestCard.rarity})
                </div>
              )}
            </div>

            <div className="grid gap-2 sm:grid-cols-5 text-xs text-zinc-300">
              {Object.entries(RARITY_LABELS).map(([rarity, label]) => (
                <div key={rarity} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                  <p className="text-white">{label}</p>
                  <p className="text-zinc-400">{rarityCounts[rarity] ?? 0} 枚</p>
                </div>
              ))}
            </div>

            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => window.location.assign("/gacha/multi")}
                className="rounded-full border border-white/15 px-4 py-3 text-[11px] uppercase tracking-[0.35em] text-white transition hover:border-neon-blue"
              >
                もう一度回す
              </button>
              <button
                type="button"
                onClick={() => window.location.assign("/collection")}
                className="rounded-full bg-gradient-to-r from-neon-pink to-neon-yellow px-4 py-3 text-[11px] uppercase tracking-[0.35em] text-black shadow-[0_0_18px_rgba(255,246,92,0.35)]"
              >
                コレクションを見る
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

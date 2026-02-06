"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Play } from "lucide-react";

type ScenarioStep = {
  index: number;
  phase: "intro" | "mid" | "buildup" | "finale";
  heat: "normal" | "hot" | "super" | "jackpot";
  videoKey: string;
  videoUrl: string;
  durationSeconds: number;
};

type DrawResult = {
  cardId: string;
  name: string;
  rarity: string;
  imageUrl: string;
  serialNumber: number;
};

const DEMO_CARD: DrawResult = {
  cardId: "demo-card-iraira",
  name: "イライラ尊師",
  rarity: "UR",
  imageUrl: "/iraira.png",
  serialNumber: 1,
};

const DEMO_RESULTS: DrawResult[] = Array.from({ length: 10 }).map((_, index) => ({
  ...DEMO_CARD,
  serialNumber: index + 1,
}));

const DEMO_SCENARIO: ScenarioStep[] = Array.from({ length: 10 }).map((_, index) => {
  const step = index + 1;
  let videoUrl = "/gekia-tsu.mp4";
  if (step >= 7 && step <= 9) videoUrl = "/gekia-tsu2.mp4";
  if (step === 10) videoUrl = "/kakutei.mp4";

  let phase: ScenarioStep["phase"] = "intro";
  if (step >= 4 && step <= 6) phase = "mid";
  else if (step >= 7 && step <= 9) phase = "buildup";
  else if (step === 10) phase = "finale";

  let heat: ScenarioStep["heat"] = "hot";
  if (step >= 7 && step <= 9) heat = "super";
  if (step === 10) heat = "jackpot";

  return {
    index: step,
    phase,
    heat,
    videoKey: videoUrl,
    videoUrl,
    durationSeconds: 4,
  };
});

const RARITY_LABELS: Record<string, string> = {
  N: "N",
  R: "R",
  SR: "SR",
  SSR: "SSR",
  UR: "UR",
};

const RARITY_COLOR: Record<string, string> = {
  N: "border-white/15 text-white",
  R: "border-neon-blue/60 text-neon-blue",
  SR: "border-purple-400/70 text-purple-200",
  SSR: "border-amber-300/70 text-amber-200",
  UR: "border-white/30 text-white bg-gradient-to-r from-neon-pink/15 to-neon-yellow/15",
};

function buildInitialState() {
  return {
    revealed: [] as DrawResult[],
    activeStep: null as ScenarioStep | null,
    queuedResult: null as DrawResult | null,
    showSummary: false,
  };
}

export function MultiGachaDemo() {
  const [revealed, setRevealed] = useState<DrawResult[]>([]);
  const [activeStep, setActiveStep] = useState<ScenarioStep | null>(null);
  const [queuedResult, setQueuedResult] = useState<DrawResult | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [pending, setPending] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [canAdvance, setCanAdvance] = useState(true);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalPulls = DEMO_RESULTS.length;
  const completedCount = revealed.length;
  const activeIndex = activeStep?.index ?? null;
  const isCompleted = showSummary || completedCount >= totalPulls;

  useEffect(() => {
    return () => {
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
      }
    };
  }, []);

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
      }
    },
    [activeStep, completedCount, queuedResult, totalPulls]
  );

  const handleNext = () => {
    if (pending || isPlaying || isCompleted) return;
    setPending(true);
    setCanAdvance(false);
    setShowSummary(false);

    const nextIndex = revealed.length + 1;
    const step = DEMO_SCENARIO[nextIndex - 1] ?? null;
    const result = DEMO_RESULTS[nextIndex - 1] ?? null;

    setActiveStep(step);
    setQueuedResult(result);

    const durationMs = Math.max((step?.durationSeconds ?? 4) * 1000, 2000);
    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    fallbackTimerRef.current = setTimeout(() => handleStepEnd(true), durationMs);

    if (step?.videoUrl) {
      setIsPlaying(true);
    }

    setPending(false);
  };

  const handleRestart = () => {
    const initial = buildInitialState();
    setRevealed(initial.revealed);
    setActiveStep(initial.activeStep);
    setQueuedResult(initial.queuedResult);
    setShowSummary(initial.showSummary);
    setIsPlaying(false);
    setCanAdvance(true);
  };

  const displayResults = showSummary ? DEMO_RESULTS : revealed;
  const buttonDisabled = pending || isPlaying || isCompleted;
  const buttonLabel = isCompleted ? "完了" : revealed.length === 0 ? "START" : isPlaying ? "再生中" : "NEXT";
  const statusLabel = isPlaying ? "映像再生中..." : isCompleted ? "演出完了" : "ボタンを押して次へ";

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-hall-panel/80 p-6 shadow-panel-inset">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.4em] text-neon-blue">
            {Math.min(revealed.length, totalPulls)}/{totalPulls}
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
              className="aspect-[9/16] h-[70vh] w-full max-w-3xl rounded-xl object-cover shadow-lg"
            />
          ) : (
            <div className="flex h-[70vh] max-h-[80vh] flex-col items-center justify-center gap-2 rounded-xl bg-black/40 text-center text-xs uppercase tracking-[0.4em] text-zinc-400">
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
            onClick={isCompleted ? handleRestart : handleNext}
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
                    <span>#{result.serialNumber}</span>
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
              <div className="rounded-2xl border border-neon-yellow/50 bg-black/40 px-4 py-3 text-xs text-neon-yellow">
                ベスト: {DEMO_CARD.name} ({RARITY_LABELS[DEMO_CARD.rarity] ?? DEMO_CARD.rarity})
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-5 text-xs text-zinc-300">
              {Object.entries(RARITY_LABELS).map(([rarity, label]) => (
                <div key={rarity} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                  <p className="text-white">{label}</p>
                  <p className="text-zinc-400">{rarity === DEMO_CARD.rarity ? totalPulls : 0} 枚</p>
                </div>
              ))}
            </div>

            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleRestart}
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

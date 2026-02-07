"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
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
  onFinished?: () => void;
  fullscreenMode?: boolean;
};

type CinematicPhase = "video" | "fade" | "result";

export function MultiGachaSession({ sessionId, onFinished, fullscreenMode = false }: Props) {
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [revealed, setRevealed] = useState<DrawResult[]>([]);
  const [activeStep, setActiveStep] = useState<ScenarioStep | null>(null);
  const [queuedResult, setQueuedResult] = useState<DrawResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [canAdvance, setCanAdvance] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  const [cinematicPhase, setCinematicPhase] = useState<CinematicPhase | null>(null);
  const [fadeProgress, setFadeProgress] = useState(0);
  const prefetchCache = useRef(new Set<string>());
  const preconnectCache = useRef(new Set<string>());
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const handleNextRef = useRef<(() => Promise<void>) | null>(null);

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
        
        // 自動的に最初のステップを開始（サイトUIを表示せず直接動画へ）
        if (current === 0 && handleNextRef.current) {
          // cinematicPhaseを即座にvideoに設定してサイトUIを非表示
          setCinematicPhase("video");
          setTimeout(() => {
            if (mounted && handleNextRef.current) {
              handleNextRef.current();
            }
          }, 100);
        }
      })
      .catch((err: Error) => {
        if (mounted) setError(err.message);
      });

    return () => {
      mounted = false;
    };
  }, [sessionId]);

  // 初回動画のsrcを事前に設定（1本目が真っ黒問題の解決）
  useEffect(() => {
    if (
      cinematicPhase === "video" && 
      videoRef.current && 
      session?.currentPull === 0 && 
      session.scenario?.[0]?.videoUrl &&
      !videoRef.current.src
    ) {
      videoRef.current.src = session.scenario[0].videoUrl;
    }
  }, [cinematicPhase, session]);

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
    },
    [activeStep]
  );

  const handleVideoLoaded = useCallback(async (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    
    try {
      // unmute試行
      video.muted = false;
      
      // 明示的に再生
      await video.play();
      setIsPlaying(true);
    } catch (err) {
      console.warn('Video play failed, fallback to muted:', err);
      // 失敗時はmutedで再生
      video.muted = true;
      try {
        await video.play();
        setIsPlaying(true);
      } catch (retryErr) {
        console.error('Video play completely failed:', retryErr);
      }
    }
  }, []);

  const handleAdvanceToNext = useCallback(() => {
    if (!activeStep || !queuedResult) return;

    setRevealed((prev) => {
      const next = [...prev];
      next[activeStep.index - 1] = queuedResult;
      return next;
    });

    const finished = (activeStep?.index ?? completedCount) >= totalPulls;
    if (finished) {
      setShowSummary(true);
      setSession((prev) => (prev ? { ...prev, status: "completed", currentPull: totalPulls } : prev));
      // 最後の動画終了後、フェードアウト開始
      setCinematicPhase("fade");
      setFadeProgress(0);
      // 1.5秒かけてフェードアウト
      const fadeInterval = setInterval(() => {
        setFadeProgress((prev) => {
          if (prev >= 1) {
            clearInterval(fadeInterval);
            setCinematicPhase("result");
            return 1;
          }
          return prev + 0.05;
        });
      }, 75);
      onFinished?.();
    } else {
      // 次の動画へ進む（cinematicPhaseはvideoのまま維持）
      setQueuedResult(null);
      setCanAdvance(false);
      // activeStep は維持しておき、次のシナリオ取得後に差し替える（黒画面を防ぐ）
      
      if (handleNextRef.current) {
        handleNextRef.current();
      }
    }
  }, [activeStep, completedCount, onFinished, queuedResult, totalPulls]);

  const handleSkip = useCallback(() => {
    // 全ての動画をスキップしてカード表示へ
    const remainingResults = session?.results || [];
    setRevealed(remainingResults);
    setShowSummary(true);
    setSession((prev) => (prev ? { ...prev, status: "completed", currentPull: totalPulls } : prev));
    // フェードアウト開始
    setCinematicPhase("fade");
    setFadeProgress(0);
    // 1秒かけてフェードアウト
    const fadeInterval = setInterval(() => {
      setFadeProgress((prev) => {
        if (prev >= 1) {
          clearInterval(fadeInterval);
          setCinematicPhase("result");
          return 1;
        }
        return prev + 0.1;
      });
    }, 100);
    onFinished?.();
  }, [session, totalPulls, onFinished]);



  const handleNext = useCallback(async () => {
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
      setQueuedResult(data.result ?? null);

      // ★ video要素のsrcだけ変更（pause()やload()は呼ばない = 軽量）
      if (videoRef.current && data.scenario?.videoUrl) {
        videoRef.current.src = data.scenario.videoUrl;
        setActiveStep(data.scenario);
      } else {
        setActiveStep(data.scenario ?? null);
      }

      // フォールバック（動画の再生イベントが来ない場合も進行させる）
      const durationMs = Math.max((data.scenario?.durationSeconds ?? 8) * 1000, 3000);
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = setTimeout(() => handleStepEnd(true), durationMs);

    } catch (err) {
      setError(err instanceof Error ? err.message : "予期せぬエラーが発生しました");
      setCanAdvance(true);
    } finally {
      setPending(false);
    }
  }, [session, pending, isPlaying, isCompleted, sessionId, handleStepEnd]);

  useEffect(() => {
    handleNextRef.current = handleNext;
  }, [handleNext]);

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

  const cinematicOverlay = cinematicPhase && typeof window !== "undefined" ? createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* 全画面動画 */}
        {cinematicPhase === "video" && activeStep?.videoUrl && (
          <video
            ref={videoRef}
            src={activeStep.videoUrl}
            className="absolute inset-0 h-screen w-screen object-cover [&::-webkit-media-controls]:hidden [&::-webkit-media-controls-enclosure]:hidden [&::-webkit-media-controls-panel]:hidden"
            playsInline
            muted
            preload="auto"
            disablePictureInPicture
            disableRemotePlayback
            onLoadedData={handleVideoLoaded}
            onEnded={() => handleStepEnd()}
            onError={() => handleStepEnd(true)}
            style={{ WebkitTapHighlightColor: "transparent" }}
          />
        )}



        {/* プログレスインジケーター（動画再生中のみ） */}
        {cinematicPhase === "video" && activeStep && (
          <div className="pointer-events-none absolute left-1/2 top-6 z-10 flex -translate-x-1/2 items-center gap-2">
            {progressDots}
          </div>
        )}

        {/* パチスロ風停止ボタン（動画終了後） */}
        {cinematicPhase === "video" && !isPlaying && canAdvance && activeStep && (
          <motion.div
            className="absolute bottom-12 left-1/2 z-10 flex -translate-x-1/2 items-center gap-6"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* NEXTボタン */}
            <button
              type="button"
              onClick={handleAdvanceToNext}
              className="group relative h-32 w-32 rounded-full bg-gradient-to-b from-red-500 via-red-600 to-red-700 shadow-[0_8px_32px_rgba(220,38,38,0.6),0_0_80px_rgba(220,38,38,0.4),inset_0_2px_8px_rgba(255,255,255,0.3),inset_0_-4px_12px_rgba(0,0,0,0.4)] transition-all hover:shadow-[0_8px_40px_rgba(220,38,38,0.8),0_0_100px_rgba(220,38,38,0.6)] active:scale-95"
            >
              <div className="absolute inset-2 rounded-full bg-gradient-to-b from-red-400 to-red-600 shadow-[inset_0_2px_12px_rgba(255,255,255,0.4),inset_0_-2px_8px_rgba(0,0,0,0.3)]" />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="relative z-10 font-display text-2xl font-bold uppercase tracking-[0.2em] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                  NEXT
                </span>
                <span className="relative z-10 mt-1 text-[10px] uppercase tracking-[0.3em] text-white/80">
                  次へ
                </span>
              </div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-transparent to-white/20" />
              <div className="absolute -inset-2 animate-pulse rounded-full bg-red-500/30 blur-xl group-hover:bg-red-500/50" />
            </button>

            {/* SKIPボタン */}
            <button
              type="button"
              onClick={handleSkip}
              className="group relative h-32 w-32 rounded-full bg-gradient-to-b from-zinc-800 via-zinc-900 to-black shadow-[0_8px_32px_rgba(0,0,0,0.8),0_0_80px_rgba(0,0,0,0.6),inset_0_2px_8px_rgba(255,255,255,0.2),inset_0_-4px_12px_rgba(0,0,0,0.6)] transition-all hover:shadow-[0_8px_40px_rgba(0,0,0,0.9),0_0_100px_rgba(0,0,0,0.7)] active:scale-95"
            >
              <div className="absolute inset-2 rounded-full bg-gradient-to-b from-zinc-700 to-zinc-900 shadow-[inset_0_2px_12px_rgba(255,255,255,0.3),inset_0_-2px_8px_rgba(0,0,0,0.5)]" />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="relative z-10 font-display text-2xl font-bold uppercase tracking-[0.2em] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                  SKIP
                </span>
                <span className="relative z-10 mt-1 text-[10px] uppercase tracking-[0.3em] text-white/80">
                  全省略
                </span>
              </div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-transparent to-white/10" />
              <div className="absolute -inset-2 animate-pulse rounded-full bg-zinc-500/20 blur-xl group-hover:bg-zinc-500/30" />
            </button>
          </motion.div>
        )}

        {/* フェードアウト */}
        <motion.div
          className="pointer-events-none absolute inset-0 bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: cinematicPhase === "fade" ? fadeProgress : cinematicPhase === "result" ? 1 : 0 }}
        />

        {/* カード表示（1枚のみ、ウマロワイヤル方式） */}
        {cinematicPhase === "result" && showSummary && bestCard && (
          <div className="relative z-20 flex min-h-screen flex-col items-center overflow-y-auto bg-black/95 px-4 pb-40 pt-10">
            <motion.div
              className="flex w-full max-w-3xl flex-col items-center gap-4 text-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <p className="text-xs uppercase tracking-[0.5em] text-white/60">結果</p>
              
              <div className="flex flex-col items-center gap-2 text-center">
                <p className="font-serif text-2xl leading-tight">{bestCard.name}</p>
                <span className="rounded-full border border-white/30 px-5 py-1.5 text-base tracking-[0.3em]">
                  ★{RARITY_LABELS[bestCard.rarity] ?? bestCard.rarity}
                </span>
              </div>

              {bestCard.imageUrl && (
                <div className="flex w-full max-w-sm flex-col items-center gap-3 rounded-3xl border border-white/20 bg-white/10 p-4">
                  <div className="relative w-full overflow-hidden rounded-2xl bg-black/30">
                    <div className="relative aspect-[3/4] w-full">
                      <img
                        src={bestCard.imageUrl}
                        alt={bestCard.name}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 flex w-full justify-center">
                <button
                  type="button"
                  onClick={() => window.location.assign("/collection")}
                  className="w-full max-w-sm rounded-full bg-white px-8 py-4 text-lg font-bold text-black shadow-[0_4px_20px_rgba(255,255,255,0.3)] transition hover:bg-white/90"
                >
                  結果履歴ページに戻る
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>,
    document.body
  ) : null;

  return (
    <>
      {cinematicOverlay}
      
      {!fullscreenMode && !cinematicPhase && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-hall-panel/80 p-6 shadow-panel-inset">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.4em] text-neon-blue">
                {Math.min(session.currentPull, totalPulls)}/{totalPulls}
              </p>
              <div className="flex items-center gap-2">{progressDots}</div>
            </div>

            {!cinematicPhase && session.currentPull > 0 && (
              <div className="mt-5 text-center">
                <p className="text-sm text-zinc-400">演出進行中...</p>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-hall-panel/80 p-6 shadow-panel-inset">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.4em] text-neon-yellow">Results</p>
              <p className="text-[11px] text-zinc-400">{revealed.length} / {totalPulls}</p>
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
      )}
    </>
  );
}

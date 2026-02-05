"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Loader2, Sparkles } from "lucide-react";

type ScenarioStep = {
  index: number;
  phase: string;
  heat: string;
  rarity: string;
  videoKey: string;
  videoUrl?: string | null;
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

type Props = {
  sessionId: string;
};

export function MultiGachaSession({ sessionId }: Props) {
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [revealed, setRevealed] = useState<DrawResult[]>([]);
  const [currentScenario, setCurrentScenario] = useState<ScenarioStep | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const prefetchCache = useRef(new Set<string>());
  const preconnectCache = useRef(new Set<string>());

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
        if (current > 0) {
          setCurrentScenario(data.scenario[current - 1] ?? null);
        }
      })
      .catch((err: Error) => {
        if (mounted) setError(err.message);
      });

    return () => {
      mounted = false;
    };
  }, [sessionId]);

  const totalPulls = session?.totalPulls ?? 0;
  const currentPull = session?.currentPull ?? 0;
  const isCompleted = session?.status === "completed" || currentPull >= totalPulls;

  useEffect(() => {
    if (!session?.scenario || session.scenario.length === 0) return;
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (connection?.saveData) return;

    const currentIndex = Math.max(0, currentPull - 1);
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
  }, [currentPull, session?.scenario]);

  const progressDots = useMemo(() => {
    return Array.from({ length: totalPulls }).map((_, index) => {
      const position = index + 1;
      let state = "bg-white/10";
      if (position < currentPull) state = "bg-neon-blue";
      if (position === currentPull) state = "bg-neon-yellow animate-pulse";
      return <span key={position} className={`h-2 w-2 rounded-full ${state}`} />;
    });
  }, [currentPull, totalPulls]);

  const handleNext = async () => {
    if (!session || pending || isCompleted) return;
    setError(null);
    setPending(true);
    try {
      const response = await fetch(`/api/gacha/multi/${sessionId}/next`, { method: "POST" });
      const data: NextResponse = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error ?? "取得に失敗しました");
      }

      setSession((prev) =>
        prev
          ? {
              ...prev,
              currentPull: data.currentPull,
              status: data.status,
            }
          : prev
      );
      const resolvedResult = data.result ?? null;
      if (resolvedResult) {
        setRevealed((prev) => {
          const next = [...prev];
          if (!next[data.currentPull - 1]) {
            next[data.currentPull - 1] = resolvedResult;
          }
          return next;
        });
      }
      setCurrentScenario(data.scenario ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "予期せぬエラーが発生しました");
    } finally {
      setPending(false);
    }
  };

  if (error) {
    return <p className="text-sm text-red-400">{error}</p>;
  }

  if (!session) {
    return <p className="text-sm text-zinc-400">ロード中...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-hall-panel/80 p-6 shadow-panel-inset">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.4em] text-neon-blue">
            {currentPull}/{totalPulls}
          </p>
          <div className="flex items-center gap-2">{progressDots}</div>
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-zinc-300">
          {currentScenario?.videoUrl ? (
            <video
              key={currentScenario.videoUrl}
              src={currentScenario.videoUrl}
              preload="auto"
              controls
              playsInline
              className="h-56 w-full rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-56 items-center justify-center rounded-xl bg-black/40">
              <div className="text-center text-xs uppercase tracking-[0.4em] text-zinc-400">
                {currentScenario?.videoKey ?? "READY"}
              </div>
            </div>
          )}
          {currentScenario && (
            <p className="mt-3 text-xs uppercase tracking-[0.35em] text-zinc-400">
              {currentScenario.phase} / {currentScenario.heat}
            </p>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <p className="text-xs text-zinc-400">
            {isCompleted ? "演出完了" : "NEXTで次の演出へ"}
          </p>
          <button
            type="button"
            onClick={handleNext}
            disabled={pending || isCompleted}
            className="rounded-full bg-gradient-to-r from-neon-pink to-neon-yellow px-6 py-3 text-xs uppercase tracking-[0.35em] text-black disabled:opacity-60"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : isCompleted ? "完了" : "NEXT"}
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-hall-panel/80 p-6 shadow-panel-inset">
        <p className="text-xs uppercase tracking-[0.4em] text-neon-yellow">Results</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {(isCompleted ? session.results : revealed).map((result, index) => (
            <div
              key={`${result.cardId}-${index}`}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-3"
            >
              {result.imageUrl ? (
                <Image
                  src={result.imageUrl}
                  alt={result.name}
                  width={56}
                  height={56}
                  unoptimized
                  className="h-14 w-14 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-black/40 text-[0.6rem] text-zinc-400">
                  NO IMAGE
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-display text-base text-white">{result.name}</p>
                  <span className="flex items-center gap-1 text-xs text-neon-yellow">
                    <Sparkles className="h-3.5 w-3.5" />
                    {RARITY_LABELS[result.rarity] ?? result.rarity}
                  </span>
                </div>
                {result.serialNumber ? (
                  <p className="mt-1 text-xs text-zinc-400">#{result.serialNumber}</p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ResultDisplay, ResultType, Scenario, VideoSequenceItem } from "@/lib/gacha/v3/types";
import { getVideoPathV3 } from "@/lib/gacha/v3/utils";

type Status = "idle" | "loading" | "playing" | "result" | "card" | "error";

type CardData = {
  id: string;
  name: string;
  image_url: string;
  star: number;
  serial_number?: number | null;
};

type ResultKind = "lose" | "win" | "big_win" | "jackpot" | "chase";

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
  const [gachaId, setGachaId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [canAdvance, setCanAdvance] = useState(false);
  const [isAuto, setIsAuto] = useState(false);
  const [telop, setTelop] = useState<ResultDisplay | null>(null);
  const [resultKind, setResultKind] = useState<ResultKind | null>(null);
  const [cards, setCards] = useState<CardData[] | null>(null);
  const [cardLoading, setCardLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isAutoRef = useRef(false);
  const lastResultRef = useRef<ResultType | null>(null);

  const resetAll = useCallback(() => {
    setStatus("idle");
    setScenario(null);
    setGachaId(null);
    setCards(null);
    setCurrentIndex(0);
    setIsAuto(false);
    isAutoRef.current = false;
    setResultKind(null);
    lastResultRef.current = null;
  }, []);

  const currentVideo: VideoSequenceItem | null = useMemo(() => {
    if (!scenario) return null;
    return scenario.video_sequence[currentIndex] ?? null;
  }, [scenario, currentIndex]);

  const start = useCallback(async () => {
    setStatus("loading");
    setError(null);
    setScenario(null);
    setGachaId(null);
    setCurrentIndex(0);
    setCanAdvance(false);
    setIsAuto(false);
    isAutoRef.current = false;
    setResultKind(null);
    lastResultRef.current = null;
    try {
      const res = await fetch("/api/gacha/v3/play", { method: "POST" });
      const data = (await res.json()) as GachaPlayResponse | { error?: string };
      if (!res.ok || "error" in data) throw new Error((data as { error?: string }).error ?? "start failed");

      const v3 = (data as GachaPlayResponse).scenario;
      setGachaId((data as GachaPlayResponse).gacha_id);
      setScenario(v3);
      setStatus("playing");
      setCurrentIndex(0);
      setCanAdvance(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "開始に失敗しました");
      setStatus("error");
    }
  }, []);

  const advance = useCallback(() => {
    if (!scenario) return;
    setTelop(null);
    setCanAdvance(false);
    const next = currentIndex + 1;
    if (next < scenario.video_sequence.length) {
      setCurrentIndex(next);
      const node = videoRef.current;
      if (node) {
        node.load();
        void node.play();
      }
      return;
    }
    setResultKind(resolveResultKind(scenario, lastResultRef.current));
    setStatus("result");
  }, [currentIndex, scenario]);

  const handleNext = useCallback(() => {
    if (!scenario || !canAdvance) return;
    advance();
  }, [advance, canAdvance, scenario]);

  const handleEnded = useCallback(() => {
    if (!scenario || !currentVideo) return;
    const rd = currentVideo.result_display;
    lastResultRef.current = rd?.type ?? null;
    setTelop(rd);

    const afterTelop = () => {
      if (rd?.show_next_button && currentIndex < scenario.video_sequence.length - 1) {
        if (isAutoRef.current) {
          setTimeout(() => advance(), 100);
        } else {
          setCanAdvance(true);
        }
      } else {
        setResultKind(resolveResultKind(scenario, lastResultRef.current));
        setStatus("result");
      }
    };

    if (rd && rd.type !== "none") {
      setCanAdvance(false);
      setTimeout(() => {
        setTelop(null);
        afterTelop();
      }, 1800);
    } else {
      afterTelop();
    }
  }, [advance, currentIndex, currentVideo, scenario]);

  const handleSkip = useCallback(() => {
    if (!scenario) return;
    setTelop(null);
    setResultKind(resolveResultKind(scenario, lastResultRef.current));
    setStatus("result");
    setCanAdvance(false);
  }, [scenario]);

  const fetchCards = useCallback(async (id: string | null, star: number) => {
    setCardLoading(true);
    try {
      const res = await fetch("/api/gacha/v3/result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gacha_id: id }),
      });
      const data = (await res.json()) as { cards?: CardData[] };
      const payload = (data.cards ?? []).map((c) => ({ ...c, star: c.star ?? star }));
      setCards(payload.length ? payload : null);
    } catch (err) {
      console.error("fetch cards failed", err);
      setCards(null);
    } finally {
      setCardLoading(false);
    }
  }, []);

  // isAuto反映
  useEffect(() => {
    isAutoRef.current = isAuto;
  }, [isAuto]);

  // ESCで閉じる
  useEffect(() => {
    if (status !== "playing") return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        resetAll();
      }
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [resetAll, status]);

  // 全画面オーバーレイ中はスクロール抑制＆nav非表示（V2同様）
  useEffect(() => {
    if (status === "playing" || status === "result" || status === "card") {
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

          {telop && telop.type !== "none" && (
            <div className="pointer-events-none absolute inset-0 z-[120] flex items-center justify-center bg-black/60">
              <div
                className="px-6 py-4 text-center"
                style={{
                  animation: "telop-emerge 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
                  transform: "scale(0.3)",
                  opacity: 0,
                }}
              >
                <span
                  className={`font-serif text-5xl font-extrabold tracking-[0.1em] drop-shadow-[0_6px_18px_rgba(0,0,0,0.8)] ${
                    telop.color === "green"
                      ? "text-emerald-300"
                      : telop.color === "red"
                        ? "text-red-400"
                        : telop.color === "rainbow"
                          ? "bg-gradient-to-r from-red-400 via-yellow-300 to-blue-400 bg-clip-text text-transparent"
                          : telop.color === "gold"
                            ? "bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent"
                            : telop.color === "gray"
                              ? "text-gray-300"
                              : "text-white"
                  }`}
                >
                  {telop.text}
                </span>
              </div>
            </div>
          )}

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

          <button
            type="button"
            onClick={() => {
              setStatus("idle");
              setScenario(null);
              setCurrentIndex(0);
              setIsAuto(false);
              isAutoRef.current = false;
              setResultKind(null);
              lastResultRef.current = null;
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

      {status === "result" && scenario && resultKind && (
        <FinalResultTelop
          kind={resultKind}
          onClose={async () => {
            await fetchCards(gachaId, scenario.star);
            setStatus("card");
          }}
        />
      )}

      {status === "card" && scenario && (
        <CardReveal
          scenario={scenario}
          cards={cards}
          loading={cardLoading}
          onClose={resetAll}
        />
      )}

      <style jsx global>{`
        @keyframes telop-emerge {
          0% { transform: scale(0.3) translateZ(-400px) rotateX(25deg); opacity: 0; }
          50% { opacity: 1; }
          70% { transform: scale(1.05) translateZ(50px) rotateX(-5deg); }
          100% { transform: scale(1) translateZ(0) rotateX(0); opacity: 1; }
        }
        @keyframes rise {
          0% { transform: translateY(20px) scale(0.8); opacity: 0; }
          30% { opacity: 1; }
          70% { opacity: 0.9; }
          100% { transform: translateY(-120px) scale(1.2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function resolveResultKind(scenario: Scenario, lastResult: ResultType | null): ResultKind {
  if (lastResult === "tsuigeki_chance") return "chase";
  if (lastResult === "tsuigeki_success") return "jackpot";
  if (lastResult === "tsuigeki_fail") return "lose";

  if (scenario.has_tsuigeki) {
    if (scenario.tsuigeki_result === "success") return "jackpot";
    if (scenario.tsuigeki_result === "fail") return "lose";
  }

  if (scenario.star >= 10) return scenario.result === "win" ? "jackpot" : "lose";
  if (scenario.star >= 8) return scenario.result === "win" ? "big_win" : "lose";
  if (scenario.star >= 4) return scenario.result === "win" ? "win" : "lose";
  return "lose";
}

type FinalTelopProps = {
  kind: ResultKind;
  onClose: () => void;
};

function FinalResultTelop({ kind, onClose }: FinalTelopProps) {
  const config = useMemo(() => {
    switch (kind) {
      case "lose":
        return {
          bg: "from-gray-950 via-gray-900 to-black",
          main: "ハズレ",
          sub: "残念...",
          mainClass: "text-red-400",
          duration: 3000,
        } as const;
      case "win":
        return {
          bg: "from-indigo-900 via-purple-800 to-blue-900",
          main: "当たり！",
          sub: "おめでとう！",
          mainClass: "text-amber-200",
          duration: 4000,
        } as const;
      case "big_win":
        return {
          bg: "from-amber-500 via-orange-500 to-amber-700",
          main: "大当たり！！",
          sub: "凄いっす！！",
          mainClass: "text-amber-100",
          duration: 5000,
        } as const;
      case "jackpot":
        return {
          bg: "from-pink-500 via-purple-500 to-emerald-400",
          main: "超大当たり！！！",
          sub: "伝説降臨！！！",
          mainClass: "bg-gradient-to-r from-red-200 via-yellow-200 to-blue-200 bg-clip-text text-transparent",
          duration: 6000,
        } as const;
      case "chase":
      default:
        return {
          bg: "from-purple-800 via-amber-600 to-yellow-500",
          main: "追撃チャンス！",
          sub: "まだ終わらない...",
          mainClass: "text-amber-200",
          duration: 3000,
        } as const;
    }
  }, [kind]);

  useEffect(() => {
    const t = setTimeout(() => {
      onClose();
    }, config.duration);
    return () => clearTimeout(t);
  }, [config.duration, onClose]);

  return (
    <div className={`fixed inset-0 z-[130] flex items-center justify-center bg-gradient-to-br ${config.bg} animate-[pulse_2s_ease-in-out_infinite]`}>
      <div className="text-center drop-shadow-[0_8px_24px_rgba(0,0,0,0.8)]">
        <div className={`text-6xl font-black tracking-[0.08em] sm:text-7xl md:text-8xl ${config.mainClass}`}>
          {config.main}
        </div>
        <div className="mt-4 text-xl font-semibold text-white/90">{config.sub}</div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="absolute bottom-10 rounded-full border border-white/30 bg-white/10 px-6 py-3 text-xs uppercase tracking-[0.3em] text-white shadow-lg"
      >
        もう一度
      </button>
      <ParticleField kind={kind} />
    </div>
  );
}

function ParticleField({ kind }: { kind: ResultKind }) {
  const colors = useMemo(() => {
    if (kind === "lose") return ["#7f1d1d", "#111827", "#1f2937"];
    if (kind === "win") return ["#c084fc", "#60a5fa", "#eab308"];
    if (kind === "big_win") return ["#fbbf24", "#f59e0b", "#f97316"];
    if (kind === "jackpot") return ["#f472b6", "#c084fc", "#34d399", "#facc15"];
    return ["#facc15", "#a855f7", "#fbbf24"]; // chase
  }, [kind]);

  const particles = useMemo(() => {
    const pseudo = (seed: number) => (Math.sin(seed * 999) + 1) / 2;
    return Array.from({ length: 40 }, (_, i) => {
      const delay = (i % 10) * 0.2;
      const duration = 4 + (i % 5);
      const size = 6 + (i % 8);
      const left = pseudo(i + 1) * 100;
      const top = pseudo(i + 11) * 100;
      const color = colors[i % colors.length];
      return { delay, duration, size, left, top, color, key: i };
    });
  }, [colors]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <span
          key={p.key}
          className="absolute rounded-full blur-sm"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            opacity: 0.9,
            animation: `rise ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

type CardRevealProps = {
  scenario: Scenario;
  cards: CardData[] | null;
  loading: boolean;
  onClose: () => void;
};

function CardReveal({ scenario, cards, loading, onClose }: CardRevealProps) {
  const fallback: CardData = {
    id: "demo-iraira",
    name: "イライラ尊師",
    image_url: "/iraira.png",
    star: scenario.star,
    serial_number: null,
  };

  const list = cards && cards.length ? cards : [fallback];
  const count = scenario.card_count ?? list.length;

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-gradient-to-br from-black via-zinc-950 to-black">
      <div className="relative flex w-full max-w-md flex-col items-center gap-6 rounded-[28px] border border-white/15 bg-[rgba(12,10,20,0.92)] p-6 shadow-[0_35px_80px_rgba(0,0,0,0.75)]">
        <p className="text-xs uppercase tracking-[0.4em] text-neon-yellow">Result</p>
        <p className="text-2xl font-display text-white">★{scenario.star} / {count}枚</p>

        {loading ? (
          <p className="text-sm text-white/80">カードを取得中...</p>
        ) : (
          <div className="w-full space-y-3">
            {list.map((card) => (
              <div key={card.id} className="relative overflow-hidden rounded-[22px] border border-white/15 bg-gradient-to-b from-white/10 to-black/40 shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(250,204,21,0.25),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(236,72,153,0.2),transparent_40%)]" />
                <Image
                  src={card.image_url}
                  alt={card.name}
                  width={640}
                  height={960}
                  className="relative z-10 w-full object-contain"
                  priority
                />
                <div className="absolute bottom-3 left-0 right-0 z-10 px-4 text-center">
                  <p className="font-display text-xl text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.7)]">{card.name}</p>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/80">{card.serial_number ? `No. ${card.serial_number}` : "SERIAL"}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full max-w-xs rounded-full bg-gradient-to-r from-neon-pink to-neon-yellow px-5 py-3 text-sm font-bold uppercase tracking-[0.25em] text-black shadow-neon"
        >
          もう一度
        </button>
      </div>
    </div>
  );
}

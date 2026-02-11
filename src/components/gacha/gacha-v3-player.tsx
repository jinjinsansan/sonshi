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

type Props = {
  playLabel?: string;
  playClassName?: string;
};

const DEFAULT_PLAY_CLASS =
  "w-full max-w-md rounded-[14px] border border-[#f1f3f5] bg-gradient-to-b from-[#fefefe] via-[#d8dce4] to-[#aab0bc] " +
  "px-8 py-4 text-base font-bold tracking-[0.08em] text-[#1a2230] shadow-[0_14px_30px_rgba(0,0,0,0.28),inset_0_2px_0_rgba(255,255,255,0.85),inset_0_-3px_0_rgba(0,0,0,0.2)] " +
  "transition hover:brightness-105 active:translate-y-0.5 disabled:opacity-60";

type GachaPlayResponse = { success: true; gacha_id: string; scenario: Scenario };

const STANDBY_VARIANTS = [
  { id: "S02", starMin: 10, filename: "S02.mp4" }, // rainbow 強示唆
  { id: "S05", starMin: 7, filename: "S05.mp4" }, // red 中〜強
  { id: "S04", starMin: 5, filename: "S04.mp4" }, // blue 中
  { id: "S01", starMin: 0, filename: "S01.mp4" }, // yellow デフォルト
  { id: "S03", starMin: 0, filename: "S03.mp4" }, // gray 弱
  { id: "S06", starMin: 0, filename: "S06.mp4" }, // white neutral
];

const COUNTDOWN_VARIANTS = [
  { id: "C04", starMin: 10, filename: "C04.mp4" },
  { id: "C02", starMin: 7, filename: "C02.mp4" },
  { id: "C01", starMin: 5, filename: "C01.mp4" },
  { id: "C03", starMin: 3, filename: "C03.mp4" },
  { id: "C05", starMin: 0, filename: "C05.mp4" },
  { id: "C06", starMin: 0, filename: "C06.mp4" },
];

function pickStandby(star: number) {
  const ordered = [...STANDBY_VARIANTS].sort((a, b) => b.starMin - a.starMin);
  for (const v of ordered) {
    if (star >= v.starMin) return v;
  }
  return ordered[ordered.length - 1];
}

function pickCountdown(star: number) {
  const ordered = [...COUNTDOWN_VARIANTS].sort((a, b) => b.starMin - a.starMin);
  for (const v of ordered) {
    if (star >= v.starMin) return v;
  }
  return ordered[ordered.length - 1];
}

export function GachaV3Player({ playLabel = "ガチャを回す", playClassName }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [gachaId, setGachaId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [canAdvance, setCanAdvance] = useState(false);
  const [isAuto, setIsAuto] = useState(false);
  const [telop, setTelop] = useState<ResultDisplay | null>(null);
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
    lastResultRef.current = null;
  }, []);

  const normalizedSequence: VideoSequenceItem[] = useMemo(() => {
    if (!scenario) return [];

    const raw = (scenario.video_sequence ?? []) as (VideoSequenceItem & { duration_seconds?: number })[];
    const seq: VideoSequenceItem[] = [];

    // 1コマ目: standby（星に応じて示唆変化）
    const standby = pickStandby(scenario.star);
    seq.push({
      order: 1,
      video_id: standby.id,
      category: "standby",
      filename: standby.filename,
      hint_level: 0,
      result_display: { type: "none", text: "", color: "none", show_next_button: true },
    });

    // 2コマ目: countdown（星に応じて示唆変化）
    const countdown = pickCountdown(scenario.star);
    seq.push({
      order: 2,
      video_id: countdown.id,
      category: "countdown",
      filename: countdown.filename,
      hint_level: 0,
      result_display: { type: "none", text: "", color: "none", show_next_button: true },
    });

    const baseStart = seq.length;
    raw.forEach((item, idx) => {
      seq.push({
        order: baseStart + idx + 1,
        video_id: item.video_id,
        category: item.category,
        filename: item.filename,
        hint_level: item.hint_level ?? 0,
        result_display: { type: "none", text: "", color: "none", show_next_button: true },
      });
    });

    const storyScenario = scenario as Scenario & { has_chase?: boolean; chase_result?: "success" | "fail" | null };
    const hasChase = storyScenario.has_chase ?? storyScenario.has_tsuigeki ?? false;
    const chaseResult = storyScenario.chase_result ?? storyScenario.tsuigeki_result;
    const isWin = scenario.result !== "lose";

    if (seq.length === 0) return seq;

    const lastIndex = seq.length - 1;

    if (hasChase && seq.length >= 2) {
      const chanceIndex = lastIndex - 1;
      seq[chanceIndex].result_display = {
        type: "tsuigeki_chance",
        text: "追撃チャンス！",
        color: "gold",
        show_next_button: true,
      };
      seq[lastIndex].result_display = {
        type: chaseResult === "success" ? "tsuigeki_success" : "tsuigeki_fail",
        text: chaseResult === "success" ? "追撃成功！！" : "追撃失敗...",
        color: chaseResult === "success" ? "rainbow" : "gray",
        show_next_button: false,
      };
      for (let i = 0; i < chanceIndex; i += 1) {
        if (seq[i].result_display.type === "none") {
          seq[i].result_display = { type: "continue", text: "継続！", color: "green", show_next_button: true };
        }
      }
    } else {
      for (let i = 0; i < seq.length; i += 1) {
        const isLast = i === lastIndex;
        if (isLast) {
          seq[i].result_display = isWin
            ? { type: "win", text: "当たり！！", color: "rainbow", show_next_button: false }
            : { type: "lose", text: "ハズレ...", color: "red", show_next_button: false };
        } else if (seq[i].result_display.type === "none") {
          seq[i].result_display = { type: "continue", text: "継続！", color: "green", show_next_button: true };
        }
      }
    }

    return seq;
  }, [scenario]);

  const currentVideo: VideoSequenceItem | null = useMemo(() => {
    return normalizedSequence[currentIndex] ?? null;
  }, [currentIndex, normalizedSequence]);

  const start = useCallback(async () => {
    setStatus("loading");
    setError(null);
    setScenario(null);
    setGachaId(null);
    setCurrentIndex(0);
    setCanAdvance(false);
    setIsAuto(false);
    isAutoRef.current = false;
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

  const advance = useCallback(() => {
    setTelop(null);
    setCanAdvance(false);
    const next = currentIndex + 1;
    if (next < normalizedSequence.length) {
      setCurrentIndex(next);
      const node = videoRef.current;
      if (node) {
        node.load();
        void node.play();
      }
      return;
    }
    void fetchCards(gachaId, scenario?.star ?? 1);
    setStatus("card");
  }, [currentIndex, fetchCards, gachaId, normalizedSequence.length, scenario?.star]);

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
      if (rd?.show_next_button && currentIndex < normalizedSequence.length - 1) {
        if (isAutoRef.current) {
          setTimeout(() => advance(), 100);
        } else {
          setCanAdvance(true);
        }
      } else {
        void fetchCards(gachaId, scenario.star);
        setStatus("card");
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
  }, [advance, currentIndex, currentVideo, fetchCards, gachaId, normalizedSequence.length, scenario]);

  const handleSkip = useCallback(() => {
    if (!scenario) return;
    setTelop(null);
    void fetchCards(gachaId, scenario.star);
    setStatus("card");
    setCanAdvance(false);
  }, [fetchCards, gachaId, scenario]);

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
      `}</style>
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

"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ResultDisplay } from "@/lib/gacha/v3/types";
import type { StoryPlay, StorySequenceItem } from "@/lib/gacha/v4/types";
import { getVideoPathV3 } from "@/lib/gacha/v3/utils";

type Status = "idle" | "loading" | "playing" | "card" | "error";

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

type GachaPlayResponse = { success: true; gacha_id: string; story: StoryPlay };

type StorySequenceWithDisplay = Omit<StorySequenceItem, "category"> & {
  category: StorySequenceItem["category"] | "standby" | "countdown";
  result_display: ResultDisplay;
};

const STANDBY_VARIANTS = [
  { id: "S02", starMin: 10, filename: "S02.mp4" },
  { id: "S05", starMin: 7, filename: "S05.mp4" },
  { id: "S04", starMin: 5, filename: "S04.mp4" },
  { id: "S01", starMin: 0, filename: "S01.mp4" },
  { id: "S03", starMin: 0, filename: "S03.mp4" },
  { id: "S06", starMin: 0, filename: "S06.mp4" },
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

function getTelopTheme(color: ResultDisplay["color"]) {
  switch (color) {
    case "green":
      return {
        textClass: "text-emerald-200",
        glowClass: "text-emerald-300/70",
        stroke: "rgba(13, 148, 136, 0.6)",
      };
    case "red":
      return {
        textClass: "text-red-300",
        glowClass: "text-red-400/70",
        stroke: "rgba(239, 68, 68, 0.65)",
      };
    case "rainbow":
      return {
        textClass: "bg-gradient-to-r from-red-300 via-yellow-200 to-blue-300 bg-clip-text text-transparent",
        glowClass: "bg-gradient-to-r from-red-400 via-yellow-300 to-blue-400 bg-clip-text text-transparent opacity-80",
        stroke: "rgba(255, 255, 255, 0.4)",
      };
    case "gold":
      return {
        textClass: "bg-gradient-to-b from-amber-100 via-amber-300 to-amber-500 bg-clip-text text-transparent",
        glowClass: "bg-gradient-to-b from-amber-200 via-amber-300 to-amber-400 bg-clip-text text-transparent opacity-80",
        stroke: "rgba(251, 191, 36, 0.55)",
      };
    case "gray":
      return {
        textClass: "text-gray-200",
        glowClass: "text-gray-300/70",
        stroke: "rgba(148, 163, 184, 0.55)",
      };
    case "none":
    default:
      return {
        textClass: "text-white",
        glowClass: "text-white/70",
        stroke: "rgba(255, 255, 255, 0.4)",
      };
  }
}

export function GachaV4Player({ playLabel = "ガチャを回す", playClassName }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [story, setStory] = useState<StoryPlay | null>(null);
  const [gachaId, setGachaId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [canAdvance, setCanAdvance] = useState(false);
  const [isAuto, setIsAuto] = useState(false);
  const [telop, setTelop] = useState<ResultDisplay | null>(null);
  const [cards, setCards] = useState<CardData[] | null>(null);
  const [cardLoading, setCardLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isAutoRef = useRef(false);

  const resetAll = useCallback(() => {
    setStatus("idle");
    setStory(null);
    setGachaId(null);
    setCards(null);
    setCurrentIndex(0);
    setCanAdvance(false);
    setIsAuto(false);
    isAutoRef.current = false;
    setTelop(null);
  }, []);

  const normalizedSequence: StorySequenceWithDisplay[] = useMemo(() => {
    if (!story) return [];

    const seq: StorySequenceWithDisplay[] = [];

    const standby = pickStandby(story.star);
    seq.push({
      order: 1,
      video_id: standby.id,
      category: "standby",
      filename: standby.filename,
      duration_seconds: 0,
      result_display: { type: "none", text: "", color: "none", show_next_button: true },
    });

    const countdown = pickCountdown(story.star);
    seq.push({
      order: 2,
      video_id: countdown.id,
      category: "countdown",
      filename: countdown.filename,
      duration_seconds: 0,
      result_display: { type: "none", text: "", color: "none", show_next_button: true },
    });

    const baseStart = seq.length;
    story.video_sequence.forEach((item, idx) => {
      seq.push({
        ...item,
        order: baseStart + idx + 1,
        result_display: { type: "none", text: "", color: "none", show_next_button: true },
      });
    });

    if (seq.length === 0) return seq;

    const lastIndex = seq.length - 1;
    const hasChase = story.has_chase;

    const shouldSkipContinue = (category: StorySequenceWithDisplay["category"]) =>
      category === "standby" || category === "countdown";

    if (hasChase && seq.length >= 2) {
      const chanceIndex = lastIndex - 1;
      seq[chanceIndex].result_display = {
        type: "tsuigeki_chance",
        text: "追撃チャンス！",
        color: "gold",
        show_next_button: true,
      };
      seq[lastIndex].result_display = {
        type: story.chase_result === "success" ? "tsuigeki_success" : "tsuigeki_fail",
        text: story.chase_result === "success" ? "追撃成功！！" : "追撃失敗...",
        color: story.chase_result === "success" ? "rainbow" : "gray",
        show_next_button: false,
      };
      for (let i = 0; i < chanceIndex; i += 1) {
        if (seq[i].result_display.type === "none" && !shouldSkipContinue(seq[i].category)) {
          seq[i].result_display = { type: "continue", text: "継続！", color: "green", show_next_button: true };
        }
      }
    } else {
      for (let i = 0; i < seq.length; i += 1) {
        const isLast = i === lastIndex;
        if (isLast) {
          if (story.result === "lose") {
            seq[i].result_display = { type: "lose", text: "ハズレ...", color: "red", show_next_button: false };
          } else if (story.result === "big_win") {
            seq[i].result_display = { type: "win", text: "大当たり！！", color: "gold", show_next_button: false };
          } else if (story.result === "jackpot") {
            seq[i].result_display = { type: "win", text: "超大当たり！！！", color: "rainbow", show_next_button: false };
          } else {
            seq[i].result_display = { type: "win", text: "当たり！", color: "gold", show_next_button: false };
          }
        } else if (seq[i].result_display.type === "none" && !shouldSkipContinue(seq[i].category)) {
          seq[i].result_display = { type: "continue", text: "継続！", color: "green", show_next_button: true };
        }
      }
    }

    return seq;
  }, [story]);

  const currentVideo: StorySequenceWithDisplay | null = useMemo(() => {
    return normalizedSequence[currentIndex] ?? null;
  }, [currentIndex, normalizedSequence]);

  const start = useCallback(async () => {
    setStatus("loading");
    setError(null);
    setStory(null);
    setGachaId(null);
    setCards(null);
    setCurrentIndex(0);
    setCanAdvance(false);
    setIsAuto(false);
    isAutoRef.current = false;
    setTelop(null);
    try {
      const res = await fetch("/api/gacha/v4/play", { method: "POST" });
      const data = (await res.json()) as GachaPlayResponse | { error?: string };
      if (!res.ok || "error" in data) throw new Error((data as { error?: string }).error ?? "start failed");

      const storyRes = (data as GachaPlayResponse).story;
      setGachaId((data as GachaPlayResponse).gacha_id);
      setStory(storyRes);
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
    if (!story) return;
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
    void fetchCards(gachaId, story.star);
    setStatus("card");
  }, [currentIndex, fetchCards, gachaId, normalizedSequence.length, story]);

  const handleNext = useCallback(() => {
    if (!story || !canAdvance) return;
    advance();
  }, [advance, canAdvance, story]);

  const handleEnded = useCallback(() => {
    if (!story || !currentVideo) return;
    const rd = currentVideo.result_display;
    setTelop(rd);

    const afterTelop = () => {
      if (rd?.show_next_button && currentIndex < normalizedSequence.length - 1) {
        if (isAutoRef.current) {
          setTimeout(() => advance(), 100);
        } else {
          setCanAdvance(true);
        }
      } else {
        void fetchCards(gachaId, story.star);
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
  }, [advance, currentIndex, currentVideo, fetchCards, gachaId, normalizedSequence.length, story]);

  const handleSkip = useCallback(() => {
    if (!story) return;
    setTelop(null);
    void fetchCards(gachaId, story.star);
    setStatus("card");
    setCanAdvance(false);
  }, [fetchCards, gachaId, story]);

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

  // 全画面中はスクロール抑制＆nav非表示
  useEffect(() => {
    if (status === "playing" || status === "card") {
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
              {(() => {
                const theme = getTelopTheme(telop.color);
                return (
                  <div
                    className="px-6 py-4 text-center"
                    style={{
                      animation: "telop-emerge 0.95s cubic-bezier(0.16, 1.2, 0.36, 1) forwards",
                      transform: "scale(0.05)",
                      opacity: 0,
                    }}
                  >
                    <div className="relative">
                      <span
                        aria-hidden
                        className={`absolute inset-0 translate-y-1 text-6xl font-black tracking-[0.2em] blur-2xl ${theme.glowClass}`}
                      >
                        {telop.text}
                      </span>
                      <span
                        className={`relative font-display text-6xl font-black tracking-[0.2em] drop-shadow-[0_10px_30px_rgba(0,0,0,0.85)] sm:text-7xl md:text-8xl ${theme.textClass}`}
                        style={{ WebkitTextStroke: `2px ${theme.stroke}` }}
                      >
                        {telop.text}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Footer buttons (no counter) */}
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

      {status === "card" && story && (
        <CardReveal story={story} cards={cards} loading={cardLoading} onClose={resetAll} />
      )}

      <style jsx global>{`
        @keyframes telop-emerge {
          0% { transform: scale(0.05) translateZ(-1200px) rotateX(35deg); opacity: 0; filter: blur(18px); }
          35% { opacity: 1; filter: blur(6px); }
          70% { transform: scale(1.18) translateZ(140px) rotateX(-6deg); filter: blur(0); }
          100% { transform: scale(1) translateZ(0) rotateX(0); opacity: 1; filter: blur(0); }
        }
      `}</style>
    </div>
  );
}

type CardRevealProps = {
  story: StoryPlay;
  cards: CardData[] | null;
  loading: boolean;
  onClose: () => void;
};

function CardReveal({ story, cards, loading, onClose }: CardRevealProps) {
  const fallback: CardData = {
    id: "demo-iraira",
    name: "イライラ尊師",
    image_url: "/iraira.png",
    star: story.star,
    serial_number: null,
  };

  const derivedCount = story.result === "lose" ? 0 : story.result === "big_win" ? 2 : story.result === "jackpot" ? 3 : 1;
  const baseList = cards && cards.length ? cards : derivedCount === 0 ? [] : [fallback];
  const list = derivedCount === 0
    ? []
    : baseList.length >= derivedCount
      ? baseList.slice(0, derivedCount)
      : [
          ...baseList,
          ...Array.from({ length: derivedCount - baseList.length }, (_, idx) => ({
            ...fallback,
            id: `${fallback.id}-${idx + baseList.length}`,
          })),
        ];
  const count = list.length;

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-gradient-to-br from-black via-zinc-950 to-black">
      <div className="relative flex w-full max-w-md flex-col items-center gap-6 rounded-[28px] border border-white/15 bg-[rgba(12,10,20,0.92)] p-6 shadow-[0_35px_80px_rgba(0,0,0,0.75)]">
        <p className="text-xs uppercase tracking-[0.4em] text-neon-yellow">Result</p>
        <p className="text-2xl font-display text-white">★{story.star} / {count}枚</p>

        {loading ? (
          <p className="text-sm text-white/80">カードを取得中...</p>
        ) : list.length === 0 ? (
          <p className="text-sm text-white/80">カードはありません</p>
        ) : (
          <div className="w-full space-y-3">
            {list.map((card) => (
              <div key={card.id} className="relative overflow-hidden rounded-[22px] border border-white/15 bg-gradient-to-b from-white/10 to-black/40 shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(250,204,21,0.25),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(236,72,153,0.2),transparent_40%)]" />
                <div className="relative z-10 flex flex-col items-center gap-1 px-4 pb-2 pt-4 text-center">
                  <p className="text-[11px] uppercase tracking-[0.4em] text-amber-200/80">★{card.star}</p>
                  <p className="font-display text-lg text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.7)]">{card.name}</p>
                </div>
                <div className="relative z-10 px-4 pb-4">
                  <Image
                    src={card.image_url}
                    alt={card.name}
                    width={640}
                    height={960}
                    className="w-full object-contain"
                    priority
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex w-full max-w-xs flex-col gap-3">
          <Link
            href="/collection"
            className="rounded-full border border-white/20 bg-white/10 px-5 py-3 text-center text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-lg transition hover:bg-white/20"
          >
            コレクションへ戻る
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-full bg-gradient-to-r from-neon-pink to-neon-yellow px-5 py-3 text-sm font-bold uppercase tracking-[0.25em] text-black shadow-neon"
          >
            もう一度
          </button>
        </div>
      </div>
    </div>
  );
}

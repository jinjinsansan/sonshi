"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
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

type TelopVariant = "continue" | "win" | "big_win" | "jackpot" | "lose" | "chase";
type ParticleMode = "electric" | "burst" | "confetti" | "ash" | "swirl";

const TELOP_IMAGE_BASE = "/telop";

const CONTINUE_TIER_IMAGES = [
  { minStar: 10, file: "continue-5.png" },
  { minStar: 8, file: "continue-4.png" },
  { minStar: 6, file: "continue-3.png" },
  { minStar: 4, file: "continue-2.png" },
  { minStar: 1, file: "continue-1.png" },
];

type TelopConfig = {
  overlayStyle: CSSProperties;
  imageClass: string;
  imageShadow: string;
  flash?: {
    color: string;
    animation: string;
  };
  motionAnimation?: string;
  imageAnimation?: string;
};

type ParticlePreset = {
  modes: ParticleMode[];
  colors: string[];
  count: number;
  gravity: number;
  blendMode: GlobalCompositeOperation;
};

function resolveTelopVariant(telop: ResultDisplay): TelopVariant {
  if (telop.type === "continue") return "continue";
  if (telop.type === "lose" || telop.type === "tsuigeki_fail") return "lose";
  if (telop.type === "tsuigeki_chance") return "chase";
  if (telop.type === "tsuigeki_success") return "jackpot";
  const text = telop.text ?? "";
  if (text.includes("超")) return "jackpot";
  if (text.includes("大当たり")) return "big_win";
  return "win";
}

function getContinueTelopImage(star?: number) {
  const rating = Number.isFinite(star) ? Math.max(1, Math.min(12, Math.floor(star ?? 1))) : 1;
  const tier = CONTINUE_TIER_IMAGES.find((entry) => rating >= entry.minStar) ?? CONTINUE_TIER_IMAGES[CONTINUE_TIER_IMAGES.length - 1];
  return `${TELOP_IMAGE_BASE}/${tier.file}`;
}

function getTelopImagePath(variant: TelopVariant, star?: number) {
  switch (variant) {
    case "continue":
      return getContinueTelopImage(star);
    case "win":
      return `${TELOP_IMAGE_BASE}/win.png`;
    case "big_win":
      return `${TELOP_IMAGE_BASE}/big-win.png`;
    case "jackpot":
      return `${TELOP_IMAGE_BASE}/jackpot.png`;
    case "lose":
      return `${TELOP_IMAGE_BASE}/lose.png`;
    case "chase":
    default:
      return `${TELOP_IMAGE_BASE}/chase.png`;
  }
}

function getTelopConfig(variant: TelopVariant): TelopConfig {
  switch (variant) {
    case "continue":
      return {
        overlayStyle: {
          background:
            "radial-gradient(circle at 20% 30%, rgba(0, 212, 255, 0.22), transparent 50%), radial-gradient(circle at 80% 40%, rgba(0, 255, 255, 0.18), transparent 55%), rgba(0, 0, 0, 0.45)",
        },
        imageClass: "w-[70vw] sm:w-[60vw] md:w-[55vw] max-w-[900px]",
        imageShadow: "drop-shadow(0 0 26px rgba(0, 212, 255, 0.55)) drop-shadow(0 0 50px rgba(0, 212, 255, 0.35))",
        flash: {
          color: "rgba(255, 255, 255, 0.9)",
          animation: "telop-flash 0.16s ease-out",
        },
        motionAnimation: "telop-jitter 0.16s linear 0.65s 6",
      };
    case "win":
      return {
        overlayStyle: {
          background:
            "linear-gradient(180deg, rgba(0, 0, 0, 0.2) 0%, rgba(255, 215, 0, 0.35) 100%), rgba(0, 0, 0, 0.5)",
        },
        imageClass: "w-[75vw] sm:w-[65vw] md:w-[60vw] max-w-[1000px]",
        imageShadow: "drop-shadow(0 0 30px rgba(255, 215, 0, 0.6)) drop-shadow(0 0 60px rgba(255, 140, 0, 0.45))",
        flash: {
          color: "rgba(255, 255, 255, 0.95)",
          animation: "telop-flash 0.2s ease-out",
        },
        motionAnimation: "telop-pulse 1.2s ease-in-out 0.9s 2",
      };
    case "big_win":
      return {
        overlayStyle: {
          background:
            "linear-gradient(180deg, rgba(0, 0, 0, 0.2) 0%, rgba(255, 140, 0, 0.45) 100%), rgba(0, 0, 0, 0.55)",
        },
        imageClass: "w-[80vw] sm:w-[70vw] md:w-[65vw] max-w-[1100px]",
        imageShadow: "drop-shadow(0 0 36px rgba(255, 193, 7, 0.65)) drop-shadow(0 0 70px rgba(255, 112, 67, 0.5))",
        flash: {
          color: "rgba(255, 255, 255, 0.98)",
          animation: "telop-flash 0.22s ease-out",
        },
        motionAnimation: "telop-shake 0.22s ease-in-out 0.6s 5",
      };
    case "jackpot":
      return {
        overlayStyle: {
          background:
            "radial-gradient(circle at 30% 30%, rgba(255, 0, 128, 0.35), transparent 50%), radial-gradient(circle at 70% 40%, rgba(0, 255, 255, 0.25), transparent 55%), linear-gradient(180deg, rgba(0, 0, 0, 0.2) 0%, rgba(255, 215, 0, 0.4) 100%), rgba(0, 0, 0, 0.55)",
        },
        imageClass: "w-[85vw] sm:w-[75vw] md:w-[70vw] max-w-[1200px]",
        imageShadow: "drop-shadow(0 0 42px rgba(255, 255, 255, 0.7)) drop-shadow(0 0 90px rgba(255, 215, 0, 0.6))",
        flash: {
          color: "rgba(255, 255, 255, 0.98)",
          animation: "telop-flash 0.24s ease-out",
        },
        motionAnimation: "telop-shake 0.26s ease-in-out 0.55s 6",
      };
    case "lose":
      return {
        overlayStyle: {
          background:
            "radial-gradient(circle at center, rgba(0, 0, 0, 0.5) 0%, rgba(36, 0, 0, 0.8) 70%), rgba(0, 0, 0, 0.6)",
        },
        imageClass: "w-[70vw] sm:w-[60vw] md:w-[55vw] max-w-[900px]",
        imageShadow: "drop-shadow(0 0 28px rgba(0, 0, 0, 0.85)) drop-shadow(0 0 22px rgba(128, 0, 0, 0.55))",
        flash: {
          color: "rgba(90, 0, 0, 0.85)",
          animation: "telop-flash 0.12s ease-out",
        },
        motionAnimation: "telop-shake 0.18s ease-in-out 0.45s 6",
        imageAnimation: "telop-fade 1.1s ease-out 0.9s 1",
      };
    case "chase":
    default:
      return {
        overlayStyle: {
          background:
            "radial-gradient(circle at 30% 30%, rgba(155, 48, 255, 0.35), transparent 55%), radial-gradient(circle at 70% 60%, rgba(255, 215, 0, 0.25), transparent 60%), rgba(0, 0, 0, 0.5)",
        },
        imageClass: "w-[75vw] sm:w-[65vw] md:w-[60vw] max-w-[1000px]",
        imageShadow: "drop-shadow(0 0 32px rgba(155, 48, 255, 0.6)) drop-shadow(0 0 58px rgba(255, 215, 0, 0.45))",
        flash: {
          color: "rgba(255, 255, 255, 0.9)",
          animation: "telop-flash 0.16s ease-out",
        },
        motionAnimation: "telop-pulse 0.9s ease-in-out 0.6s 2",
      };
  }
}

function getTelopDuration(telop: ResultDisplay) {
  const variant = resolveTelopVariant(telop);
  switch (variant) {
    case "continue":
      return 1500;
    case "win":
      return 3000;
    case "big_win":
      return 4000;
    case "jackpot":
      return 5000;
    case "lose":
      return 2000;
    case "chase":
      return 2000;
    default:
      return 1800;
  }
}

function getParticlePreset(variant: TelopVariant): ParticlePreset {
  switch (variant) {
    case "continue":
      return {
        modes: ["electric"],
        colors: ["#00d4ff", "#00ffff", "#7ce7ff"],
        count: 70,
        gravity: 0,
        blendMode: "lighter",
      };
    case "win":
      return {
        modes: ["burst"],
        colors: ["#ffd700", "#ffb700", "#ff8c00", "#ff6f00"],
        count: 90,
        gravity: 0.05,
        blendMode: "lighter",
      };
    case "big_win":
      return {
        modes: ["burst", "confetti"],
        colors: ["#ffd700", "#ffb74d", "#ff7043", "#ff5252"],
        count: 130,
        gravity: 0.06,
        blendMode: "lighter",
      };
    case "jackpot":
      return {
        modes: ["burst", "confetti", "confetti"],
        colors: ["#ff4d4d", "#ffd93d", "#6cffb7", "#44a3ff", "#c77dff"],
        count: 170,
        gravity: 0.065,
        blendMode: "lighter",
      };
    case "lose":
      return {
        modes: ["ash"],
        colors: ["#c7c7c7", "#a33", "#5f2020"],
        count: 55,
        gravity: 0.12,
        blendMode: "source-over",
      };
    case "chase":
    default:
      return {
        modes: ["swirl", "electric"],
        colors: ["#9b30ff", "#ffd700", "#d4a5ff"],
        count: 85,
        gravity: 0.02,
        blendMode: "lighter",
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
  const [telop, setTelop] = useState<ResultDisplay | null>(null);
  const [cards, setCards] = useState<CardData[] | null>(null);
  const [cardLoading, setCardLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const resetAll = useCallback(() => {
    setStatus("idle");
    setStory(null);
    setGachaId(null);
    setCards(null);
    setCurrentIndex(0);
    setCanAdvance(false);
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
        setCanAdvance(true);
      } else {
        void fetchCards(gachaId, story.star);
        setStatus("card");
      }
    };

    if (rd && rd.type !== "none") {
      setCanAdvance(false);
      const duration = getTelopDuration(rd);
      setTimeout(() => {
        setTelop(null);
        afterTelop();
      }, duration);
    } else {
      afterTelop();
    }
  }, [currentIndex, currentVideo, fetchCards, gachaId, normalizedSequence.length, story]);

  const handleSkip = useCallback(() => {
    if (!story) return;
    setTelop(null);
    void fetchCards(gachaId, story.star);
    setStatus("card");
    setCanAdvance(false);
  }, [fetchCards, gachaId, story]);

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
              setCanAdvance(true);
            }}
            onEnded={handleEnded}
            onError={handleEnded}
          />

          {telop && telop.type !== "none" && <TelopOverlay telop={telop} star={story?.star} />}

          {/* Footer buttons (no counter) */}
          <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-12">
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={handleNext}
                disabled={!canAdvance}
                className="pointer-events-auto group relative h-32 w-32 rounded-full transition-transform active:scale-95 disabled:opacity-50"
              >
                <div className="absolute inset-0 rounded-full border-[5px] border-zinc-500 bg-black shadow-[0_0_18px_rgba(0,0,0,0.6)]" />
                <div className="absolute inset-3 rounded-full border border-zinc-600 bg-gradient-to-b from-zinc-200 via-zinc-400 to-zinc-500 shadow-[inset_0_3px_6px_rgba(255,255,255,0.85),inset_0_-3px_6px_rgba(0,0,0,0.55),0_6px_12px_rgba(0,0,0,0.6)]" />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="relative z-10 font-display text-2xl font-bold uppercase tracking-[0.2em] text-zinc-800 drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]">
                    NEXT
                  </span>
                  <span className="relative z-10 mt-1 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-700">次へ</span>
                </div>
                <div className="absolute inset-3 rounded-full bg-gradient-to-br from-white/50 to-transparent opacity-60 pointer-events-none" />
              </button>

              <button
                type="button"
                onClick={handleSkip}
                className="pointer-events-auto group relative h-32 w-32 rounded-full transition-transform active:scale-95"
              >
                <div className="absolute inset-0 rounded-full border-[5px] border-zinc-500 bg-black shadow-[0_0_18px_rgba(0,0,0,0.6)]" />
                <div className="absolute inset-3 rounded-full border border-zinc-600 bg-gradient-to-b from-zinc-200 via-zinc-400 to-zinc-500 shadow-[inset_0_3px_6px_rgba(255,255,255,0.85),inset_0_-3px_6px_rgba(0,0,0,0.55),0_6px_12px_rgba(0,0,0,0.6)]" />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="relative z-10 font-display text-2xl font-bold uppercase tracking-[0.2em] text-zinc-800 drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]">
                    SKIP
                  </span>
                  <span className="relative z-10 mt-1 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-700">スキップ</span>
                </div>
                <div className="absolute inset-3 rounded-full bg-gradient-to-br from-white/50 to-transparent opacity-60 pointer-events-none" />
              </button>
            </div>
          </div>
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

        @keyframes telop-flash {
          0% { opacity: 0; }
          30% { opacity: 1; }
          100% { opacity: 0; }
        }

        @keyframes telop-jitter {
          0% { transform: translate(0, 0); }
          20% { transform: translate(2px, -2px); }
          40% { transform: translate(-2px, 2px); }
          60% { transform: translate(3px, 0); }
          80% { transform: translate(-3px, -1px); }
          100% { transform: translate(0, 0); }
        }

        @keyframes telop-shake {
          0% { transform: translate(0, 0); }
          25% { transform: translate(-6px, 4px); }
          50% { transform: translate(6px, -4px); }
          75% { transform: translate(-4px, -6px); }
          100% { transform: translate(0, 0); }
        }

        @keyframes telop-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }

        @keyframes telop-glow {
          0%, 100% { opacity: 0.6; filter: blur(16px); }
          50% { opacity: 1; filter: blur(24px); }
        }

        @keyframes telop-fade {
          0% { opacity: 1; }
          100% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}

type TelopOverlayProps = {
  telop: ResultDisplay;
  star?: number;
};

function TelopOverlay({ telop, star }: TelopOverlayProps) {
  const variant = useMemo(() => resolveTelopVariant(telop), [telop]);
  const config = useMemo(() => getTelopConfig(variant), [variant]);
  const imagePath = useMemo(() => getTelopImagePath(variant, star), [star, variant]);
  const motionStyle: CSSProperties | undefined = config.motionAnimation
    ? { animation: config.motionAnimation }
    : undefined;
  const imageStyle: CSSProperties = {
    filter: config.imageShadow,
    animation: config.imageAnimation,
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-[120] flex items-center justify-center" style={config.overlayStyle}>
      {config.flash && (
        <div
          className="absolute inset-0 opacity-0"
          style={{ background: config.flash.color, animation: config.flash.animation }}
        />
      )}
      <TelopParticles variant={variant} />
      <div
        className="relative px-6 py-4 text-center"
        style={{
          animation: "telop-emerge 0.95s cubic-bezier(0.16, 1.2, 0.36, 1) forwards",
          transform: "scale(0.05)",
          opacity: 0,
        }}
      >
        <div className="relative flex items-center justify-center" style={motionStyle}>
          <div className={`relative aspect-[2/1] ${config.imageClass}`}>
            <Image
              src={imagePath}
              alt={telop.text || "telop"}
              fill
              sizes="(max-width: 640px) 80vw, (max-width: 1024px) 70vw, 60vw"
              className="object-contain"
              style={imageStyle}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  ttl: number;
  rotation: number;
  spin: number;
  color: string;
  mode: ParticleMode;
  angle: number;
  radius: number;
  length: number;
};

function initParticle(preset: ParticlePreset, width: number, height: number): Particle {
  const mode = preset.modes[Math.floor(Math.random() * preset.modes.length)];
  const color = preset.colors[Math.floor(Math.random() * preset.colors.length)];

  if (mode === "electric") {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      size: 1 + Math.random() * 2,
      life: 20 + Math.random() * 20,
      ttl: 40,
      rotation: 0,
      spin: 0,
      color,
      mode,
      angle: Math.random() * Math.PI * 2,
      radius: 0,
      length: 20 + Math.random() * 40,
    };
  }

  if (mode === "burst") {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 5;
    return {
      x: width * 0.5,
      y: height * 0.5,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 4 + Math.random() * 8,
      life: 70 + Math.random() * 40,
      ttl: 110,
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.25,
      color,
      mode,
      angle,
      radius: 0,
      length: 0,
    };
  }

  if (mode === "confetti") {
    return {
      x: Math.random() * width,
      y: -Math.random() * height * 0.2,
      vx: (Math.random() - 0.5) * 1.6,
      vy: 1 + Math.random() * 2.4,
      size: 6 + Math.random() * 8,
      life: 120 + Math.random() * 60,
      ttl: 180,
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.2,
      color,
      mode,
      angle: 0,
      radius: 0,
      length: 0,
    };
  }

  if (mode === "ash") {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.6,
      vy: 0.6 + Math.random() * 1.4,
      size: 2 + Math.random() * 3,
      life: 90 + Math.random() * 60,
      ttl: 150,
      rotation: 0,
      spin: 0,
      color,
      mode,
      angle: 0,
      radius: 0,
      length: 0,
    };
  }

  const radius = 40 + Math.random() * 120;
  const angle = Math.random() * Math.PI * 2;
  return {
    x: width * 0.5 + Math.cos(angle) * radius,
    y: height * 0.5 + Math.sin(angle) * radius,
    vx: 0,
    vy: 0,
    size: 3 + Math.random() * 5,
    life: 100 + Math.random() * 80,
    ttl: 160,
    rotation: 0,
    spin: 0.04 + Math.random() * 0.06,
    color,
    mode: "swirl",
    angle,
    radius,
    length: 0,
  };
}

function updateParticle(particle: Particle, preset: ParticlePreset, width: number, height: number) {
  particle.life -= 1;
  if (particle.life <= 0) {
    Object.assign(particle, initParticle(preset, width, height));
    return;
  }

  switch (particle.mode) {
    case "electric":
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.angle += (Math.random() - 0.5) * 0.6;
      break;
    case "burst":
      particle.vy += preset.gravity;
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.rotation += particle.spin;
      break;
    case "confetti":
      particle.vy += preset.gravity * 0.7;
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.rotation += particle.spin;
      break;
    case "ash":
      particle.vy += preset.gravity * 0.3;
      particle.x += particle.vx;
      particle.y += particle.vy;
      break;
    case "swirl":
      particle.angle += particle.spin;
      particle.radius += 0.6;
      particle.x = width * 0.5 + Math.cos(particle.angle) * particle.radius;
      particle.y = height * 0.5 + Math.sin(particle.angle) * particle.radius;
      break;
    default:
      break;
  }

  if (particle.x < -80 || particle.x > width + 80 || particle.y < -80 || particle.y > height + 80) {
    particle.life = 0;
  }
}

function drawParticle(ctx: CanvasRenderingContext2D, particle: Particle) {
  const alpha = Math.max(particle.life / particle.ttl, 0);
  ctx.globalAlpha = alpha;

  if (particle.mode === "electric") {
    ctx.strokeStyle = particle.color;
    ctx.lineWidth = particle.size;
    ctx.beginPath();
    ctx.moveTo(particle.x, particle.y);
    ctx.lineTo(
      particle.x + Math.cos(particle.angle) * particle.length,
      particle.y + Math.sin(particle.angle) * particle.length,
    );
    ctx.stroke();
    return;
  }

  if (particle.mode === "ash" || particle.mode === "swirl") {
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  ctx.save();
  ctx.translate(particle.x, particle.y);
  ctx.rotate(particle.rotation);
  ctx.fillStyle = particle.color;
  const width = particle.size;
  const height = particle.mode === "confetti" ? particle.size * 1.8 : particle.size;
  ctx.fillRect(-width * 0.5, -height * 0.5, width, height);
  ctx.restore();
}

type TelopParticlesProps = {
  variant: TelopVariant;
};

function TelopParticles({ variant }: TelopParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const preset = getParticlePreset(variant);
    const isMobile = window.innerWidth < 768;
    const cap = isMobile ? 50 : 100;
    const count = Math.min(cap, Math.max(20, Math.round(preset.count * (isMobile ? 0.6 : 1))));
    let width = canvas.parentElement?.clientWidth ?? window.innerWidth;
    let height = canvas.parentElement?.clientHeight ?? window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = canvas.parentElement?.clientWidth ?? window.innerWidth;
      height = canvas.parentElement?.clientHeight ?? window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const particles = Array.from({ length: count }, () => initParticle(preset, width, height));
    let frame = 0;
    let rafId = 0;

    const render = () => {
      frame += 1;
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = preset.blendMode;
      for (const particle of particles) {
        updateParticle(particle, preset, width, height);
        drawParticle(ctx, particle);
      }
      ctx.globalCompositeOperation = "source-over";
      if (frame < 600) {
        rafId = requestAnimationFrame(render);
      }
    };

    rafId = requestAnimationFrame(render);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
    };
  }, [variant]);

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />;
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

"use client";

import { motion, useAnimation, type Variants } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const FEATURED_CARDS = [
  {
    name: "尊師ゴールド",
    rarity: "UR",
    style: "realphoto",
    highlight: "+10 連続演出専用",
    image: "/sonshi.jpg",
  },
  {
    name: "尊師アナザーカット",
    rarity: "SSR",
    style: "illustration",
    highlight: "限定ラインナップ",
    image: "/icon.png",
  },
];

const PICKUP_INFO = [
  {
    title: "NEON BURST",
    ticket: "フリー / ベーシック",
    note: "短尺導入演出から急上昇",
  },
  {
    title: "SONSHI RUSH",
    ticket: "エピック以上",
    note: "尊師カットイン＋レア保証",
  },
];

type AnimationPhase = "icon-appear" | "collision" | "icon-fly" | "sonshi-rotate" | "complete";

export function SplashGateway() {
  const router = useRouter();
  const [phase, setPhase] = useState<AnimationPhase>("icon-appear");
  const sonshiSpinControls = useAnimation();

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase("collision"), 500),
      setTimeout(() => setPhase("icon-fly"), 1500),
      setTimeout(() => setPhase("sonshi-rotate"), 1800),
      setTimeout(() => setPhase("complete"), 3800),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (phase === "sonshi-rotate") {
      sonshiSpinControls.set({ rotate: 0 });
      sonshiSpinControls.start({ rotate: 2160, transition: { duration: 1.8, ease: "linear" } });
    } else {
      sonshiSpinControls.set({ rotate: 0 });
    }
  }, [phase, sonshiSpinControls]);

  const heroLines = useMemo(() => ["SONSHI", "GACHA"], []);

  const iconVariants: Variants = {
    appear: {
      opacity: 1,
      scale: 1,
      x: 0,
      y: 0,
      rotate: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
    fly: {
      opacity: 0,
      x: 1200,
      y: -800,
      rotate: 720,
      transition: { duration: 1, ease: "easeIn" },
    },
  };

  const sonshiVariants: Variants = {
    offscreen: {
      x: -1200,
      opacity: 0,
      rotate: 0,
    },
    collision: {
      x: 0,
      opacity: 1,
      rotate: 0,
      transition: { duration: 0.8, ease: [0.6, 0.01, 0.05, 0.95] as const },
    },
    rotate: {
      x: 0,
      opacity: 1,
      scale: 1.15,
    },
    complete: {
      scale: 1,
      transition: { duration: 0.3, ease: "easeOut" },
    },
  };

  const getSonshiAnimation = () => {
    if (phase === "icon-appear") return "offscreen";
    if (phase === "collision" || phase === "icon-fly") return "collision";
    if (phase === "sonshi-rotate") return "rotate";
    return "complete";
  };

  const getIconAnimation = () => {
    if (phase === "icon-fly" || phase === "sonshi-rotate" || phase === "complete") return "fly";
    return "appear";
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-hall-background text-white">
      <div className="pointer-events-none absolute inset-0 opacity-50">
        <div className="absolute inset-0 bg-hall-grid opacity-35" />
        <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-neon-pink/30 blur-[220px]" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-neon-blue/30 blur-[200px]" />
      </div>
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-6 py-10">
        {phase !== "complete" && (
          <div className="relative flex h-64 w-64 items-center justify-center">
            {/* SONSHI Image */}
            <motion.div
              className="absolute"
              initial="offscreen"
              animate={getSonshiAnimation()}
              variants={sonshiVariants}
            >
              <motion.div animate={sonshiSpinControls} className="origin-center">
                <Image
                  src="/sonshi.jpg"
                  alt="SONSHI"
                  width={256}
                  height={256}
                  priority
                  className="h-64 w-64 rounded-3xl object-cover shadow-2xl"
                />
              </motion.div>
            </motion.div>

            {/* Icon Image */}
            <motion.div
              className="absolute z-10"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={getIconAnimation()}
              variants={iconVariants}
            >
              <Image
                src="/icon-large.png"
                alt="Icon"
                width={200}
                height={200}
                priority
                className="h-48 w-48 rounded-2xl object-cover shadow-2xl neon-crest"
              />
            </motion.div>
          </div>
        )}

        {/* Loading Text / Hero */}
        {phase !== "complete" ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 text-xs uppercase tracking-[0.6em] text-neon-yellow"
          >
            LOADING
          </motion.p>
        ) : (
          <motion.div
            className="mt-0 w-full max-w-sm space-y-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-4">
                <div className="neon-crest">
                  <Image
                    src="/icon.png"
                    alt="SONSHI GACHA"
                    width={128}
                    height={128}
                    className="h-28 w-28 rounded-3xl object-cover shadow-[0_0_35px_rgba(255,255,255,0.25)]"
                  />
                </div>
                <p className="text-[11px] uppercase tracking-[0.55em] text-neon-blue/80">TAP TO ENTER</p>
              </div>
            <div className="space-y-3">
                <div className="font-display text-6xl leading-tight text-white drop-shadow-[0_0_25px_rgba(255,255,255,0.35)]">
                  {heroLines.map((line) => (
                    <div key={line}>{line}</div>
                  ))}
                </div>
                <p className="text-sm text-white/80">尊師と仲間たちのガチャカードをコレクションしよう</p>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="h-14 w-full rounded-full bg-[#ffe347] font-display text-sm uppercase tracking-[0.4em] text-white shadow-[0_0_28px_rgba(255,255,0,0.45)]"
              >
                タップして入場
              </button>
              <button
                type="button"
                onClick={() => router.push("/register")}
                className="h-12 w-full rounded-full border border-white/20 text-[11px] uppercase tracking-[0.45em] text-white/80 transition hover:border-neon-blue hover:text-white"
              >
                新規登録はこちら
              </button>
            </div>

            <div className="space-y-4 rounded-3xl border border-white/10 bg-black/30 p-5 text-left">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.4em] text-neon-yellow">NEW CARDS</p>
                <span className="text-[11px] uppercase tracking-[0.35em] text-white/60">更新中</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {FEATURED_CARDS.map((card) => (
                  <div key={card.name} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/40 p-3">
                    <Image
                      src={card.image}
                      alt={card.name}
                      width={64}
                      height={64}
                      className="h-14 w-14 rounded-2xl object-cover"
                    />
                    <div>
                      <p className="font-display text-base text-white">{card.name}</p>
                      <p className="text-xs text-neon-blue">
                        {card.rarity} · {card.style}
                      </p>
                      <p className="text-[11px] text-white/60">{card.highlight}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 rounded-3xl border border-white/10 bg-black/20 p-5 text-left">
              <p className="text-xs uppercase tracking-[0.4em] text-neon-yellow">PICK UP</p>
              <div className="space-y-3">
                {PICKUP_INFO.map((info) => (
                  <div key={info.title} className="rounded-2xl border border-white/10 bg-black/40 p-4">
                    <div className="flex items-center justify-between text-sm text-white">
                      <span className="font-display text-lg">{info.title}</span>
                      <span className="text-[11px] uppercase tracking-[0.35em] text-neon-blue">{info.ticket}</span>
                    </div>
                    <p className="mt-2 text-xs text-white/70">{info.note}</p>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => router.push("/gacha")}
                className="w-full rounded-full border border-white/20 py-3 text-[11px] uppercase tracking-[0.4em] text-white/80 transition hover:border-neon-blue hover:text-white"
              >
                ガチャラインナップを見る
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

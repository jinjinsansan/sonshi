"use client";

import { motion, type Variants } from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type AnimationPhase = "icon-appear" | "collision" | "icon-fly" | "sonshi-rotate" | "complete";

export function SplashGateway() {
  const router = useRouter();
  const [phase, setPhase] = useState<AnimationPhase>("icon-appear");

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase("collision"), 500),
      setTimeout(() => setPhase("icon-fly"), 1500),
      setTimeout(() => setPhase("sonshi-rotate"), 1800),
      setTimeout(() => setPhase("complete"), 3800),
      setTimeout(() => router.push("/login"), 4000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [router]);

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
      rotate: 1800,
      scale: 1.1,
      transition: { duration: 2, ease: "easeInOut" },
    },
    complete: {
      rotate: 1800,
      scale: 1,
      transition: { duration: 0.2, ease: "easeOut" },
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
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-6 py-12">
        <div className="relative flex h-64 w-64 items-center justify-center">
          {/* SONSHI Image */}
          <motion.div
            className="absolute"
            initial="offscreen"
            animate={getSonshiAnimation()}
            variants={sonshiVariants}
          >
            <Image
              src="/sonshi.jpg"
              alt="SONSHI"
              width={256}
              height={256}
              priority
              className="h-64 w-64 rounded-3xl object-cover shadow-2xl"
            />
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

        {/* Loading Text */}
        {phase !== "complete" && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 text-xs uppercase tracking-[0.6em] text-neon-yellow"
          >
            LOADING
          </motion.p>
        )}
      </div>
    </div>
  );
}

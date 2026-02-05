"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Phase = "splash" | "title";

export function SplashGateway() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("splash");

  useEffect(() => {
    const timer = setTimeout(() => setPhase("title"), 2000);
    return () => clearTimeout(timer);
  }, []);

  const titleLines = useMemo(() => ["SONSHI", "GACHA"], []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-hall-background text-white">
      <div className="pointer-events-none absolute inset-0 opacity-50">
        <div className="absolute inset-0 bg-hall-grid opacity-35" />
        <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-neon-pink/30 blur-[220px]" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-neon-blue/30 blur-[200px]" />
      </div>
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-8 px-6 py-12">
        <AnimatePresence mode="wait">
          {phase === "splash" ? (
            <motion.section
              key="splash"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center gap-6"
            >
              <motion.div
                className="neon-crest"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Image
                  src="/icon.png"
                  alt="SONSHI GACHA"
                  width={96}
                  height={96}
                  priority
                  className="h-24 w-24 rounded-2xl object-cover"
                />
              </motion.div>
              <motion.p
                className="text-xs uppercase tracking-[0.6em] text-zinc-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
              >
                LOADING
              </motion.p>
            </motion.section>
          ) : (
            <motion.section
              key="title"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="flex w-full flex-col items-center gap-8 text-center"
            >
              <div className="space-y-5">
                <div className="flex flex-col items-center gap-4">
                  <div className="neon-crest">
                    <Image
                      src="/icon.png"
                      alt="SONSHI GACHA"
                      width={80}
                      height={80}
                      className="h-20 w-20 rounded-2xl object-cover"
                    />
                  </div>
                  <p className="text-xs uppercase tracking-[0.6em] text-neon-yellow">Tap to Enter</p>
                </div>
                <div className="font-display text-4xl leading-tight">
                  {titleLines.map((line) => (
                    <motion.div
                      key={line}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      {line}
                    </motion.div>
                  ))}
                </div>
                <p className="text-sm text-zinc-300">
                  ネオン煌めくパチスロホールで、連続演出ガチャに挑戦するデジタルカード体験。
                </p>
              </div>
              <div className="flex w-full flex-col gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="h-14 w-full rounded-full bg-gradient-to-r from-neon-pink to-neon-yellow font-display text-sm uppercase tracking-[0.35em] text-black shadow-neon"
                >
                  タップして入場
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/register")}
                  className="h-12 w-full rounded-full border border-white/15 text-xs uppercase tracking-[0.35em] text-white/80 transition hover:border-neon-blue hover:text-white"
                >
                  新規登録はこちら
                </button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

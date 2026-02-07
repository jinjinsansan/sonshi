"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type VideoStep = {
  title: string;
  file: string;
};

const DEMO_VIDEOS: VideoStep[] = [
  { title: "尊師チャンスロゴ", file: "尊師チャンスロゴ.mp4" },
  { title: "超激アツ", file: "超激アツ.mp4" },
  { title: "天国モード突入", file: "天国モード突入.mp4" },
  { title: "確定イエーイ", file: "確定イエーイ.mp4" },
  { title: "確定", file: "確定.mp4" },
];

const DEMO_CARD = {
  name: "デモカード: 尊師",
  rarity: "UR",
  imageUrl: "/iraira.png",
};

export function MultiGachaDevFive() {
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const currentVideo = useMemo(() => DEMO_VIDEOS[index], [index]);

  const handleStart = () => {
    setStarted(true);
    setIndex(0);
    setFinished(false);
  };

  const handleAdvance = () => {
    if (index < DEMO_VIDEOS.length - 1) {
      setIndex((v) => v + 1);
    } else {
      setFinished(true);
    }
  };

  useEffect(() => {
    if (!started || finished || !videoRef.current) return;
    videoRef.current.currentTime = 0;
    const playPromise = videoRef.current.play();
    if (playPromise) {
      playPromise.catch(() => {
        /* ignore play block; user can tap controls */
      });
    }
  }, [started, finished, index]);

  if (!started) {
    return (
      <div className="rounded-3xl border border-white/10 bg-black/40 p-8 text-center shadow-panel-inset">
        <div className="space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">DEV DEMO</p>
            <h2 className="mt-1 font-display text-2xl text-white">5連デモ（音声付）</h2>
            <p className="mt-2 text-sm text-white/70">ボタンを押すと5本の4秒映像が順番に再生されます</p>
          </div>
          <button
            type="button"
            onClick={handleStart}
            className="inline-flex items-center justify-center rounded-full bg-neon-pink px-8 py-3 text-sm font-bold uppercase tracking-[0.3em] text-black shadow-[0_10px_30px_rgba(255,45,149,0.4)] hover:translate-y-[-1px] active:translate-y-[1px]"
          >
            5連デモを開始
          </button>
        </div>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="rounded-3xl border border-white/10 bg-black/60 p-8 text-center shadow-panel-inset">
        <div className="space-y-6 text-white">
          <p className="text-xs uppercase tracking-[0.5em] text-white/60">RESULT</p>
          <h3 className="text-xl font-semibold">獲得カード</h3>
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-2xl border border-white/20 bg-white/5 p-4">
              <img src={DEMO_CARD.imageUrl} alt={DEMO_CARD.name} className="h-40 w-32 object-contain" />
            </div>
            <p className="text-lg font-bold">{DEMO_CARD.name}</p>
            <span className="rounded-full border border-white/30 px-4 py-1 text-xs tracking-[0.3em]">★UR</span>
          </div>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setFinished(false)}
              className="rounded-full border border-white/20 px-6 py-2 text-xs uppercase tracking-[0.3em] hover:bg-white/10"
            >
              もう一度見る
            </button>
            <button
              type="button"
              onClick={() => {
                setStarted(false);
                setFinished(false);
                setIndex(0);
              }}
              className="rounded-full bg-white px-6 py-2 text-xs font-semibold text-black hover:bg-white/90"
            >
              最初に戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/80 p-4 shadow-xl">
      <div className="mb-3 flex items-center justify-between text-xs text-white/70">
        <span>{currentVideo.title}</span>
        <span>{index + 1} / {DEMO_VIDEOS.length}</span>
      </div>

      <div className="relative aspect-[9/16] w-full overflow-hidden rounded-2xl border border-white/10 bg-black">
        <video
          key={currentVideo.file}
          ref={videoRef}
          src={`/dev-videos/${encodeURIComponent(currentVideo.file)}`}
          className="h-full w-full object-cover"
          playsInline
          autoPlay
          controls
          muted={false}
          onEnded={handleAdvance}
          onError={handleAdvance}
        />
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-white/60">
        <div className="flex items-center gap-2">
          {DEMO_VIDEOS.map((_, i) => (
            <div
              key={i}
              className={`h-2 w-6 rounded-full ${i === index ? "bg-neon-pink" : "bg-white/20"}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAdvance}
            className="rounded-full border border-white/30 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white hover:bg-white/10"
          >
            Next
          </button>
          <button
            type="button"
            onClick={() => setFinished(true)}
            className="rounded-full border border-white/30 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white hover:bg-white/10"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}

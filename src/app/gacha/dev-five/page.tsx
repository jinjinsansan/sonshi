import { redirect } from "next/navigation";
import { MultiGachaDevFive } from "@/components/gacha/multi-gacha-dev-five";
import { getServerEnv } from "@/lib/env";

export const metadata = {
  title: "デモ5連ガチャ（音声付）",
};

export default function DevFivePage() {
  const { GACHA_V2_ENABLED } = getServerEnv();
  if (GACHA_V2_ENABLED) {
    redirect("/gacha");
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-white/60">DEV ONLY</p>
        <h1 className="mt-1 font-display text-3xl text-white">開発用 5連デモ</h1>
        <p className="mt-2 text-sm text-white/60">4秒映像5本 + 最後にカード表示（音声付き）</p>
      </div>

      <MultiGachaDevFive />
    </div>
  );
}

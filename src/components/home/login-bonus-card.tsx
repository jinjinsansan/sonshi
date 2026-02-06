import Image from "next/image";
import { Ticket } from "lucide-react";
import type { LoginBonusState } from "@/hooks/use-login-bonus";

type LoginBonusCardProps = {
  state: LoginBonusState;
  claiming: boolean;
  onClaim: () => Promise<void>;
};

export function LoginBonusCard({ state, claiming, onClaim }: LoginBonusCardProps) {
  const claimedLabel = state.claimed || state.status === "success" ? "受取済" : claiming ? "付与中..." : "受け取る";

  return (
    <div className="slot-panel flex items-center justify-between gap-5 px-5 py-4">
      <div className="flex flex-1 items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neon-yellow/20 text-neon-yellow">
          <Ticket className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <div>
            <p className="text-[0.55rem] uppercase tracking-[0.5em] text-neon-yellow">LOGIN BONUS</p>
            <h3 className="font-display text-lg text-white">本日のフリーチケット</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-display text-white">+1</p>
            <p className="text-[0.7rem] text-zinc-400">FREE TICKET</p>
          </div>
          {state.nextResetAt && (
            <p className="text-[0.65rem] text-zinc-500">
              次回受取: {new Date(state.nextResetAt).toLocaleString("ja-JP")}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative h-16 w-28">
          <Image
            src="/ticket-illustration.svg"
            alt="Free ticket"
            fill
            sizes="112px"
            className="object-contain drop-shadow-[0_15px_25px_rgba(0,0,0,0.5)]"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            void onClaim();
          }}
          disabled={claiming || state.claimed}
          className="rounded-full bg-gradient-to-r from-neon-pink to-neon-yellow px-4 py-2 text-[0.6rem] uppercase tracking-[0.45em] text-black shadow-neon disabled:opacity-60"
        >
          {claimedLabel}
        </button>
      </div>

      {state.status === "error" && (
        <p className="mt-3 text-sm text-red-300">{state.message ?? "エラーが発生しました"}</p>
      )}
      {state.status === "success" && (
        <p className="mt-3 text-sm text-neon-blue">{state.message ?? "付与しました"}</p>
      )}
    </div>
  );
}

import { Ticket } from "lucide-react";
import type { LoginBonusState } from "@/hooks/use-login-bonus";

type LoginBonusCardProps = {
  state: LoginBonusState;
  claiming: boolean;
  onClaim: () => Promise<void>;
};

export function LoginBonusCard({ state, claiming, onClaim }: LoginBonusCardProps) {
  const buttonLabel = state.claimed || state.status === "success"
    ? "受取済"
    : claiming
      ? "付与中..."
      : "ログインボーナスを受け取る";

  return (
    <div className="slot-panel flex flex-col gap-3 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neon-yellow/20 text-neon-yellow">
          <Ticket className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[0.55rem] uppercase tracking-[0.5em] text-neon-yellow">LOGIN BONUS</p>
          <h3 className="font-display text-base text-white">本日のフリーチケット</h3>
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-display text-white">+1</p>
          <p className="text-[0.7rem] text-zinc-400">FREE TICKET</p>
        </div>
        <button
          type="button"
          onClick={() => {
            void onClaim();
          }}
          disabled={claiming || state.claimed}
          className="rounded-full border border-white/20 px-4 py-1.5 text-[0.6rem] uppercase tracking-[0.4em] text-white transition hover:border-neon-yellow disabled:opacity-50"
        >
          {buttonLabel}
        </button>
      </div>

      {state.nextResetAt && (
        <p className="text-[0.6rem] text-zinc-500">
          次回受取: {new Date(state.nextResetAt).toLocaleString("ja-JP")}
        </p>
      )}

      {state.status === "error" && (
        <p className="text-[0.7rem] text-red-300">{state.message ?? "エラーが発生しました"}</p>
      )}
      {state.status === "success" && (
        <p className="text-[0.7rem] text-neon-blue">{state.message ?? "付与しました"}</p>
      )}
    </div>
  );
}

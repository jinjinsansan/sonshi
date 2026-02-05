import { create } from "zustand";

export type TicketCode = "free" | "basic" | "epic" | "premium" | "ex";

type TicketState = {
  balances: Record<TicketCode, number>;
  setBalance: (code: TicketCode, value: number) => void;
  increment: (code: TicketCode, amount?: number) => void;
  consume: (code: TicketCode, amount?: number) => boolean;
  reset: () => void;
};

const defaultBalances = (): Record<TicketCode, number> => ({
  free: 0,
  basic: 0,
  epic: 0,
  premium: 0,
  ex: 0,
});

export const useTicketStore = create<TicketState>((set, get) => ({
  balances: defaultBalances(),
  setBalance: (code, value) =>
    set((state) => ({ balances: { ...state.balances, [code]: Math.max(0, value) } })),
  increment: (code, amount = 1) =>
    set((state) => ({
      balances: {
        ...state.balances,
        [code]: state.balances[code] + amount,
      },
    })),
  consume: (code, amount = 1) => {
    const current = get().balances[code];
    if (current < amount) return false;
    set((state) => ({
      balances: {
        ...state.balances,
        [code]: state.balances[code] - amount,
      },
    }));
    return true;
  },
  reset: () => set({ balances: defaultBalances() }),
}));

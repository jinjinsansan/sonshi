"use client";

import { useCallback, useEffect, useState } from "react";

export type LoginBonusState = {
  status: "idle" | "loading" | "ready" | "success" | "error" | "claimed";
  message?: string;
  nextResetAt?: string;
  quantity: number;
  claimed: boolean;
};

const initialState: LoginBonusState = {
  status: "idle",
  quantity: 0,
  claimed: false,
};

export function useLoginBonus() {
  const [state, setState] = useState<LoginBonusState>(initialState);
  const [claiming, setClaiming] = useState(false);

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, status: "loading" }));
    try {
      const response = await fetch("/api/tickets/bonus");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error ?? "取得に失敗しました");
      }
      setState({
        status: data.claimed ? "claimed" : "ready",
        nextResetAt: data.nextResetAt,
        quantity: data.quantity ?? 0,
        claimed: Boolean(data.claimed),
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        status: "error",
        message: error instanceof Error ? error.message : "予期せぬエラー",
      }));
    }
  }, []);

  const claim = useCallback(async () => {
    setClaiming(true);
    try {
      const response = await fetch("/api/tickets/bonus", { method: "POST" });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error ?? "取得に失敗しました");
      }
      setState((prev) => ({
        status: "success",
        message: data.message,
        nextResetAt: data.nextResetAt,
        quantity: data.quantity ?? prev.quantity,
        claimed: true,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        status: "error",
        message: error instanceof Error ? error.message : "予期せぬエラー",
      }));
    } finally {
      setClaiming(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { state, claiming, claim, refresh } as const;
}

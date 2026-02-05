"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { MainAppSnapshot } from "@/lib/app/main-app";

type MainAppContextValue = {
  snapshot: MainAppSnapshot;
  refresh: () => Promise<void>;
};

const MainAppContext = createContext<MainAppContextValue | null>(null);

type MainAppProviderProps = {
  initialSnapshot: MainAppSnapshot;
  children: ReactNode;
};

export function MainAppProvider({ initialSnapshot, children }: MainAppProviderProps) {
  const [snapshot, setSnapshot] = useState<MainAppSnapshot>(initialSnapshot);
  const refreshingRef = useRef(false);

  const refresh = useCallback(async () => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    try {
      const response = await fetch("/api/main-app", { cache: "no-store" });
      if (!response.ok) {
        return;
      }
      const data = (await response.json()) as MainAppSnapshot;
      setSnapshot(data);
    } catch {
      // ignore transient errors
    } finally {
      refreshingRef.current = false;
    }
  }, []);

  useEffect(() => {
    const focusHandler = () => refresh();
    window.addEventListener("focus", focusHandler);
    const interval = setInterval(() => refresh(), 60_000);
    return () => {
      window.removeEventListener("focus", focusHandler);
      clearInterval(interval);
    };
  }, [refresh]);

  const value = useMemo(() => ({ snapshot, refresh }), [snapshot, refresh]);

  return <MainAppContext.Provider value={value}>{children}</MainAppContext.Provider>;
}

export function useMainApp() {
  const ctx = useContext(MainAppContext);
  if (!ctx) {
    throw new Error("useMainApp must be used within MainAppProvider");
  }
  return ctx;
}

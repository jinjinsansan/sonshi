"use client";

import { useLoginBonus } from "@/hooks/use-login-bonus";
import { LoginBonusCard } from "./login-bonus-card";

export function LoginBonusCardClient() {
  const loginBonus = useLoginBonus();

  return (
    <LoginBonusCard
      state={loginBonus.state}
      claiming={loginBonus.claiming}
      onClaim={loginBonus.claim}
    />
  );
}

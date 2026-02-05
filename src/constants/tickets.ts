export type TicketCode = "free" | "basic" | "epic" | "premium" | "ex";

export const TICKET_THEMES: Record<
  TicketCode,
  { gradient: string; badge: string; accent?: string }
> = {
  free: {
    gradient: "from-neon-blue/35 to-hall-background",
    badge: "text-neon-blue",
  },
  basic: {
    gradient: "from-neon-yellow/30 to-hall-background",
    badge: "text-neon-yellow",
  },
  epic: {
    gradient: "from-neon-pink/30 to-hall-background",
    badge: "text-neon-pink",
  },
  premium: {
    gradient: "from-neon-purple/35 to-hall-background",
    badge: "text-neon-purple",
  },
  ex: {
    gradient: "from-glow-green/30 to-hall-background",
    badge: "text-glow-green",
  },
};

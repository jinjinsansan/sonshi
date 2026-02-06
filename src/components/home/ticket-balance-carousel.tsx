"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { TicketBalanceItem } from "@/lib/utils/tickets";
import type { TicketCode } from "@/constants/tickets";
import { cn } from "@/lib/utils/cn";

type TicketBalanceCarouselProps = {
  tickets: TicketBalanceItem[];
};

function formatTicketCode(code: string) {
  return code.toUpperCase();
}

const TICKET_CARD_STYLES: Record<
  TicketCode,
  {
    gradient: string;
    badge: string;
    label: string;
    illustration: string;
  }
> = {
  free: {
    gradient: "from-[#061430] via-[#0c1f49] to-[#05060e]",
    badge: "text-neon-blue",
    label: "LOGIN BONUS",
    illustration: "/ticket-illustration.svg",
  },
  basic: {
    gradient: "from-[#2a1a02] via-[#3f2607] to-[#0b0502]",
    badge: "text-amber-200",
    label: "1階 FLOOR",
    illustration: "/ticket-illustration-basic.svg",
  },
  epic: {
    gradient: "from-[#2b0014] via-[#430029] to-[#070008]",
    badge: "text-rose-200",
    label: "2階 FLOOR",
    illustration: "/ticket-illustration-epic.svg",
  },
  premium: {
    gradient: "from-[#1c0030] via-[#2f0150] to-[#05000a]",
    badge: "text-purple-200",
    label: "3階 FLOOR",
    illustration: "/ticket-illustration-premium.svg",
  },
  ex: {
    gradient: "from-[#032415] via-[#064030] to-[#010b06]",
    badge: "text-emerald-200",
    label: "VIP FLOOR",
    illustration: "/ticket-illustration-vip.svg",
  },
};

function getTicketTheme(code: string) {
  const typed = code as TicketCode;
  return TICKET_CARD_STYLES[typed] ?? {
    gradient: "from-[#161320] to-[#050107]",
    badge: "text-zinc-300",
    label: "TICKET",
    illustration: "/ticket-illustration.svg",
  };
}

export function TicketBalanceCarousel({ tickets }: TicketBalanceCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  const scrollByAmount = useCallback((direction: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;
    const offset = direction === "left" ? -220 : 220;
    el.scrollBy({ left: offset, behavior: "smooth" });
  }, []);

  const handleWheel = useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      const el = scrollerRef.current;
      if (!el) return;
      const isMostlyVertical = Math.abs(event.deltaY) > Math.abs(event.deltaX);
      if (!isMostlyVertical) return;
      event.preventDefault();
      el.scrollBy({ left: event.deltaY, behavior: "auto" });
    },
    []
  );

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateScrollState();
    const handleScroll = () => updateScrollState();
    el.addEventListener("scroll", handleScroll, { passive: true });

    const resizeObserver = new ResizeObserver(() => updateScrollState());
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener("scroll", handleScroll);
      resizeObserver.disconnect();
    };
  }, [updateScrollState]);

  useEffect(() => {
    updateScrollState();
  }, [tickets, updateScrollState]);

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        className="flex snap-x gap-3 overflow-x-auto pb-2 [scrollbar-width:auto] [-ms-overflow-style:auto]"
        onWheel={handleWheel}
      >
        {tickets.map((ticket) => {
          const theme = getTicketTheme(ticket.code);
          return (
            <div
              key={ticket.code}
              className={cn(
                "relative flex min-h-[120px] min-w-[200px] snap-start items-center justify-between overflow-hidden rounded-3xl border border-white/12 bg-gradient-to-br px-4 py-3",
                theme.gradient
              )}
            >
              <div className="flex flex-col gap-1">
                <p className={cn("text-[0.55rem] uppercase tracking-[0.5em]", theme.badge)}>
                  {theme.label}
                </p>
                <p className="text-xs text-white/80">{ticket.name.toUpperCase()}</p>
                <p className="text-3xl font-display text-white">{ticket.quantity}</p>
                <p className="text-[0.65rem] text-white/70">{formatTicketCode(ticket.code)} TICKET</p>
              </div>
              <div className="relative h-16 w-28">
                <Image
                  src={theme.illustration}
                  alt={`${ticket.name} ticket`}
                  fill
                  sizes="112px"
                  className="object-contain drop-shadow-[0_18px_25px_rgba(0,0,0,0.45)]"
                />
              </div>
            </div>
          );
        })}
      </div>

      {canScrollLeft && (
        <button
          type="button"
          aria-label="前のチケット"
          className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/60 p-1.5 text-white shadow-lg"
          onClick={() => scrollByAmount("left")}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      {canScrollRight && (
        <button
          type="button"
          aria-label="次のチケット"
          className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/60 p-1.5 text-white shadow-lg"
          onClick={() => scrollByAmount("right")}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

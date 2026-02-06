"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { TicketBalanceItem } from "@/lib/utils/tickets";
import { TICKET_THEMES, type TicketCode } from "@/constants/tickets";
import { cn } from "@/lib/utils/cn";

type TicketBalanceCarouselProps = {
  tickets: TicketBalanceItem[];
};

function formatTicketCode(code: string) {
  return code.toUpperCase();
}

function getTicketTheme(code: string) {
  return TICKET_THEMES[code as TicketCode] ?? {
    gradient: "from-white/10 to-hall-background",
    badge: "text-zinc-400",
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
                "slot-panel min-w-[160px] snap-start overflow-hidden px-4 py-4",
                theme.gradient
              )}
            >
              <p className={cn("text-[0.55rem] tracking-[0.4em]", theme.badge)}>
                {formatTicketCode(ticket.code)}
              </p>
              <p className="mt-4 text-3xl font-semibold text-white">{ticket.quantity}</p>
              <p className="text-sm text-zinc-300">{ticket.name}</p>
            </div>
          );
        })}
      </div>

      {canScrollLeft && (
        <button
          type="button"
          aria-label="前のチケット"
          className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-hall-panel/95 p-1.5 text-white shadow-lg"
          onClick={() => scrollByAmount("left")}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      {canScrollRight && (
        <button
          type="button"
          aria-label="次のチケット"
          className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-hall-panel/95 p-1.5 text-white shadow-lg"
          onClick={() => scrollByAmount("right")}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

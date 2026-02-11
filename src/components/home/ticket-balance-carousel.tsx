"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { TicketBalanceItem } from "@/lib/utils/tickets";
import type { TicketCode } from "@/constants/tickets";
import { cn } from "@/lib/utils/cn";

type TicketBalanceCarouselProps = {
  tickets: TicketBalanceItem[];
};

const TICKET_CARD_META: Record<
  TicketCode,
  {
    title: string;
    subtitle: string;
    accent: string;
  }
> = {
  free: { title: "フリーチケット", subtitle: "FREE TICKET", accent: "text-neon-blue" },
  basic: { title: "ベーシックチケット", subtitle: "BASIC TICKET", accent: "text-amber-200" },
  epic: { title: "エピックチケット", subtitle: "EPIC TICKET", accent: "text-rose-200" },
  premium: { title: "プレミアムチケット", subtitle: "PREMIUM TICKET", accent: "text-purple-200" },
  ex: { title: "EXチケット", subtitle: "EX TICKET", accent: "text-emerald-200" },
};

function getTicketMeta(code: string) {
  const typed = code as TicketCode;
  return (
    TICKET_CARD_META[typed] ?? {
      title: "TICKET",
      subtitle: "FLOOR",
      accent: "text-white",
    }
  );
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
          const meta = getTicketMeta(ticket.code);
          return (
            <div
              key={ticket.code}
              className="flex min-h-[72px] min-w-[180px] snap-start items-center justify-between rounded-2xl border border-white/10 bg-black/60 px-4 py-3"
            >
              <div className="space-y-1">
                <p className={cn("text-[0.55rem] uppercase tracking-[0.45em] text-white/50", meta.accent)}>
                  {meta.subtitle}
                </p>
                <p className="text-base font-display text-white">{meta.title}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-display text-white">{ticket.quantity}</p>
                <p className="text-[0.65rem] text-white/60">枚</p>
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

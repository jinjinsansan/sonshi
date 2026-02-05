"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Crown, Images, Sparkles, Share2, Menu as MenuIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const iconMap = {
  home: Crown,
  collection: Images,
  gacha: Sparkles,
  social: Share2,
  menu: MenuIcon,
} as const;

export type TabBarIconKey = keyof typeof iconMap;

export type TabBarItem = {
  label: string;
  href: string;
  icon: TabBarIconKey;
  primary?: boolean;
};

type TabBarProps = {
  items: TabBarItem[];
};

export function TabBar({ items }: TabBarProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-4 z-50 flex justify-center">
      <div className="neon-tabbar flex w-[min(480px,calc(100%-2rem))] items-center gap-3 rounded-full px-4 py-2 text-sm backdrop-blur-2xl">
        {items.map((item) => {
          const Icon = iconMap[item.icon];
          if (!Icon) return null;
          const isActive = matchPath(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "tab-bar-item flex flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-1 text-[0.7rem] transition",
                item.primary && "tab-bar-primary -mt-5 shadow-neon",
                isActive && !item.primary && "tab-bar-active",
                !isActive && !item.primary && "text-zinc-400"
              )}
            >
              <Icon className={cn("h-5 w-5", item.primary ? "text-black" : isActive ? "text-neon-blue" : "text-zinc-500")} />
              <span className={cn(item.primary && "font-display text-[0.55rem] uppercase tracking-[0.3em]")}>{
                item.label
              }</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function matchPath(current: string | null, target: string) {
  if (!current) return false;
  if (target === "/") {
    return current === "/";
  }
  return current === target || current.startsWith(`${target}/`);
}

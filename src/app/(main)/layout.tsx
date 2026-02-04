import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { TabBar, type TabBarItem } from "@/components/layout/tab-bar";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const tabs: TabBarItem[] = [
  { label: "HOME", href: "/home", icon: "home" },
  { label: "CARD", href: "/collection", icon: "collection" },
  { label: "GACHA", href: "/gacha", icon: "gacha", primary: true },
  { label: "SOCIAL", href: "/social", icon: "social" },
  { label: "MENU", href: "/menu", icon: "menu" },
];

type MainLayoutProps = {
  children: ReactNode;
};

export default async function MainLayout({ children }: MainLayoutProps) {
  const supabase = getSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="relative min-h-screen bg-hall-background text-white">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#ff2d95_0%,transparent_45%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,#30f0ff_0%,transparent_55%)]" />
      </div>
      <div className="relative mx-auto flex min-h-screen w-full max-w-xl flex-col px-5 pb-28 pt-10">
        {children}
      </div>
      <TabBar items={tabs} />
    </div>
  );
}

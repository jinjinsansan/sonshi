import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { TabBar, type TabBarItem } from "@/components/layout/tab-bar";
import { getServerAuthUser } from "@/lib/auth/session";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { Toaster } from "sonner";

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
  const [user, maintenanceValue] = await Promise.all([
    getServerAuthUser(),
    (async () => {
      const supabase = getSupabaseServiceClient();
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "maintenance")
        .maybeSingle();
      return (data?.value as { enabled?: boolean; message?: string } | null) ?? null;
    })(),
  ]);
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="relative min-h-screen bg-hall-background text-white">
      <Toaster position="top-center" theme="dark" richColors />
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute inset-0 bg-hall-grid opacity-45" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#ff2d95_0%,transparent_45%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,#30f0ff_0%,transparent_55%)]" />
      </div>
      <div className="relative mx-auto flex min-h-screen w-full max-w-xl flex-col px-5 pb-28 pt-10">
        {maintenanceValue?.enabled ? (
          <div className="mb-5 rounded-2xl border border-yellow-300/40 bg-black/50 px-5 py-4 text-sm text-yellow-200 shadow-[0_0_25px_rgba(255,227,71,0.25)]">
            <p className="font-semibold tracking-[0.3em] text-yellow-100">MAINTENANCE</p>
            <p className="mt-1 text-xs text-yellow-200/80">
              {maintenanceValue.message ?? "現在ホール整備中のためガチャは一時停止しています。"}
            </p>
          </div>
        ) : null}
        {children}
      </div>
      <TabBar items={tabs} />
    </div>
  );
}

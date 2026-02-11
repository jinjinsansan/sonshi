import Link from "next/link";
import type { ReactNode } from "react";
import { requireAdminSession } from "@/lib/admin";

const navItems = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/cards", label: "Cards" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/referrals", label: "Referrals" },
  { href: "/admin/probability", label: "Probability" },
  { href: "/admin/story", label: "Story" },
  { href: "/admin/donden", label: "Donden" },
  { href: "/admin/stats", label: "Stats" },
];

type AdminLayoutProps = {
  children: ReactNode;
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  await requireAdminSession();

  return (
    <div className="relative min-h-screen bg-hall-background text-white">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#ff2d95_0%,transparent_45%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,#30f0ff_0%,transparent_55%)]" />
      </div>
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <header className="glass-panel space-y-4 px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.5em] text-neon-yellow">Admin</p>
            <h1 className="font-display text-3xl text-white">管理ダッシュボード</h1>
          </div>
          <nav className="flex flex-wrap gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/80 transition hover:border-neon-blue hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        {children}
      </div>
    </div>
  );
}

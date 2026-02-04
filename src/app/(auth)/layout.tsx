import type { ReactNode } from "react";

export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-hall-background px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,45,149,0.2),transparent_50%)] opacity-60" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(48,240,255,0.15),transparent_60%)] opacity-60" />
      <div className="relative w-full max-w-md space-y-6 rounded-3xl border border-white/10 bg-gradient-to-b from-hall-panel/90 to-hall-surface/90 p-8 shadow-2xl">
        {children}
      </div>
    </div>
  );
}

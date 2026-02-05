import type { ReactNode } from "react";
import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-hall-background px-4 py-10">
      <div className="absolute inset-0 bg-hall-grid opacity-35" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,45,149,0.25),transparent_50%)] opacity-70" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(48,240,255,0.2),transparent_60%)] opacity-70" />
      <div className="glass-panel w-full max-w-md space-y-6 p-8">
        <div className="flex items-center gap-4">
          <div className="neon-crest">
            <Image
              src="/icon.png"
              alt="SONSHI GACHA"
              width={64}
              height={64}
              priority
              className="h-16 w-16 rounded-2xl object-cover"
            />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-neon-blue">SONSHI GACHA</p>
            <p className="text-sm text-zinc-400">パチスロホールへようこそ</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

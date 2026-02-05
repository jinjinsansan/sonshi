"use client";

import { useEffect, useMemo, useState } from "react";
import { publicEnv } from "@/lib/env";

type ReferralEntry = {
  id: string;
  referral_code: string;
  referred_id: string | null;
  status: string | null;
  ticket_granted: boolean | null;
  created_at: string | null;
  completed_at: string | null;
};

type ReferralStats = {
  code: string | null;
  totalInvited: number;
  rewardedCount: number;
  referrals: ReferralEntry[];
};

export function ReferralInvitePanel() {
  const [data, setData] = useState<ReferralStats | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      fetch("/api/referral/code").then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error ?? "紹介コードの取得に失敗しました");
        return json as { code: string };
      }),
      fetch("/api/referral/stats").then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error ?? "紹介実績の取得に失敗しました");
        return json as ReferralStats;
      }),
    ])
      .then(([codeResult, stats]) => {
        if (!mounted) return;
        setCode(codeResult.code);
        setData(stats);
      })
      .catch((err: Error) => {
        if (mounted) setError(err.message);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const inviteUrl = useMemo(() => {
    if (!code) return "";
    const base = publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
    return `${base}/invite/${code}`;
  }, [code]);

  const shareText = "尊師ガチャに招待します！登録でフリーチケット1枚がもらえます。";
  const lineShareUrl = inviteUrl
    ? `https://line.me/R/msg/text/?${encodeURIComponent(`${shareText}\n${inviteUrl}`)}`
    : "";
  const xShareUrl = inviteUrl
    ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(inviteUrl)}`
    : "";

  const handleCopy = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  if (error) {
    return <p className="text-sm text-red-400">{error}</p>;
  }

  if (!data) {
    return <p className="text-sm text-zinc-400">ロード中...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-hall-panel/80 p-5 shadow-panel-inset">
        <p className="text-xs uppercase tracking-[0.4em] text-neon-blue">Referral Code</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-white/15 px-4 py-2 font-display text-lg text-white">
            {code ?? "----"}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/80 transition hover:border-neon-blue hover:text-white"
          >
            {copied ? "COPIED" : "COPY"}
          </button>
        </div>
        <p className="mt-3 text-xs text-zinc-400">招待リンク: {inviteUrl || "-"}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href={lineShareUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/80 transition hover:border-neon-blue hover:text-white"
          >
            LINEで共有
          </a>
          <a
            href={xShareUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/80 transition hover:border-neon-blue hover:text-white"
          >
            Xで共有
          </a>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-hall-panel/80 p-4 shadow-panel-inset">
          <p className="text-xs uppercase tracking-[0.4em] text-neon-yellow">Invited</p>
          <p className="mt-2 font-display text-2xl text-white">{data.totalInvited}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-hall-panel/80 p-4 shadow-panel-inset">
          <p className="text-xs uppercase tracking-[0.4em] text-neon-pink">Rewarded</p>
          <p className="mt-2 font-display text-2xl text-white">{data.rewardedCount}</p>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-hall-panel/80 p-5 shadow-panel-inset">
        <p className="text-xs uppercase tracking-[0.4em] text-zinc-400">履歴</p>
        <div className="mt-4 space-y-3">
          {data.referrals.length === 0 ? (
            <p className="text-sm text-zinc-400">まだ紹介実績がありません。</p>
          ) : (
            data.referrals.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-200"
              >
                <div>
                  <p className="text-xs text-zinc-400">Referred User</p>
                  <p className="font-display text-sm">
                    {item.referred_id ? item.referred_id.slice(0, 8) : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400">Status</p>
                  <p className="text-sm text-neon-yellow">
                    {item.status === "rewarded" ? "付与済み" : item.status === "completed" ? "成立" : "待機中"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400">Date</p>
                  <p className="text-sm">
                    {(item.completed_at ?? item.created_at ?? "").slice(0, 10) || "-"}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

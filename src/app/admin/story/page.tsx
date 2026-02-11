/* eslint-disable @typescript-eslint/no-explicit-any */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { requireAdminSession } from "@/lib/admin";
import { getVideoPathV3 } from "@/lib/gacha/v3/utils";
import { StorySequenceBuilder } from "@/components/admin/story-sequence-builder";

const RESULTS = ["lose", "small_win", "win", "big_win", "jackpot"] as const;

async function createScenario(formData: FormData) {
  "use server";
  await requireAdminSession();
  const svc = getSupabaseServiceClient();
  const table = (svc as any).from("story_scenarios");

  const name = String(formData.get("name") ?? "").trim();
  const star = Number(formData.get("star") ?? 1);
  const result = String(formData.get("result") ?? "lose");
  const seqRaw = String(formData.get("video_sequence") ?? "");
  const hasChase = formData.get("has_chase") === "on";
  const chaseResult = String(formData.get("chase_result") ?? "").trim() || null;
  const isDonden = formData.get("is_donden") === "on";
  const weight = Number(formData.get("weight") ?? 100);

  const videoSequence = seqRaw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (!name || videoSequence.length === 0) {
    redirect("/admin/story?error=invalid");
  }

  await table.insert({
    name,
    star_rating: Number.isFinite(star) ? star : 1,
    result,
    video_sequence: videoSequence,
    has_chase: hasChase,
    chase_result: chaseResult,
    is_donden: isDonden,
    weight: Number.isFinite(weight) ? weight : 100,
    is_active: true,
  });

  revalidatePath("/admin/story");
  redirect("/admin/story");
}

async function updateScenario(formData: FormData) {
  "use server";
  await requireAdminSession();
  const svc = getSupabaseServiceClient();
  const table = (svc as any).from("story_scenarios");

  const id = String(formData.get("id") ?? "");
  const weight = Number(formData.get("weight") ?? 100);
  const isActive = formData.get("is_active") === "on";

  if (!id) redirect("/admin/story?error=id");

  await table.upsert({ id, weight: Number.isFinite(weight) ? weight : 100, is_active: isActive });

  revalidatePath("/admin/story");
  redirect("/admin/story");
}

async function deleteScenario(formData: FormData) {
  "use server";
  await requireAdminSession();
  const svc = getSupabaseServiceClient();
  const table = (svc as any).from("story_scenarios");

  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/story?error=id");

  await table.delete().eq("id", id);

  revalidatePath("/admin/story");
  redirect("/admin/story");
}

export default async function AdminStoryPage({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
  await requireAdminSession();
  const svc = getSupabaseServiceClient();
  const table = (svc as any).from("story_scenarios");
  const videoTable = (svc as any).from("story_videos");

  const [{ data: scenarioRows }, { data: videoRows }] = await Promise.all([
    table
      .select("id, name, star_rating, result, video_sequence, has_chase, chase_result, is_donden, weight, is_active, updated_at")
      .order("star_rating", { ascending: true })
      .order("updated_at", { ascending: false }),
    videoTable.select("id, category, filename, description").order("id", { ascending: true }),
  ]);

  const scenarios = (scenarioRows ?? []) as {
    id: string;
    name: string;
    star_rating: number;
    result: string;
    video_sequence: string[];
    has_chase: boolean;
    chase_result?: string | null;
    is_donden?: boolean | null;
    weight?: number | null;
    is_active?: boolean | null;
  }[];

  const grouped = scenarios.reduce<Record<number, typeof scenarios>>((acc, s) => {
    const key = s.star_rating;
    acc[key] = acc[key] ?? [];
    acc[key].push(s);
    return acc;
  }, {});

  const storyVideos = (videoRows ?? []) as {
    id: string;
    category: string;
    filename: string;
    description?: string | null;
  }[];

  const error = searchParams ? (await searchParams).error : undefined;

  return (
    <section className="space-y-8">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.4em] text-neon-yellow">Story</p>
        <h1 className="font-display text-2xl text-white">ストーリーシナリオ管理</h1>
        <p className="text-sm text-zinc-300">★別シナリオの登録・重み調整・有効/無効切替。</p>
        {error ? <p className="text-sm text-red-400">エラー: {error}</p> : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <form action={createScenario} className="glass-panel space-y-3 p-4">
          <p className="text-sm font-semibold text-white">シナリオ新規登録</p>
          <input name="name" required placeholder="名前" className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-300">★</label>
              <input name="star" type="number" min="1" max="12" defaultValue={1} className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="text-xs text-zinc-300">結果</label>
              <select name="result" className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white">
                {RESULTS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-300">動画IDシーケンス（カンマ/改行区切り）</label>
            <StorySequenceBuilder videos={storyVideos} required />
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm text-white">
            <label className="flex items-center gap-2">
              <input name="has_chase" type="checkbox" className="accent-neon-pink" /> 追撃あり
            </label>
            <label className="flex items-center gap-2">
              <input name="is_donden" type="checkbox" className="accent-neon-pink" /> どんでん
            </label>
            <div>
              <input name="chase_result" className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white" placeholder="chase結果(任意)" />
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-300">weight</label>
            <input name="weight" type="number" min="1" defaultValue={100} className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white" />
          </div>
          <button type="submit" className="rounded-full bg-gradient-to-r from-neon-pink to-neon-yellow px-4 py-2 text-sm font-semibold text-black shadow-neon">追加</button>
        </form>

        <div className="space-y-3 text-sm text-white">
          {Object.keys(grouped)
            .sort((a, b) => Number(a) - Number(b))
            .map((starKey) => {
              const star = Number(starKey);
              return (
                <div key={star} className="glass-panel space-y-2 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-neon-yellow">★{star}</p>
                    </div>
                    <span className="text-[11px] text-zinc-400">{grouped[star].length}件</span>
                  </div>
                  <div className="space-y-2">
                    {grouped[star].map((s) => (
                      <div key={s.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-white">{s.name}</p>
                          <span className="rounded-full bg-white/10 px-2 py-[2px] text-[11px] text-white/80">{s.result}</span>
                          {s.is_donden ? (
                            <span className="rounded-full bg-purple-600/30 px-2 py-[2px] text-[11px] text-purple-100">どんでん</span>
                          ) : null}
                          {s.has_chase ? (
                            <span className="rounded-full bg-amber-500/30 px-2 py-[2px] text-[11px] text-amber-100">追撃</span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs text-zinc-300">{s.video_sequence.join(", ")}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-zinc-400">
                          {s.video_sequence.slice(0, 3).map((vid) => (
                            <div key={vid} className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-2 py-2">
                              <video
                                src={getVideoPathV3(`${vid}.mp4`)}
                                className="h-12 w-20 rounded object-cover"
                                muted
                                playsInline
                                controls
                              />
                              <span>{vid}</span>
                            </div>
                          ))}
                          {s.video_sequence.length > 3 ? <span className="text-zinc-500">…</span> : null}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-3">
                          <form action={updateScenario} className="flex flex-wrap items-center gap-3">
                            <input type="hidden" name="id" value={s.id} />
                            <label className="flex items-center gap-2 text-xs text-white">
                              weight
                              <input
                                name="weight"
                                type="number"
                                defaultValue={s.weight ?? 100}
                                className="w-24 rounded-lg border border-white/15 bg-black/30 px-2 py-1 text-sm text-white"
                              />
                            </label>
                            <label className="flex items-center gap-2 text-xs text-white">
                              <input name="is_active" type="checkbox" className="accent-neon-pink" defaultChecked={s.is_active ?? true} /> 有効
                            </label>
                            <button type="submit" className="rounded-full border border-white/20 px-3 py-1 text-xs text-white">保存</button>
                          </form>
                          <form action={deleteScenario} className="flex items-center">
                            <input type="hidden" name="id" value={s.id} />
                            <button type="submit" className="text-xs text-red-400 hover:text-red-200">削除</button>
                          </form>
                        </div>
                        <div className="mt-1 flex gap-3 text-[11px] text-zinc-400">
                          <span>Chase: {s.chase_result ?? "-"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </section>
  );
}

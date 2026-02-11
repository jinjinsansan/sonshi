"use client";

import { useMemo, useState } from "react";
import { getVideoPathV3 } from "@/lib/gacha/v3/utils";

type StoryVideoItem = {
  id: string;
  category: string;
  filename: string;
  description?: string | null;
};

type StorySequenceBuilderProps = {
  videos: StoryVideoItem[];
  name?: string;
  placeholder?: string;
  required?: boolean;
};

const parseSequence = (value: string) =>
  value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);

export function StorySequenceBuilder({
  videos,
  name = "video_sequence",
  placeholder = "OP01, MS01, JD01",
  required,
}: StorySequenceBuilderProps) {
  const [textValue, setTextValue] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const sequence = useMemo(() => parseSequence(textValue), [textValue]);

  const categoryOptions = useMemo(() => {
    const unique = Array.from(new Set(videos.map((video) => video.category))).sort();
    return ["all", ...unique];
  }, [videos]);

  const filteredVideos = useMemo(() => {
    const term = search.trim().toLowerCase();
    return videos.filter((video) => {
      if (category !== "all" && video.category !== category) return false;
      if (!term) return true;
      const haystack = `${video.id} ${video.category} ${video.description ?? ""}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [category, search, videos]);

  const updateSequence = (next: string[]) => {
    setTextValue(next.join(", "));
  };

  const handleAdd = (id: string) => {
    updateSequence([...sequence, id]);
  };

  const handleRemove = (index: number) => {
    updateSequence(sequence.filter((_, idx) => idx !== index));
  };

  const moveItem = (from: number, to: number) => {
    if (to < 0 || to >= sequence.length || from === to) return;
    const next = [...sequence];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    updateSequence(next);
  };

  const handleDrop = (index: number) => {
    if (dragIndex === null) return;
    moveItem(dragIndex, index);
    setDragIndex(null);
  };

  return (
    <div className="space-y-4">
      <textarea
        name={name}
        required={required}
        value={textValue}
        onChange={(event) => setTextValue(event.target.value)}
        className="min-h-[100px] w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
        placeholder={placeholder}
      />

      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-400">選択済みシーケンス</p>
        {sequence.length === 0 ? (
          <p className="text-xs text-zinc-500">まだ追加されていません。</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {sequence.map((id, index) => (
              <div
                key={`${id}-${index}`}
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragEnd={() => setDragIndex(null)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => handleDrop(index)}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-xs text-white"
                title="ドラッグで並び替え"
              >
                <span className="font-semibold text-neon-yellow">{id}</span>
                <div className="flex items-center gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => moveItem(index, index - 1)}
                    className="rounded border border-white/10 px-1 text-white/70 hover:text-white"
                    disabled={index === 0}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(index, index + 1)}
                    className="rounded border border-white/10 px-1 text-white/70 hover:text-white"
                    disabled={index === sequence.length - 1}
                  >
                    ↓
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="rounded border border-white/10 px-1 text-[10px] text-white/70 hover:text-white"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white"
          >
            {categoryOptions.map((option) => (
              <option key={option} value={option}>
                {option === "all" ? "全カテゴリ" : option}
              </option>
            ))}
          </select>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="ID・カテゴリ・説明で検索"
            className="flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white"
          />
        </div>
        <p className="text-xs text-zinc-400">動画をクリックするとシーケンスに追加されます。</p>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredVideos.map((video) => (
            <button
              key={video.id}
              type="button"
              onClick={() => handleAdd(video.id)}
              className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/40 p-3 text-left text-white transition hover:border-neon-blue"
            >
              <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-white/5 bg-black">
                <video
                  src={getVideoPathV3(video.filename)}
                  className="h-full w-full object-cover"
                  muted
                  playsInline
                  preload="metadata"
                  onMouseEnter={(event) => {
                    event.currentTarget.currentTime = 0;
                    void event.currentTarget.play();
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.pause();
                    event.currentTarget.currentTime = 0;
                  }}
                  onFocus={(event) => {
                    event.currentTarget.currentTime = 0;
                    void event.currentTarget.play();
                  }}
                  onBlur={(event) => {
                    event.currentTarget.pause();
                    event.currentTarget.currentTime = 0;
                  }}
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-neon-yellow">{video.id}</span>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-white/60">{video.category}</span>
                </div>
                <p className="text-[11px] text-white/70">
                  {video.description || "説明なし"}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

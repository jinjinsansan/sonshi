import { Video, VideoCategory, VideoSequenceItem } from "./types";

export function randomChoice<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function findVideoByType(
  videos: Video[],
  category: VideoCategory,
  videoType: string
): Video {
  const found = videos.find(
    (v) => v.category === category && v.video_type === videoType && v.is_active
  );
  if (!found) {
    throw new Error(`Video not found: category=${category}, type=${videoType}`);
  }
  return found;
}

export function getVideoPathV3(filename: string): string {
  // V3 assets live directly under /public/videos with their filename
  return `/videos/${filename}`;
}

export function toSequenceItem(order: number, video: Video): VideoSequenceItem {
  return {
    order,
    video_id: video.video_id,
    category: video.category,
    filename: video.filename,
    hint_level: video.hint_level,
  };
}

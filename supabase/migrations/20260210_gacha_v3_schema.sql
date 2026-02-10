-- Gacha V3 schema (coexists with existing V2 tables)
-- This migration is additive and avoids dropping/modifying V2 behavior-critical objects.

-- 1) Videos master (V3)
create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  video_id varchar(10) not null unique,
  category varchar(32) not null, -- standby, countdown, judge, reaction_ito, reaction_guri, yokoku, result
  filename varchar(255) not null,
  name varchar(100) not null,
  description text,
  hint_level integer default 0,
  video_type varchar(32), -- continue/lose/win/... varies by category
  duration numeric(6,2),
  is_active boolean not null default true,
  sort_order integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists videos_category_idx on public.videos (category);
create index if not exists videos_type_idx on public.videos (video_type);
create index if not exists videos_active_idx on public.videos (is_active);

-- 2) RTP settings: add min/max koma to existing table (non-breaking)
alter table if exists public.rtp_settings
  add column if not exists min_koma integer default 3,
  add column if not exists max_koma integer default 12;

-- Populate min/max with V3 defaults
update public.rtp_settings as r
set min_koma = v.min_koma, max_koma = v.max_koma
from (values
  (1, 3, 5),
  (2, 3, 5),
  (3, 4, 6),
  (4, 5, 7),
  (5, 5, 8),
  (6, 6, 9),
  (7, 6, 10),
  (8, 7, 11),
  (9, 7, 12),
  (10, 8, 14),
  (11, 9, 15),
  (12, 10, 16)
) as v(star, min_koma, max_koma)
where r.star = v.star;

-- 3) Donden settings: extend existing table for V3 turnabout rules
alter table if exists public.donden_settings
  add column if not exists min_star integer,
  add column if not exists max_star integer,
  add column if not exists is_active boolean default true;

-- Seed V3 turnabout entries (keep existing rows intact)
insert into public.donden_settings (type, probability, min_star, max_star, is_active)
values
  ('lose_to_win', 5.00, 8, 12, true),
  ('win_to_lose', 3.00, 1, 3, true)
on conflict (type) do update
  set probability = excluded.probability,
      min_star = excluded.min_star,
      max_star = excluded.max_star,
      is_active = excluded.is_active;

-- 4) Gacha history: add V3-friendly columns (keeps V2-compatible fields)
alter table if exists public.gacha_history
  add column if not exists result text,
  add column if not exists koma_count integer,
  add column if not exists video_sequence jsonb,
  add column if not exists card_count integer;

-- 5) Seed initial videos (idempotent)
insert into public.videos (video_id, category, filename, name, hint_level, video_type, sort_order)
values
  -- STANDBY
  ('S01', 'standby', 'S01.mp4', 'イエロー', 0, null, 1),
  ('S02', 'standby', 'S02.mp4', 'レインボー', 40, null, 2),
  ('S03', 'standby', 'S03.mp4', 'グレー', -20, null, 3),
  ('S04', 'standby', 'S04.mp4', 'ブルー', 10, null, 4),
  ('S05', 'standby', 'S05.mp4', 'レッド', 0, null, 5),
  ('S06', 'standby', 'S06.mp4', 'ホワイト', 0, null, 6),

  -- COUNTDOWN
  ('C01', 'countdown', 'C01.mp4', '876', 20, null, 10),
  ('C02', 'countdown', 'C02.mp4', '8765', 20, null, 11),
  ('C03', 'countdown', 'C03.mp4', '87', 20, null, 12),
  ('C04', 'countdown', 'C04.mp4', '87654321', 50, null, 13),
  ('C05', 'countdown', 'C05.mp4', '4321', -20, null, 14),
  ('C06', 'countdown', 'C06.mp4', '321', -20, null, 15),

  -- JUDGE (尊師)
  ('A01', 'judge', '3_continue.mp4', '審判開始（継続）', 10, 'continue', 20),
  ('A02', 'judge', '3_lose.mp4', '審判開始（ハズレ）', -30, 'lose', 21),
  ('A03', 'judge', '4_continue.mp4', '第一の試練（継続）', 15, 'continue', 22),
  ('A04', 'judge', '4_lose.mp4', '第一の試練（ハズレ）', -40, 'lose', 23),
  ('A05', 'judge', '5_continue.mp4', '第二の試練（継続）', 20, 'continue', 24),
  ('A06', 'judge', '5_lose.mp4', '第二の試練（ハズレ）', -50, 'lose', 25),
  ('A07', 'judge', '6_continue.mp4', '最終審判（継続）', 30, 'continue', 26),
  ('A08', 'judge', '6_lose.mp4', '最終審判（ハズレ）', -60, 'lose', 27),

  -- REACTION (伊東)
  ('B01', 'reaction_ito', 'ito_scared.mp4', '伊東（怯える）', -10, 'negative', 30),
  ('B02', 'reaction_ito', 'ito_relieved.mp4', '伊東（安堵）', 10, 'positive', 31),
  ('B03', 'reaction_ito', 'ito_laugh.mp4', '伊東（笑う）', 30, 'very_positive', 32),
  ('B04', 'reaction_ito', 'ito_cry.mp4', '伊東（泣く）', -40, 'very_negative', 33),

  -- REACTION (グリ)
  ('B05', 'reaction_guri', 'guri_scared.mp4', 'グリ（震える）', -10, 'negative', 34),
  ('B06', 'reaction_guri', 'guri_relieved.mp4', 'グリ（ホッとする）', 10, 'positive', 35),
  ('B07', 'reaction_guri', 'guri_laugh.mp4', 'グリ（笑う）', 30, 'very_positive', 36),
  ('B08', 'reaction_guri', 'guri_cry.mp4', 'グリ（落ち込む）', -40, 'very_negative', 37),

  -- YOKOKU (競馬キャラ)
  ('Y01', 'yokoku', 'frankel_appear.mp4', 'フランケル登場', 50, 'super_positive', 40),
  ('Y02', 'yokoku', 'frankel_win.mp4', 'フランケル勝利', 100, 'win_confirm', 41),
  ('Y03', 'yokoku', 'kakeru_appear.mp4', 'かけるくん登場', -30, 'danger', 42),
  ('Y04', 'yokoku', 'kakeru_fail.mp4', 'かけるくん失敗', -50, 'lose_hint', 43),

  -- RESULT
  ('R01', 'result', '7_win.mp4', '当たり', 100, 'win', 50),
  ('R02', 'result', '7_lose.mp4', 'ハズレ', -100, 'lose', 51),
  ('R03', 'result', '7_tsuigeki.mp4', '追撃チャンス', 50, 'tsuigeki_chance', 52),
  ('R04', 'result', '8_success.mp4', '追撃成功', 100, 'tsuigeki_success', 53),
  ('R05', 'result', '8_fail.mp4', '追撃失敗', -50, 'tsuigeki_fail', 54)
on conflict (video_id) do update
  set category = excluded.category,
      filename = excluded.filename,
      name = excluded.name,
      hint_level = excluded.hint_level,
      video_type = excluded.video_type,
      sort_order = excluded.sort_order,
      is_active = true,
      updated_at = now();

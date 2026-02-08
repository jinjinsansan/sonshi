-- Gacha v2 schema for scenario-based single-play flow

-- RTP settings per star (★1-★12)
create table if not exists public.rtp_settings (
  star integer primary key,
  probability numeric(6,4) not null,
  updated_at timestamptz not null default now(),
  updated_by text
);

-- Donden (turnabout) settings
create table if not exists public.donden_settings (
  id integer primary key generated always as identity,
  type text unique not null, -- win, small_win, lose
  probability numeric(6,4) not null,
  updated_at timestamptz not null default now(),
  updated_by text
);

-- Tsuigeki (chase) settings for high-star results
create table if not exists public.tsuigeki_settings (
  id integer primary key generated always as identity,
  star integer unique not null, -- 10, 11, 12
  success_rate numeric(5,2) not null,
  card_count_on_success integer not null default 2,
  third_card_rate numeric(5,2),
  updated_at timestamptz not null default now(),
  updated_by text
);

-- Scenario rules per group and koma slot
create table if not exists public.scenario_rules (
  id integer primary key generated always as identity,
  star_group text not null, -- A, B, C, D, E
  koma integer not null, -- 1-7
  allowed text[] not null default '{}',
  forbidden text[] not null default '{}',
  updated_at timestamptz not null default now(),
  updated_by text
);

create index if not exists scenario_rules_group_koma_idx on public.scenario_rules (star_group, koma);

-- Gacha history for generated scenarios
create table if not exists public.gacha_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.app_users (id) on delete cascade,
  star integer not null,
  scenario jsonb not null,
  is_donden boolean not null default false,
  donden_type text,
  has_tsuigeki boolean not null default false,
  tsuigeki_result text,
  cards_count integer not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists gacha_history_user_idx on public.gacha_history (user_id);
create index if not exists gacha_history_created_idx on public.gacha_history (created_at);
create index if not exists gacha_history_star_idx on public.gacha_history (star);

-- Cards: add star column for ★1-★12 rarity scale
alter table if exists public.cards
  add column if not exists star integer default 1;

-- Seed minimal defaults if empty (idempotent inserts)
insert into public.donden_settings (type, probability)
select * from (values ('win', 0.5), ('small_win', 1.0), ('lose', 2.0)) as v(type, probability)
where not exists (select 1 from public.donden_settings);

insert into public.tsuigeki_settings (star, success_rate, card_count_on_success, third_card_rate)
select * from (values (10, 50.00, 2, null), (11, 80.00, 2, null), (12, 100.00, 2, 30.00)) as v(star, success_rate, card_count_on_success, third_card_rate)
where not exists (select 1 from public.tsuigeki_settings);

insert into public.rtp_settings (star, probability)
select * from (values
  (1, 30.0000),
  (2, 25.0000),
  (3, 20.0000),
  (4, 10.0000),
  (5, 6.0000),
  (6, 4.0000),
  (7, 2.5000),
  (8, 1.3000),
  (9, 0.7000),
  (10, 0.3000),
  (11, 0.1500),
  (12, 0.0500)
) as v(star, probability)
where not exists (select 1 from public.rtp_settings);

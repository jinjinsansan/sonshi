-- RTP settings fix: donden rate by star + tsuigeki defaults

create table if not exists public.donden_rate_settings (
  id uuid primary key default gen_random_uuid(),
  star_rating integer not null unique check (star_rating between 1 and 12),
  donden_rate numeric(5,2) not null default 0.00,
  updated_at timestamptz not null default now()
);

insert into public.donden_rate_settings (star_rating, donden_rate)
values
  (1, 0),
  (2, 0),
  (3, 20),
  (4, 15),
  (5, 15),
  (6, 20),
  (7, 20),
  (8, 20),
  (9, 15),
  (10, 15),
  (11, 10),
  (12, 10)
on conflict (star_rating) do update
  set donden_rate = excluded.donden_rate,
      updated_at = now();

insert into public.tsuigeki_settings (star, success_rate, card_count_on_success, third_card_rate)
values
  (10, 60.00, 2, 0.00),
  (11, 75.00, 2, 0.00),
  (12, 90.00, 3, 50.00)
on conflict (star) do update
  set success_rate = excluded.success_rate,
      card_count_on_success = excluded.card_count_on_success,
      third_card_rate = excluded.third_card_rate,
      updated_at = now();

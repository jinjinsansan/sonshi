-- Ensure gacha results can reference story history and allow new obtained_via values

-- Allow linking gacha results to gacha_history while keeping legacy gacha_id usage
alter table if exists public.gacha_results
  add column if not exists history_id uuid references public.gacha_history(id) on delete set null;

create index if not exists idx_gacha_results_history on public.gacha_results(history_id);

-- Expand obtained_via enumerations for card_inventory
alter table if exists public.card_inventory
  drop constraint if exists card_inventory_obtained_via_check;

alter table if exists public.card_inventory
  add constraint card_inventory_obtained_via_check
  check (obtained_via in (
    'single_gacha',
    'multi_gacha',
    'trade',
    'admin_grant',
    'gacha_v2',
    'gacha_v3',
    'gacha_v4'
  ));

-- Expand obtained_via enumerations for gacha_results
alter table if exists public.gacha_results
  drop constraint if exists gacha_results_obtained_via_check;

alter table if exists public.gacha_results
  add constraint gacha_results_obtained_via_check
  check (obtained_via in (
    'single_gacha',
    'multi_gacha',
    'gacha_v2',
    'gacha_v3',
    'gacha_v4'
  ));

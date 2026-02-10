-- V4 story video system (additive, non-destructive to existing V3 tables)

-- Story videos master (30 entries)
create table if not exists public.story_videos (
  id varchar(10) primary key,
  category varchar(32) not null,
  filename varchar(200) not null,
  duration_seconds integer not null default 6,
  description text,
  created_at timestamptz not null default now()
);

-- Story scenarios master
create table if not exists public.story_scenarios (
  id uuid primary key default gen_random_uuid(),
  name varchar(100) not null,
  star_rating integer not null check (star_rating between 1 and 12),
  result varchar(20) not null check (result in ('lose','small_win','win','big_win','jackpot')),
  video_sequence jsonb not null,
  has_chase boolean default false,
  chase_result varchar(10) check (chase_result in ('success','fail')),
  is_donden boolean default false,
  weight integer default 100,
  is_active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add story_scenario_id to gacha_history for traceability (additive)
alter table if exists public.gacha_history
  add column if not exists story_scenario_id uuid references public.story_scenarios(id);

create index if not exists story_scenarios_star_idx on public.story_scenarios(star_rating) where is_active;
create index if not exists story_scenarios_active_idx on public.story_scenarios(is_active);

-- Seed story_videos (30 entries)
insert into public.story_videos (id, category, filename, duration_seconds, description) values
('OP01','opening','op_start.mp4',6,'今日こそ頑張るぞ！'),
('OP02','opening','op_go_buy.mp4',6,'馬券買いに行きます！'),
('OP03','opening','op_data.mp4',6,'データ整理します！'),
('MS01','miss','miss_ticket_lost.mp4',6,'あれ...馬券が...'),
('MS02','miss','miss_wrong_ticket.mp4',6,'やばい！！'),
('MS03','miss','miss_deadline.mp4',6,'時間がない！'),
('MS04','miss','miss_odds.mp4',6,'えっ...違う...'),
('MS05','miss','miss_disaster.mp4',6,'終わった...'),
('HP01','help','help_guri_advice.mp4',6,'落ち着け、こうすればいい'),
('HP02','help','help_guri_encourage.mp4',6,'お前ならできる'),
('HP03','help','help_takigawa_hint.mp4',6,'勝負の世界ではな...'),
('HP04','help','help_frankel.mp4',8,'フランケル登場'),
('TR01','trouble','trouble_kakeru.mp4',6,'無理無理〜'),
('TR02','trouble','trouble_takigawa.mp4',6,'甘いんだよ！'),
('TR03','trouble','trouble_more_miss.mp4',6,'またやった...'),
('IT01','recovery','ito_recover.mp4',6,'やるしかない！'),
('IT02','recovery','ito_fullpower.mp4',6,'全力でやります！'),
('SN01','reaction','sonshi_angry.mp4',6,'何やってんだ！'),
('SN02','reaction','sonshi_disappointed.mp4',6,'話にならん...'),
('SN03','reaction','sonshi_watching.mp4',6,'...'),
('SN04','reaction','sonshi_thinking.mp4',6,'ふむ...'),
('SN05','reaction','sonshi_smirk.mp4',8,'口角が上がる'),
('JD01','judge','judge_fired.mp4',8,'お前はクビだ'),
('JD02','judge','judge_die.mp4',8,'お前は死ね'),
('JD03','judge','judge_approved.mp4',8,'認めてやろう'),
('JD04','judge','judge_laugh.mp4',8,'wwwwww'),
('JD05','judge','judge_sonshi.mp4',8,'お前も尊師だ'),
('TS01','chase','tsuigeki_chance.mp4',8,'まだだ...'),
('TS02','chase','tsuigeki_success.mp4',8,'大勝利！'),
('TS03','chase','tsuigeki_fail.mp4',8,'惜しかった...')
on conflict (id) do update set filename = excluded.filename;

-- Seed default scenarios (minimal examples; weights can be tuned in app)
insert into public.story_scenarios (name, star_rating, result, video_sequence, has_chase, weight)
values
('★1 即ハズレA',1,'lose','["OP01","MS01","JD01"]',false,100),
('★1 即ハズレB',1,'lose','["OP02","MS05","JD02"]',false,80),
('★2 ミスハズレA',2,'lose','["OP01","MS02","SN01","JD01"]',false,100),
('★2 ミスハズレB',2,'lose','["OP03","MS04","SN02","JD02"]',false,80),
('★3 ハズレ緩急A',3,'lose','["OP01","MS03","TR02","JD01"]',false,90),
('★3 ハズレ緩急B',3,'lose','["OP02","MS04","SN01","JD02"]',false,90),
('★4 小当たりA',4,'small_win','["OP01","MS02","HP01","JD03"]',false,100),
('★4 小当たりB',4,'small_win','["OP02","MS01","HP02","JD03"]',false,80),
('★5 小当たり観察',5,'small_win','["OP03","MS03","HP03","SN03","JD03"]',false,100),
('★6 当たり反撃',6,'win','["OP01","MS02","HP02","IT01","JD03"]',false,100),
('★7 当たり試練',7,'win','["OP02","MS03","TR01","HP03","IT02","JD03"]',false,100),
('★8 大当たり予告',8,'big_win','["OP03","MS04","TR02","HP04","IT02","SN05","JD04"]',false,100),
('★9 激アツフランケル',9,'big_win','["OP02","MS05","TR03","HP04","IT02","SN05","JD04"]',false,100),
('★10 追撃チャンス',10,'big_win','["OP01","MS03","TR02","HP04","IT02","SN05","JD04","TS01","TS02"]',true,100),
('★11 神レア',11,'jackpot','["OP02","MS04","TR02","HP04","IT02","SN05","JD05","TS01","TS02"]',true,100),
('★12 超神',12,'jackpot','["OP03","MS05","TR02","HP04","IT02","SN05","JD05","TS01","TS02"]',true,120)
on conflict do nothing;

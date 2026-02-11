-- Add scenario patterns from SCENARIO_PATTERNS_ADD.md (non-destructive)

-- ★1
insert into public.story_scenarios (name, star_rating, result, video_sequence, has_chase, chase_result, is_donden, weight, is_active)
select '★1 即ハズレC', 1, 'lose', '["OP03","MS03","JD02"]'::jsonb, false, null, false, 70, true
where not exists (select 1 from public.story_scenarios where name = '★1 即ハズレC');

insert into public.story_scenarios (name, star_rating, result, video_sequence, has_chase, chase_result, is_donden, weight, is_active)
select '★1 即ハズレD', 1, 'lose', '["OP01","MS04","JD01"]'::jsonb, false, null, false, 70, true
where not exists (select 1 from public.story_scenarios where name = '★1 即ハズレD');

insert into public.story_scenarios (name, star_rating, result, video_sequence, has_chase, chase_result, is_donden, weight, is_active)
select '★1 即ハズレE', 1, 'lose', '["OP02","MS02","JD01"]'::jsonb, false, null, false, 60, true
where not exists (select 1 from public.story_scenarios where name = '★1 即ハズレE');

insert into public.story_scenarios (name, star_rating, result, video_sequence, has_chase, chase_result, is_donden, weight, is_active)
select '★1 即ハズレF', 1, 'lose', '["OP03","MS01","JD02"]'::jsonb, false, null, false, 60, true
where not exists (select 1 from public.story_scenarios where name = '★1 即ハズレF');

-- ★2
insert into public.story_scenarios (name, star_rating, result, video_sequence, has_chase, chase_result, is_donden, weight, is_active)
select '★2 怒りハズレA', 2, 'lose', '["OP01","MS01","SN01","JD02"]'::jsonb, false, null, false, 80, true
where not exists (select 1 from public.story_scenarios where name = '★2 怒りハズレA');

insert into public.story_scenarios (name, star_rating, result, video_sequence, has_chase, chase_result, is_donden, weight, is_active)
select '★2 失望ハズレA', 2, 'lose', '["OP02","MS03","SN02","JD01"]'::jsonb, false, null, false, 80, true
where not exists (select 1 from public.story_scenarios where name = '★2 失望ハズレA');

insert into public.story_scenarios (name, star_rating, result, video_sequence, has_chase, chase_result, is_donden, weight, is_active)
select '★2 邪魔ハズレA', 2, 'lose', '["OP01","MS02","TR01","JD02"]'::jsonb, false, null, false, 70, true
where not exists (select 1 from public.story_scenarios where name = '★2 邪魔ハズレA');

insert into public.story_scenarios (name, star_rating, result, video_sequence, has_chase, chase_result, is_donden, weight, is_active)
select '★2 再ミスハズレA', 2, 'lose', '["OP03","MS04","TR03","JD01"]'::jsonb, false, null, false, 70, true
where not exists (select 1 from public.story_scenarios where name = '★2 再ミスハズレA');

-- ★3
insert into public.story_scenarios (name, star_rating, result, video_sequence, has_chase, chase_result, is_donden, weight, is_active)
select '★3 期待裏切りA', 3, 'lose', '["OP01","MS01","HP01","SN04","JD01"]'::jsonb, false, null, true, 80, true
where not exists (select 1 from public.story_scenarios where name = '★3 期待裏切りA');

insert into public.story_scenarios (name, star_rating, result, video_sequence, has_chase, chase_result, is_donden, weight, is_active)
select '★3 期待裏切りB', 3, 'lose', '["OP02","MS02","HP02","SN03","JD02"]'::jsonb, false, null, true, 70, true
where not exists (select 1 from public.story_scenarios where name = '★3 期待裏切りB');

insert into public.story_scenarios (name, star_rating, result, video_sequence, has_chase, chase_result, is_donden, weight, is_active)
select '★3 試練ハズレA', 3, 'lose', '["OP03","MS03","TR02","SN01","JD01"]'::jsonb, false, null, false, 90, true
where not exists (select 1 from public.story_scenarios where name = '★3 試練ハズレA');

insert into public.story_scenarios (name, star_rating, result, video_sequence, has_chase, chase_result, is_donden, weight, is_active)
select '★3 試練ハズレB', 3, 'lose', '["OP01","MS05","TR01","SN02","JD02"]'::jsonb, false, null, false, 80, true
where not exists (select 1 from public.story_scenarios where name = '★3 試練ハズレB');

insert into public.story_scenarios (name, star_rating, result, video_sequence, has_chase, chase_result, is_donden, weight, is_active)
select '★3 反撃失敗A', 3, 'lose', '["OP02","MS01","IT01","TR02","JD01"]'::jsonb, false, null, true, 60, true
where not exists (select 1 from public.story_scenarios where name = '★3 反撃失敗A');

insert into public.story_scenarios (name, star_rating, result, video_sequence, has_chase, chase_result, is_donden, weight, is_active)
select '★3 連続ミスA', 3, 'lose', '["OP01","MS02","MS04","SN01","JD02"]'::jsonb, false, null, false, 70, true
where not exists (select 1 from public.story_scenarios where name = '★3 連続ミスA');

-- ★4
insert into public.story_scenarios (name, star_rating, result, video_sequence, has_chase, chase_result, is_donden, weight, is_active)
select '★4 小当たりC', 4, 'small_win', '["OP03","MS03","HP01","JD03"]'::jsonb, false, null, false, 90, true
where not exists (select 1 from public.story_scenarios where name = '★4 小当たりC');

insert into public.story_scenarios (name, star_rating, result, video_sequence, has_chase, chase_result, is_donden, weight, is_active)
select '★4 小当たりD', 4, 'small_win', '["OP01","MS04","HP03","JD03"]'::jsonb, false, null, false, 80, true
where not exists (select 1 from public.story_scenarios where name = '★4 小当たりD');

insert into public.story_scenarios (name, star_rating, result, video_sequence, has_chase, chase_result, is_donden, weight, is_active)
select '★4 小当たりE', 4, 'small_win', '["OP02","MS05","SN01","HP02","JD03"]'::jsonb, false, null, true, 60, true
where not exists (select 1 from public.story_scenarios where name = '★4 小当たりE');

insert into public.story_scenarios (name, star_rating, result, video_sequence, has_chase, chase_result, is_donden, weight, is_active)
select '★4 小当たりF', 4, 'small_win', '["OP01","MS02","TR01","HP01","JD03"]'::jsonb, false, null, true, 60, true
where not exists (select 1 from public.story_scenarios where name = '★4 小当たりF');

-- ★5
insert into public.story_scenarios (name, star_rating, result, video_sequence, has_chase, chase_result, is_donden, weight, is_active)
select '★5 小当たり観察B', 5, 'small_win', '["OP01","MS01","HP02","SN04","JD03"]'::jsonb, false, null, false, 90, true
where not exists (select 1 from public.story_scenarios where name = '★5 小当たり観察B');

insert into public.story_scenarios (name, star_rating, result, video_sequence, has_chase, chase_result, is_donden, weight, is_active)
select '★5 小当たり観察C', 5, 'small_win', '["OP02","MS02","HP01","SN03","JD03"]'::jsonb, false, null, false, 80, true
where not exists (select 1 from public.story_scenarios where name = '★5 小当たり観察C');

insert into public.story_scenarios (name, star_rating, result, video_sequence, has_chase, chase_result, is_donden, weight, is_active)
select '★5 小当たり瀧川D', 5, 'small_win', '["OP03","MS04","HP03","SN04","JD03"]'::jsonb, false, null, false, 80, true
where not exists (select 1 from public.story_scenarios where name = '★5 小当たり瀧川D');

insert into public.story_scenarios (name, star_rating, result, video_sequence, has_chase, chase_result, is_donden, weight, is_active)
select '★5 小当たり試練E', 5, 'small_win', '["OP01","MS03","TR02","HP01","SN04","JD03"]'::jsonb, false, null, true, 60, true
where not exists (select 1 from public.story_scenarios where name = '★5 小当たり試練E');

insert into public.story_scenarios (name, star_rating, result, video_sequence, has_chase, chase_result, is_donden, weight, is_active)
select '★5 小当たり絶望F', 5, 'small_win', '["OP02","MS05","SN02","HP02","SN03","JD03"]'::jsonb, false, null, true, 50, true
where not exists (select 1 from public.story_scenarios where name = '★5 小当たり絶望F');

-- ★6
insert into public.story_scenarios (name, star_rating, result, video_sequence, has_chase, chase_result, is_donden, weight, is_active)
select '★6 当たり反撃B', 6, 'win', '["OP02","MS01","HP01","IT02","JD03"]'::jsonb, false, null, false, 90, true
where not exists (select 1 from public.story_scenarios where name = '★6 当たり反撃B');

insert into public.story_scenarios (name, star_rating, result, video_sequence, has_chase, chase_result, is_donden, weight, is_active)
select '★6 当たり反撃C', 6, 'win', '["OP03","MS03","HP03","IT01","JD03"]'::jsonb, false, null, false, 80, true
where not exists (select 1 from public.story_scenarios where name = '★6 当たり反撃C');

insert into public.story_scenarios (name, star_rating, result, video_sequence, has_chase, chase_result, is_donden, weight, is_active)
select '★6 当たり反撃D', 6, 'win', '["OP01","MS04","HP02","IT01","JD04"]'::jsonb, false, null, false, 70, true
where not exists (select 1 from public.story_scenarios where name = '★6 当たり反撃D');

insert into public.story_scenarios (name, star_rating, result, video_sequence, has_chase, chase_result, is_donden, weight, is_active)
select '★6 当たり逆転E', 6, 'win', '["OP02","MS05","TR02","HP01","IT01","JD03"]'::jsonb, false, null, true, 60, true
where not exists (select 1 from public.story_scenarios where name = '★6 当たり逆転E');

insert into public.story_scenarios (name, star_rating, result, video_sequence, has_chase, chase_result, is_donden, weight, is_active)
select '★6 当たり逆転F', 6, 'win', '["OP01","MS02","SN01","MS04","HP02","IT02","JD03"]'::jsonb, false, null, true, 50, true
where not exists (select 1 from public.story_scenarios where name = '★6 当たり逆転F');

-- ★7
insert into public.story_scenarios (name, star_rating, result, video_sequence, has_chase, chase_result, is_donden, weight, is_active)
select '★7 当たり試練B', 7, 'win', '["OP01","MS01","TR01","HP02","IT01","JD03"]'::jsonb, false, null, false, 90, true
where not exists (select 1 from public.story_scenarios where name = '★7 当たり試練B');

insert into public.story_scenarios (name, star_rating, result, video_sequence, has_chase, chase_result, is_donden, weight, is_active)
select '★7 当たり試練C', 7, 'win', '["OP03","MS04","TR02","HP01","IT02","JD04"]'::jsonb, false, null, false, 80, true
where not exists (select 1 from public.story_scenarios where name = '★7 当たり試練C');

insert into public.story_scenarios (name, star_rating, result, video_sequence, has_chase, chase_result, is_donden, weight, is_active)
select '★7 当たり瀧川D', 7, 'win', '["OP01","MS02","TR02","HP03","IT01","JD03"]'::jsonb, false, null, false, 80, true
where not exists (select 1 from public.story_scenarios where name = '★7 当たり瀧川D');

insert into public.story_scenarios (name, star_rating, result, video_sequence, has_chase, chase_result, is_donden, weight, is_active)
select '★7 当たり連続試練E', 7, 'win', '["OP02","MS03","TR01","TR02","HP02","IT02","JD03"]'::jsonb, false, null, true, 60, true
where not exists (select 1 from public.story_scenarios where name = '★7 当たり連続試練E');

insert into public.story_scenarios (name, star_rating, result, video_sequence, has_chase, chase_result, is_donden, weight, is_active)
select '★7 当たり絶望F', 7, 'win', '["OP01","MS05","SN01","TR03","HP01","IT01","JD04"]'::jsonb, false, null, true, 50, true
where not exists (select 1 from public.story_scenarios where name = '★7 当たり絶望F');

-- ★8
insert into public.story_scenarios (name, star_rating, result, video_sequence, has_chase, chase_result, is_donden, weight, is_active)
select '★8 大当たり予告B', 8, 'big_win', '["OP01","MS01","TR01","HP01","IT01","SN05","JD04"]'::jsonb, false, null, false, 90, true
where not exists (select 1 from public.story_scenarios where name = '★8 大当たり予告B');

insert into public.story_scenarios (name, star_rating, result, video_sequence, has_chase, chase_result, is_donden, weight, is_active)
select '★8 大当たり予告C', 8, 'big_win', '["OP02","MS02","TR02","HP02","IT02","SN04","JD04"]'::jsonb, false, null, false, 80, true
where not exists (select 1 from public.story_scenarios where name = '★8 大当たり予告C');

insert into public.story_scenarios (name, star_rating, result, video_sequence, has_chase, chase_result, is_donden, weight, is_active)
select '★8 大当たりフランケルD', 8, 'big_win', '["OP03","MS03","TR01","HP04","IT01","SN05","JD03"]'::jsonb, false, null, false, 80, true
where not exists (select 1 from public.story_scenarios where name = '★8 大当たりフランケルD');

insert into public.story_scenarios (name, star_rating, result, video_sequence, has_chase, chase_result, is_donden, weight, is_active)
select '★8 大当たり逆転E', 8, 'big_win', '["OP01","MS05","SN02","TR02","HP04","IT02","SN05","JD04"]'::jsonb, false, null, true, 60, true
where not exists (select 1 from public.story_scenarios where name = '★8 大当たり逆転E');

insert into public.story_scenarios (name, star_rating, result, video_sequence, has_chase, chase_result, is_donden, weight, is_active)
select '★8 大当たり連続ミスF', 8, 'big_win', '["OP02","MS02","MS03","SN01","HP01","IT01","SN05","JD04"]'::jsonb, false, null, true, 50, true
where not exists (select 1 from public.story_scenarios where name = '★8 大当たり連続ミスF');

-- ★9
insert into public.story_scenarios (name, star_rating, result, video_sequence, has_chase, chase_result, is_donden, weight, is_active)
select '★9 激アツフランケルB', 9, 'big_win', '["OP01","MS01","TR02","HP04","IT01","SN05","JD04"]'::jsonb, false, null, false, 90, true
where not exists (select 1 from public.story_scenarios where name = '★9 激アツフランケルB');

insert into public.story_scenarios (name, star_rating, result, video_sequence, has_chase, chase_result, is_donden, weight, is_active)
select '★9 激アツフランケルC', 9, 'big_win', '["OP03","MS03","TR01","HP04","IT02","SN05","JD04"]'::jsonb, false, null, false, 80, true
where not exists (select 1 from public.story_scenarios where name = '★9 激アツフランケルC');

insert into public.story_scenarios (name, star_rating, result, video_sequence, has_chase, chase_result, is_donden, weight, is_active)
select '★9 激アツ瀧川D', 9, 'big_win', '["OP02","MS04","TR02","HP03","HP04","IT02","SN05","JD04"]'::jsonb, false, null, false, 70, true
where not exists (select 1 from public.story_scenarios where name = '★9 激アツ瀧川D');

insert into public.story_scenarios (name, star_rating, result, video_sequence, has_chase, chase_result, is_donden, weight, is_active)
select '★9 激アツ逆転E', 9, 'big_win', '["OP01","MS05","SN01","TR03","SN02","HP04","IT02","SN05","JD04"]'::jsonb, false, null, true, 50, true
where not exists (select 1 from public.story_scenarios where name = '★9 激アツ逆転E');

insert into public.story_scenarios (name, star_rating, result, video_sequence, has_chase, chase_result, is_donden, weight, is_active)
select '★9 激アツ怒りF', 9, 'big_win', '["OP02","MS02","MS04","SN01","TR02","HP04","IT01","SN05","JD04"]'::jsonb, false, null, true, 50, true
where not exists (select 1 from public.story_scenarios where name = '★9 激アツ怒りF');

-- ★10
insert into public.story_scenarios (name, star_rating, result, video_sequence, has_chase, chase_result, is_donden, weight, is_active)
select '★10 追撃チャンスB', 10, 'big_win', '["OP02","MS02","TR01","HP04","IT01","SN05","JD04","TS01","TS02"]'::jsonb, true, 'success', false, 90, true
where not exists (select 1 from public.story_scenarios where name = '★10 追撃チャンスB');

insert into public.story_scenarios (name, star_rating, result, video_sequence, has_chase, chase_result, is_donden, weight, is_active)
select '★10 追撃チャンスC', 10, 'big_win', '["OP03","MS04","TR02","HP04","IT02","SN05","JD04","TS01","TS02"]'::jsonb, true, 'success', false, 80, true
where not exists (select 1 from public.story_scenarios where name = '★10 追撃チャンスC');

insert into public.story_scenarios (name, star_rating, result, video_sequence, has_chase, chase_result, is_donden, weight, is_active)
select '★10 追撃惜敗A', 10, 'big_win', '["OP01","MS01","TR02","HP04","IT01","SN05","JD03","TS01","TS03"]'::jsonb, true, 'fail', false, 70, true
where not exists (select 1 from public.story_scenarios where name = '★10 追撃惜敗A');

insert into public.story_scenarios (name, star_rating, result, video_sequence, has_chase, chase_result, is_donden, weight, is_active)
select '★10 追撃逆転D', 10, 'big_win', '["OP02","MS05","SN02","TR02","HP04","IT02","SN05","JD04","TS01","TS02"]'::jsonb, true, 'success', true, 50, true
where not exists (select 1 from public.story_scenarios where name = '★10 追撃逆転D');

insert into public.story_scenarios (name, star_rating, result, video_sequence, has_chase, chase_result, is_donden, weight, is_active)
select '★10 追撃逆転E', 10, 'big_win', '["OP01","MS02","MS05","SN01","HP04","IT01","SN05","JD03","TS01","TS03"]'::jsonb, true, 'fail', true, 50, true
where not exists (select 1 from public.story_scenarios where name = '★10 追撃逆転E');

-- ★11
insert into public.story_scenarios (name, star_rating, result, video_sequence, has_chase, chase_result, is_donden, weight, is_active)
select '★11 神レアB', 11, 'jackpot', '["OP01","MS01","TR02","HP04","IT01","SN05","JD05","TS01","TS02"]'::jsonb, true, 'success', false, 90, true
where not exists (select 1 from public.story_scenarios where name = '★11 神レアB');

insert into public.story_scenarios (name, star_rating, result, video_sequence, has_chase, chase_result, is_donden, weight, is_active)
select '★11 神レアC', 11, 'jackpot', '["OP03","MS03","TR01","TR02","HP04","IT02","SN05","JD05","TS01","TS02"]'::jsonb, true, 'success', false, 80, true
where not exists (select 1 from public.story_scenarios where name = '★11 神レアC');

insert into public.story_scenarios (name, star_rating, result, video_sequence, has_chase, chase_result, is_donden, weight, is_active)
select '★11 神レア逆転D', 11, 'jackpot', '["OP01","MS05","SN01","MS04","SN02","HP04","IT02","SN05","JD05","TS01","TS02"]'::jsonb, true, 'success', true, 50, true
where not exists (select 1 from public.story_scenarios where name = '★11 神レア逆転D');

insert into public.story_scenarios (name, star_rating, result, video_sequence, has_chase, chase_result, is_donden, weight, is_active)
select '★11 神レア瀧川E', 11, 'jackpot', '["OP02","MS02","TR02","HP03","HP04","IT02","SN05","JD05","TS01","TS02"]'::jsonb, true, 'success', false, 70, true
where not exists (select 1 from public.story_scenarios where name = '★11 神レア瀧川E');

-- ★12
insert into public.story_scenarios (name, star_rating, result, video_sequence, has_chase, chase_result, is_donden, weight, is_active)
select '★12 超神B', 12, 'jackpot', '["OP01","MS01","TR01","TR02","MS05","HP04","IT02","SN05","JD05","TS01","TS02"]'::jsonb, true, 'success', false, 100, true
where not exists (select 1 from public.story_scenarios where name = '★12 超神B');

insert into public.story_scenarios (name, star_rating, result, video_sequence, has_chase, chase_result, is_donden, weight, is_active)
select '★12 超神C', 12, 'jackpot', '["OP02","MS02","MS03","SN01","TR02","HP04","IT01","IT02","SN05","JD05","TS01","TS02"]'::jsonb, true, 'success', false, 100, true
where not exists (select 1 from public.story_scenarios where name = '★12 超神C');

insert into public.story_scenarios (name, star_rating, result, video_sequence, has_chase, chase_result, is_donden, weight, is_active)
select '★12 超神逆転D', 12, 'jackpot', '["OP01","MS05","SN01","TR03","SN02","TR02","HP04","IT02","SN05","JD05","TS01","TS02"]'::jsonb, true, 'success', true, 80, true
where not exists (select 1 from public.story_scenarios where name = '★12 超神逆転D');

insert into public.story_scenarios (name, star_rating, result, video_sequence, has_chase, chase_result, is_donden, weight, is_active)
select '★12 超神全員E', 12, 'jackpot', '["OP03","MS04","TR01","TR02","MS05","HP03","HP04","IT01","IT02","SN05","JD05","TS01","TS02"]'::jsonb, true, 'success', false, 80, true
where not exists (select 1 from public.story_scenarios where name = '★12 超神全員E');

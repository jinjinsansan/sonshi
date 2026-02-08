-- Seed sample cards for v2 star-based gacha
insert into public.cards (id, name, description, image_url, rarity, max_supply, current_supply, is_active, person_name, card_style, star)
values
  ('star_1_sample', 'スター1 サンプル', 'デモ用カード', '/cards/star-1.png', 'N', 100000, 0, true, 'SAMPLE', 'illustration', 1),
  ('star_2_sample', 'スター2 サンプル', 'デモ用カード', '/cards/star-2.png', 'N', 100000, 0, true, 'SAMPLE', 'illustration', 2),
  ('star_3_sample', 'スター3 サンプル', 'デモ用カード', '/cards/star-3.png', 'N', 100000, 0, true, 'SAMPLE', 'illustration', 3),
  ('star_4_sample', 'スター4 サンプル', 'デモ用カード', '/cards/star-4.png', 'R', 100000, 0, true, 'SAMPLE', 'illustration', 4),
  ('star_5_sample', 'スター5 サンプル', 'デモ用カード', '/cards/star-5.png', 'R', 100000, 0, true, 'SAMPLE', 'illustration', 5),
  ('star_6_sample', 'スター6 サンプル', 'デモ用カード', '/cards/star-6.png', 'SR', 100000, 0, true, 'SAMPLE', 'illustration', 6),
  ('star_7_sample', 'スター7 サンプル', 'デモ用カード', '/cards/star-7.png', 'SR', 100000, 0, true, 'SAMPLE', 'illustration', 7),
  ('star_8_sample', 'スター8 サンプル', 'デモ用カード', '/cards/star-8.png', 'SSR', 100000, 0, true, 'SAMPLE', 'illustration', 8),
  ('star_9_sample', 'スター9 サンプル', 'デモ用カード', '/cards/star-9.png', 'SSR', 100000, 0, true, 'SAMPLE', 'illustration', 9),
  ('star_10_sample', 'スター10 サンプル', 'デモ用カード', '/cards/star-10.png', 'UR', 100000, 0, true, 'SAMPLE', 'illustration', 10),
  ('star_11_sample', 'スター11 サンプル', 'デモ用カード', '/cards/star-11.png', 'UR', 100000, 0, true, 'SAMPLE', 'illustration', 11),
  ('star_12_sample', 'スター12 サンプル', 'デモ用カード', '/cards/star-12.png', 'UR', 100000, 0, true, 'SAMPLE', 'illustration', 12)
on conflict (id) do nothing;

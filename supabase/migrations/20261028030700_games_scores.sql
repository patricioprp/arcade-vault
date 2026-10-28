create table public.games (
  id text primary key,
  title text not null,
  playable boolean not null default false
);

create table public.scores (
  id bigint generated always as identity primary key,
  game_id text not null references public.games (id),
  player_name text not null check (char_length(player_name) between 1 and 10),
  score integer not null check (score between 1 and 10000000),
  created_at timestamptz not null default now()
);

create index scores_game_score_idx on public.scores (game_id, score desc, created_at);

alter table public.games enable row level security;
alter table public.scores enable row level security;

create policy "games: lectura pública" on public.games
  for select to anon, authenticated using (true);
create policy "scores: lectura pública" on public.scores
  for select to anon, authenticated using (true);
-- Sin policies de insert/update/delete: solo submit_score escribe.

insert into public.games (id, title, playable) values
  ('bloque-buster', 'BLOQUE BUSTER', false),
  ('caida', 'CAÍDA', false),
  ('serpentina', 'SERPENTINA', false),
  ('gloton', 'GLOTÓN', false),
  ('invasores', 'INVASORES', false),
  ('rocas', 'ROCAS', true),
  ('ranaria', 'RANARIA', false),
  ('duelo-pixel', 'DUELO PIXEL', false);

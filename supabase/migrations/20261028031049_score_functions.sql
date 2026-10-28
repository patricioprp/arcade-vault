create or replace function public.submit_score(p_game text, p_name text, p_score integer)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := upper(trim(coalesce(p_name, '')));
  v_id bigint;
begin
  if not exists (
    select 1 from public.games g where g.id = p_game and g.playable
  ) then
    raise exception 'submit_score: juego inexistente o no jugable';
  end if;

  if char_length(v_name) not between 1 and 10 then
    raise exception 'submit_score: nombre inválido';
  end if;

  if p_score is null or p_score not between 1 and 10000000 then
    raise exception 'submit_score: puntuación fuera de rango';
  end if;

  insert into public.scores (game_id, player_name, score)
  values (p_game, v_name, p_score)
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.get_leaderboard(p_game text, p_limit integer default 10)
returns table (rank integer, player_name text, score integer, created_at timestamptz)
language sql
stable
security invoker
set search_path = ''
as $$
  with best as (
    select distinct on (s.player_name) s.player_name, s.score, s.created_at
    from public.scores s
    where s.game_id = p_game
    order by s.player_name, s.score desc, s.created_at asc
  )
  select
    (row_number() over (order by b.score desc, b.created_at asc))::integer as rank,
    b.player_name,
    b.score,
    b.created_at
  from best b
  order by b.score desc, b.created_at asc
  limit least(greatest(coalesce(p_limit, 10), 0), 50);
$$;

create or replace function public.get_player_best(p_game text, p_name text)
returns table (rank integer, score integer, created_at timestamptz)
language sql
stable
security invoker
set search_path = ''
as $$
  with best as (
    select distinct on (s.player_name) s.player_name, s.score, s.created_at
    from public.scores s
    where s.game_id = p_game
    order by s.player_name, s.score desc, s.created_at asc
  ),
  ranked as (
    select
      (row_number() over (order by b.score desc, b.created_at asc))::integer as rank,
      b.player_name,
      b.score,
      b.created_at
    from best b
  )
  select r.rank, r.score, r.created_at
  from ranked r
  where r.player_name = upper(trim(p_name));
$$;

revoke execute on function public.submit_score(text, text, integer) from public;
revoke execute on function public.get_leaderboard(text, integer) from public;
revoke execute on function public.get_player_best(text, text) from public;

grant execute on function public.submit_score(text, text, integer) to anon, authenticated;
grant execute on function public.get_leaderboard(text, integer) to anon, authenticated;
grant execute on function public.get_player_best(text, text) to anon, authenticated;

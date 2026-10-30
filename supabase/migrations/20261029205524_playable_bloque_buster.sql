-- SPEC 08: BLOQUE BUSTER pasa de simulación a juego real con leaderboard.
update public.games set playable = true where id = 'bloque-buster';

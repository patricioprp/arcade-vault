-- SPEC 07: CAÍDA pasa de simulación a juego real con leaderboard.
update public.games set playable = true where id = 'caida';

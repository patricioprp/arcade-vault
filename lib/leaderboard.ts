import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { formatScoreDate, type ScoreRow } from "./scores";
import { createAnonClient } from "./supabase/anon";

// Top 10 del juego: mejor marca por jugador. Se invalida con updateTag(`leaderboard:${gameId}`)
// desde la Server Action submitScore.
export async function getLeaderboard(gameId: string): Promise<ScoreRow[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(`leaderboard:${gameId}`);

  const supabase = createAnonClient();
  const { data, error } = await supabase.rpc("get_leaderboard", {
    p_game: gameId,
    p_limit: 10,
  });

  // Lanzar en lugar de devolver [] para no cachear una tabla vacía por un fallo.
  if (error) throw new Error(`getLeaderboard(${gameId}): ${error.message}`);

  return data.map((row) => ({
    rank: row.rank,
    name: row.player_name,
    score: row.score,
    date: formatScoreDate(row.created_at),
  }));
}

// PARTIDAS del detalle: cantidad de marcas guardadas del juego. Mismo tag que el leaderboard,
// así submitScore invalida ambos con un solo updateTag.
export async function getPlayCount(gameId: string): Promise<number> {
  "use cache";
  cacheLife("hours");
  cacheTag(`leaderboard:${gameId}`);

  const supabase = createAnonClient();
  const { count, error } = await supabase
    .from("scores")
    .select("*", { count: "exact", head: true })
    .eq("game_id", gameId);

  if (error) throw new Error(`getPlayCount(${gameId}): ${error.message}`);

  return count ?? 0;
}

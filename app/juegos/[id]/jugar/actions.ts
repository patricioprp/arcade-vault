"use server";

import { updateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SubmitScoreResult = { ok: true } | { ok: false };

// Única vía de escritura desde la app: las reglas (juego jugable, nombre, rango) las valida submit_score en Postgres.
export async function submitScore(
  gameId: string,
  name: string,
  score: number,
): Promise<SubmitScoreResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("submit_score", {
      p_game: gameId,
      p_name: name,
      p_score: score,
    });
    if (error) throw error;
  } catch (error) {
    console.error("submitScore:", error);
    return { ok: false };
  }

  // Lectura inmediata: el Salón de la Fama ve la marca nueva en la siguiente request.
  updateTag(`leaderboard:${gameId}`);
  return { ok: true };
}

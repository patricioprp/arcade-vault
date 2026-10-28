"use client";

import { useEffect, useState } from "react";
import { formatScoreDate } from "@/lib/scores";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/user-store";

type Props = { gameId: string; gameTitle: string; delayMs: number };
type Best = { rank: number; score: number; date: string };

// Fila "TU MEJOR MARCA": busca la marca del nombre de av_user con get_player_best.
// Se oculta sin usuario, sin marca o si la consulta falla.
export function HallYouRow({ gameId, gameTitle, delayMs }: Props) {
  const { user } = useUser();
  const name = user?.name;
  // La clave evita mostrar la marca de otro juego/usuario mientras llega la consulta nueva.
  const [result, setResult] = useState<{ key: string; best: Best | null }>();
  const key = `${gameId}|${name ?? ""}`;

  useEffect(() => {
    if (!name) return;
    let active = true;
    const supabase = createClient();
    supabase
      .rpc("get_player_best", { p_game: gameId, p_name: name })
      .then(({ data, error }) => {
        if (!active) return;
        const row = !error ? data?.[0] : undefined;
        setResult({
          key: `${gameId}|${name}`,
          best: row
            ? {
                rank: row.rank,
                score: row.score,
                date: formatScoreDate(row.created_at),
              }
            : null,
        });
      });
    return () => {
      active = false;
    };
  }, [gameId, name]);

  const best = result?.key === key ? result.best : null;
  if (!user || !best) return null;

  return (
    <>
      <div className="tr you-label">▸ TU MEJOR MARCA EN {gameTitle}</div>
      <div className="tr you" style={{ animationDelay: `${delayMs}ms` }}>
        <div className="rk text-yellow!">
          #{String(best.rank).padStart(2, "0")}
        </div>
        <div className="pl text-yellow!">{user.name}</div>
        <div className="sc text-yellow! [text-shadow:0_0_6px_rgba(245,255,0,0.5)]!">
          {best.score.toLocaleString("es-ES")}
        </div>
        <div className="dt">{best.date}</div>
      </div>
    </>
  );
}

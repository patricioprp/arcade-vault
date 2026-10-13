"use client";

import { useUser } from "@/lib/user-store";

type Props = { gameId: string; gameTitle: string; refScore: number; delayMs: number };

// Fila decorativa "TU MEJOR MARCA": rango y puntuación inventados como en el template.
export function HallYouRow({ gameId, gameTitle, refScore, delayMs }: Props) {
  const { user } = useUser();
  if (!user) return null;

  const youRank = Math.floor(8 + (gameId.length % 4));
  const youScore = refScore - 2400 || 9999;

  return (
    <>
      <div className="tr you-label">▸ TU MEJOR MARCA EN {gameTitle}</div>
      <div className="tr you" style={{ animationDelay: `${delayMs}ms` }}>
        <div className="rk text-yellow!">#{String(youRank).padStart(2, "0")}</div>
        <div className="pl text-yellow!">{user.name}</div>
        <div className="sc text-yellow! [text-shadow:0_0_6px_rgba(245,255,0,0.5)]!">
          {youScore.toLocaleString("es-ES")}
        </div>
        <div className="dt">11/05/2026</div>
      </div>
    </>
  );
}

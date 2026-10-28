import type { ScoreRow } from "@/lib/scores";

const TOP = [" top1", " top2", " top3"];

export function Leaderboard({
  scores,
  playable,
}: {
  scores: ScoreRow[];
  playable: boolean;
}) {
  return (
    <div className="leaderboard">
      <h3>MEJORES PUNTUACIONES</h3>
      {scores.length === 0 ? (
        <div className="lb-empty">
          <p className="hall-empty-title">SIN PUNTUACIONES TODAVÍA</p>
          <p className="hall-empty-sub">
            {playable
              ? "GUARDÁ UNA PARTIDA PARA ESTRENAR LA TABLA"
              : "ESTE JUEGO TODAVÍA NO GUARDA PUNTUACIONES"}
          </p>
        </div>
      ) : (
        scores.map((r, i) => (
          <div key={r.name} className={"lb-row" + (TOP[i] ?? "")}>
            <div className="rk">#{String(r.rank).padStart(2, "0")}</div>
            <div className="pl">
              {r.name}
              <div className="text-[10px] tracking-[0.1em] text-ink-faint">
                {r.date}
              </div>
            </div>
            <div className="sc">{r.score.toLocaleString("es-ES")}</div>
          </div>
        ))
      )}
    </div>
  );
}

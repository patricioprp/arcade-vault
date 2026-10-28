import Link from "next/link";
import { Suspense } from "react";
import { PLAYABLE_GAMES } from "@/components/games/registry";
import { HallYouRow } from "@/components/hall-you-row";
import { GAMES, getGame } from "@/lib/games";
import { getLeaderboard } from "@/lib/leaderboard";
import type { ScoreRow } from "@/lib/scores";

type SearchParams = PageProps<"/salon-de-la-fama">["searchParams"];

const TOP = [" top1", " top2", " top3"];

// La cabecera y el botón final son estáticos; solo el tablero depende de ?juego= y va en <Suspense>.
export default function HallOfFamePage({
  searchParams,
}: PageProps<"/salon-de-la-fama">) {
  return (
    <div className="av-hall fade-in">
      <div className="hall-head">
        <h1>SALÓN DE LA FAMA</h1>
        <p className="pixel text-[10px]">
          LOS NOMBRES QUE NUNCA SE BORRAN DE LA PANTALLA
        </p>
      </div>

      <Suspense fallback={<div className="min-h-[60vh]" />}>
        <HallBoard searchParams={searchParams} />
      </Suspense>

      <div className="mt-8 text-center">
        <Link href="/juegos" className="btn lg">
          VOLVER A LA BIBLIOTECA
        </Link>
      </div>
    </div>
  );
}

async function HallBoard({ searchParams }: { searchParams: SearchParams }) {
  const { juego } = await searchParams;
  const requested = typeof juego === "string" ? getGame(juego) : undefined;
  const game = requested ?? GAMES[0];
  const rows = await getLeaderboard(game.id);
  const playable = Boolean(PLAYABLE_GAMES[game.id]);

  return (
    <>
      <div className="hall-tabs">
        {GAMES.map((g) => (
          <Link
            key={g.id}
            href={`/salon-de-la-fama?juego=${g.id}`}
            className={"chip" + (g.id === game.id ? " active" : "")}
            aria-current={g.id === game.id ? "page" : undefined}
            scroll={false}
          >
            {g.title}
          </Link>
        ))}
      </div>

      <div className="podium">
        <PodiumSlot medal="silver" rank={2} row={rows[1]} />
        <PodiumSlot medal="gold" rank={1} row={rows[0]} />
        <PodiumSlot medal="bronze" rank={3} row={rows[2]} />
      </div>

      <div className="hall-table">
        <div className="th">
          <div>RANGO</div>
          <div>JUGADOR</div>
          <div>PUNTUACIÓN</div>
          <div>FECHA</div>
        </div>
        {rows.length === 0 ? (
          <div className="hall-empty">
            <p className="hall-empty-title">SIN PUNTUACIONES TODAVÍA</p>
            {playable ? (
              <Link href={`/juegos/${game.id}/jugar`} className="btn yellow">
                JUGAR {game.title}
              </Link>
            ) : (
              <p className="hall-empty-sub">
                ESTE JUEGO TODAVÍA NO GUARDA PUNTUACIONES
              </p>
            )}
          </div>
        ) : (
          rows.map((r, i) => (
            <div
              key={r.name}
              className={"tr" + (TOP[i] ?? "")}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="rk">#{String(r.rank).padStart(2, "0")}</div>
              <div className="pl">{r.name}</div>
              <div className="sc">{r.score.toLocaleString("es-ES")}</div>
              <div className="dt">{r.date}</div>
            </div>
          ))
        )}
        <HallYouRow
          gameId={game.id}
          gameTitle={game.title}
          delayMs={rows.length * 50 + 50}
        />
      </div>
    </>
  );
}

// Puesto del podio; sin marca muestra "—" sin puntuación ni fecha.
function PodiumSlot({
  medal,
  rank,
  row,
}: {
  medal: "gold" | "silver" | "bronze";
  rank: number;
  row: ScoreRow | undefined;
}) {
  const gold = medal === "gold";
  return (
    <div className={`podium-slot ${medal}` + (row ? "" : " empty")}>
      {gold && (
        <div className="pixel text-[9px] tracking-[0.18em] text-gold">
          CAMPEÓN
        </div>
      )}
      <div className={"rank-num" + (gold ? " mt-1 text-[36px]!" : "")}>
        {String(rank).padStart(2, "0")}
      </div>
      <div className="name">{row ? row.name : "—"}</div>
      {row && (
        <>
          <div className={"score" + (gold ? " text-[20px]!" : "")}>
            {row.score.toLocaleString("es-ES")}
          </div>
          <div className="date">{row.date}</div>
        </>
      )}
    </div>
  );
}

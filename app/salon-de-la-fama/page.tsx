import Link from "next/link";
import { Suspense } from "react";
import { HallYouRow } from "@/components/hall-you-row";
import { GAMES, getGame } from "@/lib/games";
import { seededScores } from "@/lib/scores";

type SearchParams = PageProps<"/salon-de-la-fama">["searchParams"];

const TOP = [" top1", " top2", " top3"];

// La cabecera y el botón final son estáticos; solo el tablero depende de ?juego= y va en <Suspense>.
export default function HallOfFamePage({ searchParams }: PageProps<"/salon-de-la-fama">) {
  return (
    <div className="av-hall fade-in">
      <div className="hall-head">
        <h1>SALÓN DE LA FAMA</h1>
        <p className="pixel text-[10px]">LOS NOMBRES QUE NUNCA SE BORRAN DE LA PANTALLA</p>
      </div>

      <Suspense fallback={<div className="min-h-[60vh]" />}>
        <HallBoard searchParams={searchParams} />
      </Suspense>

      <div className="mt-8 text-center">
        <Link href="/" className="btn lg">
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
  const rows = seededScores(game.id.length * 23 + 7, 12);

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
        <div className="podium-slot silver">
          <div className="rank-num">02</div>
          <div className="name">{rows[1].name}</div>
          <div className="score">{rows[1].score.toLocaleString("es-ES")}</div>
          <div className="date">{rows[1].date}</div>
        </div>
        <div className="podium-slot gold">
          <div className="pixel text-[9px] tracking-[0.18em] text-gold">CAMPEÓN</div>
          <div className="rank-num mt-1 text-[36px]!">01</div>
          <div className="name">{rows[0].name}</div>
          <div className="score text-[20px]!">{rows[0].score.toLocaleString("es-ES")}</div>
          <div className="date">{rows[0].date}</div>
        </div>
        <div className="podium-slot bronze">
          <div className="rank-num">03</div>
          <div className="name">{rows[2].name}</div>
          <div className="score">{rows[2].score.toLocaleString("es-ES")}</div>
          <div className="date">{rows[2].date}</div>
        </div>
      </div>

      <div className="hall-table">
        <div className="th">
          <div>RANGO</div>
          <div>JUGADOR</div>
          <div>PUNTUACIÓN</div>
          <div>FECHA</div>
        </div>
        {rows.map((r, i) => (
          <div
            key={r.name + i}
            className={"tr" + (TOP[i] ?? "")}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="rk">#{String(r.rank).padStart(2, "0")}</div>
            <div className="pl">{r.name}</div>
            <div className="sc">{r.score.toLocaleString("es-ES")}</div>
            <div className="dt">{r.date}</div>
          </div>
        ))}
        <HallYouRow
          gameId={game.id}
          gameTitle={game.title}
          refScore={rows[5].score}
          delayMs={rows.length * 50 + 50}
        />
      </div>
    </>
  );
}

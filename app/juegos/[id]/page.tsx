import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PLAYABLE_GAMES } from "@/components/games/registry";
import { Leaderboard } from "@/components/leaderboard";
import { GAMES, getGame } from "@/lib/games";
import { getLeaderboard, getPlayCount } from "@/lib/leaderboard";

type Params = PageProps<"/juegos/[id]">["params"];

export function generateStaticParams() {
  return GAMES.map((g) => ({ id: g.id }));
}

// La grilla es la App Shell compartida; lo que depende del id va dentro de <Suspense>.
export default function GameDetailPage({ params }: PageProps<"/juegos/[id]">) {
  return (
    <div className="av-detail fade-in">
      <Suspense fallback={<DetailSkeleton />}>
        <GameDetail params={params} />
      </Suspense>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <>
      <div>
        <div className="detail-cover"></div>
      </div>
      <aside>
        <div className="leaderboard">
          <h3>MEJORES PUNTUACIONES</h3>
        </div>
      </aside>
    </>
  );
}

async function GameDetail({ params }: { params: Params }) {
  const { id } = await params;
  const game = getGame(id);
  if (!game) notFound();

  const [scores, plays] = await Promise.all([
    getLeaderboard(id),
    getPlayCount(id),
  ]);
  const best = scores[0]?.score;

  return (
    <>
      <div>
        <div className="detail-cover">
          <div className={"cover-bg " + game.cover}></div>
        </div>
        <div className="detail-info mt-5">
          <div className="detail-tags">
            <span>{game.cat}</span>
            <span>1 JUGADOR</span>
            <span>TECLADO / TÁCTIL</span>
            <span>RETRO 1985</span>
          </div>
          <h2 className="neon-cyan">{game.title}</h2>
          <p>{game.long}</p>
          <div className="stat-strip">
            <div>
              <div className="l">Partidas</div>
              <div className="v">{plays.toLocaleString("es-ES")}</div>
            </div>
            <div>
              <div className="l">Mejor global</div>
              <div className="v text-magenta [text-shadow:0_0_6px_rgba(255,0,110,0.5)]">
                {best !== undefined ? best.toLocaleString("es-ES") : "—"}
              </div>
            </div>
            <div>
              <div className="l">Dificultad</div>
              <div
                className="v text-yellow [text-shadow:0_0_6px_rgba(245,255,0,0.5)]"
                aria-label={`${game.difficulty} de 5`}
              >
                {Array.from({ length: 5 }, (_, i) =>
                  i < game.difficulty ? "★" : "☆",
                ).join(" ")}
              </div>
            </div>
          </div>
          <div className="detail-actions">
            <Link href={`/juegos/${game.id}/jugar`} className="btn xl pulse">
              ▶&nbsp;&nbsp;JUGAR AHORA
            </Link>
            <Link href="/juegos" className="btn ghost lg">
              VOLVER AL VAULT
            </Link>
          </div>
        </div>
      </div>

      <aside>
        <Leaderboard
          scores={scores}
          playable={Boolean(PLAYABLE_GAMES[game.id])}
        />
      </aside>
    </>
  );
}

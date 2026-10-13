import { notFound } from "next/navigation";
import { Suspense } from "react";
import { GamePlayer } from "@/components/game-player";
import { GAMES, getGame } from "@/lib/games";

type Params = PageProps<"/juegos/[id]/jugar">["params"];

export function generateStaticParams() {
  return GAMES.map((g) => ({ id: g.id }));
}

// El marco del reproductor es la App Shell compartida; el juego (según el id) va dentro de <Suspense>.
export default function GamePlayerPage({ params }: PageProps<"/juegos/[id]/jugar">) {
  return (
    <Suspense fallback={<PlayerSkeleton />}>
      <Player params={params} />
    </Suspense>
  );
}

function PlayerSkeleton() {
  return (
    <div className="av-player fade-in">
      <div className="player-hud min-h-[72px]"></div>
      <div className="crt">
        <div className="crt-screen"></div>
      </div>
    </div>
  );
}

async function Player({ params }: { params: Params }) {
  const { id } = await params;
  const game = getGame(id);
  if (!game) notFound();

  return <GamePlayer game={game} />;
}

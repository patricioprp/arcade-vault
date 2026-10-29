import type { ComponentType } from "react";
import { AsteroidsCanvas } from "./asteroids";
import { TetrisCanvas } from "./tetris";

// Lo que un juego real le reporta al reproductor para el HUD.
export type PlayableGameStats = {
  score: number;
  lives: number;
  level: number;
  extra?: { label: string; value: string }; // celda opcional del HUD (p. ej. "Disparo 3x")
};

export type PlayableGameProps = {
  paused: boolean; // true con pausa o con el modal abierto
  onStats: (stats: PlayableGameStats) => void;
  onGameOver: (finalScore: number) => void;
};

// id del catálogo (lib/games.ts) → componente jugable. Los ids sin entrada usan la arena simulada.
export const PLAYABLE_GAMES: Partial<
  Record<string, ComponentType<PlayableGameProps>>
> = {
  rocas: AsteroidsCanvas,
  caida: TetrisCanvas,
};

import type { ComponentType } from "react";
import type { SkinId } from "@/lib/skins";
import { ArkanoidCanvas } from "./arkanoid";
import { AsteroidsCanvas } from "./asteroids";
import { SnakeCanvas } from "./snake";
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
  skin: SkinId; // skin elegida en el reproductor; cambia en caliente sin remontar
  onStats: (stats: PlayableGameStats) => void;
  onGameOver: (finalScore: number) => void;
};

// id del catálogo (lib/games.ts) → componente jugable. Los ids sin entrada usan la arena simulada.
export const PLAYABLE_GAMES: Partial<
  Record<string, ComponentType<PlayableGameProps>>
> = {
  rocas: AsteroidsCanvas,
  caida: TetrisCanvas,
  "bloque-buster": ArkanoidCanvas,
  serpentina: SnakeCanvas,
};

// Juegos que ya implementan skins: el reproductor solo muestra el selector para estos ids.
// Cada spec de skins agrega el suyo.
export const SKINNED_GAMES: ReadonlySet<string> = new Set([
  "rocas",
  "caida",
  "bloque-buster",
  "serpentina",
]);

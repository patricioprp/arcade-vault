// Paletas de ROCAS. Solo cosméticas: no cambian formas, física ni puntuación.
// Colores siempre en hex #rrggbb; transparencias con claves numéricas (render.ts usa globalAlpha).

import type { SkinId } from "@/lib/skins";

export type AsteroidsGlow = {
  ship: number; // shadowBlur de la nave
  asteroid: number;
  bullet: number;
  thrust: number; // llama del propulsor
  powerUp: number; // rombo del power-up
  powerUpText: number; // texto "3x"
};

export type AsteroidsPalette = {
  background: string; // relleno base del espacio
  spaceHalo: string | null; // centro del degradé radial; null = sin halo
  starBase: string; // estrellas comunes
  starAccent: string; // el 30 % de estrellas marcadas
  starAlpha: number; // multiplica el alpha propio de cada estrella; 0 = no se dibujan
  ship: string;
  thrust: string;
  bullet: string;
  asteroid: string; // trazo de las rocas
  asteroidFill: string; // relleno interior de las rocas
  asteroidFillAlpha: number; // 0 = sin relleno
  powerUp: string; // rombo
  powerUpText: string; // "3x"
  particleShip: string; // chispas de la nave al explotar
  particleAsteroid: string; // chispas de las rocas
  core: { color: string; alpha: number } | null; // núcleo fino del trazo fósforo; null = un solo trazo
  strokeAlpha: number; // alpha del trazo principal
  lineScale: number; // multiplica los lineWidth (no cambia geometría ni hitboxes)
  glow: AsteroidsGlow;
  blend: "lighter" | "source-over"; // globalCompositeOperation de las entidades
};

// Extracción exacta del look original (paleta de app/globals.css).
const neon: AsteroidsPalette = {
  background: "#000000",
  spaceHalo: "#0a0a30", // halo de .cover-rocas
  starBase: "#e6e9ff",
  starAccent: "#00f5ff",
  starAlpha: 1,
  ship: "#00f5ff", // --cyan
  thrust: "#f5ff00", // --yellow
  bullet: "#f5ff00",
  asteroid: "#ff006e", // --magenta
  asteroidFill: "#ff006e",
  asteroidFillAlpha: 0.05,
  powerUp: "#00ff88", // --green
  powerUpText: "#00ff88",
  particleShip: "#00f5ff",
  particleAsteroid: "#ff006e",
  core: { color: "#ffffff", alpha: 0.55 },
  strokeAlpha: 0.75,
  lineScale: 1,
  glow: {
    ship: 14,
    asteroid: 12,
    bullet: 10,
    thrust: 10,
    powerUp: 14,
    powerUpText: 8,
  },
  blend: "lighter",
};

// Monitor de fósforo ámbar: un solo tono en 4 intensidades.
const retro: AsteroidsPalette = {
  background: "#0a0700",
  spaceHalo: "#1a1000",
  starBase: "#5c3f00",
  starAccent: "#996900",
  starAlpha: 1,
  ship: "#ffd060",
  thrust: "#ffb000",
  bullet: "#ffd060",
  asteroid: "#cc8c00",
  asteroidFill: "#cc8c00",
  asteroidFillAlpha: 0.04,
  powerUp: "#ffb000",
  powerUpText: "#ffb000",
  particleShip: "#ffd060",
  particleAsteroid: "#996900",
  core: { color: "#ffe8a8", alpha: 0.35 },
  strokeAlpha: 0.9,
  lineScale: 1,
  glow: {
    ship: 6,
    asteroid: 5,
    bullet: 4,
    thrust: 4,
    powerUp: 6,
    powerUpText: 3,
  },
  blend: "lighter",
};

// Homenaje a Asteroids (Atari, 1979): vectores blancos sobre negro, sin glow ni estrellas.
const clasico: AsteroidsPalette = {
  background: "#000000",
  spaceHalo: null,
  starBase: "#ffffff",
  starAccent: "#ffffff",
  starAlpha: 0,
  ship: "#ffffff",
  thrust: "#ffffff",
  bullet: "#ffffff",
  asteroid: "#bdbdbd",
  asteroidFill: "#000000",
  asteroidFillAlpha: 0,
  powerUp: "#ffffff",
  powerUpText: "#ffffff",
  particleShip: "#ffffff",
  particleAsteroid: "#bdbdbd",
  core: null,
  strokeAlpha: 1,
  lineScale: 0.7,
  glow: {
    ship: 0,
    asteroid: 0,
    bullet: 0,
    thrust: 0,
    powerUp: 0,
    powerUpText: 0,
  },
  blend: "source-over",
};

export const SKINS = { neon, retro, clasico } satisfies Record<
  SkinId,
  AsteroidsPalette
>;

// Paletas de SERPENTINA. Solo cosméticas: no cambian grilla, velocidad ni puntuación.
// Colores siempre en hex #rrggbb; transparencias con claves …Alpha (render.ts usa globalAlpha,
// salvo paradas de degradé y sombras, que usan withAlpha).

import type { SkinId } from "@/lib/skins";

export type SnakePalette = {
  background: string; // relleno de todo el canvas
  gridDot: string; // puntos en las intersecciones de la grilla
  gridDotAlpha: number;
  wall: string; // borde del área de juego
  wallAlpha: number;
  wallWidth: number; // lineWidth de la pared
  wallGlow: number; // shadowBlur de la pared (0 = sin glow)
  win: string; // pared al ganar (parpadea)
  winWidth: number;
  winAlphaOff: number; // alpha en la fase apagada del parpadeo (la encendida es 1)
  winGlowOn: number;
  winGlowOff: number;
  halo: string; // halo radial bajo la fruta
  haloAlpha: number; // alpha base; 0 = no se dibuja
  haloBreathAlpha: number; // se suma × respiración (0 → 1)
  fruitTint: string | null; // null = sprite con sus colores; color = silueta teñida
  fruitGlow: number; // shadowBlur del sprite (0 = sin sombra)
  fruitGlowAlpha: number; // alpha del color de la sombra (sombra = withAlpha(halo, fruitGlowAlpha))
  fruitCore: string; // núcleo circular mientras carga la imagen
  fruitCoreGlow: number;
  head: string; // cabeza (cuadrado redondeado)
  eye: string; // ojos de la cabeza
  headGlow: number; // shadowBlur base de la cabeza
  headGlowPulse: number; // se suma × pulso en "ready"
  neck: string; // primer segmento del cuerpo
  tail: string; // último segmento; el resto interpola con mixHex
  glow: string; // color del trazo de fondo del cuerpo y de la sombra de la cabeza
  bodyGlow: number; // shadowBlur del trazo de fondo del cuerpo
  crash: string; // cuerpo en choque y derrota, núcleo del anillo
  crashRingGlow: number; // shadowBlur del anillo de choque
};

// Interpola dos "#rrggbb" en RGB y devuelve "#rrggbb" (redondeo por canal, t en [0, 1]).
// Copia local del helper de lib/tetris/skins.ts, para no acoplar dos juegos.
export function mixHex(a: string, b: string, t: number): string {
  let out = "#";
  for (let i = 1; i < 7; i += 2) {
    const ca = parseInt(a.slice(i, i + 2), 16);
    const cb = parseInt(b.slice(i, i + 2), 16);
    out += Math.round(ca + (cb - ca) * t)
      .toString(16)
      .padStart(2, "0");
  }
  return out;
}

// "#rrggbb" + alpha → "#rrggbbaa". Solo para paradas de degradé y shadowColor, donde globalAlpha no sirve.
export function withAlpha(hex: string, alpha: number): string {
  return (
    hex +
    Math.round(Math.min(1, Math.max(0, alpha)) * 255)
      .toString(16)
      .padStart(2, "0")
  );
}

// Look original (tokens de app/globals.css), con cola y pared aclaradas para llegar a 4,5:1.
const neon: SnakePalette = {
  background: "#000000",
  gridDot: "#00f5ff", // --cyan
  gridDotAlpha: 0.09,
  wall: "#00f5ff", // --cyan
  wallAlpha: 0.55, // antes 0,35 (2,48:1)
  wallWidth: 2,
  wallGlow: 8,
  win: "#00ff88", // --green
  winWidth: 3,
  winAlphaOff: 0.3,
  winGlowOn: 22,
  winGlowOff: 6,
  halo: "#f5ff00", // --yellow
  haloAlpha: 0.22,
  haloBreathAlpha: 0.12,
  fruitTint: null, // sprite original
  fruitGlow: 8,
  fruitGlowAlpha: 0.6,
  fruitCore: "#ff006e", // --magenta
  fruitCoreGlow: 14,
  head: "#c8ffe6", // fósforo recién encendido
  eye: "#03140d",
  headGlow: 10,
  headGlowPulse: 14,
  neck: "#00ff88", // --green
  tail: "#0f8a5a", // antes #0b5a3a (2,54:1)
  glow: "#00ff88", // --green
  bodyGlow: 16,
  crash: "#ff006e", // --magenta
  crashRingGlow: 18,
};

// Fósforo ámbar: A #ffb000 · B #d99600 · C #b37b00, como ROCAS y CAÍDA.
const retro: SnakePalette = {
  background: "#0a0700",
  gridDot: "#ffb000",
  gridDotAlpha: 0.08,
  wall: "#b37b00", // C
  wallAlpha: 1,
  wallWidth: 2,
  wallGlow: 4,
  win: "#ffb000", // A
  winWidth: 3,
  winAlphaOff: 0.3,
  winGlowOn: 10,
  winGlowOff: 3,
  halo: "#ffb000",
  haloAlpha: 0.12,
  haloBreathAlpha: 0.08,
  fruitTint: "#ffb000", // silueta A
  fruitGlow: 4,
  fruitGlowAlpha: 0.5,
  fruitCore: "#ffb000",
  fruitCoreGlow: 6,
  head: "#ffb000", // A
  eye: "#0a0700",
  headGlow: 4,
  headGlowPulse: 6,
  neck: "#d99600", // B
  tail: "#b37b00", // C
  glow: "#d99600",
  bodyGlow: 6,
  crash: "#ffb000", // el cuerpo entero salta a A y parpadea
  crashRingGlow: 8,
};

// Snake de Nokia: LCD verde claro, tinta #43523d y tinta fuerte #263021. Sin glow.
const clasico: SnakePalette = {
  background: "#c7f0d8", // LCD
  gridDot: "#43523d",
  gridDotAlpha: 0.15,
  wall: "#43523d",
  wallAlpha: 1,
  wallWidth: 3,
  wallGlow: 0,
  win: "#263021",
  winWidth: 3,
  winAlphaOff: 0.3,
  winGlowOn: 0,
  winGlowOff: 0,
  halo: "#43523d",
  haloAlpha: 0, // sin halo
  haloBreathAlpha: 0,
  fruitTint: "#43523d", // silueta en tinta
  fruitGlow: 0,
  fruitGlowAlpha: 0,
  fruitCore: "#43523d",
  fruitCoreGlow: 0,
  head: "#263021",
  eye: "#c7f0d8", // ojos del color del LCD
  headGlow: 0,
  headGlowPulse: 0,
  neck: "#43523d",
  tail: "#43523d", // cuerpo uniforme, como el original
  glow: "#43523d",
  bodyGlow: 0,
  crash: "#263021", // parpadea entre tinta fuerte y tinta al 45 %
  crashRingGlow: 0,
};

export const SKINS = { neon, retro, clasico } satisfies Record<
  SkinId,
  SnakePalette
>;

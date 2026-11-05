// Paletas de CAÍDA. Solo cosméticas: no cambian tablero, piezas ni puntuación.
// Colores siempre en hex #rrggbb; transparencias con claves …Alpha (render.ts usa globalAlpha).

import type { SkinId } from "@/lib/skins";
import type { PieceType } from "./pieces";

// Patrón dentro de la celda. No cambia el tamaño del bloque ni del área ocupada.
// "dot": cuadrado centrado de round(size / 4) px.
// "cross": X de esquina a esquina del interior (inset + 6), trazo de 2 px.
export type BlockMark = "none" | "dot" | "cross";

export type TetrisPalette = {
  background: string; // fondo de todo el canvas
  wellInner: string; // centro del halo radial del pozo (opaco)
  wellOuter: string; // borde del halo radial del pozo (opaco)
  gridDot: string; // puntos de la cuadrícula
  gridDotAlpha: number;
  frame: string; // marco del pozo y del panel SIGUIENTE
  frameWidth: number; // lineWidth del marco
  frameAlpha: number;
  frameGlow: number; // shadowBlur del marco (0 = sin glow)
  panelBg: string; // fondo del panel SIGUIENTE
  panelBgAlpha: number;
  label: string; // texto SIGUIENTE
  pieces: Record<PieceType, string>; // 1 I · 2 O · 3 T · 4 S · 5 Z · 6 J · 7 L
  marks: Record<PieceType, BlockMark>;
  dead: string; // color al que se apagan las filas en el fin de partida
  fillAlpha: number; // alpha del relleno del bloque
  deadFillBoost: number; // relleno = fillAlpha + dead × deadFillBoost
  blockStrokeWidth: number;
  blockOutline: string | null; // null = borde del color de la pieza
  blockGlow: number; // shadowBlur del borde del bloque, × (1 − dead)
  sheen: string; // brillo pixel arriba a la izquierda
  sheenAlpha: number; // × (1 − dead); 0 = no se dibuja
  ghostAlpha: number; // alpha de la pieza fantasma
};

// Interpola dos "#rrggbb" en RGB y devuelve "#rrggbb" (redondeo por canal, t en [0, 1]).
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

// Look original (paleta de app/globals.css y .cover-tetro), con la T aclarada.
const neon: TetrisPalette = {
  background: "#000000",
  wellInner: "#2a004a", // halo de .cover-tetro
  wellOuter: "#06060e", // rgba(10, 10, 24, 0.6) compuesto sobre #000000
  gridDot: "#e6e9ff", // --ink
  gridDotAlpha: 0.1,
  frame: "#00f5ff", // --cyan
  frameWidth: 2,
  frameAlpha: 0.7,
  frameGlow: 12,
  panelBg: "#0a0a18",
  panelBgAlpha: 0.8,
  label: "#8a8fb5", // --ink-dim
  pieces: {
    1: "#00f5ff", // I — --cyan
    2: "#f5ff00", // O — --yellow
    3: "#bb55ff", // T — violeta de .cover-tetro aclarado (antes #aa00ff) para llegar a 4,5:1
    4: "#00ff88", // S — --green
    5: "#ff006e", // Z — --magenta
    6: "#3d7bff", // J — azul eléctrico
    7: "#ff7700", // L — naranja de .cover-tetro
  },
  marks: {
    1: "none",
    2: "none",
    3: "none",
    4: "none",
    5: "none",
    6: "none",
    7: "none",
  },
  dead: "#4a4f70", // --ink-faint
  fillAlpha: 0.22,
  deadFillBoost: 0.18,
  blockStrokeWidth: 2,
  blockOutline: null,
  blockGlow: 10,
  sheen: "#ffffff",
  sheenAlpha: 0.6,
  ghostAlpha: 0.2,
};

// Monitor de fósforo ámbar: 3 intensidades (A #ffb000, B #d99600, C #b37b00) + patrón por pieza.
const retro: TetrisPalette = {
  background: "#0a0700",
  wellInner: "#1f1400",
  wellOuter: "#0a0700",
  gridDot: "#ffb000",
  gridDotAlpha: 0.12,
  frame: "#b37b00",
  frameWidth: 2,
  frameAlpha: 1,
  frameGlow: 6,
  panelBg: "#0a0700",
  panelBgAlpha: 1,
  label: "#d99600",
  pieces: {
    1: "#ffb000", // I — A
    2: "#d99600", // O — B
    3: "#b37b00", // T — C
    4: "#ffb000", // S — A
    5: "#d99600", // Z — B
    6: "#b37b00", // J — C
    7: "#ffb000", // L — A
  },
  marks: {
    1: "none",
    2: "none",
    3: "none",
    4: "dot",
    5: "dot",
    6: "cross",
    7: "cross",
  },
  dead: "#5c3f00",
  fillAlpha: 0.35,
  deadFillBoost: 0.1,
  blockStrokeWidth: 2,
  blockOutline: null,
  blockGlow: 4,
  sheen: "#ffb000",
  sheenAlpha: 0,
  ghostAlpha: 0.3,
};

// Tetris Guideline: bloques planos opacos con contorno negro, sin glow ni brillo.
const clasico: TetrisPalette = {
  background: "#2e2e2e",
  wellInner: "#000000",
  wellOuter: "#000000",
  gridDot: "#ffffff",
  gridDotAlpha: 0.14,
  frame: "#c0c0c0",
  frameWidth: 3,
  frameAlpha: 1,
  frameGlow: 0,
  panelBg: "#000000",
  panelBgAlpha: 1,
  label: "#ffffff",
  pieces: {
    1: "#00f0f0", // I — cian
    2: "#f0f000", // O — amarillo
    3: "#b040ff", // T — púrpura aclarado
    4: "#00f000", // S — verde
    5: "#ff2020", // Z — rojo
    6: "#5070ff", // J — azul aclarado
    7: "#f0a000", // L — naranja
  },
  marks: {
    1: "none",
    2: "none",
    3: "none",
    4: "none",
    5: "none",
    6: "none",
    7: "none",
  },
  dead: "#808080",
  fillAlpha: 1,
  deadFillBoost: 0,
  blockStrokeWidth: 2,
  blockOutline: "#000000",
  blockGlow: 0,
  sheen: "#ffffff",
  sheenAlpha: 0,
  ghostAlpha: 0.25,
};

export const SKINS = { neon, retro, clasico } satisfies Record<
  SkinId,
  TetrisPalette
>;

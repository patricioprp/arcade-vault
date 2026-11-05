// Paletas de BLOQUE BUSTER. Solo cosméticas: no cambian bloques, niveles ni puntuación.
// Colores siempre en hex #rrggbb; transparencias con claves …Alpha (render.ts usa globalAlpha).

import type { SkinId } from "@/lib/skins";
import type { BlockColor } from "./levels";

export type ArkanoidPalette = {
  background: string; // fondo de todo el canvas
  // Marco (paredes izquierda, techo y derecha)
  frame: string;
  frameAlpha: number;
  frameWidth: number; // lineWidth del marco
  frameGlow: number; // shadowBlur del marco (0 = sin glow)
  // Marco con victoria: parpadea entre "on" y "off"
  win: string;
  winAlphaOff: number; // alpha en la fase apagada; en la encendida es 1
  winWidth: number;
  winGlowOn: number;
  winGlowOff: number;
  // Bloques
  blocks: Record<BlockColor, string>; // red · hotpink · magenta · yellow · cyan · green · gray
  blockFillAlpha: number; // alpha del relleno del bloque
  blockStrokeWidth: number;
  blockOutline: string | null; // null = borde del color del bloque
  blockGlow: number; // shadowBlur del borde del bloque
  sheen: string; // brillo horizontal arriba a la izquierda
  sheenAlpha: number; // 0 = no se dibuja
  // Estallido de bloque (150 ms)
  flash: string; // fogonazo del primer 35 %
  flashAlpha: number; // alpha inicial del fogonazo, baja a 0
  explosionGlow: number; // shadowBlur del contorno que se expande
  // Chispas de la paleta desintegrada (derrota)
  sparkFrom: string; // color con endT = 0; también es su shadowColor
  sparkTo: string; // color con endT = 1
  sparkGlow: number;
  // Paleta del jugador (cápsula)
  paddle: string; // borde y glow
  paddleFillAlpha: number; // relleno del color de la paleta
  paddleGlow: number;
  paddleCore: string; // línea central
  paddleCoreAlpha: number;
  // Pelota
  ball: string; // relleno y glow
  ballGlow: number;
  ballCore: string; // núcleo de radio r × 0,5
  ballCoreAlpha: number; // 0 = sin núcleo
  blend: "lighter" | "source-over"; // globalCompositeOperation de estallidos y chispas
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

// Look original: tubos de neón sobre negro (tokens de app/globals.css).
const neon: ArkanoidPalette = {
  background: "#000000",
  frame: "#00f5ff", // --cyan
  frameAlpha: 0.25,
  frameWidth: 2,
  frameGlow: 6,
  win: "#00ff88", // --green
  winAlphaOff: 0.3,
  winWidth: 3,
  winGlowOn: 22,
  winGlowOff: 6,
  blocks: {
    red: "#ff2d2d",
    hotpink: "#ff006e", // --magenta
    magenta: "#c34bff",
    yellow: "#f5ff00", // --yellow
    cyan: "#00f5ff", // --cyan
    green: "#00ff88", // --green
    gray: "#8a8fb5", // --ink-dim
  },
  blockFillAlpha: 0.2,
  blockStrokeWidth: 2,
  blockOutline: null,
  blockGlow: 8,
  sheen: "#ffffff",
  sheenAlpha: 0.45,
  flash: "#ffffff",
  flashAlpha: 0.7,
  explosionGlow: 16,
  sparkFrom: "#00f5ff",
  sparkTo: "#fff5ff", // el render original subía solo el rojo: el final no es blanco puro
  sparkGlow: 8,
  paddle: "#00f5ff",
  paddleFillAlpha: 0.25,
  paddleGlow: 14,
  paddleCore: "#ffffff",
  paddleCoreAlpha: 0.85,
  ball: "#f5ff00",
  ballGlow: 18,
  ballCore: "#ffffff",
  ballCoreAlpha: 1,
  blend: "lighter",
};

// Fósforo ámbar. 4 intensidades para que dos filas contiguas nunca compartan tono:
// A #ffd060 · B #ffb000 · C #d99600 · D #b37b00.
const retro: ArkanoidPalette = {
  background: "#0a0700",
  frame: "#996900",
  frameAlpha: 1,
  frameWidth: 2,
  frameGlow: 4,
  win: "#ffd060",
  winAlphaOff: 0.3,
  winWidth: 3,
  winGlowOn: 10,
  winGlowOff: 4,
  blocks: {
    red: "#d99600", // C
    hotpink: "#b37b00", // D
    magenta: "#d99600", // C
    yellow: "#ffd060", // A
    cyan: "#ffb000", // B
    green: "#ffb000", // B
    gray: "#b37b00", // D
  },
  blockFillAlpha: 0.3,
  blockStrokeWidth: 2,
  blockOutline: null,
  blockGlow: 4,
  sheen: "#ffe8a8",
  sheenAlpha: 0,
  flash: "#ffe8a8",
  flashAlpha: 0.5,
  explosionGlow: 8,
  sparkFrom: "#ffb000",
  sparkTo: "#ffe8a8",
  sparkGlow: 4,
  paddle: "#ffb000",
  paddleFillAlpha: 0.25,
  paddleGlow: 6,
  paddleCore: "#ffe8a8",
  paddleCoreAlpha: 0.7,
  ball: "#ffd060",
  ballGlow: 8,
  ballCore: "#ffe8a8",
  ballCoreAlpha: 1,
  blend: "lighter",
};

// Arkanoid (Taito, 1986): azul marino, paredes grises, ladrillos opacos, Vaus plateada. Sin glow.
const clasico: ArkanoidPalette = {
  background: "#0a1450",
  frame: "#a8a8a8",
  frameAlpha: 1,
  frameWidth: 3,
  frameGlow: 0,
  win: "#20e020",
  winAlphaOff: 0.3,
  winWidth: 3,
  winGlowOn: 0,
  winGlowOff: 0,
  blocks: {
    red: "#ff4030", // rojo
    hotpink: "#ff9000", // naranja
    magenta: "#ff40ff", // rosa
    yellow: "#ffe800", // amarillo
    cyan: "#00e8e8", // celeste
    green: "#20e020", // verde
    gray: "#bcbcbc", // plateado
  },
  blockFillAlpha: 1,
  blockStrokeWidth: 2,
  blockOutline: "#000000",
  blockGlow: 0,
  sheen: "#ffffff",
  sheenAlpha: 0,
  flash: "#ffffff",
  flashAlpha: 0.7,
  explosionGlow: 0,
  sparkFrom: "#d0d0d0",
  sparkTo: "#ffffff",
  sparkGlow: 0,
  paddle: "#d0d0d0",
  paddleFillAlpha: 1,
  paddleGlow: 0,
  paddleCore: "#ff4030",
  paddleCoreAlpha: 1,
  ball: "#ffffff",
  ballGlow: 0,
  ballCore: "#ffffff",
  ballCoreAlpha: 0,
  blend: "source-over",
};

export const SKINS = { neon, retro, clasico } satisfies Record<
  SkinId,
  ArkanoidPalette
>;

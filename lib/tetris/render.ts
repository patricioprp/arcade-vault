// Render de CAÍDA: bloques como tubos de neón (relleno translúcido + borde con glow)
// en un pozo con el halo de .cover-tetro. Sin HUD ni "GAME OVER": eso es del reproductor.

import type { TetrisGame } from "./engine";
import { WORLD_H, WORLD_W } from "./engine";
import { COLS, ROWS, type Cell, type Shape } from "./pieces";

const CELL = 28;
const BOARD_X = 260;
const BOARD_Y = 20;
const BOARD_W = COLS * CELL;
const BOARD_H = ROWS * CELL;

const NEXT_CELL = 22;
const PANEL_X = BOARD_X + BOARD_W + 24;
const PANEL_Y = BOARD_Y;
const PANEL_W = 4 * NEXT_CELL + 40;
const PANEL_H = 4 * NEXT_CELL + 58;

// RGB por pieza (índice = PieceType). Los 4 tokens de la plataforma + naranja y violeta
// de .cover-tetro + un azul eléctrico para J.
const PIECE_RGB: [number, number, number][] = [
  [0, 0, 0],
  [0, 245, 255], // I — --cyan
  [245, 255, 0], // O — --yellow
  [170, 0, 255], // T — violeta de .cover-tetro
  [0, 255, 136], // S — --green
  [255, 0, 110], // Z — --magenta
  [61, 123, 255], // J — azul eléctrico
  [255, 119, 0], // L — naranja de .cover-tetro
];
const DEAD_RGB: [number, number, number] = [74, 79, 112]; // --ink-faint

const COLORS = {
  frame: "#00f5ff", // --cyan
  well: "#2a004a", // halo de .cover-tetro
  dot: "rgba(230, 233, 255, 0.10)",
  label: "#8a8fb5", // --ink-dim
} as const;

export function drawTetris(
  ctx: CanvasRenderingContext2D,
  game: TetrisGame,
  labelFont: string,
): void {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);

  drawWell(ctx);

  // Tablero fijado, con las filas apagadas de abajo hacia arriba según fade.
  for (let r = 0; r < ROWS; r++) {
    const dead = rowDeadness(r, game.fade);
    for (let c = 0; c < COLS; c++) {
      const v = game.board[r][c];
      if (v)
        drawBlock(
          ctx,
          BOARD_X + c * CELL,
          BOARD_Y + r * CELL,
          CELL,
          v,
          1,
          dead,
        );
    }
  }

  if (game.status === "playing") {
    const { shape, x, y } = game.current;
    drawShape(
      ctx,
      shape,
      BOARD_X + x * CELL,
      BOARD_Y + game.ghostY() * CELL,
      CELL,
      0.2,
    );
    drawShape(ctx, shape, BOARD_X + x * CELL, BOARD_Y + y * CELL, CELL, 1);
  }

  drawNextPanel(ctx, game.next.shape, labelFont);
}

// 0 = encendida, 1 = apagada. La fila de abajo se apaga primero.
function rowDeadness(row: number, fade: number) {
  const fromBottom = ROWS - 1 - row;
  return Math.min(1, Math.max(0, fade * ROWS - fromBottom));
}

function drawWell(ctx: CanvasRenderingContext2D) {
  const halo = ctx.createRadialGradient(
    BOARD_X + BOARD_W / 2,
    BOARD_Y + BOARD_H,
    0,
    BOARD_X + BOARD_W / 2,
    BOARD_Y + BOARD_H,
    BOARD_H * 0.9,
  );
  halo.addColorStop(0, COLORS.well);
  halo.addColorStop(1, "rgba(10, 10, 24, 0.6)");
  ctx.fillStyle = halo;
  ctx.fillRect(BOARD_X, BOARD_Y, BOARD_W, BOARD_H);

  // Puntos en las intersecciones: marcan la cuadrícula sin rayar el pozo.
  ctx.fillStyle = COLORS.dot;
  for (let r = 1; r < ROWS; r++)
    for (let c = 1; c < COLS; c++)
      ctx.fillRect(BOARD_X + c * CELL - 1, BOARD_Y + r * CELL - 1, 2, 2);

  drawFrame(ctx, BOARD_X, BOARD_Y, BOARD_W, BOARD_H);
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  ctx.save();
  ctx.shadowColor = COLORS.frame;
  ctx.shadowBlur = 12;
  ctx.strokeStyle = COLORS.frame;
  ctx.globalAlpha = 0.7;
  ctx.lineWidth = 2;
  ctx.strokeRect(x - 3, y - 3, w + 6, h + 6);
  ctx.restore();
}

function drawShape(
  ctx: CanvasRenderingContext2D,
  shape: Shape,
  px: number,
  py: number,
  size: number,
  alpha: number,
) {
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++) {
      const v = shape[r][c];
      if (v) drawBlock(ctx, px + c * size, py + r * size, size, v, alpha, 0);
    }
}

// Tubo de neón: relleno translúcido, borde con glow y un brillo pixel arriba a la izquierda.
// `dead` (0 → 1) mezcla el color hacia gris y apaga el glow.
function drawBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  type: Cell,
  alpha: number,
  dead: number,
) {
  const [r, g, b] = mix(PIECE_RGB[type], DEAD_RGB, dead);
  const rgb = `${r}, ${g}, ${b}`;
  const inset = 2;
  const s = size - inset * 2;

  ctx.save();
  ctx.globalAlpha = alpha;

  ctx.fillStyle = `rgba(${rgb}, ${0.22 + dead * 0.18})`;
  ctx.fillRect(x + inset, y + inset, s, s);

  ctx.shadowColor = `rgb(${rgb})`;
  ctx.shadowBlur = 10 * (1 - dead);
  ctx.strokeStyle = `rgb(${rgb})`;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + inset + 1, y + inset + 1, s - 2, s - 2);

  ctx.shadowBlur = 0;
  ctx.fillStyle = `rgba(255, 255, 255, ${0.6 * (1 - dead)})`;
  const sheen = Math.round(size / 7);
  ctx.fillRect(x + inset + 3, y + inset + 3, sheen, sheen);

  ctx.restore();
}

function drawNextPanel(
  ctx: CanvasRenderingContext2D,
  shape: Shape,
  labelFont: string,
) {
  ctx.fillStyle = "rgba(10, 10, 24, 0.8)";
  ctx.fillRect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H);
  drawFrame(ctx, PANEL_X, PANEL_Y, PANEL_W, PANEL_H);

  ctx.fillStyle = COLORS.label;
  ctx.font = `10px ${labelFont}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("SIGUIENTE", PANEL_X + PANEL_W / 2, PANEL_Y + 14);

  // Centra la caja ocupada por la pieza, no su matriz (la I tiene filas vacías).
  let minR = Infinity,
    maxR = -1,
    minC = Infinity,
    maxC = -1;
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++)
      if (shape[r][c]) {
        minR = Math.min(minR, r);
        maxR = Math.max(maxR, r);
        minC = Math.min(minC, c);
        maxC = Math.max(maxC, c);
      }
  const w = (maxC - minC + 1) * NEXT_CELL;
  const h = (maxR - minR + 1) * NEXT_CELL;
  const areaY = PANEL_Y + 36;
  const areaH = PANEL_H - 36 - 10;
  const px = PANEL_X + (PANEL_W - w) / 2 - minC * NEXT_CELL;
  const py = areaY + (areaH - h) / 2 - minR * NEXT_CELL;
  drawShape(ctx, shape, px, py, NEXT_CELL, 1);
}

function mix(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

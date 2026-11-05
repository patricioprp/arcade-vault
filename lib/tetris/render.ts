// Render de CAÍDA: bloques como tubos de neón (relleno translúcido + borde con glow)
// en un pozo con el halo de .cover-tetro. Sin HUD ni "GAME OVER": eso es del reproductor.
// Todos los colores salen de la paleta de la skin (skins.ts); transparencias con globalAlpha.

import type { TetrisGame } from "./engine";
import { WORLD_H, WORLD_W } from "./engine";
import { COLS, ROWS, type PieceType, type Shape } from "./pieces";
import { mixHex, type TetrisPalette } from "./skins";

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

export function drawTetris(
  ctx: CanvasRenderingContext2D,
  game: TetrisGame,
  palette: TetrisPalette,
  labelFont: string,
): void {
  ctx.fillStyle = palette.background;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);

  drawWell(ctx, palette);

  // Tablero fijado, con las filas apagadas de abajo hacia arriba según fade.
  for (let r = 0; r < ROWS; r++) {
    const dead = rowDeadness(r, game.fade);
    for (let c = 0; c < COLS; c++) {
      const v = game.board[r][c];
      if (v)
        drawBlock(
          ctx,
          palette,
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
      palette,
      shape,
      BOARD_X + x * CELL,
      BOARD_Y + game.ghostY() * CELL,
      CELL,
      palette.ghostAlpha,
    );
    drawShape(
      ctx,
      palette,
      shape,
      BOARD_X + x * CELL,
      BOARD_Y + y * CELL,
      CELL,
      1,
    );
  }

  drawNextPanel(ctx, palette, game.next.shape, labelFont);
}

// 0 = encendida, 1 = apagada. La fila de abajo se apaga primero.
function rowDeadness(row: number, fade: number) {
  const fromBottom = ROWS - 1 - row;
  return Math.min(1, Math.max(0, fade * ROWS - fromBottom));
}

function drawWell(ctx: CanvasRenderingContext2D, palette: TetrisPalette) {
  const halo = ctx.createRadialGradient(
    BOARD_X + BOARD_W / 2,
    BOARD_Y + BOARD_H,
    0,
    BOARD_X + BOARD_W / 2,
    BOARD_Y + BOARD_H,
    BOARD_H * 0.9,
  );
  halo.addColorStop(0, palette.wellInner);
  halo.addColorStop(1, palette.wellOuter);
  ctx.fillStyle = halo;
  ctx.fillRect(BOARD_X, BOARD_Y, BOARD_W, BOARD_H);

  // Puntos en las intersecciones: marcan la cuadrícula sin rayar el pozo.
  ctx.save();
  ctx.globalAlpha = palette.gridDotAlpha;
  ctx.fillStyle = palette.gridDot;
  for (let r = 1; r < ROWS; r++)
    for (let c = 1; c < COLS; c++)
      ctx.fillRect(BOARD_X + c * CELL - 1, BOARD_Y + r * CELL - 1, 2, 2);
  ctx.restore();

  drawFrame(ctx, palette, BOARD_X, BOARD_Y, BOARD_W, BOARD_H);
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  palette: TetrisPalette,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  ctx.save();
  if (palette.frameGlow > 0) {
    ctx.shadowColor = palette.frame;
    ctx.shadowBlur = palette.frameGlow;
  }
  ctx.strokeStyle = palette.frame;
  ctx.globalAlpha = palette.frameAlpha;
  ctx.lineWidth = palette.frameWidth;
  ctx.strokeRect(x - 3, y - 3, w + 6, h + 6);
  ctx.restore();
}

function drawShape(
  ctx: CanvasRenderingContext2D,
  palette: TetrisPalette,
  shape: Shape,
  px: number,
  py: number,
  size: number,
  alpha: number,
) {
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++) {
      const v = shape[r][c];
      if (v)
        drawBlock(
          ctx,
          palette,
          px + c * size,
          py + r * size,
          size,
          v,
          alpha,
          0,
        );
    }
}

// Bloque: relleno, borde (con glow según la skin), patrón opcional y brillo pixel arriba a la izquierda.
// `dead` (0 → 1) mezcla el color hacia `palette.dead` y apaga el glow y el brillo.
function drawBlock(
  ctx: CanvasRenderingContext2D,
  palette: TetrisPalette,
  x: number,
  y: number,
  size: number,
  type: PieceType,
  alpha: number,
  dead: number,
) {
  const color = mixHex(palette.pieces[type], palette.dead, dead);
  const inset = 2;
  const s = size - inset * 2;

  ctx.save();

  ctx.globalAlpha = alpha * (palette.fillAlpha + dead * palette.deadFillBoost);
  ctx.fillStyle = color;
  ctx.fillRect(x + inset, y + inset, s, s);

  ctx.globalAlpha = alpha;
  const glow = palette.blockGlow * (1 - dead);
  if (glow > 0) {
    ctx.shadowColor = color;
    ctx.shadowBlur = glow;
  }
  ctx.strokeStyle = palette.blockOutline ?? color;
  ctx.lineWidth = palette.blockStrokeWidth;
  ctx.strokeRect(x + inset + 1, y + inset + 1, s - 2, s - 2);
  ctx.shadowBlur = 0;

  const mark = palette.marks[type];
  if (mark === "dot") {
    const d = Math.round(size / 4);
    const o = Math.floor((size - d) / 2);
    ctx.fillStyle = color;
    ctx.fillRect(x + o, y + o, d, d);
  } else if (mark === "cross") {
    const a = inset + 6;
    const b = size - a;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + a, y + a);
    ctx.lineTo(x + b, y + b);
    ctx.moveTo(x + b, y + a);
    ctx.lineTo(x + a, y + b);
    ctx.stroke();
  }

  if (palette.sheenAlpha > 0) {
    ctx.globalAlpha = alpha * palette.sheenAlpha * (1 - dead);
    ctx.fillStyle = palette.sheen;
    const sheen = Math.round(size / 7);
    ctx.fillRect(x + inset + 3, y + inset + 3, sheen, sheen);
  }

  ctx.restore();
}

function drawNextPanel(
  ctx: CanvasRenderingContext2D,
  palette: TetrisPalette,
  shape: Shape,
  labelFont: string,
) {
  ctx.save();
  ctx.globalAlpha = palette.panelBgAlpha;
  ctx.fillStyle = palette.panelBg;
  ctx.fillRect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H);
  ctx.restore();
  drawFrame(ctx, palette, PANEL_X, PANEL_Y, PANEL_W, PANEL_H);

  ctx.fillStyle = palette.label;
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
  drawShape(ctx, palette, shape, px, py, NEXT_CELL, 1);
}

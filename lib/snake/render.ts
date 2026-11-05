// Render de SERPENTINA: la serpiente es un tubo que va de la cabeza a la cola en degradé, sobre
// una grilla de puntos tenue, con pared y frutas pixel art. Los colores salen de la skin
// (lib/snake/skins.ts). Sin HUD ni textos: eso es del reproductor.

import type { Cell, Direction, SnakeGame } from "./engine";
import { CELL, WORLD_H, WORLD_W } from "./engine";
import { FRUIT_SPRITES } from "./fruits";
import { mixHex, withAlpha, type SnakePalette } from "./skins";

const WALL_INSET = 1.5;
const BODY_W = 17; // grosor del tubo dentro de la celda de 25
const HEAD_SIZE = 21;

export function drawSnake(
  ctx: CanvasRenderingContext2D,
  game: SnakeGame,
  palette: SnakePalette,
  fruitsImg: HTMLImageElement | null,
  now: number,
): void {
  ctx.fillStyle = palette.background;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);

  const { status, won } = game.getStats();
  const over = status === "gameover";

  drawDots(ctx, palette);
  drawWall(ctx, palette, over && won, now);
  if (game.fruit) drawFruit(ctx, palette, game.fruit, fruitsImg, now);

  if (over && !won) {
    // Derrota: se apaga segmento por segmento desde la cola, en el color de choque.
    const visible = Math.ceil(game.body.length * (1 - game.endT));
    drawBody(
      ctx,
      palette,
      game.body.slice(0, visible),
      "crash",
      1 - game.endT * 0.6,
    );
    return;
  }

  if (status === "crash") {
    const on = Math.sin(now / 60) > 0;
    drawBody(ctx, palette, game.body, on ? "crash" : "phosphor", on ? 1 : 0.45);
    drawCrashRing(ctx, palette, game.body[0], game.crashT);
    return;
  }

  drawBody(ctx, palette, game.body, "phosphor", 1);
  drawHead(
    ctx,
    palette,
    game.body[0],
    game.dir,
    status === "ready" ? now : null,
  );
}

const center = (c: Cell) => ({
  x: c.x * CELL + CELL / 2,
  y: c.y * CELL + CELL / 2,
});

// Matriz de puntos en las intersecciones de la grilla.
function drawDots(ctx: CanvasRenderingContext2D, palette: SnakePalette) {
  ctx.save();
  ctx.globalAlpha = palette.gridDotAlpha;
  ctx.fillStyle = palette.gridDot;
  for (let y = CELL; y < WORLD_H; y += CELL)
    for (let x = CELL; x < WORLD_W; x += CELL) ctx.fillRect(x - 1, y - 1, 2, 2);
  ctx.restore();
}

// Los cuatro bordes son pared. Con victoria parpadean en el color "win".
function drawWall(
  ctx: CanvasRenderingContext2D,
  palette: SnakePalette,
  won: boolean,
  now: number,
) {
  const on = won && Math.sin(now / 55) > 0;
  const color = won ? palette.win : palette.wall;
  const glow = won
    ? on
      ? palette.winGlowOn
      : palette.winGlowOff
    : palette.wallGlow;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = won ? (on ? 1 : palette.winAlphaOff) : palette.wallAlpha;
  if (glow > 0) {
    ctx.shadowColor = color;
    ctx.shadowBlur = glow;
  }
  ctx.lineWidth = won ? palette.winWidth : palette.wallWidth;
  ctx.strokeRect(
    WALL_INSET,
    WALL_INSET,
    WORLD_W - WALL_INSET * 2,
    WORLD_H - WALL_INSET * 2,
  );
  ctx.restore();
}

// Silueta del atlas de frutas en un solo color, cacheada por imagen y color.
const tintCache = new WeakMap<
  HTMLImageElement,
  Map<string, HTMLCanvasElement>
>();

function tintedFruits(img: HTMLImageElement, color: string): HTMLCanvasElement {
  let byColor = tintCache.get(img);
  if (!byColor) {
    byColor = new Map();
    tintCache.set(img, byColor);
  }
  let tinted = byColor.get(color);
  if (!tinted) {
    tinted = document.createElement("canvas");
    tinted.width = img.naturalWidth;
    tinted.height = img.naturalHeight;
    const tctx = tinted.getContext("2d");
    if (tctx) {
      tctx.drawImage(img, 0, 0);
      tctx.globalCompositeOperation = "source-in";
      tctx.fillStyle = color;
      tctx.fillRect(0, 0, tinted.width, tinted.height);
    }
    byColor.set(color, tinted);
  }
  return tinted;
}

function drawFruit(
  ctx: CanvasRenderingContext2D,
  palette: SnakePalette,
  fruit: NonNullable<SnakeGame["fruit"]>,
  img: HTMLImageElement | null,
  now: number,
) {
  const { x, y } = center(fruit.cell);
  const breath = 0.5 + 0.5 * Math.sin(now / 260);

  // Halo que respira bajo la fruta.
  if (palette.haloAlpha > 0) {
    const r = CELL * (0.75 + breath * 0.15);
    const halo = ctx.createRadialGradient(x, y, 0, x, y, r);
    halo.addColorStop(0, palette.halo);
    halo.addColorStop(1, withAlpha(palette.halo, 0));
    ctx.save();
    ctx.globalAlpha = palette.haloAlpha + breath * palette.haloBreathAlpha;
    ctx.fillStyle = halo;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.restore();
  }

  ctx.save();
  if (img) {
    // Alto de una celda y ancho proporcional, sin suavizado para conservar el pixel art.
    const s = FRUIT_SPRITES[fruit.kind];
    const h = CELL;
    const w = (s.w / s.h) * h;
    const source =
      palette.fruitTint === null ? img : tintedFruits(img, palette.fruitTint);
    ctx.imageSmoothingEnabled = false;
    if (palette.fruitGlow > 0) {
      ctx.shadowColor = withAlpha(palette.halo, palette.fruitGlowAlpha);
      ctx.shadowBlur = palette.fruitGlow;
    }
    ctx.drawImage(source, s.x, s.y, s.w, s.h, x - w / 2, y - h / 2, w, h);
  } else {
    // Mientras carga la imagen: núcleo de color.
    ctx.fillStyle = palette.fruitCore;
    if (palette.fruitCoreGlow > 0) {
      ctx.shadowColor = palette.fruitCore;
      ctx.shadowBlur = palette.fruitCoreGlow;
    }
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// Color del segmento i: del cuello a la cola, o el color de choque.
function segmentColor(
  palette: SnakePalette,
  i: number,
  n: number,
  mode: "phosphor" | "crash",
) {
  if (mode === "crash") return palette.crash;
  return mixHex(palette.neck, palette.tail, n <= 1 ? 0 : i / (n - 1));
}

// Tubo continuo: un trazo con glow para todo el cuerpo y encima cada tramo con su color opaco.
function drawBody(
  ctx: CanvasRenderingContext2D,
  palette: SnakePalette,
  body: Cell[],
  mode: "phosphor" | "crash",
  alpha: number,
) {
  if (body.length === 0) return;
  const pts = body.map(center);
  const base = mode === "crash" ? palette.crash : palette.glow;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = BODY_W;

  ctx.strokeStyle = base;
  if (palette.bodyGlow > 0) {
    ctx.shadowColor = base;
    ctx.shadowBlur = palette.bodyGlow;
  }
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (const p of pts) ctx.lineTo(p.x, p.y);
  if (pts.length === 1) ctx.lineTo(pts[0].x + 0.01, pts[0].y);
  ctx.stroke();

  ctx.shadowBlur = 0;
  // De la cola a la cabeza, para que el tramo más brillante quede arriba en cada unión.
  for (let i = pts.length - 1; i > 0; i--) {
    ctx.strokeStyle = segmentColor(palette, i, pts.length, mode);
    ctx.beginPath();
    ctx.moveTo(pts[i].x, pts[i].y);
    ctx.lineTo(pts[i - 1].x, pts[i - 1].y);
    ctx.stroke();
  }
  ctx.restore();
}

// Cabeza: cuadrado redondeado con dos ojos mirando hacia donde avanza.
// En "ready" late para indicar que espera una dirección.
function drawHead(
  ctx: CanvasRenderingContext2D,
  palette: SnakePalette,
  head: Cell,
  dir: Direction,
  readyNow: number | null,
) {
  const { x, y } = center(head);
  const pulse =
    readyNow === null ? 1 : 0.55 + 0.45 * Math.abs(Math.sin(readyNow / 220));
  const half = HEAD_SIZE / 2;
  const glow = palette.headGlow + palette.headGlowPulse * pulse;

  ctx.save();
  ctx.fillStyle = palette.head;
  if (glow > 0) {
    ctx.shadowColor = palette.glow;
    ctx.shadowBlur = glow;
  }
  ctx.globalAlpha = readyNow === null ? 1 : 0.6 + 0.4 * pulse;
  ctx.beginPath();
  ctx.roundRect(x - half, y - half, HEAD_SIZE, HEAD_SIZE, 6);
  ctx.fill();

  // Ojos: dos píxeles en el lado que mira hacia adelante.
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
  ctx.fillStyle = palette.eye;
  const f = 5; // distancia del centro hacia adelante
  const s = 4.5; // separación lateral
  const e = 3.5; // tamaño del ojo
  const eyes =
    dir === "right" || dir === "left"
      ? [
          { ex: x + (dir === "right" ? f : -f), ey: y - s },
          { ex: x + (dir === "right" ? f : -f), ey: y + s },
        ]
      : [
          { ex: x - s, ey: y + (dir === "down" ? f : -f) },
          { ex: x + s, ey: y + (dir === "down" ? f : -f) },
        ];
  for (const { ex, ey } of eyes) ctx.fillRect(ex - e / 2, ey - e / 2, e, e);
  ctx.restore();
}

// Anillo que se expande desde la cabeza durante el choque.
function drawCrashRing(
  ctx: CanvasRenderingContext2D,
  palette: SnakePalette,
  head: Cell,
  t: number,
) {
  const { x, y } = center(head);
  ctx.save();
  ctx.strokeStyle = palette.crash;
  ctx.globalAlpha = 1 - t;
  if (palette.crashRingGlow > 0) {
    ctx.shadowColor = palette.crash;
    ctx.shadowBlur = palette.crashRingGlow;
  }
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, CELL * 0.6 + t * CELL * 2.4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

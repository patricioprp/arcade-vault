// Render de SERPENTINA: la serpiente es un rastro de fósforo de CRT, un tubo de neón que brilla
// casi blanco en la cabeza y se enfría hacia la cola. Grilla de puntos tenue, pared cian y
// frutas pixel art con un halo amarillo. Sin HUD ni textos: eso es del reproductor.

import type { Cell, Direction, SnakeGame } from "./engine";
import { CELL, WORLD_H, WORLD_W } from "./engine";
import { FRUIT_SPRITES } from "./fruits";

const COLORS = {
  wall: "0, 245, 255", // --cyan
  win: "0, 255, 136", // --green
  crash: "255, 0, 110", // --magenta
  halo: "245, 255, 0", // --yellow
  glow: "#00ff88", // --green
  head: [200, 255, 230], // fósforo recién encendido
  neck: [0, 255, 136], // --green
  tail: [11, 90, 58], // fósforo frío
  dots: "rgba(0, 245, 255, 0.09)",
} as const;

const WALL_INSET = 1.5;
const BODY_W = 17; // grosor del tubo dentro de la celda de 25
const HEAD_SIZE = 21;

export function drawSnake(
  ctx: CanvasRenderingContext2D,
  game: SnakeGame,
  fruitsImg: HTMLImageElement | null,
  now: number,
): void {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);

  const { status, won } = game.getStats();
  const over = status === "gameover";

  drawDots(ctx);
  drawWall(ctx, over && won, now);
  if (game.fruit) drawFruit(ctx, game.fruit, fruitsImg, now);

  if (over && !won) {
    // Derrota: se apaga segmento por segmento desde la cola, en magenta.
    const visible = Math.ceil(game.body.length * (1 - game.endT));
    drawBody(ctx, game.body.slice(0, visible), "crash", 1 - game.endT * 0.6);
    return;
  }

  if (status === "crash") {
    const on = Math.sin(now / 60) > 0;
    drawBody(ctx, game.body, on ? "crash" : "phosphor", on ? 1 : 0.45);
    drawCrashRing(ctx, game.body[0], game.crashT);
    return;
  }

  drawBody(ctx, game.body, "phosphor", 1);
  drawHead(ctx, game.body[0], game.dir, status === "ready" ? now : null);
}

const center = (c: Cell) => ({
  x: c.x * CELL + CELL / 2,
  y: c.y * CELL + CELL / 2,
});

// Matriz de puntos en las intersecciones de la grilla.
function drawDots(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = COLORS.dots;
  for (let y = CELL; y < WORLD_H; y += CELL)
    for (let x = CELL; x < WORLD_W; x += CELL) ctx.fillRect(x - 1, y - 1, 2, 2);
}

// Los cuatro bordes son pared. Con victoria parpadean en verde.
function drawWall(ctx: CanvasRenderingContext2D, won: boolean, now: number) {
  const on = won && Math.sin(now / 55) > 0;
  const rgb = won ? COLORS.win : COLORS.wall;

  ctx.save();
  ctx.strokeStyle = `rgba(${rgb}, ${won ? (on ? 1 : 0.3) : 0.35})`;
  ctx.shadowColor = `rgb(${rgb})`;
  ctx.shadowBlur = won ? (on ? 22 : 6) : 8;
  ctx.lineWidth = won ? 3 : 2;
  ctx.strokeRect(
    WALL_INSET,
    WALL_INSET,
    WORLD_W - WALL_INSET * 2,
    WORLD_H - WALL_INSET * 2,
  );
  ctx.restore();
}

function drawFruit(
  ctx: CanvasRenderingContext2D,
  fruit: NonNullable<SnakeGame["fruit"]>,
  img: HTMLImageElement | null,
  now: number,
) {
  const { x, y } = center(fruit.cell);
  const breath = 0.5 + 0.5 * Math.sin(now / 260);

  // Halo amarillo que respira bajo la fruta.
  const r = CELL * (0.75 + breath * 0.15);
  const halo = ctx.createRadialGradient(x, y, 0, x, y, r);
  halo.addColorStop(0, `rgba(${COLORS.halo}, ${0.22 + breath * 0.12})`);
  halo.addColorStop(1, `rgba(${COLORS.halo}, 0)`);
  ctx.fillStyle = halo;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);

  ctx.save();
  if (img) {
    // Alto de una celda y ancho proporcional, sin suavizado para conservar el pixel art.
    const s = FRUIT_SPRITES[fruit.kind];
    const h = CELL;
    const w = (s.w / s.h) * h;
    ctx.imageSmoothingEnabled = false;
    ctx.shadowColor = `rgba(${COLORS.halo}, 0.6)`;
    ctx.shadowBlur = 8;
    ctx.drawImage(img, s.x, s.y, s.w, s.h, x - w / 2, y - h / 2, w, h);
  } else {
    // Mientras carga la imagen: núcleo neón magenta.
    ctx.fillStyle = `rgb(${COLORS.crash})`;
    ctx.shadowColor = `rgb(${COLORS.crash})`;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

const mix = (a: readonly number[], b: readonly number[], t: number) =>
  `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(", ")})`;

// Color del segmento i: del verde vivo del cuello al verde frío de la cola.
function segmentColor(i: number, n: number, mode: "phosphor" | "crash") {
  if (mode === "crash") return `rgb(${COLORS.crash})`;
  return mix(COLORS.neck, COLORS.tail, n <= 1 ? 0 : i / (n - 1));
}

// Tubo continuo: un trazo con glow para todo el cuerpo y encima cada tramo con su color opaco.
function drawBody(
  ctx: CanvasRenderingContext2D,
  body: Cell[],
  mode: "phosphor" | "crash",
  alpha: number,
) {
  if (body.length === 0) return;
  const pts = body.map(center);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = BODY_W;

  ctx.strokeStyle = mode === "crash" ? `rgb(${COLORS.crash})` : COLORS.glow;
  ctx.shadowColor = ctx.strokeStyle;
  ctx.shadowBlur = 16;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (const p of pts) ctx.lineTo(p.x, p.y);
  if (pts.length === 1) ctx.lineTo(pts[0].x + 0.01, pts[0].y);
  ctx.stroke();

  ctx.shadowBlur = 0;
  // De la cola a la cabeza, para que el tramo más brillante quede arriba en cada unión.
  for (let i = pts.length - 1; i > 0; i--) {
    ctx.strokeStyle = segmentColor(i, pts.length, mode);
    ctx.beginPath();
    ctx.moveTo(pts[i].x, pts[i].y);
    ctx.lineTo(pts[i - 1].x, pts[i - 1].y);
    ctx.stroke();
  }
  ctx.restore();
}

// Cabeza: cuadrado redondeado de fósforo blanco con dos ojos mirando hacia donde avanza.
// En "ready" late para indicar que espera una dirección.
function drawHead(
  ctx: CanvasRenderingContext2D,
  head: Cell,
  dir: Direction,
  readyNow: number | null,
) {
  const { x, y } = center(head);
  const pulse =
    readyNow === null ? 1 : 0.55 + 0.45 * Math.abs(Math.sin(readyNow / 220));
  const half = HEAD_SIZE / 2;

  ctx.save();
  ctx.fillStyle = `rgb(${COLORS.head.join(", ")})`;
  ctx.shadowColor = COLORS.glow;
  ctx.shadowBlur = 10 + 14 * pulse;
  ctx.globalAlpha = readyNow === null ? 1 : 0.6 + 0.4 * pulse;
  ctx.beginPath();
  ctx.roundRect(x - half, y - half, HEAD_SIZE, HEAD_SIZE, 6);
  ctx.fill();

  // Ojos: dos píxeles oscuros en el lado que mira hacia adelante.
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#03140d";
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

// Anillo magenta que se expande desde la cabeza durante el choque.
function drawCrashRing(ctx: CanvasRenderingContext2D, head: Cell, t: number) {
  const { x, y } = center(head);
  ctx.save();
  ctx.strokeStyle = `rgba(${COLORS.crash}, ${1 - t})`;
  ctx.shadowColor = `rgb(${COLORS.crash})`;
  ctx.shadowBlur = 18;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, CELL * 0.6 + t * CELL * 2.4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// Render de BLOQUE BUSTER: muro de tubos de neón en una arena con marco tenue.
// La paleta es una cápsula cian y la pelota un núcleo de plasma blanco con halo amarillo.
// Sin HUD ni textos: eso es del reproductor.

import type { ArkanoidGame, Block, Explosion, Spark } from "./engine";
import { EXPLOSION_DURATION, WORLD_H, WORLD_W } from "./engine";
import type { BlockColor } from "./levels";

// RGB por color de bloque. Los 4 tokens de la plataforma + rojo puro, violeta para "magenta"
// (el magenta de la plataforma queda para "hotpink", así el nivel 1 no tiene dos filas iguales)
// y --ink-dim para el gris.
const BLOCK_RGB: Record<BlockColor, string> = {
  red: "255, 45, 45",
  hotpink: "255, 0, 110", // --magenta
  magenta: "195, 75, 255",
  yellow: "245, 255, 0", // --yellow
  cyan: "0, 245, 255", // --cyan
  green: "0, 255, 136", // --green
  gray: "138, 143, 181", // --ink-dim
};

const COLORS = {
  frame: "0, 245, 255", // --cyan
  win: "0, 255, 136", // --green
  paddle: "#00f5ff", // --cyan
  ballGlow: "#f5ff00", // --yellow
} as const;

const FRAME_INSET = 1.5;
const BLOCK_GAP = 3;

export function drawArkanoid(
  ctx: CanvasRenderingContext2D,
  game: ArkanoidGame,
  now: number,
): void {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);

  const over = game.getStats().status === "gameover";
  const won = over && game.won;

  drawFrame(ctx, won, now);

  for (const b of game.blocks) if (b.alive) drawBlock(ctx, b);

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const e of game.explosions) drawExplosion(ctx, e);
  if (over && !won) for (const s of game.sparks) drawSpark(ctx, s, game.endT);
  ctx.restore();

  if (!over || won) drawPaddle(ctx, game.paddle);
  if (!over) drawBall(ctx, game.ball);
}

// Paredes izquierda, techo y derecha. Con victoria parpadean en verde.
function drawFrame(ctx: CanvasRenderingContext2D, won: boolean, now: number) {
  const on = won && Math.sin(now / 55) > 0;
  const rgb = won ? COLORS.win : COLORS.frame;

  ctx.save();
  ctx.strokeStyle = `rgba(${rgb}, ${won ? (on ? 1 : 0.3) : 0.25})`;
  ctx.shadowColor = `rgb(${rgb})`;
  ctx.shadowBlur = won ? (on ? 22 : 6) : 6;
  ctx.lineWidth = won ? 3 : 2;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(FRAME_INSET, WORLD_H);
  ctx.lineTo(FRAME_INSET, FRAME_INSET);
  ctx.lineTo(WORLD_W - FRAME_INSET, FRAME_INSET);
  ctx.lineTo(WORLD_W - FRAME_INSET, WORLD_H);
  ctx.stroke();
  ctx.restore();
}

// Tubo de neón: relleno translúcido, borde con glow y un brillo arriba.
function drawBlock(ctx: CanvasRenderingContext2D, b: Block) {
  const rgb = BLOCK_RGB[b.color];
  const x = b.x + BLOCK_GAP / 2;
  const y = b.y + BLOCK_GAP / 2;
  const w = b.w - BLOCK_GAP;
  const h = b.h - BLOCK_GAP;

  ctx.save();
  ctx.fillStyle = `rgba(${rgb}, 0.2)`;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 4);
  ctx.fill();

  ctx.shadowColor = `rgb(${rgb})`;
  ctx.shadowBlur = 8;
  ctx.strokeStyle = `rgb(${rgb})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x + 1, y + 1, w - 2, h - 2, 3);
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
  ctx.fillRect(x + 5, y + 4, w * 0.35, 2);
  ctx.restore();
}

// Estallido de 150 ms: el contorno se expande y se apaga, con un fogonazo blanco al principio.
function drawExplosion(ctx: CanvasRenderingContext2D, e: Explosion) {
  const t = Math.min(1, e.elapsed / EXPLOSION_DURATION);
  const rgb = BLOCK_RGB[e.color];
  const grow = 8 * t;

  if (t < 0.35) {
    ctx.fillStyle = `rgba(255, 255, 255, ${0.7 * (1 - t / 0.35)})`;
    ctx.fillRect(
      e.x + BLOCK_GAP / 2,
      e.y + BLOCK_GAP / 2,
      e.w - BLOCK_GAP,
      e.h - BLOCK_GAP,
    );
  }

  ctx.shadowColor = `rgb(${rgb})`;
  ctx.shadowBlur = 16;
  ctx.strokeStyle = `rgba(${rgb}, ${1 - t})`;
  ctx.lineWidth = 2 + 2 * (1 - t);
  ctx.beginPath();
  ctx.roundRect(
    e.x - grow,
    e.y - grow,
    e.w + grow * 2,
    e.h + grow * 2,
    4 + grow,
  );
  ctx.stroke();
  ctx.shadowBlur = 0;
}

// Chispas de la paleta desintegrada: de cian a blanco, apagándose con endT.
function drawSpark(ctx: CanvasRenderingContext2D, s: Spark, endT: number) {
  const a = 1 - endT;
  if (a <= 0) return;
  const white = Math.round(255 * endT);
  ctx.fillStyle = `rgba(${white}, 245, 255, ${a})`;
  ctx.shadowColor = COLORS.paddle;
  ctx.shadowBlur = 8;
  ctx.fillRect(s.x - 1.5, s.y - 1.5, 3, 3);
  ctx.shadowBlur = 0;
}

// Cápsula cian con núcleo blanco: la "nave-paleta".
function drawPaddle(
  ctx: CanvasRenderingContext2D,
  p: { x: number; y: number; w: number; h: number },
) {
  ctx.save();
  ctx.shadowColor = COLORS.paddle;
  ctx.shadowBlur = 14;
  ctx.fillStyle = "rgba(0, 245, 255, 0.25)";
  ctx.strokeStyle = COLORS.paddle;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(p.x + 1, p.y + 1, p.w - 2, p.h - 2, p.h / 2);
  ctx.fill();
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(p.x + p.h / 2 + 2, p.y + p.h / 2);
  ctx.lineTo(p.x + p.w - p.h / 2 - 2, p.y + p.h / 2);
  ctx.stroke();
  ctx.restore();
}

// Núcleo de plasma: centro blanco con halo amarillo.
function drawBall(
  ctx: CanvasRenderingContext2D,
  b: { x: number; y: number; w: number; h: number },
) {
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  const r = b.w / 2;

  ctx.save();
  ctx.shadowColor = COLORS.ballGlow;
  ctx.shadowBlur = 18;
  ctx.fillStyle = COLORS.ballGlow;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 1, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

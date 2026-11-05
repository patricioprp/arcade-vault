// Render de BLOQUE BUSTER: muro de bloques en una arena con marco, paleta en cápsula y pelota.
// Los colores salen de la skin (lib/arkanoid/skins.ts); transparencias con globalAlpha.
// Sin HUD ni textos: eso es del reproductor.

import type { ArkanoidGame, Block, Explosion, Spark } from "./engine";
import { EXPLOSION_DURATION, WORLD_H, WORLD_W } from "./engine";
import { mixHex, type ArkanoidPalette } from "./skins";

const FRAME_INSET = 1.5;
const BLOCK_GAP = 3;

export function drawArkanoid(
  ctx: CanvasRenderingContext2D,
  game: ArkanoidGame,
  palette: ArkanoidPalette,
  now: number,
): void {
  ctx.fillStyle = palette.background;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);

  const over = game.getStats().status === "gameover";
  const won = over && game.won;

  drawFrame(ctx, palette, won, now);

  for (const b of game.blocks) if (b.alive) drawBlock(ctx, palette, b);

  ctx.save();
  ctx.globalCompositeOperation = palette.blend;
  for (const e of game.explosions) drawExplosion(ctx, palette, e);
  if (over && !won)
    for (const s of game.sparks) drawSpark(ctx, palette, s, game.endT);
  ctx.restore();

  if (!over || won) drawPaddle(ctx, palette, game.paddle);
  if (!over) drawBall(ctx, palette, game.ball);
}

// Paredes izquierda, techo y derecha. Con victoria parpadean en el color "win".
function drawFrame(
  ctx: CanvasRenderingContext2D,
  palette: ArkanoidPalette,
  won: boolean,
  now: number,
) {
  const on = won && Math.sin(now / 55) > 0;
  const color = won ? palette.win : palette.frame;
  const glow = won
    ? on
      ? palette.winGlowOn
      : palette.winGlowOff
    : palette.frameGlow;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = won ? (on ? 1 : palette.winAlphaOff) : palette.frameAlpha;
  ctx.lineWidth = won ? palette.winWidth : palette.frameWidth;
  if (glow > 0) {
    ctx.shadowColor = color;
    ctx.shadowBlur = glow;
  }
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(FRAME_INSET, WORLD_H);
  ctx.lineTo(FRAME_INSET, FRAME_INSET);
  ctx.lineTo(WORLD_W - FRAME_INSET, FRAME_INSET);
  ctx.lineTo(WORLD_W - FRAME_INSET, WORLD_H);
  ctx.stroke();
  ctx.restore();
}

// Relleno, borde (con glow según la skin) y un brillo opcional arriba.
function drawBlock(
  ctx: CanvasRenderingContext2D,
  palette: ArkanoidPalette,
  b: Block,
) {
  const c = palette.blocks[b.color];
  const x = b.x + BLOCK_GAP / 2;
  const y = b.y + BLOCK_GAP / 2;
  const w = b.w - BLOCK_GAP;
  const h = b.h - BLOCK_GAP;

  ctx.save();
  ctx.globalAlpha = palette.blockFillAlpha;
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 4);
  ctx.fill();

  ctx.globalAlpha = 1;
  if (palette.blockGlow > 0) {
    ctx.shadowColor = c;
    ctx.shadowBlur = palette.blockGlow;
  }
  ctx.strokeStyle = palette.blockOutline ?? c;
  ctx.lineWidth = palette.blockStrokeWidth;
  ctx.beginPath();
  ctx.roundRect(x + 1, y + 1, w - 2, h - 2, 3);
  ctx.stroke();

  if (palette.sheenAlpha > 0) {
    ctx.shadowBlur = 0;
    ctx.globalAlpha = palette.sheenAlpha;
    ctx.fillStyle = palette.sheen;
    ctx.fillRect(x + 5, y + 4, w * 0.35, 2);
  }
  ctx.restore();
}

// Estallido de 150 ms: el contorno se expande y se apaga, con un fogonazo al principio.
function drawExplosion(
  ctx: CanvasRenderingContext2D,
  palette: ArkanoidPalette,
  e: Explosion,
) {
  const t = Math.min(1, e.elapsed / EXPLOSION_DURATION);
  const c = palette.blocks[e.color];
  const grow = 8 * t;

  ctx.save();
  if (t < 0.35) {
    ctx.globalAlpha = palette.flashAlpha * (1 - t / 0.35);
    ctx.fillStyle = palette.flash;
    ctx.fillRect(
      e.x + BLOCK_GAP / 2,
      e.y + BLOCK_GAP / 2,
      e.w - BLOCK_GAP,
      e.h - BLOCK_GAP,
    );
  }

  ctx.globalAlpha = 1 - t;
  if (palette.explosionGlow > 0) {
    ctx.shadowColor = c;
    ctx.shadowBlur = palette.explosionGlow;
  }
  ctx.strokeStyle = c;
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
  ctx.restore();
}

// Chispas de la paleta desintegrada: de sparkFrom a sparkTo, apagándose con endT.
function drawSpark(
  ctx: CanvasRenderingContext2D,
  palette: ArkanoidPalette,
  s: Spark,
  endT: number,
) {
  const a = 1 - endT;
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = mixHex(palette.sparkFrom, palette.sparkTo, endT);
  if (palette.sparkGlow > 0) {
    ctx.shadowColor = palette.sparkFrom;
    ctx.shadowBlur = palette.sparkGlow;
  }
  ctx.fillRect(s.x - 1.5, s.y - 1.5, 3, 3);
  ctx.restore();
}

// Cápsula con línea central: la "nave-paleta".
function drawPaddle(
  ctx: CanvasRenderingContext2D,
  palette: ArkanoidPalette,
  p: { x: number; y: number; w: number; h: number },
) {
  ctx.save();
  if (palette.paddleGlow > 0) {
    ctx.shadowColor = palette.paddle;
    ctx.shadowBlur = palette.paddleGlow;
  }
  ctx.fillStyle = palette.paddle;
  ctx.strokeStyle = palette.paddle;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(p.x + 1, p.y + 1, p.w - 2, p.h - 2, p.h / 2);
  ctx.globalAlpha = palette.paddleFillAlpha;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.globalAlpha = palette.paddleCoreAlpha;
  ctx.strokeStyle = palette.paddleCore;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(p.x + p.h / 2 + 2, p.y + p.h / 2);
  ctx.lineTo(p.x + p.w - p.h / 2 - 2, p.y + p.h / 2);
  ctx.stroke();
  ctx.restore();
}

// Pelota con halo según la skin y núcleo opcional.
function drawBall(
  ctx: CanvasRenderingContext2D,
  palette: ArkanoidPalette,
  b: { x: number; y: number; w: number; h: number },
) {
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  const r = b.w / 2;

  ctx.save();
  if (palette.ballGlow > 0) {
    ctx.shadowColor = palette.ball;
    ctx.shadowBlur = palette.ballGlow;
  }
  ctx.fillStyle = palette.ball;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 1, 0, Math.PI * 2);
  ctx.fill();

  if (palette.ballCoreAlpha > 0) {
    ctx.shadowBlur = 0;
    ctx.globalAlpha = palette.ballCoreAlpha;
    ctx.fillStyle = palette.ballCore;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

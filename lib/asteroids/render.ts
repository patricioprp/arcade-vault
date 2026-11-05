// Render de ROCAS: trazos vectoriales con look de fósforo (halo ancho + núcleo fino)
// y mezcla aditiva. Los colores salen de la skin activa (skins.ts); acá no hay colores fijos.
// Sin HUD ni "GAME OVER": eso es del reproductor.

import type { AsteroidsGame } from "./engine";
import {
  WORLD_H,
  WORLD_W,
  rand,
  type Asteroid,
  type Bullet,
  type Particle,
  type PowerUp,
  type Ship,
} from "./entities";
import type { AsteroidsPalette } from "./skins";

// Campo de estrellas fijo (mismo cielo en cada partida), con PRNG propio para no depender de Math.random.
const STARS = (() => {
  let seed = 83;
  const next = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  return Array.from({ length: 70 }, () => ({
    x: next() * WORLD_W,
    y: next() * WORLD_H,
    a: 0.12 + next() * 0.35,
    accent: next() < 0.3,
  }));
})();

export function drawAsteroids(
  ctx: CanvasRenderingContext2D,
  game: AsteroidsGame,
  palette: AsteroidsPalette,
  now: number,
): void {
  drawSpace(ctx, palette);

  ctx.save();
  ctx.globalCompositeOperation = palette.blend;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  game.particles.forEach((p) => drawParticle(ctx, palette, p));
  game.asteroids.forEach((a) => drawAsteroid(ctx, palette, a));
  game.powerUps.forEach((p) => drawPowerUp(ctx, palette, p, now));
  game.bullets.forEach((b) => drawBullet(ctx, palette, b));
  drawShip(ctx, palette, game.ship);
  ctx.restore();
}

function drawSpace(ctx: CanvasRenderingContext2D, palette: AsteroidsPalette) {
  ctx.fillStyle = palette.background;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  if (palette.spaceHalo !== null) {
    const halo = ctx.createRadialGradient(
      WORLD_W / 2,
      WORLD_H / 2,
      0,
      WORLD_W / 2,
      WORLD_H / 2,
      WORLD_W * 0.6,
    );
    halo.addColorStop(0, palette.spaceHalo);
    // Único literal de color permitido: transparente neutro para el borde del degradé
    // (los stops no admiten globalAlpha).
    halo.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  }

  if (palette.starAlpha > 0) {
    for (const s of STARS) {
      ctx.fillStyle = s.accent ? palette.starAccent : palette.starBase;
      ctx.globalAlpha = s.a * palette.starAlpha;
      ctx.fillRect(s.x, s.y, 1.2, 1.2);
    }
    ctx.globalAlpha = 1;
  }
}

// Traza el path actual: halo de color con blur y, si la skin tiene núcleo, un segundo trazo fino.
function phosphor(
  ctx: CanvasRenderingContext2D,
  palette: AsteroidsPalette,
  color: string,
  width: number,
  glow: number,
) {
  const w = width * palette.lineScale;
  ctx.shadowColor = color;
  ctx.shadowBlur = glow;
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.globalAlpha = palette.strokeAlpha;
  ctx.stroke();
  ctx.shadowBlur = 0;
  if (palette.core !== null) {
    ctx.strokeStyle = palette.core.color;
    ctx.lineWidth = Math.max(0.6, w * 0.35);
    ctx.globalAlpha = palette.core.alpha;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawAsteroid(
  ctx: CanvasRenderingContext2D,
  palette: AsteroidsPalette,
  a: Asteroid,
) {
  ctx.save();
  ctx.translate(a.x, a.y);
  ctx.rotate(a.rot);
  ctx.beginPath();
  ctx.moveTo(a.verts[0][0], a.verts[0][1]);
  for (let i = 1; i < a.verts.length; i++)
    ctx.lineTo(a.verts[i][0], a.verts[i][1]);
  ctx.closePath();
  if (palette.asteroidFillAlpha > 0) {
    ctx.fillStyle = palette.asteroidFill;
    ctx.globalAlpha = palette.asteroidFillAlpha;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  phosphor(ctx, palette, palette.asteroid, 2, palette.glow.asteroid);
  ctx.restore();
}

function drawShip(
  ctx: CanvasRenderingContext2D,
  palette: AsteroidsPalette,
  ship: Ship,
) {
  if (ship.dead) return;
  // Parpadeo durante invencibilidad de reaparición
  if (ship.invincible > 0 && Math.floor(ship.invincible * 8) % 2 === 0) return;

  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.angle);

  // Silueta clásica: triángulo con muesca trasera
  ctx.beginPath();
  ctx.moveTo(20, 0); // nariz
  ctx.lineTo(-12, -9); // ala izquierda
  ctx.lineTo(-7, 0); // muesca trasera
  ctx.lineTo(-12, 9); // ala derecha
  ctx.closePath();
  phosphor(ctx, palette, palette.ship, 2.2, palette.glow.ship);

  // Llama del propulsor
  if (ship.thrusting && Math.random() > 0.35) {
    ctx.beginPath();
    ctx.moveTo(-8, -4);
    ctx.lineTo(-8 - rand(6, 14), 0);
    ctx.lineTo(-8, 4);
    phosphor(ctx, palette, palette.thrust, 1.6, palette.glow.thrust);
  }

  ctx.restore();
}

function drawBullet(
  ctx: CanvasRenderingContext2D,
  palette: AsteroidsPalette,
  b: Bullet,
) {
  // Estela corta en la dirección de la bala: se lee mejor que un punto a 520 px/s.
  ctx.beginPath();
  ctx.moveTo(b.x, b.y);
  ctx.lineTo(b.x - b.vx * 0.012, b.y - b.vy * 0.012);
  phosphor(ctx, palette, palette.bullet, 2.4, palette.glow.bullet);
}

function drawPowerUp(
  ctx: CanvasRenderingContext2D,
  palette: AsteroidsPalette,
  p: PowerUp,
  now: number,
) {
  // Parpadea en sus últimos 2 s de vida
  if (p.ttl < 2 && Math.floor(p.ttl * 8) % 2 === 0) return;
  const pulse = 0.85 + Math.sin(now / 150) * 0.15;
  const r = p.radius * pulse;

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.save();
  ctx.rotate(Math.PI / 4);
  ctx.beginPath();
  ctx.rect(-r, -r, r * 2, r * 2);
  phosphor(ctx, palette, palette.powerUp, 2, palette.glow.powerUp);
  ctx.restore();

  ctx.shadowColor = palette.powerUpText;
  ctx.shadowBlur = palette.glow.powerUpText;
  ctx.fillStyle = palette.powerUpText;
  ctx.font = "bold 12px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("3x", 0, 1);
  ctx.restore();
}

function drawParticle(
  ctx: CanvasRenderingContext2D,
  palette: AsteroidsPalette,
  p: Particle,
) {
  // Se desvanecen con el tiempo de vida restante.
  ctx.strokeStyle =
    p.source === "ship" ? palette.particleShip : palette.particleAsteroid;
  ctx.globalAlpha = p.ttl / p.life;
  ctx.lineWidth = 1.4 * palette.lineScale;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(p.x - p.vx * 0.05, p.y - p.vy * 0.05);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

// Render de ROCAS: trazos vectoriales con look de fósforo (halo ancho + núcleo fino)
// y mezcla aditiva, con la paleta de app/globals.css. Sin HUD ni "GAME OVER": eso es del reproductor.

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

const COLORS = {
  ship: "#00f5ff", // --cyan
  asteroid: "#ff006e", // --magenta
  bullet: "#f5ff00", // --yellow
  powerUp: "#00ff88", // --green
  space: "#0a0a30", // halo de .cover-rocas
} as const;

// RGB de cada color para las partículas, que se desvanecen con alpha.
const PARTICLE_RGB = { ship: "0, 245, 255", asteroid: "255, 0, 110" } as const;

// Campo de estrellas fijo (mismo cielo en cada partida), con PRNG propio para no depender de Math.random.
const STARS = (() => {
  let seed = 83;
  const next = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  return Array.from({ length: 70 }, () => ({
    x: next() * WORLD_W,
    y: next() * WORLD_H,
    a: 0.12 + next() * 0.35,
    cyan: next() < 0.3,
  }));
})();

export function drawAsteroids(
  ctx: CanvasRenderingContext2D,
  game: AsteroidsGame,
  now: number,
): void {
  drawSpace(ctx);

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  game.particles.forEach((p) => drawParticle(ctx, p));
  game.asteroids.forEach((a) => drawAsteroid(ctx, a));
  game.powerUps.forEach((p) => drawPowerUp(ctx, p, now));
  game.bullets.forEach((b) => drawBullet(ctx, b));
  drawShip(ctx, game.ship);
  ctx.restore();
}

function drawSpace(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  const halo = ctx.createRadialGradient(
    WORLD_W / 2,
    WORLD_H / 2,
    0,
    WORLD_W / 2,
    WORLD_H / 2,
    WORLD_W * 0.6,
  );
  halo.addColorStop(0, COLORS.space);
  halo.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);

  for (const s of STARS) {
    ctx.fillStyle = s.cyan
      ? `rgba(0, 245, 255, ${s.a})`
      : `rgba(230, 233, 255, ${s.a})`;
    ctx.fillRect(s.x, s.y, 1.2, 1.2);
  }
}

// Traza el path actual dos veces: halo de color con blur y núcleo fino casi blanco.
function phosphor(
  ctx: CanvasRenderingContext2D,
  color: string,
  width: number,
  glow: number,
) {
  ctx.shadowColor = color;
  ctx.shadowBlur = glow;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.globalAlpha = 0.75;
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = Math.max(0.6, width * 0.35);
  ctx.globalAlpha = 0.55;
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawAsteroid(ctx: CanvasRenderingContext2D, a: Asteroid) {
  ctx.save();
  ctx.translate(a.x, a.y);
  ctx.rotate(a.rot);
  ctx.beginPath();
  ctx.moveTo(a.verts[0][0], a.verts[0][1]);
  for (let i = 1; i < a.verts.length; i++)
    ctx.lineTo(a.verts[i][0], a.verts[i][1]);
  ctx.closePath();
  ctx.fillStyle = "rgba(255, 0, 110, 0.05)";
  ctx.fill();
  phosphor(ctx, COLORS.asteroid, 2, 12);
  ctx.restore();
}

function drawShip(ctx: CanvasRenderingContext2D, ship: Ship) {
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
  phosphor(ctx, COLORS.ship, 2.2, 14);

  // Llama del propulsor
  if (ship.thrusting && Math.random() > 0.35) {
    ctx.beginPath();
    ctx.moveTo(-8, -4);
    ctx.lineTo(-8 - rand(6, 14), 0);
    ctx.lineTo(-8, 4);
    phosphor(ctx, COLORS.bullet, 1.6, 10);
  }

  ctx.restore();
}

function drawBullet(ctx: CanvasRenderingContext2D, b: Bullet) {
  // Estela corta en la dirección de la bala: se lee mejor que un punto a 520 px/s.
  ctx.beginPath();
  ctx.moveTo(b.x, b.y);
  ctx.lineTo(b.x - b.vx * 0.012, b.y - b.vy * 0.012);
  phosphor(ctx, COLORS.bullet, 2.4, 10);
}

function drawPowerUp(ctx: CanvasRenderingContext2D, p: PowerUp, now: number) {
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
  phosphor(ctx, COLORS.powerUp, 2, 14);
  ctx.restore();

  ctx.shadowColor = COLORS.powerUp;
  ctx.shadowBlur = 8;
  ctx.fillStyle = COLORS.powerUp;
  ctx.font = "bold 12px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("3x", 0, 1);
  ctx.restore();
}

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
  const alpha = p.ttl / p.life;
  ctx.strokeStyle = `rgba(${PARTICLE_RGB[p.source]}, ${alpha.toFixed(2)})`;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(p.x - p.vx * 0.05, p.y - p.vy * 0.05);
  ctx.stroke();
}

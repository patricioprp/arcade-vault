// Entidades de ROCAS, portadas de references/started-games/02-asteroids/game.js.
// Solo estado y física: el dibujo vive en render.ts.

export const WORLD_W = 800;
export const WORLD_H = 600;

export const wrap = (v: number, max: number) => ((v % max) + max) % max;
export const dist = (
  a: { x: number; y: number },
  b: { x: number; y: number },
) => Math.hypot(a.x - b.x, a.y - b.y);
export const rand = (min: number, max: number) =>
  min + Math.random() * (max - min);
const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1));

export const POWERUP_DROP_CHANCE = 0.15;
export const POWERUP_DURATION = 5;
const POWERUP_TTL = 12;
const TRIPLE_SPREAD = 0.18;

export type AsteroidSize = 1 | 2 | 3;
export const RADII = [0, 16, 30, 50]; // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32]; // velocidad base por tamaño
export const POINTS = [0, 100, 50, 20]; // puntos por tamaño

export class Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ttl = 1.1;
  radius = 2;
  dead = false;

  constructor(x: number, y: number, angle: number) {
    const SPEED = 520;
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
  }

  update(dt: number) {
    this.x = wrap(this.x + this.vx * dt, WORLD_W);
    this.y = wrap(this.y + this.vy * dt, WORLD_H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }
}

export class Asteroid {
  x: number;
  y: number;
  size: AsteroidSize;
  radius: number;
  vx: number;
  vy: number;
  rot: number;
  rotSpeed: number;
  verts: [number, number][] = [];
  dead = false;

  constructor(x: number, y: number, size: AsteroidSize = 3) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.radius = RADII[size];

    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);

    // Polígono irregular
    const n = randInt(8, 13);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt: number) {
    this.x = wrap(this.x + this.vx * dt, WORLD_W);
    this.y = wrap(this.y + this.vy * dt, WORLD_H);
    this.rot += this.rotSpeed * dt;
  }

  split(): Asteroid[] {
    if (this.size <= 1) return [];
    const next = (this.size - 1) as AsteroidSize;
    return [
      new Asteroid(this.x, this.y, next),
      new Asteroid(this.x, this.y, next),
    ];
  }
}

export class PowerUp {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius = 12;
  ttl = POWERUP_TTL;
  dead = false;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(20, 40);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }

  update(dt: number) {
    this.x = wrap(this.x + this.vx * dt, WORLD_W);
    this.y = wrap(this.y + this.vy * dt, WORLD_H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }
}

export type ShipControls = { left: boolean; right: boolean; thrust: boolean };

export class Ship {
  x = WORLD_W / 2;
  y = WORLD_H / 2;
  angle = -Math.PI / 2;
  vx = 0;
  vy = 0;
  radius = 12;
  thrusting = false;
  invincible = 3;
  shootCooldown = 0;
  tripleShot = 0;
  dead = false;

  reset() {
    this.x = WORLD_W / 2;
    this.y = WORLD_H / 2;
    this.angle = -Math.PI / 2;
    this.vx = 0;
    this.vy = 0;
    this.thrusting = false;
    this.invincible = 3;
    this.shootCooldown = 0;
    this.dead = false;
  }

  update(dt: number, controls: ShipControls) {
    if (this.dead) return;
    if (this.invincible > 0) this.invincible -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.tripleShot > 0)
      this.tripleShot = Math.max(0, this.tripleShot - dt);

    const ROT = 3.5; // rad/s
    const THRUST = 260; // px/s²
    const DRAG = 0.987;

    if (controls.left) this.angle -= ROT * dt;
    if (controls.right) this.angle += ROT * dt;

    this.thrusting = controls.thrust;
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * THRUST * dt;
      this.vy += Math.sin(this.angle) * THRUST * dt;
    }

    this.vx *= DRAG;
    this.vy *= DRAG;
    this.x = wrap(this.x + this.vx * dt, WORLD_W);
    this.y = wrap(this.y + this.vy * dt, WORLD_H);
  }

  tryShoot(): Bullet[] {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    const NOSE = 21;
    const ox = this.x + Math.cos(this.angle) * NOSE;
    const oy = this.y + Math.sin(this.angle) * NOSE;
    if (this.tripleShot > 0) {
      return [
        new Bullet(ox, oy, this.angle - TRIPLE_SPREAD),
        new Bullet(ox, oy, this.angle),
        new Bullet(ox, oy, this.angle + TRIPLE_SPREAD),
      ];
    }
    return [new Bullet(ox, oy, this.angle)];
  }
}

// Origen de la explosión: render.ts lo usa para teñir la partícula con el color del objeto.
export type ParticleSource = "ship" | "asteroid";

export class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  ttl: number;
  source: ParticleSource;
  dead = false;

  constructor(x: number, y: number, source: ParticleSource) {
    this.x = x;
    this.y = y;
    this.source = source;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl = this.life;
  }

  update(dt: number) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }
}

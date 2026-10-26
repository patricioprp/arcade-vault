// Motor de ROCAS: estado de la partida y reglas de game.js, sin DOM.
// Quien lo monta le pasa el input de cada frame y lee las entidades para dibujarlas.

import {
  Asteroid,
  Bullet,
  Particle,
  POINTS,
  POWERUP_DROP_CHANCE,
  POWERUP_DURATION,
  PowerUp,
  Ship,
  WORLD_H,
  WORLD_W,
  dist,
  rand,
  type ParticleSource,
} from "./entities";

export { WORLD_H, WORLD_W };

export type AsteroidsInput = {
  left: boolean; // ArrowLeft mantenida
  right: boolean; // ArrowRight mantenida
  thrust: boolean; // ArrowUp mantenida
  fire: boolean; // Space pulsada en este frame (se consume al leerla)
};

export type AsteroidsStatus = "playing" | "dead" | "gameover";

export type AsteroidsStats = {
  score: number;
  lives: number; // 3 → 0
  level: number; // empieza en 1
  tripleShot: number; // segundos restantes del 3x, redondeado a 0,1; 0 = inactivo
  status: AsteroidsStatus;
};

const SAFE_DIST = 130;
const RESPAWN_DELAY = 2;

export class AsteroidsGame {
  ship = new Ship();
  bullets: Bullet[] = [];
  asteroids: Asteroid[] = [];
  particles: Particle[] = [];
  powerUps: PowerUp[] = [];
  score = 0;
  lives = 3;
  level = 1;
  status: AsteroidsStatus = "playing";

  private deadTimer = 0;
  private powerUpSpawned = false;
  private killsSinceSpawn = 0;
  private onStats: (stats: AsteroidsStats) => void;
  private lastStats: AsteroidsStats;

  constructor(onStats: (stats: AsteroidsStats) => void) {
    this.onStats = onStats;
    this.spawnAsteroids(4);
    this.lastStats = this.getStats();
    onStats(this.lastStats);
  }

  getStats(): AsteroidsStats {
    return {
      score: this.score,
      lives: this.lives,
      level: this.level,
      tripleShot: Math.ceil(this.ship.tripleShot * 10) / 10,
      status: this.status,
    };
  }

  update(dt: number, input: AsteroidsInput) {
    this.step(dt, input);
    this.emitStats();
  }

  private step(dt: number, input: AsteroidsInput) {
    if (this.status === "gameover") {
      this.updateParticles(dt);
      return;
    }

    if (this.status === "dead") {
      this.deadTimer -= dt;
      this.updateParticles(dt);
      this.asteroids.forEach((a) => a.update(dt));
      if (this.deadTimer <= 0) {
        this.status = "playing";
        this.ship.reset();
      }
      return;
    }

    // Disparar
    if (input.fire) this.bullets.push(...this.ship.tryShoot());

    this.ship.update(dt, input);
    this.bullets.forEach((b) => b.update(dt));
    this.asteroids.forEach((a) => a.update(dt));
    this.powerUps.forEach((p) => p.update(dt));
    this.updateParticles(dt);

    this.bullets = this.bullets.filter((b) => !b.dead);
    this.powerUps = this.powerUps.filter((p) => !p.dead);

    for (const p of this.powerUps) {
      if (!p.dead && dist(this.ship, p) < this.ship.radius + p.radius) {
        p.dead = true;
        this.ship.tripleShot = POWERUP_DURATION;
      }
    }

    // Bala vs asteroide
    const newAsteroids: Asteroid[] = [];
    for (const b of this.bullets) {
      for (const a of this.asteroids) {
        if (!a.dead && !b.dead && dist(b, a) < a.radius) {
          b.dead = true;
          a.dead = true;
          this.score += POINTS[a.size];
          this.explode(a.x, a.y, a.size * 5, "asteroid");
          newAsteroids.push(...a.split());
          if (!this.powerUpSpawned) {
            this.killsSinceSpawn++;
            const guaranteed = this.killsSinceSpawn >= 5;
            if (guaranteed || Math.random() < POWERUP_DROP_CHANCE) {
              this.powerUps.push(new PowerUp(a.x, a.y));
              this.powerUpSpawned = true;
            }
          }
        }
      }
    }
    this.asteroids = this.asteroids.filter((a) => !a.dead).concat(newAsteroids);
    this.bullets = this.bullets.filter((b) => !b.dead);

    // Nave vs asteroide
    if (this.ship.invincible <= 0) {
      for (const a of this.asteroids) {
        if (dist(this.ship, a) < this.ship.radius + a.radius * 0.82) {
          this.killShip();
          break;
        }
      }
    }

    // Nivel completado
    if (this.asteroids.length === 0) this.nextLevel();
  }

  private updateParticles(dt: number) {
    this.particles.forEach((p) => p.update(dt));
    this.particles = this.particles.filter((p) => !p.dead);
  }

  private spawnAsteroids(count: number) {
    for (let i = 0; i < count; i++) {
      let x: number, y: number;
      do {
        x = rand(0, WORLD_W);
        y = rand(0, WORLD_H);
      } while (Math.hypot(x - WORLD_W / 2, y - WORLD_H / 2) < SAFE_DIST);
      this.asteroids.push(new Asteroid(x, y, 3));
    }
  }

  private nextLevel() {
    this.level++;
    this.bullets = [];
    this.particles = [];
    this.powerUps = [];
    this.powerUpSpawned = false;
    this.killsSinceSpawn = 0;
    this.ship.reset();
    this.spawnAsteroids(3 + this.level);
  }

  private explode(x: number, y: number, count: number, source: ParticleSource) {
    for (let i = 0; i < count; i++)
      this.particles.push(new Particle(x, y, source));
  }

  private killShip() {
    this.explode(this.ship.x, this.ship.y, 14, "ship");
    this.ship.dead = true;
    this.lives--;
    if (this.lives <= 0) {
      this.status = "gameover";
    } else {
      this.status = "dead";
      this.deadTimer = RESPAWN_DELAY;
    }
  }

  // Solo notifica cuando cambia algún campo, para no re-renderizar el HUD en cada frame.
  private emitStats() {
    const next = this.getStats();
    const prev = this.lastStats;
    if (
      next.score === prev.score &&
      next.lives === prev.lives &&
      next.level === prev.level &&
      next.tripleShot === prev.tripleShot &&
      next.status === prev.status
    )
      return;
    this.lastStats = next;
    this.onStats(next);
  }
}

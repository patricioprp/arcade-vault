// Motor de BLOQUE BUSTER: estado de la partida y reglas de game.js, sin DOM.
// Quien lo monta le pasa el input de cada frame, lee el estado para dibujarlo y reproduce los eventos.

import { LEVELS, type BlockColor } from "./levels";

export const WORLD_W = 800;
export const WORLD_H = 600;

export type ArkanoidInput = {
  left: boolean; // ← mantenida
  right: boolean; // → mantenida
  pointerX: number | null; // última x del puntero en coordenadas del mundo (se consume al leerla)
  launch: boolean; // Espacio o click en este frame (se consume al leerla)
};

export type ArkanoidStatus = "serve" | "playing" | "gameover";
export type ArkanoidEvent = "bounce" | "break";

export type ArkanoidStats = {
  score: number;
  lives: number; // empieza en 3
  level: number; // 1–5
  blocksLeft: number; // bloques vivos del nivel actual
  status: ArkanoidStatus;
  won: boolean; // true solo si terminó al vaciar el nivel 5
};

export type Block = {
  x: number;
  y: number;
  w: number;
  h: number;
  color: BlockColor;
  alive: boolean;
};
export type Explosion = {
  x: number;
  y: number;
  w: number;
  h: number;
  color: BlockColor;
  elapsed: number; // ms
};
export type Spark = { x: number; y: number; vx: number; vy: number };

// Constantes de game.js
const PADDLE_SPEED = 400; // px/s
const PADDLE_W = 81;
const PADDLE_H = 14;
const PADDLE_Y = 560;
const BALL_SIZE = 16;
const BASE_BALL_VX = 200;
const BASE_BALL_VY = -300;
const BLOCK_W = 64;
const BLOCK_H = 24;
const BLOCKS_ORIGIN_X = (WORLD_W - 10 * BLOCK_W) / 2; // 80
const BLOCKS_ORIGIN_Y = 80;
const BLOCK_POINTS = 10;
const START_LIVES = 3;
export const EXPLOSION_DURATION = 150; // ms

const END_DURATION = 1; // segundos de animación antes del modal
const SPARK_COUNT = 28;
const SPARK_DRAG = 2.5; // frenado por segundo de las chispas

export class ArkanoidGame {
  paddle = {
    x: (WORLD_W - PADDLE_W) / 2,
    y: PADDLE_Y,
    w: PADDLE_W,
    h: PADDLE_H,
  };
  ball = { x: 0, y: 0, w: BALL_SIZE, h: BALL_SIZE, vx: 0, vy: 0 };
  blocks: Block[] = [];
  explosions: Explosion[] = [];
  sparks: Spark[] = []; // chispas de la paleta tras una derrota; vacío en cualquier otro caso
  endT = 0; // 0 → 1 durante el segundo posterior a "gameover"; lo usa el render
  score = 0;
  lives = START_LIVES;
  level = 1;
  status: ArkanoidStatus = "serve";
  won = false;

  private onStats: (stats: ArkanoidStats) => void;
  private onEvent: (event: ArkanoidEvent) => void;
  private lastStats: ArkanoidStats;

  constructor(
    onStats: (stats: ArkanoidStats) => void,
    onEvent?: (event: ArkanoidEvent) => void,
  ) {
    this.onStats = onStats;
    this.onEvent = onEvent ?? (() => {});
    this.loadLevel(1);
    this.lastStats = this.getStats();
    onStats(this.lastStats);
  }

  getStats(): ArkanoidStats {
    return {
      score: this.score,
      lives: this.lives,
      level: this.level,
      blocksLeft: this.blocksLeft(),
      status: this.status,
      won: this.won,
    };
  }

  update(dt: number, input: ArkanoidInput) {
    this.step(dt, input);
    this.emitStats();
  }

  private blocksLeft(): number {
    let n = 0;
    for (const b of this.blocks) if (b.alive) n++;
    return n;
  }

  private step(dt: number, input: ArkanoidInput) {
    this.updateExplosions(dt);

    if (this.status === "gameover") {
      this.endT = Math.min(1, this.endT + dt / END_DURATION);
      this.updateSparks(dt);
      return;
    }

    this.movePaddle(dt, input);

    if (this.status === "serve") {
      this.stickBall();
      if (input.launch) this.launch();
      return;
    }

    this.moveBall(dt);
  }

  private movePaddle(dt: number, input: ArkanoidInput) {
    const p = this.paddle;
    const maxX = WORLD_W - p.w;
    if (input.pointerX !== null)
      p.x = Math.max(0, Math.min(maxX, input.pointerX - p.w / 2));
    if (input.left) p.x = Math.max(0, p.x - PADDLE_SPEED * dt);
    if (input.right) p.x = Math.min(maxX, p.x + PADDLE_SPEED * dt);
  }

  // En "serve" la pelota queda centrada sobre la paleta y la sigue.
  private stickBall() {
    const { paddle: p, ball } = this;
    ball.x = p.x + (p.w - ball.w) / 2;
    ball.y = p.y - ball.h;
  }

  private launch() {
    const speed = LEVELS[this.level - 1].speed;
    this.ball.vx = BASE_BALL_VX * speed;
    this.ball.vy = BASE_BALL_VY * speed;
    this.status = "playing";
  }

  private moveBall(dt: number) {
    const { ball, paddle } = this;
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    // Paredes (izquierda, derecha, techo)
    if (ball.x <= 0) {
      ball.x = 0;
      ball.vx = Math.abs(ball.vx);
      this.onEvent("bounce");
    }
    if (ball.x + ball.w >= WORLD_W) {
      ball.x = WORLD_W - ball.w;
      ball.vx = -Math.abs(ball.vx);
      this.onEvent("bounce");
    }
    if (ball.y <= 0) {
      ball.y = 0;
      ball.vy = Math.abs(ball.vy);
      this.onEvent("bounce");
    }

    // Paleta: solo invierte vy, igual que game.js
    if (
      ball.vy > 0 &&
      ball.x + ball.w > paddle.x &&
      ball.x < paddle.x + paddle.w &&
      ball.y + ball.h >= paddle.y &&
      ball.y + ball.h <= paddle.y + paddle.h + 8
    ) {
      ball.y = paddle.y - ball.h;
      ball.vy = -Math.abs(ball.vy);
      this.onEvent("bounce");
    }

    // Bloques: como mucho uno por update
    for (const block of this.blocks) {
      if (!block.alive || !this.hits(block)) continue;
      block.alive = false;
      this.explosions.push({
        x: block.x,
        y: block.y,
        w: block.w,
        h: block.h,
        color: block.color,
        elapsed: 0,
      });
      this.score += BLOCK_POINTS;
      ball.vy = -ball.vy;
      this.onEvent("break");
      if (this.blocksLeft() === 0) {
        if (this.level < LEVELS.length) this.loadLevel(this.level + 1);
        else this.endGame(true);
        return;
      }
      break;
    }

    // Pelota perdida
    if (ball.y > WORLD_H) {
      this.lives--;
      if (this.lives <= 0) {
        this.lives = 0;
        this.endGame(false);
      } else {
        this.status = "serve";
        this.stickBall();
      }
    }
  }

  private hits(block: Block): boolean {
    const { ball } = this;
    return (
      ball.x < block.x + block.w &&
      ball.x + ball.w > block.x &&
      ball.y < block.y + block.h &&
      ball.y + ball.h > block.y
    );
  }

  // Igual que loadLevel() de game.js, pero la pelota espera el saque. La paleta conserva su x.
  private loadLevel(n: number) {
    this.level = n;
    this.blocks = LEVELS[n - 1].blocks.map((b) => ({
      x: BLOCKS_ORIGIN_X + b.col * BLOCK_W,
      y: BLOCKS_ORIGIN_Y + b.row * BLOCK_H,
      w: BLOCK_W,
      h: BLOCK_H,
      color: b.color,
      alive: true,
    }));
    this.explosions = [];
    this.status = "serve";
    this.stickBall();
  }

  private endGame(won: boolean) {
    this.status = "gameover";
    this.won = won;
    this.endT = 0;
    if (!won) this.spawnSparks();
  }

  // La paleta se desintegra: chispas repartidas a lo largo de ella, disparadas hacia arriba y afuera.
  private spawnSparks() {
    const p = this.paddle;
    this.sparks = Array.from({ length: SPARK_COUNT }, () => {
      const x = p.x + Math.random() * p.w;
      const y = p.y + Math.random() * p.h;
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.4;
      const speed = 80 + Math.random() * 220;
      return { x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed };
    });
  }

  private updateSparks(dt: number) {
    const k = Math.max(0, 1 - SPARK_DRAG * dt);
    for (const s of this.sparks) {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vx *= k;
      s.vy *= k;
    }
  }

  private updateExplosions(dt: number) {
    if (this.explosions.length === 0) return;
    for (const e of this.explosions) e.elapsed += dt * 1000;
    this.explosions = this.explosions.filter(
      (e) => e.elapsed < EXPLOSION_DURATION,
    );
  }

  private emitStats() {
    const s = this.getStats();
    const l = this.lastStats;
    if (
      s.score !== l.score ||
      s.lives !== l.lives ||
      s.level !== l.level ||
      s.blocksLeft !== l.blocksLeft ||
      s.status !== l.status ||
      s.won !== l.won
    ) {
      this.lastStats = s;
      this.onStats(s);
    }
  }
}

// Motor de SERPENTINA: estado de la partida y reglas del Snake, sin DOM.
// Quien lo monta le pasa el input de cada frame y lee el estado para dibujarlo.

import { FRUIT_KINDS, type FruitKind } from "./fruits";

export const WORLD_W = 800;
export const WORLD_H = 600;
export const CELL = 25;
export const COLS = 32;
export const ROWS = 24;

export type Direction = "up" | "down" | "left" | "right";
export type Cell = { x: number; y: number }; // columna 0–31, fila 0–23

export type SnakeInput = {
  turns: Direction[]; // direcciones pulsadas desde el último frame, en orden (se consumen al leerlas)
  go: boolean; // Espacio pulsado en este frame (se consume al leerlo)
};

export type SnakeStatus = "playing" | "crash" | "ready" | "gameover";

export type SnakeStats = {
  score: number;
  lives: number; // empieza en 3
  level: number; // empieza en 1
  length: number; // segmentos de la serpiente
  status: SnakeStatus;
  won: boolean; // true solo si terminó por llenar la grilla
};

const START_LIVES = 3;
const FRUIT_POINTS = 10; // × nivel
const FRUITS_PER_LEVEL = 5;
const BASE_SPEED = 8; // pasos por segundo en el nivel 1
const MAX_SPEED = 20;
const MAX_QUEUED_TURNS = 2;
const CRASH_DURATION = 0.8; // segundos
const END_DURATION = 1; // segundos de animación antes del modal

const OPPOSITE: Record<Direction, Direction> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

const DELTA: Record<Direction, Cell> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

function startBody(): Cell[] {
  return [
    { x: 16, y: 12 },
    { x: 15, y: 12 },
    { x: 14, y: 12 },
  ];
}

export class SnakeGame {
  body: Cell[] = startBody(); // body[0] es la cabeza
  dir: Direction = "right"; // dirección del último paso
  fruit: { cell: Cell; kind: FruitKind } | null = null; // null solo si la grilla está llena
  crashT = 0; // 0 → 1 durante la animación de choque; lo usa el render
  endT = 0; // 0 → 1 durante el segundo posterior a "gameover"; lo usa el render
  score = 0;
  lives = START_LIVES;
  level = 1;
  status: SnakeStatus = "playing";
  won = false;

  private fruitsEaten = 0;
  private queue: Direction[] = [];
  private acc = 0; // segundos acumulados hacia el próximo paso
  private onStats: (stats: SnakeStats) => void;
  private rng: () => number;
  private lastStats: SnakeStats;

  constructor(onStats: (stats: SnakeStats) => void, rng?: () => number) {
    this.onStats = onStats;
    this.rng = rng ?? Math.random;
    this.spawnFruit();
    this.lastStats = this.getStats();
    onStats(this.lastStats);
  }

  getStats(): SnakeStats {
    return {
      score: this.score,
      lives: this.lives,
      level: this.level,
      length: this.body.length,
      status: this.status,
      won: this.won,
    };
  }

  update(dt: number, input: SnakeInput) {
    this.tick(dt, input);
    this.emitStats();
  }

  private speed(): number {
    return Math.min(BASE_SPEED + (this.level - 1), MAX_SPEED);
  }

  private tick(dt: number, input: SnakeInput) {
    switch (this.status) {
      case "gameover":
        this.endT = Math.min(1, this.endT + dt / END_DURATION);
        return;

      case "crash":
        this.crashT = Math.min(1, this.crashT + dt / CRASH_DURATION);
        if (this.crashT >= 1) this.endCrash();
        return;

      case "ready": {
        // El primer giro que no sea la opuesta a "right" o Espacio la ponen en marcha.
        const start = input.turns.findIndex((t) => t !== OPPOSITE[this.dir]);
        if (start === -1 && !input.go) return;
        this.status = "playing";
        this.acc = 0;
        this.enqueue(start === -1 ? [] : input.turns.slice(start));
        return;
      }

      case "playing": {
        this.enqueue(input.turns);
        this.acc += dt;
        const interval = 1 / this.speed();
        while (this.acc >= interval && this.status === "playing") {
          this.acc -= interval;
          this.step();
        }
        return;
      }
    }
  }

  // Cada giro se valida contra el último encolado (o contra dir): se descartan los iguales y los opuestos.
  private enqueue(turns: Direction[]) {
    for (const t of turns) {
      if (this.queue.length >= MAX_QUEUED_TURNS) return;
      const last = this.queue[this.queue.length - 1] ?? this.dir;
      if (t === last || t === OPPOSITE[last]) continue;
      this.queue.push(t);
    }
  }

  private step() {
    this.dir = this.queue.shift() ?? this.dir;
    const head = this.body[0];
    const next = {
      x: head.x + DELTA[this.dir].x,
      y: head.y + DELTA[this.dir].y,
    };

    if (next.x < 0 || next.x >= COLS || next.y < 0 || next.y >= ROWS) {
      this.crash();
      return;
    }

    const eats =
      this.fruit !== null &&
      this.fruit.cell.x === next.x &&
      this.fruit.cell.y === next.y;
    // Si no come, la cola se va en este paso: su celda queda libre.
    const blocking = eats ? this.body : this.body.slice(0, -1);
    if (blocking.some((c) => c.x === next.x && c.y === next.y)) {
      this.crash();
      return;
    }

    this.body.unshift(next);
    if (!eats) {
      this.body.pop();
      return;
    }

    this.score += FRUIT_POINTS * this.level;
    this.fruitsEaten++;
    if (this.fruitsEaten % FRUITS_PER_LEVEL === 0) this.level++;
    this.spawnFruit();
    if (this.fruit === null) {
      this.status = "gameover";
      this.won = true;
    }
  }

  private crash() {
    this.status = "crash";
    this.crashT = 0;
    this.queue = [];
  }

  private endCrash() {
    if (this.lives <= 1) {
      this.lives = 0;
      this.status = "gameover";
      this.won = false;
      return;
    }
    this.lives--;
    this.body = startBody();
    this.dir = "right";
    this.queue = [];
    this.acc = 0;
    this.crashT = 0;
    this.status = "ready";
    const f = this.fruit;
    if (f && this.body.some((c) => c.x === f.cell.x && c.y === f.cell.y))
      this.spawnFruit();
  }

  private spawnFruit() {
    const taken = new Set(this.body.map((c) => c.y * COLS + c.x));
    const free: Cell[] = [];
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++)
        if (!taken.has(y * COLS + x)) free.push({ x, y });

    if (free.length === 0) {
      this.fruit = null;
      return;
    }
    const cell = free[Math.floor(this.rng() * free.length)];
    const kind = FRUIT_KINDS[Math.floor(this.rng() * FRUIT_KINDS.length)];
    this.fruit = { cell, kind };
  }

  private emitStats() {
    const s = this.getStats();
    const p = this.lastStats;
    if (
      s.score !== p.score ||
      s.lives !== p.lives ||
      s.level !== p.level ||
      s.length !== p.length ||
      s.status !== p.status ||
      s.won !== p.won
    ) {
      this.lastStats = s;
      this.onStats(s);
    }
  }
}

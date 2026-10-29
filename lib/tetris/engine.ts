// Motor de CAÍDA: estado de la partida y reglas de game.js, sin DOM.
// Quien lo monta le pasa las acciones de cada frame y lee el tablero para dibujarlo.

import {
  COLS,
  LINE_SCORES,
  ROWS,
  randomPiece,
  rotateCW,
  type Cell,
  type Piece,
  type Shape,
} from "./pieces";

export const WORLD_W = 800;
export const WORLD_H = 600;

export type TetrisAction =
  "left" | "right" | "rotate" | "softDrop" | "hardDrop";

export type TetrisInput = {
  actions: TetrisAction[]; // un elemento por keydown (incluidos los repetidos por el SO), en orden
};

export type TetrisStatus = "playing" | "gameover";

export type TetrisStats = {
  score: number;
  lines: number;
  level: number; // empieza en 1
  status: TetrisStatus;
};

const KICKS = [0, -1, 1, -2, 2];
const FADE_DURATION = 1; // segundos

const createBoard = (): Cell[][] =>
  Array.from({ length: ROWS }, () => new Array<Cell>(COLS).fill(0));

const dropInterval = (level: number) => Math.max(100, 1000 - (level - 1) * 90);

export class TetrisGame {
  board: Cell[][] = createBoard();
  current: Piece;
  next: Piece = randomPiece();
  fade = 0; // 0 → 1 durante el segundo posterior a "gameover"; lo usa el render
  score = 0;
  lines = 0;
  level = 1;
  status: TetrisStatus = "playing";

  private dropAccum = 0; // ms
  private onStats: (stats: TetrisStats) => void;
  private lastStats: TetrisStats;

  constructor(onStats: (stats: TetrisStats) => void) {
    this.onStats = onStats;
    // Igual que init() de game.js: la primera pieza sale de `next`.
    this.current = this.next;
    this.next = randomPiece();
    this.lastStats = this.getStats();
    onStats(this.lastStats);
  }

  getStats(): TetrisStats {
    return {
      score: this.score,
      lines: this.lines,
      level: this.level,
      status: this.status,
    };
  }

  update(dt: number, input: TetrisInput) {
    this.step(dt, input);
    this.emitStats();
  }

  ghostY(): number {
    let gy = this.current.y;
    while (!this.collide(this.current.shape, this.current.x, gy + 1)) gy++;
    return gy;
  }

  private step(dt: number, input: TetrisInput) {
    if (this.status === "gameover") {
      this.fade = Math.min(1, this.fade + dt / FADE_DURATION);
      return;
    }

    for (const action of input.actions) {
      this.apply(action);
      if (this.status !== "playing") return;
    }

    this.dropAccum += dt * 1000;
    if (this.dropAccum >= dropInterval(this.level)) {
      this.dropAccum = 0;
      if (!this.collide(this.current.shape, this.current.x, this.current.y + 1))
        this.current.y++;
      else this.lockPiece();
    }
  }

  private apply(action: TetrisAction) {
    const { shape, x, y } = this.current;
    switch (action) {
      case "left":
        if (!this.collide(shape, x - 1, y)) this.current.x--;
        break;
      case "right":
        if (!this.collide(shape, x + 1, y)) this.current.x++;
        break;
      case "rotate":
        this.tryRotate();
        break;
      case "softDrop":
        this.softDrop();
        break;
      case "hardDrop":
        this.hardDrop();
        break;
    }
  }

  private collide(shape: Shape, ox: number, oy: number): boolean {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        const nx = ox + c;
        const ny = oy + r;
        if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
        if (ny >= 0 && this.board[ny][nx]) return true;
      }
    }
    return false;
  }

  private tryRotate() {
    const rotated = rotateCW(this.current.shape);
    for (const kick of KICKS) {
      if (!this.collide(rotated, this.current.x + kick, this.current.y)) {
        this.current.shape = rotated;
        this.current.x += kick;
        return;
      }
    }
  }

  private softDrop() {
    if (!this.collide(this.current.shape, this.current.x, this.current.y + 1)) {
      this.current.y++;
      this.score += 1;
    } else {
      this.lockPiece();
    }
  }

  private hardDrop() {
    const gy = this.ghostY();
    this.score += (gy - this.current.y) * 2;
    this.current.y = gy;
    this.lockPiece();
  }

  private lockPiece() {
    this.merge();
    this.clearLines();
    this.spawn();
  }

  private merge() {
    const { shape, x, y } = this.current;
    for (let r = 0; r < shape.length; r++)
      for (let c = 0; c < shape[r].length; c++)
        if (shape[r][c]) this.board[y + r][x + c] = shape[r][c];
  }

  private clearLines() {
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (this.board[r].every((v) => v !== 0)) {
        this.board.splice(r, 1);
        this.board.unshift(new Array<Cell>(COLS).fill(0));
        cleared++;
        r++;
      }
    }
    if (cleared) {
      this.lines += cleared;
      // Los puntos usan el nivel previo a la limpieza, como game.js.
      this.score += (LINE_SCORES[cleared] ?? 0) * this.level;
      this.level = Math.floor(this.lines / 10) + 1;
    }
  }

  private spawn() {
    this.current = this.next;
    this.next = randomPiece();
    if (this.collide(this.current.shape, this.current.x, this.current.y))
      this.status = "gameover";
  }

  // Solo notifica cuando cambia algún campo, para no re-renderizar el HUD en cada frame.
  private emitStats() {
    const next = this.getStats();
    const prev = this.lastStats;
    if (
      next.score === prev.score &&
      next.lines === prev.lines &&
      next.level === prev.level &&
      next.status === prev.status
    )
      return;
    this.lastStats = next;
    this.onStats(next);
  }
}

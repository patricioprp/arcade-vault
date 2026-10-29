// Piezas de CAÍDA, portadas de references/started-games/03-tetris/game.js.
// Solo las 7 estándar: la "tuerca" 3×3 de la referencia queda fuera (SPEC 07).

export const COLS = 10;
export const ROWS = 20;

export type PieceType = 1 | 2 | 3 | 4 | 5 | 6 | 7; // I, O, T, S, Z, J, L (índice de color)
export type Cell = 0 | PieceType; // 0 = vacía
export type Shape = Cell[][];
export type Piece = { type: PieceType; shape: Shape; x: number; y: number };

export const LINE_SCORES = [0, 100, 300, 500, 800];

const PIECES: Record<PieceType, Shape> = {
  1: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ], // I
  2: [
    [2, 2],
    [2, 2],
  ], // O
  3: [
    [0, 3, 0],
    [3, 3, 3],
    [0, 0, 0],
  ], // T
  4: [
    [0, 4, 4],
    [4, 4, 0],
    [0, 0, 0],
  ], // S
  5: [
    [5, 5, 0],
    [0, 5, 5],
    [0, 0, 0],
  ], // Z
  6: [
    [6, 0, 0],
    [6, 6, 6],
    [0, 0, 0],
  ], // J
  7: [
    [0, 0, 7],
    [7, 7, 7],
    [0, 0, 0],
  ], // L
};

export function randomPiece(): Piece {
  const type = (Math.floor(Math.random() * 7) + 1) as PieceType;
  const shape = PIECES[type].map((row) => [...row]);
  return {
    type,
    shape,
    x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
    y: 0,
  };
}

export function rotateCW(shape: Shape): Shape {
  const rows = shape.length;
  const cols = shape[0].length;
  const result: Shape = Array.from({ length: cols }, () =>
    new Array<Cell>(rows).fill(0),
  );
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) result[c][rows - 1 - r] = shape[r][c];
  return result;
}

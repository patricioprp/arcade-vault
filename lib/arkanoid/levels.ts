// Niveles de BLOQUE BUSTER, portados de references/started-games/04-arkanoid/levels.js sin cambios.

export type BlockColor =
  "red" | "yellow" | "cyan" | "magenta" | "hotpink" | "green" | "gray";

export type LevelBlock = { col: number; row: number; color: BlockColor };
export type Level = { speed: number; blocks: LevelBlock[] };

const ROWS = 6;
const COLS = 10;

function grid(
  pick: (col: number, row: number) => BlockColor | null,
): LevelBlock[] {
  const blocks: LevelBlock[] = [];
  for (let row = 0; row < ROWS; row++)
    for (let col = 0; col < COLS; col++) {
      const color = pick(col, row);
      if (color) blocks.push({ col, row, color });
    }
  return blocks;
}

const rowColors1: BlockColor[] = [
  "red",
  "yellow",
  "cyan",
  "magenta",
  "hotpink",
  "green",
];
const rowColors2: BlockColor[] = [
  "gray",
  "cyan",
  "hotpink",
  "yellow",
  "magenta",
  "green",
];
const rowColors4: BlockColor[] = [
  "cyan",
  "magenta",
  "green",
  "yellow",
  "hotpink",
  "red",
];

// 1 — parrilla completa 10×6
const l1 = grid((_, row) => rowColors1[row]);

// 2 — pirámide centrada
const pyStart = [4, 3, 2, 1, 0, 0];
const pyEnd = [5, 6, 7, 8, 9, 9];
const l2 = grid((col, row) =>
  col >= pyStart[row] && col <= pyEnd[row] ? rowColors2[row] : null,
);

// 3 — tablero de ajedrez
const l3 = grid((col, row) =>
  (col + row) % 2 === 0 ? (row < 3 ? "yellow" : "magenta") : null,
);

// 4 — filas con huecos
const gaps4 = [
  [2, 5, 8],
  [0, 4, 7, 9],
  [1, 3, 6],
  [2, 5, 8, 9],
  [0, 4, 7],
  [1, 3, 6, 9],
];
const l4 = grid((col, row) =>
  gaps4[row].includes(col) ? null : rowColors4[row],
);

// 5 — marco + cruz central
const l5 = grid((col, row) => {
  const isFrame = col === 0 || col === 9 || row === 0 || row === 5;
  const isCross = col === 4 || row === 2;
  if (!isFrame && !isCross) return null;
  return isCross && !isFrame ? "hotpink" : "cyan";
});

export const LEVELS: Level[] = [
  { speed: 1.0, blocks: l1 },
  { speed: 1.1, blocks: l2 },
  { speed: 1.21, blocks: l3 },
  { speed: 1.33, blocks: l4 },
  { speed: 1.46, blocks: l5 },
];

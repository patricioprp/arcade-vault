// Recortes de las frutas pixel art de public/games/serpentina/fruits.png (fila del medio).
// x/w vienen de references/source-assests/snake-assets/sprites.js; los nombres se corrigieron
// según la imagen (los del atlas original no coinciden) y se excluye el bol final (x 3637).

export type FruitSprite = { x: number; y: number; w: number; h: number };

export type FruitKind =
  | "apple"
  | "banana"
  | "pineapple"
  | "grape"
  | "pumpkin"
  | "turnip"
  | "eggplant"
  | "strawberry"
  | "cherry"
  | "carrot"
  | "mushroom"
  | "broccoli"
  | "watermelon"
  | "pepper"
  | "kiwi"
  | "lemon"
  | "orange"
  | "peach"
  | "peanut"
  | "raspberry"
  | "tomato";

const ROW_Y = 136;
const ROW_H = 160;

const sprite = (x: number, w: number): FruitSprite => ({
  x,
  y: ROW_Y,
  w,
  h: ROW_H,
});

export const FRUIT_SPRITES: Record<FruitKind, FruitSprite> = {
  apple: sprite(34, 110),
  banana: sprite(186, 150),
  pineapple: sprite(378, 110),
  grape: sprite(540, 130),
  pumpkin: sprite(712, 130),
  turnip: sprite(894, 110),
  eggplant: sprite(1066, 110),
  strawberry: sprite(1228, 130),
  cherry: sprite(1400, 130),
  carrot: sprite(1582, 110),
  mushroom: sprite(1734, 150),
  broccoli: sprite(1906, 150),
  watermelon: sprite(2068, 170),
  pepper: sprite(2250, 140),
  kiwi: sprite(2432, 130),
  lemon: sprite(2604, 130),
  orange: sprite(2786, 110),
  peach: sprite(2948, 130),
  peanut: sprite(3110, 150),
  raspberry: sprite(3302, 110),
  tomato: sprite(3454, 150),
};

export const FRUIT_KINDS = Object.keys(FRUIT_SPRITES) as FruitKind[];

# SPEC GAME-JAM invasores · Variante A — Juego real INVASORES (oleadas clásicas) con leaderboard

> **Estado:** borrador
> **Depende de:** SPEC 05, SPEC 06
> **Fecha:** 2026-11-03
> **Tema:** INVASORES (Space Invaders)
> **Objetivo:** Crear desde cero un Space Invaders clásico de oleadas infinitas en TypeScript, montarlo como juego jugable en `/juegos/invasores/jugar` y habilitar sus puntuaciones en Supabase.

## Por qué existe esta spec

El tema pide un Space Invaders, y el catálogo ya tiene un id simulado que lo describe: `invasores` (SHOOTER, green, dificultad 3, portada `cover-invaders`).
Hoy `invasores` es una simulación: el modal muestra "MODO DEMO — NO PUNTÚA" y su pestaña del Salón está vacía.
No hay código de referencia en `references/started-games/`: el juego se escribe desde cero.

Esta variante es la **fiel al brief** de `@game-planner` (`.claude/agent-memory/game-planner/ideas/invasores.md`):

- Formación de 5×11 que marcha por pasos, baja al tocar el borde y acelera a medida que quedan menos aliens.
- Escudos destructibles, nave misteriosa y oleadas discretas e infinitas, cada una más baja y más rápida.
- Puntos fijos por fila (10/20/30), nave misteriosa de 50 a 300 y bonus por oleada limpia.
- La partida termina sin vidas o en cuanto un alien toca la línea del cañón.

La variante B cambia las reglas: marea continua sin oleadas ni escudos, una fila que llega abajo cuesta una vida en lugar de terminar la partida, y la puntuación depende de un multiplicador por racha de aciertos.

La SPEC 05 dejó el patrón motor + render + componente + `PLAYABLE_GAMES`, y la SPEC 06 dejó el leaderboard genérico por `game_id`.
Esta spec aplica ambos a `invasores` siguiendo `.claude/skills/nuevo-juego/contrato.md`.
El `long` actual del catálogo ("antes de que toquen la superficie") encaja, pero no menciona escudos, nave misteriosa ni oleadas infinitas; se reescribe.

## Alcance

**Entra:**

- Space Invaders escrito desde cero en TypeScript en `lib/invaders/`: sprites como datos, motor sin DOM y render separado.
- Jugabilidad:
  - Mundo de 800×600. Margen lateral de 16 px a cada lado para la formación y el cañón.
  - Cañón de 39×24 (bitmap 13×8 a escala 3) con su borde superior en `y = 536`, movido a 300 px/s y acotado a `16 ≤ x ≤ 745`.
  - Bala propia de 3×12 a 600 px/s hacia arriba; como mucho 1 en pantalla.
  - Formación de 5 filas × 11 columnas de aliens de 33×24 (bitmaps 11×8 a escala 3), separados 48 px en horizontal y 40 px en vertical (ancho total 513 px).
  - Filas de arriba hacia abajo: 1 fila de "calamar" (30 puntos), 2 de "cangrejo" (20 puntos) y 2 de "pulpo" (10 puntos).
  - La formación marcha por pasos de 8 px; si el paso siguiente saca a un alien vivo del margen, en su lugar baja 20 px e invierte el sentido.
  - Intervalo entre pasos: `(0,04 + 0,76 × (vivos − 1) / 54) × max(0,6; 1 − 0,05 × (oleada − 1))` segundos (0,80 s con 55 vivos en la oleada 1; 0,024 s con 1 vivo desde la oleada 9).
  - Origen de la formación al empezar cada oleada: `x = 144`, `y = 100 + 20 × min(oleada − 1, 6)` (de 100 en la oleada 1 a 220 desde la 7).
  - Disparos alienígenas: como mucho 3 en pantalla, de 3×12, a `min(240 + 15 × (oleada − 1), 360)` px/s, uno cada `max(0,35; 1,2 − 0,08 × (oleada − 1))` s. El primero sale 1,5 s después de empezar cada oleada.
  - 4 escudos de 48×32 (12×8 celdas de 4×4 px) centrados en `x = 160, 320, 480, 640`, con el borde superior en `y = 456`. Se reconstruyen al empezar cada oleada.
  - Nave misteriosa de 48×21 en `y = 40`, que cruza a 120 px/s cada 20–30 s si quedan 8 aliens vivos o más. Vale 50, 100, 150 o 300 según una tabla fija de 15 valores indexada por los disparos del jugador.
  - Bonus por oleada limpia: `100 × min(oleada, 10)` (de 100 a 1.000).
  - 3 vidas. Se pierde una cuando una bala alienígena toca el cañón.
  - Oleadas infinitas: al destruir los 55 aliens, pausa de 1,5 s y empieza la siguiente.
  - La partida termina al perder la tercera vida, cuando un alien vivo toca la línea del cañón (`y + 24 ≥ 536`) aunque queden vidas, o al llegar a 10.000.000 puntos.
- Controles: `←` `→` y `A` `D` mueven el cañón; Espacio dispara.
- Render vectorial pixel art con la paleta neón de la plataforma, diseñado con `/frontend-design`.
- Client Component `components/games/invaders.tsx` (`InvadersCanvas`) registrado como `invasores` en `PLAYABLE_GAMES`.
- Pantalla de inicio "PULSA ESPACIO PARA EMPEZAR" con los controles.
- HUD de React: puntuación, vidas `♥`, nivel = número de oleada y celda extra "Aliens" con los vivos de la oleada.
- Pausa, fin, guardado y reinicio con los mecanismos existentes de `GamePlayer`.
- Migración `playable_invasores` que marca `invasores` como jugable en `public.games`.
- En `lib/games.ts`, el `long` de `invasores` pasa a describir escudos, nave misteriosa y oleadas, y `best` pasa de 54190 a 17500.

**Fuera de alcance (para specs futuras):**

- Sonido (marcha de cuatro notas, disparo, explosión, nave misteriosa).
- Vida extra por puntos.
- Números flotantes con los puntos de la nave misteriosa (texto en canvas).
- Daño de escudos por píxel.
- Aliens que disparan rayos de tipos distintos (zigzag, plunger) con reglas propias.
- Controles táctiles, mouse y móvil.
- Cambios en `short`, la portada `cover-invaders`, la categoría o `difficulty` de `invasores`.
- Cambios en `submit_score`, `get_leaderboard`, el Salón o el detalle (ya genéricos desde SPEC 06).
- Cambios en `PlayableGameStats` o en `GamePlayer`.
- Tests automatizados.

## Modelo de datos

```ts
// lib/invaders/sprites.ts — sin DOM: solo datos
export type AlienKind = "squid" | "crab" | "octopus"; // calamar 30, cangrejo 20, pulpo 10
export type Bitmap = { w: number; h: number; rows: string[] }; // "1" = píxel encendido, "0" = apagado
export const PX = 3; // lado en el mundo de cada píxel de bitmap
export const ALIEN_SPRITES: Record<AlienKind, [Bitmap, Bitmap]>; // 11×8, 2 frames por tipo
export const CANNON_SPRITE: Bitmap; // 13×8
export const MYSTERY_SPRITE: Bitmap; // 16×7
export const SHIELD_MASK: string[]; // 8 filas de 12 celdas, "1" = celda sólida
```

Máscara de escudo (12×8 celdas de 4 px, 80 celdas sólidas):

```text
001111111100
011111111110
111111111111
111111111111
111111111111
111100001111
111000000111
111000000111
```

```ts
// lib/invaders/engine.ts — sin DOM: no usa window, document, requestAnimationFrame, Audio, Image ni React
export const WORLD_W = 800;
export const WORLD_H = 600;
export const MARGIN = 16;

export const COLS = 11;
export const ROWS = 5;
export const ALIEN_W = 33;
export const ALIEN_H = 24;
export const COL_GAP = 48;
export const ROW_GAP = 40;
export const ROW_KINDS: AlienKind[]; // ["squid", "crab", "crab", "octopus", "octopus"]
export const ROW_POINTS = [30, 20, 20, 10, 10];
export const STEP_X = 8;
export const STEP_DOWN = 20;

export const CANNON_W = 39;
export const CANNON_H = 24;
export const CANNON_Y = 536; // también es la línea de invasión
export const CANNON_SPEED = 300; // px/s

export const SHOT_W = 3;
export const SHOT_H = 12;
export const PLAYER_SHOT_SPEED = 600; // px/s
export const MAX_ALIEN_SHOTS = 3;

export const SHIELD_CELL = 4;
export const SHIELD_COLS = 12;
export const SHIELD_ROWS = 8;
export const SHIELD_Y = 456;
export const SHIELD_XS = [136, 296, 456, 616]; // borde izquierdo de cada escudo

export const MYSTERY_Y = 40;
export const MYSTERY_W = 48;
export const MYSTERY_H = 21;
export const MYSTERY_SPEED = 120; // px/s
export const MYSTERY_TABLE = [
  50, 50, 100, 150, 100, 100, 50, 300, 100, 100, 100, 50, 150, 100, 100,
];

export const LIVES = 3;
export const MAX_SCORE = 10_000_000;

export type InvadersInput = {
  left: boolean; // ← o A mantenida
  right: boolean; // → o D mantenida
  fire: boolean; // Espacio pulsado en este frame (se consume al leerlo)
};

export type InvadersStatus = "playing" | "hit" | "wave-clear" | "gameover";
export type InvadersEnd = "lives" | "invaded" | "max";

export type InvadersStats = {
  score: number;
  lives: number; // empieza en 3
  wave: number; // empieza en 1; va al HUD como nivel
  aliensLeft: number; // vivos de la oleada actual, 55 → 0
  status: InvadersStatus;
  end: InvadersEnd | null; // null hasta "gameover"
};

export class InvadersGame {
  cannonX: number; // borde izquierdo del cañón
  alive: Uint8Array; // 55 celdas, índice fila × 11 + columna; 1 = vivo
  ox: number; // borde izquierdo de la columna 0
  oy: number; // borde superior de la fila 0
  dir: 1 | -1; // sentido de la marcha
  frame: 0 | 1; // frame de animación de los aliens; cambia en cada paso
  shields: Uint8Array; // 4 × 96 celdas, índice escudo × 96 + fila × 12 + columna; 1 = sólida
  playerShot: Float32Array; // [x, y, activo]
  alienShots: Float32Array; // MAX_ALIEN_SHOTS × [x, y, activo]
  mystery: Float32Array; // [x, sentido, activo]
  explosions: Float32Array; // 12 × [x, y, t, tipo]; tipo 0 alien, 1 nave misteriosa, 2 cañón
  hitT: number; // 0 → 1 durante "hit"; lo usa el render
  endT: number; // 0 → 1 durante el segundo posterior a "gameover"; lo usa el render
  constructor(
    onStats: (stats: InvadersStats) => void, // emite al crear y solo cuando cambia un campo
    rng?: () => number, // por defecto Math.random
  );
  update(dt: number, input: InvadersInput): void; // dt en segundos, capado a 0,05 por el llamador
  getStats(): InvadersStats;
}
```

```ts
// lib/invaders/render.ts
export function drawInvaders(
  ctx: CanvasRenderingContext2D,
  game: InvadersGame,
  now: number,
): void;
// Calamar magenta #ff006e, cangrejo cian #00f5ff, pulpo verde #00ff88, cañón verde #00ff88,
// escudos verde atenuado, balas alienígenas amarillo #f5ff00, nave misteriosa magenta con núcleo amarillo,
// línea del suelo verde en y = 568. Píxeles de bitmap como fillRect de 3×3. Glow con shadowBlur.
// Tonos, atenuado de escudos y glow definidos con /frontend-design.
```

```ts
// components/games/registry.ts
export const PLAYABLE_GAMES = {
  rocas: AsteroidsCanvas,
  caida: TetrisCanvas,
  "bloque-buster": ArkanoidCanvas,
  serpentina: SnakeCanvas,
  invasores: InvadersCanvas,
};
```

```sql
-- supabase/migrations/AAAAMMDDHHMMSS_playable_invasores.sql (nombre generado por npm run db:new)
update public.games set playable = true where id = 'invasores';
```

Convenciones:

- `lib/invaders/` es TypeScript puro y no importa React; todo lo que toca el DOM (canvas, listeners) vive en `components/games/invaders.tsx`.
- Sin asignaciones por frame en `update`: todas las entidades viven en `Uint8Array` / `Float32Array` de tamaño fijo creados en el constructor y se reutilizan por slot.
- Alien `(fila, col)`: esquina superior izquierda en `(ox + col × 48, oy + fila × 40)`.
- Marcha de la formación:
  - El motor acumula `dt` y da un paso cada `intervalo` segundos, recalculado con los vivos y la oleada antes de cada paso. Si un frame acumula varios pasos, los da todos.
  - En cada paso, si `dir = 1` y el borde derecho del alien vivo más a la derecha más 8 supera 784, o si `dir = −1` y el borde izquierdo del vivo más a la izquierda menos 8 queda por debajo de 16: `oy += 20` y `dir = −dir`, sin moverse en x. Si no, `ox += 8 × dir`.
  - Cada paso alterna `frame`.
  - Tras cada paso, las celdas de escudo que se solapan con un alien vivo se borran.
  - Tras cada paso, si algún alien vivo cumple `y + 24 ≥ 536`: `status = "gameover"`, `end = "invaded"`, `lives = 0`.
- Cañón: `cannonX += 300 × dt × (right − left)`, acotado a `[16, 745]`. Al reaparecer vuelve a `x = 380,5`.
- Bala propia:
  - `fire` en `"playing"` con la bala inactiva la crea en `(cannonX + 18, 524)` y suma 1 a `shots`. Con la bala activa, `fire` se descarta (no se guarda).
  - Se mueve en subpasos de como mucho 4 px. En cada subpaso prueba, en este orden: bala alienígena, escudo, alien, nave misteriosa.
  - Sale de pantalla cuando `y + 12 < 0`.
- Disparos alienígenas:
  - Un temporizador dispara cada `max(0,35; 1,2 − 0,08 × (oleada − 1))` s. Si los 3 slots están ocupados, ese disparo se pierde.
  - Columna: con `rng() < 0,5`, la columna con vivos cuyo centro está más cerca del centro del cañón; si no, una columna con vivos al azar uniforme.
  - Sale del centro inferior del alien vivo más bajo de esa columna, a `min(240 + 15 × (oleada − 1), 360)` px/s hacia abajo, en subpasos de como mucho 4 px.
  - Prueba, en este orden: escudo, cañón. Sale de pantalla con `y > 600`.
- Bala propia contra bala alienígena: AABB; ambas desaparecen y no suman puntos. Todas las balas avanzan en subpasos intercalados (un subpaso de cada una por vuelta), para que dos balas enfrentadas no se crucen sin tocarse.
- Escudos:
  - Una celda se toca si su cuadro de 4×4 se solapa con la bala. El impacto borra la celda tocada y sus 4 vecinas ortogonales (cruz de 5) y elimina la bala.
  - Se reconstruyen desde `SHIELD_MASK` al empezar cada oleada.
- Aliens: AABB contra la bala propia. El alien muere, suma `ROW_POINTS[fila]`, deja una explosión de 0,25 s en su lugar y la formación no se detiene.
- Nave misteriosa:
  - Temporizador de `20 + rng() × 10` s que solo corre en `"playing"`. Al vencer, si hay 8 vivos o más, aparece fuera de pantalla (`x = −48` hacia la derecha o `x = 800` hacia la izquierda, alternando y empezando hacia la derecha); si no, se reinicia el temporizador.
  - Al salir por el otro lado desaparece y se reinicia el temporizador.
  - Si la bala propia la toca suma `MYSTERY_TABLE[(shots − 1) % 15]` (el disparo 8, el 23, el 38… valen 300); `shots` cuenta todos los disparos de la partida.
- Golpe al cañón:
  - Una bala alienígena que toca el cañón resta 1 vida en el acto.
  - Si quedan vidas: `"hit"` durante 1 s (`hitT` de 0 a 1), con la formación, la nave misteriosa y los temporizadores congelados. Al terminar, el cañón vuelve al centro, se vacían las balas y vuelve a `"playing"`.
  - Si era la última vida: `status = "gameover"`, `end = "lives"`.
- Oleada limpia:
  - Al morir el último alien suma `100 × min(oleada, 10)` y pasa a `"wave-clear"` durante 1,5 s, con balas y nave misteriosa eliminadas y el cañón quieto.
  - Al terminar: `oleada += 1`, 55 aliens vivos, origen según la oleada, `dir = 1`, escudos reconstruidos, temporizador de disparo a 1,5 s y vuelta a `"playing"`.
- Puntuación: cada suma se acota a `MAX_SCORE`; al llegar a 10.000.000, `status = "gameover"` y `end = "max"`.
- La partida empieza directamente en `"playing"`. El Espacio o click de la pantalla de inicio no encola `fire`.
- Tras `"gameover"`, `update` solo avanza `endT` (en 1 s) y las explosiones; ignora el input.
- Animación de fin dibujada por el render según `end` y `endT`, sin texto:
  - `"lives"`: el cañón estalla en esquirlas verdes que se apagan.
  - `"invaded"`: la formación parpadea en magenta y la línea del suelo se vuelve magenta.
  - `"max"`: los bordes del área parpadean en verde `#00ff88`.
- El HUD recibe `{ score, lives, level: wave, extra: { label: "Aliens", value: String(aliensLeft) } }`; la celda extra está siempre visible.
- Controles:
  - `←` `→` y `A` `D` (mayúsculas o minúsculas) se capturan mientras se mantienen.
  - Espacio (sin `e.repeat`) encola `fire`.
  - `preventDefault` de esas teclas en `keydown` y `keyup`.
- El modal se abre 1 s después de pasar a `"gameover"`, sea cual sea `end`; la puntuación final es la acumulada.
- El juego no escucha `P` ni `Escape`: la pausa es del reproductor.
- Con `paused`, los listeners no capturan teclas ni hacen `preventDefault`, y `fire` pendiente y las teclas mantenidas se descartan.
- Rango de puntuación:
  - Aliens por oleada: 990 (11 × 30 + 22 × 20 + 22 × 10). Bonus: como mucho 1.000.
  - Nave misteriosa: como mucho 300 cada 20 s. Una oleada dura como mucho ~370 s (unos 460 pasos de 0,8 s con los 55 vivos hasta invadir), o sea ≤ 19 naves y ≤ 5.700 puntos.
  - Máximo por oleada: ~7.700. Las oleadas son infinitas, así que el motor acota en 10.000.000 y termina la partida; llegar ahí exige más de 1.300 oleadas.
  - La puntuación enviada es entera y está entre 1 y 10.000.000 de `submit_score`.
- `playable` de `invasores` en la DB y su entrada en `PLAYABLE_GAMES` llegan juntos en esta spec.

## Plan de implementación

1. Crear `lib/invaders/sprites.ts` con `AlienKind`, `PX`, los 6 bitmaps de alien (3 tipos × 2 frames), el cañón, la nave misteriosa y `SHIELD_MASK`. Verificar con `npx tsc --noEmit` que cada bitmap tiene el ancho y alto declarados y que la máscara tiene 80 celdas sólidas.
2. Crear `lib/invaders/engine.ts` con `InvadersGame`:
   - Constantes, arrays de tamaño fijo y estado inicial de la oleada 1.
   - Marcha por pasos con intervalo según vivos y oleada, bajada al borde e invasión.
   - Cañón, bala propia con subpasos, disparos alienígenas apuntados o al azar, choque entre balas.
   - Escudos por celdas con impacto en cruz y borrado por aliens.
   - Nave misteriosa con temporizador y tabla por disparos.
   - Vidas, `"hit"`, `"wave-clear"`, bonus, siguiente oleada, fin por vidas, invasión o tope.
   - `hitT`, `endT`, explosiones y `onStats` solo al cambiar un campo.
   - Verificar con `npx tsc --noEmit` y con `grep` que no hay `window`, `document`, `requestAnimationFrame`, `Audio`, `Image` ni React, y que `update` no usa `new`, literales de array ni de objeto.
3. Crear `lib/invaders/render.ts`:
   - Fondo, línea del suelo, escudos por celda, aliens con su frame, cañón, balas, nave misteriosa y explosiones.
   - Parpadeo del cañón en `"hit"` y animación de fin según `end`.
   - Sin HUD ni textos.
   - Usar `/frontend-design` para los tonos por fila, el atenuado de los escudos, el estilo de las balas, la explosión y el glow.
4. Crear `components/games/invaders.tsx` (`InvadersCanvas`) copiando la estructura de `components/games/asteroids.tsx` (sección 6 de `.claude/skills/nuevo-juego/contrato.md`):
   - Canvas 800×600 con `devicePixelRatio`.
   - Loop rAF con `dt` capado a 50 ms que se detiene con `paused`.
   - `←` `→` `A` `D` mantenidas y Espacio para disparar, con `preventDefault` en `keydown` y `keyup`.
   - Overlay de inicio "PULSA ESPACIO PARA EMPEZAR" con los controles: `←` `→` / `A` `D` mover, Espacio disparar, `P` pausa. Diseñado con `/frontend-design`.
   - `onStats` traducido al HUD y `onGameOver` con 1 s de retraso.
   - Limpieza de rAF, listeners y timeout al desmontar.
5. Registrar `InvadersCanvas` como `invasores` en `components/games/registry.ts`.
6. En `lib/games.ts`, cambiar el `long` de `invasores` a: "Oleadas infinitas de pixeles hostiles marchan en formación y bajan cada vez que tocan el borde. Mueve tu cañón, cúbrete tras los escudos y derriba la nave misteriosa. Cada oleada llega más baja y más rápida: si un alien toca la superficie, todo termina." y `best` de 54190 a 17500.
7. Crear la migración con `npm run db:new -- playable_invasores` y aplicarla con `npm run db:push`. Antes, consultar en `node_modules/next/dist/docs/` si algún paso toca APIs de Next (el registro y la página `/juegos/[id]/jugar` ya existen). Verificar con `execute_sql` que `submit_score('invasores','TEST',100)` inserta y que `get_leaderboard('invasores')` la devuelve. Borrar la fila de prueba.
8. Probar en `npm run dev` con Playwright (sección 9 de `contrato.md`):
   - `/juegos/invasores/jugar`: inicio, movimiento, disparo único, puntos por fila, escudos que se desgastan, nave misteriosa, pérdida de vida, oleada limpia con bonus y nivel 02, invasión, pausa, fin, guardar, Salón, JUGAR DE NUEVO, SALIR y volver.
   - `/salon-de-la-fama?juego=invasores` y `/juegos/invasores` con la marca guardada.
   - `/juegos/rocas/jugar`, `/juegos/caida/jugar`, `/juegos/bloque-buster/jugar` y `/juegos/serpentina/jugar` intactos y `/juegos/gloton/jugar` en MODO DEMO.
   - Revisar la consola.
9. Correr `npm run lint`, `npx tsc --noEmit`, `npm run build` y `get_advisors` (security) del MCP.

## Criterios de aceptación

- [ ] `npm run lint`, `npx tsc --noEmit` y `npm run build` terminan sin errores.
- [ ] Ningún archivo de `lib/invaders/` referencia `window`, `document`, `requestAnimationFrame`, `Audio`, `Image` ni React.
- [ ] `SHIELD_MASK` tiene 8 filas de 12 celdas y 80 celdas sólidas; cada bitmap tiene las medidas declaradas.
- [ ] `/juegos/invasores/jugar` muestra un canvas dentro del CRT con el overlay "PULSA ESPACIO PARA EMPEZAR" y los controles.
- [ ] Antes de empezar, el HUD muestra 0 puntos, `♥♥♥`, nivel 01 y Aliens 55.
- [ ] Pulsar Espacio (o hacer click en el CRT) inicia la partida con la formación de 5×11 arriba, 4 escudos y el cañón al centro; ese Espacio no dispara.
- [ ] `←` `→` y `A` `D` mueven el cañón sin salir del área; la página no hace scroll con las flechas ni con Espacio.
- [ ] Espacio dispara una bala; mientras esa bala está en pantalla, otro Espacio no dispara.
- [ ] La formación marcha a pasos, baja al tocar un borde e invierte el sentido; se nota más rápida a medida que quedan menos aliens.
- [ ] Destruir un pulpo, un cangrejo y un calamar suma 10, 20 y 30 puntos, y Aliens baja en 1 cada vez.
- [ ] Las balas propias y alienígenas abren huecos en los escudos; los aliens que bajan sobre un escudo lo borran.
- [ ] Una bala propia que choca con una bala alienígena elimina ambas sin sumar puntos.
- [ ] La nave misteriosa cruza por arriba; derribarla con el disparo número 8 de la partida suma 300.
- [ ] Una bala alienígena que toca el cañón hace estallar el cañón, el HUD pierde un `♥` y, tras ~1 s, el cañón reaparece al centro con los puntos y la formación intactos.
- [ ] Al destruir el último alien se suma el bonus (100 en la oleada 1), el HUD pasa a nivel 02 y Aliens 55, y la nueva formación empieza 20 px más abajo con los escudos reconstruidos.
- [ ] Si un alien toca la línea del cañón, la partida termina aunque queden vidas: la formación parpadea en magenta y ~1 s después se abre FIN DEL JUEGO.
- [ ] Al perder la tercera vida, el cañón estalla y ~1 s después se abre FIN DEL JUEGO con la puntuación del HUD; el canvas no dibuja "GAME OVER" ni ningún texto.
- [ ] El modal muestra GUARDAR PUNTUACIÓN (no "MODO DEMO — NO PUNTÚA"); al guardar muestra `▸ PUNTUACIÓN GUARDADA_` y VER SALÓN DE LA FAMA.
- [ ] Tras guardar, `/salon-de-la-fama?juego=invasores` y `/juegos/invasores` muestran la marca (top, MEJOR GLOBAL y PARTIDAS) sin recargar a mano.
- [ ] `public.games` tiene `invasores` con `playable = true` y `npx supabase migration list` muestra `playable_invasores` aplicada en local y remoto.
- [ ] El detalle `/juegos/invasores` muestra el texto nuevo y la tarjeta de la biblioteca muestra 17.500 como mejor marca.
- [ ] FIN a mitad de partida abre el modal con la puntuación actual.
- [ ] JUGAR DE NUEVO deja el HUD en 0 / `♥♥♥` / 01 / Aliens 55 y muestra de nuevo "PULSA ESPACIO PARA EMPEZAR".
- [ ] PAUSA, `P` y `Escape` congelan y reanudan la formación y las balas sin saltos; cambiar de pestaña deja la partida en pausa.
- [ ] Con el juego en pausa, Espacio no dispara y las flechas no mueven el cañón al reanudar.
- [ ] Ir a SALIR y volver a `/juegos/invasores/jugar` no duplica la velocidad de la formación, el movimiento del cañón ni los disparos.
- [ ] Aliens, cañón y celdas de escudo se ven nítidos con `devicePixelRatio` 2.
- [ ] `/juegos/rocas/jugar`, `/juegos/caida/jugar`, `/juegos/bloque-buster/jugar` y `/juegos/serpentina/jugar` siguen funcionando y `/juegos/gloton/jugar` sigue en MODO DEMO.
- [ ] `get_advisors` (security) no suma avisos.
- [ ] No hay errores ni warnings de hidratación en la consola en `/juegos/invasores/jugar`.

## Decisiones

- **Sí:** reusar la entrada `invasores` del catálogo. Ya es un SHOOTER de filas alienígenas con portada `cover-invaders` y fila en `public.games`.
- **No:** id nuevo `space-invaders`. Obliga a otra entrada, otra portada y una migración `insert`, y deja INVASORES como demo duplicada.
- **Sí:** persistir con `update public.games set playable = true where id = 'invasores'`, igual que `caida`, `bloque-buster` y `serpentina`. La fila `('invasores', 'INVASORES', false)` ya existe desde `20261028030700_games_scores.sql`; con `playable = true`, `submit_score` acepta sus puntuaciones y `get_leaderboard` las devuelve.
- **No:** `insert` en `public.games`. Chocaría con la clave primaria `id` porque la fila ya existe.
- **Sí:** Space Invaders clásico para el tema. Es el shooter fijo más reconocible, encaja en canvas 2D, teclado y un jugador, y equilibra el catálogo jugable (hoy un solo SHOOTER, ROCAS, y ningún verde de dificultad 3).
- **Sí:** formación de 5×11 con marcha por pasos y aceleración por vivos. Es la tensión central del original.
- **No:** movimiento continuo de la formación. Pierde el ritmo de la marcha y el frame alterno.
- **Sí:** oleadas infinitas, cada una 20 px más abajo (hasta la 7) y hasta un 40 % más rápida (desde la 9). Dan techo alto sin contenido nuevo.
- **No:** un número fijo de oleadas con victoria. Corta la competencia por la marca.
- **Sí:** 3 vidas y fin inmediato por invasión aunque queden vidas, como el original y el brief.
- **No:** vida extra a los 1.500 puntos. Complica el HUD sin cambiar la competencia; queda para otra spec.
- **Sí:** escudos por celdas de 4×4 con impacto en cruz de 5 celdas. Mantiene el desgaste visible con 320 celdas en un `Uint8Array`.
- **No:** daño por píxel. Exige leer el canvas o máscaras de 1 px en el motor.
- **Sí:** nave misteriosa con tabla fija de 15 valores indexada por disparos. Premia al jugador experto que cuenta disparos, como el original, y es determinista.
- **No:** valor al azar. Quita una habilidad que los jugadores de Space Invaders conocen.
- **Sí:** puntos fijos 10/20/30 sin multiplicar por oleada y bonus de `100 × min(oleada, 10)`. La progresión de puntos sale de durar más oleadas.
- **No:** `puntos × oleada`. Infla la marca y desequilibra las primeras oleadas frente a las tardías.
- **Sí:** 1 bala propia y hasta 3 alienígenas, con cadencia de 1,2 s a 0,35 s y 50 % de disparos apuntados. Presión creciente sin volverse injusta.
- **Sí:** el nivel del HUD es la oleada y la celda extra es "Aliens" con los vivos, siempre visible.
- **No:** celda extra "OLEADA". Repite el nivel que ya muestra el HUD.
- **Sí:** Espacio sin repetición y `fire` descartado con la bala en vuelo. Evita disparos fantasma en cuanto la bala se va.
- **Sí:** tope de 10.000.000 con fin de partida (`end = "max"`). Las oleadas son infinitas y la RPC rechaza más.
- **Sí:** animación de fin distinta según `end` y campo `end` en `InvadersStats`, sin texto en canvas y sin tocar `PlayableGameStats`.
- **No:** sonido. No hay audio de referencia; queda para otra spec.
- **Sí:** sprites como bitmaps de datos dibujados con `fillRect`. Pixel art nítido sin cargar imágenes ni esperar `onload`.
- **No:** PNG de sprites. No hay assets y obligaría a cargar y esperar imágenes.
- **Sí:** arrays planos de tamaño fijo y subpasos de 4 px para las balas. Sin GC por frame y sin balas que atraviesen celdas de 4 px.
- **Sí:** reescribir el `long` y bajar `best` a 17500 (unas 10 oleadas), una marca exigente pero alcanzable.
- **Sí:** mantener `short`, `cover-invaders`, `cat: "SHOOTER"`, `color: "green"` y `difficulty: 3`.
- **Sí:** `rng` inyectable en el motor (por defecto `Math.random`), para reproducir partidas al depurar el balance.
- **Sí:** habilitar el leaderboard con una migración de datos. Las funciones y pantallas de SPEC 06 ya son genéricas.
- **No:** regenerar `database.types.ts`. No cambia el esquema.
- **Sí:** motor sin DOM en `lib/invaders/` y Client Component, como ROCAS. Permite limpiar loop y listeners al navegar.
- **No:** la variante B (marea continua sin escudos con multiplicador por racha). Se aparta del brief; queda como alternativa.

## Riesgos

| Riesgo                                                                                 | Mitigación                                                                                                                          |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Loops rAF o listeners que sobreviven al desmontar (Strict Mode monta dos veces en dev) | Cleanup completo en cada `useEffect`; el criterio de SALIR y volver lo detecta.                                                     |
| `onStats` en cada frame re-renderiza el HUD                                            | El motor solo emite cuando cambia `score`, `lives`, `wave`, `aliensLeft`, `status` o `end`.                                         |
| Espacio activa el botón con foco (PAUSA, SALIR) en lugar de disparar                   | `preventDefault` en `keydown` y `keyup` de las teclas capturadas; el inicio por click quita el foco de los botones.                 |
| El Espacio de inicio dispara                                                           | La pantalla de inicio consume ese Espacio sin encolar `fire` (criterio explícito).                                                  |
| Las teclas capturadas bloquean escribir en el input del modal (A, D, flechas)          | Con `paused` no se capturan teclas.                                                                                                 |
| `dt` enorme al reanudar hace saltar la formación varios pasos                          | Se reinicia el timestamp al reanudar y `dt` se capa a 50 ms.                                                                        |
| Balas que atraviesan celdas de escudo de 4 px (30 px por frame a 600 px/s)             | Subpasos de como mucho 4 px por bala en cada `update`.                                                                              |
| GC por frame con 55 aliens, 320 celdas y balas                                         | Arrays tipados de tamaño fijo creados en el constructor; `update` no crea objetos (verificado con `grep` en el paso 2).             |
| Cadencia alienígena injusta en oleadas altas                                           | Tope de 3 balas, intervalo mínimo de 0,35 s, velocidad máxima de 360 px/s y `rng` inyectable para probar oleadas altas con semilla. |
| Varios pasos por frame con 1 alien vivo (intervalo de 0,024 s) saltan el borde         | Cada paso comprueba el borde antes de moverse; el bucle da los pasos de a uno.                                                      |
| Invasión no detectada si el alien baja sobre un escudo                                 | El borrado de escudo y la comprobación de invasión corren tras cada paso.                                                           |
| `playable` de `invasores` y `PLAYABLE_GAMES` desincronizados                           | Componente y migración llegan en esta spec; si la DB rechaza, el modal muestra el error de guardado.                                |
| Puntuación 0 al perder sin destruir aliens                                             | El modal ya muestra "SIN PUNTOS PARA GUARDAR" (SPEC 06).                                                                            |

## Lo que **no** entra en esta spec

- Sonido.
- Vida extra, números flotantes y tipos de rayo alienígena distintos.
- Daño de escudos por píxel.
- Controles táctiles, mouse y móvil.
- Cambios en `short`, portada, categoría o dificultad de `invasores`, en el contrato del registro o en `GamePlayer`.
- Tests automatizados.

Cada uno de esos, si llega, va en su propia spec.

# SPEC GAME-JAM invasores · Variante B — Juego real INVASORES (marea continua con racha) con leaderboard

> **Estado:** borrador
> **Depende de:** SPEC 05, SPEC 06
> **Fecha:** 2026-11-03
> **Tema:** INVASORES (Space Invaders)
> **Objetivo:** Crear desde cero un shooter de invasores con marea alienígena continua y multiplicador por racha en TypeScript, montarlo como juego jugable en `/juegos/invasores/jugar` y habilitar sus puntuaciones en Supabase.

## Por qué existe esta spec

El tema pide un Space Invaders, y el catálogo ya tiene un id simulado que lo describe: `invasores` (SHOOTER, green, portada `cover-invaders`).
Hoy `invasores` es una simulación: el modal muestra "MODO DEMO — NO PUNTÚA" y su pestaña del Salón está vacía.
No hay código de referencia en `references/started-games/`: el juego se escribe desde cero.

Esta variante conserva la identidad de INVASORES (cañón horizontal, una bala propia, filas alienígenas que marchan y disparan, nave misteriosa) pero cambia las reglas y la puntuación frente a la variante A:

- **Sin oleadas:** las filas bajan de forma continua y aparecen filas nuevas arriba sin parar, como una marea.
- **Sin escudos:** no hay dónde cubrirse; la defensa es disparar bien.
- **Una fila que llega abajo cuesta una vida** (y explota), en lugar de terminar la partida.
- **Multiplicador por racha:** cada 5 aciertos seguidos el multiplicador sube hasta ×8; un disparo fallado lo devuelve a ×1.
- **Nivel por tiempo:** cada 30 s la marea baja y marcha más rápido y los aliens disparan más seguido.

La variante A es la versión clásica del brief de `@game-planner`: oleadas discretas, escudos, puntos fijos y fin inmediato por invasión.

La SPEC 05 dejó el patrón motor + render + componente + `PLAYABLE_GAMES`, y la SPEC 06 dejó el leaderboard genérico por `game_id`.
Esta spec aplica ambos a `invasores` siguiendo `.claude/skills/nuevo-juego/contrato.md`.
El `long` actual del catálogo habla de "formación tras formación"; se reescribe para la marea y la racha.

## Alcance

**Entra:**

- Shooter de invasores escrito desde cero en TypeScript en `lib/invaders/`: sprites como datos, motor sin DOM y render separado.
- Jugabilidad:
  - Mundo de 800×600. Margen lateral de 16 px a cada lado para la marea y el cañón.
  - Cañón de 39×24 (bitmap 13×8 a escala 3) con su borde superior en `y = 536`, movido a 300 px/s y acotado a `16 ≤ x ≤ 745`.
  - Bala propia de 3×12 a 700 px/s hacia arriba; como mucho 1 en pantalla.
  - La marea es un conjunto de filas de 11 aliens de 33×24 (bitmaps 11×8 a escala 3), separados 48 px en horizontal (ancho 513 px). Todas las filas comparten la misma `x` de origen.
  - Tipos de fila: "calamar" 30 puntos base, "cangrejo" 20 y "pulpo" 10.
  - Al empezar hay 5 filas en `y = 60, 100, 140, 180, 220` con los tipos calamar, cangrejo, cangrejo, pulpo, pulpo (de arriba hacia abajo) y origen `x = 144`.
  - Cada vez que ninguna fila activa tiene `y < 100`, aparece una fila nueva completa en `y = 60`. Los tipos de las filas nuevas siguen el ciclo pulpo, pulpo, cangrejo, cangrejo, calamar.
  - Descenso continuo de todas las filas a `min(6 + 2 × (nivel − 1), 30)` px/s.
  - Marcha horizontal continua a `min(40 + 5 × (nivel − 1), 100)` px/s; invierte el sentido cuando el alien vivo más a la izquierda o más a la derecha toca el margen.
  - Nivel `= floor(t / 30) + 1`, con `t` los segundos jugados en `"playing"`. Los efectos topan en el nivel 13; el número sigue subiendo.
  - Disparos alienígenas: como mucho 4 en pantalla, de 3×12, a `min(260 + 10 × (nivel − 1), 380)` px/s, uno cada `max(0,3; 1 − 0,07 × (nivel − 1))` s. El primero sale 1,5 s después de empezar y tras cada golpe.
  - Nave misteriosa de 48×21 en `y = 20`, que cruza a 140 px/s cada 15–25 s.
  - Racha: cada acierto (alien o nave misteriosa) suma 1; un disparo que sale por arriba sin acertar la vuelve a 0. Multiplicador `= min(8, 1 + floor(racha / 5))`.
  - Puntos: alien `base × multiplicador`; vaciar una fila con un disparo propio suma además `50 × multiplicador`; nave misteriosa `150 × multiplicador`.
  - 3 vidas. Se pierde una cuando una bala alienígena toca el cañón o cuando una fila con aliens vivos llega a la línea del cañón (`y + 24 ≥ 536`); esa fila explota sin sumar puntos. Perder una vida también rompe la racha.
  - La partida termina al perder la tercera vida o al llegar a 10.000.000 puntos.
- Controles: `←` `→` y `A` `D` mueven el cañón; Espacio dispara.
- Render vectorial pixel art con la paleta neón de la plataforma, diseñado con `/frontend-design`, con el glow del cañón y la línea del suelo como indicadores de racha y de peligro.
- Client Component `components/games/invaders.tsx` (`InvadersCanvas`) registrado como `invasores` en `PLAYABLE_GAMES`.
- Pantalla de inicio "PULSA ESPACIO PARA EMPEZAR" con los controles y la regla de la racha.
- HUD de React: puntuación, vidas `♥`, nivel y celda extra "Racha" con el multiplicador (`×1` a `×8`).
- Pausa, fin, guardado y reinicio con los mecanismos existentes de `GamePlayer`.
- Migración `playable_invasores` que marca `invasores` como jugable en `public.games`.
- En `lib/games.ts`, para `invasores`: el `long` pasa a describir la marea y la racha, `best` pasa de 54190 a 30000 y `difficulty` de 3 a 4.

**Fuera de alcance (para specs futuras):**

- Escudos.
- Oleadas discretas y bonus por oleada.
- Sonido.
- Vida extra por puntos.
- Números flotantes con los puntos de cada acierto (texto en canvas).
- Filas con huecos, aliens con más de un impacto o power-ups.
- Controles táctiles, mouse y móvil.
- Cambios en `short`, la portada `cover-invaders`, la categoría o el color de `invasores`.
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
```

```ts
// lib/invaders/engine.ts — sin DOM: no usa window, document, requestAnimationFrame, Audio, Image ni React
export const WORLD_W = 800;
export const WORLD_H = 600;
export const MARGIN = 16;

export const COLS = 11;
export const MAX_ROWS = 13; // slots de fila: entre y = 60 y la línea caben como mucho 12 filas
export const ALIEN_W = 33;
export const ALIEN_H = 24;
export const COL_GAP = 48;
export const ROW_GAP = 40;
export const SPAWN_Y = 60;
export const SPAWN_GAP_Y = 100; // aparece una fila nueva cuando ninguna está por encima de esta y
export const KIND_POINTS: Record<AlienKind, number>; // { squid: 30, crab: 20, octopus: 10 }
export const START_KINDS: AlienKind[]; // ["squid", "crab", "crab", "octopus", "octopus"], de arriba hacia abajo
export const SPAWN_CYCLE: AlienKind[]; // ["octopus", "octopus", "crab", "crab", "squid"]
export const FRAME_TIME = 0.5; // s entre frames de animación de los aliens

export const CANNON_W = 39;
export const CANNON_H = 24;
export const CANNON_Y = 536; // también es la línea de ruptura
export const CANNON_SPEED = 300; // px/s

export const SHOT_W = 3;
export const SHOT_H = 12;
export const PLAYER_SHOT_SPEED = 700; // px/s
export const MAX_ALIEN_SHOTS = 4;

export const MYSTERY_Y = 20;
export const MYSTERY_W = 48;
export const MYSTERY_H = 21;
export const MYSTERY_SPEED = 140; // px/s
export const MYSTERY_POINTS = 150;
export const ROW_CLEAR_POINTS = 50;

export const LEVEL_TIME = 30; // s por nivel
export const STREAK_STEP = 5; // aciertos por cada +1 de multiplicador
export const MAX_MULT = 8;
export const LIVES = 3;
export const MAX_SCORE = 10_000_000;

export type InvadersInput = {
  left: boolean; // ← o A mantenida
  right: boolean; // → o D mantenida
  fire: boolean; // Espacio pulsado en este frame (se consume al leerlo)
};

export type InvadersStatus = "playing" | "hit" | "gameover";
export type InvadersEnd = "lives" | "max";

export type InvadersStats = {
  score: number;
  lives: number; // empieza en 3
  level: number; // empieza en 1
  mult: number; // 1–8
  status: InvadersStatus;
  end: InvadersEnd | null; // null hasta "gameover"
};

export class InvadersGame {
  cannonX: number; // borde izquierdo del cañón
  ox: number; // borde izquierdo de la columna 0, común a todas las filas
  dir: 1 | -1; // sentido de la marcha horizontal
  frame: 0 | 1; // frame de animación de los aliens
  rowActive: Uint8Array; // MAX_ROWS; 1 = slot en uso
  rowY: Float32Array; // MAX_ROWS; borde superior de cada fila
  rowKind: Uint8Array; // MAX_ROWS; 0 calamar, 1 cangrejo, 2 pulpo
  alive: Uint8Array; // MAX_ROWS × 11, índice slot × 11 + columna; 1 = vivo
  playerShot: Float32Array; // [x, y, activo]
  alienShots: Float32Array; // MAX_ALIEN_SHOTS × [x, y, activo]
  mystery: Float32Array; // [x, sentido, activo]
  explosions: Float32Array; // 16 × [x, y, t, tipo]; tipo 0 alien, 1 nave misteriosa, 2 cañón, 3 ruptura
  streak: number; // aciertos seguidos
  danger: number; // 0 → 1 según lo cerca que está la fila más baja de la línea; lo usa el render
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
// Calamar magenta #ff006e, cangrejo cian #00f5ff, pulpo verde #00ff88, balas alienígenas amarillo #f5ff00,
// nave misteriosa magenta con núcleo amarillo, línea del suelo en y = 568.
// Cañón: verde #00ff88 con ×1–×2, amarillo #f5ff00 con ×3–×5 y magenta #ff006e con ×6–×8; el glow crece con el multiplicador.
// Línea del suelo: de verde a magenta pulsante según danger. Píxeles de bitmap como fillRect de 3×3. Glow con shadowBlur.
// Tonos, pulso y glow definidos con /frontend-design.
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
- Sin asignaciones por frame en `update`: filas, aliens, balas y explosiones viven en `Uint8Array` / `Float32Array` de tamaño fijo creados en el constructor y se reutilizan por slot.
- Alien `(slot, col)`: esquina superior izquierda en `(ox + col × 48, rowY[slot])`.
- Marea, en cada `update` en `"playing"`:
  - `rowY[slot] += vy × dt` en todas las filas activas, con `vy = min(6 + 2 × (nivel − 1), 30)`.
  - `ox += vx × dt × dir`, con `vx = min(40 + 5 × (nivel − 1), 100)`. Si el alien vivo más a la derecha supera 784 o el más a la izquierda baja de 16, `ox` se corrige para que quede en el margen y `dir = −dir`. Sin aliens vivos, la referencia es el ancho completo de 513 px.
  - Un slot cuyos 11 aliens están muertos se libera en el acto.
  - Si ninguna fila activa tiene `y < 100`, se ocupa un slot libre con una fila completa en `y = 60` y tipo `SPAWN_CYCLE[n % 5]`, con `n` las filas nuevas creadas en la partida (empieza en 0).
  - `frame` alterna cada 0,5 s.
- Ruptura:
  - Una fila activa con algún alien vivo y `y + 24 ≥ 536` rompe la línea: sus aliens vivos pasan a explosiones de tipo 3, el slot se libera, `streak = 0` y se pierde 1 vida.
  - Con la separación de 40 px entre filas, como mucho rompe una fila por `update`.
- `danger = clamp((yMax + 24 − 376) / 160, 0, 1)`, con `yMax` la `y` de la fila activa con vivos más baja (0 sin filas).
- Nivel: `t` acumula `dt` solo en `"playing"`; `nivel = floor(t / 30) + 1`. Velocidades y cadencia se recalculan con el nivel en cada `update`.
- Cañón: `cannonX += 300 × dt × (right − left)`, acotado a `[16, 745]`. Al reaparecer vuelve a `x = 380,5`.
- Bala propia:
  - `fire` en `"playing"` con la bala inactiva la crea en `(cannonX + 18, 524)`. Con la bala activa, `fire` se descarta (no se guarda).
  - Se mueve en subpasos de como mucho 8 px. En cada subpaso prueba, en este orden: bala alienígena, alien, nave misteriosa.
  - Si sale por arriba (`y + 12 < 0`) sin acertar: `streak = 0`.
- Acierto (alien o nave misteriosa), en este orden:
  - `streak += 1`; `mult = min(8, 1 + floor(streak / 5))`.
  - Alien: `score += KIND_POINTS[tipo] × mult`; si con ese disparo la fila queda vacía, además `score += 50 × mult`.
  - Nave misteriosa: `score += 150 × mult`.
  - El alien o la nave deja una explosión de 0,25 s y la bala se elimina.
- Bala propia contra bala alienígena: AABB; ambas desaparecen, sin puntos y sin cambiar la racha. Todas las balas avanzan en subpasos intercalados de como mucho 8 px (un subpaso de cada una por vuelta), para que dos balas enfrentadas no se crucen sin tocarse.
- Disparos alienígenas:
  - Un temporizador dispara cada `max(0,3; 1 − 0,07 × (nivel − 1))` s. Si los 4 slots están ocupados, ese disparo se pierde.
  - Columna: con `rng() < 0,5`, la columna con vivos cuyo centro está más cerca del centro del cañón; si no, una columna con vivos al azar uniforme.
  - Sale del centro inferior del alien vivo más bajo de esa columna (entre todas las filas), a `min(260 + 10 × (nivel − 1), 380)` px/s hacia abajo.
  - Prueba contra el cañón por AABB. Sale de pantalla con `y > 600`.
- Nave misteriosa:
  - Temporizador de `15 + rng() × 10` s que solo corre en `"playing"`. Al vencer aparece fuera de pantalla (`x = −48` hacia la derecha o `x = 800` hacia la izquierda, alternando y empezando hacia la derecha).
  - Al salir por el otro lado desaparece sin romper la racha y se reinicia el temporizador.
- Pérdida de vida (bala en el cañón o ruptura):
  - `lives −= 1` y `streak = 0` en el acto.
  - Si quedan vidas: `"hit"` durante 1 s (`hitT` de 0 a 1), con la marea, la nave misteriosa, `t` y los temporizadores congelados. Al terminar, el cañón vuelve al centro, se vacían las balas, el temporizador de disparo alienígena vuelve a 1,5 s y se pasa a `"playing"`.
  - Si era la última vida: `status = "gameover"`, `end = "lives"`.
- Puntuación: cada suma se acota a `MAX_SCORE`; al llegar a 10.000.000, `status = "gameover"` y `end = "max"`.
- La partida empieza directamente en `"playing"`. El Espacio o click de la pantalla de inicio no encola `fire`.
- Tras `"gameover"`, `update` solo avanza `endT` (en 1 s) y las explosiones; ignora el input.
- Animación de fin dibujada por el render según `end` y `endT`, sin texto:
  - `"lives"`: el cañón estalla en esquirlas y la marea se apaga de abajo hacia arriba.
  - `"max"`: los bordes del área parpadean en verde `#00ff88`.
- El HUD recibe `{ score, lives, level, extra: { label: "Racha", value: "×" + mult } }`; la celda extra está siempre visible.
- Controles:
  - `←` `→` y `A` `D` (mayúsculas o minúsculas) se capturan mientras se mantienen.
  - Espacio (sin `e.repeat`) encola `fire`.
  - `preventDefault` de esas teclas en `keydown` y `keyup`.
- El modal se abre 1 s después de pasar a `"gameover"`; la puntuación final es la acumulada.
- El juego no escucha `P` ni `Escape`: la pausa es del reproductor.
- Con `paused`, los listeners no capturan teclas ni hacen `preventDefault`, y `fire` pendiente y las teclas mantenidas se descartan.
- Rango de puntuación:
  - Entran como mucho `30 / 40 = 0,75` filas por segundo (11 aliens): ≤ 8,25 aliens/s.
  - Por alien, como mucho `30 × 8 = 240`; por fila vaciada, `50 × 8 = 400`; nave misteriosa, `150 × 8 = 1.200` cada 15 s.
  - Techo de ritmo: `8,25 × 240 + 0,75 × 400 + 1.200 / 15 ≈ 2.360` puntos/s. Llegar a 10.000.000 exige más de 70 minutos de partida perfecta en el nivel 13 o más.
  - Como la marea es infinita, el motor acota igual en 10.000.000 y termina la partida.
  - La puntuación enviada es entera y está entre 1 y 10.000.000 de `submit_score`.
- `playable` de `invasores` en la DB y su entrada en `PLAYABLE_GAMES` llegan juntos en esta spec.

## Plan de implementación

1. Crear `lib/invaders/sprites.ts` con `AlienKind`, `PX`, los 6 bitmaps de alien (3 tipos × 2 frames), el cañón y la nave misteriosa. Verificar con `npx tsc --noEmit` que cada bitmap tiene el ancho y alto declarados.
2. Crear `lib/invaders/engine.ts` con `InvadersGame`:
   - Constantes, slots de fila y arrays de tamaño fijo; 5 filas iniciales.
   - Descenso y marcha continuos, aparición de filas, liberación de filas vacías y ruptura.
   - Nivel por tiempo y velocidades, cadencia y descenso según el nivel.
   - Cañón, bala propia con subpasos, racha, multiplicador, puntos por alien, fila vaciada y nave misteriosa.
   - Disparos alienígenas apuntados o al azar, choque entre balas.
   - Vidas, `"hit"`, fin por vidas o tope, `danger`, `hitT`, `endT`, explosiones y `onStats` solo al cambiar un campo.
   - Verificar con `npx tsc --noEmit` y con `grep` que no hay `window`, `document`, `requestAnimationFrame`, `Audio`, `Image` ni React, y que `update` no usa `new`, literales de array ni de objeto.
3. Crear `lib/invaders/render.ts`:
   - Fondo, línea del suelo según `danger`, filas de aliens con su frame, cañón con color y glow según el multiplicador, balas, nave misteriosa y explosiones.
   - Parpadeo del cañón en `"hit"` y animación de fin según `end`.
   - Sin HUD ni textos.
   - Usar `/frontend-design` para los tonos por tipo, los tres estados del cañón, el pulso de peligro, la explosión de ruptura y el glow.
4. Crear `components/games/invaders.tsx` (`InvadersCanvas`) copiando la estructura de `components/games/asteroids.tsx` (sección 6 de `.claude/skills/nuevo-juego/contrato.md`):
   - Canvas 800×600 con `devicePixelRatio`.
   - Loop rAF con `dt` capado a 50 ms que se detiene con `paused`.
   - `←` `→` `A` `D` mantenidas y Espacio para disparar, con `preventDefault` en `keydown` y `keyup`.
   - Overlay de inicio "PULSA ESPACIO PARA EMPEZAR" con los controles (`←` `→` / `A` `D` mover, Espacio disparar, `P` pausa) y la regla "5 aciertos seguidos suben la racha; fallar la rompe". Diseñado con `/frontend-design`.
   - `onStats` traducido al HUD y `onGameOver` con 1 s de retraso.
   - Limpieza de rAF, listeners y timeout al desmontar.
5. Registrar `InvadersCanvas` como `invasores` en `components/games/registry.ts`.
6. En `lib/games.ts`, para `invasores`: cambiar el `long` a "Una marea infinita de pixeles hostiles desciende sin pausa y cada medio minuto aprieta el paso. Encadena impactos para multiplicar tus puntos hasta ×8: un disparo fallado rompe la racha. Si una fila toca la superficie, pierdes una vida.", `best` de 54190 a 30000 y `difficulty` de 3 a 4.
7. Crear la migración con `npm run db:new -- playable_invasores` y aplicarla con `npm run db:push`. Antes, consultar en `node_modules/next/dist/docs/` si algún paso toca APIs de Next (el registro y la página `/juegos/[id]/jugar` ya existen). Verificar con `execute_sql` que `submit_score('invasores','TEST',100)` inserta y que `get_leaderboard('invasores')` la devuelve. Borrar la fila de prueba.
8. Probar en `npm run dev` con Playwright (sección 9 de `contrato.md`):
   - `/juegos/invasores/jugar`: inicio, movimiento, disparo único, puntos por tipo, racha y multiplicador, fallo que rompe la racha, fila vaciada, nave misteriosa, aparición de filas, ruptura, golpe al cañón, cambio de nivel a los 30 s, pausa, fin, guardar, Salón, JUGAR DE NUEVO, SALIR y volver.
   - `/salon-de-la-fama?juego=invasores` y `/juegos/invasores` con la marca guardada.
   - `/juegos/rocas/jugar`, `/juegos/caida/jugar`, `/juegos/bloque-buster/jugar` y `/juegos/serpentina/jugar` intactos y `/juegos/gloton/jugar` en MODO DEMO.
   - Revisar la consola.
9. Correr `npm run lint`, `npx tsc --noEmit`, `npm run build` y `get_advisors` (security) del MCP.

## Criterios de aceptación

- [ ] `npm run lint`, `npx tsc --noEmit` y `npm run build` terminan sin errores.
- [ ] Ningún archivo de `lib/invaders/` referencia `window`, `document`, `requestAnimationFrame`, `Audio`, `Image` ni React.
- [ ] Cada bitmap de `lib/invaders/sprites.ts` tiene las medidas declaradas.
- [ ] `/juegos/invasores/jugar` muestra un canvas dentro del CRT con el overlay "PULSA ESPACIO PARA EMPEZAR", los controles y la regla de la racha.
- [ ] Antes de empezar, el HUD muestra 0 puntos, `♥♥♥`, nivel 01 y Racha ×1.
- [ ] Pulsar Espacio (o hacer click en el CRT) inicia la partida con 5 filas arriba, sin escudos, y el cañón al centro; ese Espacio no dispara.
- [ ] `←` `→` y `A` `D` mueven el cañón sin salir del área; la página no hace scroll con las flechas ni con Espacio.
- [ ] Espacio dispara una bala; mientras esa bala está en pantalla, otro Espacio no dispara.
- [ ] La marea baja de forma continua y marcha de lado a lado; cuando la fila más alta pasa `y = 100` aparece una fila nueva arriba.
- [ ] Con Racha ×1, destruir un pulpo, un cangrejo y un calamar suma 10, 20 y 30 puntos.
- [ ] Al 5.º acierto seguido el HUD pasa a Racha ×2 y los aciertos siguientes valen el doble; nunca pasa de ×8.
- [ ] Un disparo que sale por arriba sin acertar devuelve la Racha a ×1.
- [ ] Vaciar una fila con un disparo suma además `50 × multiplicador`.
- [ ] La nave misteriosa cruza por arriba y derribarla suma `150 × multiplicador` y cuenta como acierto.
- [ ] Una bala propia que choca con una bala alienígena elimina ambas sin sumar puntos ni cambiar la Racha.
- [ ] Una bala alienígena que toca el cañón lo hace estallar, el HUD pierde un `♥`, la Racha vuelve a ×1 y, tras ~1 s, el cañón reaparece al centro.
- [ ] Cuando una fila con aliens vivos llega a la línea del cañón, la fila explota sin sumar puntos, el HUD pierde un `♥` y la Racha vuelve a ×1; la partida sigue si quedan vidas.
- [ ] La línea del suelo cambia de verde a magenta pulsante a medida que la fila más baja se acerca.
- [ ] A los 30 s de juego el HUD pasa a nivel 02 y la marea baja y marcha visiblemente más rápido.
- [ ] Al perder la tercera vida, el cañón estalla, la marea se apaga y ~1 s después se abre FIN DEL JUEGO con la puntuación del HUD; el canvas no dibuja "GAME OVER" ni ningún texto.
- [ ] El modal muestra GUARDAR PUNTUACIÓN (no "MODO DEMO — NO PUNTÚA"); al guardar muestra `▸ PUNTUACIÓN GUARDADA_` y VER SALÓN DE LA FAMA.
- [ ] Tras guardar, `/salon-de-la-fama?juego=invasores` y `/juegos/invasores` muestran la marca (top, MEJOR GLOBAL y PARTIDAS) sin recargar a mano.
- [ ] `public.games` tiene `invasores` con `playable = true` y `npx supabase migration list` muestra `playable_invasores` aplicada en local y remoto.
- [ ] El detalle `/juegos/invasores` muestra el texto nuevo y 4 estrellas de dificultad, y la tarjeta de la biblioteca muestra 30.000 como mejor marca.
- [ ] FIN a mitad de partida abre el modal con la puntuación actual.
- [ ] JUGAR DE NUEVO deja el HUD en 0 / `♥♥♥` / 01 / Racha ×1 y muestra de nuevo "PULSA ESPACIO PARA EMPEZAR".
- [ ] PAUSA, `P` y `Escape` congelan y reanudan la marea, las balas y el reloj de nivel sin saltos; cambiar de pestaña deja la partida en pausa.
- [ ] Con el juego en pausa, Espacio no dispara y las flechas no mueven el cañón al reanudar.
- [ ] Ir a SALIR y volver a `/juegos/invasores/jugar` no duplica la velocidad de la marea, el movimiento del cañón ni los disparos.
- [ ] Aliens y cañón se ven nítidos con `devicePixelRatio` 2.
- [ ] `/juegos/rocas/jugar`, `/juegos/caida/jugar`, `/juegos/bloque-buster/jugar` y `/juegos/serpentina/jugar` siguen funcionando y `/juegos/gloton/jugar` sigue en MODO DEMO.
- [ ] `get_advisors` (security) no suma avisos.
- [ ] No hay errores ni warnings de hidratación en la consola en `/juegos/invasores/jugar`.

## Decisiones

- **Sí:** reusar la entrada `invasores` del catálogo. Ya es un SHOOTER de filas alienígenas con portada `cover-invaders` y fila en `public.games`.
- **No:** id nuevo `marea-invasora`. Obliga a otra entrada, otra portada y una migración `insert`, y deja INVASORES como demo duplicada.
- **Sí:** persistir con `update public.games set playable = true where id = 'invasores'`, igual que `caida`, `bloque-buster` y `serpentina`. La fila `('invasores', 'INVASORES', false)` ya existe desde `20261028030700_games_scores.sql`; con `playable = true`, `submit_score` acepta sus puntuaciones y `get_leaderboard` las devuelve.
- **No:** `insert` en `public.games`. Chocaría con la clave primaria `id` porque la fila ya existe.
- **Sí:** marea continua de filas que aparecen arriba sin oleadas. Mantiene la presión constante y da partidas que escalan solas, sin pausas entre oleadas.
- **No:** marcha por pasos con bajada al borde. Con filas que entran sin parar, la bajada por borde haría saltos de 20 px imprevisibles en toda la marea.
- **Sí:** sin escudos. Sin cobertura, el eje del juego es la precisión, que es lo que premia la racha; además elimina el riesgo del daño por celdas.
- **No:** escudos por celdas como en la variante A.
- **Sí:** una fila que rompe la línea cuesta una vida y explota, en lugar de terminar la partida. Con la marea infinita, el fin inmediato castigaría demasiado un solo descuido.
- **Sí:** multiplicador `min(8, 1 + floor(racha / 5))` que vuelve a ×1 al fallar o al perder una vida. Separa al jugador preciso del que dispara a ciegas y hace que cada disparo importe.
- **No:** multiplicador por tiempo sin fallar. Premia esperar sin disparar, al revés de lo que se busca.
- **No:** multiplicador por oleada como en un shooter clásico. No hay oleadas.
- **Sí:** bonus de `50 × multiplicador` por vaciar una fila. Premia limpiar filas enteras antes que picar las de abajo.
- **Sí:** nave misteriosa de valor fijo `150 × multiplicador`. Con la racha, el valor ya depende de la habilidad; no hace falta tabla por disparos.
- **No:** tabla de 15 valores indexada por disparos. Se suma a la racha y confunde qué premia el juego.
- **Sí:** nivel cada 30 s de juego, con descenso de 6 a 30 px/s, marcha de 40 a 100 px/s y cadencia de 1 s a 0,3 s, topados en el nivel 13. Sin oleadas, el tiempo es la medida natural de la presión.
- **No:** nivel por aliens destruidos. Haría que matar menos sea más fácil.
- **Sí:** 1 bala propia a 700 px/s (más rápida que en la variante A). Sin escudos, el jugador necesita acertar a la fila de abajo antes de que dispare.
- **Sí:** celda extra "Racha" con el multiplicador `×1`–`×8`, siempre visible. Es el dato que define cuánto vale el próximo acierto.
- **No:** mostrar el contador de aciertos. Cambia en cada acierto y re-renderiza el HUD sin aportar más que el multiplicador.
- **Sí:** color y glow del cañón según el multiplicador y línea del suelo según `danger`. Dan la información sin texto en canvas.
- **Sí:** `difficulty` de 3 a 4. Sin escudos, con marea continua y racha frágil, es más exigente que un Space Invaders clásico.
- **Sí:** reescribir el `long` y bajar `best` a 30000 (unos 4 minutos con racha media ×3), una marca exigente pero alcanzable.
- **Sí:** mantener `short`, `cover-invaders`, `cat: "SHOOTER"` y `color: "green"`.
- **Sí:** tope de 10.000.000 con fin de partida (`end = "max"`). La marea es infinita y la RPC rechaza más.
- **No:** sonido. No hay audio de referencia; queda para otra spec.
- **Sí:** sprites como bitmaps de datos dibujados con `fillRect`. Pixel art nítido sin cargar imágenes.
- **Sí:** slots de fila en arrays tipados de tamaño fijo y subpasos de 8 px para la bala propia. Sin GC por frame y sin balas que atraviesen un alien de 24 px de alto.
- **Sí:** `rng` inyectable en el motor (por defecto `Math.random`), para reproducir partidas al depurar el balance.
- **Sí:** habilitar el leaderboard con una migración de datos. Las funciones y pantallas de SPEC 06 ya son genéricas.
- **No:** regenerar `database.types.ts`. No cambia el esquema.
- **Sí:** motor sin DOM en `lib/invaders/` y Client Component, como ROCAS. Permite limpiar loop y listeners al navegar.
- **No:** la variante A (oleadas clásicas con escudos y fin por invasión). Es la versión fiel al brief; esta explora otra forma de competir.

## Riesgos

| Riesgo                                                                                 | Mitigación                                                                                                                                |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Loops rAF o listeners que sobreviven al desmontar (Strict Mode monta dos veces en dev) | Cleanup completo en cada `useEffect`; el criterio de SALIR y volver lo detecta.                                                           |
| `onStats` en cada frame re-renderiza el HUD                                            | El motor solo emite cuando cambia `score`, `lives`, `level`, `mult`, `status` o `end`; la racha interna no se emite.                      |
| Espacio activa el botón con foco (PAUSA, SALIR) en lugar de disparar                   | `preventDefault` en `keydown` y `keyup` de las teclas capturadas; el inicio por click quita el foco de los botones.                       |
| El Espacio de inicio dispara                                                           | La pantalla de inicio consume ese Espacio sin encolar `fire` (criterio explícito).                                                        |
| Las teclas capturadas bloquean escribir en el input del modal (A, D, flechas)          | Con `paused` no se capturan teclas.                                                                                                       |
| `dt` enorme al reanudar hace saltar la marea o el reloj de nivel                       | Se reinicia el timestamp al reanudar y `dt` se capa a 50 ms; `t` solo corre en `"playing"`.                                               |
| Balance de la marea: demasiado lenta aburre, demasiado rápida es injusta               | Velocidades y cadencia topadas en el nivel 13; `rng` inyectable para probar niveles altos con semilla; `best` revisable tras las pruebas. |
| La racha se rompe por balas que chocan con balas alienígenas                           | El choque entre balas no cuenta como fallo (convención y criterio explícitos).                                                            |
| Slots de fila agotados                                                                 | Entre `y = 60` y la línea caben 12 filas con 40 px de separación; hay 13 slots y las filas vacías se liberan en el acto.                  |
| GC por frame con hasta 143 aliens y balas                                              | Arrays tipados de tamaño fijo creados en el constructor; `update` no crea objetos (verificado con `grep` en el paso 2).                   |
| Partidas muy largas en jugadores expertos                                              | La presión topa en el nivel 13 con 30 px/s de descenso y disparos cada 0,3 s; la ruptura cuesta vidas y la racha se rompe al perder una.  |
| `playable` de `invasores` y `PLAYABLE_GAMES` desincronizados                           | Componente y migración llegan en esta spec; si la DB rechaza, el modal muestra el error de guardado.                                      |
| Puntuación 0 al perder sin acertar                                                     | El modal ya muestra "SIN PUNTOS PARA GUARDAR" (SPEC 06).                                                                                  |

## Lo que **no** entra en esta spec

- Escudos, oleadas discretas y bonus por oleada.
- Sonido.
- Vida extra, números flotantes, filas con huecos, aliens resistentes y power-ups.
- Controles táctiles, mouse y móvil.
- Cambios en `short`, portada, categoría o color de `invasores`, en el contrato del registro o en `GamePlayer`.
- Tests automatizados.

Cada uno de esos, si llega, va en su propia spec.

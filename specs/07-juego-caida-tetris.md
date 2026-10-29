# SPEC 07 — Juego real CAÍDA (port de Tetris) con leaderboard

> **Estado:** aprobado
> **Depende de:** SPEC 05, SPEC 06
> **Fecha:** 2026-10-29
> **Objetivo:** Portar el Tetris de `references/started-games/03-tetris/` a TypeScript, montarlo como juego jugable en `/juegos/caida/jugar` y habilitar sus puntuaciones en Supabase.

## Por qué existe esta spec

Hoy `caida` es una simulación: el modal muestra "MODO DEMO — NO PUNTÚA" y su pestaña del Salón está vacía.
`references/started-games/03-tetris/` trae un Tetris completo en canvas puro (`game.js`, ~330 líneas, globals, listeners en `document` y un panel HTML de SCORE / LINES / LEVEL / NEXT).
La SPEC 05 dejó el patrón motor + render + componente + `PLAYABLE_GAMES`, y la SPEC 06 dejó el leaderboard genérico por `game_id`.
Esta spec aplica ambos a `caida` siguiendo `.claude/skills/nuevo-juego/contrato.md`.
La descripción de `caida` en el catálogo ("la velocidad aumenta sin piedad cada 10 líneas") ya coincide con las reglas del original.
`game.js` incluye una 8ª pieza "tuerca" (anillo 3×3) que el README no menciona; esta spec la quita.

## Alcance

**Entra:**

- Port de `game.js` a TypeScript en `lib/tetris/`: piezas y constantes, motor sin DOM y render separado.
- Misma jugabilidad que `game.js` con las 7 piezas estándar (I, O, T, S, Z, J, L):
  - Tablero de 10×20, pieza nueva centrada en la fila 0 y elegida al azar uniforme entre las 7.
  - Rotación horaria con _wall kicks_ `[0, -1, 1, -2, 2]`.
  - Puntos por líneas `[0, 100, 300, 500, 800] × nivel`, +1 por fila de caída suave y +2 por celda de caída instantánea.
  - `nivel = floor(líneas / 10) + 1` y caída automática cada `max(100, 1000 − (nivel − 1) × 90)` ms.
  - Bloqueo inmediato sin retardo, tanto por gravedad como con `↓` contra el fondo.
  - Pieza fantasma.
  - Fin cuando la pieza nueva aparece sobre bloques.
- Render con la paleta neón de la plataforma y 7 tonos distintos por pieza, diseñado con `/frontend-design`.
- Mundo lógico de 800×600 con celdas de 28 px: tablero de 280×560 centrado y panel "SIGUIENTE" dibujado en canvas a su derecha.
- Animación de fin: las filas del tablero se apagan a gris de abajo hacia arriba durante el segundo previo al modal.
- Client Component `components/games/tetris.tsx` (`TetrisCanvas`) registrado como `caida` en `PLAYABLE_GAMES`.
- Pantalla de inicio "PULSA ESPACIO PARA EMPEZAR" con los controles.
- HUD de React: puntuación, vidas `—`, nivel y celda extra "Líneas" siempre visible.
- Pausa, fin, guardado y reinicio con los mecanismos existentes de `GamePlayer`.
- Migración `playable_caida` que marca `caida` como jugable en `public.games`.

**Fuera de alcance (para specs futuras):**

- La pieza "tuerca" de `game.js`.
- Selector de tema claro/oscuro y su clave `tetris-theme` en `localStorage`.
- Pausa propia, overlay de PAUSA / GAME OVER y botón Reiniciar de la referencia.
- Repetición de teclas propia (DAS/ARR): se usa la del sistema operativo.
- _Hold_, bolsa de 7, _lock delay_, _T-spins_ y combos.
- Controles táctiles y móvil.
- Sonido.
- Cambios en `lib/games.ts` (texto, portada o `difficulty`) para `caida`.
- Cambios en `submit_score`, `get_leaderboard`, el Salón o el detalle (ya genéricos desde SPEC 06).
- Cambios en `PlayableGameStats` o en `GamePlayer`.
- Tests automatizados.

## Modelo de datos

```ts
// lib/tetris/pieces.ts — sin DOM
export const COLS = 10;
export const ROWS = 20;
export type PieceType = 1 | 2 | 3 | 4 | 5 | 6 | 7; // I, O, T, S, Z, J, L (índice de color)
export type Cell = 0 | PieceType; // 0 = vacía
export type Shape = Cell[][];
export type Piece = { type: PieceType; shape: Shape; x: number; y: number };
export const LINE_SCORES = [0, 100, 300, 500, 800];
export function randomPiece(): Piece;
export function rotateCW(shape: Shape): Shape;
```

```ts
// lib/tetris/engine.ts — sin DOM: no usa window, document, requestAnimationFrame ni React
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

export class TetrisGame {
  board: Cell[][]; // ROWS × COLS
  current: Piece;
  next: Piece;
  fade: number; // 0 → 1 durante el segundo posterior a "gameover"; lo usa el render
  constructor(onStats: (stats: TetrisStats) => void); // emite al crear y solo cuando cambia un campo
  update(dt: number, input: TetrisInput): void; // dt en segundos, capado a 0,05 por el llamador
  ghostY(): number;
  getStats(): TetrisStats;
}
```

```ts
// lib/tetris/render.ts
export function drawTetris(
  ctx: CanvasRenderingContext2D,
  game: TetrisGame,
  labelFont: string, // font-family pixel resuelta por el componente
): void;
// CELL = 28, tablero en (260, 20), panel SIGUIENTE a la derecha del tablero.
// 7 tonos neón: cian #00f5ff, magenta #ff006e, amarillo #f5ff00, verde #00ff88 + 3 derivados
// definidos con /frontend-design. Glow con shadowBlur. Fantasma con alpha 0,2.
```

```ts
// components/games/registry.ts
export const PLAYABLE_GAMES = { rocas: AsteroidsCanvas, caida: TetrisCanvas };
```

```sql
-- supabase/migrations/<timestamp>_playable_caida.sql
update public.games set playable = true where id = 'caida';
```

Convenciones:

- `lib/tetris/` es TypeScript puro y no importa React; todo lo que toca el DOM vive en `components/games/tetris.tsx`.
- El HUD recibe `{ score, lives: 0, level, extra: { label: "Líneas", value: String(lines) } }`; con `lives: 0` el HUD ya muestra `—`.
- Los puntos de una limpieza usan el nivel previo a la limpieza, igual que `game.js`.
- La caída automática acumula `dt` y, al alcanzar el intervalo, vuelve el acumulador a 0, igual que `game.js`.
- Cada `keydown` capturado (incluido `e.repeat` en `←`, `→` y `↓`) encola una acción; el motor las aplica en orden al inicio del siguiente `update`.
- `↑` y `X` rotan; Espacio hace caída instantánea y no se repite con `e.repeat`.
- El Espacio que inicia la partida desde la pantalla de inicio no encola `hardDrop`.
- En `gameover` el render dibuja el tablero sin la pieza actual ni la fantasma, con las filas apagadas según `fade`.
- El modal se abre 1 s después de pasar a `gameover`.
- El juego no escucha `P` ni `Escape`: la pausa es del reproductor.
- Con `paused`, los listeners no capturan teclas ni hacen `preventDefault`, y la cola de acciones se vacía.
- El rótulo "SIGUIENTE" usa la fuente pixel de la plataforma; el componente obtiene la `font-family` resuelta con `getComputedStyle` de un elemento `.pixel` y dibuja tras `document.fonts.ready`.
- `playable` de `caida` en la DB y su entrada en `PLAYABLE_GAMES` llegan juntos en esta spec.
- `references/started-games/` no se modifica.

## Plan de implementación

1. Crear `lib/tetris/pieces.ts` con `COLS`, `ROWS`, las 7 piezas de `game.js` (sin la tuerca), `LINE_SCORES`, `randomPiece` y `rotateCW`. Verificar con `npx tsc --noEmit`.
2. Crear `lib/tetris/engine.ts` con `TetrisGame`: `collide`, acciones (`left`, `right`, `rotate` con kicks, `softDrop`, `hardDrop`), gravedad, `lockPiece` (`merge` + `clearLines` + `spawn`), puntuación, nivel, `ghostY`, fin de partida, `fade` y `onStats` solo al cambiar. Verificar con `npx tsc --noEmit` y con `grep` que no hay `window`, `document`, `requestAnimationFrame` ni React.
3. Crear `lib/tetris/render.ts` con tablero, cuadrícula, bloques con glow, pieza fantasma, pieza actual, panel SIGUIENTE y filas apagadas según `fade`, sin HUD ni textos de fin. Usar `/frontend-design` para los 7 tonos, grosores, glow y el panel.
4. Crear `components/games/tetris.tsx` (`TetrisCanvas`) copiando la estructura de `components/games/asteroids.tsx` (sección 6 de `.claude/skills/nuevo-juego/contrato.md`):
   - Canvas 800×600 con `devicePixelRatio`.
   - Loop rAF con `dt` capado a 50 ms que se detiene con `paused`.
   - Cola de acciones por `keydown` con `preventDefault` de `←`, `→`, `↑`, `↓`, `X` y Espacio.
   - Overlay de inicio "PULSA ESPACIO PARA EMPEZAR" con los controles.
   - `onStats` traducido al HUD y `onGameOver` con 1 s de retraso.
   - Limpieza de rAF, listeners y timeout al desmontar.
5. Registrar `TetrisCanvas` como `caida` en `components/games/registry.ts`.
6. Crear la migración con `npm run db:new -- playable_caida` y aplicarla con `npm run db:push`. Verificar con `execute_sql` que `submit_score('caida','TEST',100)` inserta y que `get_leaderboard('caida')` la devuelve. Borrar la fila de prueba.
7. Probar en `npm run dev` con Playwright (sección 9 de `contrato.md`):
   - `/juegos/caida/jugar`: inicio, controles, puntos, líneas, nivel, pausa, fin, guardar, Salón, JUGAR DE NUEVO, SALIR y volver.
   - `/salon-de-la-fama?juego=caida` y `/juegos/caida` con la marca guardada.
   - `/juegos/rocas/jugar` intacto y `/juegos/serpentina/jugar` en MODO DEMO.
   - Revisar la consola.
8. Correr `npm run lint`, `npx tsc --noEmit`, `npm run build` y `get_advisors` (security) del MCP.

## Criterios de aceptación

- [ ] `npm run lint`, `npx tsc --noEmit` y `npm run build` terminan sin errores.
- [ ] Ningún archivo de `lib/tetris/` referencia `window`, `document`, `requestAnimationFrame` ni React.
- [ ] `lib/tetris/pieces.ts` define exactamente 7 piezas y ninguna es la tuerca 3×3.
- [ ] `/juegos/caida/jugar` muestra un canvas dentro del CRT con el overlay "PULSA ESPACIO PARA EMPEZAR" y los controles.
- [ ] Antes de empezar, el HUD muestra 0 puntos, vidas `—`, nivel 01 y Líneas 0.
- [ ] Pulsar Espacio (o hacer click en el CRT) inicia la partida sin hacer caer la primera pieza.
- [ ] El tablero de 10×20 queda centrado y el panel SIGUIENTE muestra la próxima pieza a su derecha.
- [ ] `←` `→` mueven la pieza, `↑` y `X` la rotan, `↓` la baja una fila y Espacio la deja caer; la página no hace scroll con esas teclas.
- [ ] Mantener `←` o `→` repite el movimiento con la repetición del sistema operativo.
- [ ] La pieza fantasma marca dónde aterriza la pieza actual.
- [ ] `↓` suma 1 punto por fila y Espacio suma 2 por celda recorrida.
- [ ] Limpiar 1, 2, 3 y 4 líneas en nivel 1 suma 100, 300, 500 y 800 puntos, y la celda Líneas sube en la misma cantidad.
- [ ] Al llegar a 10 líneas el HUD pasa a nivel 02 y la caída automática es más rápida.
- [ ] Cuando la pieza nueva no entra, las filas se apagan de abajo hacia arriba y ~1 s después se abre FIN DEL JUEGO con la puntuación del HUD; el canvas no dibuja "GAME OVER".
- [ ] El modal muestra GUARDAR PUNTUACIÓN (no "MODO DEMO — NO PUNTÚA"); al guardar muestra `▸ PUNTUACIÓN GUARDADA_` y VER SALÓN DE LA FAMA.
- [ ] Tras guardar, `/salon-de-la-fama?juego=caida` y `/juegos/caida` muestran la marca (top, MEJOR GLOBAL y PARTIDAS) sin recargar a mano.
- [ ] `public.games` tiene `caida` con `playable = true` y `npx supabase migration list` muestra `playable_caida` aplicada en local y remoto.
- [ ] FIN a mitad de partida abre el modal con la puntuación actual.
- [ ] JUGAR DE NUEVO deja el HUD en 0 / `—` / 01 / Líneas 0, vacía el tablero y muestra de nuevo "PULSA ESPACIO PARA EMPEZAR".
- [ ] PAUSA, `P` y `Escape` congelan y reanudan la caída sin que la pieza salte filas; cambiar de pestaña deja la partida en pausa.
- [ ] Ir a SALIR y volver a `/juegos/caida/jugar` no duplica la velocidad de caída ni los movimientos por tecla.
- [ ] El rótulo SIGUIENTE se dibuja con la fuente pixel de la plataforma.
- [ ] Los bloques se ven nítidos en una pantalla con `devicePixelRatio` 2.
- [ ] `/juegos/rocas/jugar` sigue funcionando y `/juegos/serpentina/jugar` sigue en MODO DEMO.
- [ ] `get_advisors` (security) no suma avisos.
- [ ] No hay errores ni warnings de hidratación en la consola en `/juegos/caida/jugar`.

## Decisiones

- **Sí:** reusar la entrada `caida` del catálogo. Su texto ya describe la regla de 10 líneas, tiene portada `cover-tetro` y fila en `public.games`.
- **No:** id nuevo `tetris`. Obliga a otra entrada, otra portada y una migración `insert`, y deja CAÍDA como demo duplicada.
- **Sí:** quitar la pieza "tuerca". Pedido por el usuario: el juego queda con las 7 piezas estándar que documenta el README.
- **No:** mantener la tuerca como se mantuvo el disparo 3x de ROCAS.
- **Sí:** mundo 800×600 con tablero de 28 px centrado y panel SIGUIENTE en canvas. Encaja el tablero vertical en el CRT 4:3 y conserva la vista previa.
- **No:** solo el tablero. Pierde la vista previa de la referencia.
- **No:** mostrar la siguiente pieza en el HUD de React. Cambia el contrato del registro y `GamePlayer`.
- **Sí:** `lives: 0` para que el HUD muestre `—`. Tetris no tiene vidas y no hace falta tocar el contrato.
- **No:** hacer `lives` opcional en `PlayableGameStats`. Toca `registry.ts` y `game-player.tsx` sin necesidad.
- **Sí:** celda extra "Líneas" siempre visible. Es el dato que la referencia muestra y el que define el nivel.
- **Sí:** repetición de teclas del sistema operativo con una cola de acciones. Es fiel a `game.js`.
- **No:** DAS/ARR propios. Se apartan de la referencia; van en otra spec si se piden.
- **Sí:** 7 tonos neón distintos (los 4 de la plataforma y 3 derivados) con `/frontend-design`. Cada pieza se reconoce por color como en la referencia.
- **No:** solo los 4 tokens, ni un color único.
- **Sí:** apagar las filas durante el segundo previo al modal. Cumple el papel de la explosión de la nave en ROCAS.
- **No:** tablero congelado sin animación.
- **Sí:** mantener `difficulty: 3` en `lib/games.ts`. Sin la tuerca, es un Tetris clásico de dificultad media.
- **Sí:** quitar el tema claro/oscuro, la pausa propia y el overlay de la referencia. Los cubren la plataforma y `GamePlayer`.
- **Sí:** habilitar el leaderboard con una migración de datos. Las funciones y pantallas de SPEC 06 ya son genéricas.
- **No:** regenerar `database.types.ts`. No cambia el esquema.
- **Sí:** motor sin DOM en `lib/tetris/` y Client Component, como ROCAS. Permite limpiar loop y listeners al navegar.
- **No:** copiar `game.js` casi tal cual. Sus globals y listeners sobreviven a la navegación del App Router.

## Riesgos

| Riesgo                                                                                 | Mitigación                                                                                                          |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Loops rAF o listeners que sobreviven al desmontar (Strict Mode monta dos veces en dev) | Cleanup completo en cada `useEffect`; el criterio de SALIR y volver lo detecta.                                     |
| `onStats` en cada frame re-renderiza el HUD                                            | El motor solo emite cuando cambia `score`, `lines`, `level` o `status`.                                             |
| Espacio activa el botón con foco (PAUSA, SALIR) en lugar de la caída                   | `preventDefault` en `keydown` y `keyup` de las teclas capturadas; el inicio por click quita el foco de los botones. |
| El Espacio de inicio hace caer la primera pieza                                        | La pantalla de inicio consume ese Espacio sin encolar `hardDrop` (criterio explícito).                              |
| Las teclas capturadas bloquean escribir en el input del modal                          | Con `paused` no se capturan teclas.                                                                                 |
| Acciones encoladas que se aplican al reanudar                                          | La cola se vacía al pausar, en `blur` y al desmontar.                                                               |
| La pieza salta filas al reanudar                                                       | Se reinicia el timestamp al reanudar y `dt` se capa a 50 ms.                                                        |
| La fuente pixel no está cargada al dibujar el rótulo                                   | El componente dibuja tras `document.fonts.ready` y lee la `font-family` resuelta de un elemento `.pixel`.           |
| `playable` de `caida` y `PLAYABLE_GAMES` desincronizados                               | Componente y migración llegan en esta spec; si la DB rechaza, el modal muestra el error de guardado.                |
| Puntuación 0 al perder sin mover piezas                                                | El modal ya muestra "SIN PUNTOS PARA GUARDAR" (SPEC 06).                                                            |

## Lo que **no** entra en esta spec

- La pieza "tuerca".
- Tema claro/oscuro de la referencia.
- DAS/ARR, _hold_, bolsa de 7, _lock delay_, _T-spins_ y combos.
- Controles táctiles y móvil.
- Sonido.
- Cambios en el catálogo, en el contrato del registro o en `GamePlayer`.
- Tests automatizados.

Cada uno de esos, si llega, va en su propia spec.

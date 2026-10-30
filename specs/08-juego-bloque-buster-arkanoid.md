# SPEC 08 — Juego real BLOQUE BUSTER (port de Arkanoid) con leaderboard

> **Estado:** aprobada
> **Depende de:** SPEC 05, SPEC 06
> **Fecha:** 2026-10-29
> **Objetivo:** Portar el Arkanoid de `references/started-games/04-arkanoid/` a TypeScript, montarlo como juego jugable en `/juegos/bloque-buster/jugar` y habilitar sus puntuaciones en Supabase.

## Por qué existe esta spec

Hoy `bloque-buster` es una simulación: el modal muestra "MODO DEMO — NO PUNTÚA" y su pestaña del Salón está vacía.
`references/started-games/04-arkanoid/` trae un Arkanoid completo en canvas puro: `game.js` (~270 líneas, globals, listeners en `document` y `canvas`), `levels.js` con 5 niveles, un spritesheet pixel art y 2 sonidos mp3.
La SPEC 05 dejó el patrón motor + render + componente + `PLAYABLE_GAMES`, y la SPEC 06 dejó el leaderboard genérico por `game_id`.
Esta spec aplica ambos a `bloque-buster` siguiendo `.claude/skills/nuevo-juego/contrato.md`.
El texto de `bloque-buster` en el catálogo ("nave-paleta", "muros de bloques", "cada nivel reorganiza la grilla") ya describe el juego.

Comportamientos de `game.js` que el README no cuenta y que se mantienen:

- La paleta mide 81×14, no 162×14: el sprite de 162 px se dibuja a la mitad.
- El rebote en la paleta solo invierte `vy`; el ángulo de la pelota no cambia nunca.
- Un bloque golpeado siempre invierte `vy`, también en golpes laterales, y se rompe como mucho un bloque por frame.
- La puntuación máxima posible es 2.080 (208 bloques × 10).

## Alcance

**Entra:**

- Port de `game.js` y `levels.js` a TypeScript en `lib/arkanoid/`: constantes y niveles, motor sin DOM y render separado.
- Misma jugabilidad que `game.js`:
  - Mundo de 800×600 con paredes a izquierda, derecha y arriba.
  - Paleta de 81×14 en `y = 560`, movida por el mouse (centrada en el puntero) o por `←` `→` a 400 px/s, siempre dentro del mundo.
  - Pelota de 16×16 con velocidad base `(200, −300)` px/s × el multiplicador del nivel.
  - Bloques de 64×24 en una grilla de 10×6 con origen en `(80, 80)`.
  - 5 niveles con los patrones y colores de `levels.js`: 60, 40, 30, 39 y 39 bloques, y multiplicadores 1.00, 1.10, 1.21, 1.33 y 1.46.
  - 10 puntos por bloque, acumulados entre niveles.
  - 3 vidas; se pierde una cuando la pelota pasa `y > 600`.
  - Al vaciar un nivel se carga el siguiente; al vaciar el nivel 5, la partida termina con victoria.
- Saque manual, que es un cambio respecto de la referencia: al empezar cada nivel y tras perder una vida, la pelota queda pegada sobre el centro de la paleta y sale con Espacio o click.
- Render vectorial con la paleta neón de la plataforma, diseñado con `/frontend-design`:
  - 7 tonos para los colores de bloque de `levels.js`.
  - Destello neón de 150 ms al romper un bloque, en lugar de los frames del spritesheet.
  - Animación de fin según el resultado.
- Sonido de rebote y de rotura con los mp3 de la referencia, copiados a `public/games/bloque-buster/`.
- Client Component `components/games/arkanoid.tsx` (`ArkanoidCanvas`) registrado como `bloque-buster` en `PLAYABLE_GAMES`.
- Pantalla de inicio "PULSA ESPACIO PARA EMPEZAR" con los controles.
- HUD de React: puntuación, vidas `♥`, nivel y celda extra "Bloques" con los que quedan en el nivel.
- Pausa, fin, guardado y reinicio con los mecanismos existentes de `GamePlayer`.
- Migración `playable_bloque_buster` que marca `bloque-buster` como jugable en `public.games`.
- `best` de `bloque-buster` en `lib/games.ts` pasa de 28450 a 1840.

**Fuera de alcance (para specs futuras):**

- El spritesheet de la referencia y sus frames de explosión.
- Control de volumen o silencio.
- Pausa propia, selector de nivel en la pausa, HUD en canvas y overlays "GAME OVER" / "¡Completaste el juego!" de la referencia.
- Ángulo de rebote según el punto de impacto en la paleta.
- Bonos de puntuación (por vidas, por nivel o por tiempo).
- Power-ups, más de 5 niveles y animación de transición entre niveles.
- Bloqueo del puntero (`requestPointerLock`).
- Controles táctiles y móvil.
- Cambios en el texto, la portada o `difficulty` de `bloque-buster` en `lib/games.ts`.
- Cambios en `submit_score`, `get_leaderboard`, el Salón o el detalle (ya genéricos desde SPEC 06).
- Cambios en `PlayableGameStats` o en `GamePlayer`.
- Tests automatizados.

## Modelo de datos

```ts
// lib/arkanoid/levels.ts — sin DOM
export type BlockColor =
  "red" | "yellow" | "cyan" | "magenta" | "hotpink" | "green" | "gray";
export type LevelBlock = { col: number; row: number; color: BlockColor };
export type Level = { speed: number; blocks: LevelBlock[] };
export const LEVELS: Level[]; // los 5 niveles de levels.js, mismo orden, patrones y colores
```

```ts
// lib/arkanoid/engine.ts — sin DOM: no usa window, document, requestAnimationFrame, Audio, Image ni React
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
  elapsed: number;
}; // ms
export type Spark = { x: number; y: number; vx: number; vy: number };

export class ArkanoidGame {
  paddle: { x: number; y: number; w: number; h: number };
  ball: { x: number; y: number; w: number; h: number; vx: number; vy: number };
  blocks: Block[];
  explosions: Explosion[];
  sparks: Spark[]; // chispas de la paleta tras una derrota; vacío en cualquier otro caso
  endT: number; // 0 → 1 durante el segundo posterior a "gameover"; lo usa el render
  constructor(
    onStats: (stats: ArkanoidStats) => void, // emite al crear y solo cuando cambia un campo
    onEvent?: (event: ArkanoidEvent) => void, // sonidos: lo escucha el componente
  );
  update(dt: number, input: ArkanoidInput): void; // dt en segundos, capado a 0,05 por el llamador
  getStats(): ArkanoidStats;
}
```

```ts
// lib/arkanoid/render.ts
export function drawArkanoid(
  ctx: CanvasRenderingContext2D,
  game: ArkanoidGame,
  now: number,
): void;
// 7 tonos de bloque: cian #00f5ff, magenta #ff006e, amarillo #f5ff00, verde #00ff88
// y rojo, rosa y gris derivados, definidos con /frontend-design. Glow con shadowBlur.
```

```ts
// components/games/registry.ts
export const PLAYABLE_GAMES = {
  rocas: AsteroidsCanvas,
  caida: TetrisCanvas,
  "bloque-buster": ArkanoidCanvas,
};
```

```sql
-- supabase/migrations/<timestamp>_playable_bloque_buster.sql
update public.games set playable = true where id = 'bloque-buster';
```

```text
public/games/bloque-buster/ball-bounce.mp3   ← copia de references/started-games/04-arkanoid/assets/sounds/
public/games/bloque-buster/break-sound.mp3   ← copia de references/started-games/04-arkanoid/assets/sounds/
```

Convenciones:

- `lib/arkanoid/` es TypeScript puro y no importa React; todo lo que toca el DOM (canvas, listeners, `Audio`) vive en `components/games/arkanoid.tsx`.
- Posición de un bloque: `x = 80 + col × 64`, `y = 80 + row × 24`.
- Física idéntica a `game.js`:
  - Rebote en paredes: el signo de `vx` o `vy` se fija hacia adentro y la pelota se reubica en el borde.
  - Rebote en paleta: solo con `vy > 0` y el borde inferior de la pelota entre `paddle.y` y `paddle.y + paddle.h + 8`. La pelota queda sobre la paleta con `vy = −|vy|`.
  - Bloques: colisión AABB, `vy = −vy` y como mucho un bloque por `update`.
- En `"serve"` la pelota no se mueve y queda centrada sobre la paleta (`x = paddle.x + (81 − 16) / 2`, `y = 560 − 16`), siguiéndola.
- `launch` en `"serve"` pasa a `"playing"` con `vx = 200 × speed` y `vy = −300 × speed`. Fuera de `"serve"` se ignora.
- Al vaciar un nivel menor que 5 se carga el siguiente en `"serve"`. Esto vacía `explosions`, mantiene la x de la paleta y aplica el `speed` del nivel nuevo al próximo saque.
- Al vaciar el nivel 5: `status = "gameover"`, `won = true`, y las vidas restantes no cambian.
- Al perder la última vida: `lives = 0`, `status = "gameover"` y `won = false`. Si quedan vidas, vuelve a `"serve"`.
- Tras `"gameover"`, `update` solo avanza `endT` (en 1 s), las chispas y las explosiones pendientes; ignora el input.
- Animación de fin dibujada por el render según `endT`, sin texto:
  - Derrota: la paleta se desintegra en `sparks` neón que se dispersan y se apagan.
  - Victoria: los bordes del área parpadean en verde `#00ff88`.
  - En ambos casos no se dibuja la pelota.
- Explosión de bloque: destello vectorial del color del bloque durante 150 ms (`elapsed` en ms), sin bloquear la colisión del bloque, que ya está muerto.
- Eventos de sonido, igual que `game.js`: `"bounce"` en paredes y paleta, y `"break"` al romper un bloque (sin `"bounce"` en ese caso). Perder una vida no suena.
- El componente precarga los dos `Audio` al montar y reproduce cada evento con `cloneNode()` + `play()`, ignorando el rechazo de la promesa. El primer sonido solo puede llegar después del Espacio o click de inicio, y en pausa no hay eventos porque el motor no avanza.
- El HUD recibe `{ score, lives, level, extra: { label: "Bloques", value: String(blocksLeft) } }`; la celda extra está siempre visible.
- Controles:
  - `pointermove` sobre el canvas se convierte con `(e.clientX − rect.left) × WORLD_W / rect.width`, se ignora con `paused` y se aplica como en `game.js` (`paddle.x = x − 81 / 2`, acotado).
  - `←` y `→` se capturan mientras se mantienen.
  - Espacio (sin `e.repeat`) y click/`pointerdown` en el canvas encolan `launch`.
- El Espacio o click que inicia la partida desde la pantalla de inicio no encola `launch`: la partida empieza en `"serve"`.
- El modal se abre 1 s después de pasar a `"gameover"`, sea derrota o victoria; la puntuación final es la acumulada.
- El juego no escucha `P` ni `Escape`: la pausa es del reproductor.
- Con `paused`, los listeners no capturan teclas ni hacen `preventDefault`, y `launch` / `pointerX` pendientes se descartan.
- La puntuación enviada es entera y está entre 1 y 2.080 (dentro del rango 1–10.000.000 de `submit_score`).
- `playable` de `bloque-buster` en la DB y su entrada en `PLAYABLE_GAMES` llegan juntos en esta spec.
- `references/started-games/` no se modifica.

## Plan de implementación

1. Crear `lib/arkanoid/levels.ts` con `BlockColor`, `Level` y `LEVELS`, portados de `levels.js` sin cambios. Verificar con `npx tsc --noEmit` y contar 60, 40, 30, 39 y 39 bloques.
2. Crear `lib/arkanoid/engine.ts` con `ArkanoidGame`:
   - Constantes y estado de `game.js`, carga de nivel y saque manual.
   - Paleta por teclado y puntero, física de pelota, paredes, paleta y bloques.
   - Explosiones, vidas, avance de nivel, victoria y derrota.
   - `endT`, `sparks`, `onStats` solo al cambiar y `onEvent`.
   - Sin la pausa propia, el selector de nivel ni los overlays.
   - Verificar con `npx tsc --noEmit` y con `grep` que no hay `window`, `document`, `requestAnimationFrame`, `Audio`, `Image` ni React.
3. Crear `lib/arkanoid/render.ts`:
   - Fondo, bloques con glow, destellos de rotura, paleta y pelota.
   - Animación de fin (chispas en derrota, borde verde en victoria).
   - Sin HUD ni textos.
   - Usar `/frontend-design` para los 7 tonos, la paleta, la pelota, grosores, glow, destello, chispas y borde de victoria.
4. Copiar `ball-bounce.mp3` y `break-sound.mp3` de `references/started-games/04-arkanoid/assets/sounds/` a `public/games/bloque-buster/`. Antes, consultar en `node_modules/next/dist/docs/` cómo sirve esta versión de Next la carpeta `public/`.
5. Crear `components/games/arkanoid.tsx` (`ArkanoidCanvas`) copiando la estructura de `components/games/asteroids.tsx` (sección 6 de `.claude/skills/nuevo-juego/contrato.md`):
   - Canvas 800×600 con `devicePixelRatio`.
   - Loop rAF con `dt` capado a 50 ms que se detiene con `paused`.
   - `←` `→` mantenidas, Espacio y click para lanzar, `pointermove` reescalado al mundo, con `preventDefault` de `←`, `→` y Espacio en `keydown` y `keyup`.
   - Overlay de inicio "PULSA ESPACIO PARA EMPEZAR" con los controles: Mouse / `←` `→` mover, Espacio / Click lanzar, `P` pausa. Diseñado con `/frontend-design`.
   - `Audio` precargados y reproducidos por evento.
   - `onStats` traducido al HUD y `onGameOver` con 1 s de retraso.
   - Limpieza de rAF, listeners y timeout al desmontar.
6. Registrar `ArkanoidCanvas` como `"bloque-buster"` en `components/games/registry.ts`.
7. Cambiar `best` de `bloque-buster` en `lib/games.ts` de 28450 a 1840.
8. Crear la migración con `npm run db:new -- playable_bloque_buster` y aplicarla con `npm run db:push`. Verificar con `execute_sql` que `submit_score('bloque-buster','TEST',100)` inserta y que `get_leaderboard('bloque-buster')` la devuelve. Borrar la fila de prueba.
9. Probar en `npm run dev` con Playwright (sección 9 de `contrato.md`):
   - `/juegos/bloque-buster/jugar`: inicio, saque, controles, puntos, Bloques, pérdida de vida, cambio de nivel, pausa, fin, guardar, Salón, JUGAR DE NUEVO, SALIR y volver.
   - `/salon-de-la-fama?juego=bloque-buster` y `/juegos/bloque-buster` con la marca guardada.
   - `/juegos/rocas/jugar` y `/juegos/caida/jugar` intactos y `/juegos/serpentina/jugar` en MODO DEMO.
   - Revisar la consola.
10. Correr `npm run lint`, `npx tsc --noEmit`, `npm run build` y `get_advisors` (security) del MCP.

## Criterios de aceptación

- [ ] `npm run lint`, `npx tsc --noEmit` y `npm run build` terminan sin errores.
- [ ] Ningún archivo de `lib/arkanoid/` referencia `window`, `document`, `requestAnimationFrame`, `Audio`, `Image` ni React.
- [ ] `LEVELS` tiene 5 niveles con 60, 40, 30, 39 y 39 bloques y multiplicadores 1.00, 1.10, 1.21, 1.33 y 1.46.
- [ ] `/juegos/bloque-buster/jugar` muestra un canvas dentro del CRT con el overlay "PULSA ESPACIO PARA EMPEZAR" y los controles.
- [ ] Antes de empezar, el HUD muestra 0 puntos, `♥♥♥`, nivel 01 y Bloques 60.
- [ ] Pulsar Espacio (o hacer click en el CRT) inicia la partida con la pelota quieta sobre la paleta: ese Espacio no la lanza.
- [ ] En el saque, mover la paleta arrastra la pelota; Espacio o click la lanzan hacia arriba a la derecha.
- [ ] El mouse sobre el canvas centra la paleta en el puntero, también con el CRT escalado; `←` y `→` la mueven; la paleta no sale del área; la página no hace scroll con `←`, `→` ni Espacio.
- [ ] La pelota rebota en las paredes izquierda, derecha y superior y en la paleta, siempre con el mismo ángulo.
- [ ] Romper un bloque suma 10 puntos, baja Bloques en 1 y muestra un destello del color del bloque.
- [ ] Al rebotar en una pared o la paleta suena `ball-bounce.mp3`; al romper un bloque suena `break-sound.mp3` y no el rebote.
- [ ] No suena nada antes de iniciar la partida ni mientras está en pausa.
- [ ] Cuando la pelota cae, el HUD pierde un `♥` y la pelota vuelve a quedar sobre la paleta esperando el saque.
- [ ] Al vaciar el nivel 1, el HUD pasa a nivel 02 y Bloques 40, aparece la pirámide y el siguiente saque es más rápido.
- [ ] Al perder la tercera vida, la paleta se desintegra en chispas y ~1 s después se abre FIN DEL JUEGO con la puntuación del HUD; el canvas no dibuja texto.
- [ ] Al vaciar el nivel 5, los bordes parpadean en verde y ~1 s después se abre FIN DEL JUEGO con la puntuación acumulada.
- [ ] El modal muestra GUARDAR PUNTUACIÓN (no "MODO DEMO — NO PUNTÚA"); al guardar muestra `▸ PUNTUACIÓN GUARDADA_` y VER SALÓN DE LA FAMA.
- [ ] Tras guardar, `/salon-de-la-fama?juego=bloque-buster` y `/juegos/bloque-buster` muestran la marca (top, MEJOR GLOBAL y PARTIDAS) sin recargar a mano.
- [ ] `public.games` tiene `bloque-buster` con `playable = true` y `npx supabase migration list` muestra `playable_bloque_buster` aplicada en local y remoto.
- [ ] La tarjeta de BLOQUE BUSTER en la biblioteca muestra 1.840 como mejor marca.
- [ ] FIN a mitad de partida abre el modal con la puntuación actual.
- [ ] JUGAR DE NUEVO deja el HUD en 0 / `♥♥♥` / 01 / Bloques 60, restaura el nivel 1 y muestra de nuevo "PULSA ESPACIO PARA EMPEZAR".
- [ ] PAUSA, `P` y `Escape` congelan y reanudan la pelota sin que salte; cambiar de pestaña deja la partida en pausa.
- [ ] Con el juego en pausa, mover el mouse no mueve la paleta.
- [ ] Ir a SALIR y volver a `/juegos/bloque-buster/jugar` no duplica la velocidad de la pelota, los movimientos por tecla ni los sonidos.
- [ ] Los bordes de bloques, paleta y pelota se ven nítidos con `devicePixelRatio` 2.
- [ ] `/juegos/rocas/jugar` y `/juegos/caida/jugar` siguen funcionando y `/juegos/serpentina/jugar` sigue en MODO DEMO.
- [ ] `get_advisors` (security) no suma avisos.
- [ ] No hay errores ni warnings de hidratación en la consola en `/juegos/bloque-buster/jugar`.

## Decisiones

- **Sí:** reusar la entrada `bloque-buster` del catálogo. Su texto ya describe una paleta que rompe muros de bloques por niveles, y tiene portada `cover-bricks` y fila en `public.games`.
- **No:** id nuevo `arkanoid`. Obliga a otra entrada, otra portada y una migración `insert`, y deja BLOQUE BUSTER como demo duplicada.
- **Sí:** render vectorial neón con destello de 150 ms al romper. Coherente con ROCAS y CAÍDA, y sin cargar imágenes.
- **No:** usar el spritesheet pixel art. No sigue la estética de la plataforma y obliga a esperar `onload`.
- **Sí:** sonido con los 2 mp3 de la referencia, disparado por eventos del motor. Pedido por el usuario; mantiene el motor sin `Audio`.
- **No:** control de volumen o tecla de silencio. Igual que la referencia; un silencio global iría en una spec de sonido de la plataforma.
- **Sí:** 10 puntos por bloque, sin bonos. Fiel a la referencia, aunque limite la marca a 2.080 y permita empates.
- **No:** 10 × nivel por bloque ni bono por vidas. Se apartan de la referencia.
- **Sí:** saque manual con Espacio o click, al empezar cada nivel y tras perder una vida. Evita perder una vida por la carga instantánea de nivel de `game.js`. Es el único cambio de jugabilidad.
- **No:** saque inmediato como `game.js`.
- **Sí:** rebote en la paleta que solo invierte `vy`, igual que la referencia.
- **No:** ángulo según el punto de impacto. Cambia la jugabilidad; iría en otra spec.
- **Sí:** celda extra "Bloques" con los restantes del nivel, siempre visible. Muestra el avance dentro del nivel.
- **No:** celda "Velocidad" ni omitir `extra`.
- **Sí:** vidas `♥` en el HUD con `lives` reales. El juego tiene 3 vidas y el contrato ya las muestra.
- **Sí:** animación de fin distinta por resultado (chispas en derrota, borde verde en victoria) y un campo `won` en `ArkanoidStats`. Cumple el papel de la explosión de ROCAS sin texto en canvas y sin tocar `PlayableGameStats`.
- **No:** el mismo apagado para ambos resultados ni dejar el frame congelado.
- **Sí:** bajar `best` de `bloque-buster` a 1840. La tarjeta mostraba 28.450, una marca imposible con un máximo de 2.080.
- **Sí:** mantener `difficulty: 2`. Con 3 vidas, saque manual y velocidad máxima de ×1.46 sigue siendo accesible.
- **Sí:** quitar la pausa propia, el selector de nivel, el HUD en canvas y los overlays de la referencia. Los cubren `GamePlayer` y el modal.
- **Sí:** migración llamada `playable_bloque_buster`, con guion bajo en lugar del guion del id, para un nombre de archivo de migración sin guiones.
- **Sí:** habilitar el leaderboard con una migración de datos. Las funciones y pantallas de SPEC 06 ya son genéricas.
- **No:** regenerar `database.types.ts`. No cambia el esquema.
- **Sí:** motor sin DOM en `lib/arkanoid/` y Client Component, como ROCAS. Permite limpiar loop, listeners y sonidos al navegar.
- **No:** copiar `game.js` casi tal cual. Sus globals y listeners sobreviven a la navegación del App Router.

## Riesgos

| Riesgo                                                                                 | Mitigación                                                                                                                                                                           |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Loops rAF o listeners que sobreviven al desmontar (Strict Mode monta dos veces en dev) | Cleanup completo en cada `useEffect`; el criterio de SALIR y volver lo detecta.                                                                                                      |
| `onStats` en cada frame re-renderiza el HUD                                            | El motor solo emite cuando cambia `score`, `lives`, `level`, `blocksLeft`, `status` o `won`.                                                                                         |
| Espacio activa el botón con foco (PAUSA, SALIR) en lugar del saque                     | `preventDefault` en `keydown` y `keyup` de las teclas capturadas; el inicio por click quita el foco de los botones.                                                                  |
| El Espacio de inicio lanza la pelota                                                   | La pantalla de inicio consume ese Espacio sin encolar `launch` (criterio explícito).                                                                                                 |
| Las teclas capturadas bloquean escribir en el input del modal                          | Con `paused` no se capturan teclas.                                                                                                                                                  |
| La pelota atraviesa la paleta con un `dt` grande                                       | `dt` capado a 50 ms: a ×1.46 la pelota avanza como mucho 21,9 px en `y` por `update`, menos que la ventana de 22 px de la paleta y que los 40 px que necesita para cruzar un bloque. |
| La pelota salta al reanudar                                                            | Se reinicia el timestamp al reanudar y `dt` se capa a 50 ms.                                                                                                                         |
| El navegador rechaza `play()` por autoplay                                             | El primer sonido llega después del gesto de inicio; el rechazo de la promesa se ignora y el juego sigue sin sonido.                                                                  |
| Sonidos que se acumulan o suenan tras salir                                            | Los eventos solo salen de `update`, que no corre en pausa ni tras desmontar.                                                                                                         |
| La paleta no sigue al mouse con el CRT escalado                                        | `pointermove` reescala con `WORLD_W / rect.width` (criterio explícito).                                                                                                              |
| `playable` de `bloque-buster` y `PLAYABLE_GAMES` desincronizados                       | Componente y migración llegan en esta spec; si la DB rechaza, el modal muestra el error de guardado.                                                                                 |
| Puntuación 0 al perder sin romper bloques                                              | El modal ya muestra "SIN PUNTOS PARA GUARDAR" (SPEC 06).                                                                                                                             |

## Lo que **no** entra en esta spec

- Spritesheet y frames de explosión de la referencia.
- Control de volumen o silencio.
- Ángulo de rebote por impacto, bonos de puntuación, power-ups, más niveles y transiciones entre niveles.
- Selector de nivel y pausa propia de la referencia.
- Bloqueo del puntero, controles táctiles y móvil.
- Cambios en el texto, la portada o la dificultad de `bloque-buster`, en el contrato del registro o en `GamePlayer`.
- Tests automatizados.

Cada uno de esos, si llega, va en su propia spec.

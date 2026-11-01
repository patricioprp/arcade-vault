# SPEC 09 — Juego real SERPENTINA (Snake) con leaderboard

> **Estado:** implementado
> **Depende de:** SPEC 05, SPEC 06
> **Fecha:** 2026-10-31
> **Objetivo:** Crear desde cero un Snake en TypeScript con frutas pixel art, montarlo como juego jugable en `/juegos/serpentina/jugar` y habilitar sus puntuaciones en Supabase.

## Por qué existe esta spec

Hoy `serpentina` es una simulación: el modal muestra "MODO DEMO — NO PUNTÚA" y su pestaña del Salón está vacía.
No hay código de referencia. Solo hay assets en `references/source-assests/snake-assets/`:

- `fruits.png`: 3790×442, fondo transparente, 3 filas de 22 piezas (plana, pixel art y realista).
- `sprites.js`: un `window.SPRITE_ATLAS` con las coordenadas de la fila pixel art (`y = 136`, `h = 160`).

La SPEC 05 dejó el patrón motor + render + componente + `PLAYABLE_GAMES`, y la SPEC 06 dejó el leaderboard genérico por `game_id`.
Esta spec aplica ambos a `serpentina` siguiendo `.claude/skills/nuevo-juego/contrato.md`.

Problemas de `sprites.js` que se corrigen al portarlo:

- Las coordenadas `x`/`w` de la fila del medio son correctas, pero **los nombres no coinciden con la imagen**: `banana` (x 34) es la manzana, `orange` (x 186) es la banana, `melon` (x 3637) es un bol, etc. En el port se renombran según lo que se ve (tabla en Modelo de datos).
- La última pieza es un bol de frutas, no una fruta, y queda fuera del juego.
- Es un script con un global en `window`; se porta como datos puros en `lib/snake/fruits.ts`.

## Alcance

**Entra:**

- Snake escrito desde cero en TypeScript en `lib/snake/`: datos de sprites, motor sin DOM y render separado.
- Jugabilidad:
  - Mundo de 800×600 dividido en una grilla de 32×24 celdas de 25 px. El borde del mundo es pared.
  - La serpiente empieza con 3 segmentos en el centro (cabeza en la celda `(16, 12)`), mirando a la derecha.
  - Hay siempre una fruta en una celda libre al azar, con una de las 21 frutas pixel art al azar.
  - Comer una fruta suma `10 × nivel` puntos y alarga la serpiente 1 segmento.
  - Cada 5 frutas comidas se sube un nivel. La velocidad es `min(8 + (nivel − 1), 20)` pasos por segundo (8 en el nivel 1 y 20 desde el nivel 13).
  - 3 vidas. Se pierde una al chocar con la pared o con el propio cuerpo.
  - Tras perder una vida, la serpiente reaparece en el centro con 3 segmentos y queda quieta hasta que el jugador pulse una dirección o Espacio. Se conservan los puntos, el nivel, la velocidad y el contador de frutas.
  - La partida termina al perder la tercera vida o al llenar la grilla (no queda celda libre para la fruta).
- Controles: flechas y WASD, con una cola de hasta 2 giros por paso.
- Render con la paleta neón de la plataforma y las frutas pixel art del PNG, diseñado con `/frontend-design`.
- Copia de `fruits.png` a `public/games/serpentina/fruits.png`.
- Client Component `components/games/snake.tsx` (`SnakeCanvas`) registrado como `serpentina` en `PLAYABLE_GAMES`.
- Pantalla de inicio "PULSA ESPACIO PARA EMPEZAR" con los controles.
- HUD de React: puntuación, vidas `♥`, nivel y celda extra "Largo" con los segmentos de la serpiente.
- Pausa, fin, guardado y reinicio con los mecanismos existentes de `GamePlayer`.
- Migración `playable_serpentina` que marca `serpentina` como jugable en `public.games`.
- En `lib/games.ts`, el `long` de `serpentina` pasa a describir las frutas y las vidas, y `best` pasa de 7820 a 3900.

**Fuera de alcance (para specs futuras):**

- Sonido.
- Frutas con valores distintos, frutas temporales, power-ups u obstáculos.
- Modo de bordes que se atraviesan (wrap).
- Las filas plana y realista de `fruits.png`, y recortar el PNG a la fila usada.
- Controles táctiles y móvil.
- Cambios en `short`, la portada `cover-snake`, la categoría o `difficulty` de `serpentina`.
- Cambios en `submit_score`, `get_leaderboard`, el Salón o el detalle (ya genéricos desde SPEC 06).
- Cambios en `PlayableGameStats` o en `GamePlayer`.
- Tests automatizados.

## Modelo de datos

```ts
// lib/snake/fruits.ts — sin DOM: solo datos
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
export const FRUIT_KINDS: FruitKind[]; // las 21, en el orden de la tabla
export const FRUIT_SPRITES: Record<FruitKind, FruitSprite>; // recortes dentro de fruits.png
```

Recortes (todos con `y = 136`, `h = 160`; `x` y `w` tomados de `sprites.js`, nombre corregido según la imagen):

| Fruta              | x    | w   | Nombre en `sprites.js` |
| ------------------ | ---- | --- | ---------------------- |
| apple              | 34   | 110 | banana                 |
| banana             | 186  | 150 | orange                 |
| pineapple          | 378  | 110 | grape                  |
| grape              | 540  | 130 | garlic                 |
| pumpkin            | 712  | 130 | eggplant               |
| turnip             | 894  | 110 | strawberry             |
| eggplant           | 1066 | 110 | cherry                 |
| strawberry         | 1228 | 130 | carrot                 |
| cherry             | 1400 | 130 | mushroom               |
| carrot             | 1582 | 110 | broccoli               |
| mushroom           | 1734 | 150 | watermelon             |
| broccoli           | 1906 | 150 | pepper                 |
| watermelon         | 2068 | 170 | kiwi                   |
| pepper             | 2250 | 140 | lemon                  |
| kiwi               | 2432 | 130 | peach                  |
| lemon              | 2604 | 130 | peanut                 |
| orange             | 2786 | 110 | apple                  |
| peach              | 2948 | 130 | tomato                 |
| peanut             | 3110 | 150 | berries                |
| raspberry          | 3302 | 110 | grapes2                |
| tomato             | 3454 | 150 | pineapple              |
| _(bol, no se usa)_ | 3637 | 130 | melon                  |

```ts
// lib/snake/engine.ts — sin DOM: no usa window, document, requestAnimationFrame, Audio, Image ni React
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

export class SnakeGame {
  body: Cell[]; // body[0] es la cabeza
  dir: Direction; // dirección del último paso
  fruit: { cell: Cell; kind: FruitKind } | null; // null solo si la grilla está llena
  crashT: number; // 0 → 1 durante la animación de choque; lo usa el render
  endT: number; // 0 → 1 durante el segundo posterior a "gameover"; lo usa el render
  constructor(
    onStats: (stats: SnakeStats) => void, // emite al crear y solo cuando cambia un campo
    rng?: () => number, // por defecto Math.random
  );
  update(dt: number, input: SnakeInput): void; // dt en segundos, capado a 0,05 por el llamador
  getStats(): SnakeStats;
}
```

```ts
// lib/snake/render.ts
export function drawSnake(
  ctx: CanvasRenderingContext2D,
  game: SnakeGame,
  fruitsImg: HTMLImageElement | null, // null mientras carga: se dibuja un núcleo neón en su lugar
  now: number,
): void;
// Serpiente verde #00ff88 con la cabeza más brillante, pared cian #00f5ff, choque magenta #ff006e,
// grilla tenue. Glow con shadowBlur. Tonos y grosores definidos con /frontend-design.
```

```ts
// components/games/registry.ts
export const PLAYABLE_GAMES = {
  rocas: AsteroidsCanvas,
  caida: TetrisCanvas,
  "bloque-buster": ArkanoidCanvas,
  serpentina: SnakeCanvas,
};
```

```sql
-- supabase/migrations/<timestamp>_playable_serpentina.sql
update public.games set playable = true where id = 'serpentina';
```

```text
public/games/serpentina/fruits.png   ← copia de references/source-assests/snake-assets/fruits.png
```

Convenciones:

- `lib/snake/` es TypeScript puro y no importa React; todo lo que toca el DOM (canvas, listeners, `Image`) vive en `components/games/snake.tsx`.
- Celda `(x, y)` en el mundo: esquina superior izquierda en `(x × 25, y × 25)`.
- Paso de la serpiente:
  - El motor acumula `dt` y da un paso cada `1 / velocidad` segundos, con `velocidad = min(8 + (nivel − 1), 20)`. Si un frame acumula varios pasos, los da todos.
  - En cada paso toma el primer giro de la cola (si hay) como nueva `dir`, mueve la cabeza una celda y, si no comió, quita la cola.
  - Mover la cabeza a la celda que ocupa la cola en ese momento está permitido si en ese paso no come (la cola se va).
- Cola de giros:
  - Cada dirección de `turns` se compara con la última dirección encolada (o con `dir` si la cola está vacía).
  - Se descarta si es igual o la opuesta; si no, se encola. La cola guarda como mucho 2 giros y descarta los que sobran.
  - Se vacía al perder una vida.
- Fruta:
  - Celda libre y tipo elegidos con `rng`, de forma uniforme entre las celdas libres y entre las 21 frutas.
  - Al comerla: `score += 10 × nivel` con el nivel previo a comer, `length += 1`, `frutas += 1`, y si `frutas % 5 === 0` sube el nivel. Después aparece la siguiente fruta.
  - Si no queda celda libre: `status = "gameover"`, `won = true`, `fruit = null`.
- Choque (pared o cuerpo):
  - Pasa a `"crash"` durante 0,8 s (`crashT` de 0 a 1): la serpiente queda quieta y el render la hace parpadear en magenta.
  - Al terminar, si quedan vidas, `lives −= 1`, la serpiente reaparece en `(16, 12)`, `(15, 12)`, `(14, 12)` mirando a la derecha y pasa a `"ready"`. La fruta se mantiene salvo que quede bajo la serpiente nueva, en cuyo caso se vuelve a sortear.
  - Si era la última vida: `lives = 0`, `status = "gameover"`, `won = false`.
- En `"ready"` la serpiente no se mueve. El primer giro válido (cualquiera salvo `left`) o `go` la pone en `"playing"`; un giro válido también se aplica en el primer paso.
- La partida empieza directamente en `"playing"`: el Espacio o click de la pantalla de inicio no pasa por `"ready"`.
- En `"playing"`, `go` se ignora. Tras `"gameover"`, `update` solo avanza `endT` (en 1 s) e ignora el input.
- Animación de fin, sin texto: en derrota, la serpiente se apaga segmento por segmento desde la cola; en victoria, la pared parpadea en verde `#00ff88`.
- Frutas: se dibujan con `drawImage` desde `fruitsImg` y `imageSmoothingEnabled = false`, encajadas en la celda (alto de 25 px y ancho proporcional, centradas), con un glow suave. Mientras `fruitsImg` es `null` se dibuja un núcleo neón magenta.
- El HUD recibe `{ score, lives, level, extra: { label: "Largo", value: String(length) } }`; la celda extra está siempre visible.
- Controles:
  - `←` `↑` `→` `↓` y `W` `A` `S` `D` (mayúsculas o minúsculas) encolan su dirección en `keydown`, incluso con `e.repeat`, porque la cola descarta los repetidos.
  - Espacio (sin `e.repeat`) encola `go`.
  - `preventDefault` de esas teclas en `keydown` y `keyup`.
- El modal se abre 1 s después de pasar a `"gameover"`, sea derrota o victoria; la puntuación final es la acumulada.
- El juego no escucha `P` ni `Escape`: la pausa es del reproductor.
- Con `paused`, los listeners no capturan teclas ni hacen `preventDefault`, y `turns` / `go` pendientes se descartan.
- La puntuación enviada es entera y está dentro del rango 1–10.000.000 de `submit_score`: aun casi llenando la grilla en cada una de las 3 vidas (unas 2.300 frutas, nivel ~460), el máximo teórico queda por debajo de 6.000.000.
- `playable` de `serpentina` en la DB y su entrada en `PLAYABLE_GAMES` llegan juntos en esta spec.
- `references/` no se modifica: el PNG se copia.

## Plan de implementación

1. Crear `lib/snake/fruits.ts` con `FruitKind`, `FRUIT_KINDS` y `FRUIT_SPRITES` según la tabla. Verificar con `npx tsc --noEmit` que hay 21 frutas.
2. Crear `lib/snake/engine.ts` con `SnakeGame`:
   - Grilla, estado inicial, paso por tiempo acumulado y velocidad por nivel.
   - Cola de giros, fruta al azar con `rng`, puntos, largo y niveles.
   - Choque con pared y cuerpo, `"crash"`, reaparición en `"ready"`, derrota y victoria por grilla llena.
   - `crashT`, `endT` y `onStats` solo al cambiar un campo.
   - Verificar con `npx tsc --noEmit` y con `grep` que no hay `window`, `document`, `requestAnimationFrame`, `Audio`, `Image` ni React.
3. Copiar `references/source-assests/snake-assets/fruits.png` a `public/games/serpentina/fruits.png`. Antes, consultar en `node_modules/next/dist/docs/` cómo sirve esta versión de Next la carpeta `public/`.
4. Crear `lib/snake/render.ts`:
   - Fondo, grilla tenue, pared, fruta (sprite o núcleo neón) y serpiente con glow.
   - Parpadeo de choque y animación de fin según el resultado.
   - Sin HUD ni textos.
   - Usar `/frontend-design` para los tonos, la cabeza, los segmentos, la grilla, la pared y el glow.
   - Comprobar a ojo, con una captura, que cada `FruitKind` muestra la fruta de su nombre.
5. Crear `components/games/snake.tsx` (`SnakeCanvas`) copiando la estructura de `components/games/asteroids.tsx` (sección 6 de `.claude/skills/nuevo-juego/contrato.md`):
   - Canvas 800×600 con `devicePixelRatio`.
   - `new Image()` de `/games/serpentina/fruits.png` en el efecto de montaje; el juego no espera al `onload` (usa el núcleo neón mientras tanto).
   - Loop rAF con `dt` capado a 50 ms que se detiene con `paused`.
   - Flechas, WASD y Espacio con `preventDefault` en `keydown` y `keyup`.
   - Overlay de inicio "PULSA ESPACIO PARA EMPEZAR" con los controles: Flechas / WASD mover, Espacio seguir tras un choque, `P` pausa. Diseñado con `/frontend-design`.
   - `onStats` traducido al HUD y `onGameOver` con 1 s de retraso.
   - Limpieza de rAF, listeners y timeout al desmontar.
6. Registrar `SnakeCanvas` como `serpentina` en `components/games/registry.ts`.
7. En `lib/games.ts`, cambiar el `long` de `serpentina` a: "Una serpiente de luz recorre la grilla devorando frutas pixel art. Cada bocado la alarga y cada cinco la acelera. Tienes tres vidas: chocar contra el muro o morder tu propia cola te devuelve al centro." y `best` de 7820 a 3900.
8. Crear la migración con `npm run db:new -- playable_serpentina` y aplicarla con `npm run db:push`. Verificar con `execute_sql` que `submit_score('serpentina','TEST',100)` inserta y que `get_leaderboard('serpentina')` la devuelve. Borrar la fila de prueba.
9. Probar en `npm run dev` con Playwright (sección 9 de `contrato.md`):
   - `/juegos/serpentina/jugar`: inicio, movimiento, giros rápidos, frutas, puntos, Largo, cambio de nivel y velocidad, choque con pared y con el cuerpo, reaparición, pausa, fin, guardar, Salón, JUGAR DE NUEVO, SALIR y volver.
   - `/salon-de-la-fama?juego=serpentina` y `/juegos/serpentina` con la marca guardada.
   - `/juegos/rocas/jugar`, `/juegos/caida/jugar` y `/juegos/bloque-buster/jugar` intactos y `/juegos/gloton/jugar` en MODO DEMO.
   - Revisar la consola.
10. Correr `npm run lint`, `npx tsc --noEmit`, `npm run build` y `get_advisors` (security) del MCP.

## Criterios de aceptación

- [ ] `npm run lint`, `npx tsc --noEmit` y `npm run build` terminan sin errores.
- [ ] Ningún archivo de `lib/snake/` referencia `window`, `document`, `requestAnimationFrame`, `Audio`, `Image` ni React.
- [ ] `FRUIT_KINDS` tiene 21 frutas y en el juego cada fruta dibujada corresponde a una pieza de la fila pixel art (nunca el bol ni un recorte partido).
- [ ] `public/games/serpentina/fruits.png` existe y `references/source-assests/snake-assets/` no cambió.
- [ ] `/juegos/serpentina/jugar` muestra un canvas dentro del CRT con el overlay "PULSA ESPACIO PARA EMPEZAR" y los controles.
- [ ] Antes de empezar, el HUD muestra 0 puntos, `♥♥♥`, nivel 01 y Largo 3.
- [ ] Pulsar Espacio (o hacer click en el CRT) inicia la partida con la serpiente de 3 segmentos en el centro avanzando a la derecha, y hay una fruta pixel art en el tablero.
- [ ] Flechas y WASD giran la serpiente; pulsar la dirección opuesta no la invierte; dos giros rápidos dentro del mismo paso (p. ej. `↑` y `←`) se aplican en dos pasos seguidos; la página no hace scroll con las flechas ni con Espacio.
- [ ] Comer una fruta en el nivel 1 suma 10 puntos, sube Largo en 1 y aparece otra fruta en una celda libre.
- [ ] Al comer la 5.ª fruta, el HUD pasa a nivel 02, la serpiente va visiblemente más rápida y las frutas siguientes suman 20.
- [ ] Chocar con la pared o con el propio cuerpo hace parpadear la serpiente en magenta, el HUD pierde un `♥` y la serpiente reaparece en el centro con Largo 3, quieta; los puntos y el nivel se mantienen.
- [ ] Tras reaparecer, una dirección (salvo `←`) o Espacio la ponen en marcha.
- [ ] Al perder la tercera vida, la serpiente se apaga desde la cola y ~1 s después se abre FIN DEL JUEGO con la puntuación del HUD; el canvas no dibuja texto.
- [ ] El modal muestra GUARDAR PUNTUACIÓN (no "MODO DEMO — NO PUNTÚA"); al guardar muestra `▸ PUNTUACIÓN GUARDADA_` y VER SALÓN DE LA FAMA.
- [ ] Tras guardar, `/salon-de-la-fama?juego=serpentina` y `/juegos/serpentina` muestran la marca (top, MEJOR GLOBAL y PARTIDAS) sin recargar a mano.
- [ ] `public.games` tiene `serpentina` con `playable = true` y `npx supabase migration list` muestra `playable_serpentina` aplicada en local y remoto.
- [ ] El detalle `/juegos/serpentina` muestra el texto nuevo de frutas y vidas, y la tarjeta de la biblioteca muestra 3.900 como mejor marca.
- [ ] FIN a mitad de partida abre el modal con la puntuación actual.
- [ ] JUGAR DE NUEVO deja el HUD en 0 / `♥♥♥` / 01 / Largo 3 y muestra de nuevo "PULSA ESPACIO PARA EMPEZAR".
- [ ] PAUSA, `P` y `Escape` congelan y reanudan la serpiente sin que salte celdas; cambiar de pestaña deja la partida en pausa.
- [ ] Con el juego en pausa, las flechas no encolan giros: al reanudar, la serpiente sigue en su dirección.
- [ ] Ir a SALIR y volver a `/juegos/serpentina/jugar` no duplica la velocidad ni los giros.
- [ ] La serpiente y la pared se ven nítidas y las frutas sin borroneo con `devicePixelRatio` 2.
- [ ] `/juegos/rocas/jugar`, `/juegos/caida/jugar` y `/juegos/bloque-buster/jugar` siguen funcionando y `/juegos/gloton/jugar` sigue en MODO DEMO.
- [ ] `get_advisors` (security) no suma avisos.
- [ ] No hay errores ni warnings de hidratación en la consola en `/juegos/serpentina/jugar`.

## Decisiones

- **Sí:** reusar la entrada `serpentina` del catálogo. Ya describe una serpiente que crece en una grilla, y tiene portada `cover-snake` y fila en `public.games`.
- **No:** id nuevo `snake`. Obliga a otra entrada, otra portada y una migración `insert`, y deja SERPENTINA como demo duplicada.
- **Sí:** frutas de la fila pixel art de `fruits.png`, con los recortes de `sprites.js` y los nombres corregidos. Encaja con la grilla y la estética retro; es el asset que trajo el usuario.
- **No:** filas plana o realista (habría que medir de nuevo) ni frutas vectoriales.
- **Sí:** excluir el bol de frutas (última pieza de la fila). No es una fruta y desentona como objetivo.
- **Sí:** copiar el PNG entero, sin recortarlo. Pesa ~570 KB; recortarlo a la fila usada es una optimización para otra spec.
- **Sí:** no esperar al `onload` para empezar; se dibuja un núcleo neón mientras carga la imagen. Evita bloquear el inicio por la red.
- **Sí:** grilla de 32×24 celdas de 25 px en un mundo de 800×600. Llena el CRT 4:3 sin encuadre extra.
- **No:** 40×30 de 20 px ni 20×15 de 40 px.
- **Sí:** pared mortal en el borde.
- **No:** bordes que se atraviesan (wrap).
- **Sí:** 3 vidas con reaparición en el centro, quieta hasta pulsar una dirección o Espacio, conservando puntos y nivel. Coherente con el saque manual de BLOQUE BUSTER: el jugador decide cuándo seguir.
- **No:** Snake clásico de una vida ni velocidad continua sin niveles.
- **Sí:** nivel cada 5 frutas y velocidad de 8 a 20 pasos por segundo (+1 por nivel).
- **Sí:** `10 × nivel` puntos por fruta. Premia llegar lejos sin frutas especiales.
- **No:** frutas con valores distintos ni fruta dorada temporal.
- **Sí:** celda extra "Largo", siempre visible.
- **No:** celda "Próx. nivel" ni omitir `extra`.
- **Sí:** cola de hasta 2 giros por paso con flechas y WASD. Evita perder giros rápidos y la inversión de 180° en el mismo paso.
- **No:** solo flechas con un giro por paso.
- **Sí:** victoria al llenar la grilla, con un campo `won` en `SnakeStats` para la animación de fin. Es casi inalcanzable, pero evita un estado sin celda para la fruta.
- **Sí:** animación de choque de 0,8 s y animación de fin distinta por resultado, sin texto en canvas.
- **No:** sonido. No hay audio de referencia; queda para otra spec.
- **Sí:** cambiar el `long` de `serpentina` para que hable de frutas y vidas en lugar de "núcleos magenta", y bajar `best` a 3900 (unas 60 frutas, nivel 12), una marca exigente pero alcanzable.
- **Sí:** mantener `short`, `cover-snake` y `difficulty: 2`.
- **Sí:** `rng` inyectable en el motor (por defecto `Math.random`), para poder reproducir partidas al depurar.
- **Sí:** habilitar el leaderboard con una migración de datos. Las funciones y pantallas de SPEC 06 ya son genéricas.
- **No:** regenerar `database.types.ts`. No cambia el esquema.
- **Sí:** motor sin DOM en `lib/snake/` y Client Component, como ROCAS. Permite limpiar loop, listeners e imagen al navegar.

## Riesgos

| Riesgo                                                                                 | Mitigación                                                                                                          |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Loops rAF o listeners que sobreviven al desmontar (Strict Mode monta dos veces en dev) | Cleanup completo en cada `useEffect`; el criterio de SALIR y volver lo detecta.                                     |
| `onStats` en cada frame re-renderiza el HUD                                            | El motor solo emite cuando cambia `score`, `lives`, `level`, `length`, `status` o `won`.                            |
| Espacio activa el botón con foco (PAUSA, SALIR)                                        | `preventDefault` en `keydown` y `keyup` de las teclas capturadas; el inicio por click quita el foco de los botones. |
| Las teclas capturadas bloquean escribir en el input del modal (WASD, flechas)          | Con `paused` no se capturan teclas.                                                                                 |
| Recortes de sprite mal nombrados o desplazados                                         | Tabla corregida en esta spec y comprobación visual de cada `FruitKind` en el paso 4.                                |
| Sprites borrosos al reducir 160 px a 25 px                                             | `imageSmoothingEnabled = false` y escala con `devicePixelRatio`; criterio de nitidez con DPR 2.                     |
| `dt` enorme al reanudar hace que la serpiente salte varias celdas                      | Se reinicia el timestamp al reanudar y `dt` se capa a 50 ms (como mucho 1 paso a 20 pasos/s).                       |
| Giros que se pierden o permiten morderse con dos teclas rápidas                        | Cola de 2 giros validada contra el último giro encolado, no contra `dir`.                                           |
| `playable` y `PLAYABLE_GAMES` desincronizados                                          | Componente y migración en la misma spec; si la DB rechaza, el modal muestra el error de guardado.                   |

## Lo que **no** entra en esta spec

- Sonido.
- Frutas especiales, power-ups, obstáculos y modo wrap.
- Recortar el PNG o usar sus otras filas.
- Controles táctiles y móvil.
- Tests automatizados.

Cada uno de esos, si llega, va en su propia spec.

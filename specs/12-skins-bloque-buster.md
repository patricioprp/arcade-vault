# SPEC 12 — Skins BLOQUE BUSTER (NEÓN, RETRO, CLÁSICO)

> **Estado:** aprobado
> **Depende de:** SPEC 05, SPEC 06, SPEC 08, SPEC 10
> **Fecha:** 2026-11-04
> **Objetivo:** Sacar los colores fijos de `lib/arkanoid/render.ts` a 3 paletas (`neon`, `retro`, `clasico`) sobre la base de skins de la SPEC 10, y sumar `bloque-buster` a `SKINNED_GAMES` para que el selector aparezca en su reproductor.

## Por qué existe esta spec

Auditoría de BLOQUE BUSTER (`bloque-buster`, `lib/arkanoid/`, `components/games/arkanoid.tsx`) del 2026-11-04:

| Juego         | `neon` | `retro` | `clasico` | Estado    | Hallazgos                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------- | ------ | ------- | --------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BLOQUE BUSTER | No     | No      | No        | SIN SKINS | No existe `lib/arkanoid/skins.ts`. `render.ts` tiene colores fijos en `lib/arkanoid/render.ts:12-20` (`BLOCK_RGB`), `:22-27` (`COLORS`), `:37` (`#000`), `:63-64` (marco `rgba`/`rgb` armados a mano), `:86`, `:91`, `:93` (relleno, glow y borde del bloque), `:100` (brillo blanco), `:112` (fogonazo blanco), `:121`, `:123` (estallido), `:142` (chispas `rgba(${white}, 245, 255, …)`), `:157` (relleno de la paleta), `:166` (núcleo de la paleta) y `:193` (núcleo `#fff` de la pelota). |

Otros hallazgos:

- `components/games/arkanoid.tsx:38-42`: `ArkanoidCanvas` no recibe `skin`; llama a `drawArkanoid(ctx, game, now)` en `:94` (montaje) y `:125` (loop).
- `components/games/registry.ts:35`: `SKINNED_GAMES` tiene `"rocas"` y `"caida"`, falta `"bloque-buster"`; el reproductor no muestra el selector en este juego.
- Contraste actual (trazo de cada elemento contra el fondo `#000000`): todo ≥ 5,48:1 (el más justo es `hotpink` `#ff006e`). La paleta `neon` es una **extracción exacta**, sin cambios visibles.
- El color del bloque (`BlockColor`, `lib/arkanoid/levels.ts:3-4`) es solo cosmético: todos valen 10 puntos y se rompen de un golpe (`lib/arkanoid/engine.ts:58`). Ninguna skin tiene que preservar un significado de juego por color.
- La base de skins la crea la **SPEC 10** (`specs/10-skins-rocas.md`): `lib/skins.ts`, `lib/skin-store.ts` (`useSkin`, clave `av_skin`), la prop `skin: SkinId` en `PlayableGameProps` (`components/games/registry.ts:18`), `SKINNED_GAMES`, el selector del reproductor y el contrato. Esta spec los usa tal cual y no los redefine.

## Alcance

**Entra:**

- `lib/arkanoid/skins.ts`: tipo `ArkanoidPalette`, helper puro `mixHex` y `SKINS` con `neon`, `retro` y `clasico`.
- `lib/arkanoid/render.ts`: `drawArkanoid(ctx, game, palette, now)`, sin colores fijos; transparencias con `ctx.globalAlpha`.
- `components/games/arkanoid.tsx`: prop `skin`, `skinRef`, `SKINS[skinRef.current]` en montaje y loop, efecto `[skin]` que redibuja.
- `components/games/registry.ts`: sumar `"bloque-buster"` a `SKINNED_GAMES`.

**Fuera de alcance (para specs futuras):**

- `lib/skins.ts`, `lib/skin-store.ts`, el selector, `av_skin`, la prop `skin` en `PlayableGameProps`, `contrato.md` y `plantilla-spec.md`: son de la SPEC 10.
- Skins de ROCAS (SPEC 10), CAÍDA (SPEC 11) y SERPENTINA (SPEC 13).
- Unificar `mixHex` (hoy en `lib/tetris/skins.ts`) en un helper compartido.
- El overlay de inicio de `arkanoid.tsx` (título, controles y `PULSA ESPACIO PARA EMPEZAR`): es UI de la plataforma en Tailwind y queda igual en las 3 skins.
- La portada `cover-bricks` del catálogo.
- Cambios en `lib/arkanoid/engine.ts` y `lib/arkanoid/levels.ts` (tamaños, velocidades, niveles, puntos).

## Modelo de datos

De la SPEC 10 se usan, sin cambios: `SkinId` de `@/lib/skins`, `useSkin()` de `@/lib/skin-store` (clave `av_skin`, lo consume solo `GamePlayer`), la prop `skin: SkinId` de `PlayableGameProps` y `SKINNED_GAMES`.

```ts
// components/games/registry.ts (único cambio: agregar "bloque-buster")
export const SKINNED_GAMES: ReadonlySet<string> = new Set([
  "rocas",
  "caida",
  "bloque-buster",
]);
// Si la SPEC 13 (SERPENTINA) se mergea antes, el Set conserva "serpentina" y suma "bloque-buster".
```

```ts
// lib/arkanoid/skins.ts — sin DOM: solo datos y un helper puro
import type { SkinId } from "@/lib/skins";
import type { BlockColor } from "./levels";

// Todos los colores en hex "#rrggbb" de 6 dígitos; transparencias en claves …Alpha (convención de la SPEC 10).
export type ArkanoidPalette = {
  background: string; // fondo de todo el canvas
  // Marco (paredes izquierda, techo y derecha)
  frame: string;
  frameAlpha: number;
  frameWidth: number; // lineWidth del marco
  frameGlow: number; // shadowBlur del marco (0 = sin glow)
  // Marco con victoria: parpadea entre "on" y "off"
  win: string;
  winAlphaOff: number; // alpha en la fase apagada; en la encendida es 1
  winWidth: number;
  winGlowOn: number;
  winGlowOff: number;
  // Bloques
  blocks: Record<BlockColor, string>; // red · hotpink · magenta · yellow · cyan · green · gray
  blockFillAlpha: number; // alpha del relleno del bloque
  blockStrokeWidth: number;
  blockOutline: string | null; // null = borde del color del bloque
  blockGlow: number; // shadowBlur del borde del bloque
  sheen: string; // brillo horizontal arriba a la izquierda
  sheenAlpha: number; // 0 = no se dibuja
  // Estallido de bloque (150 ms)
  flash: string; // fogonazo del primer 35 %
  flashAlpha: number; // alpha inicial del fogonazo, baja a 0
  explosionGlow: number; // shadowBlur del contorno que se expande
  // Chispas de la paleta desintegrada (derrota)
  sparkFrom: string; // color con endT = 0; también es su shadowColor
  sparkTo: string; // color con endT = 1
  sparkGlow: number;
  // Paleta del jugador (cápsula)
  paddle: string; // borde y glow
  paddleFillAlpha: number; // relleno del color de la paleta
  paddleGlow: number;
  paddleCore: string; // línea central
  paddleCoreAlpha: number;
  // Pelota
  ball: string; // relleno y glow
  ballGlow: number;
  ballCore: string; // núcleo de radio r × 0,5
  ballCoreAlpha: number; // 0 = sin núcleo
  blend: "lighter" | "source-over"; // globalCompositeOperation de estallidos y chispas
};

// Interpola dos "#rrggbb" en RGB y devuelve "#rrggbb" (redondeo por canal, t en [0, 1]).
// Copia local del helper de lib/tetris/skins.ts (ver Decisiones).
export function mixHex(a: string, b: string, t: number): string;

export const SKINS = { neon, retro, clasico } satisfies Record<
  SkinId,
  ArkanoidPalette
>;
```

### Paleta `neon` (por defecto, extracción exacta del look actual)

```ts
const neon: ArkanoidPalette = {
  background: "#000000", // render.ts:37
  frame: "#00f5ff", // render.ts:23 — --cyan
  frameAlpha: 0.25, // render.ts:63
  frameWidth: 2, // render.ts:66
  frameGlow: 6, // render.ts:65
  win: "#00ff88", // render.ts:24 — --green
  winAlphaOff: 0.3,
  winWidth: 3,
  winGlowOn: 22,
  winGlowOff: 6,
  blocks: {
    red: "#ff2d2d", // render.ts:13
    hotpink: "#ff006e", // render.ts:14 — --magenta
    magenta: "#c34bff", // render.ts:15
    yellow: "#f5ff00", // render.ts:16 — --yellow
    cyan: "#00f5ff", // render.ts:17 — --cyan
    green: "#00ff88", // render.ts:18 — --green
    gray: "#8a8fb5", // render.ts:19 — --ink-dim
  },
  blockFillAlpha: 0.2, // render.ts:86
  blockStrokeWidth: 2,
  blockOutline: null,
  blockGlow: 8, // render.ts:92
  sheen: "#ffffff", // render.ts:100
  sheenAlpha: 0.45,
  flash: "#ffffff", // render.ts:112
  flashAlpha: 0.7,
  explosionGlow: 16, // render.ts:122
  sparkFrom: "#00f5ff", // rgba(0, 245, 255) de render.ts:142 con endT = 0
  sparkTo: "#fff5ff", // rgba(255, 245, 255) con endT = 1 (el verde queda en 245)
  sparkGlow: 8, // render.ts:144
  paddle: "#00f5ff", // render.ts:25
  paddleFillAlpha: 0.25, // render.ts:157
  paddleGlow: 14, // render.ts:156
  paddleCore: "#ffffff", // render.ts:166
  paddleCoreAlpha: 0.85,
  ball: "#f5ff00", // render.ts:26
  ballGlow: 18, // render.ts:186
  ballCore: "#ffffff", // render.ts:193
  ballCoreAlpha: 1,
  blend: "lighter", // render.ts:48
};
```

### Paleta `retro` (fósforo ámbar `#ffb000`)

Cuatro intensidades del mismo tono para los elementos jugables, más dos de decorado. Fondo `#0a0700`, el mismo que `retro` de ROCAS y CAÍDA.

| Intensidad | Hex       | Uso                                                       |
| ---------- | --------- | --------------------------------------------------------- |
| A (máxima) | `#ffd060` | pelota, bloques `yellow`, victoria                        |
| B          | `#ffb000` | paleta, bloques `cyan` y `green`                          |
| C          | `#d99600` | bloques `red` y `magenta`                                 |
| D          | `#b37b00` | bloques `hotpink` y `gray`                                |
| núcleo     | `#ffe8a8` | núcleo de pelota y paleta, fogonazo, final de las chispas |
| marco      | `#996900` | paredes                                                   |
| fondo      | `#0a0700` | fondo casi negro cálido                                   |

El reparto A/B/C/D garantiza que **dos filas contiguas nunca comparten intensidad** en ninguno de los 5 niveles (`yellow`, `cyan`, `magenta` y `hotpink` son vecinos entre sí en algún nivel, por eso hacen falta 4):

- Nivel 1 (`red`, `yellow`, `cyan`, `magenta`, `hotpink`, `green`): C · A · B · C · D · B.
- Nivel 2 (`gray`, `cyan`, `hotpink`, `yellow`, `magenta`, `green`): D · B · D · A · C · B.
- Nivel 3 (`yellow` arriba, `magenta` abajo): A · C.
- Nivel 4 (`cyan`, `magenta`, `green`, `yellow`, `hotpink`, `red`): B · C · B · A · D · C.
- Nivel 5 (marco `cyan`, cruz `hotpink`): B · D.

```ts
const retro: ArkanoidPalette = {
  background: "#0a0700",
  frame: "#996900",
  frameAlpha: 1,
  frameWidth: 2,
  frameGlow: 4,
  win: "#ffd060",
  winAlphaOff: 0.3,
  winWidth: 3,
  winGlowOn: 10,
  winGlowOff: 4,
  blocks: {
    red: "#d99600", // C
    hotpink: "#b37b00", // D
    magenta: "#d99600", // C
    yellow: "#ffd060", // A
    cyan: "#ffb000", // B
    green: "#ffb000", // B
    gray: "#b37b00", // D
  },
  blockFillAlpha: 0.3,
  blockStrokeWidth: 2,
  blockOutline: null,
  blockGlow: 4,
  sheen: "#ffe8a8",
  sheenAlpha: 0,
  flash: "#ffe8a8",
  flashAlpha: 0.5,
  explosionGlow: 8,
  sparkFrom: "#ffb000",
  sparkTo: "#ffe8a8",
  sparkGlow: 4,
  paddle: "#ffb000",
  paddleFillAlpha: 0.25,
  paddleGlow: 6,
  paddleCore: "#ffe8a8",
  paddleCoreAlpha: 0.7,
  ball: "#ffd060",
  ballGlow: 8,
  ballCore: "#ffe8a8",
  ballCoreAlpha: 1,
  blend: "lighter",
};
```

### Paleta `clasico` (Arkanoid, Taito 1986)

Fondo azul marino, paredes de metal gris, ladrillos opacos con contorno negro, paleta "Vaus" plateada con franja roja y pelota blanca. Sin glow.

```ts
const clasico: ArkanoidPalette = {
  background: "#0a1450",
  frame: "#a8a8a8",
  frameAlpha: 1,
  frameWidth: 3,
  frameGlow: 0,
  win: "#20e020",
  winAlphaOff: 0.3,
  winWidth: 3,
  winGlowOn: 0,
  winGlowOff: 0,
  blocks: {
    red: "#ff4030", // rojo
    hotpink: "#ff9000", // naranja
    magenta: "#ff40ff", // rosa
    yellow: "#ffe800", // amarillo
    cyan: "#00e8e8", // celeste
    green: "#20e020", // verde
    gray: "#bcbcbc", // plateado
  },
  blockFillAlpha: 1,
  blockStrokeWidth: 2,
  blockOutline: "#000000",
  blockGlow: 0,
  sheen: "#ffffff",
  sheenAlpha: 0,
  flash: "#ffffff",
  flashAlpha: 0.7,
  explosionGlow: 0,
  sparkFrom: "#d0d0d0",
  sparkTo: "#ffffff",
  sparkGlow: 0,
  paddle: "#d0d0d0",
  paddleFillAlpha: 1,
  paddleGlow: 0,
  paddleCore: "#ff4030",
  paddleCoreAlpha: 1,
  ball: "#ffffff",
  ballGlow: 0,
  ballCore: "#ffffff",
  ballCoreAlpha: 0,
  blend: "source-over",
};
```

### Firmas que cambian

```ts
// lib/arkanoid/render.ts — paleta justo después de game, como drawAsteroids (SPEC 10)
export function drawArkanoid(
  ctx: CanvasRenderingContext2D,
  game: ArkanoidGame,
  palette: ArkanoidPalette,
  now: number,
): void;
// drawFrame, drawBlock, drawExplosion, drawSpark, drawPaddle y drawBall reciben `palette`.
// Se borran BLOCK_RGB y COLORS. FRAME_INSET y BLOCK_GAP quedan iguales.
// Transparencias siempre con ctx.globalAlpha, nunca armando rgba() a mano.
```

```tsx
// components/games/arkanoid.tsx (cambios)
export function ArkanoidCanvas({
  paused,
  skin,
  onStats,
  onGameOver,
}: PlayableGameProps);
// skinRef = useRef(skin), actualizado en el useEffect sin deps junto a onStatsRef / onGameOverRef.
// Montaje: drawArkanoid(ctx, game, SKINS[skinRef.current], performance.now()).
// Loop: drawArkanoid(ctx, game, SKINS[skinRef.current], ts).
// `skin` NO entra en las deps del montaje ni del loop: cambiarla no recrea ArkanoidGame ni reinicia el rAF.
// Efecto [skin]: si hay ctx y game, drawArkanoid(ctx, game, SKINS[skin], performance.now())
// (antes de empezar, en pausa o con el modal).
```

**Convenciones:**

- Default, persistencia (`av_skin`), hidratación y selector: los de la SPEC 10. BLOQUE BUSTER solo consume `skin`.
- Cambio en caliente: elegir otra skin a mitad de partida no remonta el juego (no toca `runKey`), no pausa y no cambia puntaje, vidas, nivel, bloques restantes, ni posición o velocidad de pelota y paleta.
- `drawFrame(ctx, palette, won, now)`:
  - Sin victoria: `strokeStyle = frame`, `globalAlpha = frameAlpha`, `lineWidth = frameWidth`, `shadowBlur = frameGlow`.
  - Con victoria: `strokeStyle = win`, `globalAlpha = on ? 1 : winAlphaOff`, `lineWidth = winWidth`, `shadowBlur = on ? winGlowOn : winGlowOff`.
  - `shadowColor` = el mismo color del trazo. Mismo parpadeo `Math.sin(now / 55) > 0`.
- `drawBlock(ctx, palette, b)`, con `c = blocks[b.color]`:
  - Relleno: `globalAlpha = blockFillAlpha`, `fillStyle = c`, mismo `roundRect(x, y, w, h, 4)`.
  - Borde: `globalAlpha = 1`, `strokeStyle = blockOutline ?? c`, `lineWidth = blockStrokeWidth`, `shadowColor = c`, `shadowBlur = blockGlow`; si es 0 no se setea sombra.
  - Brillo: solo si `sheenAlpha > 0`, `globalAlpha = sheenAlpha`, mismo rectángulo `(x + 5, y + 4, w × 0,35, 2)`.
- `drawExplosion(ctx, palette, e)`, con `t` como hoy:
  - Fogonazo si `t < 0,35`: `fillStyle = flash`, `globalAlpha = flashAlpha × (1 − t / 0,35)`.
  - Contorno: `strokeStyle = blocks[e.color]`, `globalAlpha = 1 − t`, `shadowBlur = explosionGlow`, mismo `grow` y grosor `2 + 2 × (1 − t)`.
- `drawSpark(ctx, palette, s, endT)`: `fillStyle = mixHex(sparkFrom, sparkTo, endT)`, `globalAlpha = 1 − endT`, `shadowColor = sparkFrom`, `shadowBlur = sparkGlow`, mismo cuadrado de 3 px. Con `neon` da exactamente el `rgba(${white}, 245, 255, a)` actual.
- Estallidos y chispas se dibujan con `globalCompositeOperation = blend` (hoy `"lighter"`).
- `drawPaddle(ctx, palette, p)`: relleno `paddle` con `globalAlpha = paddleFillAlpha`, borde `paddle` con alpha 1 y `shadowBlur = paddleGlow`; línea central `paddleCore` con `globalAlpha = paddleCoreAlpha`, `lineWidth` 2 y `lineCap = "round"`, mismas coordenadas.
- `drawBall(ctx, palette, b)`: círculo `ball` con `shadowBlur = ballGlow`, mismo radio `r − 1`; núcleo `ballCore` de radio `r × 0,5` solo si `ballCoreAlpha > 0`.
- Cada función usa `save`/`restore` para que `globalAlpha`, `shadowBlur` y `lineWidth` no se filtren a la siguiente.
- Glow por skin:
  - `neon`: igual que hoy (bloques 8, marco 6, victoria 22/6, estallido 16, chispas 8, paleta 14, pelota 18).
  - `retro`: suave (bloques 4, marco 4, victoria 10/4, estallido 8, chispas 4, paleta 6, pelota 8).
  - `clasico`: `shadowBlur = 0` en todo.
- Geometría intacta: `WORLD_W`/`WORLD_H` (800×600), bloques 64×24 con `BLOCK_GAP` 3 y radio 4, paleta 81×14, pelota 16, `FRAME_INSET` 1,5, tamaño del brillo, crecimiento del estallido y chispas de 3 px no cambian. Solo cambian color, alpha, glow, grosor de trazo y fondo.
- Contraste (WCAG, trazo de cada elemento contra `background`; luminancias: `#000000` 0, `#0a0700` 0,0022, `#0a1450` 0,0114):

| Skin    | Fondo     | red  | hotpink | magenta | yellow | cyan | green | gray | Paleta | Pelota |
| ------- | --------- | ---- | ------- | ------- | ------ | ---- | ----- | ---- | ------ | ------ |
| neon    | `#000000` | 5,67 | 5,48    | 5,77    | 19,2   | 15,5 | 15,7  | 6,68 | 15,5   | 19,2   |
| retro   | `#0a0700` | 7,97 | 5,51    | 7,97    | 13,8   | 11,0 | 11,0  | 5,51 | 11,0   | 13,8   |
| clasico | `#0a1450` | 4,91 | 7,52    | 6,05    | 13,7   | 11,2 | 9,56  | 9,00 | 11,1   | 17,1   |

- Todos ≥ 4,5:1. Los más justos: `red` de `clasico` (4,91:1) y `hotpink` de `neon` (5,48:1).
- Fuera del mínimo, por no ser elementos jugables: el marco (decorado; `neon` 1,74:1 con `frameAlpha` 0,25 como hoy, `retro` 4,19:1, `clasico` 7,19:1), el relleno translúcido de los bloques en `neon` y `retro` (el borde es lo que se mide), el brillo, el fogonazo y las chispas.
- En `retro` los bloques de igual intensidad (`red`/`magenta`, `cyan`/`green`, `hotpink`/`gray`) nunca quedan en filas contiguas; paleta (cápsula) y pelota (círculo) se distinguen de los bloques (rectángulos) por forma y posición.

## Plan de implementación

1. Partir de la rama con la SPEC 10 ya mergeada (usa `lib/skins.ts`, `PlayableGameProps.skin` y `SKINNED_GAMES`).
2. Crear `lib/arkanoid/skins.ts` con `ArkanoidPalette`, `mixHex` y las 3 paletas de esta spec, exportadas como `SKINS … satisfies Record<SkinId, ArkanoidPalette>`, sin `Partial` ni `as`. Verificar con `npx tsc --noEmit`.
3. Refactorizar `lib/arkanoid/render.ts`:
   - Firma `drawArkanoid(ctx, game, palette, now)`; borrar `BLOCK_RGB` y `COLORS`.
   - Reemplazar cada color fijo por su clave de la paleta (los comentarios de origen están en la paleta `neon`) y cada `rgba(…)` por color hex + `globalAlpha`.
   - Reemplazar el `"lighter"` fijo por `palette.blend`.
   - Verificar con `Grep` de `#[0-9a-fA-F]{3,8}|rgba?\(` sobre `lib/arkanoid/render.ts`: cero resultados.
4. Adaptar `components/games/arkanoid.tsx`: prop `skin`, `skinRef`, `SKINS[skinRef.current]` en las 2 llamadas a `drawArkanoid`, efecto `[skin]` que redibuja. Verificar con `npx tsc --noEmit`.
5. En `components/games/registry.ts`, sumar `"bloque-buster"` a `SKINNED_GAMES` sin quitar los ids que ya estén (incluido `"serpentina"` si la SPEC 13 entró antes).
6. Usar `/frontend-design` para revisar las 3 skins en pantalla (azul de fondo y grosor del marco de `clasico`, reparto de intensidades de `retro`). Si cambia algún valor, actualizar esta spec y recalcular su contraste.
7. Antes de tocar cualquier API de Next, consultar `node_modules/next/dist/docs/` (en principio no hace falta ninguna: todo es cliente).
8. Probar con Playwright en `npm run dev`, `/juegos/bloque-buster/jugar`:
   - El selector `NEÓN` · `RETRO` · `CLÁSICO` aparece en el HUD con la skin guardada activa.
   - Cambiar a cada skin antes de empezar, en pausa y en plena partida; captura por skin en los niveles 1 y 2.
   - Comparar la captura `neon` con una de `main`: idéntica.
   - En plena partida, cambiar de skin no reinicia puntaje, vidas, nivel ni bloques; la pelota sigue su trayectoria.
   - Recargar y JUGAR DE NUEVO: la skin persiste.
   - Perder en cada skin (chispas de la paleta) y, si es posible, ganar un nivel (marco que parpadea) en al menos `retro` y `clasico`.
   - `/juegos/rocas/jugar` y `/juegos/caida/jugar` siguen con selector; `/juegos/serpentina/jugar` según el estado de la SPEC 13, funcionando igual.
   - Consola sin errores ni warnings de hidratación.
9. Correr `npm run lint`, `npx tsc --noEmit` y `npm run build`.

## Criterios de aceptación

- [ ] `npm run lint`, `npx tsc --noEmit` y `npm run build` terminan sin errores.
- [ ] `lib/arkanoid/skins.ts` exporta `SKINS` con `neon`, `retro` y `clasico`, tipado con `satisfies Record<SkinId, ArkanoidPalette>`, sin `Partial` ni `as`, todos los colores en `#rrggbb`.
- [ ] `Grep` de `#[0-9a-fA-F]{3,8}|rgba?\(` sobre `lib/arkanoid/render.ts` no devuelve resultados.
- [ ] `lib/arkanoid/engine.ts` y `lib/arkanoid/levels.ts` no cambian.
- [ ] `SKINNED_GAMES` contiene `"rocas"`, `"caida"` y `"bloque-buster"`, y `/juegos/bloque-buster/jugar` muestra el selector `NEÓN` · `RETRO` · `CLÁSICO`.
- [ ] Con `neon` (default), BLOQUE BUSTER se ve idéntico a `main`: bloques, marco, estallidos, chispas, paleta y pelota.
- [ ] Con `retro`, todo el canvas es ámbar sobre `#0a0700`, sin otro tono, y ninguna pareja de filas contiguas comparte intensidad en los niveles 1 a 5.
- [ ] Con `clasico`, fondo azul `#0a1450`, ladrillos opacos con contorno negro, paleta plateada con franja roja, pelota blanca y ningún glow.
- [ ] Cambiar de skin en plena partida no reinicia puntaje, vidas, nivel, bloques ni la trayectoria de la pelota.
- [ ] Cambiar de skin antes de empezar o en pausa se ve al instante en el canvas.
- [ ] La misma secuencia de jugadas da el mismo puntaje en las 3 skins (motor intacto).
- [ ] La skin persiste al recargar y al pasar por JUGAR DE NUEVO.
- [ ] Las animaciones de fin (chispas en la derrota, marco que parpadea en la victoria) funcionan en las 3 skins.
- [ ] Contrastes de la tabla de Convenciones ≥ 4,5:1 para los 7 colores de bloque, la paleta y la pelota.
- [ ] Sin errores ni warnings de hidratación en la consola.
- [ ] ROCAS y CAÍDA siguen con sus skins; SERPENTINA funciona igual que antes de esta spec.

## Decisiones

- **Sí:** reutilizar sin cambios la base de la SPEC 10 (`lib/skins.ts`, `useSkin`, `av_skin`, prop `skin`, selector, contrato) y solo sumar `"bloque-buster"` a `SKINNED_GAMES`.
- **Sí:** firma `drawArkanoid(ctx, game, palette, now)`, con la paleta en tercer lugar como `drawAsteroids` (SPEC 10). BLOQUE BUSTER sí usa `now` (parpadeo de victoria).
- **Sí:** colores en hex `#rrggbb` y transparencias con claves `…Alpha` + `ctx.globalAlpha`, convención compartida de la SPEC 10.
- **Sí:** `neon` como extracción exacta, sin retoques: todos sus elementos jugables ya pasan 4,5:1 (mínimo 5,48:1).
- **Sí:** `sparkTo` = `#fff5ff` en `neon`: el render actual sube solo el rojo (`rgba(${white}, 245, 255)`), así que el final no es blanco puro.
- **Sí:** copia local de `mixHex` en `lib/arkanoid/skins.ts`.
- **No:** importarlo de `@/lib/tetris/skins` (acopla dos juegos) ni moverlo a `lib/skins.ts` ahora (archivo de la SPEC 10 que SERPENTINA toca en paralelo). La unificación queda para una spec de limpieza.
- **No:** simular las chispas con dos capas de alpha: con `source-over` en `clasico` no da el mismo color.
- **Sí:** ámbar `#ffb000` en `retro`, igual que ROCAS y CAÍDA, con su fondo `#0a0700`. La skin `retro` se reconoce igual en toda la plataforma.
- **No:** verde `#33ff66`: rompería la coherencia entre juegos y no aporta legibilidad extra.
- **Sí:** 4 intensidades en `retro` (A `#ffd060`, B `#ffb000`, C `#d99600`, D `#b37b00`). `yellow`, `cyan`, `magenta` y `hotpink` son vecinos de a pares en algún nivel; con 3 intensidades habría filas contiguas iguales.
- **No:** patrones dentro del bloque en `retro` (como CAÍDA): el color del bloque no tiene significado de juego, alcanza con separar filas por intensidad.
- **Sí:** pelota en la intensidad máxima (`#ffd060`, 13,8:1) con núcleo `#ffe8a8`: es el elemento que más hay que seguir.
- **Sí:** `clasico` inspirado en Arkanoid (Taito, 1986): fondo azul marino, paredes grises, ladrillos opacos de colores, paleta Vaus plateada con franja roja, pelota blanca.
- **Sí:** en `clasico`, `hotpink` → naranja `#ff9000` y `magenta` → rosa `#ff40ff`: Arkanoid tiene naranja y rosa, y así las 7 claves dan 7 tonos distintos.
- **Sí:** rojo `#ff4030` en `clasico` (4,91:1). Un rojo más puro como `#ff3020` queda en 4,64:1, demasiado justo sobre el azul.
- **No:** el fondo azul con patrón de Arkanoid: agregaría geometría; queda color plano.
- **No:** biseles o brillo en los ladrillos de `clasico` (`sheenAlpha` 0): la regla es colores planos y los acercaría a `neon`.
- **Sí:** `blend` `"source-over"` en `clasico`: `"lighter"` es un efecto de neón.
- **Sí:** `skinRef` + efecto `[skin]` en el componente, como ROCAS y CAÍDA. Cambio en caliente sin reiniciar el loop ni la partida.
- **No:** meter `skin` en las deps del montaje: recrearía `ArkanoidGame` y los `Audio`.
- **No:** cambiar el overlay de inicio ni el `aria-label` del canvas por skin: son UI de la plataforma.

## Riesgos

| Riesgo                                                                  | Mitigación                                                                                                                           |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Hidratación por leer `localStorage` en el render inicial                | Lo resuelve `useSkin` de la SPEC 10 (`getServerSnapshot = DEFAULT_SKIN`); BLOQUE BUSTER solo dibuja en el canvas, dentro de efectos. |
| Cambiar de skin reinicia la partida o duplica el loop                   | `skin` fuera de las deps del montaje y del loop; se lee por `skinRef`. Criterio de cambio a mitad de partida.                        |
| `shadowBlur` caro en `retro` con 60 bloques                             | `blockGlow` 4 (hoy 8 en `neon`); `clasico` en 0 y sin setear sombra.                                                                 |
| `globalAlpha` o `shadowBlur` que se filtran de un bloque a la pelota    | `save`/`restore` en cada función de dibujo; alpha explícito en cada capa.                                                            |
| Las chispas cambian de color al pasar a `mixHex`                        | `sparkFrom`/`sparkTo` reproducen los extremos actuales con el mismo redondeo; comparar la captura de derrota `neon` con `main`.      |
| Conflicto en `SKINNED_GAMES` con la SPEC 13 (SERPENTINA) en paralelo    | Cambio de una línea; al mergear, el `Set` conserva todos los ids. Paso 5 y criterio lo explicitan.                                   |
| Dos copias de `mixHex` (CAÍDA y BLOQUE BUSTER) que se desincronizan     | Función pura de 8 líneas con el mismo cuerpo; la unificación queda anotada en Fuera de alcance.                                      |
| Contraste insuficiente al retocar tonos con `/frontend-design`          | Tabla de contraste en esta spec; todo cambio de valor la recalcula antes de implementar.                                             |
| Colores fijos olvidados en `render.ts` (brillo, fogonazo, núcleos)      | `Grep` del paso 3 y criterio de aceptación con cero coincidencias.                                                                   |
| La portada `cover-bricks` y el overlay de inicio no cambian con la skin | Aceptado: fuera de alcance, igual que en las SPEC 10 y 11.                                                                           |

## Lo que **no** entra en esta spec

- El sistema compartido de skins (SPEC 10).
- Skins de ROCAS, CAÍDA y SERPENTINA.
- Skins extra más allá de las 3 obligatorias.
- Overlay de inicio y portada `cover-bricks` según la skin.
- Unificar `mixHex` en un helper compartido.
- Cambios en el motor, los niveles, la puntuación o la velocidad de BLOQUE BUSTER.
- Tests automatizados.

Cada uno de esos, si llega, va en su propia spec.

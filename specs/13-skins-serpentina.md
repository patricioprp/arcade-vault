# SPEC 13 — Skins SERPENTINA (NEÓN, RETRO, CLÁSICO)

> **Estado:** aprobado
> **Depende de:** SPEC 05, SPEC 06, SPEC 09, SPEC 10
> **Fecha:** 2026-11-04
> **Objetivo:** Sacar los colores fijos de `lib/snake/render.ts` a 3 paletas (`neon`, `retro`, `clasico`) sobre la base de skins de la SPEC 10, y sumar `serpentina` a `SKINNED_GAMES` para que el selector aparezca en su reproductor.

## Por qué existe esta spec

Auditoría de SERPENTINA (`serpentina`, `lib/snake/`, `components/games/snake.tsx`) del 2026-11-04:

| Juego      | `neon` | `retro` | `clasico` | Estado    | Hallazgos                                                                                                                                                                                                                                                                                                                                                                                    |
| ---------- | ------ | ------- | --------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SERPENTINA | No     | No      | No        | SIN SKINS | No existe `lib/snake/skins.ts`. `render.ts` tiene colores fijos en `lib/snake/render.ts:9-19` (`COLORS`, con tuplas RGB que el `Grep` no detecta en `:10-13` y `:15-17`), `:31` (`#000`), `:77-78` (pared), `:102-103` (halo), `:114` (sombra de la fruta), `:119-120` (núcleo de carga), `:130` y `:134` (`mix` del cuerpo), `:154`, `:189`, `:200` (ojos) y `:222-223` (anillo de choque). |

Otros hallazgos:

- `components/games/snake.tsx:44-48`: `SnakeCanvas` no recibe skin; llama a `drawSnake(ctx, game, img, now)` en `:88`, `:96` y `:127`.
- `components/games/registry.ts:35`: `SKINNED_GAMES` no incluye `"serpentina"`.
- Contraste actual por debajo de 4,5:1 en dos elementos jugables (fondo `#000000`):
  - Cola de la serpiente `[11, 90, 58]` = `#0b5a3a` (`render.ts:17`): **2,54:1**. El cuerpo es obstáculo (morderlo es choque).
  - Pared: cian `#00f5ff` con alpha 0,35 (`render.ts:77`), compuesto `#005659`: **2,48:1**. Tocarla es choque.
- Las frutas son sprites pixel art multicolor (`public/games/serpentina/fruits.png`, recortes en `lib/snake/fruits.ts`). Un monitor monocromo no puede mostrarlas en color: hace falta teñirlas.
- La base de skins existe por la **SPEC 10** (`lib/skins.ts`, `lib/skin-store.ts` con `useSkin` y clave `av_skin`, prop `skin: SkinId` en `PlayableGameProps`, `SKINNED_GAMES`, selector del reproductor, contrato y plantilla). Esta spec la usa tal cual.

## Alcance

**Entra:**

- `lib/snake/skins.ts`: tipo `SnakePalette`, helpers puros `mixHex` y `withAlpha`, y `SKINS` con `neon`, `retro` y `clasico`.
- `lib/snake/render.ts`: `drawSnake(ctx, game, palette, fruitsImg, now)`, sin colores fijos.
- Teñido de las frutas (`fruitTint`): silueta del sprite en un solo color, cacheada por imagen y color. Lo usan `retro` y `clasico`.
- `components/games/snake.tsx`: prop `skin`, `skinRef`, `SKINS[skinRef.current]` en las 3 llamadas, efecto `[skin]` que redibuja.
- `components/games/registry.ts`: sumar `"serpentina"` a `SKINNED_GAMES`.
- Ajustes de contraste en `neon`: cola `#0b5a3a` → `#0f8a5a` y alpha de la pared 0,35 → 0,55.

**Fuera de alcance (para specs futuras):**

- `lib/skins.ts`, `lib/skin-store.ts`, el selector, `av_skin`, la prop `skin`, `contrato.md` y `plantilla-spec.md`: son de la SPEC 10.
- Skins de ROCAS (SPEC 10), CAÍDA (SPEC 11) y BLOQUE BUSTER (SPEC 12).
- Mover `mixHex` a un módulo compartido.
- El overlay de inicio de `snake.tsx` (`SERPENTINA` en `neon-green`, `PULSA ESPACIO PARA EMPEZAR`): es UI de la plataforma en Tailwind y queda igual en las 3 skins.
- La portada `cover-snake` del catálogo.
- Cambios en `lib/snake/engine.ts`, `lib/snake/fruits.ts` y `public/games/serpentina/fruits.png`.

## Modelo de datos

De la SPEC 10 se usan, sin cambios: `SkinId` de `@/lib/skins`, `useSkin()` de `@/lib/skin-store` (clave `av_skin`, lo consume solo `GamePlayer`), la prop `skin: SkinId` de `PlayableGameProps` y `SKINNED_GAMES`.

```ts
// components/games/registry.ts (único cambio): sumar "serpentina" sin quitar ninguno.
// Si la SPEC 12 ya se mergeó, el set también contiene "bloque-buster".
export const SKINNED_GAMES: ReadonlySet<string> = new Set([
  "rocas",
  "caida",
  "serpentina",
]);
```

```ts
// lib/snake/skins.ts — sin DOM: solo datos y helpers puros
import type { SkinId } from "@/lib/skins";

// Colores en hex "#rrggbb"; transparencias con claves …Alpha (convención de la SPEC 10).
export type SnakePalette = {
  background: string; // relleno de todo el canvas
  gridDot: string; // puntos en las intersecciones de la grilla
  gridDotAlpha: number;
  wall: string; // borde del área de juego
  wallAlpha: number;
  wallWidth: number; // lineWidth de la pared
  wallGlow: number; // shadowBlur de la pared (0 = sin glow)
  win: string; // pared al ganar (parpadea)
  winWidth: number;
  winAlphaOff: number; // alpha en la fase apagada del parpadeo (la encendida es 1)
  winGlowOn: number;
  winGlowOff: number;
  halo: string; // halo radial bajo la fruta
  haloAlpha: number; // alpha base; 0 = no se dibuja
  haloBreathAlpha: number; // se suma × respiración (0 → 1)
  fruitTint: string | null; // null = sprite con sus colores; color = silueta teñida
  fruitGlow: number; // shadowBlur del sprite (0 = sin sombra)
  fruitGlowAlpha: number; // alpha del color de la sombra (sombra = withAlpha(halo, fruitGlowAlpha))
  fruitCore: string; // núcleo circular mientras carga la imagen
  fruitCoreGlow: number;
  head: string; // cabeza (cuadrado redondeado)
  eye: string; // ojos de la cabeza
  headGlow: number; // shadowBlur base de la cabeza
  headGlowPulse: number; // se suma × pulso en "ready"
  neck: string; // primer segmento del cuerpo
  tail: string; // último segmento; el resto interpola con mixHex
  glow: string; // color del trazo de fondo del cuerpo y de la sombra de la cabeza
  bodyGlow: number; // shadowBlur del trazo de fondo del cuerpo
  crash: string; // cuerpo en choque y derrota, núcleo del anillo
  crashRingGlow: number; // shadowBlur del anillo de choque
};

// Interpola dos "#rrggbb" en RGB y devuelve "#rrggbb" (redondeo por canal, t en [0, 1]).
// Mismo resultado que mix() de render.ts. Copia de la de lib/tetris/skins.ts (ver Decisiones).
export function mixHex(a: string, b: string, t: number): string;

// "#rrggbb" + alpha → "#rrggbbaa" (alpha × 255 redondeado, 2 dígitos hex).
// Solo para paradas de degradé y shadowColor, donde globalAlpha no sirve.
export function withAlpha(hex: string, alpha: number): string;

export const SKINS = { neon, retro, clasico } satisfies Record<
  SkinId,
  SnakePalette
>;
```

### Paleta `neon` (por defecto, el look actual)

```ts
const neon: SnakePalette = {
  background: "#000000", // render.ts:31
  gridDot: "#00f5ff", // --cyan, render.ts:18
  gridDotAlpha: 0.09,
  wall: "#00f5ff", // --cyan, render.ts:10
  wallAlpha: 0.55, // cambia (antes 0,35) para llegar a 4,5:1
  wallWidth: 2,
  wallGlow: 8,
  win: "#00ff88", // --green, render.ts:11
  winWidth: 3,
  winAlphaOff: 0.3,
  winGlowOn: 22,
  winGlowOff: 6,
  halo: "#f5ff00", // --yellow, render.ts:13
  haloAlpha: 0.22,
  haloBreathAlpha: 0.12,
  fruitTint: null, // sprite original
  fruitGlow: 8,
  fruitGlowAlpha: 0.6,
  fruitCore: "#ff006e", // --magenta, render.ts:119
  fruitCoreGlow: 14,
  head: "#c8ffe6", // [200, 255, 230], render.ts:15
  eye: "#03140d", // render.ts:200
  headGlow: 10,
  headGlowPulse: 14,
  neck: "#00ff88", // [0, 255, 136], render.ts:16
  tail: "#0f8a5a", // cambia (antes #0b5a3a, render.ts:17) para llegar a 4,5:1
  glow: "#00ff88", // render.ts:14
  bodyGlow: 16,
  crash: "#ff006e", // --magenta, render.ts:12
  crashRingGlow: 18,
};
```

### Paleta `retro` (fósforo ámbar `#ffb000`)

Cuatro intensidades del mismo tono, las mismas de CAÍDA y ROCAS: **A** `#ffb000` (100 %), **B** `#d99600` (85 %), **C** `#b37b00` (70 %) y apagado `#5c3f00`, sobre `#0a0700`. La cabeza es A, el cuerpo baja de B a C, la pared es C y la fruta es una silueta A.

```ts
const retro: SnakePalette = {
  background: "#0a0700",
  gridDot: "#ffb000",
  gridDotAlpha: 0.08,
  wall: "#b37b00", // C
  wallAlpha: 1,
  wallWidth: 2,
  wallGlow: 4,
  win: "#ffb000", // A
  winWidth: 3,
  winAlphaOff: 0.3,
  winGlowOn: 10,
  winGlowOff: 3,
  halo: "#ffb000",
  haloAlpha: 0.12,
  haloBreathAlpha: 0.08,
  fruitTint: "#ffb000", // silueta A
  fruitGlow: 4,
  fruitGlowAlpha: 0.5,
  fruitCore: "#ffb000",
  fruitCoreGlow: 6,
  head: "#ffb000", // A
  eye: "#0a0700",
  headGlow: 4,
  headGlowPulse: 6,
  neck: "#d99600", // B
  tail: "#b37b00", // C
  glow: "#d99600",
  bodyGlow: 6,
  crash: "#ffb000", // el cuerpo entero salta a A y parpadea
  crashRingGlow: 8,
};
```

### Paleta `clasico` (Snake de Nokia, LCD verde)

Homenaje al Snake de los Nokia 6110/3310: pantalla LCD verde claro y píxeles oscuros, todo plano y sin glow. Dos tintas: **tinta** `#43523d` (cuerpo, pared, fruta) y **tinta fuerte** `#263021` (cabeza, choque, victoria).

```ts
const clasico: SnakePalette = {
  background: "#c7f0d8", // LCD
  gridDot: "#43523d",
  gridDotAlpha: 0.15,
  wall: "#43523d",
  wallAlpha: 1,
  wallWidth: 3,
  wallGlow: 0,
  win: "#263021",
  winWidth: 3,
  winAlphaOff: 0.3,
  winGlowOn: 0,
  winGlowOff: 0,
  halo: "#43523d",
  haloAlpha: 0, // sin halo
  haloBreathAlpha: 0,
  fruitTint: "#43523d", // silueta en tinta
  fruitGlow: 0,
  fruitGlowAlpha: 0,
  fruitCore: "#43523d",
  fruitCoreGlow: 0,
  head: "#263021",
  eye: "#c7f0d8", // ojos del color del LCD
  headGlow: 0,
  headGlowPulse: 0,
  neck: "#43523d",
  tail: "#43523d", // cuerpo uniforme, como el original
  glow: "#43523d",
  bodyGlow: 0,
  crash: "#263021", // el cuerpo parpadea entre tinta fuerte y tinta al 45 %
  crashRingGlow: 0,
};
```

### Firmas que cambian

```ts
// lib/snake/render.ts — paleta justo después de game (SPEC 10)
export function drawSnake(
  ctx: CanvasRenderingContext2D,
  game: SnakeGame,
  palette: SnakePalette,
  fruitsImg: HTMLImageElement | null,
  now: number,
): void;
// drawDots, drawWall, drawFruit, segmentColor, drawBody, drawHead y drawCrashRing reciben `palette`.
// Se borran COLORS y mix (reemplazado por mixHex de ./skins).
// BODY_W (17), HEAD_SIZE (21), WALL_INSET (1,5), radio 6 de la cabeza, ojos (f 5, s 4,5, e 3,5),
// núcleo de 6 px y radios del halo y del anillo no cambian.

// Silueta teñida, cacheada a nivel de módulo:
// WeakMap<HTMLImageElement, Map<string, HTMLCanvasElement>>.
// Primera vez por (img, color): canvas de naturalWidth × naturalHeight, drawImage(img),
// globalCompositeOperation = "source-in", fillStyle = color, fillRect completo.
function tintedFruits(img: HTMLImageElement, color: string): HTMLCanvasElement;
```

```tsx
// components/games/snake.tsx (cambios)
export function SnakeCanvas({
  paused,
  skin,
  onStats,
  onGameOver,
}: PlayableGameProps);
// skinRef = useRef(skin), actualizado en el useEffect sin deps junto a onStatsRef / onGameOverRef.
// Montaje, img.onload y loop llaman drawSnake(ctx, game, SKINS[skinRef.current], img, now).
// `skin` NO entra en las deps del montaje ni del loop: cambiarla no recrea SnakeGame ni reinicia el rAF.
// Efecto [skin]: si hay ctx y game, redibuja un frame con
// drawSnake(ctx, game, SKINS[skin], imgRef.current, performance.now())
// (antes de empezar, en pausa o con el modal).
```

**Convenciones:**

- Default, persistencia (`av_skin`), hidratación y selector: los de la SPEC 10. SERPENTINA solo consume `skin`.
- Cambio en caliente: elegir otra skin a mitad de partida no remonta el juego (no toca `runKey`), no pausa y no cambia puntos, vidas, nivel, largo, posición ni fruta.
- Transparencias:
  - Rellenos y trazos: color hex + `ctx.globalAlpha` (pared `wallAlpha`, parpadeo de victoria `1`/`winAlphaOff`, puntos `gridDotAlpha`, anillo `1 − crashT`). `globalAlpha` también atenúa la sombra, igual que hoy el alpha del `rgba()`.
  - Halo: paradas `palette.halo` → `withAlpha(palette.halo, 0)`, rellenado con `globalAlpha = haloAlpha + respiración × haloBreathAlpha`. Si `haloAlpha` es 0 no se dibuja.
  - Sombra del sprite: `shadowColor = withAlpha(palette.halo, fruitGlowAlpha)`, solo si `fruitGlow > 0`.
- Fruta:
  - `fruitTint === null`: `drawImage(img, …)` como hoy.
  - Con color: `drawImage(tintedFruits(img, fruitTint), …)` con el mismo recorte y destino; `imageSmoothingEnabled = false` en ambos casos.
  - Mientras carga la imagen: núcleo de 6 px en `fruitCore` con `fruitCoreGlow`.
- Cuerpo: trazo de fondo en `glow` (o `crash` en modo choque) con `bodyGlow`; encima cada tramo con `mixHex(neck, tail, i / (n − 1))` o `crash`. El parpadeo del choque (alpha 1 / 0,45) y el apagado de la derrota (`1 − endT × 0,6`) no cambian.
- Cabeza: `head` con `shadowColor = glow` y `shadowBlur = headGlow + headGlowPulse × pulso`; ojos en `eye` sin sombra.
- Si un `shadowBlur` da 0 no se setea `shadowColor`.
- Glow por skin:
  - `neon`: igual que hoy (cuerpo 16, cabeza 10 + 14, pared 8, victoria 22/6, fruta 8, núcleo 14, anillo 18).
  - `retro`: suave (cuerpo 6, cabeza 4 + 6, pared 4, victoria 10/3, fruta 4, núcleo 6, anillo 8).
  - `clasico`: `shadowBlur = 0` en todo.
- Geometría intacta: grilla de 32 × 24 celdas de 25 px, grosor del tubo, tamaño de la cabeza, ojos, núcleo, puntos de 2 px y radios. Solo cambian color, alpha, glow y el grosor de la pared (`wallWidth`, que no es hitbox: el choque lo decide el motor por celdas).
- Contraste WCAG contra `background` (luminancia relativa L entre paréntesis):

| Skin    | Fondo (L)          | Cabeza | Cuello | Cola | Pared | Fruta             | Núcleo | Choque | Ojos vs cabeza |
| ------- | ------------------ | ------ | ------ | ---- | ----- | ----------------- | ------ | ------ | -------------- |
| neon    | `#000000` (0)      | 18,9   | 15,7   | 4,80 | 4,84  | sprite multicolor | 5,48   | 5,48   | 17,0           |
| retro   | `#0a0700` (0,0022) | 11,0   | 7,97   | 5,51 | 5,51  | 11,0 (silueta A)  | 11,0   | 11,0   | 11,0           |
| clasico | `#c7f0d8` (0,794)  | 11,1   | 6,72   | 6,72 | 6,72  | 6,72 (silueta)    | 6,72   | 11,1   | 11,1           |

- Pared de `neon` medida como el compuesto `#00878c` (cian `#00f5ff` × 0,55 sobre negro), sin contar el glow.
- Todos ≥ 4,5:1. Los más justos son la cola (4,80:1) y la pared (4,84:1) de `neon`, que hoy dan 2,54:1 y 2,48:1.
- La fruta de `neon` es el sprite original (SPEC 09) sobre su halo amarillo: no es un solo color y queda como está; en `retro` y `clasico` la silueta teñida sí se mide.
- Fuera del mínimo, por no ser elementos jugables: puntos de la grilla, halo, pared de victoria en su fase apagada, el cuerpo atenuado al 45 % durante el parpadeo de choque y el apagado de la derrota.
- En `retro`, cabeza, fruta y choque comparten A: la cabeza se distingue por forma (cuadrado redondeado de 21 px con ojos), la fruta por su silueta y halo, y el choque es un estado de toda la serpiente. Cola y pared comparten C: una es tubo dentro de la grilla y la otra el borde del canvas.
- En `clasico`, cuerpo, pared y fruta comparten tinta `#43523d`: tubo, borde y silueta de fruta tienen formas distintas, como en el original.

## Plan de implementación

1. Partir de la rama con la SPEC 10 ya mergeada (usa `lib/skins.ts`, `PlayableGameProps.skin` y `SKINNED_GAMES`).
2. Crear `lib/snake/skins.ts` con `SnakePalette`, `mixHex`, `withAlpha` y las 3 paletas de esta spec, exportadas como `SKINS … satisfies Record<SkinId, SnakePalette>`, sin `Partial` ni `as`. Verificar con `npx tsc --noEmit`.
3. Refactorizar `lib/snake/render.ts`:
   - Firma `drawSnake(ctx, game, palette, fruitsImg, now)`; borrar `COLORS` y `mix`.
   - Reemplazar cada color fijo por su clave (comentarios de origen en la paleta `neon`); cada `rgba(…)` por hex + `globalAlpha` o `withAlpha` según las Convenciones.
   - Agregar `tintedFruits` con su caché y usarlo cuando `fruitTint` no es `null`.
   - Verificar con `Grep` de `#[0-9a-fA-F]{3,8}|rgba?\(` sobre `lib/snake/render.ts`: cero resultados. Revisar a ojo que no queden tuplas RGB sueltas (`[200, 255, 230]`, `"0, 245, 255"`).
4. Adaptar `components/games/snake.tsx`: prop `skin`, `skinRef`, `SKINS[skinRef.current]` en las 3 llamadas a `drawSnake`, efecto `[skin]` que redibuja. Verificar con `npx tsc --noEmit`.
5. En `components/games/registry.ts`, sumar `"serpentina"` a `SKINNED_GAMES` sin quitar los ids que ya tenga.
6. Usar `/frontend-design` para revisar las 3 skins en pantalla (lectura de la silueta de las frutas, grosor de la pared en `clasico`, glow de `retro`). Si cambia algún valor, actualizar esta spec y recalcular su contraste.
7. Antes de tocar cualquier API de Next, consultar `node_modules/next/dist/docs/` (en principio no hace falta ninguna: todo es cliente).
8. Probar con Playwright en `npm run dev`, `/juegos/serpentina/jugar`:
   - El selector `NEÓN` · `RETRO` · `CLÁSICO` aparece en el HUD con la skin guardada activa.
   - Cambiar a cada skin antes de empezar, en pausa y en plena partida; captura por skin.
   - Comparar la captura `neon` con una de `main`: idéntica salvo la cola más clara y la pared más visible.
   - En plena partida, cambiar de skin no reinicia puntaje, vidas, nivel, largo ni fruta.
   - Recargar y JUGAR DE NUEVO: la skin persiste.
   - En cada skin: chocar (parpadeo y anillo), volver en "ready" (cabeza que late) y perder la última vida (apagado de la cola a la cabeza, abre el modal).
   - Las frutas se ven como silueta ámbar en `retro` y en tinta oscura en `clasico`, sin recuadros alrededor.
   - `/juegos/rocas/jugar` y `/juegos/caida/jugar` siguen con selector; `/juegos/bloque-buster/jugar` funciona igual que antes (con o sin selector según la SPEC 12).
   - Consola sin errores ni warnings de hidratación.
9. Correr `npm run lint`, `npx tsc --noEmit` y `npm run build`.

## Criterios de aceptación

- [ ] `npm run lint`, `npx tsc --noEmit` y `npm run build` terminan sin errores.
- [ ] `lib/snake/skins.ts` exporta `SKINS` con `neon`, `retro` y `clasico`, tipado con `satisfies Record<SkinId, SnakePalette>`, sin `Partial` ni `as`, todos los colores en `#rrggbb`.
- [ ] `Grep` de `#[0-9a-fA-F]{3,8}|rgba?\(` sobre `lib/snake/render.ts` no devuelve resultados y no quedan tuplas RGB.
- [ ] `lib/snake/engine.ts`, `lib/snake/fruits.ts` y `public/games/serpentina/fruits.png` no cambian.
- [ ] `SKINNED_GAMES` contiene `"serpentina"` además de los ids previos, y `/juegos/serpentina/jugar` muestra el selector.
- [ ] Con `neon`, SERPENTINA se ve igual que en `main` salvo la cola (`#0f8a5a`) y la pared (alpha 0,55).
- [ ] Con `retro`, todo el canvas es ámbar sobre `#0a0700`, sin otro tono, incluidas las frutas.
- [ ] Con `clasico`, fondo LCD `#c7f0d8`, serpiente, pared y frutas en tinta oscura, cabeza más oscura, sin glow ni halo.
- [ ] Cambiar de skin en plena partida no reinicia puntaje, vidas, nivel, largo, posición ni fruta.
- [ ] Cambiar de skin antes de empezar o en pausa se ve al instante en el canvas.
- [ ] La misma secuencia de jugadas da el mismo puntaje y nivel en las 3 skins (motor intacto).
- [ ] La skin persiste al recargar y al pasar por JUGAR DE NUEVO.
- [ ] Choque, "ready", derrota y victoria se animan en las 3 skins.
- [ ] Contrastes de la tabla de Convenciones ≥ 4,5:1 para cabeza, cuerpo, pared, fruta teñida, núcleo y choque.
- [ ] Sin errores ni warnings de hidratación en la consola.
- [ ] ROCAS y CAÍDA siguen con sus skins; BLOQUE BUSTER funciona igual que antes de esta spec.

## Decisiones

- **Sí:** reutilizar sin cambios la base de la SPEC 10 y solo sumar `"serpentina"` a `SKINNED_GAMES`.
- **Sí:** firma `drawSnake(ctx, game, palette, fruitsImg, now)`, con la paleta en tercer lugar como fija la SPEC 10 y `now` último.
- **Sí:** copiar `mixHex` en `lib/snake/skins.ts`. Evita importar de `lib/tetris/` y no toca `lib/skins.ts` mientras BLOQUE BUSTER trabaja en paralelo.
- **No:** mover `mixHex` a `lib/skins.ts` en esta spec: tocaría la base compartida y CAÍDA. Va en su propia spec si se repite en un tercer juego.
- **Sí:** `withAlpha` (`#rrggbbaa`) solo para las paradas del halo y la sombra del sprite. Una parada de degradé no admite `globalAlpha` por separado, y `globalAlpha` en el sprite lo haría translúcido.
- **No:** degradé del halo hacia `background` opaco: oscurecería los puntos de la grilla alrededor de la fruta.
- **No:** parada final `rgba(0, 0, 0, 0)`: interpolar hacia negro transparente cambia el tono del borde según el navegador.
- **Sí:** cambiar la cola de `neon` de `#0b5a3a` a `#0f8a5a` (2,54 → 4,80:1). Legibilidad primero: con una serpiente larga la cola es el obstáculo que más se muerde.
- **Sí:** subir la pared de `neon` de alpha 0,35 a 0,55 (2,48 → 4,84:1). El glow de 8 sigue igual.
- **No:** dejar cola y pared como excepción documentada: los dos son obstáculos que quitan una vida.
- **Sí:** ámbar `#ffb000` en `retro`, con las intensidades, el fondo `#0a0700` y el apagado `#5c3f00` de ROCAS y CAÍDA. La skin `retro` se reconoce igual en toda la plataforma.
- **No:** verde `#33ff66`: chocaría con `clasico` (LCD verde) y con el verde de `neon`; las 3 skins de SERPENTINA quedarían en la misma familia de color.
- **Sí:** frutas teñidas como silueta en `retro` y `clasico` (`source-in` sobre un canvas aparte, cacheado). Mantiene el recorte, el tamaño y la forma de cada fruta con un solo tono.
- **No:** `ctx.filter` (`sepia`, `hue-rotate`): el resultado no da un tono exacto y el soporte en Safari es reciente.
- **No:** mapear la luminancia de cada píxel a 4 intensidades (`getImageData`): más código y más lento para una fruta de 25 px de alto.
- **No:** reemplazar el sprite por un círculo en las skins monocromas: cambiaría la forma de la fruta.
- **Sí:** `clasico` como homenaje al Snake de Nokia (LCD `#c7f0d8`, tinta `#43523d`, cabeza `#263021`), que es el Snake que la mayoría reconoce.
- **No:** paleta Game Boy (`#9bbc0f` con `#0f380f`/`#306230`): el segundo tono da 3,29:1 sobre el fondo.
- **No:** Blockade (1976, blanco sobre negro): se confundiría con `clasico` de ROCAS y con `neon` sin glow.
- **Sí:** cuerpo uniforme en `clasico` (`neck` = `tail`), como el original; la cabeza se distingue por tinta fuerte, tamaño y ojos.
- **Sí:** en `clasico` el choque parpadea entre tinta fuerte y tinta al 45 %, como el parpadeo del Nokia, sin tonos nuevos.
- **Sí:** pared de 3 px en `clasico` y `retro` al ganar: borde sólido de LCD. El choque contra la pared lo decide el motor por celdas, así que no cambia ninguna hitbox.
- **No:** píxeles cuadrados (`lineCap = "butt"`) en `clasico`: sería cambiar geometría.
- **Sí:** `skinRef` + efecto `[skin]` en el componente, como ROCAS y CAÍDA.
- **No:** meter `skin` en las deps del montaje: recrearía `SnakeGame` y la fruta.
- **No:** cambiar el overlay de inicio por skin: es UI de la plataforma (igual que en las SPEC 10 y 11).

## Riesgos

| Riesgo                                                                   | Mitigación                                                                                                                                  |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Hidratación por leer `localStorage` en el render inicial                 | Lo resuelve `useSkin` de la SPEC 10 (`getServerSnapshot = DEFAULT_SKIN`); SERPENTINA solo dibuja en el canvas dentro de efectos.            |
| Cambiar de skin reinicia la partida o duplica el loop                    | `skin` fuera de las deps del montaje y del loop; se lee por `skinRef`. Criterio de cambio a mitad de partida.                               |
| Teñir el atlas en cada frame                                             | Caché `WeakMap` por imagen y `Map` por color: se tiñe una vez por skin. Al desmontar, la imagen se libera y la caché con ella.              |
| El atlas teñido ocupa memoria (`naturalWidth × naturalHeight × 4` bytes) | Como mucho 2 copias (`retro` y `clasico`); se crean solo al elegir esas skins.                                                              |
| Silueta con recuadro si el PNG tuviera fondo opaco                       | Hoy el sprite se dibuja sin recuadro sobre negro, así que el fondo es transparente; se confirma en la captura del paso 8.                   |
| Silueta poco reconocible (se pierden los detalles internos de la fruta)  | Aceptado: es el look de una pantalla monocroma. La fruta sigue distinguiéndose del cuerpo por forma y halo; revisar con `/frontend-design`. |
| `shadowBlur` caro en `retro` con la serpiente larga                      | Un solo trazo con glow para todo el cuerpo (como hoy) y blur 6 en vez de 16; `clasico` en 0 y sin setear sombra.                            |
| `globalAlpha` que queda sucio entre la pared, el halo y el cuerpo        | Cada función usa `save`/`restore`, como hoy.                                                                                                |
| El degradé del cuerpo cambia al pasar de `mix` a `mixHex`                | Mismo redondeo por canal; comparar la captura `neon` con `main` (solo cambia la cola).                                                      |
| Contraste insuficiente al retocar tonos con `/frontend-design`           | Tabla de contraste en esta spec; todo cambio de valor la recalcula antes de implementar.                                                    |
| Colores fijos olvidados (las tuplas RGB no las detecta el `Grep`)        | Borrar `COLORS` entero y revisar a ojo el archivo en el paso 3.                                                                             |
| Conflicto en `registry.ts` con la SPEC 12 (BLOQUE BUSTER) en paralelo    | El único cambio es sumar un id al set: al mergear se conservan los dos.                                                                     |
| La portada `cover-snake` y el overlay de inicio no cambian con la skin   | Aceptado: fuera de alcance, igual que en las SPEC 10 y 11.                                                                                  |

## Lo que **no** entra en esta spec

- El sistema compartido de skins (SPEC 10).
- Skins de ROCAS, CAÍDA y BLOQUE BUSTER.
- Mover `mixHex` a un módulo compartido.
- Skins extra más allá de las 3 obligatorias.
- Overlay de inicio y portada `cover-snake` según la skin.
- Frutas con sprites propios por skin.
- Cambios en el motor, la puntuación o la velocidad de SERPENTINA.
- Tests automatizados.

Cada uno de esos, si llega, va en su propia spec.

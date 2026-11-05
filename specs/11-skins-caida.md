# SPEC 11 — Skins CAÍDA (NEÓN, RETRO, CLÁSICO)

> **Estado:** aprobado
> **Depende de:** SPEC 05, SPEC 06, SPEC 07, SPEC 10
> **Fecha:** 2026-11-04
> **Objetivo:** Sacar los colores fijos de `lib/tetris/render.ts` a 3 paletas (`neon`, `retro`, `clasico`) sobre la base de skins de la SPEC 10, y sumar `caida` a `SKINNED_GAMES` para que el selector aparezca en su reproductor.

## Por qué existe esta spec

Auditoría de CAÍDA (`caida`, `lib/tetris/`, `components/games/tetris.tsx`) del 2026-11-04:

| Juego | `neon` | `retro` | `clasico` | Estado    | Hallazgos                                                                                                                                                                                                                                                                                         |
| ----- | ------ | ------- | --------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CAÍDA | No     | No      | No        | SIN SKINS | No existe `lib/tetris/skins.ts`. `render.ts` tiene colores fijos en `lib/tetris/render.ts:22-31` (`PIECE_RGB`), `:32` (`DEAD_RGB`), `:34-39` (`COLORS`), `:46` (`#000`), `:101` (borde del halo), `:165`, `:168`, `:170` y `:175` (relleno, glow y brillo del bloque) y `:187` (fondo del panel). |

Otros hallazgos:

- `components/games/tetris.tsx:43-47`: `TetrisCanvas` no recibe skin; llama a `drawTetris(ctx, game, font)` en `:93`, `:95` y `:122`.
- Contraste actual: la pieza T (`#aa00ff`, `render.ts:26`) contra el centro del pozo (`#2a004a`) da **3,47:1**, por debajo de 4,5:1.
- La base de skins la crea la **SPEC 10** (`specs/10-skins-rocas.md`): `lib/skins.ts`, `lib/skin-store.ts` (`useSkin`, clave `av_skin`), la prop `skin: SkinId` en `PlayableGameProps`, `SKINNED_GAMES`, el selector del reproductor y el contrato. Esta spec los usa tal cual y no los redefine.

## Alcance

**Entra:**

- `lib/tetris/skins.ts`: tipo `TetrisPalette`, helper puro `mixHex` y `SKINS` con `neon`, `retro` y `clasico`.
- `lib/tetris/render.ts`: `drawTetris(ctx, game, palette, labelFont)`, sin colores fijos; transparencias con `ctx.globalAlpha`.
- Patrón decorativo por pieza (`marks`) dentro de la celda, usado solo en `retro` para distinguir piezas de igual intensidad.
- `components/games/tetris.tsx`: prop `skin`, `skinRef`, `SKINS[skinRef.current]` en montaje y loop, efecto `[skin]` que redibuja.
- `components/games/registry.ts`: sumar `"caida"` a `SKINNED_GAMES`.
- Ajuste de la pieza T en `neon` de `#aa00ff` a `#bb55ff` para llegar a 4,5:1.

**Fuera de alcance (para specs futuras):**

- `lib/skins.ts`, `lib/skin-store.ts`, el selector, `av_skin`, la prop `skin` en `PlayableGameProps`, `contrato.md` y `plantilla-spec.md`: son de la SPEC 10.
- Skins de ROCAS (SPEC 10), BLOQUE BUSTER y SERPENTINA.
- El overlay de inicio de `tetris.tsx` (`PULSA ESPACIO PARA EMPEZAR`): es UI de la plataforma en Tailwind y queda igual en las 3 skins.
- La portada `cover-tetro` del catálogo.
- Cambios en `lib/tetris/engine.ts` y `lib/tetris/pieces.ts`.

## Modelo de datos

De la SPEC 10 se usan, sin cambios: `SkinId` y `SKIN_IDS` de `@/lib/skins`, `useSkin()` de `@/lib/skin-store` (clave `av_skin`, lo consume solo `GamePlayer`), la prop `skin: SkinId` de `PlayableGameProps` y `SKINNED_GAMES`.

```ts
// components/games/registry.ts (único cambio)
export const SKINNED_GAMES: ReadonlySet<string> = new Set(["rocas", "caida"]);
```

```ts
// lib/tetris/skins.ts — sin DOM: solo datos y un helper puro
import type { SkinId } from "@/lib/skins";
import type { PieceType } from "./pieces";

// Patrón dentro de la celda. No cambia el tamaño del bloque ni del área ocupada.
// "dot": cuadrado centrado de round(size / 4) px.
// "cross": X de esquina a esquina del interior (inset + 6), trazo de 2 px.
export type BlockMark = "none" | "dot" | "cross";

// Todos los colores en hex "#rrggbb" de 6 dígitos; transparencias en claves …Alpha (convención de la SPEC 10).
export type TetrisPalette = {
  background: string; // fondo de todo el canvas
  wellInner: string; // centro del halo radial del pozo (opaco)
  wellOuter: string; // borde del halo radial del pozo (opaco)
  gridDot: string; // puntos de la cuadrícula
  gridDotAlpha: number;
  frame: string; // marco del pozo y del panel SIGUIENTE
  frameWidth: number; // lineWidth del marco
  frameAlpha: number;
  frameGlow: number; // shadowBlur del marco (0 = sin glow)
  panelBg: string; // fondo del panel SIGUIENTE
  panelBgAlpha: number;
  label: string; // texto SIGUIENTE
  pieces: Record<PieceType, string>; // 1 I · 2 O · 3 T · 4 S · 5 Z · 6 J · 7 L
  marks: Record<PieceType, BlockMark>;
  dead: string; // color al que se apagan las filas en el fin de partida
  fillAlpha: number; // alpha del relleno del bloque
  deadFillBoost: number; // relleno = fillAlpha + dead × deadFillBoost
  blockStrokeWidth: number;
  blockOutline: string | null; // null = borde del color de la pieza
  blockGlow: number; // shadowBlur del borde del bloque, × (1 − dead)
  sheen: string; // brillo pixel arriba a la izquierda
  sheenAlpha: number; // × (1 − dead); 0 = no se dibuja
  ghostAlpha: number; // alpha de la pieza fantasma
};

// Interpola dos "#rrggbb" en RGB y devuelve "#rrggbb" (redondeo por canal, t en [0, 1]).
// Reemplaza a mix() de render.ts para el apagado de filas, con el mismo resultado.
export function mixHex(a: string, b: string, t: number): string;

export const SKINS = { neon, retro, clasico } satisfies Record<
  SkinId,
  TetrisPalette
>;
```

### Paleta `neon` (por defecto, el look actual)

```ts
const neon: TetrisPalette = {
  background: "#000000", // render.ts:46
  wellInner: "#2a004a", // render.ts:36
  wellOuter: "#06060e", // rgba(10, 10, 24, 0.6) de render.ts:101, ya compuesto sobre #000000
  gridDot: "#e6e9ff", // render.ts:37
  gridDotAlpha: 0.1,
  frame: "#00f5ff", // render.ts:35
  frameWidth: 2,
  frameAlpha: 0.7,
  frameGlow: 12,
  panelBg: "#0a0a18", // render.ts:187
  panelBgAlpha: 0.8,
  label: "#8a8fb5", // render.ts:38
  pieces: {
    1: "#00f5ff", // I
    2: "#f5ff00", // O
    3: "#bb55ff", // T — cambia (antes #aa00ff) para llegar a 4,5:1
    4: "#00ff88", // S
    5: "#ff006e", // Z
    6: "#3d7bff", // J
    7: "#ff7700", // L
  },
  marks: {
    1: "none",
    2: "none",
    3: "none",
    4: "none",
    5: "none",
    6: "none",
    7: "none",
  },
  dead: "#4a4f70", // render.ts:32
  fillAlpha: 0.22,
  deadFillBoost: 0.18,
  blockStrokeWidth: 2,
  blockOutline: null,
  blockGlow: 10,
  sheen: "#ffffff",
  sheenAlpha: 0.6,
  ghostAlpha: 0.2,
};
```

### Paleta `retro` (fósforo ámbar `#ffb000`)

Tres intensidades del mismo tono: **A** `#ffb000` (100 %), **B** `#d99600` (85 %), **C** `#b37b00` (70 %). Cada pieza es una combinación única de intensidad + patrón. Fondo `#0a0700` y apagado `#5c3f00`, los mismos que `retro` de ROCAS (SPEC 10).

```ts
const retro: TetrisPalette = {
  background: "#0a0700",
  wellInner: "#1f1400",
  wellOuter: "#0a0700",
  gridDot: "#ffb000",
  gridDotAlpha: 0.12,
  frame: "#b37b00",
  frameWidth: 2,
  frameAlpha: 1,
  frameGlow: 6,
  panelBg: "#0a0700",
  panelBgAlpha: 1,
  label: "#d99600",
  pieces: {
    1: "#ffb000", // I — A
    2: "#d99600", // O — B
    3: "#b37b00", // T — C
    4: "#ffb000", // S — A
    5: "#d99600", // Z — B
    6: "#b37b00", // J — C
    7: "#ffb000", // L — A
  },
  marks: {
    1: "none",
    2: "none",
    3: "none",
    4: "dot",
    5: "dot",
    6: "cross",
    7: "cross",
  },
  dead: "#5c3f00",
  fillAlpha: 0.35,
  deadFillBoost: 0.1,
  blockStrokeWidth: 2,
  blockOutline: null,
  blockGlow: 4,
  sheen: "#ffb000",
  sheenAlpha: 0,
  ghostAlpha: 0.3,
};
```

### Paleta `clasico` (Tetris Guideline, bloques planos)

```ts
const clasico: TetrisPalette = {
  background: "#2e2e2e",
  wellInner: "#000000",
  wellOuter: "#000000",
  gridDot: "#ffffff",
  gridDotAlpha: 0.14,
  frame: "#c0c0c0",
  frameWidth: 3,
  frameAlpha: 1,
  frameGlow: 0,
  panelBg: "#000000",
  panelBgAlpha: 1,
  label: "#ffffff",
  pieces: {
    1: "#00f0f0", // I — cian
    2: "#f0f000", // O — amarillo
    3: "#b040ff", // T — púrpura aclarado
    4: "#00f000", // S — verde
    5: "#ff2020", // Z — rojo
    6: "#5070ff", // J — azul aclarado
    7: "#f0a000", // L — naranja
  },
  marks: {
    1: "none",
    2: "none",
    3: "none",
    4: "none",
    5: "none",
    6: "none",
    7: "none",
  },
  dead: "#808080",
  fillAlpha: 1,
  deadFillBoost: 0,
  blockStrokeWidth: 2,
  blockOutline: "#000000",
  blockGlow: 0,
  sheen: "#ffffff",
  sheenAlpha: 0,
  ghostAlpha: 0.25,
};
```

### Firmas que cambian

```ts
// lib/tetris/render.ts — paleta justo después de game (SPEC 10); labelFont queda último
export function drawTetris(
  ctx: CanvasRenderingContext2D,
  game: TetrisGame,
  palette: TetrisPalette,
  labelFont: string,
): void;
// drawWell, drawFrame, drawShape, drawBlock y drawNextPanel reciben `palette`.
// Se borran PIECE_RGB, DEAD_RGB, COLORS y mix (reemplazado por mixHex).
// Transparencias siempre con ctx.globalAlpha, nunca armando rgba() a mano.
```

```tsx
// components/games/tetris.tsx (cambios)
export function TetrisCanvas({
  paused,
  skin,
  onStats,
  onGameOver,
}: PlayableGameProps);
// skinRef = useRef(skin), actualizado en el useEffect sin deps junto a onStatsRef / onGameOverRef.
// Montaje (dos llamadas, incluida la de document.fonts.ready) y loop llaman
// drawTetris(ctx, game, SKINS[skinRef.current], fontRef.current).
// `skin` NO entra en las deps del montaje ni del loop: cambiarla no recrea TetrisGame ni reinicia el rAF.
// Efecto [skin]: si hay ctx y game, redibuja un frame con la paleta nueva (antes de empezar, en pausa o con el modal).
```

**Convenciones:**

- Default, persistencia (`av_skin`), hidratación y selector: los de la SPEC 10. CAÍDA solo consume `skin`.
- Cambio en caliente: elegir otra skin a mitad de partida no remonta el juego (no toca `runKey`), no pausa y no cambia puntos, líneas, nivel, tablero ni pieza actual.
- `drawBlock(ctx, palette, x, y, size, type, alpha, dead)`, con `alpha` = 1 o `ghostAlpha`:
  - Color: `c = mixHex(pieces[type], dead, deadness)`.
  - Relleno: `globalAlpha = alpha × (fillAlpha + deadness × deadFillBoost)`, `fillStyle = c`.
  - Borde: `globalAlpha = alpha`, `strokeStyle = blockOutline ?? c`, `lineWidth = blockStrokeWidth`, `shadowColor = c`, `shadowBlur = blockGlow × (1 − deadness)`; si da 0 no se setea sombra.
  - Patrón: si `marks[type] !== "none"`, en `c` con `globalAlpha = alpha` y sin sombra, después del borde.
  - Brillo: solo si `sheenAlpha > 0`, `globalAlpha = alpha × sheenAlpha × (1 − deadness)`, mismo cuadrado que hoy.
- Pozo: degradé radial `wellInner` → `wellOuter` (stops opacos). Puntos con `globalAlpha = gridDotAlpha`. Marco con `frameAlpha`, `frameWidth` y `frameGlow`. Panel con `globalAlpha = panelBgAlpha`.
- Glow por skin:
  - `neon`: igual que hoy (bloques 10, marco 12).
  - `retro`: suave (bloques 4, marco 6).
  - `clasico`: `shadowBlur = 0` en todo.
- Geometría intacta: `CELL`, `BOARD_*`, `PANEL_*`, `NEXT_CELL`, inset de 2 px, tamaño del brillo y puntos de la cuadrícula no cambian. El patrón de `retro` es decoración dentro de la celda.
- Contraste (WCAG, contra el punto más claro del pozo, `wellInner`; contra `wellOuter` es mayor):

| Skin    | Fondo (L)          | I    | O    | T    | S    | Z    | J    | L    | SIGUIENTE vs panel |
| ------- | ------------------ | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ------------------ |
| neon    | `#2a004a` (0,0099) | 12,9 | 16,0 | 4,89 | 13,1 | 4,57 | 4,57 | 6,59 | 6,35               |
| retro   | `#1f1400` (0,0079) | 9,90 | 7,18 | 4,96 | 9,90 | 7,18 | 4,96 | 9,90 | 7,96               |
| clasico | `#000000` (0)      | 14,7 | 17,2 | 5,02 | 13,5 | 5,48 | 5,11 | 9,72 | 21,0               |

- Todos ≥ 4,5:1. Los más justos son Z y J de `neon` (4,57:1); se dejan porque son el look actual y pasan el mínimo.
- Fuera del mínimo, por no ser elementos jugables: `dead` (solo en la animación de fin; `neon` 2,20:1) y la pieza fantasma (guía, con `ghostAlpha`).
- En `retro`, I/S/L comparten intensidad A, O/Z la B y T/J la C: se distinguen por patrón (`none` / `dot` / `cross`) además de por forma.

## Plan de implementación

1. Partir de la rama con la SPEC 10 ya mergeada (usa `lib/skins.ts`, `PlayableGameProps.skin` y `SKINNED_GAMES`).
2. Crear `lib/tetris/skins.ts` con `BlockMark`, `TetrisPalette`, `mixHex` y las 3 paletas de esta spec, exportadas como `SKINS … satisfies Record<SkinId, TetrisPalette>`, sin `Partial` ni `as`. Verificar con `npx tsc --noEmit`.
3. Refactorizar `lib/tetris/render.ts`:
   - Firma `drawTetris(ctx, game, palette, labelFont)`; borrar `PIECE_RGB`, `DEAD_RGB`, `COLORS` y `mix`.
   - Reemplazar cada color fijo por su clave de la paleta (comentarios de origen en la paleta `neon`) y cada `rgba(…)` por color hex + `globalAlpha`.
   - Agregar el dibujo de `marks`.
   - Verificar con `Grep` de `#[0-9a-fA-F]{3,8}|rgba?\(` sobre `lib/tetris/render.ts`: cero resultados.
4. Adaptar `components/games/tetris.tsx`: prop `skin`, `skinRef`, `SKINS[skinRef.current]` en las 3 llamadas a `drawTetris`, efecto `[skin]` que redibuja. Verificar con `npx tsc --noEmit`.
5. En `components/games/registry.ts`, sumar `"caida"` a `SKINNED_GAMES`.
6. Usar `/frontend-design` para revisar las 3 skins en pantalla (tonos, grosor del marco de `clasico`, tamaño del `dot` y la `cross` en `retro`). Si cambia algún valor, actualizar esta spec y recalcular su contraste.
7. Antes de tocar cualquier API de Next, consultar `node_modules/next/dist/docs/` (en principio no hace falta ninguna: todo es cliente).
8. Probar con Playwright en `npm run dev`, `/juegos/caida/jugar`:
   - El selector `NEÓN` · `RETRO` · `CLÁSICO` aparece en el HUD con la skin guardada activa.
   - Cambiar a cada skin antes de empezar, en pausa y en plena partida; captura por skin.
   - Comparar la captura `neon` con una de `main`: idéntica salvo la pieza T.
   - En plena partida, cambiar de skin no reinicia puntaje, líneas, nivel ni piezas.
   - Recargar y JUGAR DE NUEVO: la skin persiste.
   - Llegar al fin de partida en cada skin: las filas se apagan hacia `dead` y abre el modal.
   - `/juegos/rocas/jugar` sigue con selector; `/juegos/bloque-buster/jugar` y `/juegos/serpentina/jugar` sin selector y funcionando igual.
   - Consola sin errores ni warnings de hidratación.
9. Correr `npm run lint`, `npx tsc --noEmit` y `npm run build`.

## Criterios de aceptación

- [ ] `npm run lint`, `npx tsc --noEmit` y `npm run build` terminan sin errores.
- [ ] `lib/tetris/skins.ts` exporta `SKINS` con `neon`, `retro` y `clasico`, tipado con `satisfies Record<SkinId, TetrisPalette>`, sin `Partial` ni `as`, todos los colores en `#rrggbb`.
- [ ] `Grep` de `#[0-9a-fA-F]{3,8}|rgba?\(` sobre `lib/tetris/render.ts` no devuelve resultados.
- [ ] `lib/tetris/engine.ts` y `lib/tetris/pieces.ts` no cambian.
- [ ] `SKINNED_GAMES` contiene `"rocas"` y `"caida"`, y `/juegos/caida/jugar` muestra el selector `NEÓN` · `RETRO` · `CLÁSICO`.
- [ ] Con `neon`, CAÍDA se ve igual que en `main` salvo la pieza T, que pasa a `#bb55ff`.
- [ ] Con `retro`, todo el canvas es ámbar sobre `#0a0700`, sin otro tono; S, Z, J y L muestran su patrón y I, O, T no.
- [ ] Con `clasico`, los bloques son opacos con contorno negro, sin glow ni brillo, sobre pozo negro con marco gris.
- [ ] Cambiar de skin en plena partida no reinicia puntaje, líneas, nivel, tablero ni pieza actual.
- [ ] Cambiar de skin antes de empezar o en pausa se ve al instante en el canvas.
- [ ] La misma secuencia de jugadas da el mismo puntaje y líneas en las 3 skins (motor intacto).
- [ ] La skin persiste al recargar y al pasar por JUGAR DE NUEVO.
- [ ] La animación de fin (filas que se apagan) funciona en las 3 skins.
- [ ] Contrastes de la tabla de Convenciones ≥ 4,5:1 para las 7 piezas y el rótulo SIGUIENTE.
- [ ] Sin errores ni warnings de hidratación en la consola.
- [ ] ROCAS sigue con sus skins; BLOQUE BUSTER y SERPENTINA siguen sin selector y funcionando igual.

## Decisiones

- **Sí:** reutilizar sin cambios la base de la SPEC 10 (`lib/skins.ts`, `useSkin`, `av_skin`, prop `skin`, selector, contrato) y solo sumar `"caida"` a `SKINNED_GAMES`.
- **Sí:** firma `drawTetris(ctx, game, palette, labelFont)`, con la paleta en tercer lugar como fija la SPEC 10. **Desviación justificada:** CAÍDA no usa `now` (no tiene animaciones por reloj; el apagado lo da `game.fade`) y sí necesita `labelFont` para el rótulo SIGUIENTE, que queda último en el lugar de `now`.
- **Sí:** colores en hex `#rrggbb` y transparencias con claves `…Alpha` + `ctx.globalAlpha`, convención compartida de la SPEC 10.
- **Sí:** `mixHex` puro en `skins.ts` para el apagado de filas. Mantiene el resultado actual de `mix` sobre tuplas RGB con colores en hex.
- **No:** simular el apagado pintando `dead` encima con `globalAlpha`: con relleno translúcido no da el mismo color que hoy.
- **Sí:** `wellOuter` opaco (`#06060e` en `neon`, el `rgba(10, 10, 24, 0.6)` actual ya compuesto sobre el fondo negro). Los stops de un degradé no admiten `globalAlpha`, y el resultado es el mismo porque el fondo es opaco.
- **No:** `wellOuterAlpha` ni el stop `rgba(0, 0, 0, 0)`: no hacen falta y así el `Grep` sobre `render.ts` queda en cero.
- **Sí:** ámbar `#ffb000` en `retro`, igual que ROCAS (SPEC 10), con su mismo fondo `#0a0700` y apagado `#5c3f00`. La skin `retro` se reconoce igual en toda la plataforma.
- **No:** verde `#33ff66`: con 7 piezas apiladas, el verde sobre negro se empasta más en la intensidad más baja.
- **Sí:** 3 intensidades + patrón (`none`/`dot`/`cross`) en `retro`. Con un solo tono no entran 7 intensidades que cumplan 4,5:1; la combinación da 7 pares únicos.
- **No:** 7 intensidades distintas (las más bajas no llegan a 4,5:1) ni un patrón distinto por pieza (recarga la celda).
- **Sí:** `clasico` con los 7 colores de la Tetris Guideline (cian, amarillo, púrpura, verde, rojo, azul, naranja), relleno opaco, contorno negro y sin glow.
- **Sí:** aclarar T (`#a000f0` → `#b040ff`) y J (`#0000f0` → `#5070ff`) en `clasico`. Los originales dan 3,75:1 y 2,26:1 sobre negro.
- **No:** fondo claro en `clasico` para salvar el azul: rompe el amarillo y se aleja del original.
- **No:** biseles o brillo en `clasico`: la regla es colores planos; además los acercaría al brillo de `neon`.
- **Sí:** cambiar T en `neon` de `#aa00ff` a `#bb55ff` (3,47 → 4,89:1). Legibilidad primero; es el único cambio visible del look actual.
- **No:** dejar T sin cambios como excepción documentada.
- **Sí:** mantener la geometría de puntos de la cuadrícula en las 3 skins; solo cambian su color y alpha.
- **No:** líneas de grilla completas en `clasico`: sería cambiar geometría.
- **Sí:** `skinRef` + efecto `[skin]` en el componente, como ROCAS. Cambio en caliente sin reiniciar el loop ni la partida.
- **No:** meter `skin` en las deps del montaje: recrearía `TetrisGame`.
- **No:** cambiar el overlay de inicio por skin: es UI de la plataforma, no del canvas (igual que en la SPEC 10).

## Riesgos

| Riesgo                                                                  | Mitigación                                                                                                           |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Hidratación por leer `localStorage` en el render inicial                | Lo resuelve `useSkin` de la SPEC 10 (`getServerSnapshot = DEFAULT_SKIN`); CAÍDA solo dibuja en el canvas en efectos. |
| Cambiar de skin reinicia la partida o duplica el loop                   | `skin` fuera de las deps del montaje y del loop; se lee por `skinRef`. Criterio de cambio a mitad de partida.        |
| `shadowBlur` caro en `retro` con el tablero lleno (200 bloques)         | `blockGlow` 4 y `frameGlow` 6, menores que `neon`; `clasico` en 0 y sin setear sombra.                               |
| `globalAlpha` que queda sucio entre bloques o se suma al de la fantasma | Cada `drawBlock` y `drawFrame` usa `save`/`restore` y calcula el alpha a partir de `alpha` explícito.                |
| El apagado de filas cambia de color al pasar de `mix` a `mixHex`        | `mixHex` usa el mismo redondeo por canal; comparar la captura de fin de partida `neon` con `main`.                   |
| Contraste insuficiente al retocar tonos con `/frontend-design`          | Tabla de contraste en esta spec; todo cambio de valor la recalcula antes de implementar.                             |
| Colores fijos olvidados en `render.ts` (p. ej. el blanco del brillo)    | `Grep` del paso 3 y criterio de aceptación con cero coincidencias.                                                   |
| El patrón de `retro` se confunde o se ve borroso con DPR 2              | Sin brillo en `retro` (`sheenAlpha` 0); el patrón usa enteros y se revisa en captura.                                |
| La portada `cover-tetro` y el overlay de inicio no cambian con la skin  | Aceptado: fuera de alcance, igual que en la SPEC 10.                                                                 |

## Lo que **no** entra en esta spec

- El sistema compartido de skins (SPEC 10).
- Skins de ROCAS, BLOQUE BUSTER y SERPENTINA.
- Skins extra más allá de las 3 obligatorias.
- Overlay de inicio y portada `cover-tetro` según la skin.
- Cambios en el motor, la puntuación o la velocidad de CAÍDA.
- Tests automatizados.

Cada uno de esos, si llega, va en su propia spec.

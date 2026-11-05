# SPEC 10 — Skins base y ROCAS (NEÓN, RETRO, CLÁSICO)

> **Estado:** aprobado
> **Depende de:** SPEC 05, SPEC 06
> **Fecha:** 2026-11-04
> **Objetivo:** Crear el sistema compartido de skins (tipos, selector y persistencia en el reproductor, contrato de juegos) y aplicarlo a ROCAS con tres paletas: NEÓN (look actual), RETRO (fósforo ámbar) y CLÁSICO (vectorial blanco sobre negro).

## Por qué existe esta spec

Auditoría del 2026-11-04 sobre los 4 juegos de `PLAYABLE_GAMES` (`components/games/registry.ts:25-28`):

| Juego (id)      | Motor           | Estado    | Hallazgos                                                                                                                                                                                                                                                                                                                          |
| --------------- | --------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rocas`         | `lib/asteroids` | SIN SKINS | No existe `lib/asteroids/skins.ts`. 12 colores fijos en `lib/asteroids/render.ts`: `COLORS` (`:16-22`), `PARTICLE_RGB` (`:25`), `"#000"` (`:59`), estrellas `rgba(…)` (`:76-77`), núcleo `"#fff"` (`:96`), relleno `rgba(255, 0, 110, 0.05)` (`:112`), partículas (`:183`). `components/games/asteroids.tsx:44-48` no recibe skin. |
| `caida`         | `lib/tetris`    | SIN SKINS | 11 colores fijos en `lib/tetris/render.ts` (desde `:35`). Lo cubre la **SPEC 11** (`specs/11-skins-caida.md`).                                                                                                                                                                                                                     |
| `bloque-buster` | `lib/arkanoid`  | SIN SKINS | 16 colores fijos en `lib/arkanoid/render.ts` (desde `:25`, fondo `"#000"` en `:37`). Queda para una spec propia.                                                                                                                                                                                                                   |
| `serpentina`    | `lib/snake`     | SIN SKINS | 17 colores fijos en `lib/snake/render.ts` (desde `:14`, fondo `"#000"` en `:31`). Queda para una spec propia.                                                                                                                                                                                                                      |

A nivel plataforma no hay nada:

- No existe `lib/skins.ts`.
- `PlayableGameProps` (`components/games/registry.ts:15-19`) no tiene skin.
- `components/game-player.tsx:150-155` monta el juego sin skin y no hay selector.
- `.claude/skills/nuevo-juego/contrato.md:44-48` y `:83` y `plantilla-spec.md:37` y `:88` fijan la paleta neón sin alternativas: los juegos nuevos nacerían sin skins.

Esta spec es la **base**: crea el sistema compartido y lo estrena en ROCAS, el ejemplo vivo del contrato.
La **SPEC 11 (CAÍDA) depende de esta** y reutiliza `lib/skins.ts`, `lib/skin-store.ts`, la prop `skin`, el selector, la clave `av_skin` y el contrato tal cual: no los redefine, solo agrega `lib/tetris/skins.ts`, adapta su render y su componente y suma `caida` a `SKINNED_GAMES`.

## Alcance

**Entra:**

- `lib/skins.ts` con `SkinId`, `SKIN_IDS`, `SKIN_LABELS`, `DEFAULT_SKIN` e `isSkinId`.
- `lib/skin-store.ts` con `useSkin()` (`useSyncExternalStore` + `localStorage` clave `av_skin`), mismo patrón que `lib/user-store.ts`.
- Prop `skin: SkinId` en `PlayableGameProps` y lista `SKINNED_GAMES` en `components/games/registry.ts`.
- Selector de skin en el HUD de `components/game-player.tsx` (solo para juegos de `SKINNED_GAMES`) y estilos `.skin-picker` en `app/globals.css`.
- `lib/asteroids/skins.ts` con `AsteroidsPalette` y `SKINS` (`neon`, `retro`, `clasico`).
- `lib/asteroids/render.ts` sin colores fijos: recibe la paleta por parámetro.
- `components/games/asteroids.tsx` recibe `skin`, la pasa al render y cambia de skin en caliente sin reiniciar la partida.
- Actualización de `.claude/skills/nuevo-juego/contrato.md` y `plantilla-spec.md` para exigir las 3 skins.

**Fuera de alcance (para specs futuras):**

- Skins de CAÍDA (SPEC 11), BLOQUE BUSTER y SERPENTINA.
- Portadas `cover-*` y overlays de inicio/pausa que cambien con la skin.
- Skin por juego (una preferencia distinta para cada id) y skins extra más allá de las 3.
- Guardar la skin en Supabase o asociarla al nombre del jugador.
- Tests automatizados de las skins: el proyecto no tiene test runner; la verificación es con Playwright y `tsc` (paso 10). Van en una spec propia.
- Cambios en el motor, la física, la puntuación o las hitboxes de ROCAS.

## Modelo de datos

```ts
// lib/skins.ts — compartido, sin DOM ni React
export type SkinId = "neon" | "retro" | "clasico";
export const SKIN_IDS: readonly SkinId[] = ["neon", "retro", "clasico"];
export const SKIN_LABELS: Record<SkinId, string> = {
  neon: "NEÓN",
  retro: "RETRO",
  clasico: "CLÁSICO",
};
export const DEFAULT_SKIN: SkinId = "neon";
export function isSkinId(value: unknown): value is SkinId; // valida lo leído de localStorage
```

```ts
// lib/skin-store.ts — "use client"; mismo patrón que lib/user-store.ts
const KEY = "av_skin"; // valor guardado: el SkinId en texto plano ("neon" | "retro" | "clasico")
export function useSkin(): { skin: SkinId; setSkin: (skin: SkinId) => void };
// getSnapshot: lee localStorage en try/catch; valor ausente, inválido o error → DEFAULT_SKIN.
// getServerSnapshot: siempre DEFAULT_SKIN (sin desfasaje de hidratación).
// setSkin: escribe en try/catch y notifica a los suscriptores; subscribe escucha "storage" con e.key === "av_skin".
```

```ts
// components/games/registry.ts
import type { SkinId } from "@/lib/skins";

export type PlayableGameProps = {
  paused: boolean;
  skin: SkinId; // skin elegida en el reproductor; cambia en caliente sin remontar
  onStats: (stats: PlayableGameStats) => void;
  onGameOver: (finalScore: number) => void;
};

// Juegos que ya implementan skins: el reproductor solo muestra el selector para estos ids.
// Cada spec de skins agrega el suyo (SPEC 11 agrega "caida").
export const SKINNED_GAMES: ReadonlySet<string> = new Set(["rocas"]);
```

```tsx
// components/game-player.tsx (cambios)
const { skin, setSkin } = useSkin();
const showSkins = Playable !== undefined && SKINNED_GAMES.has(game.id);
// <Playable key={runKey} paused={paused || over} skin={skin} onStats={onStats} onGameOver={onGameOver} />
// En .hud-actions, antes de PAUSA, si showSkins:
// <div className="skin-picker" role="group" aria-label="Skin">
//   {SKIN_IDS.map((id) => (
//     <button type="button" aria-pressed={skin === id} onClick={() => setSkin(id)}>{SKIN_LABELS[id]}</button>
//   ))}
// </div>
```

```ts
// lib/asteroids/skins.ts
import type { SkinId } from "@/lib/skins";

export type AsteroidsGlow = {
  ship: number; // shadowBlur de la nave
  asteroid: number;
  bullet: number;
  thrust: number; // llama del propulsor
  powerUp: number; // rombo del power-up
  powerUpText: number; // texto "3x"
};

export type AsteroidsPalette = {
  background: string; // relleno base del espacio
  spaceHalo: string | null; // centro del degradé radial; null = sin halo
  starBase: string; // estrellas comunes
  starAccent: string; // el 30 % de estrellas marcadas (hoy cian)
  starAlpha: number; // multiplica el alpha propio de cada estrella; 0 = no se dibujan
  ship: string;
  thrust: string;
  bullet: string;
  asteroid: string; // trazo de las rocas
  asteroidFill: string; // relleno interior de las rocas
  asteroidFillAlpha: number; // 0 = sin relleno
  powerUp: string; // rombo
  powerUpText: string; // "3x"
  particleShip: string; // chispas de la nave al explotar
  particleAsteroid: string; // chispas de las rocas
  core: { color: string; alpha: number } | null; // núcleo fino del trazo fósforo; null = un solo trazo
  strokeAlpha: number; // alpha del trazo principal (hoy 0,75)
  lineScale: number; // multiplica los lineWidth (no cambia geometría ni hitboxes)
  glow: AsteroidsGlow;
  blend: "lighter" | "source-over"; // globalCompositeOperation de las entidades
};

export const SKINS = { neon, retro, clasico } satisfies Record<
  SkinId,
  AsteroidsPalette
>;
```

Paleta `neon` — extracción exacta de lo que hoy está fijo en `lib/asteroids/render.ts`:

```ts
const neon: AsteroidsPalette = {
  background: "#000000",
  spaceHalo: "#0a0a30",
  starBase: "#e6e9ff",
  starAccent: "#00f5ff",
  starAlpha: 1,
  ship: "#00f5ff",
  thrust: "#f5ff00",
  bullet: "#f5ff00",
  asteroid: "#ff006e",
  asteroidFill: "#ff006e",
  asteroidFillAlpha: 0.05,
  powerUp: "#00ff88",
  powerUpText: "#00ff88",
  particleShip: "#00f5ff",
  particleAsteroid: "#ff006e",
  core: { color: "#ffffff", alpha: 0.55 },
  strokeAlpha: 0.75,
  lineScale: 1,
  glow: {
    ship: 14,
    asteroid: 12,
    bullet: 10,
    thrust: 10,
    powerUp: 14,
    powerUpText: 8,
  },
  blend: "lighter",
};
```

Paleta `retro` — monitor de fósforo **ámbar** (tono único, matiz ~41°), 4 intensidades:

| Intensidad   | Hex       | Uso                                                          |
| ------------ | --------- | ------------------------------------------------------------ |
| 1 (máxima)   | `#ffd060` | nave, balas, chispas de la nave                              |
| 2            | `#ffb000` | power-up (rombo y "3x"), llama del propulsor                 |
| 3            | `#cc8c00` | rocas (trazo y relleno tenue)                                |
| 4 (decorado) | `#996900` | estrellas acento, chispas de rocas                           |
| fondo        | `#0a0700` | fondo casi negro cálido; halo `#1a1000`; estrellas `#5c3f00` |

```ts
const retro: AsteroidsPalette = {
  background: "#0a0700",
  spaceHalo: "#1a1000",
  starBase: "#5c3f00",
  starAccent: "#996900",
  starAlpha: 1,
  ship: "#ffd060",
  thrust: "#ffb000",
  bullet: "#ffd060",
  asteroid: "#cc8c00",
  asteroidFill: "#cc8c00",
  asteroidFillAlpha: 0.04,
  powerUp: "#ffb000",
  powerUpText: "#ffb000",
  particleShip: "#ffd060",
  particleAsteroid: "#996900",
  core: { color: "#ffe8a8", alpha: 0.35 },
  strokeAlpha: 0.9,
  lineScale: 1,
  glow: {
    ship: 6,
    asteroid: 5,
    bullet: 4,
    thrust: 4,
    powerUp: 6,
    powerUpText: 3,
  },
  blend: "lighter",
};
```

Paleta `clasico` — homenaje a _Asteroids_ (Atari, 1979): vectores blancos sobre negro, sin glow, sin estrellas, trazo fino:

```ts
const clasico: AsteroidsPalette = {
  background: "#000000",
  spaceHalo: null,
  starBase: "#ffffff",
  starAccent: "#ffffff",
  starAlpha: 0,
  ship: "#ffffff",
  thrust: "#ffffff",
  bullet: "#ffffff",
  asteroid: "#bdbdbd",
  asteroidFill: "#000000",
  asteroidFillAlpha: 0,
  powerUp: "#ffffff",
  powerUpText: "#ffffff",
  particleShip: "#ffffff",
  particleAsteroid: "#bdbdbd",
  core: null,
  strokeAlpha: 1,
  lineScale: 0.7,
  glow: {
    ship: 0,
    asteroid: 0,
    bullet: 0,
    thrust: 0,
    powerUp: 0,
    powerUpText: 0,
  },
  blend: "source-over",
};
```

```ts
// lib/asteroids/render.ts — firma nueva: la paleta va justo después de game, now queda último
export function drawAsteroids(
  ctx: CanvasRenderingContext2D,
  game: AsteroidsGame,
  palette: AsteroidsPalette,
  now: number,
): void;
// Se borran COLORS y PARTICLE_RGB. STARS conserva su PRNG; el campo `cyan` pasa a llamarse `accent`.
// phosphor(ctx, palette, color, width, glow): trazo con strokeAlpha, lineWidth × lineScale, shadowBlur = glow;
//   si palette.core no es null, segundo trazo fino con core.color / core.alpha (como hoy).
// Transparencias con ctx.globalAlpha (estrellas: s.a × starAlpha; partículas: ttl / life; relleno: asteroidFillAlpha),
//   nunca armando rgba() a mano. Si starAlpha o asteroidFillAlpha son 0, no se dibuja.
// Único color literal permitido: el stop final del halo "rgba(0, 0, 0, 0)" (transparente neutro), con comentario.
```

```tsx
// components/games/asteroids.tsx (cambios)
export function AsteroidsCanvas({
  paused,
  skin,
  onStats,
  onGameOver,
}: PlayableGameProps);
// skinRef = useRef(skin), actualizado en el useEffect sin deps junto a onStatsRef / onGameOverRef.
// Montaje y loop llaman drawAsteroids(ctx, game, SKINS[skinRef.current], now). `skin` NO entra en las deps
// del montaje ni del loop: cambiarla no recrea AsteroidsGame ni reinicia el rAF.
// Efecto [skin]: si el loop no corre (antes de empezar, en pausa o con el modal), redibuja un frame con la
// paleta nueva para que el cambio se vea al instante.
```

**Convenciones:**

- Default: `neon` (`DEFAULT_SKIN`). Sin valor guardado, con valor inválido o con `localStorage` bloqueado se usa `neon`.
- Persistencia: una sola preferencia global para todos los juegos, clave `av_skin`, valor = `SkinId` en texto plano. Se sincroniza entre pestañas por el evento `storage`.
- Hidratación: el servidor y el primer render del cliente usan `DEFAULT_SKIN` (`getServerSnapshot`); `useSyncExternalStore` pasa a la skin guardada tras hidratar, sin warnings.
- Cambio en caliente: elegir otra skin a mitad de partida no remonta el juego (no toca `runKey`), no pausa y no cambia puntos, vidas, nivel ni posiciones.
- `SKINNED_GAMES` es transitorio: cuando los 4 juegos tengan skins, una spec futura puede quitarlo. Mientras tanto, los juegos fuera de la lista reciben `skin` y la ignoran, y el selector no se muestra.
- Colores de paleta siempre en hex `#rrggbb` de 6 dígitos; transparencias con claves numéricas `…Alpha` y `ctx.globalAlpha`. Convención compartida para todas las specs de skins (SPEC 11 incluida).
- Selector: grupo de 3 botones (`NEÓN` `RETRO` `CLÁSICO`) con `aria-pressed`, en `.hud-actions` antes de PAUSA; el activo con borde y texto amarillo `var(--yellow)`. Estilo `.skin-picker` en `app/globals.css` reutilizando `.btn` en tamaño chico, diseñado con `/frontend-design`.
- Glow por skin:
  - `neon`: igual que hoy (blur 8–14, núcleo blanco al 55 %, mezcla `lighter`).
  - `retro`: blur suave 3–6, núcleo ámbar claro `#ffe8a8` al 35 %, mezcla `lighter`.
  - `clasico`: `shadowBlur = 0` en todo, sin núcleo, trazo opaco, `source-over`, grosor × 0,7 (nave 1,54 px, rocas 1,4 px, balas 1,68 px).
- La skin no cambia formas: nave, rocas, balas, rombo del power-up, texto "3x", parpadeos y pulso quedan iguales en las 3.
- Contraste (WCAG, contra el punto **más claro** del fondo: el centro del halo; contra el fondo base es mayor):

| Elemento jugable | `neon` (vs `#0a0a30`) | `retro` (vs `#1a1000`) | `clasico` (vs `#000000`) |
| ---------------- | --------------------- | ---------------------- | ------------------------ |
| Nave             | `#00f5ff` 14,1:1      | `#ffd060` 12,9:1       | `#ffffff` 21:1           |
| Rocas            | `#ff006e` 5,0:1       | `#cc8c00` 6,6:1        | `#bdbdbd` 11,2:1         |
| Balas            | `#f5ff00` 17,5:1      | `#ffd060` 12,9:1       | `#ffffff` 21:1           |
| Power-up y "3x"  | `#00ff88` 14,3:1      | `#ffb000` 10,3:1       | `#ffffff` 21:1           |
| Llama propulsor  | `#f5ff00` 17,5:1      | `#ffb000` 10,3:1       | `#ffffff` 21:1           |

- Todos ≥ 4,5:1. El más justo es la roca magenta de `neon` (5,0:1 en el centro del halo, 5,5:1 sobre negro); no se toca porque `neon` debe quedar idéntica.
- Los decorados (estrellas, chispas de roca `#996900` en `retro`, 3,9:1) no son jugables y no exigen 4,5:1.
- En `retro` nave y balas comparten intensidad (`#ffd060`): se distinguen por forma (triángulo con muesca vs trazo corto). El power-up se distingue de la nave por intensidad (`#ffb000`), por el rombo y por el texto "3x". En `clasico` nave, balas y power-up son blancos y se distinguen por forma, como en el original; las rocas van en gris `#bdbdbd`.

## Plan de implementación

1. Crear `lib/skins.ts` (tipos, constantes e `isSkinId`) y `lib/skin-store.ts` (`useSkin`, clave `av_skin`) copiando el patrón de `lib/user-store.ts`. Verificar con `npx tsc --noEmit`.
2. En `components/games/registry.ts`: agregar `skin: SkinId` a `PlayableGameProps` y `SKINNED_GAMES = new Set(["rocas"])`. Verificar con `npx tsc --noEmit` que los 4 componentes siguen compilando (los que no usan `skin` la ignoran).
3. Crear `lib/asteroids/skins.ts` con `AsteroidsGlow`, `AsteroidsPalette` y las 3 paletas de esta spec, exportadas como `SKINS … satisfies Record<SkinId, AsteroidsPalette>`, sin `Partial` ni `as`.
4. Refactorizar `lib/asteroids/render.ts`:
   - Firma `drawAsteroids(ctx, game, palette, now)`; borrar `COLORS` y `PARTICLE_RGB`; `phosphor` recibe la paleta.
   - Transparencias con `globalAlpha`; `blend`, `lineScale`, `core`, `strokeAlpha` y `glow` desde la paleta.
   - Verificar con `Grep` de `#[0-9a-fA-F]{3,8}|rgba?\(` sobre `lib/asteroids/render.ts`: una sola coincidencia, el `rgba(0, 0, 0, 0)` del halo, comentada.
5. Adaptar `components/games/asteroids.tsx`: prop `skin`, `skinRef`, `SKINS[skinRef.current]` en montaje y loop, efecto `[skin]` que redibuja cuando el loop no corre.
6. En `components/game-player.tsx`: `useSkin()`, prop `skin` al `Playable` y selector en `.hud-actions` solo con `SKINNED_GAMES.has(game.id)`. Agregar `.skin-picker` a `app/globals.css`. Usar `/frontend-design` para el selector y para revisar las 3 paletas en pantalla.
7. Antes de tocar cualquier API de Next, consultar `node_modules/next/dist/docs/` (en principio no hace falta ninguna: todo es cliente).
8. Actualizar `.claude/skills/nuevo-juego/contrato.md`:
   - Mapa de piezas: fila "Skins del juego → `lib/<slug>/skins.ts` → nuevo" y fila "Lista de juegos con skins → `SKINNED_GAMES` en `registry.ts` → agrega el id".
   - Sección 3: `PlayableGameProps` con `skin: SkinId`.
   - Sección 5: el render recibe `palette` justo después de `game`; sin colores fijos salvo `rgba(0, 0, 0, 0)` justificado.
   - Sección 6: punto nuevo con `skinRef`, skin fuera de las deps del montaje/loop y redibujo con `[skin]`.
   - Sección nueva "Skins": las 3 obligatorias (`neon` = look por defecto, `retro` = fósforo monocromo verde `#33ff66` o ámbar `#ffb000` en 3–4 intensidades, `clasico` = colores planos del original sin glow), solo cosméticas, contraste ≥ 4,5:1, hex de 6 dígitos y alphas numéricos. Ejemplo vivo: `lib/asteroids/skins.ts`.
   - Sección 9: verificar las 3 skins, la persistencia y que cambiar la skin no reinicia la partida.
9. Actualizar `.claude/skills/nuevo-juego/plantilla-spec.md`: línea de Alcance "3 skins (`neon`, `retro`, `clasico`) en `lib/<slug>/skins.ts`"; bloque `ts` con `<X>Palette` y las 3 paletas completas; firma del render con `palette`; criterios "las 3 skins cambian en caliente y persisten" y "contraste ≥ 4,5:1 anotado"; decisión "tono de `retro` (verde o ámbar)".
10. Probar en `npm run dev` con Playwright:
    - `/juegos/rocas/jugar`: el selector muestra `NEÓN` activo; captura de cada skin con rocas, balas, power-up y llama a la vista.
    - Cambiar de skin antes de empezar, a mitad de partida y en pausa: el canvas cambia al instante, el HUD (puntos, vidas, nivel, Disparo 3x) no cambia y la partida sigue.
    - Recargar: la skin elegida persiste. Borrar `av_skin` o poner `"xyz"`: vuelve a `NEÓN` sin errores.
    - Comparar la captura `neon` con una de `main`: idénticas.
    - JUGAR DE NUEVO conserva la skin.
    - `/juegos/caida/jugar`, `/juegos/bloque-buster/jugar` y `/juegos/serpentina/jugar` sin selector y funcionando igual; `/juegos/gloton/jugar` en MODO DEMO y sin selector.
    - Consola sin errores ni warnings de hidratación.
11. Correr `npm run lint`, `npx tsc --noEmit` y `npm run build`.

## Criterios de aceptación

- [ ] `npm run lint`, `npx tsc --noEmit` y `npm run build` terminan sin errores.
- [ ] `lib/skins.ts` exporta `SkinId`, `SKIN_IDS`, `SKIN_LABELS` (`NEÓN`, `RETRO`, `CLÁSICO`), `DEFAULT_SKIN = "neon"` e `isSkinId`.
- [ ] `lib/asteroids/skins.ts` exporta `SKINS` con `neon`, `retro` y `clasico`, tipado con `satisfies Record<SkinId, AsteroidsPalette>`, sin `Partial` ni `as`, con los valores de esta spec.
- [ ] `Grep` de `#[0-9a-fA-F]{3,8}|rgba?\(` en `lib/asteroids/render.ts` devuelve solo el `rgba(0, 0, 0, 0)` del halo.
- [ ] `lib/asteroids/engine.ts` y `lib/asteroids/entities.ts` no cambian.
- [ ] `/juegos/rocas/jugar` muestra el selector `NEÓN` · `RETRO` · `CLÁSICO` en el HUD con `NEÓN` activo la primera vez.
- [ ] Con `neon`, ROCAS se ve idéntico al de `main` (mismos colores, glow, estrellas y núcleo blanco).
- [ ] Con `retro`, todo el canvas es ámbar en 4 intensidades sobre `#0a0700`, sin cian, magenta, verde ni blanco puro.
- [ ] Con `clasico`, trazos blancos y rocas grises finos sobre negro, sin glow, sin halo y sin estrellas.
- [ ] Cambiar de skin a mitad de partida no reinicia la partida: puntos, vidas, nivel, posiciones y el timer de Disparo 3x siguen igual.
- [ ] Cambiar de skin antes de empezar o en pausa se ve al instante en el canvas.
- [ ] La puntuación y la física son idénticas entre skins (mismas hitboxes: solo cambian colores, glow y grosor de trazo).
- [ ] La skin persiste al recargar y al pasar por JUGAR DE NUEVO; con `av_skin` ausente o inválido se usa `NEÓN`.
- [ ] Los demás juegos jugables no muestran selector y se ven y juegan igual que antes; los simulados siguen en MODO DEMO.
- [ ] Cada elemento jugable tiene contraste ≥ 4,5:1 contra el fondo en las 3 skins (tabla de Modelo de datos).
- [ ] `contrato.md` y `plantilla-spec.md` exigen las 3 skins para todo juego nuevo.
- [ ] No hay errores ni warnings de hidratación en la consola en `/juegos/rocas/jugar`.

## Decisiones

- **Sí:** esta spec crea la base compartida y la estrena en ROCAS, que es el ejemplo vivo del contrato. La SPEC 11 (CAÍDA) la reutiliza sin redefinirla.
- **No:** una spec base con los 4 juegos a la vez. El usuario pidió solo ROCAS en esta corrida y CAÍDA va en paralelo en la SPEC 11.
- **Sí:** prop `skin: SkinId` (obligatoria) en `PlayableGameProps`. El reproductor siempre sabe la skin; un juego sin skins la ignora sin romper el tipado.
- **No:** pasar la paleta ya resuelta desde el reproductor. Cada juego tiene su propio tipo de paleta; el reproductor no debe conocerlos.
- **No:** un React Context de skin. Es un solo nivel de props; un Context agrega indirección sin beneficio.
- **Sí:** clave `av_skin` global, con el `SkinId` en texto plano. Sigue el prefijo de `av_user`; una preferencia vale para toda la plataforma.
- **No:** clave por juego (`av_skin:<id>`) ni por nombre de jugador. Más estado para un beneficio dudoso; si se pide, va en otra spec.
- **Sí:** `lib/skin-store.ts` con `useSyncExternalStore` y `getServerSnapshot = DEFAULT_SKIN`, igual que `lib/user-store.ts`. Evita leer `localStorage` en el render inicial y los warnings de hidratación.
- **Sí:** selector de 3 botones en `.hud-actions`, visible sin abrir nada. Cambia en un click.
- **No:** `<select>` nativo ni selector en la página de detalle. El `<select>` desentona con el HUD retro; en el detalle no se ve el efecto.
- **Sí:** `SKINNED_GAMES` en el registro para mostrar el selector solo donde funciona. Un selector que no hace nada en CAÍDA o SERPENTINA confundiría.
- **Sí:** cambio en caliente con `skinRef` y redibujo con `[skin]`. Cambiar la skin nunca debe costar una partida.
- **Sí:** firma `draw<X>(ctx, game, palette, now)`. Mismo orden para todos los juegos (la SPEC 11 la sigue).
- **Sí:** transparencias con `globalAlpha` y claves `…Alpha`. Evita armar `rgba(…)` con strings y deja el render sin literales de color.
- **Sí:** `retro` en **ámbar** `#ffb000`. Se separa más de `neon` (cian y verde) y de `clasico` (blanco) que el verde, y los trazos finos de ROCAS leen bien en ámbar.
- **No:** `retro` en verde `#33ff66`. Quedaría cerca del power-up verde de `neon` y del fósforo verde que muchos juegos de la plataforma ya usan.
- **Sí:** `clasico` como _Asteroids_ (Atari, 1979): vectores blancos sobre negro, sin glow, sin estrellas, trazo × 0,7. Es la referencia directa de ROCAS.
- **Sí:** rocas en gris `#bdbdbd` en `clasico`. El monitor vectorial tenía niveles de brillo; separa las rocas de la nave sin salir del blanco y negro.
- **No:** `clasico` con las rocas de colores de _Asteroids Deluxe_ o fondo azul. Pierde la identidad vectorial reconocible.
- **Sí:** `neon` extraída 1:1 del render actual, sin pasar la nave al amarillo del catálogo (`color: "yellow"` en `lib/games.ts:79`). El amarillo ya está en balas y llama, y la skin por defecto tiene que verse idéntica.
- **Sí:** `lineScale` como único cambio de "geometría" permitido: afecta el grosor del trazo, no posiciones, radios ni hitboxes.
- **No:** scanlines, flicker o distorsión propia en `retro`. El CRT del reproductor ya pone scanlines; sumar más sería efecto, no paleta.

## Riesgos

| Riesgo                                                                 | Mitigación                                                                                                                       |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Warning de hidratación por leer `localStorage` en el render inicial    | `useSyncExternalStore` con `getServerSnapshot = DEFAULT_SKIN`; nunca leer `localStorage` en `useState` inicial.                  |
| Cambiar de skin reinicia la partida o duplica el loop                  | `skin` fuera de las deps del montaje y del loop; se lee por `skinRef`. Criterio de cambio a mitad de partida.                    |
| `shadowBlur` caro en partidas largas con muchas rocas                  | `retro` usa blur 3–6 (menos que `neon`) y `clasico` 0; el render no setea sombra si el glow es 0.                                |
| Contraste insuficiente de las rocas magenta en `neon`                  | Medido 5,0:1 en el peor punto (centro del halo); se deja porque es el look actual y pasa el mínimo.                              |
| Colores fijos olvidados en `render.ts` (p. ej. el `"#fff"` del núcleo) | `Grep` del paso 4 y criterio de aceptación con una sola coincidencia permitida.                                                  |
| `localStorage` bloqueado (modo privado, políticas)                     | Lectura y escritura en `try/catch`; cae a `DEFAULT_SKIN` y el selector sigue funcionando en memoria de la sesión.                |
| Espacio activa el botón de skin con foco                               | Los juegos ya hacen `preventDefault` de Espacio en `keydown` y `keyup`; se verifica con Playwright tras hacer click en una skin. |
| La portada `cover-rocas` y el overlay de inicio no cambian con la skin | Aceptado: quedan fuera de alcance; se documenta en "Lo que no entra".                                                            |
| SPEC 11 redefine la API compartida de forma distinta                   | Esta spec fija `SkinId`, `useSkin`, `av_skin`, la prop `skin`, `SKINNED_GAMES` y la firma del render; la SPEC 11 solo los usa.   |

## Lo que **no** entra en esta spec

- Skins de CAÍDA (SPEC 11), BLOQUE BUSTER y SERPENTINA.
- Portadas, overlays de inicio/pausa y HUD que cambien con la skin.
- Preferencia de skin por juego o por jugador, o guardada en Supabase.
- Skins extra más allá de `neon`, `retro` y `clasico`.
- Efectos CRT propios por skin (scanlines, flicker).

Cada uno de esos, si llega, va en su propia spec.

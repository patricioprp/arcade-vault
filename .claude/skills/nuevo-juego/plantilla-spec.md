# Plantilla — spec de un juego jugable

Contenido base para `/nuevo-juego`. La estructura manda la de `.claude/skills/spec/template.md` y el estilo el de las specs del repo (`specs/05-…`, `specs/06-…`).

Reemplazá todos los marcadores antes de guardar:

- `<NN>`: número de spec · `<id>`: id del catálogo · `<TÍTULO>`: título del catálogo
- `<slug>`: carpeta del motor (`tetris`) · `<X>`: prefijo de tipos y clases (`Tetris`)
- `<origen>`: `references/started-games/<carpeta>/` o "desde cero"

Borrá los criterios, decisiones y riesgos que no apliquen y agregá los propios del juego. Lo marcado con `[si …]` solo entra en ese caso.

---

_Plantilla (todo lo que sigue va al archivo de la spec):_

# SPEC <NN> — Juego real <TÍTULO> (<nombre original>) con leaderboard

> **Estado:** borrador
> **Depende de:** SPEC 05, SPEC 06
> **Fecha:** <fecha de la sesión>
> **Objetivo:** <Portar / Crear> <nombre original> en TypeScript, montarlo como juego jugable en `/juegos/<id>/jugar` integrado con el reproductor y habilitar sus puntuaciones en Supabase.

## Por qué existe esta spec

- Hoy `<id>` es una simulación: el modal muestra "MODO DEMO — NO PUNTÚA" y su pestaña del Salón está vacía.
- <origen>: <qué trae — archivos, líneas, globals, assets>.
- La SPEC 05 dejó el patrón motor + render + componente + `PLAYABLE_GAMES`; la SPEC 06 dejó el leaderboard genérico por `game_id`. Esta spec aplica ambos a `<id>` según `.claude/skills/nuevo-juego/contrato.md`.
- <Comportamientos de la referencia que el README no menciona y se mantienen.>

## Alcance

**Entra:**

- Port a TypeScript en `lib/<slug>/`: entidades, motor sin DOM y render separado.
- Misma jugabilidad que <origen>: <constantes, puntos, vidas, niveles, velocidades, condición de fin y victoria>.
- Render con la paleta neón de la plataforma, diseñado con `/frontend-design`.
- Mundo lógico <W>×<H> (4:3) escalado al `.crt-screen` con `devicePixelRatio`. [si no es 4:3: <cómo se encuadra>]
- Client Component `components/games/<slug>.tsx` registrado como `<id>` en `PLAYABLE_GAMES`.
- Pantalla de inicio "PULSA ESPACIO PARA EMPEZAR" con los controles.
- HUD de React: puntuación, <vidas | `—`>, nivel y celda extra `<label>`.
- Pausa, fin, guardado y reinicio con los mecanismos existentes de `GamePlayer`.
- Migración `playable_<id>` que marca `<id>` como jugable en `public.games`.
- [si id nuevo] Entrada `<id>` en `lib/games.ts` con `difficulty` y portada `.cover-<x>` en `app/globals.css`.
- [si assets] Copia de <archivos> a `public/games/<id>/`.

**Fuera de alcance (para specs futuras):**

- Controles táctiles y móvil.
- <Sonido, si no entra.>
- <Funciones de la referencia que se quitan: pausa propia, selector de nivel, GAME OVER en canvas, reinicio con tecla.>
- Cambios en `submit_score`, `get_leaderboard`, el Salón o el detalle (ya genéricos desde SPEC 06).
- Cambios en otros juegos del catálogo.
- Tests automatizados.

## Modelo de datos

```ts
// lib/<slug>/engine.ts — sin DOM: no usa window, document, requestAnimationFrame, Audio ni Image
export const WORLD_W = <W>;
export const WORLD_H = <H>;

export type <X>Input = {
  // <control>: boolean; // <tecla> mantenida
  // <acción>: boolean;  // <tecla> pulsada en este frame (se consume al leerla)
};

export type <X>Status = "playing" | <…> | "gameover";

export type <X>Stats = {
  score: number;
  lives: number;
  level: number;
  // <dato del HUD extra>
  status: <X>Status;
};

export class <X>Game {
  constructor(onStats: (stats: <X>Stats) => void); // emite al crear y solo cuando cambia un campo
  update(dt: number, input: <X>Input): void;        // dt en segundos, capado a 0,05 por el llamador
  getStats(): <X>Stats;
}
```

```ts
// lib/<slug>/render.ts
export function draw<X>(ctx: CanvasRenderingContext2D, game: <X>Game, now: number): void;
// Paleta: <entidad> #00f5ff, <entidad> #ff006e, <entidad> #f5ff00, <entidad> #00ff88. Glow con shadowBlur.
```

```ts
// components/games/registry.ts
export const PLAYABLE_GAMES = { rocas: AsteroidsCanvas, <id>: <X>Canvas };
```

```sql
-- supabase/migrations/<timestamp>_playable_<id>.sql
update public.games set playable = true where id = '<id>';
-- [si id nuevo] insert into public.games (id, title, playable) values ('<id>', '<TÍTULO>', true);
```

Convenciones:

- `lib/<slug>/` es TypeScript puro y no importa React; todo lo que toca el DOM vive en `components/games/<slug>.tsx`.
- `extra` del HUD: `{ label: "<label>", value: "<formato>" }` <cuándo se muestra>.
- El modal se abre 1 s después de `gameover` (derrota o victoria).
- El juego no escucha `P` ni `Escape`: la pausa es del reproductor.
- Con `paused`, los listeners no capturan teclas ni hacen `preventDefault`.
- La puntuación enviada es entera y está entre 1 y 10.000.000.
- `playable` en la DB y `PLAYABLE_GAMES` coinciden.
- `references/started-games/` no se modifica.

## Plan de implementación

1. Crear `lib/<slug>/entities.ts` y `lib/<slug>/engine.ts` portando <funciones> de <origen>, sin dibujo ni DOM. Quitar <reinicio, pausa propia, selector>. Verificar con `npx tsc --noEmit`.
2. Crear `lib/<slug>/render.ts` sin HUD ni textos de fin. Usar `/frontend-design` para colores, grosores y glow.
3. [si assets] Copiar <archivos> a `public/games/<id>/`.
4. Crear `components/games/<slug>.tsx` copiando la estructura de `components/games/asteroids.tsx` (sección 6 de `contrato.md`). Registrarlo como `<id>` en `PLAYABLE_GAMES`.
5. [si id nuevo] Agregar `<id>` a `lib/games.ts` y `.cover-<x>` a `app/globals.css`, con `/frontend-design`.
6. Crear la migración con `npm run db:new -- playable_<id>` y aplicarla con `npm run db:push`. Verificar con `execute_sql`: `submit_score('<id>','TEST',100)` inserta y `get_leaderboard('<id>')` la devuelve. Borrar la fila de prueba.
7. Probar en `npm run dev` con Playwright (sección 9 de `contrato.md`): `/juegos/<id>/jugar` completo, Salón y detalle con la marca, otro juego simulado en MODO DEMO, `rocas` intacto. Revisar la consola.
8. Correr `npm run lint`, `npx tsc --noEmit`, `npm run build` y `get_advisors` (security).

## Criterios de aceptación

- [ ] `npm run lint`, `npx tsc --noEmit` y `npm run build` terminan sin errores.
- [ ] Ningún archivo de `lib/<slug>/` referencia `window`, `document`, `requestAnimationFrame` ni React.
- [ ] `/juegos/<id>/jugar` muestra el canvas en el CRT con "PULSA ESPACIO PARA EMPEZAR" y los controles; el HUD muestra 0 puntos, <vidas> y nivel 01.
- [ ] Espacio o click inician la partida con <estado inicial>.
- [ ] <Cada control> hace <acción>; la página no hace scroll con las teclas del juego.
- [ ] <Cada evento de puntos> suma <N> en el HUD.
- [ ] <Perder vida / condición de fin> se refleja en el HUD.
- [ ] <Cambio de nivel> pasa el HUD a nivel 02 con <estado>.
- [ ] La celda "<label>" aparece <cuándo> y desaparece <cuándo>.
- [ ] Al terminar (<derrota> [y <victoria>]), ~1 s después se abre FIN DEL JUEGO con la puntuación del HUD; el canvas no dibuja "GAME OVER".
- [ ] El modal muestra GUARDAR PUNTUACIÓN (no "MODO DEMO — NO PUNTÚA"); al guardar muestra `▸ PUNTUACIÓN GUARDADA_` y VER SALÓN DE LA FAMA.
- [ ] `/salon-de-la-fama?juego=<id>` y `/juegos/<id>` muestran la marca (top, MEJOR GLOBAL, PARTIDAS) sin recargar a mano.
- [ ] `public.games` tiene `<id>` con `playable = true` y `supabase migration list` muestra `playable_<id>` aplicada en local y remoto.
- [ ] FIN a mitad de partida abre el modal con la puntuación actual.
- [ ] JUGAR DE NUEVO deja el HUD en el estado inicial y muestra de nuevo "PULSA ESPACIO PARA EMPEZAR".
- [ ] PAUSA, `P` y `Escape` congelan y reanudan sin salto; cambiar de pestaña deja la partida en pausa.
- [ ] Ir a SALIR y volver no duplica la velocidad ni los inputs.
- [ ] Los trazos se ven nítidos con `devicePixelRatio` 2.
- [ ] `/juegos/rocas/jugar` sigue funcionando y los juegos sin registro siguen en MODO DEMO.
- [ ] `get_advisors` (security) no suma avisos.
- [ ] No hay errores ni warnings de hidratación en la consola.

## Decisiones

- **Sí:** reusar la entrada `<id>` del catálogo. <Motivo.> / **Sí:** id nuevo `<id>`. <Motivo.>
- **No:** <alternativa descartada>.
- **Sí:** motor sin DOM en `lib/<slug>/` + Client Component, como ROCAS. Permite limpiar loop y listeners al navegar.
- **No:** copiar `game.js` casi tal cual. Sus globals y listeners sobreviven a la navegación del App Router.
- **Sí:** HUD, pausa y modal de la plataforma; se quitan <pausa propia, GAME OVER, selector, reinicio con tecla>.
- **Sí:** habilitar el leaderboard con una migración de datos. Las funciones y pantallas de SPEC 06 ya son genéricas.
- **No:** regenerar tipos. No cambia el esquema.
- **Sí / No:** <encuadre 4:3, vidas, extra del HUD, assets, sonido, controles, escala de puntuación>.

## Riesgos

| Riesgo                                                          | Mitigación                                                                                        |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Loops rAF o listeners que sobreviven al desmontar (Strict Mode) | Cleanup completo en cada `useEffect`; criterio de SALIR y volver.                                 |
| `onStats` a 60 fps re-renderiza el HUD                          | El motor solo emite cuando cambia un campo; timers redondeados.                                   |
| Espacio activa botones con foco                                 | `preventDefault` en `keydown` y `keyup` de las teclas capturadas.                                 |
| Teclas capturadas bloquean el input del modal                   | Con `paused` no se capturan teclas.                                                               |
| `dt` enorme al reanudar                                         | Se reinicia el timestamp al reanudar y `dt` se capa a 50 ms.                                      |
| `playable` y `PLAYABLE_GAMES` desincronizados                   | Componente y migración en la misma spec; si la DB rechaza, el modal muestra el error de guardado. |
| <Riesgo propio del juego>                                       | <Mitigación>                                                                                      |

## Lo que **no** entra en esta spec

- <Lista corta del "Fuera de alcance".>

Cada uno de esos, si llega, va en su propia spec.


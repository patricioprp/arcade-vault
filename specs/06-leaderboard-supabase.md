# SPEC 06 — Tablas `games` y `scores` en Supabase y Salón de la Fama real

> **Estado:** aprobado
> **Depende de:** SPEC 01, SPEC 04, SPEC 05
> **Fecha:** 2026-10-28
> **Objetivo:** Guardar las puntuaciones de `rocas` en Supabase (tablas `games` y `scores`) mediante una Server Action y mostrar en el Salón de la Fama y en el detalle `/juegos/[id]` el top 10 y las estadísticas reales por juego.
> **Enmienda (2026-10-28):** se suma el detalle `/juegos/[id]` (aside MEJORES PUNTUACIONES, PARTIDAS, MEJOR GLOBAL y DIFICULTAD) con datos reales. Pasos 11–13 y criterios marcados _(enmienda)_.

## Por qué existe esta spec

Hoy el Salón de la Fama muestra datos inventados por `seededScores` y la fila TU MEJOR MARCA es decorativa.
ROCAS (SPEC 05) ya produce puntuaciones reales, pero solo se guardan en `localStorage["av_scores"]` y nadie las lee.
La SPEC 04 dejó Supabase conectado y sin tablas, y difirió `scores` y RLS a la spec que las usara: es esta.
Todavía no hay Supabase Auth, así que la escritura se hace como `anon` a través de una función Postgres con validaciones. Se acepta que es trucable hasta que llegue Auth.

## Alcance

**Entra:**

- Migración con la tabla `public.games` como espejo mínimo del catálogo (`id`, `title`, `playable`), sembrada con los 8 juegos de `lib/games.ts`; solo `rocas` con `playable = true`.
- Migración con la tabla `public.scores` (FK a `games`), índice por juego y puntuación, y RLS: lectura pública, sin insert/update/delete directo.
- Función `public.submit_score` (`security definer`) que valida e inserta; única vía de escritura.
- Funciones de lectura `public.get_leaderboard` (mejor marca por jugador, top N) y `public.get_player_best` (mejor marca y rango de un nombre).
- Tipos regenerados en `lib/supabase/database.types.ts`.
- Cliente sin cookies `lib/supabase/anon.ts` para leer dentro de `"use cache"`.
- `lib/leaderboard.ts` (solo servidor) con `getLeaderboard(gameId)` cacheado con `cacheTag("leaderboard:<id>")`.
- Server Action `submitScore` en `app/juegos/[id]/jugar/actions.ts` que llama a `submit_score` e invalida el tag del juego.
- Modal FIN DEL JUEGO de juegos jugables: GUARDAR PUNTUACIÓN con estados guardando / guardada / error con reintento y link al Salón del juego.
- Modal FIN DEL JUEGO de juegos simulados: sin GUARDAR, con la nota "MODO DEMO — NO PUNTÚA".
- Salón de la Fama: podio y tabla con el top 10 real del juego seleccionado, 8 pestañas, estado vacío "SIN PUNTUACIONES TODAVÍA".
- Fila TU MEJOR MARCA real: busca por el nombre de `av_user` con `get_player_best`; se oculta si no hay usuario o no tiene marca.
- Eliminar `lib/score-store.ts` y el uso de `av_scores`.
- _(enmienda)_ Detalle `/juegos/[id]`:
  - Aside MEJORES PUNTUACIONES con `getLeaderboard(gameId)` y estado vacío "SIN PUNTUACIONES TODAVÍA".
  - MEJOR GLOBAL = puntuación del #1 real; `—` si no hay marcas.
  - PARTIDAS = cantidad de marcas guardadas del juego (`count` de `scores`), con `getPlayCount(gameId)`.
  - DIFICULTAD = campo nuevo `difficulty` (1–5) por juego en `lib/games.ts`, dibujado como estrellas llenas/vacías.
- _(enmienda)_ Quitar `plays` de `lib/games.ts` y `seededScores` de `lib/scores.ts`, que quedan sin uso.

**Fuera de alcance (para specs futuras):**

- Supabase Auth, `proxy.ts` y asociar puntuaciones a un usuario autenticado.
- Rate limiting, anti-trampas o validación de la partida en servidor.
- Migrar el catálogo completo a la DB o leer `lib/games.ts` desde Supabase.
- Récords en la Home y en el modal de fin de partida (top o "tu posición").
- `best` de las tarjetas de la biblioteca (`components/game-card.tsx`) calculado desde la DB.
- Contar partidas jugadas que no se guardaron (PARTIDAS cuenta solo marcas guardadas).
- Migrar datos existentes de `localStorage["av_scores"]`.
- Guardado de puntuaciones de los 7 juegos simulados.
- Moderación de nombres, borrado de puntuaciones y panel de administración.
- Tests automatizados.

## Modelo de datos

```sql
-- supabase/migrations/<timestamp>_games_scores.sql
create table public.games (
  id text primary key,          -- mismo id que lib/games.ts (p. ej. 'rocas')
  title text not null,
  playable boolean not null default false
);

create table public.scores (
  id bigint generated always as identity primary key,
  game_id text not null references public.games (id),
  player_name text not null check (char_length(player_name) between 1 and 10),
  score integer not null check (score between 1 and 10000000),
  created_at timestamptz not null default now()
);

create index scores_game_score_idx on public.scores (game_id, score desc, created_at);

alter table public.games enable row level security;
alter table public.scores enable row level security;
create policy "games: lectura pública" on public.games for select to anon, authenticated using (true);
create policy "scores: lectura pública" on public.scores for select to anon, authenticated using (true);
-- Sin policies de insert/update/delete: solo submit_score escribe.

insert into public.games (id, title, playable) values
  ('bloque-buster', 'BLOQUE BUSTER', false),
  ('caida', 'CAÍDA', false),
  -- … los 8 juegos de lib/games.ts, mismo orden
  ('rocas', 'ROCAS', true);
```

```sql
-- supabase/migrations/<timestamp>_score_functions.sql
-- Las tres con set search_path = '' y revoke execute ... from public; grant execute to anon, authenticated.

public.submit_score(p_game text, p_name text, p_score integer) returns bigint
  -- security definer. Normaliza p_name con upper(trim()).
  -- Lanza excepción si el juego no existe o no es playable, si el nombre queda fuera de 1–10
  -- caracteres o si la puntuación está fuera de 1–10.000.000. Devuelve el id insertado.

public.get_leaderboard(p_game text, p_limit integer default 10)
  returns table (rank integer, player_name text, score integer, created_at timestamptz)
  -- security invoker, stable. Mejor marca por jugador (distinct on player_name);
  -- empate: gana la marca más antigua. Ordenado por score desc, created_at asc. p_limit capado a 50.

public.get_player_best(p_game text, p_name text)
  returns table (rank integer, score integer, created_at timestamptz)
  -- security invoker, stable. Mismo ranking que get_leaderboard; 0 filas si el nombre no tiene marca.
```

```ts
// lib/supabase/anon.ts — sin cookies, apto para "use cache"
import "server-only";
export function createAnonClient(): SupabaseClient<Database>;

// lib/leaderboard.ts
import "server-only";
export async function getLeaderboard(gameId: string): Promise<ScoreRow[]>;
// "use cache" + cacheTag(`leaderboard:${gameId}`). Reusa ScoreRow de lib/scores.ts
// ({ rank, name, score, date }) con date en formato dd/mm/aaaa.
// Si la consulta falla, lanza: el Salón muestra el error boundary, no una tabla vacía cacheada.

// (enmienda) lib/leaderboard.ts
export async function getPlayCount(gameId: string): Promise<number>;
// "use cache" + cacheTag(`leaderboard:${gameId}`): se invalida con el mismo updateTag de submitScore.
// select count exact (head) sobre scores filtrado por game_id con el cliente anon. Si falla, lanza.

// (enmienda) lib/games.ts
type Game = { /* … */ difficulty: 1 | 2 | 3 | 4 | 5 }; // sin `plays`

// app/juegos/[id]/jugar/actions.ts
("use server");
export type SubmitScoreResult = { ok: true } | { ok: false };
export async function submitScore(
  gameId: string,
  name: string,
  score: number,
): Promise<SubmitScoreResult>;
// Llama a rpc("submit_score") con el cliente de servidor. En éxito invalida `leaderboard:${gameId}`.
// En error: console.error en servidor y { ok: false } sin detalle.
```

Estado del guardado en `components/game-player.tsx`:

```ts
type SaveState = "idle" | "saving" | "saved" | "error";
```

Convenciones:

- Los ids de `games` son los de `lib/games.ts`; agregar un juego al catálogo implica una migración nueva que lo inserte.
- `playable` en la DB y `PLAYABLE_GAMES` en `components/games/registry.ts` deben coincidir. El modal decide con `PLAYABLE_GAMES`; la DB es la que valida.
- El nombre que se envía es el mismo del input del modal (mayúsculas, máx. 10). Si queda vacío tras `trim`, se envía `"INVITADO"`.
- Con puntuación 0 el modal no muestra GUARDAR y muestra "SIN PUNTOS PARA GUARDAR".
- Textos del modal: `GUARDANDO…`, `▸ PUNTUACIÓN GUARDADA_`, `NO SE PUDO GUARDAR. REINTENTÁ.` y el link `VER SALÓN DE LA FAMA` a `/salon-de-la-fama?juego=<id>`.
- Podio con menos de 3 filas: los puestos vacíos muestran `—` sin puntuación ni fecha.
- _(enmienda)_ `lib/scores.ts` conserva `ScoreRow` y `formatScoreDate`; `seededScores` se elimina porque `/juegos/[id]` deja de usarlo.
- _(enmienda)_ PARTIDAS se muestra con `toLocaleString("es-ES")` (p. ej. `1.234`), sin abreviar.
- _(enmienda)_ Valores iniciales de `difficulty`, a revisar por el usuario: `bloque-buster` 2, `caida` 3, `serpentina` 2, `gloton` 3, `invasores` 3, `rocas` 4, `ranaria` 3, `duelo-pixel` 2.
- Ninguna migración aplicada se edita; los cambios van en una migración nueva (SPEC 04).

## Plan de implementación

1. Crear la migración `games_scores` con `npm run db:new -- games_scores`, escribir tablas, índice, RLS, policies y la semilla de los 8 juegos, y aplicarla con `npm run db:push`. Verificar con `list_tables` del MCP que existen ambas tablas con RLS activo.
2. Crear la migración `score_functions` con `submit_score`, `get_leaderboard` y `get_player_best`, y aplicarla. Verificar con `execute_sql` que `submit_score('rocas','TEST',100)` inserta, que `submit_score('caida','TEST',100)` y `submit_score('rocas','',100)` fallan, y que `get_leaderboard('rocas')` devuelve la fila. Borrar las filas de prueba.
3. Regenerar tipos con `npm run db:types`. Verificar que `database.types.ts` sigue en UTF-8, incluye `games`, `scores` y las tres funciones, y que `npx tsc --noEmit` pasa.
4. Crear `lib/supabase/anon.ts` y `lib/leaderboard.ts`. Consultar antes `node_modules/next/dist/docs/` sobre `"use cache"`, `cacheTag` y `cacheLife` con `cacheComponents`.
5. Crear `app/juegos/[id]/jugar/actions.ts` con `submitScore`. Consultar `updateTag.md` y `revalidateTag.md` en `node_modules/next/dist/docs/` para elegir la invalidación con lectura inmediata.
6. Modificar `components/game-player.tsx`: reemplazar `saveScore` por `submitScore` con `SaveState`, botón deshabilitado mientras guarda, mensaje de error con reintento, link al Salón tras guardar, caso puntuación 0 y nota "MODO DEMO — NO PUNTÚA" para juegos sin registro. Borrar `lib/score-store.ts`. Diseñar los estados con `/frontend-design`.
7. Modificar `app/salon-de-la-fama/page.tsx`: `HallBoard` usa `getLeaderboard`, el podio soporta menos de 3 filas y hay estado vacío "SIN PUNTUACIONES TODAVÍA". Diseñar el estado vacío con `/frontend-design`.
8. Reescribir `components/hall-you-row.tsx`: con `av_user`, llama a `get_player_best` con el cliente de navegador y muestra rango, puntuación y fecha reales; se oculta sin usuario, sin marca o si la consulta falla. Ajustar sus props en el Salón.
9. Probar en `npm run dev` con Playwright: jugar `rocas`, guardar, abrir el Salón desde el link y ver la marca; error de guardado simulado sin red; juego simulado sin GUARDAR; pestaña vacía. Revisar la consola.
10. Correr `npm run lint`, `npx tsc --noEmit`, `npm run build` y `get_advisors` (security) del MCP.
11. _(enmienda)_ Agregar `getPlayCount` a `lib/leaderboard.ts`. En `lib/games.ts` agregar `difficulty` con los valores de Convenciones y quitar `plays`; en `lib/scores.ts` quitar `seededScores`.
12. _(enmienda)_ Modificar `app/juegos/[id]/page.tsx` y `components/leaderboard.tsx`: aside con `getLeaderboard`, estado vacío, MEJOR GLOBAL real, PARTIDAS con `getPlayCount` y DIFICULTAD desde `difficulty`. Diseñar el estado vacío del aside con `/frontend-design`.
13. _(enmienda)_ Probar en `npm run dev` con Playwright: `/juegos/rocas` con y sin marcas, un juego simulado vacío, guardar una marca y verla en el detalle sin recargar a mano. Volver a correr lint, tsc y build.

## Criterios de aceptación

- [ ] `npm run lint`, `npx tsc --noEmit` y `npm run build` terminan sin errores.
- [ ] `supabase/migrations/` contiene las migraciones `games_scores` y `score_functions`, y `npx supabase migration list` las muestra aplicadas en local y remoto.
- [ ] `public.games` tiene 8 filas con los ids de `lib/games.ts` y solo `rocas` con `playable = true`.
- [ ] Un `insert` directo en `public.scores` con la publishable key es rechazado por RLS.
- [ ] `submit_score` rechaza un juego no jugable, un id inexistente, un nombre vacío o de más de 10 caracteres y puntuaciones 0 o mayores a 10.000.000.
- [ ] `get_leaderboard('rocas')` devuelve como máximo una fila por nombre, con su mejor marca, ordenada de mayor a menor.
- [ ] `get_advisors` (security) no reporta avisos sobre `games`, `scores` ni las tres funciones.
- [ ] `lib/supabase/database.types.ts` incluye `games`, `scores`, `submit_score`, `get_leaderboard` y `get_player_best`.
- [ ] En `/juegos/rocas/jugar`, al terminar con puntuación > 0, GUARDAR PUNTUACIÓN muestra `GUARDANDO…` deshabilitado y luego `▸ PUNTUACIÓN GUARDADA_` con el link VER SALÓN DE LA FAMA.
- [ ] Tras guardar, el link lleva a `/salon-de-la-fama?juego=rocas` y la nueva marca aparece sin recargar a mano.
- [ ] Con la red cortada, GUARDAR muestra `NO SE PUDO GUARDAR. REINTENTÁ.` y el botón vuelve a estar activo; al restaurar la red, reintentar guarda.
- [ ] Con puntuación 0 el modal no muestra GUARDAR y muestra "SIN PUNTOS PARA GUARDAR".
- [ ] En `/juegos/caida/jugar` el modal no muestra GUARDAR y muestra "MODO DEMO — NO PUNTÚA".
- [ ] Ningún archivo del repo referencia `av_scores` ni `lib/score-store`.
- [ ] El Salón muestra las 8 pestañas; en `rocas` el podio y la tabla coinciden con `get_leaderboard('rocas')`.
- [ ] Una pestaña sin puntuaciones muestra "SIN PUNTUACIONES TODAVÍA" y el podio con `—`.
- [ ] Con 1 o 2 marcas, el podio muestra esas marcas y `—` en los puestos restantes, sin errores en consola.
- [ ] Con `av_user` cuyo nombre tiene marca en `rocas`, TU MEJOR MARCA muestra su rango, puntuación y fecha reales; sin marca o sin usuario, la fila no aparece.
- [ ] _(enmienda)_ En `/juegos/rocas` el aside MEJORES PUNTUACIONES coincide con `get_leaderboard('rocas')`; sin marcas muestra "SIN PUNTUACIONES TODAVÍA".
- [ ] _(enmienda)_ MEJOR GLOBAL muestra la puntuación del #1 real, o `—` sin marcas.
- [ ] _(enmienda)_ PARTIDAS muestra la cantidad de filas de `scores` del juego.
- [ ] _(enmienda)_ DIFICULTAD muestra tantas estrellas llenas como `difficulty` del juego.
- [ ] _(enmienda)_ Tras guardar una marca, el detalle del juego la refleja (aside, MEJOR GLOBAL y PARTIDAS) sin recargar a mano.
- [ ] _(enmienda)_ Ningún archivo de `app/`, `components/` ni `lib/` referencia `seededScores` ni `plays`.
- [ ] No hay errores ni warnings de hidratación en la consola en el Salón ni en `/juegos/rocas/jugar`.

## Decisiones

- **Sí:** tabla `games` como espejo mínimo (`id`, `title`, `playable`) sembrado por migración. Da FK e integridad sin tocar ninguna pantalla del catálogo.
- **No:** mover el catálogo completo a la DB. Toca casi todas las pantallas; va en su propia spec si llega.
- **Sí:** escritura solo vía `submit_score` (`security definer`) con validaciones en Postgres. Las reglas viven en la DB y `anon` no tiene insert sobre la tabla.
- **No:** service role key en la Server Action. Revierte una decisión de SPEC 04 sin necesidad.
- **No:** policy de insert para `anon`. Cualquiera insertaría directo vía PostgREST sin pasar por las reglas de nombre y juego.
- **Sí:** Server Action `submitScore` que llama a la RPC. Centraliza la invalidación de caché y no expone errores internos.
- **Sí:** aceptar que, sin Auth, la RPC se puede llamar directo y las puntuaciones son trucables. Anti-trampas y rate limiting van en otra spec.
- **Sí:** mejor marca por jugador, top 10. Un jugador no llena la tabla; empate gana la marca más antigua.
- **No:** listar todas las partidas.
- **Sí:** identidad por nombre (`av_user` o lo escrito en el modal). Es lo único que existe sin Auth.
- **Sí:** solo `rocas` guarda; los simulados ocultan GUARDAR con "MODO DEMO — NO PUNTÚA". Evita llenar la DB de puntuaciones aleatorias.
- **Sí:** abandonar `av_scores` sin migrar. Nadie lo leía y sus datos no son confiables.
- ~~**Sí:** solo el Salón de la Fama con datos reales.~~ _(enmienda)_ **Sí:** también el detalle `/juegos/[id]`. Pedido por el usuario: los datos inventados no pueden convivir con el Salón real.
- _(enmienda)_ **Sí:** PARTIDAS = marcas guardadas. Usa la información que ya existe, sin tablas ni RPC nuevas.
- _(enmienda)_ **No:** registrar cada partida jugada aunque no se guarde. Requiere otra tabla y otra vía de escritura.
- _(enmienda)_ **Sí:** `difficulty` fija por juego en `lib/games.ts`. Es un dato de diseño del juego, no de uso.
- **Sí:** 8 pestañas con estado vacío. Mantiene la navegación actual y prepara los próximos juegos.
- **No:** mostrar solo pestañas de juegos jugables.
- **Sí:** `"use cache"` + `cacheTag("leaderboard:<id>")` invalidado por la Server Action. El Salón no consulta la DB en cada visita y refleja la nueva marca al guardar.
- **No:** lectura dinámica en cada request.
- **Sí:** cliente sin cookies (`lib/supabase/anon.ts`) para la lectura cacheada. `cookies()` no se puede usar dentro de `"use cache"` y la lectura es pública.
- **Sí:** TU MEJOR MARCA con el cliente de navegador y `get_player_best`. El nombre vive en `localStorage`, así que la consulta es del lado del cliente y no rompe la caché del Salón.
- **Sí:** estados de guardado con error y reintento. El usuario sabe si su marca quedó o no.
- **No:** guardado optimista.
- **Sí:** puntuación mínima 1 y máxima 10.000.000. Descarta partidas vacías y valores absurdos.

## Riesgos

| Riesgo                                                                        | Mitigación                                                                                                      |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Spam o puntuaciones falsas llamando a `submit_score` directo                  | Aceptado hasta Auth. Validaciones de rango en la función; se puede borrar con SQL desde el dashboard.           |
| `playable` en la DB y `PLAYABLE_GAMES` desincronizados                        | Convención documentada; si la DB rechaza, el modal muestra el error de guardado en lugar de fallar en silencio. |
| `"use cache"` cachea un error o una tabla vacía                               | `getLeaderboard` lanza ante error; el criterio de "aparece sin recargar" detecta una invalidación rota.         |
| `cookies()` dentro de `"use cache"` rompe el build                            | La lectura usa `lib/supabase/anon.ts`, sin cookies.                                                             |
| La API de invalidación (`updateTag` / `revalidateTag`) difiere de lo conocido | El paso 5 consulta `node_modules/next/dist/docs/` antes de escribir la acción.                                  |
| `security definer` sin `search_path` fijo                                     | Las tres funciones usan `set search_path = ''`; `get_advisors` lo verifica.                                     |
| `db:types` en PowerShell escribe UTF-16                                       | Mismo control que SPEC 04 en el paso 3; si falla, usar el MCP `generate_typescript_types`.                      |
| Nombres ofensivos en un ranking público                                       | Fuera de alcance; moderación en una spec futura.                                                                |

## Lo que **no** entra en esta spec

- Supabase Auth y puntuaciones ligadas a usuarios.
- Rate limiting y anti-trampas.
- Catálogo completo en la DB y `best` real en las tarjetas de la biblioteca.
- Leaderboard real en la Home y el modal.
- Contar partidas no guardadas.
- Migración de `av_scores`.
- Guardado para los juegos simulados.
- Moderación y administración de puntuaciones.
- Tests automatizados.

Cada uno de esos, si llega, va en su propia spec.

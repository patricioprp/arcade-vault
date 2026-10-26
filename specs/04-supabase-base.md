# SPEC 04 — Base técnica de Supabase

> **Estado:** implementado
> **Depende de:** —
> **Fecha:** 2026-10-26
> **Objetivo:** Conectar la app de Next.js al proyecto remoto de Supabase con clientes tipados, migraciones versionadas en el repo y una ruta `/api/health/db` que pruebe la conexión.

## Por qué existe esta spec

Hasta ahora todo vive en `localStorage` (`av_user`, `av_scores`) y en datos mock.
Auth, puntuaciones reales y el Salón de la Fama desde la DB van a depender de Supabase, pero cada uno trae sus propias decisiones de UX, RLS y migración de datos.
Esta spec deja solo la plomería: dependencias, clientes, CLI, flujo de migraciones y tipos. Las features la usan después, cada una en su spec.
El proyecto remoto (`qtfrcvqggtwcjxxcrurn`) hoy no tiene tablas en `public`.

## Alcance

**Entra:**

- Dependencias `@supabase/supabase-js` y `@supabase/ssr`.
- Supabase CLI como devDependency (`supabase`) con scripts npm `db:new`, `db:push` y `db:types`.
- Carpeta `supabase/` inicializada con `supabase init` (`config.toml`) y vinculada al proyecto remoto.
- Primera migración en `supabase/migrations/` que crea solo la función `public.health()`. Sin tablas.
- Cliente de servidor `lib/supabase/server.ts` (`createServerClient` + `cookies()` de `next/headers`).
- Cliente de navegador `lib/supabase/client.ts` (`createBrowserClient`).
- Tipos generados en `lib/supabase/database.types.ts`, pasados como genérico `Database` a ambos clientes.
- Route Handler `GET /api/health/db` que llama a `health()` con el cliente de servidor.
- Variables `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` y `SUPABASE_DB_PASSWORD` documentadas en `.env.example`.

**Fuera de alcance (para specs futuras):**

- Supabase Auth y reemplazo de `av_user` / `useUser`.
- `proxy.ts` con refresco de sesión de `@supabase/ssr`. Va con la spec de Auth.
- Tabla `scores`, sus políticas RLS y migrar `av_scores` a la DB.
- Salón de la Fama y Home leyendo datos reales.
- Service role key, Edge Functions, Storage y Realtime.
- Stack local con Docker (`supabase start`) y branching.
- Cambios visuales en cualquier pantalla.
- Tests automatizados.

## Modelo de datos

La única pieza de base de datos es una función de salud, sin tablas:

```sql
-- supabase/migrations/<timestamp>_health.sql
create or replace function public.health()
returns timestamptz
language sql
stable
security invoker
set search_path = ''
as $$
  select now();
$$;

grant execute on function public.health() to anon, authenticated;
```

Clientes:

```ts
// lib/supabase/server.ts
import "server-only";
import type { Database } from "./database.types";
export async function createClient(): Promise<SupabaseClient<Database>>; // usa await cookies()

// lib/supabase/client.ts
("use client");
import type { Database } from "./database.types";
export function createClient(): SupabaseClient<Database>;
```

Respuesta de la ruta de salud:

```ts
// app/api/health/db/route.ts
type HealthResponse =
  | { ok: true; now: string } // 200, valor devuelto por health()
  | { ok: false }; // 503, el detalle solo va a console.error
```

```bash
# .env.example (se agrega debajo de las variables de Resend)
# Project Settings → API. La publishable key empieza con sb_publishable_.
NEXT_PUBLIC_SUPABASE_URL=https://qtfrcvqggtwcjxxcrurn.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=

# Solo para la CLI (db push). Nunca se lee desde la app.
SUPABASE_DB_PASSWORD=
```

Scripts npm:

```json
"db:new": "supabase migration new",
"db:push": "supabase db push",
"db:types": "supabase gen types typescript --linked --schema public > lib/supabase/database.types.ts"
```

Convenciones:

- Ambos clientes exportan `createClient` y se importan por ruta (`@/lib/supabase/server` o `@/lib/supabase/client`).
- Si falta `NEXT_PUBLIC_SUPABASE_URL` o `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `createClient` lanza un `Error` con el nombre de la variable faltante. La ruta de salud lo captura y responde 503.
- En `server.ts`, `setAll` de cookies va en `try/catch`: desde un Server Component no se pueden escribir cookies y eso no es un error mientras no haya sesión.
- `database.types.ts` es generado: no se edita a mano y se regenera con `npm run db:types` después de cada migración.
- Ninguna migración se edita una vez aplicada al remoto; los cambios van en una migración nueva.

## Plan de implementación

1. Instalar `@supabase/supabase-js`, `@supabase/ssr` y `server-only` como dependencias y `supabase` como devDependency. Agregar los scripts `db:new`, `db:push` y `db:types`. Verificar con `npx supabase --version`.
2. Agregar las tres variables a `.env.example` (sin tocar `.env.template`) y completar `.env.local` con URL y publishable key (obtenibles con el MCP `get_publishable_keys`). Verificar con `git status` que `.env.local` sigue ignorado.
3. Ejecutar `npx supabase init` para crear `supabase/config.toml` y su `.gitignore`. El usuario corre `! npx supabase login` y `! npx supabase link --project-ref qtfrcvqggtwcjxxcrurn` (interactivos). Verificar que `supabase/.temp/` no aparece en `git status`.
4. Crear la migración con `npm run db:new -- health`, escribir el SQL del modelo de datos y aplicarla con `npm run db:push`. Verificar con `npx supabase migration list` que figura en local y remoto.
5. Generar los tipos con `npm run db:types`. Verificar que `lib/supabase/database.types.ts` es UTF-8, contiene `health` dentro de `Functions` y que `npx tsc --noEmit` pasa.
6. Crear `lib/supabase/client.ts` y `lib/supabase/server.ts` según el modelo de datos. Consultar antes la guía oficial de `@supabase/ssr` para Next.js y `node_modules/next/dist/docs/` sobre `cookies()` con `cacheComponents`.
7. Crear `app/api/health/db/route.ts`: `GET` llama a `supabase.rpc("health")`, responde 200 con `{ ok: true, now }` o 503 con `{ ok: false }` y loguea el error en servidor. Consultar `node_modules/next/dist/docs/` sobre Route Handlers con `cacheComponents` para que la respuesta no quede cacheada ni prerenderizada.
8. Correr `npm run lint`, `npx tsc --noEmit` y `npm run build`, y revisar `get_advisors` (security) del proyecto en el MCP de Supabase.

## Criterios de aceptación

- [ ] `npm run lint`, `npx tsc --noEmit` y `npm run build` terminan sin errores.
- [ ] `package.json` lista `@supabase/supabase-js`, `@supabase/ssr` y `server-only` en `dependencies` y `supabase` en `devDependencies`, con los scripts `db:new`, `db:push` y `db:types`.
- [ ] `supabase/config.toml` y `supabase/migrations/<timestamp>_health.sql` están versionados; `supabase/.temp/` no.
- [ ] `npx supabase migration list` muestra la migración `health` aplicada en local y en remoto.
- [ ] El esquema `public` del remoto sigue sin tablas.
- [ ] `lib/supabase/database.types.ts` existe, incluye `health` en `Functions` y ambos clientes lo usan como genérico.
- [ ] Con `.env.local` completo, `GET /api/health/db` responde 200 con `{ "ok": true, "now": "<timestamp ISO>" }`.
- [ ] Dos requests seguidas a `/api/health/db` devuelven `now` distintos (no hay caché), en `dev` y en `start`.
- [ ] Sin `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `GET /api/health/db` responde 503 con `{ "ok": false }` y el servidor loguea la variable faltante.
- [ ] Importar `@/lib/supabase/server` desde un Client Component hace fallar el build (`server-only`).
- [ ] `.env.example` documenta las tres variables y `.env.local` sigue sin versionarse.
- [ ] `SUPABASE_DB_PASSWORD` no aparece en ningún archivo bajo `.next/`.
- [ ] `get_advisors` (security) no reporta avisos sobre `public.health`.
- [ ] Ninguna pantalla existente cambia de comportamiento ni de aspecto.

## Decisiones

- **Sí:** solo base técnica. Auth, puntuaciones y Salón real tienen decisiones propias de UX, RLS y migración de datos; cada uno en su spec.
- **No:** crear ya la tabla `scores`. Elegido por el usuario: el esquema se define en la spec que la usa.
- **Sí:** función `public.health()` como única migración. Prueba Postgres de punta a punta sin inventar tablas, y estrena el flujo de migraciones.
- **No:** health sin DB (`auth.getSession`). No prueba la conexión a Postgres.
- **Sí:** Supabase CLI con migraciones en `supabase/migrations/`. Esquema reproducible y revisable en PR.
- **No:** aplicar migraciones con el MCP o el dashboard. El historial no quedaría en el repo.
- **Sí:** CLI como devDependency con scripts npm. Versión fijada en el lockfile y sin instalación global en Windows.
- **Sí:** solo proyecto remoto. Sin Docker; el proyecto está vacío y no hay datos que romper.
- **No:** stack local con `supabase start`. Requiere Docker; se reconsidera cuando haya datos reales.
- **Sí:** tipos generados en `lib/supabase/database.types.ts`. Los clientes quedan tipados desde el día uno.
- **Sí:** `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Es la convención actual de Supabase con las keys `sb_publishable_…`.
- **No:** `NEXT_PUBLIC_SUPABASE_ANON_KEY` (JWT legacy).
- **No:** service role key. Nada en esta spec la necesita.
- **No:** `proxy.ts` de refresco de sesión. Sin Auth no hay sesión; va con la spec de Auth.
- **Sí:** documentar en `.env.example` y dejar `.env.template` como está. Elegido por el usuario.
- **Sí:** `server-only` en el cliente de servidor. Hace fallar el build si se importa desde el cliente.
- **Sí:** 503 con `{ ok: false }` sin detalle. La ruta es pública y no debe exponer errores internos.

## Riesgos

| Riesgo                                                                                   | Mitigación                                                                                                                             |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `supabase login` y `supabase link` son interactivos y no pueden correrse desde el agente | El paso 3 los delega al usuario con `! <comando>`.                                                                                     |
| La CLI no lee `.env.local`, así que `db push` no encuentra `SUPABASE_DB_PASSWORD`        | Exportar la variable en la shell antes de `db:push` o usar el prompt interactivo de la CLI; `.env.example` lo aclara.                  |
| `db:types` con `>` en PowerShell escribe UTF-16 y rompe `tsc`                            | Los scripts npm corren en `cmd.exe` en Windows; el paso 5 verifica la codificación. Si falla, usar el MCP `generate_typescript_types`. |
| `cookies()` con `cacheComponents` exige `<Suspense>` o falla el prerender                | Consultar `node_modules/next/dist/docs/` en el paso 6; hoy solo la ruta de salud usa el cliente de servidor.                           |
| La ruta de salud queda prerenderizada y cacheada en build                                | Paso 7 consulta la doc de Route Handlers; el criterio de `now` distinto en `start` lo detecta.                                         |
| La API de `@supabase/ssr` difiere de lo conocido                                         | Seguir la guía oficial vigente (MCP `search_docs`) antes del paso 6.                                                                   |
| `public.health()` expuesta a `anon` vía PostgREST                                        | Solo devuelve `now()`, sin datos; `search_path = ''` y `security invoker` evitan los avisos del advisor.                               |

## Lo que **no** entra en esta spec

- Supabase Auth y `proxy.ts`.
- Tabla `scores`, RLS y migración de `av_scores`.
- Datos reales en el Salón de la Fama y la Home.
- Service role, Edge Functions, Storage, Realtime.
- Stack local con Docker y branching.
- Tests automatizados.

Cada uno de esos, si llega, va en su propia spec.

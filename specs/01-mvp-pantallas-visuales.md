# SPEC 01 — MVP visual de Arcade Vault

> **Estado:** aprobado
> **Depende de:** —
> **Fecha:** 2026-10-12
> **Objetivo:** Portar a Next.js App Router las cinco pantallas de `references/templates/` (Biblioteca, Detalle, Reproductor, Acceso y Salón de la Fama) con datos mock y sin implementar ningún juego.

## Por qué existe esta spec

El repo es un scaffold de `create-next-app` con el tema ya portado a `app/globals.css` y las fuentes cargadas en `app/layout.tsx`.
El template de referencia es una SPA con hash routing, React 18 vía UMD y variables globales en `window`.
Esta spec traduce ese prototipo a la arquitectura de Next 16 (rutas reales, Server Components por defecto, Client Components solo donde hay interacción) sin cambiar su aspecto visual.

## Alcance

**Entra:**

- Layout global con navbar (desktop + panel móvil con hamburguesa) y footer, igual que `nav.jsx` y `app.jsx`.
- Pantalla **Biblioteca** en `/`: hero, buscador por nombre, chips de categoría y grilla de tarjetas con efecto tilt.
- Pantalla **Detalle** en `/juegos/[id]`: portada, tags, descripción, stat-strip, acciones y leaderboard lateral.
- Pantalla **Reproductor** en `/juegos/[id]/jugar`: HUD, CRT con arena decorativa, puntuación simulada, Pausa/Reanudar, FIN, modal de Fin del Juego con guardar puntuación y jugar de nuevo.
- Pantalla **Acceso** en `/login`: tabs Iniciar Sesión / Crear Cuenta, formulario, botón Jugar como Invitado y botones sociales decorativos.
- Pantalla **Salón de la Fama** en `/salon-de-la-fama?juego=<id>`: tabs por juego, podio, tabla de ranking y fila "TU MEJOR MARCA" si hay usuario.
- Página 404 temática (`app/not-found.tsx`) para ids de juego inexistentes y rutas desconocidas.
- Login mock persistido en `localStorage` (`av_user`) y guardado de puntuaciones en `localStorage` (`av_scores`).
- Datos mock tipados (juegos, categorías, jugadores, `seededScores`) portados de `data.jsx`.
- Elementos decorativos tal cual el template: contador `CRÉDITOS · 03`, botones GOOGLE/GITHUB sin acción, fila "TU MEJOR MARCA" inventada, versión `v2.6.0` en footer.

**Fuera de alcance (para specs futuras):**

- Cualquier juego real (lógica, canvas, input de teclado/táctil).
- Autenticación real, backend, base de datos o API.
- Leer `av_scores` para mostrar puntuaciones reales en leaderboards o Salón de la Fama.
- Sistema real de créditos/monedas.
- Login social real (Google, GitHub).
- Protección de rutas: todas las pantallas son accesibles sin sesión.
- Tests automatizados (no hay test runner configurado).
- Reescribir los estilos de `globals.css` como utilidades Tailwind.

## Modelo de datos

```ts
// lib/games.ts
export type GameCategory = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
export type GameColor = "cyan" | "magenta" | "yellow" | "green";

export type Game = {
  id: string;          // slug usado en la URL: "bloque-buster"
  title: string;       // "BLOQUE BUSTER"
  short: string;
  long: string;
  cat: GameCategory;
  cover: string;       // clase CSS de portada: "cover-bricks"
  color: GameColor;
  best: number;
  plays: string;       // "12.4K"
};

export const GAMES: Game[];                              // los 8 juegos de data.jsx, mismo orden y textos
export const CATS: ("TODOS" | GameCategory)[];           // ["TODOS", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS"]
export function getGame(id: string): Game | undefined;
```

```ts
// lib/scores.ts
export type ScoreRow = { rank: number; name: string; score: number; date: string }; // date "DD/MM/2026"
export function seededScores(seed: number, count?: number): ScoreRow[];           // port 1:1 de data.jsx (determinista)
```

```ts
// lib/user-store.ts — localStorage key "av_user"
export type User = { name: string };   // name en mayúsculas, máx. 10 caracteres
// hook cliente basado en useSyncExternalStore: { user, login(user), logout() }
```

```ts
// lib/score-store.ts — localStorage key "av_scores"
export type SavedScore = { game: string; score: number; name: string; at: number }; // at = Date.now()
export function saveScore(entry: Omit<SavedScore, "at">): void; // append al array; ignora errores de storage
```

Convenciones:

- Semillas de leaderboards iguales al template: Detalle usa `seededScores(id.length * 17 + 3, 10)`, Salón usa `seededScores(id.length * 23 + 7, 12)`.
- Números formateados con `toLocaleString("es-ES")`.
- Las claves de `localStorage` (`av_user`, `av_scores`) se mantienen sin versión, igual que el template.

## Plan de implementación

1. Crear `lib/games.ts` y `lib/scores.ts` portando `data.jsx` con los tipos anteriores. Verificar con `npx tsc --noEmit`.
2. Crear `lib/user-store.ts` (hook `useUser` con `useSyncExternalStore` sobre `av_user`, snapshot de servidor `null`) y `lib/score-store.ts` (`saveScore`).
3. Crear `components/nav.tsx` (Client Component: `usePathname` para el link activo, `useUser` para mostrar nombre / Iniciar Sesión, estado del panel móvil) y `components/footer.tsx`. "Biblioteca" queda activa en `/` y en `/juegos/*`. Navegación con `next/link`.
4. Modificar `app/layout.tsx` para renderizar `<Nav />`, `<main className="av-main">{children}</main>` y `<Footer />` dentro de `#root`.
5. Reemplazar `app/page.tsx` por la Biblioteca: hero en el Server Component y `components/library.tsx` (Client) con buscador, chips y grilla. Crear `components/game-card.tsx` (Client) con efecto tilt; click en tarjeta o en JUGAR navega a `/juegos/[id]`. Incluir estado vacío "NO HAY RESULTADOS".
6. Crear `app/juegos/[id]/page.tsx` (Server) con `generateStaticParams` sobre `GAMES` y `notFound()` si `getGame` devuelve `undefined`. Crear `components/leaderboard.tsx` para el aside. JUGAR AHORA → `/juegos/[id]/jugar`; VOLVER AL VAULT → `/`.
7. Crear `app/not-found.tsx` con estética arcade (texto en `.pixel`/neón) y botón VOLVER AL VAULT a `/`.
8. Crear `app/juegos/[id]/jugar/page.tsx` (Server: valida id con `notFound()`) y `components/game-player.tsx` (Client) portando `reproductor.jsx`: intervalo de puntuación cada 220 ms, subida de nivel, Pausa/Reanudar, FIN, modal con nombre editable (por defecto el usuario o `INVITADO`), GUARDAR PUNTUACIÓN → `saveScore` + toast, JUGAR DE NUEVO, VOLVER AL VAULT, SALIR → `/juegos/[id]`.
9. Crear `app/login/page.tsx` y `components/auth-form.tsx` (Client) portando `auth.jsx`. Submit → `login({ name })` y `router.push("/")`. JUGAR COMO INVITADO → `logout()` y `router.push("/")`. El botón con nombre en el nav ejecuta `logout()`.
10. Crear `app/salon-de-la-fama/page.tsx` leyendo `searchParams.juego` (default `GAMES[0].id`; id inválido → default). Tabs como `<Link>` a `?juego=<id>`. Podio y tabla en Server Component. La fila "TU MEJOR MARCA" va en un Client Component (`components/hall-you-row.tsx`) que usa `useUser`. Envolver la parte dependiente de `searchParams` en `<Suspense>` según lo que exija `cacheComponents` (consultar `node_modules/next/dist/docs/` antes de escribirlo).
11. Borrar los assets del scaffold que dejan de usarse (`public/next.svg`, `public/vercel.svg` y demás SVG de `create-next-app` sin referencias).

## Criterios de aceptación

- [ ] `npm run lint`, `npx tsc --noEmit` y `npm run build` terminan sin errores.
- [ ] `/` muestra el hero "ARCADE VAULT", el buscador, los 5 chips y las 8 tarjetas.
- [ ] Escribir "ser" en el buscador deja solo SERPENTINA.
- [ ] El chip SHOOTER deja solo INVASORES y ROCAS.
- [ ] Una búsqueda sin coincidencias muestra "NO HAY RESULTADOS".
- [ ] Click en una tarjeta navega a `/juegos/<id>` y muestra título, descripción larga, stat-strip y 10 filas de leaderboard.
- [ ] `/juegos/no-existe` y `/juegos/no-existe/jugar` muestran la 404 temática con botón a `/`.
- [ ] En `/juegos/<id>/jugar` la puntuación sube sola; PAUSA la detiene y muestra "EN PAUSA"; REANUDAR la reactiva.
- [ ] FIN abre el modal con la puntuación final; GUARDAR PUNTUACIÓN agrega una entrada a `localStorage["av_scores"]` y muestra "PUNTUACIÓN GUARDADA".
- [ ] JUGAR DE NUEVO resetea puntuación a 0, vidas a 3 y nivel a 01.
- [ ] En `/login`, la tab CREAR CUENTA muestra el campo de correo y la tab INICIAR SESIÓN lo oculta.
- [ ] Enviar el formulario con usuario "neonfox" redirige a `/` y el nav muestra "NEONFOX ▾"; recargar la página lo mantiene.
- [ ] Click en "NEONFOX ▾" cierra sesión y el nav vuelve a mostrar "Iniciar Sesión".
- [ ] `/salon-de-la-fama` muestra BLOQUE BUSTER seleccionado, podio de 3 y tabla de 12 filas.
- [ ] Click en la tab CAÍDA cambia la URL a `?juego=caida` y actualiza podio y tabla; recargar mantiene la selección.
- [ ] Con sesión iniciada, el Salón muestra la fila "▸ TU MEJOR MARCA EN <JUEGO>"; sin sesión no aparece.
- [ ] El link activo del nav es "Biblioteca" en `/` y `/juegos/*`, y "Salón de la Fama" en `/salon-de-la-fama`.
- [ ] Con viewport ≤ 840 px se ocultan los links y créditos, aparece la hamburguesa y el panel lateral abre y cierra (también al tocar el fondo).
- [ ] No hay errores ni warnings de hidratación en la consola del navegador en ninguna pantalla.

## Decisiones

- **Sí:** App Router con rutas reales en español (`/`, `/juegos/[id]`, `/juegos/[id]/jugar`, `/login`, `/salon-de-la-fama`). URLs compartibles y aprovecha Server Components.
- **No:** SPA con hash como `app.jsx`. Pelea contra el modelo de Next.
- **Sí:** login mock en `localStorage` (`av_user`). Permite ver los estados con y sin usuario sin backend.
- **No:** formulario solo visual. Dejaría sin probar la variante con usuario del nav y del Salón.
- **Sí:** Reproductor con simulación igual al template, incluido guardar en `av_scores`. Muestra todos los estados de la pantalla sin implementar un juego.
- **No:** Reproductor estático. Ocultaría los estados de pausa y fin del juego.
- **Sí:** reutilizar las clases ya portadas en `globals.css` y usar Tailwind para los estilos inline del template. Fidelidad visual con poco riesgo.
- **No:** reescribir todo en Tailwind. Mucho trabajo sin beneficio visible en un MVP.
- **Sí:** juego del Salón en query param `?juego=`. Compartible y renderizable en servidor.
- **No:** `useState` para las tabs del Salón. Se pierde al recargar.
- **Sí:** `notFound()` + `app/not-found.tsx` temático para ids inválidos.
- **No:** redirect silencioso a `/`. Esconde errores de URL.
- **Sí:** mantener decorativos del template (créditos, botones sociales, "TU MEJOR MARCA" inventada, leaderboards con `seededScores`). Se reemplazan cuando existan datos reales.
- **Sí:** `useSyncExternalStore` para leer `localStorage`. Evita mismatches de hidratación entre servidor (sin usuario) y cliente.
- **No:** proteger rutas por sesión. Se puede jugar como invitado, igual que en el template.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Mismatch de hidratación al leer `localStorage` en render | `useSyncExternalStore` con snapshot de servidor `null`; los componentes que dependen del usuario son Client Components. |
| `cacheComponents` exige `<Suspense>` al acceder a `searchParams` / datos dinámicos y el build falla | Consultar `node_modules/next/dist/docs/` antes del paso 10 y envolver la parte dinámica en `<Suspense>`. |
| `localStorage` bloqueado (modo privado) | Lecturas y escrituras en `try/catch`; la app funciona sin persistir. |
| `seededScores` puede generar nombres repetidos si `count` > 18 | Solo se usa con 10 y 12; se mantiene el algoritmo del template. |
| El efecto tilt manipula `style.transform` del DOM | Se aísla en `game-card.tsx` con `useRef`, igual que el template. |

## Lo que **no** entra en esta spec

- Juegos reales.
- Autenticación real, backend y login social.
- Leaderboards alimentados por puntuaciones guardadas.
- Créditos/monedas funcionales.
- Rutas protegidas.
- Tests automatizados.

Cada uno de esos, si llega, va en su propia spec.

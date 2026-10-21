# SPEC 02 — Homepage de Arcade Vault

> **Estado:** aprobado
> **Depende de:** SPEC 01
> **Fecha:** 2026-10-21
> **Objetivo:** Portar la landing de `references/templates/home-about/home.jsx` a `/` y mover la Biblioteca a `/juegos`.

## Por qué existe esta spec

La SPEC 01 dejó la Biblioteca en `/` porque el primer template no tenía landing.
El template `home-about/` agrega una Home de marketing como pantalla de entrada y un nav con link "Inicio".
Ocupar `/` con la Home obliga a reubicar la Biblioteca y a revisar todos los links que hoy asumen que `/` es la colección.

## Alcance

**Entra:**

- Pantalla **Home** en `/` portada de `home.jsx`, con estas secciones en orden:
  - Hero: siluetas pixel flotantes (`FloatingSilhouettes`, 8 SVG), eyebrow "▸ INSERTA UNA MONEDA_", título en 3 líneas, subtítulo, CTAs "▶ EXPLORAR JUEGOS" y "✦ CREAR CUENTA", indicador "DESLIZA ▼".
  - `// 01` ¿POR QUÉ ARCADE VAULT?: 4 feature cards con íconos pixel (`FeatureIcon`).
  - `// 02` JUEGOS DISPONIBLES AHORA: mini-rail con `GAMES.slice(0, 6)` y botón "VER TODOS LOS JUEGOS →".
  - Franja de stats: "12+ JUEGOS", "MILES DE PARTIDAS", "GLOBAL RANKING".
  - `// 03` ACTIVIDAD EN VIVO: ticker "ÚLTIMAS PUNTUACIONES" (7 filas) y "TOP JUGADORES · HOY" (5 filas) con link "VER SALÓN →".
  - `// 04` PRECIOS: tarjeta "JUGADOR VAULT $0", sello "FREE PLAY" y 3 preguntas de FAQ.
  - CTA final "¿LISTO PARA JUGAR?" con botón "INSERTAR MONEDA →".
- Animación `.reveal` de las secciones al entrar en viewport, con fallback para reduced-motion y para HTML previo a la hidratación.
- **Biblioteca** movida de `/` a `/juegos`, sin cambios visuales (hero "ARCADE VAULT", buscador, chips y grilla).
- Nav con links **Inicio** (`/`), **Biblioteca** (`/juegos`) y **Salón de la Fama**, en desktop y en el panel móvil.
- `/login?modo=registro` abre `AuthForm` directamente en la tab CREAR CUENTA.
- Actualización de los links existentes que apuntaban a `/` como Biblioteca.
- Port a `app/globals.css` solo de las clases de la Home presentes en `home-about/styles.css`.

**Fuera de alcance (para specs futuras):**

- Pantalla **Acerca de** + formulario de Contacto (`about.jsx`) y su link "Acerca de" en el nav. Va en su propia spec.
- Reproductor tipo gabinete (clases `.gp-*`, `.dp-*`, `.rivet`, `.screw`, `.score-pop`, `.live-led`) presente en `home-about/styles.css`.
- Datos reales en la Home: leer `av_scores`, top jugadores calculados o conteo real de juegos.
- Agregar juegos para que "12+ JUEGOS" sea cierto.
- Cambios visuales en la Biblioteca, Detalle, Reproductor, Acceso o Salón más allá de sus links.
- Tests automatizados.

## Modelo de datos

Esta feature no introduce datos persistidos ni cambia los tipos de la SPEC 01. Reutiliza `GAMES` de `lib/games.ts`.

Los textos inventados de la Home se copian literales del template a constantes tipadas:

```ts
// lib/home-content.ts
import type { GameColor } from "@/lib/games";

export type Feature = { icon: "GAMEPAD" | "FREE" | "TROPHY" | "ROCKET"; title: string; desc: string; color: GameColor };
export type HomeStat = { n: string; u: string; s: string };          // "12+", "JUEGOS", "Y CONTANDO"
export type RecentScore = { player: string; game: string; score: number; ago: string; color: GameColor };
export type TopPlayer = { rank: number; player: string; score: number };
export type Faq = { q: string; a: string };

export const FEATURES: Feature[];         // 4, mismos textos y colores que home.jsx
export const HOME_STATS: HomeStat[];      // 3
export const RECENT_SCORES: RecentScore[]; // 7, "hace 2 min" … "hace 31 min"
export const TOP_PLAYERS: TopPlayer[];    // 5, NEONFOX 312840 … GLITCHA 138900
export const PRICING_PERKS: string[];     // 6 ítems "✔ …"
export const FAQS: Faq[];                 // 3
```

Convenciones:

- Números formateados con `toLocaleString("es-ES")`, igual que la SPEC 01.
- Barra de top jugadores: ancho `100 - i * 16` % como el template.
- Query param de modo de acceso: `modo=registro` → tab `"up"`; cualquier otro valor o ausencia → tab `"in"`.

## Plan de implementación

1. Mover la Biblioteca: crear `app/juegos/page.tsx` con el contenido actual de `app/page.tsx` (hero + `<Library />`). Dejar `app/page.tsx` temporalmente con un placeholder mínimo. Verificar que `/juegos` se ve igual que antes y que `/juegos/[id]` sigue funcionando.
2. Actualizar `components/nav.tsx`: secciones `"inicio" | "biblioteca" | "salon" | "login"`. `"inicio"` solo en `/`; `"biblioteca"` en `/juegos` y `/juegos/*`. Agregar link "Inicio" en desktop y panel móvil; "Biblioteca" apunta a `/juegos`. El logo sigue yendo a `/`.
3. Actualizar links existentes: VOLVER AL VAULT en `app/juegos/[id]/page.tsx`, `components/game-player.tsx` y `app/not-found.tsx` → `/juegos`. VOLVER A LA BIBLIOTECA en `app/salon-de-la-fama/page.tsx` → `/juegos`. `AuthForm` (login e invitado) sigue redirigiendo a `/`.
4. Portar a `app/globals.css` el bloque `/* ===== HOME PAGE ===== */` de `home-about/styles.css`: clases `.home*`, `.hero-eyebrow`, `.hero-scroll`, `.home-silos`/`.silo`, `.section-*`, `.kicker`, `.feature-*`, `.ft-*`, `.mini-*`, `.stat-*`/`.stats-inner`, `.activity-*`, `.ac-*`, `.ticker`/`.tick-row`/`.tk-*`, `.top-*`/`.tp-*`, `.lb-link`, `.pricing-*`, `.price-card`/`.pc-*`, `.faq-*`, `.final-*`, `.reveal` y sus keyframes. No portar clases de about ni `.gp-*`. Agregar `@media (prefers-reduced-motion: reduce)` que muestre `.reveal` sin transición y detenga la flotación de `.silo`.
5. Crear `lib/home-content.ts` con las constantes del modelo de datos, copiadas literal de `home.jsx`.
6. Crear `components/home-icons.tsx` con `FloatingSilhouettes` y `FeatureIcon` (Server Components, SVG puros, `aria-hidden` en lo decorativo).
7. Crear `components/reveal-root.tsx` (Client): al montar agrega una clase `reveal-ready` a su contenedor y observa con `IntersectionObserver` (threshold 0.12) los `.reveal` descendientes, marcándolos `.in` y dejando de observarlos. El CSS oculta `.reveal` solo bajo `.reveal-ready`, así el HTML del servidor es visible antes de hidratar. Si `IntersectionObserver` no existe, marca todos `.in`.
8. Reemplazar `app/page.tsx` por la Home (Server Component) envuelta en `<RevealRoot className="home fade-in">`, con las 6 secciones del alcance. Navegación con `next/link`: EXPLORAR JUEGOS, VER TODOS LOS JUEGOS e INSERTAR MONEDA → `/juegos`; CREAR CUENTA y EMPEZAR GRATIS → `/login?modo=registro`; mini cards → `/juegos/[id]`; VER SALÓN → `/salon-de-la-fama`.
9. Hacer que `AuthForm` lea `modo` con `useSearchParams` para elegir la tab inicial. Envolver `<AuthForm />` en `<Suspense>` en `app/login/page.tsx` con un fallback que reserve el alto de la tarjeta (consultar `node_modules/next/dist/docs/` sobre `useSearchParams` con `cacheComponents` antes de escribirlo).

## Criterios de aceptación

- [ ] `npm run lint`, `npx tsc --noEmit` y `npm run build` terminan sin errores.
- [ ] `/` muestra el hero con "EL ARCADE / CLÁSICO ESTÁ / DE VUELTA", las 8 siluetas y los dos CTAs.
- [ ] `/` muestra, en orden, las secciones `// 01` a `// 04`, la franja de stats y el CTA final "¿LISTO PARA JUGAR?".
- [ ] La sección `// 02` muestra exactamente 6 mini cards, en el orden de `GAMES`.
- [ ] Click en una mini card navega a `/juegos/<id>` del juego correcto.
- [ ] EXPLORAR JUEGOS, VER TODOS LOS JUEGOS e INSERTAR MONEDA navegan a `/juegos`.
- [ ] CREAR CUENTA y EMPEZAR GRATIS navegan a `/login?modo=registro` y la tab CREAR CUENTA está activa con el campo de correo visible.
- [ ] `/login` sin query param abre en la tab INICIAR SESIÓN.
- [ ] VER SALÓN → navega a `/salon-de-la-fama`.
- [ ] El ticker muestra 7 filas y el top 5 filas, con números formateados con punto de miles (ej. "184.220").
- [ ] `/juegos` muestra el hero "ARCADE VAULT", el buscador, los 5 chips y las 8 tarjetas, igual que la antigua `/`.
- [ ] El link activo del nav es "Inicio" en `/`, "Biblioteca" en `/juegos` y `/juegos/*`, y "Salón de la Fama" en `/salon-de-la-fama`, en desktop y en el panel móvil.
- [ ] VOLVER AL VAULT en Detalle, Reproductor y 404, y VOLVER A LA BIBLIOTECA en el Salón, navegan a `/juegos`.
- [ ] Iniciar sesión o JUGAR COMO INVITADO redirige a `/`.
- [ ] Al hacer scroll, cada sección `.reveal` aparece con su animación al entrar en viewport.
- [ ] Con `prefers-reduced-motion: reduce` emulado, todas las secciones son visibles sin animar.
- [ ] Con JavaScript deshabilitado, todas las secciones de `/` son visibles.
- [ ] Con viewport ≤ 840 px la Home no tiene scroll horizontal y el mini-rail, las grids y precios se apilan según el CSS del template.
- [ ] No hay errores ni warnings de hidratación en la consola en `/`, `/juegos` y `/login?modo=registro`.

## Decisiones

- **Sí:** solo la Home en esta spec. Acerca de + Contacto es otra pantalla con su propio formulario y estados.
- **No:** agregar ya el link "Acerca de" apuntando a una ruta inexistente. Mostraría la 404 desde el nav.
- **Sí:** Biblioteca en `/juegos`. Es el índice natural de `/juegos/[id]` y la URL describe la colección.
- **No:** `/biblioteca`. Dejaría dos prefijos distintos para la misma colección.
- **Sí:** textos y números de la Home literales del template en `lib/home-content.ts`. Mantiene la decisión de decorativos de la SPEC 01 y separa contenido de markup.
- **No:** derivar stats y top jugadores de `GAMES` / `seededScores`. Cambiaría el texto del template ("12+" pasaría a "8").
- **No:** leer `av_scores` en el ticker. Agrega estado cliente y riesgo de hidratación sin que exista un leaderboard real.
- **Sí:** `/login?modo=registro` para abrir CREAR CUENTA. El CTA cumple lo que promete con un cambio chico en `AuthForm`.
- **No:** `/registro` como ruta separada. Duplicaría la pantalla de acceso.
- **Sí:** VOLVER AL VAULT y VOLVER A LA BIBLIOTECA → `/juegos`. Ambos textos significan volver a la colección.
- **Sí:** login e invitado → `/`. Igual que el template, que vuelve a la Home.
- **Sí:** `.reveal` oculto solo bajo `.reveal-ready` y respeto de `prefers-reduced-motion`. El HTML del servidor nunca queda invisible y se respeta la preferencia de accesibilidad.
- **No:** port 1:1 del hook `useReveal` con `document.querySelectorAll`. Oculta contenido sin JS y consulta todo el documento en vez del subárbol.
- **Sí:** Home como Server Component con un único Client Component (`RevealRoot`) para la animación. Minimiza el JS enviado.
- **Sí:** portar solo las clases de la Home a `globals.css`. Evita CSS muerto hasta que lleguen Acerca de y el reproductor gabinete.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| `useSearchParams` en `AuthForm` sin `<Suspense>` rompe el build o la navegación instantánea con `cacheComponents` | Consultar `node_modules/next/dist/docs/` antes del paso 9 y envolver `<AuthForm />` en `<Suspense>` con fallback de alto fijo. |
| Las clases nuevas colisionan con clases existentes de `globals.css` (ej. `.kicker`, `.stat-*`) | Antes del paso 4, buscar cada selector en `globals.css`; si ya existe, comparar reglas y conservar las de la SPEC 01 donde se usen. |
| `.home-hero` usa `calc(100vh - 60px)` y en móvil la barra del navegador corta el hero | Se mantiene el valor del template; si molesta, se ajusta a `100svh` como decisión en la implementación. |
| `IntersectionObserver` no dispara para secciones ya visibles en pantallas altas | El observer marca `.in` en el primer callback para todo lo que ya intersecta; el fallback sin observer marca todo. |
| Links o bookmarks externos a `/` esperando la Biblioteca | La Home tiene tres CTAs visibles a `/juegos`; no se agrega redirect. |

## Lo que **no** entra en esta spec

- Pantalla Acerca de y Contacto.
- Reproductor tipo gabinete (`.gp-*`).
- Datos reales en la Home (puntuaciones guardadas, ranking calculado, conteo real de juegos).
- Nuevos juegos.
- Cambios visuales en las pantallas de la SPEC 01.
- Tests automatizados.

Cada uno de esos, si llega, va en su propia spec.

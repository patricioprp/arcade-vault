# SPEC 05 — Juego real ROCAS (port de Asteroids)

> **Estado:** implementado
> **Depende de:** SPEC 01, SPEC 02
> **Fecha:** 2026-10-26
> **Objetivo:** Portar el Asteroids de `references/started-games/02-asteroids/` a TypeScript y montarlo como juego jugable en `/juegos/rocas/jugar`, integrado con el HUD, la pausa y el modal de fin de partida del reproductor.

## Por qué existe esta spec

Hoy `/juegos/[id]/jugar` simula la puntuación para los 8 juegos del catálogo; ninguno se puede jugar.
`references/started-games/02-asteroids/` trae un Asteroids completo en canvas puro (`game.js`, ~500 líneas, globals y listeners en `window`), pensado para abrirse como `index.html` suelto.
Esta spec lo convierte en el primer juego real de la plataforma, asociado a la entrada `rocas` que ya existe en `lib/games.ts`, y deja un registro por id para que `03-tetris` y `04-arkanoid` entren después con el mismo patrón.
`game.js` incluye un power-up de disparo triple que el README del juego no menciona; se mantiene.

## Alcance

**Entra:**

- Port de `game.js` a TypeScript en `lib/asteroids/`: entidades (`Bullet`, `Asteroid`, `PowerUp`, `Ship`, `Particle`), motor sin acceso al DOM y render separado.
- Misma jugabilidad que `game.js`: constantes de física, tamaños, velocidades, puntos (20/50/100), 3 vidas, invencibilidad de 3 s al reaparecer, 2 s de espera tras morir, niveles con `3 + nivel` asteroides, envolvimiento toroidal, power-up 3x (15 % de drop, garantizado a las 5 bajas, uno por nivel, 5 s de duración, 12 s de vida).
- Render con la paleta neón de la plataforma (trazos vectoriales con glow), diseñado con `/frontend-design`.
- Canvas con mundo lógico de 800×600, escalado por CSS al ancho del `.crt-screen` (4:3) y backing store multiplicado por `devicePixelRatio`.
- Client Component `components/games/asteroids.tsx` que monta el canvas, el loop `requestAnimationFrame` y los listeners de teclado, y los limpia al desmontar.
- Registro `components/games/registry.ts` (id → componente jugable). `GamePlayer` monta el juego real si el id está registrado; si no, sigue la arena simulada actual.
- Pantalla de inicio "PULSA ESPACIO" sobre el CRT con los controles; la partida empieza con Espacio o click.
- HUD de React (`player-hud`) alimentado por el motor: puntuación, vidas, nivel y contador de disparo 3x. El canvas deja de dibujar su HUD y su "GAME OVER".
- Pausa con el botón PAUSA/REANUDAR, con las teclas `P` o `Escape` y automática al ocultarse la pestaña (`visibilitychange`). Usa el overlay "EN PAUSA" existente.
- Fin de partida al perder las 3 vidas o con el botón FIN: abre el modal FIN DEL JUEGO existente con la puntuación real; GUARDAR PUNTUACIÓN usa `saveScore` (`av_scores`) con `game: "rocas"`.
- JUGAR DE NUEVO reinicia el juego desde la pantalla de inicio.
- Las flechas y Espacio no hacen scroll de la página mientras el juego está montado.

**Fuera de alcance (para specs futuras):**

- Controles táctiles y jugabilidad en móvil (en móvil el canvas se ve, pero no se puede jugar).
- Guardar puntuaciones en Supabase, tabla `scores` y RLS.
- Leaderboards y Salón de la Fama leyendo `av_scores`.
- Los OVNIs que menciona la descripción de `rocas` en el catálogo.
- Sonido.
- Tetris y Arkanoid (`references/started-games/03-tetris`, `04-arkanoid`).
- Cambios en la entrada `rocas` del catálogo (título, textos, portada) o en las otras 7 simulaciones.
- Tests automatizados.

## Modelo de datos

```ts
// lib/asteroids/engine.ts — sin DOM: no usa window, document ni requestAnimationFrame
export const WORLD_W = 800;
export const WORLD_H = 600;

export type AsteroidsInput = {
  left: boolean; // ArrowLeft mantenida
  right: boolean; // ArrowRight mantenida
  thrust: boolean; // ArrowUp mantenida
  fire: boolean; // Space pulsada en este frame (se consume al leerla)
};

export type AsteroidsStatus = "playing" | "dead" | "gameover";

export type AsteroidsStats = {
  score: number;
  lives: number; // 3 → 0
  level: number; // empieza en 1
  tripleShot: number; // segundos restantes del 3x, redondeado a 0,1; 0 = inactivo
  status: AsteroidsStatus;
};

export class AsteroidsGame {
  constructor(onStats: (stats: AsteroidsStats) => void); // llama a onStats al crear y solo cuando cambia algún campo
  update(dt: number, input: AsteroidsInput): void; // dt en segundos, capado a 0,05 por el llamador
  getStats(): AsteroidsStats;
}
```

```ts
// lib/asteroids/render.ts
export function drawAsteroids(
  ctx: CanvasRenderingContext2D,
  game: AsteroidsGame,
  now: number,
): void;
// Paleta (valores de app/globals.css): nave #00f5ff, asteroides #ff006e, balas #f5ff00,
// power-up #00ff88, partículas según el color del objeto que explota. Glow con shadowBlur.
```

```ts
// components/games/registry.ts
export type PlayableGameStats = {
  score: number;
  lives: number;
  level: number;
  extra?: { label: string; value: string };
};

export type PlayableGameProps = {
  paused: boolean; // true con pausa o con el modal abierto
  onStats: (stats: PlayableGameStats) => void;
  onGameOver: (finalScore: number) => void;
};

export const PLAYABLE_GAMES: Partial<
  Record<string, ComponentType<PlayableGameProps>>
>; // { rocas: AsteroidsCanvas }
```

Convenciones:

- `lib/asteroids/` es TypeScript puro y no importa React. Todo lo que toca el DOM vive en `components/games/asteroids.tsx`.
- `extra` del HUD para ROCAS: `{ label: "Disparo 3x", value: "4.2s" }` mientras `tripleShot > 0`; si no, se omite y el HUD no muestra esa celda.
- El modal se abre 1 s después de pasar a `gameover`, para que se vea la explosión de la nave.
- `GamePlayer` reinicia el juego remontándolo con una `key` que se incrementa en JUGAR DE NUEVO.
- Al pausar, al ocultarse la pestaña o al desmontar, se vacía el estado de teclas para que ninguna quede "pegada".
- El canvas mantiene `width`/`height` de atributo en `800 * dpr` × `600 * dpr` y dibuja con `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)`.
- `references/started-games/` no se modifica.

## Plan de implementación

1. Crear `lib/asteroids/entities.ts` y `lib/asteroids/engine.ts` portando clases, constantes, `spawnAsteroids`, `nextLevel`, `killShip` y `update` de `game.js`, sin dibujo ni DOM. El input entra por `AsteroidsInput` y las estadísticas salen por `onStats`. Quitar el reinicio con Espacio en `gameover`. Verificar con `npx tsc --noEmit`.
2. Crear `lib/asteroids/render.ts` con los `draw` de cada entidad usando la paleta neón, sin HUD ni texto "GAME OVER". Usar `/frontend-design` para definir colores, grosores y glow.
3. Crear `components/games/registry.ts` con los tipos `PlayableGameStats` / `PlayableGameProps` y `PLAYABLE_GAMES` (vacío por ahora si el componente aún no existe).
4. Crear `components/games/asteroids.tsx` (Client): canvas escalado con DPR, loop rAF con `dt` capado a 50 ms que se detiene con `paused`, listeners `keydown`/`keyup` en `window` con `preventDefault` para flechas y Espacio, overlay "PULSA ESPACIO" con los controles (Espacio o click para empezar), traducción de `AsteroidsStats` a `onStats` y `onGameOver` con 1 s de retraso. Limpiar rAF, listeners y timeout al desmontar. Registrarlo como `rocas` en `PLAYABLE_GAMES`.
5. Modificar `components/game-player.tsx`: si `PLAYABLE_GAMES[game.id]` existe, renderizar ese componente dentro de `.crt-screen` en lugar de `.game-arena`, desactivar la simulación por intervalo, alimentar el HUD con `onStats` (incluida la celda `extra`), abrir el modal con `onGameOver`, pasar `paused || over`, y agregar tecla `P`/`Escape` y `visibilitychange` para pausar (solo con juego real). FIN usa la puntuación actual. JUGAR DE NUEVO incrementa la `key`. Los juegos sin registro se comportan igual que hoy.
6. Probar en `npm run dev` con Playwright en `/juegos/rocas/jugar` (inicio, disparo, pausa, fin, guardar, reiniciar, navegar a SALIR y volver) y en `/juegos/caida/jugar` (simulación intacta). Revisar la consola.
7. Correr `npm run lint`, `npx tsc --noEmit` y `npm run build`.

## Criterios de aceptación

- [ ] `npm run lint`, `npx tsc --noEmit` y `npm run build` terminan sin errores.
- [ ] Ningún archivo de `lib/asteroids/` referencia `window`, `document`, `requestAnimationFrame` ni React.
- [ ] `/juegos/rocas/jugar` muestra un canvas dentro del CRT con el overlay "PULSA ESPACIO" y los controles; el HUD muestra 0 puntos, 3 vidas y nivel 01.
- [ ] Pulsar Espacio (o hacer click en el CRT) inicia la partida con 4 asteroides grandes y la nave en el centro.
- [ ] `←` `→` rotan la nave, `↑` la propulsa y Espacio dispara; la página no hace scroll con esas teclas.
- [ ] Destruir un asteroide grande suma 20 en el HUD, uno mediano 50 y uno pequeño 100.
- [ ] Chocar con un asteroide resta una vida en el HUD; la nave reaparece a los 2 s parpadeando.
- [ ] Al limpiar todos los asteroides, el HUD pasa a nivel 02 y aparecen 5 asteroides grandes.
- [ ] Al recoger el power-up, el HUD muestra la celda "Disparo 3x" con la cuenta regresiva y la nave dispara 3 balas; al terminar la celda desaparece.
- [ ] Con 0 vidas, ~1 s después se abre FIN DEL JUEGO con la misma puntuación del HUD; el canvas no dibuja "GAME OVER".
- [ ] GUARDAR PUNTUACIÓN agrega a `localStorage["av_scores"]` una entrada con `game: "rocas"` y la puntuación final.
- [ ] FIN en medio de la partida detiene el juego y abre el modal con la puntuación actual.
- [ ] JUGAR DE NUEVO cierra el modal, deja el HUD en 0 / 3 / 01 y muestra de nuevo "PULSA ESPACIO".
- [ ] PAUSA, `P` y `Escape` congelan el juego y muestran "EN PAUSA"; REANUDAR, `P` o `Escape` lo reanudan sin salto de posición.
- [ ] Cambiar de pestaña con la partida en curso la deja en pausa al volver.
- [ ] Ir a SALIR y volver a `/juegos/rocas/jugar` no duplica la velocidad del juego ni los disparos (no quedan loops ni listeners viejos).
- [ ] Los trazos se ven nítidos en una pantalla con `devicePixelRatio` 2.
- [ ] `/juegos/caida/jugar` (y el resto sin registro) mantiene la arena y la puntuación simuladas de siempre.
- [ ] No hay errores ni warnings de hidratación en la consola en `/juegos/rocas/jugar`.

## Decisiones

- **Sí:** reusar la entrada `rocas` del catálogo. Ya existe como SHOOTER con portada propia; no hay que tocar datos ni URLs.
- **No:** nueva entrada `asteroides` o renombrar `rocas`. Duplica el juego o cambia URLs y semillas de leaderboard.
- **Sí:** motor TypeScript sin DOM en `lib/asteroids/` y un Client Component que lo monta. Permite limpiar loop y listeners al navegar y separa lógica de render.
- **No:** copiar `game.js` casi tal cual. Sus globals y listeners en `window` sobreviven a la navegación del App Router.
- **Sí:** HUD y modal de la plataforma; el canvas deja de dibujar su HUD y su GAME OVER. Una sola fuente visual de puntuación y guardado en `av_scores`.
- **No:** HUD duplicado en canvas, ni dejar todo en canvas sin guardar puntuación.
- **Sí:** paleta neón de la plataforma con `/frontend-design`. Coherente con el resto de Arcade Vault.
- **No:** blanco vectorial original.
- **Sí:** pausa con botón, `P`/`Escape` y `visibilitychange`. Evita morir al cambiar de pestaña.
- **Sí:** pantalla "PULSA ESPACIO" antes de jugar. Da foco a la página y evita perder vidas al cargar.
- **No:** arranque inmediato como `game.js`.
- **Sí:** FIN termina la partida y abre el modal con la puntuación actual, igual que hoy.
- **Sí:** mantener el power-up 3x tal cual `game.js`, con su contador en el HUD de React.
- **Sí:** registro id → componente en `components/games/registry.ts`. Deja el patrón listo para Tetris y Arkanoid sin `if` por id en `GamePlayer`.
- **Sí:** el registro vive en `components/games/` y no en `lib/games.ts`. `lib/games.ts` sigue siendo solo datos y lo importan Server Components.
- **No:** `if (game.id === "rocas")` en `GamePlayer`. No escala.
- **Sí:** import estático del componente en el registro. El motor pesa pocos KB; se reconsidera `next/dynamic` cuando haya un tercer juego.
- **Sí:** puntuación en `localStorage["av_scores"]` con `saveScore`. La tabla `scores` en Supabase va en su propia spec, como dejó la SPEC 04.
- **No:** Supabase en esta spec. Abre decisiones de Auth y RLS.
- **Sí:** mundo lógico 800×600 con `devicePixelRatio`. La física queda igual que el original y los trazos se ven nítidos.
- **No:** 800×600 fijo escalado solo por CSS. Se ve borroso en pantallas retina.
- **Sí:** solo teclado. Los controles táctiles van en otra spec.
- **Sí:** 1 s entre `gameover` y el modal, y JUGAR DE NUEVO remonta el juego con `key`. Detalles de implementación para que se vea la explosión final y el reinicio no arrastre estado.

## Riesgos

| Riesgo                                                                                 | Mitigación                                                                                                                  |
| -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Loops rAF o listeners que sobreviven al desmontar (Strict Mode monta dos veces en dev) | Todo se registra en un `useEffect` con cleanup completo; el criterio de SALIR y volver lo detecta.                          |
| `onStats` a 60 fps dispara 60 renders por segundo del HUD                              | El motor solo llama a `onStats` cuando cambia algún campo y `tripleShot` se redondea a 0,1 s.                               |
| Espacio activa el botón con foco (PAUSA, SALIR) en lugar de disparar                   | `preventDefault` de Espacio en `keydown` mientras la partida está activa; el inicio por click quita el foco de los botones. |
| Las teclas capturadas bloquean escribir en el input del modal                          | Con `paused` (modal abierto) los listeners no hacen `preventDefault`.                                                       |
| Teclas "pegadas" tras pausar o cambiar de pestaña                                      | Se vacía el estado de teclas en pausa, `blur` y `visibilitychange`.                                                         |
| `dt` enorme al reanudar                                                                | Se reinicia el timestamp anterior al reanudar y `dt` sigue capado a 50 ms.                                                  |
| Cambio de `devicePixelRatio` al mover la ventana a otro monitor                        | Se acepta: el juego sigue funcionando; se recalcula al remontar.                                                            |
| La descripción de `rocas` promete OVNIs que no existen                                 | Fuera de alcance; se anota para una spec futura de contenido o de enemigos.                                                 |

## Lo que **no** entra en esta spec

- Controles táctiles y móvil.
- Puntuaciones en Supabase, leaderboards y Salón de la Fama con datos reales.
- OVNIs y sonido.
- Tetris y Arkanoid.
- Cambios en el catálogo o en las simulaciones de los otros juegos.
- Tests automatizados.

Cada uno de esos, si llega, va en su propia spec.

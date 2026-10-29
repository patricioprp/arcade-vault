# Contrato de un juego jugable en Arcade Vault

Referencia técnica para `/nuevo-juego` y para `/spec-impl` cuando la spec de un juego la cite.
El ejemplo vivo es ROCAS (SPEC 05 + SPEC 06): `lib/asteroids/`, `components/games/asteroids.tsx`, `components/games/registry.ts`.

## 1. Mapa de piezas

| Pieza                          | Archivo                                      | Nuevo / cambia                |
| ------------------------------ | -------------------------------------------- | ----------------------------- |
| Entidades y constantes         | `lib/<slug>/entities.ts`                     | nuevo                         |
| Motor sin DOM                  | `lib/<slug>/engine.ts`                       | nuevo                         |
| Render en canvas               | `lib/<slug>/render.ts`                       | nuevo                         |
| Datos extra (niveles, sprites) | `lib/<slug>/levels.ts`, …                    | nuevo si hace falta           |
| Componente cliente             | `components/games/<slug>.tsx`                | nuevo                         |
| Registro                       | `components/games/registry.ts`               | agrega `"<id>": <Componente>` |
| Habilitar en DB                | `supabase/migrations/<ts>_playable_<id>.sql` | nuevo                         |
| Catálogo (solo id nuevo)       | `lib/games.ts`                               | agrega entrada                |
| Portada (solo id nuevo)        | `app/globals.css` → `.cover-<x>`             | nuevo, con `/frontend-design` |
| Assets (si se usan)            | `public/games/<id>/…`                        | copia desde la referencia     |

`<id>` es el id del catálogo (`caida`, `bloque-buster`…); `<slug>` es el nombre técnico del motor (`tetris`, `arkanoid`), igual que `rocas` → `lib/asteroids/`.

## 2. Referencias conocidas → catálogo

| Referencia     | Id sugerido     | Notas                                                                                                                                                                           |
| -------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `02-asteroids` | `rocas`         | Ya integrado (SPEC 05/06).                                                                                                                                                      |
| `03-tetris`    | `caida`         | PUZZLE, portada `cover-tetro`. Mundo vertical: encuadrar en 4:3. Sin vidas. Tiene `style.css` propio que no se importa.                                                         |
| `04-arkanoid`  | `bloque-buster` | ARCADE, portada `cover-bricks`. Mouse + teclado, spritesheet y sonidos en `assets/`, `levels.js` con 5 niveles, victoria al completar el último, selector de nivel en su pausa. |

Confirmá siempre el mapeo con el usuario: reusar un id simulado no cambia URLs pero sí el texto del catálogo, que puede no coincidir (como los OVNIs de ROCAS).

## 3. Contrato del registro (no cambia salvo decisión explícita)

```ts
// components/games/registry.ts
export type PlayableGameStats = {
  score: number;
  lives: number; // el HUD dibuja "♥" × lives; 0 muestra "—"
  level: number; // el HUD lo muestra con 2 dígitos
  extra?: { label: string; value: string }; // celda opcional; se omite si no aplica
};

export type PlayableGameProps = {
  paused: boolean; // pausa del reproductor o modal abierto
  onStats: (stats: PlayableGameStats) => void;
  onGameOver: (finalScore: number) => void;
};
```

Lo que el reproductor (`components/game-player.tsx`) ya hace y el juego **no** debe duplicar:

- Pausa con el botón, `P`, `Escape` y `visibilitychange`; overlay "EN PAUSA".
- Modal FIN DEL JUEGO, GUARDAR con `submitScore`, estados de guardado, "SIN PUNTOS PARA GUARDAR" con 0.
- Reinicio: JUGAR DE NUEVO remonta el componente con una `key` nueva. El juego no necesita método `reset`.
- FIN a mitad de partida usa la última puntuación de `onStats`.

## 4. Motor (`lib/<slug>/engine.ts`)

- TypeScript puro: **sin** `window`, `document`, `requestAnimationFrame`, `Audio`, `Image` ni React. Criterio de aceptación verificable con `grep`.
- Expone `WORLD_W`, `WORLD_H`, un tipo `<X>Input` (estado de controles del frame), `<X>Stats` con `status` (`"playing" | … | "gameover"`), y una clase:

```ts
export class <X>Game {
  constructor(onStats: (stats: <X>Stats) => void); // emite al crear y solo cuando cambia un campo
  update(dt: number, input: <X>Input): void;        // dt en segundos, capado a 0,05 por el llamador
  getStats(): <X>Stats;
}
```

- Valores continuos que van al HUD (timers) se redondean (p. ej. a 0,1 s) para no emitir 60 veces por segundo.
- Las acciones de un solo disparo (disparar, rotar pieza, lanzar pelota) entran como `true` en el frame y el llamador las consume.
- La victoria (completar el último nivel) pasa a `status: "gameover"` igual que la derrota; la puntuación final es la acumulada. Si se quiere distinguir, se agrega un campo a `Stats`, no un modal propio.
- Se quitan del port: reinicio con tecla, pausa propia, selector de nivel, HUD y textos "GAME OVER" en canvas, globals y listeners.
- La jugabilidad (constantes, puntos, tiempos, probabilidades) se mantiene idéntica a la referencia salvo decisión explícita en la spec.

## 5. Render (`lib/<slug>/render.ts`)

```ts
export function draw<X>(ctx: CanvasRenderingContext2D, game: <X>Game, now: number): void;
```

- Paleta neón de `app/globals.css`: cian `#00f5ff`, magenta `#ff006e`, amarillo `#f5ff00`, verde `#00ff88`; fondo negro; glow con `shadowBlur`. Definirla con `/frontend-design`.
- Sin HUD ni textos de fin. Puede dibujar paneles propios del juego (siguiente pieza de Tetris) si la spec lo decide.
- Si se usan sprites, el `HTMLImageElement` lo carga el componente y se pasa como parámetro; el render no crea imágenes.

## 6. Componente (`components/games/<slug>.tsx`)

Copiá la estructura de `components/games/asteroids.tsx`, que ya resuelve:

1. `"use client"`. Refs para `onStats`/`onGameOver` actualizadas en un `useEffect` sin deps, para no reiniciar el juego cuando cambian.
2. Efecto de montaje: canvas con `width = WORLD_W * dpr`, `height = WORLD_H * dpr`, `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)`; crea el motor; dibuja el primer frame detrás del overlay; `onGameOver` con 1 s de retraso tras `gameover`; cleanup del timeout.
3. Efecto de loop: solo con `started && !paused`; `last` se reinicia en cada arranque (sin salto al reanudar); `dt` capado a 0,05; cleanup con `cancelAnimationFrame`.
4. Efecto de teclado: no hace nada con `paused` (para no bloquear el input del modal); `preventDefault` solo de las teclas capturadas; `keyup` también con `preventDefault` (Espacio sobre botones con foco); vacía teclas en `blur` y en cleanup. **No** escucha `P` ni `Escape` (son del reproductor).
5. Overlay de inicio "PULSA ESPACIO PARA EMPEZAR" con título del juego y tabla de controles (incluida `P` → Pausa); Espacio o click empiezan.
6. Canvas `className="block h-full w-full"` dentro de `absolute inset-0`, con `aria-label` descriptivo.

Variantes según el juego:

- **Mundo no 4:3**: el `WORLD_W × WORLD_H` lógico se elige 4:3 (p. ej. 800×600) y el tablero se dibuja centrado dentro; el CRT es `aspect-ratio: 4/3`.
- **Mouse**: `pointermove` sobre el canvas; convertir con `(e.clientX - rect.left) * WORLD_W / rect.width`. Ignorar con `paused`. Opcional `requestPointerLock` solo si la spec lo pide.
- **Repetición de teclas** (Tetris: mover lateral, soft drop): la repetición la maneja el motor con timers (DAS/ARR) o se usa `e.repeat`; decidirlo en la spec.
- **Sprites**: copiar a `public/games/<id>/`, cargar con `new Image()` en el efecto de montaje y no empezar el loop hasta `onload` (o dibujar vectorial mientras tanto).
- **Sonido**: si entra, `Audio` vive en el componente (el motor emite eventos, p. ej. `onEvent("brick")`); respetar `paused` y no sonar antes de la primera interacción. Si no entra, va en "Fuera de alcance".
- **Sin vidas**: `lives: 0` (HUD `—`) o cambiar `lives` a opcional en el registro y en el HUD (cambio de contrato: documentarlo en Decisiones).

## 7. Leaderboard (Supabase)

Nueva migración con `npm run db:new -- playable_<id>` y `npm run db:push`:

```sql
-- id existente del catálogo (era simulado)
update public.games set playable = true where id = '<id>';
```

```sql
-- id nuevo
insert into public.games (id, title, playable) values ('<id>', '<TÍTULO>', true);
```

Verificación (MCP `execute_sql`), y borrar luego las filas de prueba:

```sql
select public.submit_score('<id>', 'TEST', 100);
select * from public.get_leaderboard('<id>');
delete from public.scores where game_id = '<id>' and player_name = 'TEST';
```

- No regenerar tipos: es un cambio de datos, no de esquema.
- La puntuación enviada debe ser un entero entre 1 y 10.000.000; con 0 el modal ya no ofrece GUARDAR.
- Tras registrar el componente, el modal deja de mostrar "MODO DEMO — NO PUNTÚA" y el Salón deja de ofrecer solo la demo para ese id.
- `get_advisors` (security) no debe sumar avisos.

## 8. Id nuevo en el catálogo

- Entrada completa en `lib/games.ts`: `id`, `title`, `short`, `long`, `cat`, `cover`, `color`, `best`, `difficulty`. El texto describe lo que el juego hace de verdad.
- Clase `.cover-<x>` en `app/globals.css` siguiendo las existentes (`.cover-rocas` etc.), diseñada con `/frontend-design`.
- `generateStaticParams` de `/juegos/[id]` y `/juegos/[id]/jugar` y las pestañas del Salón salen de `GAMES`: no hay que tocarlos, pero sí verificarlos.

## 9. Verificación estándar (pasos finales del plan)

1. `npm run dev` + Playwright en `/juegos/<id>/jugar`: overlay de inicio, HUD inicial, controles, puntos, pérdida de vida o condición de fin, cambio de nivel, pausa (botón, `P`, `Escape`, cambio de pestaña), fin, GUARDAR → VER SALÓN DE LA FAMA con la marca, JUGAR DE NUEVO, SALIR y volver sin loops duplicados.
2. `/salon-de-la-fama?juego=<id>` y `/juegos/<id>` muestran la marca sin recargar a mano.
3. Otro juego simulado sigue en MODO DEMO; `/juegos/rocas/jugar` sigue funcionando.
4. Consola sin errores ni warnings de hidratación.
5. `npm run lint`, `npx tsc --noEmit`, `npm run build`.

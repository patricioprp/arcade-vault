---
name: nuevo-juego
description: Crea o porta un juego jugable para Arcade Vault con su leaderboard en Supabase e integrado en la plataforma (reproductor, HUD, pausa, modal FIN DEL JUEGO, Salón de la Fama y detalle /juegos/[id]). Usar cuando el usuario quiera agregar un juego nuevo, portar uno de references/started-games/ (Tetris, Arkanoid, …) o volver jugable un juego simulado del catálogo. Produce la spec siguiendo el método de /spec y deja el plan listo para /spec-impl.
argument-hint: "<carpeta de references/started-games, id del catálogo o descripción del juego>"
allowed-tools: Read, Glob, Grep, Write, Edit, AskUserQuestion, Bash(ls:*), Bash(cat:*), Bash(date:*), Bash(wc:*), Bash(grep:*), Bash(git status:*)
---

# /nuevo-juego — Juegos jugables con leaderboard

## Contexto de la sesión

Fecha de hoy (para la cabecera de la spec, no la adivines):
!`date +%F`

Specs existentes:
!`ls specs/`

Juegos de referencia disponibles:
!`ls references/started-games/ 2>/dev/null || echo "No hay carpeta de referencias"`

Registro de juegos jugables:
!`cat components/games/registry.ts`

Ids del catálogo:
!`grep -n 'id: "' lib/games.ts`

Migraciones aplicadas:
!`ls supabase/migrations/`

---

Este skill convierte un juego (de `references/started-games/` o descrito por el usuario) en un juego **jugable y que puntúa** en Arcade Vault, reutilizando el patrón de la SPEC 05 (ROCAS) y la infraestructura de leaderboard de la SPEC 06.

Leé `contrato.md` (en esta misma carpeta) antes de proponer nada: tiene el contrato técnico, los esqueletos de código y la lista de trampas ya resueltas. Usá `plantilla-spec.md` como punto de partida de la spec.

**Respondé siempre en español.** El proyecto sigue Spec Driven Design: este skill **no escribe código de la app**; escribe la spec. La implementación se hace después con `/spec-impl`.

## Qué ya está resuelto y no se rehace

La SPEC 06 dejó el leaderboard genérico por `game_id`. Para un juego nuevo **no** hay que tocar:

- `submit_score`, `get_leaderboard`, `get_player_best` ni las tablas `games` / `scores`.
- `app/juegos/[id]/jugar/actions.ts` (`submitScore` + `updateTag("leaderboard:<id>")`).
- `lib/leaderboard.ts` (`getLeaderboard`, `getPlayCount`).
- `components/game-player.tsx`: GUARDAR, MODO DEMO, pausa con `P`/`Escape`/`visibilitychange`, remontado con `key`.
- Salón de la Fama y detalle `/juegos/[id]`: leen de `GAMES` y de la DB.
- `lib/supabase/database.types.ts`: no cambia si solo se insertan o actualizan filas.

Lo único que hace falta por juego: **motor + render + componente + registro + migración de datos** (y, si el id es nuevo, la entrada del catálogo y su portada).

## Flujo

Seguí las fases en orden. No saltes la Fase 3: las preguntas son lo que evita que la implementación improvise.

### Fase 1 — Identificar el origen

El argumento recibido es: `$ARGUMENTS`

- Si nombra una carpeta de `references/started-games/` (completa, solo número o solo slug), ese es el origen.
- Si nombra un id del catálogo, buscá si hay una referencia que encaje (ver tabla en `contrato.md`) y confirmalo con el usuario.
- Si describe un juego sin referencia, el origen es "desde cero".
- Si está vacío, mostrá las referencias disponibles, los ids del catálogo que todavía no están en `PLAYABLE_GAMES` y preguntá cuál.

Si el id ya está en `PLAYABLE_GAMES`, avisá que ya es jugable y preguntá si se trata de una mejora (eso es otra spec, no este skill).

### Fase 2 — Entender el juego

**Con referencia** — leé completos, sin modificarlos nunca:

- `README.md`, `CLAUDE.md` y cualquier `specs/` de la carpeta.
- `game.js` y los demás `.js` (`levels.js`, `assets/spritesheet.js`, …), `index.html` y `style.css`.
- Inventario de `assets/` (imágenes, sonidos).

Extraé y anotá: dimensiones del mundo, constantes de física y tiempos, sistema de puntos, vidas, niveles, condición de fin (derrota **y** victoria), controles (teclado/mouse), pausa propia, HUD y textos dibujados en canvas, dependencias de assets, globals y listeners en `window`, y comportamientos que el README no menciona (como el disparo 3x de ROCAS).

**Desde cero** — pedí al usuario reglas, controles, puntuación, vidas, niveles y condición de fin hasta poder escribirlas con la misma precisión.

### Fase 3 — Preguntas de integración

Preguntá como lo hace `/spec`: en bloques de 3 a 5 con `AskUserQuestion`, opciones concretas (2–4) y tu recomendación primero y marcada. Esperá la respuesta de cada bloque antes del siguiente. Preguntá solo lo que no se deduce del código.

Además de las categorías generales de `/spec` (alcance, datos, integración, persistencia, UX y estados, riesgos, decisiones ya cerradas), estas son las decisiones típicas de un juego, todas detalladas en `contrato.md`:

1. **Id del catálogo**: reusar una entrada simulada existente (recomendado si encaja: no cambia URLs ni la semilla de `games`) o crear una nueva (implica entrada en `lib/games.ts`, portada `.cover-*` y migración `insert`).
2. **Ajuste al CRT 4:3**: si el mundo no es 4:3 (p. ej. Tetris vertical), cómo se encuadra (tablero centrado con paneles laterales dibujados en canvas, etc.).
3. **Vidas en el HUD**: si el juego no tiene vidas, `lives: 0` (el HUD muestra `—`) o hacer `lives` opcional en el registro.
4. **Celda `extra` del HUD**: qué dato propio del juego se muestra (líneas, power-up, combo…).
5. **Assets y sonido**: sprites copiados a `public/games/<id>/` o redibujo vectorial neón; sonido dentro o fuera de alcance.
6. **Controles**: teclado, mouse/pointer (coordenadas reescaladas al mundo lógico), táctil fuera de alcance salvo pedido.
7. **Funciones de la referencia que chocan con la plataforma**: pausa propia, selector de nivel, "GAME OVER" en canvas, reinicio con tecla, pantalla de victoria. Por defecto se quitan y los cubre el reproductor.
8. **Escala de puntuación**: debe ser entero entre 1 y 10.000.000; si el juego puntúa distinto (tiempo, decimales), cómo se convierte.
9. **Dificultad** (1–5) si el id es nuevo, o confirmar la existente.

Dejá de preguntar cuando puedas responder sin suponer nada las tres preguntas de `/spec`: qué archivos aparecen o cambian, cuál es el primer y el último paso ejecutable, y cómo se verifica que está terminado. Si el usuario responde algo ambiguo, repreguntá. Si quiere saltear preguntas, recordale: "Las preguntas ahora ahorran horas después. ¿Seguro que querés saltearlas?"; si insiste, respetalo y anotalo en Decisiones ("Definición rápida sin aclaración detallada").

### Fase 4 — Escribir la spec

**Antes de crear el archivo de spec, leé completos `.claude/skills/spec/SKILL.md` y `.claude/skills/spec/template.md`.** Seguí sus Fases 3 y 4 y sus "Hard rules"; si algo de este skill choca con `/spec`, manda `/spec`. Este skill solo agrega el contenido específico de juegos.

1. Leé las dos specs más recientes para copiar idioma, encabezados, estados y estilo. Usá `template.md` de `/spec` como estructura y `plantilla-spec.md` (esta carpeta) como contenido base.
2. Redacción, como indica `/spec`:
   - Si la Fase 3 dejó respondidas las tres preguntas, escribí la spec completa de una vez, sin pedir confirmación sección por sección.
   - Solo si falta información, desarrollala sección por sección mostrando cada una y esperando confirmación.
   - Nada de `TODO` ni placeholders `<…>` sin reemplazar: si falta un dato, volvé a preguntar.
3. Guardado, como indica `/spec`:
   - Número: el más alto de `specs/` + 1, con dos dígitos. Nombre: `specs/NN-juego-<id>-<slug-del-original>.md` (p. ej. `07-juego-caida-tetris.md`).
   - Fecha: la del contexto de la sesión, nunca inventada.
   - Escribí el archivo directamente, sin pedir permiso por el nombre; preguntá solo si ya existe.
   - Estado `borrador`. **No** lo marques `aprobado`: lo hace el usuario al releerla.
   - Verificá que las dependencias del encabezado (`SPEC 05`, `SPEC 06` y las que sumes) existan en `specs/`.
   - Si `specs/.spec-config.yml` no existe, crealo con el contenido por defecto de `/spec`; si existe, no lo toques.
4. Confirmación final, como indica `/spec`: ruta del archivo, recordatorio de que está en `borrador` y que el usuario la pase a `aprobado` tras releerla, mención de `.spec-config.yml` si lo creaste, y siguiente paso `/spec-impl NN-juego-<id>-<slug>`. **Detenete ahí**: no propongas implementar ni escribas código.

La spec incluye en su plan los pasos de `contrato.md` y lo cita, así que `/spec-impl` puede ejecutarla sin este skill.

## Reglas

- `references/started-games/` no se modifica nunca. Los assets que se usen se copian.
- Todo diseño visual (paleta del render, overlay de inicio, portada nueva, estados nuevos) pasa por `/frontend-design`, como pide `CLAUDE.md`.
- Antes de cualquier API de Next, la spec debe indicar consultar `node_modules/next/dist/docs/` (este Next difiere del conocido).
- Ninguna migración aplicada se edita; cada juego suma una migración nueva.
- `playable` en la DB y `PLAYABLE_GAMES` siempre coinciden: registrar el componente y la migración van en la misma spec.
- Un juego por spec.

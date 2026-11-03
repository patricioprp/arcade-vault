# TODO — Sugerencias de juegos (@game-planner)

Lista de trabajo derivada de la memoria de `@game-planner` (`.claude/agent-memory/game-planner/MEMORY.md`). Orden = puntaje /25 (Estética, Competencia, Viabilidad, Balance, Esfuerzo inverso). Flujo por juego: `/nuevo-juego <id>` → `/spec-impl` → PR → actualizar `references/implemented-games.md`.

Última actualización: 2026-11-03 (20 sugerencias, 5 por categoría). Los puntajes de cada categoría se calcularon por separado: sirven para ordenar dentro de una categoría más que para comparar entre categorías.

## Pendientes (sugeridos)

### Prioridad alta (22–23)

- [ ] **DUELO PIXEL** (`duelo-pixel`) · VERSUS · cyan · dif 2 · **23** — id simulado con portada; primer VERSUS jugable. Pong vs escalera de rivales CPU, 3 vidas; punto = 100 × rival + 10 por golpe de rally; bonus 1000 × rival × vidas al vencerlo. Riesgo: reescribir `long` (quitar el 2 jugadores) y calibrar la IA.
  - `/nuevo-juego duelo-pixel — Pong contra CPU en escalera de rivales, 3 vidas, puntaje por punto × rival + bonus por rally y por rival vencido`
- [ ] **INVASORES** (`invasores`) · SHOOTER · green · dif 3 · **22** — id simulado con portada; oleadas infinitas 5×11, escudos, nave misteriosa. Riesgo: escudos por celdas, cadencia enemiga. Ficha: `.claude/agent-memory/game-planner/ideas/invasores.md`
  - `/nuevo-juego invasores`
- [ ] **COLUMNAS** (`columnas`) · PUZZLE · cyan · dif 3 · **22** — tríos de gemas que caen, 3+ en línea (incl. diagonal), cadenas multiplican; reusa grilla/DAS de CAÍDA. Riesgo: parecer clon de CAÍDA.
  - `/nuevo-juego columnas: tríos verticales de gemas que caen y rotan colores, 3+ en línea incluidas diagonales, combos en cadena multiplican, color cyan, dificultad 3`

### Prioridad media (20–21)

- [ ] **ALUNIZAJE** (`alunizaje`) · ARCADE · magenta · dif 4 · **21** — módulo con rotación y propulsor, plataformas x2/x3/x5, combustible limitado, gravedad creciente. Riesgo: física y colisión con terreno.
  - `/nuevo-juego alunizaje: módulo con rotación y propulsor, plataformas con multiplicador, combustible limitado, gravedad creciente por nivel`
- [ ] **ASEDIO** (`asedio`) · SHOOTER · magenta · dif 5 · **21** — arena twin-stick (WASD mueve, flechas disparan en 8 direcciones), oleadas infinitas, multiplicador x1–x8 por racha. Riesgo: ghosting de teclado, curva de spawn.
  - `/nuevo-juego asedio: shooter de arena con WASD para mover y flechas para disparar en 8 direcciones, oleadas infinitas, multiplicador por racha sin daño`
- [ ] **ESTELA** (`estela`) · VERSUS · magenta · dif 3 · **21** — motos de luz en grilla vs 1–3 bots, cada ronda suma bots y velocidad. Riesgo: IA (flood-fill) calibrada por ronda.
  - `/nuevo-juego estela — motos de luz en grilla contra 1–3 bots CPU, rondas crecientes, puntaje por supervivencia y bots eliminados`
- [ ] **GLOTÓN** (`gloton`) · ARCADE · yellow · dif 3 · **20** — id simulado; laberinto, píldoras, 4 fantasmas encadenables. Riesgo: IA de fantasmas, 3er ARCADE.
  - `/nuevo-juego gloton`
- [ ] **TÚNEL** (`tunel`) · ARCADE · yellow · dif 3 · **20** — una tecla, caverna procedural que se estrecha y acelera, sin vidas. Riesgo: demasiado simple, generación justa.
  - `/nuevo-juego tunel: una tecla, caverna procedural con scroll infinito que se estrecha y acelera, puntaje por distancia y cristales, sin vidas`
- [ ] **CRISTALES** (`cristales`) · PUZZLE · magenta · dif 2 · **20** — match-3 por intercambio con cursor, contrarreloj de 90 s con bonus de tiempo. Riesgo: intercambio con teclado, cascadas como estados.
  - `/nuevo-juego cristales: match-3 por intercambio con cursor de teclado, contrarreloj de 90 s con bonus por combos de 4-5, cascadas multiplican`
- [ ] **FUSIÓN** (`fusion`) · PUZZLE · green · dif 2 · **20** — fusión de bloques en grilla 4×4. Riesgo: partidas largas (evaluar modo con reloj).
  - `/nuevo-juego fusion: fusión de bloques en grilla 4x4, iguales se duplican, puntaje = suma de fusiones, evaluar modo con reloj`
- [ ] **CIEMPIÉS** (`ciempies`) · SHOOTER · cyan · dif 4 · **20** — ciempiés de 12 segmentos que se divide, campo de hongos, araña y pulga. Riesgo: casos borde de la división.
  - `/nuevo-juego ciempies: shooter de franja inferior contra un ciempiés que se divide al recibir disparos, campo de hongos, araña y pulga`
- [ ] **CIUDADELA** (`ciudadela`) · SHOOTER · yellow · dif 3 · **20** — defensa antimisiles, 3 baterías, explosiones en cadena, bonus por ciudades. Riesgo: mira por teclado además de mouse.
  - `/nuevo-juego ciudadela: defensa antimisiles con mira (mouse o flechas), 3 baterías con munición limitada, explosiones en cadena`
- [ ] **ARTILLERÍA** (`artilleria`) · VERSUS · yellow · dif 2 · **20** — duelo de cañones por turnos vs CPU, viento y terreno destructible. Riesgo: ritmo lento.
  - `/nuevo-juego artilleria — duelo de cañones por turnos contra CPU con viento y terreno destructible, puntaje por duelos ganados y precisión`

### Prioridad baja (18–19)

- [ ] **PIRÁMIDE** (`piramide`) · ARCADE · magenta · dif 4 · **19** — pirámide isométrica de cubos que cambian de color. Riesgo: render isométrico, saltos diagonales.
  - `/nuevo-juego piramide: pirámide isométrica de cubos que cambian de color al pisarlos, enemigos que caen, saltos diagonales`
- [ ] **MAREA** (`marea`) · PUZZLE · yellow · dif 4 · **19** — bloques ascendentes, cursor de 2 casillas, combos y cadenas. Riesgo: el más complejo de PUZZLE.
  - `/nuevo-juego marea: tablero que sube, cursor de 2 casillas que intercambia en horizontal, 3+ iguales se eliminan, combos y cadenas multiplican`
- [ ] **BURBUJAS** (`burbujas`) · PUZZLE · cyan · dif 3 · **19** — disparo de burbujas en grilla hexagonal, techo que baja. Riesgo: hex + rebotes + apuntar con teclado.
  - `/nuevo-juego burbujas: cañón apuntado con flechas, grilla hexagonal, 3+ iguales revientan, sueltas caen con bonus, techo desciende`
- [ ] **RANARIA** (`ranaria`) · ARCADE · green · dif 3 · **18** — id simulado; cruzar carriles y río. Riesgo: techo de puntaje bajo, 3er ARCADE.
  - `/nuevo-juego ranaria`
- [ ] **ENJAMBRE** (`enjambre`) · SHOOTER · magenta · dif 3 · **18** — formación con entradas en curva y picadas. Riesgo: se superpone con INVASORES.
  - `/nuevo-juego enjambre: shooter de formación con entradas en curva y picadas sobre el cañón, x2 por derribo en picada`
- [ ] **BLINDADOS** (`blindados`) · VERSUS · green · dif 4 · **18** — tanques cenitales vs CPU, balas que rebotan. Riesgo: IA con pathfinding.
  - `/nuevo-juego blindados — combate de tanques cenital contra CPU con balas que rebotan, rondas con más enemigos`
- [ ] **PUÑOS** (`punos`) · VERSUS · magenta · dif 4 · **18** — boxeo frontal con golpes telegrafiados vs circuito de rivales. Riesgo: mucho contenido visual.
  - `/nuevo-juego punos — boxeo frontal contra circuito de rivales CPU con golpes telegrafiados, puntaje por golpes, contragolpes y KO rápido`

## Descartados

(ninguno)

## Implementados

- [x] ROCAS (`rocas`) — SPEC 05
- [x] CAÍDA (`caida`) — SPEC 07
- [x] BLOQUE BUSTER (`bloque-buster`) — SPEC 08
- [x] SERPENTINA (`serpentina`) — SPEC 09

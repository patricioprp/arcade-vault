# Memoria de @game-planner

## Estado del catálogo (al 2026-11-03)

Jugables: `rocas` (SHOOTER, yellow, dif 4), `caida` (PUZZLE, magenta, dif 3), `bloque-buster` (ARCADE, cyan, dif 2), `serpentina` (ARCADE, green, dif 2).

Simulados en el catálogo (candidatos): `gloton` (ARCADE, yellow, dif 3), `invasores` (SHOOTER, green, dif 3), `ranaria` (ARCADE, green, dif 3), `duelo-pixel` (VERSUS, cyan, dif 2).

Referencias en `references/started-games/`: 02-asteroids, 03-tetris, 04-arkanoid — todas ya portadas. No quedan referencias sin portar.

Specs hasta 09 (SERPENTINA). La próxima sería la 10.

## Sugerencias

Consultas del 2026-11-03: (1) recomendación única → INVASORES; (2) lista de 20 juegos, 5 por categoría, evaluados en paralelo por categoría (los puntajes entre categorías no están 100 % calibrados entre sí). Lista de trabajo: `.claude/agents/game-suggestion-todo.md`.

| Fecha      | id          | Título      | Categoría | Estado   | Motivo                                                                                                                            |
| ---------- | ----------- | ----------- | --------- | -------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 2026-11-03 | duelo-pixel | DUELO PIXEL | VERSUS    | sugerido | 23/25 (antes evaluado 18): resuelto el puntaje — Pong vs escalera de rivales CPU, 3 vidas, bonus por rally y rival vencido.       |
| 2026-11-03 | invasores   | INVASORES   | SHOOTER   | sugerido | 22/25, recomendado en la 1ª consulta: id simulado con portada, oleadas infinitas. Ficha: [ideas/invasores.md](ideas/invasores.md) |
| 2026-11-03 | columnas    | COLUMNAS    | PUZZLE    | sugerido | 22/25 (antes 21): tríos de gemas que caen, cadenas en diagonal; reusa grilla/DAS de CAÍDA. Requiere entrada nueva y portada.      |
| 2026-11-03 | alunizaje   | ALUNIZAJE   | ARCADE    | sugerido | 21/25: lunar lander, plataformas con multiplicador, combustible limitado; riesgo: física/colisión con terreno.                    |
| 2026-11-03 | asedio      | ASEDIO      | SHOOTER   | sugerido | 21/25: arena twin-stick en teclado (WASD + flechas), multiplicador por racha; cubre dificultad 5; riesgo: ghosting.               |
| 2026-11-03 | estela      | ESTELA      | VERSUS    | sugerido | 21/25: motos de luz vs 1–3 bots, rondas crecientes; IA por flood-fill, grilla de SERPENTINA.                                      |
| 2026-11-03 | gloton      | GLOTÓN      | ARCADE    | sugerido | 20/25: id simulado muy competitivo; IA de 4 fantasmas + laberinto = esfuerzo alto, sería el 3er ARCADE.                           |
| 2026-11-03 | tunel       | TÚNEL       | ARCADE    | sugerido | 20/25: una tecla, caverna procedural infinita, puntaje por distancia; riesgo: demasiado simple, generación justa.                 |
| 2026-11-03 | cristales   | CRISTALES   | PUZZLE    | sugerido | 20/25: match-3 por intercambio con contrarreloj 90 s; riesgo: intercambio con teclado, cascadas como estados.                     |
| 2026-11-03 | fusion      | FUSIÓN      | PUZZLE    | sugerido | 20/25: fusión de bloques 4×4; motor trivial pero partidas largas (evaluar modo con reloj).                                        |
| 2026-11-03 | ciempies    | CIEMPIÉS    | SHOOTER   | sugerido | 20/25: ciempiés que se divide en campo de hongos, araña y pulga; muchos casos borde.                                              |
| 2026-11-03 | ciudadela   | CIUDADELA   | SHOOTER   | sugerido | 20/25: defensa antimisiles, 3 baterías, explosiones en cadena; necesita mira por teclado además de mouse.                         |
| 2026-11-03 | artilleria  | ARTILLERÍA  | VERSUS    | sugerido | 20/25: duelo de cañones por turnos vs CPU con viento y terreno destructible; ritmo lento.                                         |
| 2026-11-03 | piramide    | PIRÁMIDE    | ARCADE    | sugerido | 19/25: pirámide isométrica de cubos que cambian de color; render isométrico y saltos diagonales costosos.                         |
| 2026-11-03 | marea       | MAREA       | PUZZLE    | sugerido | 19/25: bloques ascendentes, cursor de 2 casillas, combos y cadenas; el más complejo de PUZZLE.                                    |
| 2026-11-03 | burbujas    | BURBUJAS    | PUZZLE    | sugerido | 19/25: disparo de burbujas en grilla hexagonal, techo que baja; riesgo: hex + rebotes + apuntar con teclado.                      |
| 2026-11-03 | ranaria     | RANARIA     | ARCADE    | sugerido | 18/25 (antes evaluado): id simulado barato, pero 3er ARCADE, repite green y techo de puntaje bajo.                                |
| 2026-11-03 | enjambre    | ENJAMBRE    | SHOOTER   | sugerido | 18/25: formación con entradas en curva y picadas; se superpone con INVASORES, no hacerlos seguidos.                               |
| 2026-11-03 | blindados   | BLINDADOS   | VERSUS    | sugerido | 18/25: tanques cenitales vs CPU con balas que rebotan; IA con pathfinding, la mecánica más compleja.                              |
| 2026-11-03 | punos       | PUÑOS       | VERSUS    | sugerido | 18/25: boxeo frontal con golpes telegrafiados vs circuito de rivales; mucho contenido visual y de patrones.                       |

Estados válidos: sugerido · aceptado · descartado · implementado (`evaluado` = considerado en la tabla pero no propuesto).

## Preferencias del usuario

(ninguna registrada todavía)

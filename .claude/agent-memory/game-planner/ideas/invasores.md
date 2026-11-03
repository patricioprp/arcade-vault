# INVASORES (`invasores`) — recomendado 2026-11-03

- SHOOTER · green · dificultad 3 · id simulado ya en el catálogo (portada `cover-invaders` existente).
- Corto: "Defiende el planeta de filas alienígenas."
- Mecánica: cañón horizontal (←/→ o A/D), Espacio dispara (1 bala propia en pantalla). Formación 5×11 que avanza en bloque, baja al tocar el borde y acelera a medida que quedan menos. Escudos destructibles. Nave misteriosa cruzando arriba.
- Puntaje: 10/20/30 por fila de alien, nave misteriosa 50–300; bonus por oleada limpia. Oleadas infinitas, cada una empieza más abajo/rápida → techo alto.
- HUD: score, lives 3, level = oleada, extra opcional "OLEADA".
- Fin: sin vidas o un alien toca la línea del cañón.
- Riesgos: escudos con daño por píxel (simplificar a celdas de 4×4 en el motor); cadencia de disparos alienígenas para balance; sin referencia en started-games (port desde cero); motor sin DOM con muchas entidades (arrays planos, sin GC por frame).
- Revisar texto `long` del catálogo contra lo implementado.

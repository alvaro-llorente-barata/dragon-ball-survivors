# Estado (versión 2.0)

| Fase | Estado | Qué hay |
|---|---|---|
| A Ataques | Hecha | 4 huecos (1-4/Tab), solo ataca el seleccionado, Vínculo de Ki (hasta 3 por hueco), 32 ataques con evolución real (nivel 5 + pasiva), 14 pasivas, 2 rerolls por partida |
| B Personajes | Hecha | 176 personajes en 9 sagas, 10 estilos de juego, 8 pasivas propias, transformaciones en partida (E) para Goku, Vegeta, Gohan, Freezer, Cell, Broly y Goku niño |
| C Gacha | Hecha | Una máquina por saga (solo su saga), tiradas 1/10/100, tragaperras con Bolas de Dragón, garantías por banner, fragmentos, premio por saga completa, favoritos |
| D Sprites | Parcial | Más peinados, complexiones, capas, espadas, barbas, halos y tamaños. Siguen siendo píxel art generado por código (20x24). Ver "Arte pendiente" |
| E Dificultad | Hecha | Normal / Difícil / Pesadilla, presión por tramos (min 3, 6, 10, 15, 20, 25), oleadas que rodean, 6 enemigos nuevos con IA propia, jefes Cell, Majin Buu y jefe definitivo al minuto 30 (Broly Full Power / Jiren), menos curación |
| F Pulido | Parcial | Interfaz de huecos, carta dorada, ventana de vínculo, revelación mítica |

## Arte pendiente

No existen sprites de Dragon Ball con licencia libre, y no tengo herramienta de generación de imágenes.
Para usar arte real (48x48 o 64x64), añade PNG en `public/assets/characters/` y regístralos en `src/assets/manifest.ts`
(claves `char_<id>`, `char_<id>_<forma>`, `enemy_<id>`, `boss_<id>_<fase>`). Faltan animaciones de daño, muerte y transformación propias.

## Pendiente

- Bolas de Dragón en partida y Shenron, fusiones jugables en partida, modo historia, misiones y logros.
- Enemigos temáticos de GT y Super en mapas nuevos.
- Copia de seguridad del código anterior: rama `backup/v0.1-antes-2.0`.

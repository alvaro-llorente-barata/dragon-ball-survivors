/**
 * Sustitución de sprites provisionales por arte final.
 *
 * Por defecto está vacío: todo el arte se genera por código y no hay imágenes externas.
 * Para usar un sprite propio (o con licencia compatible):
 *   1. Copia el PNG en public/assets/characters/ (hoja de 7 fotogramas de 20x24 px:
 *      abajo x2, arriba x2, lateral x2, lateral atacando).
 *   2. Añade aquí una entrada con la clave de textura. Claves usadas por el juego:
 *      char_<personaje>, char_<personaje>_<forma>, enemy_<enemigo>, boss_<jefe>_<fase>.
 *
 * Ejemplo: { 'char_goku': 'assets/characters/goku.png' }
 */
export const SPRITE_OVERRIDES: Record<string, string> = {};

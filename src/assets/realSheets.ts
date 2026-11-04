/**
 * Hojas de sprites reales (vista lateral) para los personajes que tienen arte en
 * public/assets/characters/. Cada hoja son 4 fotogramas del mismo tamaño:
 *   0 = quieto (idle) · 1,2 = andar · 3 = atacar.
 * El personaje mira a la DERECHA; el motor voltea en X según la dirección.
 *
 * Generadas con scripts/auto_sprites.py a partir del material del usuario.
 * Los personajes que no aparezcan aquí siguen usando el chibi generado por código.
 */
export interface RealSheet {
  /** ruta relativa servible (bajo /public) */
  url: string;
  frameW: number;
  frameH: number;
  frames: number;
}

export const REAL_SHEET_FRAMES = 4;

/** clave de textura (char_<id> / char_<id>_<forma>) -> tamaño de fotograma */
const SIZES: Record<string, [number, number]> = {
  char_goku: [41, 49],
  char_goku_kaioken: [47, 53],
  char_goku_ssj_freezer: [41, 52],
  char_goku_ssj: [42, 53],
  char_goku_ssj2: [45, 53],
  char_goku_ssj3: [43, 53],
  char_goku_ssj4: [47, 50],
  char_goku_god: [47, 53],
  char_goku_blue: [53, 63],
  char_goku_ui: [56, 60],
  char_goku_ui_complete: [45, 60],
  char_goku_gt: [42, 53],
  char_goku_black: [47, 52],
  char_goku_black_rose: [48, 54],
  char_vegeta: [38, 53],
  char_vegeta_namek: [46, 63],
  char_vegeta_ssj: [50, 74],
  char_super_vegeta: [50, 74],
  char_majin_vegeta: [37, 52],
  char_vegeta_ssj4: [45, 67],
  char_vegeta_god: [39, 67],
  char_vegeta_blue: [53, 58],
  char_vegeta_blue_evo: [36, 60],
  char_vegeta_gt: [46, 63],
  char_gohan_kid: [32, 56],
  char_gohan_namek: [32, 56],
  char_gohan_teen: [40, 49],
  char_gohan_ssj: [40, 49],
  char_gohan_ssj2: [40, 49],
  char_gohan_ultimate: [51, 56],
  char_gohan_beast: [40, 58],
  char_piccolo: [46, 48],
  char_piccolo_jr: [46, 48],
  char_piccolo_kami: [46, 48],
  char_orange_piccolo: [46, 48],
  char_krillin: [40, 48],
  char_krillin_kid: [40, 48],
  char_raditz: [44, 53],
  char_saibaman_p: [29, 42],
  char_freezer_1: [43, 51],
  char_freezer_3: [64, 71],
  char_freezer_final: [44, 44],
  char_freezer_100: [59, 55],
  char_golden_freezer: [40, 48],
  char_cooler: [56, 56],
  char_cell_imperfect: [44, 63],
  char_cell_semi: [33, 56],
  char_cell_perfect: [40, 54],
  char_cell_super: [40, 54],
  char_android_16: [42, 61],
  char_android_17: [41, 47],
  char_android_18: [37, 44],
  char_majin_buu: [49, 67],
  char_super_buu: [56, 62],
  char_kid_buu: [40, 50],
  char_trunks: [37, 49],
  char_trunks_ssj: [55, 55],
  char_gotenks: [44, 51],
  char_vegito: [54, 63],
  char_vegito_ssj: [36, 57],
  char_broly: [64, 75],
  char_broly_ssj: [82, 69],
  char_turles: [36, 61],
  char_janemba: [36, 60],
  char_beerus: [51, 60],
  char_jiren: [33, 43],
  char_toppo: [58, 64],
  char_hit: [39, 57],
  char_caulifla: [35, 56],
  char_kale: [38, 58],
  char_kefla: [52, 54],
  char_cabba: [34, 47],
  char_frost: [37, 48],
  char_zamasu: [47, 56],
  char_fused_zamasu: [89, 78],
  char_gogeta_ssj4: [46, 65],
  char_gogeta_blue: [46, 65],
  char_bardock: [41, 49],
};

export const REAL_SHEETS: Record<string, RealSheet> = Object.fromEntries(
  Object.entries(SIZES).map(([key, [w, h]]) => [
    key,
    { url: `assets/characters/${key}.png`, frameW: w, frameH: h, frames: REAL_SHEET_FRAMES },
  ]),
);

export function realSheet(key: string): RealSheet | undefined {
  return REAL_SHEETS[key];
}

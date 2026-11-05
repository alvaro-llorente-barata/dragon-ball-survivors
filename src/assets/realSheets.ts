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

/**
 * clave de textura (char_<id> / char_<id>_<forma>) -> tamaño de fotograma.
 * Estos valores DEBEN coincidir con el tamaño real de cada PNG (ancho/4 × alto).
 * Se generan desde los propios PNG; no editar a mano (ver scripts/auto_sprites.py).
 */
const SIZES: Record<string, [number, number]> = {
  char_android_16: [54, 60],
  char_android_17: [41, 47],
  char_android_18: [37, 46],
  char_bardock: [41, 53],
  char_beerus: [51, 58],
  char_black_freezer: [67, 62],
  char_broly: [44, 62],
  char_broly_ssj: [61, 73],
  char_cabba: [34, 46],
  char_caulifla: [50, 52],
  char_cell_imperfect: [47, 56],
  char_cell_perfect: [42, 54],
  char_cell_semi: [54, 61],
  char_cell_super: [42, 54],
  char_cooler: [46, 52],
  char_freezer_1: [43, 51],
  char_freezer_100: [40, 48],
  char_freezer_3: [81, 79],
  char_freezer_final: [44, 44],
  char_frost: [37, 48],
  char_fused_zamasu: [48, 56],
  char_gogeta_blue: [42, 53],
  char_gogeta_ssj4: [42, 53],
  char_gohan_beast: [38, 53],
  char_gohan_kid: [42, 47],
  char_gohan_namek: [42, 47],
  char_gohan_ssj: [41, 48],
  char_gohan_ssj2: [40, 53],
  char_gohan_teen: [41, 48],
  char_gohan_ultimate: [51, 56],
  char_goku: [41, 53],
  char_goku_black: [47, 56],
  char_goku_black_rose: [48, 53],
  char_goku_blue: [39, 57],
  char_goku_god: [47, 53],
  char_goku_gt: [42, 52],
  char_goku_kaioken: [47, 53],
  char_goku_ssj: [42, 52],
  char_goku_ssj2: [45, 52],
  char_goku_ssj3: [43, 53],
  char_goku_ssj4: [47, 50],
  char_goku_ssj_freezer: [41, 52],
  char_goku_ui: [36, 59],
  char_goku_ui_sign: [55, 60],
  char_golden_freezer: [40, 48],
  char_gotenks: [42, 47],
  char_hit: [39, 53],
  char_janemba: [42, 51],
  char_jiren: [36, 43],
  char_kale: [37, 47],
  char_kefla: [52, 54],
  char_kid_buu: [40, 46],
  char_krillin: [35, 42],
  char_krillin_kid: [35, 42],
  char_majin_buu: [50, 60],
  char_majin_vegeta: [42, 54],
  char_orange_piccolo: [44, 44],
  char_piccolo: [44, 44],
  char_piccolo_jr: [44, 44],
  char_piccolo_kami: [44, 44],
  char_raditz: [44, 53],
  char_saibaman_p: [32, 36],
  char_super_buu: [56, 62],
  char_super_vegeta: [46, 54],
  char_toppo: [58, 63],
  char_trunks: [35, 46],
  char_trunks_ssj: [54, 55],
  char_turles: [41, 53],
  char_vegeta: [44, 52],
  char_vegeta_blue: [53, 58],
  char_vegeta_blue_evo: [56, 57],
  char_vegeta_god: [44, 52],
  char_vegeta_gt: [44, 52],
  char_vegeta_namek: [44, 52],
  char_vegeta_ssj: [46, 54],
  char_vegeta_ssj4: [54, 61],
  char_vegito: [44, 54],
  char_vegito_ssj: [38, 57],
  char_zamasu: [47, 56],
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

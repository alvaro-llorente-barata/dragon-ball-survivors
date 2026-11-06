import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  REAL_SHEETS,
  REAL_SHEET_FRAMES,
  displayScale,
  realSheet,
  sheetFor,
  sheetLoadList,
} from '../assets/realSheets';

/** Lee el ancho y alto de un PNG desde su cabecera IHDR (bytes 16-24). */
function pngSize(path: string): { w: number; h: number } {
  const buf = readFileSync(path);
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

/**
 * Salvaguarda: cada hoja declarada en realSheets.ts debe coincidir con el tamaño
 * real del PNG (ancho = frameW × 4, alto = frameH). Si no, Phaser corta mal los
 * fotogramas y el personaje se dibuja como la hoja entera (bug de "4 Broly").
 */
describe('hojas de sprites reales', () => {
  const dir = join(process.cwd(), 'public', 'assets', 'characters');
  for (const [key, s] of Object.entries(REAL_SHEETS)) {
    it(`${key}: el PNG coincide con el tamaño declarado`, () => {
      const { w, h } = pngSize(join(dir, `${key}.png`));
      expect(w).toBe(s.frameW * REAL_SHEET_FRAMES);
      expect(h).toBe(s.frameH);
    });
  }
});

describe('alias de enemigos y jefes', () => {
  it('enemy_saibaman usa la hoja de Saibaman', () => {
    expect(sheetFor('enemy_saibaman')).toBe('char_saibaman_p');
  });
  it('cada fase de un jefe usa la hoja de su jefe', () => {
    expect(sheetFor('boss_raditz_0')).toBe('char_raditz');
    expect(sheetFor('boss_raditz_1')).toBe('char_raditz');
    expect(sheetFor('boss_jiren_full_1')).toBe('char_jiren');
  });
  it('un enemigo o jefe sin arte real no tiene hoja', () => {
    expect(sheetFor('boss_inexistente_0')).toBeUndefined();
    expect(sheetFor('enemy_inexistente')).toBeUndefined();
  });
  it('la escala iguala la altura chibi (24 px)', () => {
    const s = realSheet('boss_vegeta_0');
    expect(s).toBeDefined();
    expect(displayScale('boss_vegeta_0')).toBeCloseTo(24 / (s?.frameH ?? 24));
    expect(displayScale('boss_inexistente_0')).toBe(1);
  });
  it('la carga incluye alias y fases de jefe, y todas apuntan a PNG existentes', () => {
    const list = sheetLoadList();
    expect(list.some((x) => x.key === 'enemy_saibaman')).toBe(true);
    expect(list.some((x) => x.key === 'boss_raditz_0')).toBe(true);
    expect(list.some((x) => x.key === 'boss_ginyu_0')).toBe(true);
    expect(list.some((x) => x.key === 'enemy_cell_jr')).toBe(true);
    expect(list.some((x) => x.key === 'boss_inexistente_0')).toBe(false);
  });
});

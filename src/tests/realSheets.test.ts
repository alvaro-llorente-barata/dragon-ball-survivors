import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { REAL_SHEETS, REAL_SHEET_FRAMES } from '../assets/realSheets';

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

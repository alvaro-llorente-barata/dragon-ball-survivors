import { describe, expect, it } from 'vitest';
import { normalizeCode, redeemCode } from '../services/codeService';
import { CHARACTERS } from '../data/characters';
import { defaultMeta, parseMeta, serializeMeta } from '../services/saveService/meta';

describe('canjear códigos', () => {
  it('normaliza mayúsculas y espacios', () => {
    expect(normalizeCode('  davante ')).toBe('DAVANTE');
    expect(normalizeCode('da van te')).toBe('DAVANTE');
  });

  it('DAVANTE desbloquea todos los personajes', () => {
    const r = redeemCode(defaultMeta(), 'DAVANTE');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.meta.unlockedCharacters.length).toBe(CHARACTERS.length);
    for (const c of CHARACTERS) expect(r.meta.unlockedCharacters).toContain(c.id);
    expect(r.meta.redeemedCodes).toEqual(['DAVANTE']);
  });

  it('crea progreso para cada personaje desbloqueado', () => {
    const r = redeemCode(defaultMeta(), 'davante');
    if (!r.ok) throw new Error('debería canjearse');
    for (const c of CHARACTERS) expect(r.meta.characters[c.id]).toEqual({ level: 1, shards: 0 });
  });

  it('no se puede canjear dos veces', () => {
    const first = redeemCode(defaultMeta(), 'DAVANTE');
    if (!first.ok) throw new Error('debería canjearse');
    const second = redeemCode(first.meta, 'DAVANTE');
    expect(second.ok).toBe(false);
    expect(second.ok ? '' : second.message).toContain('ya se ha canjeado');
  });

  it('rechaza códigos inválidos y vacíos', () => {
    expect(redeemCode(defaultMeta(), 'NOEXISTE').ok).toBe(false);
    expect(redeemCode(defaultMeta(), '   ').ok).toBe(false);
  });

  it('no altera el estado original', () => {
    const m = defaultMeta();
    const before = m.unlockedCharacters.length;
    redeemCode(m, 'DAVANTE');
    expect(m.unlockedCharacters.length).toBe(before);
  });

  it('el canje sobrevive a guardar y cargar (no se puede repetir tras recargar)', () => {
    const r = redeemCode(defaultMeta(), 'DAVANTE');
    if (!r.ok) throw new Error('debería canjearse');
    const back = parseMeta(JSON.parse(serializeMeta(r.meta)));
    expect(back.redeemedCodes).toEqual(['DAVANTE']);
    expect(redeemCode(back, 'DAVANTE').ok).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import { CHARACTERS } from '../data/characters';
import { MAX_WEAPONS, candidateUpgrades } from '../game/logic/upgrades';
import { createRunState } from '../game/logic/run';
import { getCharacter } from '../data/characters';
import { mulberry32 } from '../game/logic/rng';
import { PITY_EPIC, PITY_MYTHIC, levelUpCharacter, levelUpCost, starProbabilities, summon, summonOnce } from '../services/gachaService';
import { defaultMeta, parseMeta } from '../services/saveService/meta';

const withTickets = (n: number) => ({ ...defaultMeta(), tickets: n, coins: 100000 });

describe('invocaciones', () => {
  it('las probabilidades suman 100 y 7★ es la más rara', () => {
    const p = starProbabilities();
    expect(Object.values(p).reduce((a, b) => a + b, 0)).toBeCloseTo(100, 5);
    expect(p[7]).toBeLessThan(p[1]);
    expect(Object.keys(p).map(Number)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
  it('gasta tickets y desbloquea personajes', () => {
    const { meta, results } = summon(withTickets(10), 10, mulberry32(1));
    expect(meta.tickets).toBe(0);
    expect(results).toHaveLength(10);
    for (const r of results) expect(meta.unlockedCharacters).toContain(r.characterId);
  });
  it('sin tickets no se puede invocar', () => {
    expect(() => summonOnce(withTickets(0), mulberry32(1))).toThrow();
    expect(() => summon(withTickets(5), 10, mulberry32(1))).toThrow();
  });
  it('garantía de 4★ cada 10 invocaciones', () => {
    for (let seed = 0; seed < 30; seed++) {
      const { results } = summon(withTickets(PITY_EPIC), PITY_EPIC, mulberry32(seed));
      expect(results.some((r) => r.stars >= 4)).toBe(true);
    }
  });
  it(`garantía de 7★ en ${PITY_MYTHIC} invocaciones`, () => {
    const { results } = summon(withTickets(PITY_MYTHIC), PITY_MYTHIC, mulberry32(7));
    expect(results.some((r) => r.stars === 7)).toBe(true);
  });
  it('los repetidos dan fragmentos según sus estrellas', () => {
    let meta = withTickets(200);
    const res = summon(meta, 200, mulberry32(3));
    meta = res.meta;
    const dup = res.results.find((r) => !r.isNew)!;
    expect(dup.shards).toBe(dup.stars * 5);
    const total = res.results.filter((r) => r.characterId === dup.characterId && !r.isNew).reduce((a, r) => a + r.shards, 0);
    expect(meta.characters[dup.characterId].shards).toBe(total);
  });
  it('la distribución observada se parece a la declarada', () => {
    const p = starProbabilities();
    const counts: Record<number, number> = {};
    let meta = withTickets(20000);
    const rng = mulberry32(42);
    // Se reinicia la garantía cada vez para medir solo la tasa base.
    for (let i = 0; i < 20000; i++) {
      const r = summonOnce({ ...meta, gacha: { pulls: 0, sinceEpic: 0, sinceMythic: 0 } }, rng);
      meta = r.meta;
      counts[r.result.stars] = (counts[r.result.stars] ?? 0) + 1;
    }
    for (const s of [1, 2, 3, 4, 7]) expect(Math.abs(((counts[s] ?? 0) / 20000) * 100 - p[s])).toBeLessThan(1.2);
  });
  it('subir nivel gasta fragmentos y monedas', () => {
    const cost = levelUpCost(1);
    const meta = { ...withTickets(0), characters: { goku: { level: 1, shards: cost.shards } } };
    const r = levelUpCharacter(meta, 'goku');
    expect(r.ok).toBe(true);
    expect(r.meta.characters.goku).toEqual({ level: 2, shards: 0 });
    expect(levelUpCharacter(r.meta, 'goku').ok).toBe(false);
    expect(levelUpCharacter(meta, 'goku_ui').ok).toBe(false);
  });
  it('el guardado conserva personajes y contadores', () => {
    const { meta } = summon(withTickets(15), 15, mulberry32(5));
    const back = parseMeta(JSON.parse(JSON.stringify(meta)));
    expect(back.unlockedCharacters).toEqual(meta.unlockedCharacters);
    expect(back.gacha).toEqual(meta.gacha);
    expect(Object.keys(back.characters).sort()).toEqual(Object.keys(meta.characters).sort());
  });
  it('todos los personajes tienen entre 1 y 7 estrellas', () => {
    for (const c of CHARACTERS) {
      expect(c.stars).toBeGreaterThanOrEqual(1);
      expect(c.stars).toBeLessThanOrEqual(7);
    }
  });
});

describe('límite de ataques', () => {
  it(`como máximo ${MAX_WEAPONS} ataques`, () => {
    expect(MAX_WEAPONS).toBe(4);
    const goku = getCharacter('goku');
    const run = createRunState(goku, 100, 100, 0);
    for (const id of goku.weaponPool.slice(0, 4)) run.weapons[id] = 1;
    expect(candidateUpgrades(run, goku).some((c) => c.kind === 'weapon_new')).toBe(false);
    expect(candidateUpgrades(run, goku).some((c) => c.kind === 'weapon_up')).toBe(true);
  });
});

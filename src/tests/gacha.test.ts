import { describe, expect, it } from 'vitest';
import { CHARACTERS, charactersOfSaga, getCharacter } from '../data/characters';
import { SAGAS, type Saga } from '../data/types';
import { mulberry32 } from '../game/logic/rng';
import { PITY_EPIC, PITY_TOP, SAGA_REWARD, bannerPool, claimSagaRewards, levelUpCharacter, levelUpCost, sagaProgress, starProbabilities, summon, summonOnce } from '../services/gachaService';
import { defaultMeta, parseMeta } from '../services/saveService/meta';

const withTickets = (n: number) => ({ ...defaultMeta(), tickets: n, coins: 100000 });
const sagaOf = (id: string) => getCharacter(id).saga;

describe('catálogo', () => {
  it('al menos 150 personajes con id único y saga válida', () => {
    expect(CHARACTERS.length).toBeGreaterThanOrEqual(150);
    expect(new Set(CHARACTERS.map((c) => c.id)).size).toBe(CHARACTERS.length);
    for (const c of CHARACTERS) expect(SAGAS).toContain(c.saga);
  });
  it('no hay nombres repetidos por accidente', () => {
    const names = CHARACTERS.map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
  });
  it('cada saga tiene personajes de varias rarezas', () => {
    for (const s of SAGAS) {
      const pool = charactersOfSaga(s);
      expect(pool.length).toBeGreaterThanOrEqual(9);
      expect(new Set(pool.map((c) => c.stars)).size).toBeGreaterThanOrEqual(4);
    }
  });
  it('las estadísticas no son todas iguales', () => {
    const sigs = new Set(CHARACTERS.map((c) => JSON.stringify(c.stats)));
    expect(sigs.size).toBeGreaterThan(CHARACTERS.length * 0.6);
  });
  it('Goku, Vegeta, Gohan, Freezer, Cell y Broly se transforman en partida', () => {
    for (const id of ['goku', 'vegeta', 'gohan_teen', 'freezer_1', 'cell_imperfect', 'broly']) {
      expect(getCharacter(id).transformations?.length ?? 0).toBeGreaterThanOrEqual(2);
    }
  });
  it('las 9 versiones de Goku de antes siguen existiendo (guardados antiguos)', () => {
    for (const id of ['goku', 'goku_kaioken', 'goku_ssj', 'goku_ssj2', 'goku_ssj3', 'goku_god', 'goku_blue', 'goku_ui_sign', 'goku_ui']) expect(() => getCharacter(id)).not.toThrow();
  });
});

describe('banners por saga', () => {
  it('el banner Cell nunca da personajes de otra saga', () => {
    const { results } = summon(withTickets(500), 500, mulberry32(1), 'cell');
    for (const r of results) expect(sagaOf(r.characterId)).toBe('cell');
  });
  it('el banner GT nunca da personajes de Super', () => {
    const { results } = summon(withTickets(500), 500, mulberry32(2), 'gt');
    for (const r of results) {
      expect(sagaOf(r.characterId)).not.toBe('super');
      expect(sagaOf(r.characterId)).toBe('gt');
    }
  });
  it('cada banner solo contiene su saga (datos)', () => {
    for (const s of SAGAS) for (const c of bannerPool(s)) expect(c.saga).toBe(s);
  });
  it('las tiradas de 1, 10 y 100 dan exactamente ese número y descuentan tickets', () => {
    for (const n of [1, 10, 100]) {
      const { meta, results, completed } = summon(withTickets(150), n, mulberry32(n), 'freezer');
      expect(results).toHaveLength(n);
      // si la tirada completa la saga, se suma su premio
      expect(meta.tickets).toBe(150 - n + completed.length * SAGA_REWARD.tickets);
    }
  });
  it('sin tickets suficientes no se puede invocar', () => {
    expect(() => summonOnce(withTickets(0), mulberry32(1), 'buu')).toThrow();
    expect(() => summon(withTickets(99), 100, mulberry32(1), 'buu')).toThrow();
  });
  it('las probabilidades mostradas suman 100 en cada banner', () => {
    for (const s of SAGAS) {
      const p = starProbabilities(bannerPool(s));
      expect(Object.values(p).reduce((a, b) => a + b, 0)).toBeCloseTo(100, 5);
    }
  });
  it(`garantía de 4★ o más cada ${PITY_EPIC} tiradas`, () => {
    for (let seed = 0; seed < 30; seed++) {
      const { results } = summon(withTickets(PITY_EPIC), PITY_EPIC, mulberry32(seed), 'super');
      expect(results.some((r) => r.stars >= 4)).toBe(true);
    }
  });
  it(`garantía de la rareza máxima en ${PITY_TOP} tiradas`, () => {
    for (const s of ['cell', 'dragonball'] as Saga[]) {
      const top = Math.max(...bannerPool(s).map((c) => c.stars));
      const { results } = summon(withTickets(PITY_TOP), PITY_TOP, mulberry32(7), s);
      expect(results.some((r) => r.stars === top)).toBe(true);
    }
  });
  it('las garantías son independientes por banner', () => {
    let m = withTickets(20);
    m = summon(m, 9, mulberry32(3), 'cell').meta;
    expect(m.gacha.banners.cell.pulls).toBe(9);
    expect(m.gacha.banners.gt).toBeUndefined();
  });
  it('la distribución observada se parece a la declarada', () => {
    const pool = bannerPool('super');
    const p = starProbabilities(pool);
    const counts: Record<number, number> = {};
    const rng = mulberry32(42);
    const base = withTickets(1);
    for (let i = 0; i < 20000; i++) {
      const r = summonOnce(base, rng, 'super');
      counts[r.result.stars] = (counts[r.result.stars] ?? 0) + 1;
    }
    for (const s of Object.keys(p).map(Number)) expect(Math.abs(((counts[s] ?? 0) / 20000) * 100 - p[s])).toBeLessThan(1.5);
  });
  it('los repetidos dan fragmentos de ese personaje', () => {
    const res = summon(withTickets(200), 200, mulberry32(3), 'saiyan');
    const dup = res.results.find((r) => !r.isNew)!;
    expect(dup.shards).toBe(dup.stars * 5);
    const total = res.results.filter((r) => r.characterId === dup.characterId && !r.isNew).reduce((a, r) => a + r.shards, 0);
    expect(res.meta.characters[dup.characterId].shards).toBe(total);
  });
  it('los personajes nuevos aparecen en la colección', () => {
    const { meta, results } = summon(withTickets(30), 30, mulberry32(9), 'movies');
    for (const r of results) expect(meta.unlockedCharacters).toContain(r.characterId);
    expect(sagaProgress(meta, 'movies').owned).toBe(new Set(results.map((r) => r.characterId)).size);
  });
  it('completar una saga da su premio una sola vez', () => {
    const all = charactersOfSaga('daima').map((c) => c.id);
    const m = { ...defaultMeta(), tickets: 0, unlockedCharacters: ['goku', ...all] };
    const a = claimSagaRewards(m);
    expect(a.completed).toContain('daima');
    expect(a.meta.tickets).toBe(SAGA_REWARD.tickets);
    expect(claimSagaRewards(a.meta).completed).toHaveLength(0);
  });
  it('subir dominio gasta fragmentos y monedas', () => {
    const cost = levelUpCost(1);
    const meta = { ...withTickets(0), characters: { goku: { level: 1, shards: cost.shards } } };
    const r = levelUpCharacter(meta, 'goku');
    expect(r.ok).toBe(true);
    expect(r.meta.characters.goku).toEqual({ level: 2, shards: 0 });
    expect(levelUpCharacter(r.meta, 'goku').ok).toBe(false);
  });
});

describe('guardado y migración', () => {
  it('una partida v1 (0.2) se migra sin perder colección, monedas ni tickets', () => {
    const old = {
      version: 1,
      coins: 1234,
      tickets: 7,
      unlockedCharacters: ['goku', 'goku_ssj', 'goku_ui'],
      characters: { goku: { level: 3, shards: 12 }, goku_ssj: { level: 1, shards: 5 }, goku_ui: { level: 1, shards: 0 } },
      gacha: { pulls: 40, sinceEpic: 2, sinceMythic: 40 },
      selectedCharacter: 'goku_ui',
    };
    const m = parseMeta(old);
    expect(m.coins).toBe(1234);
    // migra los 7 tickets originales y suma el regalo de bienvenida (1000).
    expect(m.tickets).toBe(1007);
    expect(m.unlockedCharacters).toEqual(['goku', 'goku_ssj', 'goku_ui']);
    expect(m.characters.goku.level).toBe(3);
    expect(m.selectedCharacter).toBe('goku_ui');
    expect(m.gacha.pulls).toBe(40);
    expect(m.gacha.banners).toEqual({});
    expect(m.difficulty).toBe('normal');
    expect(m.favorites).toEqual([]);
  });
  it('el progreso de banners y favoritos se guarda', () => {
    const { meta } = summon(withTickets(15), 15, mulberry32(5), 'buu');
    const back = parseMeta(JSON.parse(JSON.stringify({ ...meta, favorites: ['goku'], difficulty: 'hard' })));
    expect(back.gacha.banners.buu).toEqual(meta.gacha.banners.buu);
    expect(back.favorites).toEqual(['goku']);
    expect(back.difficulty).toBe('hard');
    expect(back.unlockedCharacters).toEqual(meta.unlockedCharacters);
  });
});

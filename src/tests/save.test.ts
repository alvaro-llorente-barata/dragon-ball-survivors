import { describe, expect, it } from 'vitest';
import { META_UPGRADES, buyUpgrade, metaBonuses, upgradeCost } from '../services/economyService';
import { applyRunResult, type RunResult } from '../services/progressionService';
import { accountLevel, defaultMeta, parseMeta, serializeMeta } from '../services/saveService/meta';

const result = (over: Partial<RunResult> = {}): RunResult => ({
  characterId: 'goku',
  mapId: 'earth',
  time: 300,
  kills: 250,
  level: 12,
  coins: 140,
  tickets: 2,
  fragments: 9,
  chestsOpened: 4,
  bossesDefeated: [],
  died: true,
  ...over,
});

describe('guardado', () => {
  it('serializar y leer devuelve los mismos datos', () => {
    const m = { ...defaultMeta(), coins: 321, upgrades: { damage: 2 }, bossesDefeated: { raditz: 1 } };
    const back = parseMeta(JSON.parse(serializeMeta(m)));
    expect(back.coins).toBe(321);
    expect(back.upgrades.damage).toBe(2);
    expect(back.bossesDefeated.raditz).toBe(1);
  });
  it('rechaza JSON no válido o de versión futura', () => {
    expect(() => parseMeta(null)).toThrow();
    expect(() => parseMeta([])).toThrow();
    expect(() => parseMeta({ version: 999 })).toThrow();
  });
  it('limpia valores corruptos', () => {
    const m = parseMeta({ version: 1, coins: -50, tickets: 'x', upgrades: { damage: -1, maxHp: 3 }, unlockedMaps: ['namek'] });
    expect(m.coins).toBe(0);
    // tickets corruptos -> 0, más el regalo de bienvenida al migrar desde v1.
    expect(m.tickets).toBe(1000);
    expect(m.upgrades.damage).toBeUndefined();
    expect(m.upgrades.maxHp).toBe(3);
    expect(m.unlockedMaps).toContain('earth');
    expect(m.selectedCharacter).toBe('goku');
  });
});

describe('progresión permanente', () => {
  it('aplica monedas, tickets y estadísticas', () => {
    const { meta } = applyRunResult(defaultMeta(), result());
    expect(meta.coins).toBe(140);
    // defaultMeta otorga 1000 tickets de bienvenida; la partida suma 2 más.
    expect(meta.tickets).toBe(1002);
    expect(meta.stats.runs).toBe(1);
    expect(meta.stats.bestTime).toBe(300);
    expect(meta.stats.deaths).toBe(1);
    expect(meta.accountXp).toBeGreaterThan(0);
  });
  it('vencer a Raditz desbloquea el Páramo y a Vegeta, Namek', () => {
    const r1 = applyRunResult(defaultMeta(), result({ bossesDefeated: ['raditz'] }));
    expect(r1.unlockedMaps).toEqual(['wasteland']);
    const r2 = applyRunResult(r1.meta, result({ bossesDefeated: ['vegeta'] }));
    expect(r2.unlockedMaps).toEqual(['namek']);
    expect(r2.meta.bossesDefeated.raditz).toBe(1);
  });
  it('comprar mejoras cuesta monedas y tiene máximo', () => {
    const def = META_UPGRADES.find((u) => u.id === 'damage')!;
    let meta = { ...defaultMeta(), coins: 100000 };
    for (let i = 0; i < def.max; i++) {
      const r = buyUpgrade(meta, 'damage');
      expect(r.ok).toBe(true);
      meta = r.meta;
    }
    expect(buyUpgrade(meta, 'damage').ok).toBe(false);
    expect(metaBonuses(meta).damage).toBeCloseTo(def.max * def.per, 5);
    expect(upgradeCost(def, 1)).toBeGreaterThan(upgradeCost(def, 0));
    expect(buyUpgrade({ ...defaultMeta(), coins: 0 }, 'damage').ok).toBe(false);
  });
  it('nivel de cuenta', () => {
    expect(accountLevel(0).level).toBe(1);
    expect(accountLevel(100).level).toBe(2);
  });
});

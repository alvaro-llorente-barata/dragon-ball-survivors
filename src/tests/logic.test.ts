import { describe, expect, it } from 'vitest';
import { getCharacter } from '../data/characters';
import { MAPS, getMap } from '../data/maps';
import { BOSSES } from '../data/bosses';
import { ENEMIES } from '../data/enemies';
import { WEAPONS } from '../data/attacks';
import { pointInArc, pointInBeam, damageTaken, rollDamage } from '../game/logic/combat';
import { BLOCKING_TILES, MAP_TILES, TILE, generateMap } from '../game/logic/mapgen';
import { chestProbabilities, rollCapsule, rollChestRarity, rollChestRewards, CHEST_RARITIES } from '../game/logic/loot';
import { mulberry32 } from '../game/logic/rng';
import { addBuff, addXp, createRunState, tickBuffs, xpForLevel } from '../game/logic/run';
import { enemyHpMul, maxEnemies, pickEnemyId, spawnRatePerSecond } from '../game/logic/spawn';
import { NO_META, computeStats } from '../game/logic/stats';
import { drainForm, nextForm, tryTransform } from '../game/logic/transform';
import { MAX_WEAPONS, applyChoice, candidateUpgrades, generateChoices } from '../game/logic/upgrades';

const goku = getCharacter('goku');
const newRun = () => createRunState(goku, 120, 100, 0);

describe('datos', () => {
  it('todas las referencias de personajes, mapas y jefes existen', () => {
    for (const w of [...goku.weaponPool, goku.ultimate]) expect(WEAPONS[w]).toBeDefined();
    for (const m of MAPS) {
      for (const e of m.enemies) expect(ENEMIES[e.id]).toBeDefined();
      for (const b of m.bosses) expect(BOSSES[b.bossId]).toBeDefined();
    }
    for (const b of Object.values(BOSSES)) {
      expect(b.phases[0].hpBelow).toBe(1);
      for (const ph of b.phases) if (ph.summonId) expect(ENEMIES[ph.summonId]).toBeDefined();
    }
  });
  it('cada ataque tiene un comportamiento propio y niveles válidos', () => {
    const behaviors = new Set(goku.weaponPool.map((id) => WEAPONS[id].behavior));
    expect(behaviors.size).toBeGreaterThanOrEqual(6);
    for (const w of Object.values(WEAPONS)) {
      expect(w.levels.length).toBeGreaterThan(0);
      for (const l of w.levels) {
        expect(l.damage).toBeGreaterThan(0);
        expect(l.cooldown).toBeGreaterThan(0);
      }
    }
  });
});

describe('experiencia y niveles', () => {
  it('la curva crece y addXp sube varios niveles', () => {
    expect(xpForLevel(2)).toBeGreaterThan(xpForLevel(1));
    const run = newRun();
    const gained = addXp(run, xpForLevel(1) + xpForLevel(2) + 1);
    expect(gained).toBe(2);
    expect(run.level).toBe(3);
    expect(run.xp).toBe(1);
  });
});

describe('mejoras al subir de nivel', () => {
  it('ofrece 3 opciones distintas y aplicarlas cambia el estado', () => {
    const run = newRun();
    const rng = mulberry32(1);
    const choices = generateChoices(run, goku, rng, 3);
    expect(choices).toHaveLength(3);
    expect(new Set(choices.map((c) => c.id)).size).toBe(3);
    const before = JSON.stringify({ w: run.weapons, p: run.passives });
    applyChoice(run, choices[0]);
    expect(JSON.stringify({ w: run.weapons, p: run.passives })).not.toBe(before);
  });
  it('la pasiva de poder aumenta realmente el daño', () => {
    const run = newRun();
    const base = computeStats(goku, run, NO_META).energyMul;
    run.passives.power = 3;
    expect(computeStats(goku, run, NO_META).energyMul).toBeCloseTo(base * 1.3, 5);
  });
  it('respeta el máximo de ataques equipados', () => {
    const run = newRun();
    for (const id of goku.weaponPool.slice(0, MAX_WEAPONS)) run.weapons[id] = 1;
    expect(candidateUpgrades(run, goku).some((c) => c.kind === 'weapon_new')).toBe(false);
  });
});

describe('transformaciones', () => {
  it('Kaioken requiere nivel y Ki, y el Ki se consume', () => {
    const run = newRun();
    run.ki = 100;
    expect(nextForm(goku, run, [])?.ready).toBe(false); // nivel 1
    run.level = 4;
    expect(nextForm(goku, run, [])?.ready).toBe(true);
    const f = tryTransform(goku, run, []);
    expect(f?.id).toBe('kaioken');
    expect(run.ki).toBe(75);
    const dmgBase = computeStats(goku, { ...run, formId: 'base' }, NO_META).energyMul;
    expect(computeStats(goku, run, NO_META).energyMul).toBeGreaterThan(dmgBase);
  });
  it('sin Ki vuelve a la forma base', () => {
    const run = newRun();
    run.level = 10;
    run.ki = 30;
    tryTransform(goku, run, []);
    expect(run.formId).toBe('kaioken');
    expect(drainForm(goku, run, 10)).toBe(true);
    expect(run.formId).toBe('base');
  });
  it('Super Saiyan 2 está bloqueada hasta vencer a Vegeta', () => {
    const run = newRun();
    run.level = 30;
    run.ki = 999;
    run.formId = 'ssj';
    expect(nextForm(goku, run, [])?.ready).toBe(false);
    expect(nextForm(goku, run, ['vegeta'])?.ready).toBe(true);
  });
});

describe('combate', () => {
  it('geometría de rayos y arcos', () => {
    expect(pointInBeam(100, 0, 0, 0, 0, 200, 10)).toBe(true);
    expect(pointInBeam(100, 30, 0, 0, 0, 200, 10)).toBe(false);
    expect(pointInBeam(-10, 0, 0, 0, 0, 200, 10)).toBe(false);
    expect(pointInBeam(0, 100, 0, 0, Math.PI / 2, 200, 10)).toBe(true);
    expect(pointInArc(50, 0, 0, 0, 0, 60, 0.5)).toBe(true);
    expect(pointInArc(-50, 0, 0, 0, 0, 60, 0.5)).toBe(false);
  });
  it('defensa reduce el daño y los críticos multiplican', () => {
    expect(damageTaken(100, 100)).toBe(50);
    const crit = rollDamage(100, 1, 1, 2, mulberry32(3));
    expect(crit.crit).toBe(true);
    expect(crit.amount).toBeGreaterThanOrEqual(180);
  });
});

describe('cofres y cápsulas', () => {
  it('las probabilidades suman 100 y la suerte mejora las rarezas altas', () => {
    const p0 = chestProbabilities(0);
    const p1 = chestProbabilities(0.3);
    expect(CHEST_RARITIES.reduce((a, r) => a + p0[r], 0)).toBeCloseTo(100, 5);
    expect(p1.legendary).toBeGreaterThan(p0.legendary);
    expect(p1.common).toBeLessThan(p0.common);
  });
  it('la distribución observada se parece a la declarada', () => {
    const rng = mulberry32(99);
    const counts: Record<string, number> = {};
    const N = 20000;
    for (let i = 0; i < N; i++) {
      const r = rollChestRarity(rng);
      counts[r] = (counts[r] ?? 0) + 1;
    }
    const p = chestProbabilities(0);
    for (const r of CHEST_RARITIES) expect(Math.abs(((counts[r] ?? 0) / N) * 100 - p[r])).toBeLessThan(1.5);
  });
  it('más rareza = más recompensas; épicos incluyen mejora y legendarios ticket', () => {
    const rng = mulberry32(5);
    expect(rollChestRewards('common', rng, 0)).toHaveLength(1);
    const epic = rollChestRewards('epic', rng, 0);
    expect(epic.length).toBeGreaterThanOrEqual(3);
    expect(epic.some((r) => r.kind === 'upgrade')).toBe(true);
    expect(rollChestRewards('legendary', rng, 0).some((r) => r.kind === 'tickets')).toBe(true);
  });
  it('rareza mínima respetada (jefes y élites)', () => {
    const rng = mulberry32(8);
    for (let i = 0; i < 200; i++) expect(rollChestRarity(rng, 0, 'rare')).not.toBe('common');
  });
  it('las cápsulas misteriosas pueden ser emboscadas', () => {
    const rng = mulberry32(11);
    const kinds = new Set(Array.from({ length: 200 }, () => rollCapsule('mystery', rng, 1).kind));
    expect(kinds.has('ambush')).toBe(true);
    expect(kinds.has('reward')).toBe(true);
  });
});

describe('generación de mapas', () => {
  for (const def of MAPS) {
    it(`${def.id}: reproducible, grande y con zona inicial libre`, () => {
      const a = generateMap(def, 1234);
      const b = generateMap(def, 1234);
      expect(JSON.stringify(a)).toBe(JSON.stringify(b));
      expect(a.width).toBe(MAP_TILES);
      expect(a.width * TILE).toBeGreaterThanOrEqual(4000);
      const cx = Math.floor(a.width / 2);
      const cy = Math.floor(a.height / 2);
      for (let y = cy - 5; y <= cy + 5; y++) for (let x = cx - 5; x <= cx + 5; x++) expect(BLOCKING_TILES).not.toContain(a.tiles[y][x]);
      expect(a.obstacles.length).toBeGreaterThan(100);
      expect(a.chests.length).toBeGreaterThanOrEqual(10);
      expect(a.capsules.length).toBeGreaterThan(20);
      expect(a.pois.some((p) => p.type === 'secret')).toBe(true);
      expect(a.chests.some((c) => c.hidden)).toBe(true);
      for (const c of a.chests) {
        const t = a.tiles[Math.floor(c.y / TILE)][Math.floor(c.x / TILE)];
        expect(BLOCKING_TILES).not.toContain(t);
      }
    });
  }
  it('semillas distintas dan mapas distintos', () => {
    const m = getMap('earth');
    expect(JSON.stringify(generateMap(m, 1).tiles)).not.toBe(JSON.stringify(generateMap(m, 2).tiles));
  });
});

describe('aparición de enemigos', () => {
  it('la dificultad crece con el tiempo', () => {
    expect(spawnRatePerSecond(300)).toBeGreaterThan(spawnRatePerSecond(0));
    expect(maxEnemies(300)).toBeGreaterThan(maxEnemies(0));
    expect(enemyHpMul(600)).toBeGreaterThan(enemyHpMul(60));
  });
  it('no aparecen enemigos antes de su momento', () => {
    const pool = getMap('earth').enemies;
    const rng = mulberry32(4);
    for (let i = 0; i < 300; i++) {
      const id = pickEnemyId(pool, 10, rng);
      expect(pool.find((e) => e.id === id)!.from).toBeLessThanOrEqual(10);
    }
  });
});

describe('potenciadores temporales', () => {
  it('caducan con el tiempo', () => {
    const run = newRun();
    addBuff(run, 'power', 2);
    expect(computeStats(goku, run, NO_META).energyMul).toBeGreaterThan(computeStats(goku, newRun(), NO_META).energyMul);
    expect(tickBuffs(run, 3)).toContain('power');
    expect(run.buffs.power).toBeUndefined();
  });
});

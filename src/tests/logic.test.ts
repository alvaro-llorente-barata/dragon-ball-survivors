import { describe, expect, it } from 'vitest';
import { getCharacter } from '../data/characters';
import { MAPS, getMap } from '../data/maps';
import { BOSSES } from '../data/bosses';
import { ENEMIES } from '../data/enemies';
import { WEAPONS } from '../data/attacks';
import { pointInArc, pointInBeam, damageTaken, rollDamage } from '../game/logic/combat';
import { BLOCKING_TILES, CHUNK, CHUNK_PX, SPAWN_TILE, TILE, generateChunk, terrainAt, worldSeed } from '../game/logic/chunkgen';
import { CHARACTERS } from '../data/characters';
import { chestProbabilities, rollCapsule, rollChestRarity, rollChestRewards, CHEST_RARITIES } from '../game/logic/loot';
import { mulberry32 } from '../game/logic/rng';
import { addBuff, addXp, createRunState, tickBuffs, xpForLevel } from '../game/logic/run';
import { enemyHpMul, maxEnemies, pickEnemyId, spawnRatePerSecond } from '../game/logic/spawn';
import { NO_META, computeStats } from '../game/logic/stats';
import { MAX_WEAPONS, applyChoice, candidateUpgrades, generateChoices } from '../game/logic/upgrades';

const goku = getCharacter('goku');
void MAX_WEAPONS;
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

describe('versiones de Goku (sin transformaciones en partida)', () => {
  it('hay 9 fases, ids únicos y estrellas de 1 a 7', () => {
    const gokus = CHARACTERS.filter((c) => c.family === 'goku');
    expect(gokus).toHaveLength(9);
    expect(new Set(gokus.map((c) => c.id)).size).toBe(9);
    expect(new Set(gokus.map((c) => c.stars))).toEqual(new Set([1, 2, 3, 4, 5, 6, 7]));
    for (const c of gokus) expect(c.weaponPool).toContain(c.startingWeapon);
  });
  it('más estrellas = más poder', () => {
    const base = computeStats(getCharacter('goku'), newRun(), NO_META);
    const ui = computeStats(getCharacter('goku_ui'), newRun(), NO_META);
    expect(ui.energyMul).toBeGreaterThan(base.energyMul);
    expect(ui.moveSpeed).toBeGreaterThan(base.moveSpeed);
    expect(ui.dodgeChance).toBeGreaterThan(0);
  });
  it('el nivel del personaje sube vida y daño', () => {
    const lv1 = computeStats(goku, newRun(), NO_META);
    const lv5 = computeStats(goku, newRun(), { ...NO_META, charPower: 0.24 });
    expect(lv5.maxHp).toBeGreaterThan(lv1.maxHp);
    expect(lv5.physicalMul).toBeGreaterThan(lv1.physicalMul);
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

describe('mapa infinito por trozos', () => {
  for (const def of MAPS) {
    it(`${def.id}: reproducible, sin límites y con zona inicial libre`, () => {
      const seed = worldSeed(def, 1234);
      expect(JSON.stringify(generateChunk(def, seed, 3, -2))).toBe(JSON.stringify(generateChunk(def, seed, 3, -2)));
      // Trozos muy lejanos y negativos también se generan.
      const far = generateChunk(def, seed, -5000, 7000);
      expect(far.tiles).toHaveLength(CHUNK);
      expect(far.tiles[0]).toHaveLength(CHUNK);
      for (let y = -4; y <= 4; y++)
        for (let x = -4; x <= 4; x++) expect(BLOCKING_TILES).not.toContain(terrainAt(def, seed, SPAWN_TILE.x + x, SPAWN_TILE.y + y));
      // En una zona de 8x8 trozos hay obstáculos, cofres, cápsulas y lugares especiales.
      let obstacles = 0, chests = 0, capsules = 0, pois = 0, hidden = 0;
      for (let cy = -4; cy < 4; cy++)
        for (let cx = -4; cx < 4; cx++) {
          const ch = generateChunk(def, seed, cx, cy);
          obstacles += ch.obstacles.length;
          chests += ch.chests.length;
          capsules += ch.capsules.length;
          pois += ch.pois.length;
          hidden += ch.chests.filter((c) => c.hidden).length;
          for (const c of ch.chests) {
            expect(c.x).toBeGreaterThanOrEqual(cx * CHUNK_PX);
            expect(c.x).toBeLessThan((cx + 1) * CHUNK_PX);
            const t = ch.tiles[Math.floor(c.y / TILE) - cy * CHUNK][Math.floor(c.x / TILE) - cx * CHUNK];
            expect(BLOCKING_TILES).not.toContain(t);
          }
        }
      expect(obstacles).toBeGreaterThan(200);
      expect(chests).toBeGreaterThan(15);
      expect(capsules).toBeGreaterThan(60);
      expect(pois).toBeGreaterThan(5);
      expect(hidden + pois).toBeGreaterThan(0);
    });
  }
  it('los ids de contenido son únicos y estables', () => {
    const def = getMap('earth');
    const seed = worldSeed(def, 9);
    const ids = new Set<string>();
    for (let cy = -2; cy < 2; cy++)
      for (let cx = -2; cx < 2; cx++) {
        const ch = generateChunk(def, seed, cx, cy);
        for (const o of [...ch.obstacles, ...ch.chests, ...ch.capsules, ...ch.items]) {
          expect(ids.has(o.id)).toBe(false);
          ids.add(o.id);
        }
      }
  });
  it('semillas distintas dan mundos distintos', () => {
    const m = getMap('earth');
    expect(JSON.stringify(generateChunk(m, 1, 2, 2).tiles)).not.toBe(JSON.stringify(generateChunk(m, 2, 2, 2).tiles));
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

import { describe, expect, it } from 'vitest';
import { WEAPONS } from '../data/attacks';
import { getCharacter } from '../data/characters';
import { mulberry32 } from '../game/logic/rng';
import { createRunState } from '../game/logic/run';
import { activeWeapons, emptySlot, learnWeapon, linkPairs, linkSlots, MAX_PER_SLOT, selectSlot, weaponCount } from '../game/logic/slots';
import { NO_META, computeStats } from '../game/logic/stats';
import { drainForm, nextForm, tryTransform } from '../game/logic/transform';
import { applyChoice, candidateUpgrades, canEvolve, generateChoices } from '../game/logic/upgrades';
import { DIFFICULTIES, eliteChance, enemySpeedMul, spawnRatePerSecond } from '../game/logic/spawn';

const goku = getCharacter('goku');
const fresh = () => createRunState(goku, 120, 100, 0);
/** Llena los 4 huecos con ataques distintos del pool. */
function fill(run = fresh()) {
  for (const id of goku.weaponPool) if (emptySlot(run) >= 0) learnWeapon(run, id);
  return run;
}

describe('huecos de ataques', () => {
  it('empieza con 1 ataque en el hueco 1 y se pueden llenar los 4', () => {
    const run = fresh();
    expect(run.slots[0]).toEqual([goku.startingWeapon]);
    fill(run);
    expect(run.slots.every((s) => s.length === 1)).toBe(true);
    expect(emptySlot(run)).toBe(-1);
  });
  it('solo atacan los ataques del hueco seleccionado', () => {
    const run = fill();
    expect(activeWeapons(run)).toEqual(run.slots[0]);
    expect(selectSlot(run, 2)).toBe(true);
    expect(activeWeapons(run)).toEqual(run.slots[2]);
  });
  it('con los 4 huecos llenos siguen saliendo mejoras (no se bloquea)', () => {
    const run = fill();
    const c = candidateUpgrades(run, goku);
    expect(c.some((x) => x.kind === 'weapon_new')).toBe(false);
    expect(c.some((x) => x.kind === 'weapon_up')).toBe(true);
    expect(c.some((x) => x.kind === 'passive')).toBe(true);
    expect(c.some((x) => x.kind === 'link')).toBe(true);
    expect(generateChoices(run, goku, mulberry32(1), 3)).toHaveLength(3);
  });
});

describe('Vínculo de Ki', () => {
  it('une dos ataques, libera un hueco y conserva sus niveles', () => {
    const run = fill();
    const [a, b] = [run.slots[0][0], run.slots[1][0]];
    run.weapons[a] = 4;
    run.weapons[b] = 3;
    run.links = 1;
    expect(linkSlots(run, 0, 1)).toBe(true);
    expect(run.slots[0]).toEqual([a, b]);
    expect(run.slots[3]).toEqual([]);
    expect(run.weapons[a]).toBe(4);
    expect(run.weapons[b]).toBe(3);
    expect(weaponCount(run)).toBe(4);
    expect(run.links).toBe(0);
  });
  it('los vinculados atacan juntos al seleccionar su hueco', () => {
    const run = fill();
    run.links = 1;
    linkSlots(run, 0, 1);
    selectSlot(run, 0);
    expect(activeWeapons(run)).toHaveLength(2);
  });
  it('tras liberar un hueco vuelven a salir ataques nuevos', () => {
    const run = fill();
    run.links = 1;
    linkSlots(run, 0, 1);
    const c = candidateUpgrades(run, goku);
    const nw = c.find((x) => x.kind === 'weapon_new')!;
    expect(nw).toBeDefined();
    applyChoice(run, nw);
    expect(run.slots.flat()).toContain(nw.refId);
    expect(run.weapons[nw.refId]).toBe(1);
  });
  it('máximo 3 ataques por hueco, sin duplicados y sin vínculos', () => {
    const run = fill();
    run.links = 5;
    linkSlots(run, 0, 1);
    linkSlots(run, 0, 1);
    expect(run.slots[0]).toHaveLength(MAX_PER_SLOT);
    expect(new Set(run.slots.flat()).size).toBe(run.slots.flat().length);
    // con 3 + 1 ya no se puede
    expect(linkPairs(run).some(([a, b]) => a === 0 || b === 0)).toBe(false);
    const none = { ...fill(), links: 0 };
    expect(linkSlots(none, 0, 1)).toBe(false);
  });
  it('el hueco seleccionado sigue en los mismos ataques al compactar', () => {
    const run = fill();
    run.links = 1;
    const id = run.slots[3][0];
    selectSlot(run, 3);
    linkSlots(run, 1, 2);
    expect(activeWeapons(run)).toContain(id);
  });
});

describe('evoluciones', () => {
  it('todos los ataques no definitivos tienen 5 niveles y una evolución con pasiva real', async () => {
    const { PASSIVES } = await import('../data/passives');
    for (const w of Object.values(WEAPONS)) {
      if (w.ultimate) continue;
      expect(w.levels).toHaveLength(5);
      expect(w.evolution).toBeDefined();
      expect(PASSIVES[w.evolution!.passive]).toBeDefined();
      // la evolución cambia algo más que el nombre
      expect(Object.keys(w.evolution!.stats).length + Object.keys(w.evolution!.fx ?? {}).length).toBeGreaterThan(1);
    }
  });
  it('se puede evolucionar con nivel 5 + pasiva y la carta aparece siempre', () => {
    const run = fresh();
    const id = goku.startingWeapon;
    const evo = WEAPONS[id].evolution!;
    run.weapons[id] = 5;
    expect(canEvolve(run, id)).toBe(false);
    run.passives[evo.passive] = 1;
    expect(canEvolve(run, id)).toBe(true);
    const choices = generateChoices(fill(run), goku, mulberry32(4), 3);
    const card = choices.find((c) => c.kind === 'evolve');
    expect(card).toBeDefined();
    applyChoice(run, card!);
    expect(run.evolved[id]).toBe(true);
    expect(canEvolve(run, id)).toBe(false);
  });
  it('los ataques suben de nivel hasta 5', () => {
    const run = fresh();
    const id = goku.startingWeapon;
    for (let i = 0; i < 10; i++) {
      const up = candidateUpgrades(run, goku).find((c) => c.kind === 'weapon_up' && c.refId === id);
      if (up) applyChoice(run, up);
    }
    expect(run.weapons[id]).toBe(5);
  });
});

describe('transformaciones en partida', () => {
  it('requieren nivel y Ki, suben el daño y se acaban sin Ki', () => {
    const run = fresh();
    run.ki = 100;
    expect(nextForm(goku, run)?.ready).toBe(false);
    run.level = 12;
    const base = computeStats(goku, run, NO_META).energyMul;
    expect(tryTransform(goku, run)?.id).toBe('kaioken');
    expect(computeStats(goku, run, NO_META).energyMul).toBeGreaterThan(base);
    run.ki = 100;
    expect(tryTransform(goku, run)?.id).toBe('ssj');
    expect(drainForm(goku, run, 1000)).toBe(true);
    expect(run.formId).toBe('');
  });
  it('Broly se hace más grande al transformarse', () => {
    const broly = getCharacter('broly');
    expect(broly.transformations!.at(-1)!.size!).toBeGreaterThan(broly.size!);
  });
});

describe('dificultad', () => {
  it('crece por tramos y Pesadilla es más dura que Normal', () => {
    expect(spawnRatePerSecond(10 * 60)).toBeGreaterThan(spawnRatePerSecond(3 * 60) * 1.8);
    expect(spawnRatePerSecond(60, DIFFICULTIES.nightmare)).toBeGreaterThan(spawnRatePerSecond(60));
    expect(enemySpeedMul(20 * 60)).toBeGreaterThan(enemySpeedMul(0));
    expect(eliteChance(60)).toBe(0);
    expect(eliteChance(8 * 60)).toBeGreaterThan(0);
    expect(eliteChance(8 * 60, DIFFICULTIES.hard)).toBeGreaterThan(eliteChance(8 * 60));
  });
});

import { WEAPONS } from '../../data/attacks';
import { PASSIVES } from '../../data/passives';
import type { CharacterDef } from '../../data/types';
import { weightedPick, type Rng } from './rng';
import type { RunState } from './run';
import { hasFreeSlot, learnWeapon, linkPairs, MAX_SLOTS } from './slots';

/** Huecos principales de ataques (el definitivo Q va aparte). */
export const MAX_WEAPONS = MAX_SLOTS;
export const MAX_PASSIVES = 6;
export const WEAPON_MAX_LEVEL = 5;

export type UpgradeKind = 'weapon_new' | 'weapon_up' | 'evolve' | 'passive' | 'link' | 'heal' | 'coins';

export interface UpgradeChoice {
  id: string;
  kind: UpgradeKind;
  refId: string;
  name: string;
  description: string;
  /** nivel que tendrá tras elegirla */
  level: number;
  maxLevel: number;
}

/** ¿Está lista la evolución de este ataque? (nivel 5 + su pasiva). */
export function canEvolve(run: RunState, weaponId: string): boolean {
  const w = WEAPONS[weaponId];
  const evo = w?.evolution;
  if (!evo || run.evolved[weaponId]) return false;
  return (run.weapons[weaponId] ?? 0) >= w.levels.length && (run.passives[evo.passive] ?? 0) > 0;
}

/** Todas las mejoras válidas para el estado actual. Nunca se bloquea con los huecos llenos. */
export function candidateUpgrades(run: RunState, char: CharacterDef): UpgradeChoice[] {
  const out: UpgradeChoice[] = [];
  const free = hasFreeSlot(run);
  for (const id of char.weaponPool) {
    const w = WEAPONS[id];
    if (!w) continue;
    const lvl = run.weapons[id] ?? 0;
    if (lvl > 0 && lvl < w.levels.length) {
      out.push({ id: `wup:${id}`, kind: 'weapon_up', refId: id, name: w.name, description: w.levelNotes[lvl] ?? 'Mejora el ataque', level: lvl + 1, maxLevel: w.levels.length });
    } else if (lvl > 0 && canEvolve(run, id) && w.evolution) {
      out.push({ id: `evo:${id}`, kind: 'evolve', refId: id, name: w.evolution.name, description: `EVOLUCIÓN de ${w.name}: ${w.evolution.description}`, level: 1, maxLevel: 1 });
    } else if (lvl === 0 && free) {
      out.push({ id: `wnew:${id}`, kind: 'weapon_new', refId: id, name: w.name, description: `Nuevo ataque: ${w.description}`, level: 1, maxLevel: w.levels.length });
    }
  }
  const ownedPassives = Object.keys(run.passives);
  for (const p of Object.values(PASSIVES)) {
    const lvl = run.passives[p.id] ?? 0;
    if (lvl >= p.maxLevel) continue;
    if (lvl === 0 && ownedPassives.length >= MAX_PASSIVES) continue;
    out.push({ id: `pas:${p.id}`, kind: 'passive', refId: p.id, name: p.name, description: p.description, level: lvl + 1, maxLevel: p.maxLevel });
  }
  // Con todos los huecos llenos, un Vínculo de Ki puede aparecer (raro) si queda algo nuevo por aprender.
  const unlearned = char.weaponPool.some((id) => !run.weapons[id]);
  if (!free && run.links === 0 && unlearned && linkPairs(run).length > 0) {
    out.push({ id: 'link', kind: 'link', refId: 'link', name: 'Vínculo de Ki', description: 'Une dos huecos en uno y libera espacio para un ataque nuevo.', level: 1, maxLevel: 1 });
  }
  return out;
}

function weightOf(c: UpgradeChoice): number {
  switch (c.kind) {
    case 'evolve':
      return 40;
    case 'weapon_up':
      return 9;
    case 'weapon_new':
      return 8;
    case 'link':
      return 1.5;
    default:
      return 5;
  }
}

/** Elige n mejoras distintas al azar. Si hay una evolución lista, siempre aparece. */
export function generateChoices(run: RunState, char: CharacterDef, rng: Rng, n = 3): UpgradeChoice[] {
  const pool = candidateUpgrades(run, char);
  const picked: UpgradeChoice[] = [];
  const evo = pool.find((c) => c.kind === 'evolve');
  if (evo) {
    picked.push(evo);
    pool.splice(pool.indexOf(evo), 1);
  }
  while (picked.length < n && pool.length > 0) {
    const c = weightedPick(pool, weightOf, rng);
    picked.push(c);
    pool.splice(pool.indexOf(c), 1);
  }
  if (picked.length < n) {
    const extras: UpgradeChoice[] = [
      { id: 'heal', kind: 'heal', refId: 'heal', name: 'Descanso', description: 'Recupera el 25% de la vida', level: 1, maxLevel: 1 },
      { id: 'coins', kind: 'coins', refId: 'coins', name: 'Bolsa de Zenis', description: '+40 monedas', level: 1, maxLevel: 1 },
    ];
    for (const e of extras) if (picked.length < n) picked.push(e);
  }
  return picked;
}

/** Aplica la mejora al estado. Curación la aplica quien llama (depende de stats). */
export function applyChoice(run: RunState, choice: UpgradeChoice): void {
  switch (choice.kind) {
    case 'weapon_new':
      learnWeapon(run, choice.refId);
      break;
    case 'weapon_up':
      run.weapons[choice.refId] = Math.min(choice.maxLevel, (run.weapons[choice.refId] ?? 0) + 1);
      break;
    case 'evolve':
      if (canEvolve(run, choice.refId)) run.evolved[choice.refId] = true;
      break;
    case 'passive':
      run.passives[choice.refId] = Math.min(choice.maxLevel, (run.passives[choice.refId] ?? 0) + 1);
      break;
    case 'link':
      run.links += 1;
      break;
    case 'coins':
      run.coins += 40;
      break;
    case 'heal':
      break;
  }
}

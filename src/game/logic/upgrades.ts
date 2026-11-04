import { WEAPONS } from '../../data/attacks';
import { PASSIVES } from '../../data/passives';
import type { CharacterDef } from '../../data/types';
import { weightedPick, type Rng } from './rng';
import type { RunState } from './run';

/** Máximo de ataques automáticos equipados (el definitivo Q va aparte). */
export const MAX_WEAPONS = 4;
export const MAX_PASSIVES = 6;

export type UpgradeKind = 'weapon_new' | 'weapon_up' | 'passive' | 'heal' | 'coins';

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

/** Todas las mejoras válidas para el estado actual. */
export function candidateUpgrades(run: RunState, char: CharacterDef): UpgradeChoice[] {
  const out: UpgradeChoice[] = [];
  const ownedWeapons = Object.keys(run.weapons);
  for (const id of char.weaponPool) {
    const w = WEAPONS[id];
    if (!w) continue;
    const lvl = run.weapons[id] ?? 0;
    if (lvl > 0 && lvl < w.levels.length) {
      out.push({
        id: `wup:${id}`,
        kind: 'weapon_up',
        refId: id,
        name: w.name,
        description: w.levelNotes[lvl] ?? 'Mejora el ataque',
        level: lvl + 1,
        maxLevel: w.levels.length,
      });
    } else if (lvl === 0 && ownedWeapons.length < MAX_WEAPONS) {
      out.push({
        id: `wnew:${id}`,
        kind: 'weapon_new',
        refId: id,
        name: w.name,
        description: `Nuevo ataque: ${w.description}`,
        level: 1,
        maxLevel: w.levels.length,
      });
    }
  }
  const ownedPassives = Object.keys(run.passives);
  for (const p of Object.values(PASSIVES)) {
    const lvl = run.passives[p.id] ?? 0;
    if (lvl >= p.maxLevel) continue;
    if (lvl === 0 && ownedPassives.length >= MAX_PASSIVES) continue;
    out.push({
      id: `pas:${p.id}`,
      kind: 'passive',
      refId: p.id,
      name: p.name,
      description: p.description,
      level: lvl + 1,
      maxLevel: p.maxLevel,
    });
  }
  return out;
}

function weightOf(c: UpgradeChoice): number {
  if (c.kind === 'weapon_up') return 9;
  if (c.kind === 'weapon_new') return 7;
  return 5;
}

/** Elige n mejoras distintas al azar (ponderadas). */
export function generateChoices(run: RunState, char: CharacterDef, rng: Rng, n = 3): UpgradeChoice[] {
  const pool = candidateUpgrades(run, char);
  const picked: UpgradeChoice[] = [];
  while (picked.length < n && pool.length > 0) {
    const c = weightedPick(pool, weightOf, rng);
    picked.push(c);
    pool.splice(pool.indexOf(c), 1);
  }
  if (picked.length === 0) {
    picked.push(
      { id: 'heal', kind: 'heal', refId: 'heal', name: 'Descanso', description: 'Recupera el 40% de la vida', level: 1, maxLevel: 1 },
      { id: 'coins', kind: 'coins', refId: 'coins', name: 'Bolsa de Zenis', description: '+60 monedas', level: 1, maxLevel: 1 },
    );
  }
  return picked;
}

/** Aplica la mejora al estado. Curación y monedas las aplica quien llama (dependen de stats). */
export function applyChoice(run: RunState, choice: UpgradeChoice): void {
  switch (choice.kind) {
    case 'weapon_new':
    case 'weapon_up':
      run.weapons[choice.refId] = Math.min(choice.maxLevel, (run.weapons[choice.refId] ?? 0) + 1);
      break;
    case 'passive':
      run.passives[choice.refId] = Math.min(choice.maxLevel, (run.passives[choice.refId] ?? 0) + 1);
      break;
    case 'coins':
      run.coins += 60;
      break;
    case 'heal':
      break;
  }
}

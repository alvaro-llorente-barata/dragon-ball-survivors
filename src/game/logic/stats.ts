import { PASSIVES } from '../../data/passives';
import type { CharacterDef, TransformationDef } from '../../data/types';
import type { RunState } from './run';

/** Bonificaciones permanentes compradas en el menú (fracciones, 0.1 = +10%). */
export interface MetaBonuses {
  maxHp: number;
  damage: number;
  speed: number;
  xp: number;
  luck: number;
  kiRegen: number;
  revives: number;
}

export const NO_META: MetaBonuses = { maxHp: 0, damage: 0, speed: 0, xp: 0, luck: 0, kiRegen: 0, revives: 0 };

export interface PlayerStats {
  maxHp: number;
  maxKi: number;
  kiRegen: number;
  moveSpeed: number;
  physicalMul: number;
  energyMul: number;
  cooldownMul: number;
  areaMul: number;
  amount: number;
  crit: number;
  critMul: number;
  magnet: number;
  defense: number;
  xpMul: number;
  luck: number;
  pierceBonus: number;
  projectileTint: number | null;
}

export function getForm(char: CharacterDef, formId: string): TransformationDef {
  return char.transformations.find((f) => f.id === formId) ?? char.transformations[0];
}

export function baseMaxHp(char: CharacterDef, meta: MetaBonuses): number {
  return Math.round(char.stats.hp * (1 + meta.maxHp));
}

export function computeStats(char: CharacterDef, run: RunState, meta: MetaBonuses): PlayerStats {
  const bonus = {
    damage: 0,
    moveSpeed: 0,
    cooldown: 0,
    area: 0,
    maxHp: 0,
    kiRegen: 0,
    crit: 0,
    magnet: 0,
    amount: 0,
    defense: 0,
    xp: 0,
  };
  for (const [id, lvl] of Object.entries(run.passives)) {
    const p = PASSIVES[id];
    if (!p) continue;
    for (const [k, v] of Object.entries(p.perLevel)) {
      bonus[k as keyof typeof bonus] += (v ?? 0) * lvl;
    }
  }
  const form = getForm(char, run.formId);
  const s = char.stats;

  const maxHp = Math.round(s.hp * (1 + meta.maxHp + bonus.maxHp));
  let damage = (1 + meta.damage + bonus.damage) * form.damageMul;
  if (run.buffs.power) damage *= 1.5;

  // Sangre Saiyan: más daño con poca vida.
  if (char.passives.some((p) => p.id === 'saiyan_blood')) {
    const ratio = Math.max(0, Math.min(1, run.hp / Math.max(1, maxHp)));
    damage *= 1 + 0.3 * (1 - ratio);
  }

  let moveSpeed = 1.5 * s.speed * (1 + meta.speed + bonus.moveSpeed) * form.speedMul;
  if (run.buffs.speed) moveSpeed *= 1.4;

  return {
    maxHp,
    maxKi: s.ki,
    kiRegen: 2 * (1 + meta.kiRegen + bonus.kiRegen),
    moveSpeed,
    physicalMul: (damage * s.physical) / 100,
    energyMul: (damage * s.energy) / 100,
    cooldownMul: Math.max(0.35, (1 - bonus.cooldown) * form.cooldownMul),
    areaMul: 1 + bonus.area,
    amount: bonus.amount + (form.attackMods?.extraCount ?? 0),
    crit: 0.05 + bonus.crit,
    critMul: 1.75,
    magnet: 70 * (1 + bonus.magnet),
    defense: (s.defense + bonus.defense) * form.defenseMul,
    xpMul: (1 + meta.xp + bonus.xp) * (run.buffs.xp ? 2 : 1),
    luck: meta.luck,
    pierceBonus: form.attackMods?.pierceBonus ?? 0,
    projectileTint: form.attackMods?.projectileTint ?? null,
  };
}

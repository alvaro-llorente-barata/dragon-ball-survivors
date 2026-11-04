import { PASSIVES } from '../../data/passives';
import type { CharacterDef } from '../../data/types';
import type { RunState } from './run';

/** Bonificaciones permanentes (fracciones, 0.1 = +10%). */
export interface MetaBonuses {
  maxHp: number;
  damage: number;
  speed: number;
  xp: number;
  luck: number;
  kiRegen: number;
  revives: number;
  /** nivel del personaje mejorado con fragmentos (+6% vida y daño por nivel) */
  charPower: number;
}

export const NO_META: MetaBonuses = { maxHp: 0, damage: 0, speed: 0, xp: 0, luck: 0, kiRegen: 0, revives: 0, charPower: 0 };

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
  dodgeChance: number;
  regen: number;
}

export function baseMaxHp(char: CharacterDef, meta: MetaBonuses): number {
  return Math.round(char.stats.hp * (1 + meta.maxHp + meta.charPower));
}

export function computeStats(char: CharacterDef, run: RunState, meta: MetaBonuses): PlayerStats {
  const bonus = { damage: 0, moveSpeed: 0, cooldown: 0, area: 0, maxHp: 0, kiRegen: 0, crit: 0, magnet: 0, amount: 0, defense: 0, xp: 0 };
  for (const [id, lvl] of Object.entries(run.passives)) {
    const p = PASSIVES[id];
    if (!p) continue;
    for (const [k, v] of Object.entries(p.perLevel)) bonus[k as keyof typeof bonus] += (v ?? 0) * lvl;
  }
  const s = char.stats;
  const maxHp = Math.round(s.hp * (1 + meta.maxHp + meta.charPower + bonus.maxHp));
  let damage = 1 + meta.damage + meta.charPower + bonus.damage;
  if (run.buffs.power) damage *= 1.5;
  if (char.passives.some((p) => p.id === 'saiyan_blood')) {
    const ratio = Math.max(0, Math.min(1, run.hp / Math.max(1, maxHp)));
    damage *= 1 + 0.3 * (1 - ratio);
  }
  let moveSpeed = 1.5 * s.speed * (1 + meta.speed + bonus.moveSpeed);
  if (run.buffs.speed) moveSpeed *= 1.4;
  const dodge = char.passives.find((p) => p.id === 'auto_dodge');
  return {
    maxHp,
    maxKi: s.ki,
    kiRegen: 2 * (1 + meta.kiRegen + bonus.kiRegen),
    moveSpeed,
    physicalMul: (damage * s.physical) / 100,
    energyMul: (damage * s.energy) / 100,
    cooldownMul: Math.max(0.35, 1 - bonus.cooldown),
    areaMul: 1 + bonus.area,
    amount: bonus.amount + (char.attackMods?.extraCount ?? 0),
    crit: 0.05 + bonus.crit,
    critMul: 1.75,
    magnet: 70 * (1 + bonus.magnet),
    defense: s.defense + bonus.defense,
    xpMul: (1 + meta.xp + bonus.xp) * (run.buffs.xp ? 2 : 1),
    luck: meta.luck,
    pierceBonus: char.attackMods?.pierceBonus ?? 0,
    projectileTint: char.attackMods?.projectileTint ?? null,
    dodgeChance: dodge ? (char.stars >= 7 ? 0.35 : 0.2) : 0,
    regen: char.passives.some((p) => p.id === 'regeneration') ? maxHp * 0.01 : 0,
  };
}

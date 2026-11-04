import type { MetaBonuses } from '../game/logic/stats';
import type { MetaState } from './saveService/meta';

export interface MetaUpgradeDef {
  id: keyof MetaBonuses;
  name: string;
  description: string;
  max: number;
  baseCost: number;
  growth: number;
  per: number;
}

export const META_UPGRADES: MetaUpgradeDef[] = [
  { id: 'maxHp', name: 'Vitalidad', description: '+5% de vida máxima', max: 10, baseCost: 80, growth: 1.45, per: 0.05 },
  { id: 'damage', name: 'Poder', description: '+4% de daño', max: 10, baseCost: 100, growth: 1.5, per: 0.04 },
  { id: 'speed', name: 'Agilidad', description: '+3% de velocidad', max: 5, baseCost: 120, growth: 1.6, per: 0.03 },
  { id: 'xp', name: 'Sabiduría', description: '+5% de experiencia', max: 8, baseCost: 90, growth: 1.5, per: 0.05 },
  { id: 'luck', name: 'Suerte', description: '+6% de probabilidad de cofres raros', max: 5, baseCost: 150, growth: 1.7, per: 0.06 },
  { id: 'kiRegen', name: 'Meditación', description: '+10% de regeneración de Ki', max: 5, baseCost: 110, growth: 1.55, per: 0.1 },
  { id: 'revives', name: 'Segunda oportunidad', description: 'Revive una vez por partida', max: 1, baseCost: 2000, growth: 1, per: 1 },
];

export function upgradeCost(def: MetaUpgradeDef, level: number): number {
  return Math.round(def.baseCost * Math.pow(def.growth, level));
}

export function buyUpgrade(meta: MetaState, id: string): { ok: boolean; meta: MetaState; reason?: string } {
  const def = META_UPGRADES.find((u) => u.id === id);
  if (!def) return { ok: false, meta, reason: 'Mejora desconocida' };
  const lvl = meta.upgrades[id] ?? 0;
  if (lvl >= def.max) return { ok: false, meta, reason: 'Nivel máximo' };
  const cost = upgradeCost(def, lvl);
  if (meta.coins < cost) return { ok: false, meta, reason: 'Monedas insuficientes' };
  return {
    ok: true,
    meta: { ...meta, coins: meta.coins - cost, upgrades: { ...meta.upgrades, [id]: lvl + 1 } },
  };
}

export function metaBonuses(meta: MetaState): MetaBonuses {
  const b: MetaBonuses = { maxHp: 0, damage: 0, speed: 0, xp: 0, luck: 0, kiRegen: 0, revives: 0 };
  for (const def of META_UPGRADES) b[def.id] = (meta.upgrades[def.id] ?? 0) * def.per;
  return b;
}

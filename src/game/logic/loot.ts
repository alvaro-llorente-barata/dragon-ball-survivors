import { CAPSULES, ITEMS } from '../../data/items';
import type { CapsuleKind, ChestRarity, ItemKind } from '../../data/types';
import { randInt, weightedPick, type Rng } from './rng';

export const CHEST_RARITIES: readonly ChestRarity[] = ['common', 'rare', 'epic', 'legendary', 'divine'];

export const BASE_CHEST_WEIGHTS: Record<ChestRarity, number> = {
  common: 60,
  rare: 25,
  epic: 10,
  legendary: 4,
  divine: 1,
};

/** Pesos de rareza con la suerte aplicada (luck 0.1 = +10%). */
export function chestWeights(luck: number): Record<ChestRarity, number> {
  const l = Math.max(0, luck);
  return {
    common: BASE_CHEST_WEIGHTS.common * Math.max(0.3, 1 - l),
    rare: BASE_CHEST_WEIGHTS.rare * (1 + l),
    epic: BASE_CHEST_WEIGHTS.epic * (1 + l * 1.5),
    legendary: BASE_CHEST_WEIGHTS.legendary * (1 + l * 2),
    divine: BASE_CHEST_WEIGHTS.divine * (1 + l * 2.5),
  };
}

/** Probabilidades reales en % (se muestran en la interfaz). */
export function chestProbabilities(luck: number): Record<ChestRarity, number> {
  const w = chestWeights(luck);
  const total = CHEST_RARITIES.reduce((a, r) => a + w[r], 0);
  const out = {} as Record<ChestRarity, number>;
  for (const r of CHEST_RARITIES) out[r] = (w[r] / total) * 100;
  return out;
}

export function rollChestRarity(rng: Rng, luck = 0, minimum: ChestRarity = 'common'): ChestRarity {
  const w = chestWeights(luck);
  const minIdx = CHEST_RARITIES.indexOf(minimum);
  const allowed = CHEST_RARITIES.filter((_, i) => i >= minIdx);
  return weightedPick(allowed, (r) => w[r], rng);
}

export type Reward =
  | { kind: 'coins'; amount: number }
  | { kind: 'xp'; amount: number }
  | { kind: 'upgrade' }
  | { kind: 'item'; item: ItemKind }
  | { kind: 'tickets'; amount: number }
  | { kind: 'fragments'; amount: number }
  | { kind: 'buff'; buff: 'power' | 'speed' | 'xp'; seconds: number };

const ROLLS: Record<ChestRarity, number> = { common: 1, rare: 2, epic: 3, legendary: 4, divine: 5 };
const VALUE: Record<ChestRarity, number> = { common: 1, rare: 2, epic: 3.5, legendary: 6, divine: 10 };

type Entry = { weight: number; make: (rng: Rng, v: number, minute: number) => Reward };

const ENTRIES: Entry[] = [
  { weight: 30, make: (rng, v, m) => ({ kind: 'coins', amount: Math.round((15 + randInt(rng, 0, 15)) * v * (1 + m * 0.1)) }) },
  { weight: 18, make: (rng, v, m) => ({ kind: 'xp', amount: Math.round((10 + randInt(rng, 0, 10)) * v * (1 + m * 0.25)) }) },
  { weight: 20, make: () => ({ kind: 'upgrade' }) },
  { weight: 14, make: (rng) => ({ kind: 'item', item: weightedPick(Object.values(ITEMS), (i) => i.weight, rng).kind }) },
  { weight: 6, make: (_rng, v) => ({ kind: 'tickets', amount: Math.max(1, Math.floor(v / 2)) }) },
  { weight: 8, make: (rng, v) => ({ kind: 'fragments', amount: Math.round((2 + randInt(rng, 0, 3)) * v) }) },
  {
    weight: 4,
    make: (rng) => ({ kind: 'buff', buff: weightedPick(['power', 'speed', 'xp'] as const, () => 1, rng), seconds: 20 }),
  },
];

export function rollChestRewards(rarity: ChestRarity, rng: Rng, minute: number): Reward[] {
  const v = VALUE[rarity];
  const out: Reward[] = [];
  for (let i = 0; i < ROLLS[rarity]; i++) {
    const entry = weightedPick(ENTRIES, (e) => e.weight, rng);
    out.push(entry.make(rng, v, minute));
  }
  // Los cofres épicos o mejores siempre incluyen al menos una mejora.
  if (CHEST_RARITIES.indexOf(rarity) >= 2 && !out.some((r) => r.kind === 'upgrade')) {
    out[0] = { kind: 'upgrade' };
  }
  // Los legendarios y divinos siempre dan un ticket de invocación.
  if (CHEST_RARITIES.indexOf(rarity) >= 3 && !out.some((r) => r.kind === 'tickets')) {
    out.push({ kind: 'tickets', amount: rarity === 'divine' ? 3 : 1 });
  }
  return out;
}

export type CapsuleOutcome =
  | { kind: 'reward'; reward: Reward; label: string }
  | { kind: 'heal'; fraction: number; label: string }
  | { kind: 'ki'; amount: number; label: string }
  | { kind: 'ambush'; label: string };

export function rollCapsuleKind(rng: Rng): CapsuleKind {
  return weightedPick(Object.values(CAPSULES), (c) => c.weight, rng).kind;
}

export function rollCapsule(kind: CapsuleKind, rng: Rng, minute: number): CapsuleOutcome {
  switch (kind) {
    case 'coins': {
      const amount = 8 + randInt(rng, 0, 12) + minute * 2;
      return { kind: 'reward', reward: { kind: 'coins', amount }, label: `+${amount} monedas` };
    }
    case 'xp': {
      const amount = 6 + randInt(rng, 0, 8) + minute * 3;
      return { kind: 'reward', reward: { kind: 'xp', amount }, label: `+${amount} EXP` };
    }
    case 'heal':
      return { kind: 'heal', fraction: 0.2, label: '+20% vida' };
    case 'ki':
      return { kind: 'ki', amount: 35, label: '+35 Ki' };
    case 'upgrade':
      return { kind: 'reward', reward: { kind: 'upgrade' }, label: '¡Mejora!' };
    case 'mystery': {
      const r = rng();
      if (r < 0.3) return { kind: 'ambush', label: '¡Emboscada!' };
      if (r < 0.55) return { kind: 'reward', reward: { kind: 'tickets', amount: 1 }, label: '+1 ticket' };
      if (r < 0.8) {
        const item = weightedPick(Object.values(ITEMS), (i) => i.weight, rng).kind;
        return { kind: 'reward', reward: { kind: 'item', item }, label: ITEMS[item].name };
      }
      return { kind: 'reward', reward: { kind: 'upgrade' }, label: '¡Mejora!' };
    }
  }
}

/** Botín al morir un enemigo normal. */
export function rollEnemyDrop(rng: Rng, coinChance: number, elite: boolean): { coins: number; item: ItemKind | null; chest: boolean } {
  const coins = rng() < coinChance * (elite ? 6 : 1) ? (elite ? 10 : 1 + Math.floor(rng() * 2)) : 0;
  const item = rng() < (elite ? 0.25 : 0.004) ? weightedPick(Object.values(ITEMS), (i) => i.weight, rng).kind : null;
  const chest = elite && rng() < 0.45;
  return { coins, item, chest };
}

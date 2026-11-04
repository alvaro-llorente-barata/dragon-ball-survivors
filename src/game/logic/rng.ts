export type Rng = () => number;

/** Generador pseudoaleatorio con semilla (reproducible en tests y en la generación de mapas). */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function weightedPick<T>(items: readonly T[], weight: (t: T) => number, rng: Rng): T {
  if (items.length === 0) throw new Error('weightedPick: lista vacía');
  let total = 0;
  for (const it of items) total += Math.max(0, weight(it));
  if (total <= 0) return items[Math.floor(rng() * items.length)];
  let r = rng() * total;
  for (const it of items) {
    r -= Math.max(0, weight(it));
    if (r < 0) return it;
  }
  return items[items.length - 1];
}

export function randInt(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

export function randRange(rng: Rng, min: number, max: number): number {
  return min + rng() * (max - min);
}

import type { Rng } from './rng';

export interface DamageRoll {
  amount: number;
  crit: boolean;
}

export function rollDamage(base: number, mul: number, critChance: number, critMul: number, rng: Rng): DamageRoll {
  const crit = rng() < critChance;
  const variance = 0.9 + rng() * 0.2;
  const amount = Math.max(1, Math.round(base * mul * variance * (crit ? critMul : 1)));
  return { amount, crit };
}

/** Daño recibido tras la defensa (rendimientos decrecientes). */
export function damageTaken(amount: number, defense: number): number {
  return Math.max(1, Math.round((amount * 100) / (100 + Math.max(0, defense))));
}

/** ¿Está el punto dentro de un rayo rectangular que sale de (ox, oy) con el ángulo dado? */
export function pointInBeam(
  px: number,
  py: number,
  ox: number,
  oy: number,
  angle: number,
  length: number,
  halfWidth: number,
): boolean {
  const dx = px - ox;
  const dy = py - oy;
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const along = dx * c + dy * s;
  const perp = -dx * s + dy * c;
  return along >= 0 && along <= length && Math.abs(perp) <= halfWidth;
}

/** ¿Está el punto dentro de un arco (sector circular)? */
export function pointInArc(
  px: number,
  py: number,
  ox: number,
  oy: number,
  angle: number,
  radius: number,
  halfAngle: number,
): boolean {
  const dx = px - ox;
  const dy = py - oy;
  const d2 = dx * dx + dy * dy;
  if (d2 > radius * radius) return false;
  if (d2 < 1) return true;
  let diff = Math.atan2(dy, dx) - angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return Math.abs(diff) <= halfAngle;
}

export function pointInCircle(px: number, py: number, cx: number, cy: number, r: number): boolean {
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= r * r;
}

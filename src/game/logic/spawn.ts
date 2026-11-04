import type { EnemySpawnEntry } from '../../data/maps';
import { weightedPick, type Rng } from './rng';

/** Enemigos que aparecen por segundo según el tiempo de partida (segundos). */
export function spawnRatePerSecond(t: number): number {
  return Math.min(16, 1.3 + t / 28);
}

export function maxEnemies(t: number): number {
  return Math.min(380, Math.floor(60 + t * 0.9));
}

export function enemyHpMul(t: number): number {
  return 1 + (t / 60) * 0.3 + Math.pow(t / 480, 2);
}

export function enemyDamageMul(t: number): number {
  return 1 + (t / 60) * 0.1;
}

export function eliteChance(t: number): number {
  return t < 90 ? 0 : Math.min(0.06, 0.01 + t / 6000);
}

export function pickEnemyId(pool: readonly EnemySpawnEntry[], t: number, rng: Rng): string {
  const available = pool.filter((e) => e.from <= t);
  const list = available.length > 0 ? available : pool.slice(0, 1);
  // Los enemigos recién desbloqueados pesan menos al principio y crecen con el tiempo.
  return weightedPick(list, (e) => e.weight * Math.min(1, 0.35 + (t - e.from) / 120), rng).id;
}

/** Escalado de jefes: cada repetición tras la lista principal es más dura. */
export function bossHpMul(t: number, loop: number): number {
  return (1 + t / 900) * Math.pow(1.7, loop);
}

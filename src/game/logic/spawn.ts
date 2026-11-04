import type { EnemySpawnEntry } from '../../data/maps';
import type { Difficulty } from '../../data/types';
import { weightedPick, type Rng } from './rng';

/**
 * Dificultad. No solo sube la vida: sube la presión (cantidad), la velocidad,
 * los élites, las oleadas que rodean y los tipos de enemigo con habilidades.
 */
export interface DifficultyDef {
  id: Difficulty;
  name: string;
  description: string;
  spawn: number;
  hp: number;
  damage: number;
  speed: number;
  elite: number;
  /** multiplicador de monedas y tickets ganados */
  reward: number;
  /** cada cuánto (s) llega una oleada que rodea */
  encircleEvery: number;
}

export const DIFFICULTIES: Record<Difficulty, DifficultyDef> = {
  normal: { id: 'normal', name: 'Normal', description: 'Un reto real. Hay que esquivar y elegir bien.', spawn: 1, hp: 1, damage: 1, speed: 1, elite: 1, reward: 1, encircleEvery: 75 },
  hard: { id: 'hard', name: 'Difícil', description: 'Más enemigos, más rápidos y más élites. x1,5 recompensas.', spawn: 1.35, hp: 1.3, damage: 1.35, speed: 1.12, elite: 1.8, reward: 1.5, encircleEvery: 55 },
  nightmare: { id: 'nightmare', name: 'Pesadilla', description: 'Para expertos. Hordas enormes desde el principio. x2,5 recompensas.', spawn: 1.8, hp: 1.75, damage: 1.8, speed: 1.25, elite: 3, reward: 2.5, encircleEvery: 40 },
};

/** Fase de la partida según el minuto (para la interfaz y el diseño de oleadas). */
export function stageOf(t: number): { index: number; name: string } {
  const m = t / 60;
  const stages = ['Calentamiento', 'Presión', 'Élites', 'Asedio', 'Guerreros', 'Caos', 'Extremo', 'Jefe final'];
  const cuts = [3, 6, 10, 15, 20, 25, 30];
  let i = cuts.findIndex((c) => m < c);
  if (i < 0) i = stages.length - 1;
  return { index: i, name: stages[i] };
}

/** Enemigos que aparecen por segundo. Crece por tramos (minutos 3, 6, 10, 15, 20, 25). */
export function spawnRatePerSecond(t: number, d: DifficultyDef = DIFFICULTIES.normal): number {
  const m = t / 60;
  let r = 1.6 + m * 0.9;
  if (m >= 3) r += 1.5;
  if (m >= 6) r += 2;
  if (m >= 10) r += 2.5;
  if (m >= 15) r += 3;
  if (m >= 20) r += 3;
  if (m >= 25) r += 4;
  return Math.min(34, r * d.spawn);
}

export function maxEnemies(t: number, d: DifficultyDef = DIFFICULTIES.normal): number {
  return Math.min(400, Math.floor((70 + t * 1.1) * Math.min(1.6, d.spawn)));
}

export function enemyHpMul(t: number, d: DifficultyDef = DIFFICULTIES.normal): number {
  return (1 + (t / 60) * 0.32 + Math.pow(t / 420, 2)) * d.hp;
}

export function enemyDamageMul(t: number, d: DifficultyDef = DIFFICULTIES.normal): number {
  return (1 + (t / 60) * 0.12) * d.damage;
}

export function enemySpeedMul(t: number, d: DifficultyDef = DIFFICULTIES.normal): number {
  return Math.min(1.6, 1 + (t / 60) * 0.018) * d.speed;
}

export function eliteChance(t: number, d: DifficultyDef = DIFFICULTIES.normal): number {
  if (t < 360 / d.elite) return 0;
  return Math.min(0.12, (0.008 + t / 9000) * d.elite);
}

export function pickEnemyId(pool: readonly EnemySpawnEntry[], t: number, rng: Rng): string {
  const available = pool.filter((e) => e.from <= t);
  const list = available.length > 0 ? available : pool.slice(0, 1);
  // Los enemigos recién desbloqueados pesan menos al principio y crecen con el tiempo.
  return weightedPick(list, (e) => e.weight * Math.min(1, 0.35 + (t - e.from) / 120), rng).id;
}

/** Escalado de jefes: cada repetición tras la lista principal es más dura. */
export function bossHpMul(t: number, loop: number, d: DifficultyDef = DIFFICULTIES.normal): number {
  return (1 + t / 700) * Math.pow(1.7, loop) * d.hp;
}

/** Minuto del jefe definitivo de la sesión. */
export const FINAL_BOSS_TIME = 30 * 60;

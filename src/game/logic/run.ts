import type { BuffId, CharacterDef } from '../../data/types';

/** Estado de una partida. Lógica pura, sin Phaser. */
export interface RunState {
  characterId: string;
  level: number;
  xp: number;
  hp: number;
  ki: number;
  weapons: Record<string, number>;
  passives: Record<string, number>;
  buffs: Partial<Record<BuffId, number>>;
  shieldHits: number;
  kills: number;
  coins: number;
  tickets: number;
  fragments: number;
  time: number;
  chestsOpened: number;
  bossesDefeated: string[];
  revivesLeft: number;
}

export function xpForLevel(level: number): number {
  return Math.floor(5 * Math.pow(level, 1.3)) + 3;
}

export function createRunState(char: CharacterDef, maxHp: number, maxKi: number, revives: number): RunState {
  return {
    characterId: char.id,
    level: 1,
    xp: 0,
    hp: maxHp,
    ki: Math.round(maxKi * 0.5),
    weapons: { [char.startingWeapon]: 1 },
    passives: {},
    buffs: {},
    shieldHits: 0,
    kills: 0,
    coins: 0,
    tickets: 0,
    fragments: 0,
    time: 0,
    chestsOpened: 0,
    bossesDefeated: [],
    revivesLeft: revives,
  };
}

/** Suma experiencia y devuelve cuántos niveles se han subido. */
export function addXp(run: RunState, amount: number): number {
  run.xp += amount;
  let gained = 0;
  while (run.xp >= xpForLevel(run.level)) {
    run.xp -= xpForLevel(run.level);
    run.level += 1;
    gained += 1;
  }
  return gained;
}

export function tickBuffs(run: RunState, dt: number): BuffId[] {
  const expired: BuffId[] = [];
  for (const key of Object.keys(run.buffs) as BuffId[]) {
    const left = (run.buffs[key] ?? 0) - dt;
    if (left <= 0) {
      delete run.buffs[key];
      expired.push(key);
    } else {
      run.buffs[key] = left;
    }
  }
  return expired;
}

export function addBuff(run: RunState, id: BuffId, seconds: number): void {
  run.buffs[id] = Math.max(run.buffs[id] ?? 0, seconds);
}

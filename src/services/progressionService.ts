import { MAPS } from '../data/maps';
import type { MetaState } from './saveService/meta';

export interface RunResult {
  characterId: string;
  mapId: string;
  time: number;
  kills: number;
  level: number;
  coins: number;
  tickets: number;
  fragments: number;
  chestsOpened: number;
  bossesDefeated: string[];
  died: boolean;
}

export function runAccountXp(r: RunResult): number {
  return Math.floor(r.time / 6 + r.kills / 8 + r.bossesDefeated.length * 60 + r.level * 4);
}

/** Aplica el resultado de una partida a la progresión permanente (sin mutar). */
export function applyRunResult(meta: MetaState, r: RunResult): { meta: MetaState; unlockedMaps: string[] } {
  const bosses = { ...meta.bossesDefeated };
  for (const b of r.bossesDefeated) bosses[b] = (bosses[b] ?? 0) + 1;
  const unlockedMaps = [...meta.unlockedMaps];
  const newly: string[] = [];
  for (const m of MAPS) {
    if (unlockedMaps.includes(m.id)) continue;
    if (m.unlock.type === 'boss' && bosses[m.unlock.bossId]) {
      unlockedMaps.push(m.id);
      newly.push(m.id);
    }
  }
  // Los fragmentos ganados en partida van al personaje con el que se jugó.
  const prog = meta.characters[r.characterId] ?? { level: 1, shards: 0 };
  const characters = { ...meta.characters, [r.characterId]: { ...prog, shards: prog.shards + r.fragments } };
  return {
    unlockedMaps: newly,
    meta: {
      ...meta,
      characters,
      coins: meta.coins + r.coins,
      tickets: meta.tickets + r.tickets,
      fragments: meta.fragments + r.fragments,
      accountXp: meta.accountXp + runAccountXp(r),
      bossesDefeated: bosses,
      unlockedMaps,
      stats: {
        runs: meta.stats.runs + 1,
        totalKills: meta.stats.totalKills + r.kills,
        bestTime: Math.max(meta.stats.bestTime, r.time),
        chestsOpened: meta.stats.chestsOpened + r.chestsOpened,
        totalCoins: meta.stats.totalCoins + r.coins,
        deaths: meta.stats.deaths + (r.died ? 1 : 0),
      },
    },
  };
}

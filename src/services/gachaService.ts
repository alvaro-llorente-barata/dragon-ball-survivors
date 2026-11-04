import { CHARACTERS } from '../data/characters';
import type { CharacterDef } from '../data/types';
import { weightedPick, type Rng } from '../game/logic/rng';
import { MAX_CHAR_LEVEL, type MetaState } from './saveService/meta';

/**
 * Invocaciones con tickets. Cada personaje sale dentro de una Bola de Dragón con
 * tantas estrellas como su rareza (1 a 7). Probabilidades reales y garantías.
 */
export const STAR_RATES: Record<number, number> = { 1: 38, 2: 27, 3: 18, 4: 10.5, 5: 4.5, 6: 1.5, 7: 0.5 };
/** cada 10 invocaciones sin 4★ o más, la siguiente es 4★ o más */
export const PITY_EPIC = 10;
/** cada 90 invocaciones sin 7★, la siguiente es 7★ */
export const PITY_MYTHIC = 90;

export const shardsForDuplicate = (stars: number) => stars * 5;
export const levelUpCost = (level: number) => ({ shards: 8 * level, coins: 120 * level });

export interface SummonResult {
  characterId: string;
  stars: number;
  isNew: boolean;
  shards: number;
}

/** Probabilidad real (%) de cada número de estrellas, solo entre las que tienen personajes. */
export function starProbabilities(pool: readonly CharacterDef[] = CHARACTERS): Record<number, number> {
  const present = [...new Set(pool.map((c) => c.stars))];
  const total = present.reduce((a, s) => a + (STAR_RATES[s] ?? 0), 0);
  const out: Record<number, number> = {};
  for (const s of present.sort()) out[s] = ((STAR_RATES[s] ?? 0) / total) * 100;
  return out;
}

function rollStars(meta: MetaState, rng: Rng, pool: readonly CharacterDef[]): number {
  const present = [...new Set(pool.map((c) => c.stars))];
  if (meta.gacha.sinceMythic + 1 >= PITY_MYTHIC && present.includes(7)) return 7;
  const candidates = meta.gacha.sinceEpic + 1 >= PITY_EPIC ? present.filter((s) => s >= 4) : present;
  return weightedPick(candidates.length ? candidates : present, (s) => STAR_RATES[s] ?? 0, rng);
}

export function summonOnce(meta: MetaState, rng: Rng, pool: readonly CharacterDef[] = CHARACTERS): { meta: MetaState; result: SummonResult } {
  if (meta.tickets < 1) throw new Error('No tienes tickets');
  const stars = rollStars(meta, rng, pool);
  const options = pool.filter((c) => c.stars === stars);
  const char = options[Math.floor(rng() * options.length)];
  const owned = meta.unlockedCharacters.includes(char.id);
  const shards = owned ? shardsForDuplicate(stars) : 0;
  const prog = meta.characters[char.id] ?? { level: 1, shards: 0 };
  const next: MetaState = {
    ...meta,
    tickets: meta.tickets - 1,
    unlockedCharacters: owned ? meta.unlockedCharacters : [...meta.unlockedCharacters, char.id],
    characters: { ...meta.characters, [char.id]: { ...prog, shards: prog.shards + shards } },
    gacha: {
      pulls: meta.gacha.pulls + 1,
      sinceEpic: stars >= 4 ? 0 : meta.gacha.sinceEpic + 1,
      sinceMythic: stars >= 7 ? 0 : meta.gacha.sinceMythic + 1,
    },
  };
  return { meta: next, result: { characterId: char.id, stars, isNew: !owned, shards } };
}

export function summon(meta: MetaState, count: number, rng: Rng): { meta: MetaState; results: SummonResult[] } {
  if (meta.tickets < count) throw new Error(`Necesitas ${count} tickets`);
  const results: SummonResult[] = [];
  let m = meta;
  for (let i = 0; i < count; i++) {
    const r = summonOnce(m, rng);
    m = r.meta;
    results.push(r.result);
  }
  return { meta: m, results };
}

/** Sube de nivel un personaje gastando sus fragmentos y monedas. */
export function levelUpCharacter(meta: MetaState, id: string): { ok: boolean; meta: MetaState; reason?: string } {
  const prog = meta.characters[id];
  if (!prog || !meta.unlockedCharacters.includes(id)) return { ok: false, meta, reason: 'No tienes este personaje' };
  if (prog.level >= MAX_CHAR_LEVEL) return { ok: false, meta, reason: 'Nivel máximo' };
  const cost = levelUpCost(prog.level);
  if (prog.shards < cost.shards) return { ok: false, meta, reason: 'Faltan fragmentos (salen al repetir personaje)' };
  if (meta.coins < cost.coins) return { ok: false, meta, reason: 'Faltan monedas' };
  return {
    ok: true,
    meta: {
      ...meta,
      coins: meta.coins - cost.coins,
      characters: { ...meta.characters, [id]: { level: prog.level + 1, shards: prog.shards - cost.shards } },
    },
  };
}

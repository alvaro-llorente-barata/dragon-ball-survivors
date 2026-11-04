import { CHARACTERS, charactersOfSaga } from '../data/characters';
import { SAGAS, type CharacterDef, type Saga } from '../data/types';
import { weightedPick, type Rng } from '../game/logic/rng';
import { MAX_CHAR_LEVEL, type BannerPity, type MetaState } from './saveService/meta';

/**
 * Invocaciones por saga (como las máquinas por región de PokéSurvivor).
 * El banner de una saga SOLO contiene personajes de esa saga: el filtro está en los datos (charactersOfSaga).
 * Cada personaje sale dentro de una Bola de Dragón con tantas estrellas como su rareza (1 a 7).
 */
export const STAR_RATES: Record<number, number> = { 1: 38, 2: 27, 3: 18, 4: 10.5, 5: 4.5, 6: 1.5, 7: 0.5 };
/** cada PITY_EPIC tiradas sin 4★ o más, la siguiente es 4★ o más */
export const PITY_EPIC = 10;
/** cada PITY_TOP tiradas sin la rareza más alta del banner, la siguiente la da */
export const PITY_TOP = 80;
export const PULL_SIZES = [1, 10, 100] as const;

/** Recompensa por completar la colección de una saga */
export const SAGA_REWARD = { tickets: 10, coins: 1500 };

export const shardsForDuplicate = (stars: number) => stars * 5;
export const levelUpCost = (level: number) => ({ shards: 8 * level, coins: 120 * level });

export interface SummonResult {
  characterId: string;
  stars: number;
  isNew: boolean;
  shards: number;
}

export function bannerPool(saga: Saga): CharacterDef[] {
  return charactersOfSaga(saga);
}

/** Probabilidad real (%) de cada número de estrellas en un banner (solo las que existen en él). */
export function starProbabilities(pool: readonly CharacterDef[] = CHARACTERS): Record<number, number> {
  const present = [...new Set(pool.map((c) => c.stars))].sort((a, b) => a - b);
  const total = present.reduce((a, s) => a + (STAR_RATES[s] ?? 0), 0);
  const out: Record<number, number> = {};
  for (const s of present) out[s] = ((STAR_RATES[s] ?? 0) / total) * 100;
  return out;
}

export function pityOf(meta: MetaState, saga: Saga): BannerPity {
  return meta.gacha.banners[saga] ?? { pulls: 0, sinceEpic: 0, sinceTop: 0 };
}

function rollStars(pity: BannerPity, rng: Rng, pool: readonly CharacterDef[]): number {
  const present = [...new Set(pool.map((c) => c.stars))];
  const top = Math.max(...present);
  if (pity.sinceTop + 1 >= PITY_TOP) return top;
  const epicLine = Math.min(4, top);
  const candidates = pity.sinceEpic + 1 >= PITY_EPIC ? present.filter((s) => s >= epicLine) : present;
  return weightedPick(candidates.length ? candidates : present, (s) => STAR_RATES[s] ?? 0, rng);
}

/** Una tirada en el banner de la saga indicada. */
export function summonOnce(meta: MetaState, rng: Rng, saga: Saga = 'saiyan'): { meta: MetaState; result: SummonResult } {
  if (meta.tickets < 1) throw new Error('No tienes tickets');
  const pool = bannerPool(saga);
  if (pool.length === 0) throw new Error('Banner vacío');
  const pity = pityOf(meta, saga);
  const top = Math.max(...pool.map((c) => c.stars));
  const stars = rollStars(pity, rng, pool);
  const options = pool.filter((c) => c.stars === stars);
  const char = options[Math.floor(rng() * options.length)];
  const owned = meta.unlockedCharacters.includes(char.id);
  const shards = owned ? shardsForDuplicate(stars) : 0;
  const prog = meta.characters[char.id] ?? { level: 1, shards: 0 };
  const nextPity: BannerPity = {
    pulls: pity.pulls + 1,
    sinceEpic: stars >= Math.min(4, top) ? 0 : pity.sinceEpic + 1,
    sinceTop: stars >= top ? 0 : pity.sinceTop + 1,
  };
  const next: MetaState = {
    ...meta,
    tickets: meta.tickets - 1,
    unlockedCharacters: owned ? meta.unlockedCharacters : [...meta.unlockedCharacters, char.id],
    characters: { ...meta.characters, [char.id]: { ...prog, shards: prog.shards + shards } },
    gacha: { ...meta.gacha, pulls: meta.gacha.pulls + 1, banners: { ...meta.gacha.banners, [saga]: nextPity } },
  };
  return { meta: next, result: { characterId: char.id, stars, isNew: !owned, shards } };
}

export interface SummonBatch {
  meta: MetaState;
  results: SummonResult[];
  /** sagas completadas en estas tiradas (con su premio ya entregado) */
  completed: Saga[];
}

export function summon(meta: MetaState, count: number, rng: Rng, saga: Saga = 'saiyan'): SummonBatch {
  if (meta.tickets < count) throw new Error(`Necesitas ${count} tickets`);
  const results: SummonResult[] = [];
  let m = meta;
  for (let i = 0; i < count; i++) {
    const r = summonOnce(m, rng, saga);
    m = r.meta;
    results.push(r.result);
  }
  const claimed = claimSagaRewards(m);
  return { meta: claimed.meta, results, completed: claimed.completed };
}

export function sagaProgress(meta: MetaState, saga: Saga): { owned: number; total: number } {
  const pool = charactersOfSaga(saga);
  return { owned: pool.filter((c) => meta.unlockedCharacters.includes(c.id)).length, total: pool.length };
}

/** Entrega (una sola vez) el premio de cada saga completada. */
export function claimSagaRewards(meta: MetaState): { meta: MetaState; completed: Saga[] } {
  const completed: Saga[] = [];
  let m = meta;
  for (const s of SAGAS) {
    if (m.claimedSagas.includes(s)) continue;
    const p = sagaProgress(m, s);
    if (p.total > 0 && p.owned === p.total) {
      completed.push(s);
      m = { ...m, tickets: m.tickets + SAGA_REWARD.tickets, coins: m.coins + SAGA_REWARD.coins, claimedSagas: [...m.claimedSagas, s] };
    }
  }
  return { meta: m, completed };
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
    meta: { ...meta, coins: meta.coins - cost.coins, characters: { ...meta.characters, [id]: { level: prog.level + 1, shards: prog.shards - cost.shards } } },
  };
}

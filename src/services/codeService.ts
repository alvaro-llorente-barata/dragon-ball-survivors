import { CHARACTERS } from '../data/characters';
import type { MetaState } from './saveService/meta';

/**
 * Códigos canjeables desde Ajustes. Se comparan en mayúsculas y sin espacios.
 * Nota: el juego es solo local, así que estos códigos son una comodidad,
 * no una protección: quien lea el código fuente puede ver la lista.
 */
const CODE_ALL_CHARACTERS = 'DAVANTE';
const REDEEMABLE = new Set<string>([CODE_ALL_CHARACTERS]);

export type RedeemResult = { ok: true; meta: MetaState; message: string } | { ok: false; message: string };

/** Normaliza lo que escribe la persona: " davante " -> "DAVANTE". */
export function normalizeCode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, '');
}

/** Canjea un código y devuelve el estado nuevo. No modifica el estado original. */
export function redeemCode(meta: MetaState, input: string): RedeemResult {
  const code = normalizeCode(input);
  if (!code) return { ok: false, message: 'Escribe un código.' };
  if (!REDEEMABLE.has(code)) return { ok: false, message: 'Código no válido.' };
  if (meta.redeemedCodes.includes(code)) return { ok: false, message: 'Este código ya se ha canjeado.' };

  const allIds = CHARACTERS.map((c) => c.id);
  const unlockedCharacters = [...new Set([...meta.unlockedCharacters, ...allIds])];
  const characters = { ...meta.characters };
  for (const id of allIds) characters[id] = characters[id] ?? { level: 1, shards: 0 };

  return {
    ok: true,
    meta: { ...meta, unlockedCharacters, characters, redeemedCodes: [...meta.redeemedCodes, code] },
    message: `¡Código canjeado! Desbloqueados los ${allIds.length} personajes.`,
  };
}

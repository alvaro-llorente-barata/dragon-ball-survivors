import type { RunState } from './run';

/**
 * Sistema de huecos inspirado en PokéSurvivor:
 * - 4 huecos (bloques). Solo ataca el bloque seleccionado (teclas 1-4).
 * - Un Vínculo de Ki une dos bloques en uno y libera un hueco.
 * - Un bloque admite como mucho MAX_PER_SLOT ataques.
 * Los ataques vinculados conservan nivel, evolución y recarga (viven en run.weapons).
 */
export const MAX_SLOTS = 4;
export const MAX_PER_SLOT = 3;

export function emptySlot(run: RunState): number {
  return run.slots.findIndex((s) => s.length === 0);
}

export function hasFreeSlot(run: RunState): boolean {
  return emptySlot(run) >= 0;
}

/** Aprende un ataque nuevo en el primer hueco libre. Devuelve el hueco o -1. */
export function learnWeapon(run: RunState, id: string): number {
  if (run.weapons[id]) return run.slots.findIndex((s) => s.includes(id));
  const i = emptySlot(run);
  if (i < 0) return -1;
  run.weapons[id] = 1;
  run.slots[i] = [id];
  return i;
}

/** Pares de bloques que se pueden vincular (a recibe a b). */
export function linkPairs(run: RunState): [number, number][] {
  const out: [number, number][] = [];
  for (let a = 0; a < MAX_SLOTS; a++)
    for (let b = a + 1; b < MAX_SLOTS; b++) {
      const sa = run.slots[a];
      const sb = run.slots[b];
      if (sa.length && sb.length && sa.length + sb.length <= MAX_PER_SLOT) out.push([a, b]);
    }
  return out;
}

/**
 * Une el bloque b dentro del bloque a, gasta un Vínculo y compacta los huecos
 * (los vacíos quedan al final). Devuelve false si no es válido.
 */
export function linkSlots(run: RunState, a: number, b: number): boolean {
  if (run.links <= 0 || a === b) return false;
  if (!linkPairs(run).some(([x, y]) => (x === a && y === b) || (x === b && y === a))) return false;
  const target = Math.min(a, b);
  const source = Math.max(a, b);
  const selectedIds = run.slots[run.selected];
  run.slots[target] = [...run.slots[target], ...run.slots[source]];
  run.slots[source] = [];
  const filled = run.slots.filter((s) => s.length > 0);
  while (filled.length < MAX_SLOTS) filled.push([]);
  run.slots = filled;
  // El hueco seleccionado sigue apuntando a los mismos ataques.
  const idx = run.slots.findIndex((s) => selectedIds.length > 0 && s.includes(selectedIds[0]));
  run.selected = idx >= 0 ? idx : 0;
  run.links -= 1;
  return true;
}

/** Selecciona un hueco (solo si tiene ataques). */
export function selectSlot(run: RunState, i: number): boolean {
  if (i < 0 || i >= MAX_SLOTS || run.slots[i].length === 0) return false;
  run.selected = i;
  return true;
}

export function activeWeapons(run: RunState): string[] {
  return run.slots[run.selected] ?? [];
}

/** Total de ataques aprendidos. */
export function weaponCount(run: RunState): number {
  return run.slots.reduce((a, s) => a + s.length, 0);
}

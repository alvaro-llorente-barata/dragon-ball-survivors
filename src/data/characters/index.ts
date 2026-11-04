import type { CharacterDef, Saga } from '../types';
import { goku } from './goku';

/**
 * Catálogo de personajes jugables.
 * Solo se añaden aquí personajes con ataques y transformaciones funcionales.
 * Para añadir uno nuevo: crea un archivo como goku.ts y regístralo en esta lista.
 */
export const CHARACTERS: CharacterDef[] = [goku];

export const SAGA_NAMES: Record<Saga, string> = {
  dragonball: 'Dragon Ball',
  saiyan: 'Saga Saiyan',
  freezer: 'Saga Freezer',
  cell: 'Saga Cell',
  buu: 'Saga Majin Buu',
  gt: 'Dragon Ball GT',
  super: 'Dragon Ball Super',
  daima: 'Dragon Ball Daima',
  movies: 'Películas',
};

export function getCharacter(id: string): CharacterDef {
  const c = CHARACTERS.find((ch) => ch.id === id);
  if (!c) throw new Error(`Personaje desconocido: ${id}`);
  return c;
}

import type { CharacterDef, Saga } from '../types';
import { GOKU_VERSIONS } from './goku';

/**
 * Catálogo de personajes jugables. Solo personajes con ataques funcionales.
 * Para añadir uno: crea un archivo como goku.ts y añádelo aquí; aparecerá en las invocaciones.
 */
export const CHARACTERS: CharacterDef[] = [...GOKU_VERSIONS];

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

export const RARITY_NAMES: Record<string, string> = {
  common: 'Común',
  rare: 'Raro',
  epic: 'Épico',
  legendary: 'Legendario',
  mythic: 'Mítico',
};

export function getCharacter(id: string): CharacterDef {
  const c = CHARACTERS.find((ch) => ch.id === id);
  if (!c) throw new Error(`Personaje desconocido: ${id}`);
  return c;
}

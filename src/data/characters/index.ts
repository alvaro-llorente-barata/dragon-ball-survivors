import type { CharacterDef, Saga } from '../types';
import { GOKU_VERSIONS } from './goku';
import { ROSTER } from './roster';

/**
 * Catálogo de personajes jugables. Solo personajes con ataques funcionales.
 * Para añadir uno: usa makeChar() en roster.ts; aparecerá en el banner de su saga.
 */
export const CHARACTERS: CharacterDef[] = [...GOKU_VERSIONS, ...ROSTER];

export const SAGA_NAMES: Record<Saga, string> = {
  dragonball: 'Dragon Ball clásico',
  saiyan: 'Saga Saiyan',
  freezer: 'Saga Namek y Freezer',
  cell: 'Saga Androides y Cell',
  buu: 'Saga Majin Buu',
  gt: 'Dragon Ball GT',
  super: 'Dragon Ball Super',
  daima: 'Dragon Ball Daima',
  movies: 'Películas',
};

/** Colores y fondo de cada saga (colección y banners). */
export const SAGA_THEME: Record<Saga, { from: string; to: string; accent: string; icon: string }> = {
  dragonball: { from: '#3a6ac8', to: '#0b1a3a', accent: '#f0d040', icon: '🐒' },
  saiyan: { from: '#7a2a2a', to: '#1a0b0b', accent: '#ffb04a', icon: '🌕' },
  freezer: { from: '#2a8a6a', to: '#0b1a16', accent: '#c88aff', icon: '🪐' },
  cell: { from: '#3a7a3a', to: '#0b140b', accent: '#9aff6a', icon: '🧬' },
  buu: { from: '#c84a8a', to: '#1a0b14', accent: '#ffb0e0', icon: '🍬' },
  gt: { from: '#8a2a2a', to: '#14080b', accent: '#ff6a4a', icon: '🐉' },
  super: { from: '#5a3ab8', to: '#0b0b1a', accent: '#6ac8ff', icon: '✨' },
  daima: { from: '#8a3ab8', to: '#120b1a', accent: '#ffd84a', icon: '😈' },
  movies: { from: '#5a5a6a', to: '#0b0b10', accent: '#ffd84a', icon: '🎬' },
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

export function charactersOfSaga(saga: Saga): CharacterDef[] {
  return CHARACTERS.filter((c) => c.saga === saga);
}

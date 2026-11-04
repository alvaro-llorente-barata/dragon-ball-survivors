import type { Difficulty } from '../data/types';
import type { MetaBonuses } from './logic/stats';
import type { RunResult } from '../services/progressionService';
import type { Settings } from '../services/saveService/meta';

/** Configuración que React pasa al motor al empezar una partida. */
export interface RunConfig {
  characterId: string;
  mapId: string;
  seed: number;
  meta: MetaBonuses;
  settings: Settings;
  difficulty: Difficulty;
  /** Guarda el resultado y devuelve los mapas desbloqueados en esta partida. */
  onEnd: (result: RunResult) => string[];
}

/** Órdenes que los menús de React envían a la escena de juego. */
export interface GameCommands {
  chooseUpgrade(id: string): void;
  reroll(): void;
  closeModal(): void;
  pause(): void;
  resume(): void;
  abandon(): void;
  dodge(): void;
  ultimate(): void;
  transform(): void;
  selectSlot(i: number): void;
  /** une el hueco b dentro del a (gasta un Vínculo de Ki) */
  link(a: number, b: number): void;
  useLink(): void;
}

export const bridge: { commands: GameCommands | null } = { commands: null };

/** Estado del joystick virtual (lo escribe React, lo lee Phaser). */
export const virtualInput = { x: 0, y: 0 };

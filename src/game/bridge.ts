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
  everDefeated: string[];
  /** Guarda el resultado y devuelve los mapas desbloqueados en esta partida. */
  onEnd: (result: RunResult) => string[];
}

/** Órdenes que los menús de React envían a la escena de juego. */
export interface GameCommands {
  chooseUpgrade(id: string): void;
  closeModal(): void;
  pause(): void;
  resume(): void;
  abandon(): void;
  dodge(): void;
  ultimate(): void;
}

export const bridge: { commands: GameCommands | null } = { commands: null };

/** Estado del joystick virtual (lo escribe React, lo lee Phaser). */
export const virtualInput = { x: 0, y: 0 };

import Phaser from 'phaser';
import type { RunConfig } from './bridge';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';

/** Crea la instancia de Phaser dentro del elemento indicado. El motor queda separado de React. */
export function createGame(parent: HTMLElement, cfg: RunConfig): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#0b0f1a',
    pixelArt: true,
    roundPixels: true,
    scale: { mode: Phaser.Scale.RESIZE, width: parent.clientWidth || 800, height: parent.clientHeight || 600 },
    physics: { default: 'arcade', arcade: { debug: false, gravity: { x: 0, y: 0 } } },
    input: { activePointers: 3 },
    scene: [BootScene, GameScene],
    callbacks: {
      preBoot: (game) => {
        game.registry.set('runConfig', cfg);
      },
    },
  });
}

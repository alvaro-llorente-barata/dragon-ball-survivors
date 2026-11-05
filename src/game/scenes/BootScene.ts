import Phaser from 'phaser';
import { SPRITE_OVERRIDES } from '../../assets/manifest';
import { sheetLoadList } from '../../assets/realSheets';
import { BOSSES } from '../../data/bosses';
import { getCharacter } from '../../data/characters';
import { ENEMIES } from '../../data/enemies';
import { getMap } from '../../data/maps';
import { FRAME_H, FRAME_W, mergeSpec } from '../art/chibi';
import { characterTexture, generateCommonTextures, generateMapTextures } from '../art/textures';
import type { RunConfig } from '../bridge';

/** Carga (opcional) de sprites sustitutos y generación del arte procedural. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload(): void {
    for (const [key, url] of Object.entries(SPRITE_OVERRIDES)) {
      this.load.spritesheet(key, url, { frameWidth: FRAME_W, frameHeight: FRAME_H });
    }
    // Hojas reales de vista lateral (4 fotogramas) para los personajes con arte.
    for (const { key, sheet } of sheetLoadList()) {
      this.load.spritesheet(key, sheet.url, { frameWidth: sheet.frameW, frameHeight: sheet.frameH });
    }
  }

  create(): void {
    const cfg = this.registry.get('runConfig') as RunConfig;
    const char = getCharacter(cfg.characterId);
    const map = getMap(cfg.mapId);
    generateCommonTextures(this);
    generateMapTextures(this, map);
    characterTexture(this, `char_${char.id}`, char.sprite);
    // Sprites de las transformaciones en partida (acumulan cambios de la forma anterior).
    let spec = char.sprite;
    for (const f of char.transformations ?? []) {
      spec = mergeSpec(spec, f.sprite);
      if (f.sprite) characterTexture(this, `char_${char.id}_${f.id}`, spec);
    }
    for (const e of Object.values(ENEMIES)) characterTexture(this, `enemy_${e.id}`, e.sprite);
    for (const b of Object.values(BOSSES)) {
      let spec = b.sprite;
      b.phases.forEach((ph, i) => {
        spec = mergeSpec(spec, ph.sprite);
        characterTexture(this, `boss_${b.id}_${i}`, spec);
      });
    }
    this.scene.start('game');
  }
}

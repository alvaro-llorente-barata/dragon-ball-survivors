import Phaser from 'phaser';
import type { MapDef } from '../../data/maps';
import { DEPTH } from '../constants';
import { BLOCKING_TILES, TILE, type GeneratedMap, type ObstacleType } from '../logic/mapgen';

export interface Destructible {
  zone: Phaser.GameObjects.Zone;
  img: Phaser.GameObjects.Image;
  hp: number;
  alive: boolean;
}

/** Tamaño de colisión (ancho, alto) y textura de cada obstáculo. */
const SHAPES: Record<ObstacleType, { w: number; h: number; tex: (m: MapDef) => string; scale: number }> = {
  tree: { w: 18, h: 14, tex: (m) => `tree_${m.id}`, scale: 1 },
  rock: { w: 28, h: 16, tex: (m) => `rock_${m.id}`, scale: 1 },
  boulder: { w: 26, h: 18, tex: (m) => `boulder_${m.id}`, scale: 1 },
  mountain: { w: 92, h: 50, tex: (m) => `mountain_${m.id}`, scale: 1 },
  house: { w: 70, h: 30, tex: (m) => `house_${m.id}`, scale: 1 },
  tent: { w: 48, h: 22, tex: () => 'tent', scale: 1 },
  pillar: { w: 22, h: 14, tex: () => 'pillar', scale: 1 },
  crate: { w: 24, h: 18, tex: () => 'crate', scale: 1 },
};

/** Construye el tilemap, los obstáculos con colisión y los elementos destructibles. */
export class WorldBuilder {
  readonly layer: Phaser.Tilemaps.TilemapLayer;
  readonly obstacles: Phaser.Physics.Arcade.StaticGroup;
  readonly destructibleGroup: Phaser.Physics.Arcade.StaticGroup;
  readonly destructibles: Destructible[] = [];
  readonly worldSize: number;

  constructor(
    private scene: Phaser.Scene,
    map: MapDef,
    gen: GeneratedMap,
    tilesKey: string,
  ) {
    this.worldSize = gen.width * TILE;
    const tilemap = scene.make.tilemap({ data: gen.tiles, tileWidth: TILE, tileHeight: TILE });
    const tileset = tilemap.addTilesetImage(tilesKey, tilesKey, TILE, TILE, 0, 0);
    if (!tileset) throw new Error('No se pudo crear el tileset');
    const layer = tilemap.createLayer(0, tileset, 0, 0);
    if (!layer) throw new Error('No se pudo crear la capa del mapa');
    layer.setDepth(DEPTH.ground);
    layer.setCollision([...BLOCKING_TILES]);
    this.layer = layer;

    this.obstacles = scene.physics.add.staticGroup();
    this.destructibleGroup = scene.physics.add.staticGroup();

    for (const o of gen.obstacles) {
      const shape = SHAPES[o.type];
      const bottom = o.y + TILE / 2;
      const img = scene.add.image(o.x, bottom, shape.tex(map)).setOrigin(0.5, 1).setDepth(DEPTH.entity + bottom);
      const zone = scene.add.zone(o.x, bottom - shape.h / 2 - 2, shape.w, shape.h);
      scene.physics.add.existing(zone, true);
      if (o.type === 'boulder' || o.type === 'crate') {
        this.destructibleGroup.add(zone);
        const d: Destructible = { zone, img, hp: o.type === 'boulder' ? 40 : 20, alive: true };
        zone.setData('destructible', d);
        this.destructibles.push(d);
      } else {
        this.obstacles.add(zone);
      }
    }
  }

  /** ¿Está bloqueado este punto del mundo (agua, acantilado u obstáculo)? */
  isBlocked(x: number, y: number): boolean {
    if (x < TILE * 2 || y < TILE * 2 || x > this.worldSize - TILE * 2 || y > this.worldSize - TILE * 2) return true;
    const tile = this.layer.getTileAtWorldXY(x, y);
    if (tile && tile.collides) return true;
    const bodies = this.scene.physics.overlapRect(x - 10, y - 8, 20, 16, false, true);
    return bodies.length > 0;
  }
}

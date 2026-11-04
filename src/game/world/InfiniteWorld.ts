import Phaser from 'phaser';
import type { MapDef } from '../../data/maps';
import { DEPTH } from '../constants';
import {
  BLOCKING_TILES,
  CHUNK,
  CHUNK_PX,
  TILE,
  chunkKey,
  generateChunk,
  isBlockingTile,
  type ChunkData,
  type ObstacleType,
} from '../logic/chunkgen';
import type { GameScene } from '../scenes/GameScene';

export interface Destructible {
  id: string;
  zone: Phaser.GameObjects.Zone;
  img: Phaser.GameObjects.Image;
  hp: number;
  alive: boolean;
}

interface LoadedChunk {
  data: ChunkData;
  map: Phaser.Tilemaps.Tilemap;
  collider: Phaser.Physics.Arcade.Collider;
  objects: Phaser.GameObjects.GameObject[];
}

const SHAPES: Record<ObstacleType, { w: number; h: number; tex: (m: MapDef) => string }> = {
  tree: { w: 18, h: 14, tex: (m) => `tree_${m.id}` },
  rock: { w: 28, h: 16, tex: (m) => `rock_${m.id}` },
  boulder: { w: 26, h: 18, tex: (m) => `boulder_${m.id}` },
  mountain: { w: 92, h: 50, tex: (m) => `mountain_${m.id}` },
  house: { w: 70, h: 30, tex: (m) => `house_${m.id}` },
  tent: { w: 48, h: 22, tex: () => 'tent' },
  pillar: { w: 22, h: 14, tex: () => 'pillar' },
  crate: { w: 24, h: 18, tex: () => 'crate' },
};

/** Distancia (en trozos) a la que se carga y descarga el mundo alrededor del jugador. */
const LOAD_RADIUS = 2;
const UNLOAD_RADIUS = 3;

/**
 * Mundo infinito por trozos: se generan al acercarse y se liberan al alejarse.
 * Lo que el jugador consume (cofres, cápsulas, rocas rotas) se recuerda para que no vuelva a aparecer.
 */
export class InfiniteWorld {
  readonly obstacles: Phaser.Physics.Arcade.StaticGroup;
  readonly destructibleGroup: Phaser.Physics.Arcade.StaticGroup;
  destructibles: Destructible[] = [];
  readonly consumed = new Set<string>();
  private chunks = new Map<string, LoadedChunk>();
  private lastCx = Number.NaN;
  private lastCy = Number.NaN;

  constructor(
    private scene: GameScene,
    private def: MapDef,
    readonly seed: number,
    private tilesKey: string,
  ) {
    this.obstacles = scene.physics.add.staticGroup();
    this.destructibleGroup = scene.physics.add.staticGroup();
  }

  update(px: number, py: number): void {
    const cx = Math.floor(px / CHUNK_PX);
    const cy = Math.floor(py / CHUNK_PX);
    if (cx === this.lastCx && cy === this.lastCy) return;
    this.lastCx = cx;
    this.lastCy = cy;
    for (let y = cy - LOAD_RADIUS; y <= cy + LOAD_RADIUS; y++)
      for (let x = cx - LOAD_RADIUS; x <= cx + LOAD_RADIUS; x++) if (!this.chunks.has(chunkKey(x, y))) this.load(x, y);
    for (const [key, ch] of this.chunks) {
      if (Math.abs(ch.data.cx - cx) > UNLOAD_RADIUS || Math.abs(ch.data.cy - cy) > UNLOAD_RADIUS) this.unload(key);
    }
  }

  loadedCount(): number {
    return this.chunks.size;
  }

  private load(cx: number, cy: number): void {
    const scene = this.scene;
    const data = generateChunk(this.def, this.seed, cx, cy);
    const map = scene.make.tilemap({ data: data.tiles, tileWidth: TILE, tileHeight: TILE });
    const tileset = map.addTilesetImage(this.tilesKey, this.tilesKey, TILE, TILE, 0, 0);
    if (!tileset) throw new Error('No se pudo crear el tileset');
    const layer = map.createLayer(0, tileset, cx * CHUNK_PX, cy * CHUNK_PX);
    if (!layer) throw new Error('No se pudo crear la capa');
    layer.setDepth(DEPTH.ground);
    layer.setCollision([...BLOCKING_TILES]);
    const collider = scene.physics.add.collider(scene.player.sprite, layer);
    const objects: Phaser.GameObjects.GameObject[] = [];

    for (const o of data.obstacles) {
      const destructible = o.type === 'boulder' || o.type === 'crate';
      if (destructible && this.consumed.has(o.id)) continue;
      const shape = SHAPES[o.type];
      const bottom = o.y + TILE / 2;
      const img = scene.add.image(o.x, bottom, shape.tex(this.def)).setOrigin(0.5, 1).setDepth(DEPTH.entity + bottom);
      const zone = scene.add.zone(o.x, bottom - shape.h / 2 - 2, shape.w, shape.h);
      scene.physics.add.existing(zone, true);
      objects.push(img, zone);
      if (destructible) {
        this.destructibleGroup.add(zone);
        const d: Destructible = { id: o.id, zone, img, hp: o.type === 'boulder' ? 40 : 20, alive: true };
        zone.setData('destructible', d);
        this.destructibles.push(d);
      } else {
        this.obstacles.add(zone);
      }
    }
    this.chunks.set(data.key, { data, map, collider, objects });
    scene.loot.loadChunk(data, this.consumed);
  }

  private unload(key: string): void {
    const ch = this.chunks.get(key);
    if (!ch) return;
    this.chunks.delete(key);
    this.scene.physics.world.removeCollider(ch.collider);
    for (const o of ch.objects) {
      if (o.active) {
        const z = o as Phaser.GameObjects.Zone;
        if (this.obstacles.contains(z)) this.obstacles.remove(z);
        if (this.destructibleGroup.contains(z)) this.destructibleGroup.remove(z);
        o.destroy();
      }
    }
    this.destructibles = this.destructibles.filter((d) => d.zone.active);
    ch.map.destroy();
    this.scene.loot.unloadChunk(key);
  }

  breakDestructible(d: Destructible): void {
    d.alive = false;
    this.consumed.add(d.id);
    if (this.destructibleGroup.contains(d.zone)) this.destructibleGroup.remove(d.zone);
    d.zone.destroy();
    this.scene.tweens.killTweensOf(d.img);
    d.img.destroy();
    this.destructibles = this.destructibles.filter((x) => x !== d);
  }

  /** ¿Bloqueado por agua, acantilado u obstáculo? */
  isBlocked(x: number, y: number): boolean {
    const tx = Math.floor(x / TILE);
    const ty = Math.floor(y / TILE);
    const ch = this.chunks.get(chunkKey(Math.floor(tx / CHUNK), Math.floor(ty / CHUNK)));
    const blocked = ch
      ? BLOCKING_TILES.includes(ch.data.tiles[ty - ch.data.cy * CHUNK][tx - ch.data.cx * CHUNK])
      : isBlockingTile(this.def, this.seed, tx, ty);
    if (blocked) return true;
    return this.scene.physics.overlapRect(x - 10, y - 8, 20, 16, false, true).length > 0;
  }
}

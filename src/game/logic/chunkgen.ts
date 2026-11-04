import type { MapDef } from '../../data/maps';
import { ITEMS } from '../../data/items';
import type { CapsuleKind, ChestRarity, ItemKind } from '../../data/types';
import { rollCapsuleKind } from './loot';
import { hashString, mulberry32, randInt, weightedPick } from './rng';

/**
 * Mundo infinito: el terreno es una función pura de (semilla, x, y) y el contenido
 * se genera por trozos (chunks) de CHUNK x CHUNK tiles, siempre igual para la misma semilla.
 */
export const TILE = 32;
export const CHUNK = 32;
export const CHUNK_PX = CHUNK * TILE;
/** tile donde empieza el jugador */
export const SPAWN_TILE = { x: CHUNK / 2, y: CHUNK / 2 };

export const T = {
  GRASS: 0,
  GRASS2: 1,
  FLOWERS: 2,
  PATH: 3,
  SAND: 4,
  WATER: 5,
  STONE: 6,
  FOREST: 7,
  BRIDGE: 8,
  CLIFF: 9,
  DIRT: 10,
} as const;
export const TILE_COUNT = 11;
export const BLOCKING_TILES: readonly number[] = [T.WATER, T.CLIFF];

export type ObstacleType = 'tree' | 'rock' | 'mountain' | 'house' | 'tent' | 'pillar' | 'boulder' | 'crate';
export type PoiType = 'ruins' | 'camp' | 'altar' | 'village' | 'secret';

export interface ObstacleSpec {
  id: string;
  type: ObstacleType;
  x: number;
  y: number;
}
export interface PoiSpec {
  id: string;
  type: PoiType;
  name: string;
  x: number;
  y: number;
}
export interface ChestSpawn {
  id: string;
  x: number;
  y: number;
  rarity: ChestRarity;
  hidden: boolean;
}
export interface ChunkData {
  cx: number;
  cy: number;
  key: string;
  tiles: number[][];
  obstacles: ObstacleSpec[];
  pois: PoiSpec[];
  chests: ChestSpawn[];
  capsules: { id: string; x: number; y: number; kind: CapsuleKind }[];
  items: { id: string; x: number; y: number; kind: ItemKind }[];
}

const POI_NAMES: Record<PoiType, string> = {
  ruins: 'Ruinas antiguas',
  camp: 'Campamento de la Patrulla Roja',
  altar: 'Altar de entrenamiento',
  village: 'Aldea',
  secret: 'Claro oculto',
};

export const chunkKey = (cx: number, cy: number) => `${cx},${cy}`;

function hash3(seed: number, x: number, y: number): number {
  let h = (seed ^ Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function noise(seed: number, x: number, y: number, cell: number): number {
  const fx = x / cell;
  const fy = y / cell;
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const s = (t: number) => t * t * (3 - 2 * t);
  const tx = s(fx - x0);
  const ty = s(fy - y0);
  const a = hash3(seed, x0, y0) * (1 - tx) + hash3(seed, x0 + 1, y0) * tx;
  const b = hash3(seed, x0, y0 + 1) * (1 - tx) + hash3(seed, x0 + 1, y0 + 1) * tx;
  return a * (1 - ty) + b * ty;
}

export function worldSeed(def: MapDef, seed: number): number {
  return (seed ^ hashString(def.id)) >>> 0;
}

/** Tile base del terreno en coordenadas de tile globales (sin estructuras). */
export function terrainAt(def: MapDef, seed: number, tx: number, ty: number): number {
  const d = Math.hypot(tx - SPAWN_TILE.x, ty - SPAWN_TILE.y);
  const v = hash3(seed + 4, tx, ty);
  const grass = v < 0.22 ? T.GRASS2 : def.flowers && v < 0.26 ? T.FLOWERS : T.GRASS;
  if (d < 7) return grass;
  const e = noise(seed, tx, ty, 22) * 0.7 + noise(seed + 1, tx, ty, 9) * 0.3;
  const m = noise(seed + 2, tx, ty, 16);
  const road = Math.abs(noise(seed + 3, tx, ty, 38) - 0.5) < 0.018;
  if (e < def.waterLevel) return road ? T.BRIDGE : T.WATER;
  if (road) return T.PATH;
  if (e < def.waterLevel + 0.045) return T.SAND;
  if (m > def.forestLevel) return T.FOREST;
  return grass;
}

export function isBlockingTile(def: MapDef, seed: number, tx: number, ty: number): boolean {
  return BLOCKING_TILES.includes(terrainAt(def, seed, tx, ty));
}

export function generateChunk(def: MapDef, seed: number, cx: number, cy: number): ChunkData {
  const key = chunkKey(cx, cy);
  const rng = mulberry32(hash3(seed + 99, cx, cy) * 4294967296);
  const ox = cx * CHUNK;
  const oy = cy * CHUNK;
  const tiles: number[][] = [];
  const occ = new Uint8Array(CHUNK * CHUNK);
  const idx = (x: number, y: number) => y * CHUNK + x;
  for (let y = 0; y < CHUNK; y++) {
    const row: number[] = [];
    for (let x = 0; x < CHUNK; x++) {
      const t = terrainAt(def, seed, ox + x, oy + y);
      row.push(t);
      if (BLOCKING_TILES.includes(t) || t === T.PATH || t === T.BRIDGE) occ[idx(x, y)] = 1;
      if (Math.hypot(ox + x - SPAWN_TILE.x, oy + y - SPAWN_TILE.y) < 6) occ[idx(x, y)] = 1;
    }
    tiles.push(row);
  }
  const px = (lx: number) => (ox + lx) * TILE + TILE / 2;
  const py = (ly: number) => (oy + ly) * TILE + TILE / 2;
  const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < CHUNK && y < CHUNK;
  const setArea = (x0: number, y0: number, r: number, t: number) => {
    for (let y = y0 - r; y <= y0 + r; y++)
      for (let x = x0 - r; x <= x0 + r; x++)
        if (inside(x, y)) {
          tiles[y][x] = t;
          occ[idx(x, y)] = 1;
        }
  };
  const obstacles: ObstacleSpec[] = [];
  const chests: ChestSpawn[] = [];
  const pois: PoiSpec[] = [];
  let n = 0;
  const addObstacle = (type: ObstacleType, x: number, y: number) => {
    if (inside(x, y)) obstacles.push({ id: `${key}:o${n++}`, type, x: px(x), y: py(y) });
  };
  const addChest = (x: number, y: number, rarity: ChestRarity, hidden: boolean) =>
    chests.push({ id: `${key}:c${n++}`, x: px(x), y: py(y), rarity, hidden });

  // Punto de interés (no en el trozo inicial)
  const isSpawnChunk = cx === 0 && cy === 0;
  if (!isSpawnChunk && rng() < 0.24) {
    const type = weightedPick(
      [
        { t: 'ruins' as const, w: 3 },
        { t: 'camp' as const, w: 3 },
        { t: 'altar' as const, w: 2 },
        { t: 'village' as const, w: 1 },
        { t: 'secret' as const, w: 2 },
      ],
      (e) => e.w,
      rng,
    ).t;
    const x = randInt(rng, 11, CHUNK - 12);
    const y = randInt(rng, 11, CHUNK - 12);
    pois.push({ id: `${key}:p`, type, name: POI_NAMES[type], x: px(x), y: py(y) });
    switch (type) {
      case 'ruins':
        setArea(x, y, 5, T.GRASS);
        setArea(x, y, 4, T.STONE);
        for (const [dx, dy] of [[-4, -4], [4, -4], [-4, 4], [4, 4], [0, -4], [-4, 0], [4, 0]]) addObstacle('pillar', x + dx, y + dy);
        addChest(x, y, rng() < 0.3 ? 'legendary' : 'epic', false);
        break;
      case 'camp':
        setArea(x, y, 4, T.GRASS);
        setArea(x, y, 3, T.DIRT);
        addObstacle('tent', x - 2, y - 2);
        addObstacle('tent', x + 2, y - 2);
        addObstacle('tent', x - 2, y + 2);
        addObstacle('crate', x + 3, y + 1);
        addObstacle('crate', x + 1, y + 3);
        addChest(x + 2, y + 2, 'rare', false);
        break;
      case 'altar':
        setArea(x, y, 2, T.GRASS);
        setArea(x, y, 1, T.STONE);
        break;
      case 'village':
        setArea(x, y, 6, T.GRASS);
        for (let k = -6; k <= 6; k++) {
          tiles[y][x + k] = T.PATH;
          tiles[y + k][x] = T.PATH;
        }
        addObstacle('house', x - 3, y - 3);
        addObstacle('house', x + 3, y - 3);
        addObstacle('house', x - 3, y + 3);
        addObstacle('house', x + 3, y + 3);
        addChest(x + 1, y + 1, 'common', false);
        break;
      case 'secret':
        setArea(x, y, 4, T.FOREST);
        setArea(x, y, 1, T.FLOWERS);
        for (let dy = -3; dy <= 3; dy++)
          for (let dx = -3; dx <= 3; dx++)
            if (Math.max(Math.abs(dx), Math.abs(dy)) === 3 && !(dx === 0 && dy === 3)) addObstacle('tree', x + dx, y + dy);
        addChest(x, y, rng() < 0.4 ? 'legendary' : 'epic', true);
        break;
    }
  }

  const free = (x: number, y: number, r: number) => {
    for (let yy = y - r; yy <= y + r; yy++)
      for (let xx = x - r; xx <= x + r; xx++) if (!inside(xx, yy) || occ[idx(xx, yy)]) return false;
    return true;
  };

  // Montañas
  if (rng() < def.mountains / 25) {
    const x = randInt(rng, 2, CHUNK - 3);
    const y = randInt(rng, 2, CHUNK - 3);
    if (free(x, y, 1)) {
      addObstacle('mountain', x, y + 1);
      for (let yy = y - 1; yy <= y + 1; yy++) for (let xx = x - 1; xx <= x + 1; xx++) occ[idx(xx, yy)] = 1;
    }
  }

  // Árboles y rocas
  for (let y = 0; y < CHUNK; y++)
    for (let x = 0; x < CHUNK; x++) {
      if (occ[idx(x, y)]) continue;
      const t = tiles[y][x];
      const r = rng();
      let type: ObstacleType | null = null;
      if (t === T.FOREST) type = r < def.forestTreeDensity ? 'tree' : null;
      else if (t === T.GRASS || t === T.GRASS2 || t === T.FLOWERS || t === T.SAND) {
        if (r < def.treeDensity) type = 'tree';
        else if (r < def.treeDensity + def.rockDensity) type = 'rock';
        else if (r < def.treeDensity + def.rockDensity + def.boulderDensity) type = 'boulder';
      }
      if (type) {
        addObstacle(type, x, y);
        occ[idx(x, y)] = 1;
      }
    }

  const spot = (): { x: number; y: number } | null => {
    for (let i = 0; i < 40; i++) {
      const x = randInt(rng, 1, CHUNK - 2);
      const y = randInt(rng, 1, CHUNK - 2);
      if (occ[idx(x, y)]) continue;
      occ[idx(x, y)] = 1;
      return { x, y };
    }
    return null;
  };

  if (!isSpawnChunk && rng() < 0.45) {
    const s = spot();
    if (s) addChest(s.x, s.y, rng() < 0.72 ? 'common' : 'rare', false);
  }
  const capsules: ChunkData['capsules'] = [];
  const nCaps = randInt(rng, 1, 3);
  for (let i = 0; i < nCaps; i++) {
    const s = spot();
    if (s) capsules.push({ id: `${key}:k${n++}`, x: px(s.x), y: py(s.y), kind: rollCapsuleKind(rng) });
  }
  const items: ChunkData['items'] = [];
  if (rng() < 0.9) {
    const s = spot();
    if (s) items.push({ id: `${key}:i${n++}`, x: px(s.x), y: py(s.y), kind: weightedPick(Object.values(ITEMS), (it) => it.weight, rng).kind });
  }

  return { cx, cy, key, tiles, obstacles, pois, chests, capsules, items };
}

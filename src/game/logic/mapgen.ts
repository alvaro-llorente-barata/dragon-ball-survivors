import type { MapDef } from '../../data/maps';
import type { CapsuleKind, ChestRarity, ItemKind } from '../../data/types';
import { ITEMS } from '../../data/items';
import { hashString, mulberry32, randInt, weightedPick, type Rng } from './rng';
import { rollCapsuleKind } from './loot';

export const TILE = 32;
export const MAP_TILES = 160;

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
  type: ObstacleType;
  /** centro del tile base, en píxeles */
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
  x: number;
  y: number;
  rarity: ChestRarity;
  hidden: boolean;
}

export interface GeneratedMap {
  width: number;
  height: number;
  tiles: number[][];
  obstacles: ObstacleSpec[];
  pois: PoiSpec[];
  chests: ChestSpawn[];
  capsules: { x: number; y: number; kind: CapsuleKind }[];
  items: { x: number; y: number; kind: ItemKind }[];
  spawn: { x: number; y: number };
}

const POI_NAMES: Record<PoiType, string> = {
  ruins: 'Ruinas antiguas',
  camp: 'Campamento de la Patrulla Roja',
  altar: 'Altar de entrenamiento',
  village: 'Aldea',
  secret: 'Claro oculto',
};

/** Ruido de valor suave en [0, 1]. */
function makeNoise(rng: Rng, size: number, cell: number): (x: number, y: number) => number {
  const n = Math.ceil(size / cell) + 2;
  const grid: number[] = [];
  for (let i = 0; i < n * n; i++) grid.push(rng());
  const at = (gx: number, gy: number) => grid[gy * n + gx];
  const smooth = (t: number) => t * t * (3 - 2 * t);
  return (x, y) => {
    const fx = x / cell;
    const fy = y / cell;
    const x0 = Math.floor(fx);
    const y0 = Math.floor(fy);
    const tx = smooth(fx - x0);
    const ty = smooth(fy - y0);
    const a = at(x0, y0) * (1 - tx) + at(x0 + 1, y0) * tx;
    const b = at(x0, y0 + 1) * (1 - tx) + at(x0 + 1, y0 + 1) * tx;
    return a * (1 - ty) + b * ty;
  };
}

export function generateMap(def: MapDef, seed: number): GeneratedMap {
  const rng = mulberry32(seed ^ hashString(def.id));
  const W = MAP_TILES;
  const H = MAP_TILES;
  const cx = Math.floor(W / 2);
  const cy = Math.floor(H / 2);
  const n1 = makeNoise(rng, W, 22);
  const n2 = makeNoise(rng, W, 9);
  const m1 = makeNoise(rng, W, 16);

  const tiles: number[][] = [];
  const occ = new Uint8Array(W * H); // 1 = ocupado / no se puede colocar nada
  const idx = (x: number, y: number) => y * W + x;
  const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H;

  for (let y = 0; y < H; y++) {
    const row: number[] = [];
    for (let x = 0; x < W; x++) {
      const dc = Math.hypot(x - cx, y - cy);
      const e = n1(x, y) * 0.7 + n2(x, y) * 0.3;
      const m = m1(x, y);
      let t: number;
      if (x < 2 || y < 2 || x >= W - 2 || y >= H - 2) t = T.CLIFF;
      else if (e < def.waterLevel && dc > 10) t = T.WATER;
      else if (e < def.waterLevel + 0.045 && dc > 8) t = T.SAND;
      else if (m > def.forestLevel && dc > 9) t = T.FOREST;
      else {
        const r = rng();
        t = r < 0.22 ? T.GRASS2 : def.flowers && r < 0.26 ? T.FLOWERS : T.GRASS;
      }
      row.push(t);
      if (BLOCKING_TILES.includes(t)) occ[idx(x, y)] = 1;
    }
    tiles.push(row);
  }

  const reserve = (x0: number, y0: number, r: number) => {
    for (let y = y0 - r; y <= y0 + r; y++)
      for (let x = x0 - r; x <= x0 + r; x++) if (inside(x, y)) occ[idx(x, y)] = 1;
  };
  const areaFree = (x0: number, y0: number, r: number) => {
    for (let y = y0 - r; y <= y0 + r; y++)
      for (let x = x0 - r; x <= x0 + r; x++) {
        if (!inside(x, y) || x < 3 || y < 3 || x >= W - 3 || y >= H - 3) return false;
        if (occ[idx(x, y)]) return false;
      }
    return true;
  };
  const setArea = (x0: number, y0: number, r: number, t: number) => {
    for (let y = y0 - r; y <= y0 + r; y++) for (let x = x0 - r; x <= x0 + r; x++) if (inside(x, y)) tiles[y][x] = t;
  };
  const px = (t: number) => t * TILE + TILE / 2;

  // Zona inicial despejada.
  for (let y = cy - 6; y <= cy + 6; y++)
    for (let x = cx - 6; x <= cx + 6; x++) {
      if (BLOCKING_TILES.includes(tiles[y][x]) || tiles[y][x] === T.FOREST) tiles[y][x] = T.GRASS;
    }
  reserve(cx, cy, 6);

  const obstacles: ObstacleSpec[] = [];
  const chests: ChestSpawn[] = [];
  const pois: PoiSpec[] = [];
  const addObstacle = (type: ObstacleType, tx: number, ty: number) => obstacles.push({ type, x: px(tx), y: px(ty) });

  // Puntos de interés.
  const placed: { x: number; y: number }[] = [];
  const pickPoiSpot = (r: number, minCenter: number): { x: number; y: number } | null => {
    for (let i = 0; i < 400; i++) {
      const x = randInt(rng, 6, W - 7);
      const y = randInt(rng, 6, H - 7);
      if (Math.hypot(x - cx, y - cy) < minCenter) continue;
      if (placed.some((p) => Math.hypot(p.x - x, p.y - y) < 20)) continue;
      // Se permite colocar sobre bosque y agua (se despejan), pero no sobre otro POI.
      let ok = true;
      for (let yy = y - r; yy <= y + r && ok; yy++)
        for (let xx = x - r; xx <= x + r; xx++) {
          if (!inside(xx, yy) || tiles[yy][xx] === T.CLIFF || tiles[yy][xx] === T.STONE || tiles[yy][xx] === T.DIRT) {
            ok = false;
            break;
          }
        }
      if (!ok) continue;
      placed.push({ x, y });
      return { x, y };
    }
    return null;
  };
  const clearArea = (x0: number, y0: number, r: number, t: number) => {
    setArea(x0, y0, r, t);
    for (let y = y0 - r; y <= y0 + r; y++) for (let x = x0 - r; x <= x0 + r; x++) if (inside(x, y)) occ[idx(x, y)] = 0;
  };

  const poiPlan: { type: PoiType; count: number }[] = [
    { type: 'village', count: 1 },
    { type: 'ruins', count: 2 },
    { type: 'camp', count: 2 },
    { type: 'altar', count: 2 },
    { type: 'secret', count: 2 },
  ];
  let poiId = 0;
  for (const plan of poiPlan) {
    for (let i = 0; i < plan.count; i++) {
      const radius = plan.type === 'village' ? 6 : plan.type === 'ruins' ? 5 : plan.type === 'altar' ? 2 : 4;
      const spot = pickPoiSpot(radius + 1, plan.type === 'altar' ? 16 : 24);
      if (!spot) continue;
      const { x, y } = spot;
      const id = `${plan.type}_${poiId++}`;
      pois.push({ id, type: plan.type, name: POI_NAMES[plan.type], x: px(x), y: px(y) });
      switch (plan.type) {
        case 'ruins': {
          clearArea(x, y, 5, T.GRASS);
          setArea(x, y, 4, T.STONE);
          const pillars: [number, number][] = [
            [-4, -4], [4, -4], [-4, 4], [4, 4], [0, -4], [-4, 0], [4, 0],
          ];
          for (const [dx, dy] of pillars) addObstacle('pillar', x + dx, y + dy);
          chests.push({ x: px(x), y: px(y), rarity: rng() < 0.3 ? 'legendary' : 'epic', hidden: false });
          reserve(x, y, 5);
          break;
        }
        case 'camp': {
          clearArea(x, y, 4, T.GRASS);
          setArea(x, y, 3, T.DIRT);
          addObstacle('tent', x - 2, y - 2);
          addObstacle('tent', x + 2, y - 2);
          addObstacle('tent', x - 2, y + 2);
          addObstacle('crate', x + 3, y + 1);
          addObstacle('crate', x + 1, y + 3);
          chests.push({ x: px(x + 2), y: px(y + 2), rarity: 'rare', hidden: false });
          reserve(x, y, 4);
          break;
        }
        case 'altar': {
          clearArea(x, y, 2, T.GRASS);
          setArea(x, y, 1, T.STONE);
          reserve(x, y, 2);
          break;
        }
        case 'village': {
          clearArea(x, y, 6, T.GRASS);
          for (let k = -6; k <= 6; k++) {
            tiles[y][x + k] = T.PATH;
            tiles[y + k][x] = T.PATH;
          }
          addObstacle('house', x - 3, y - 3);
          addObstacle('house', x + 3, y - 3);
          addObstacle('house', x - 3, y + 3);
          addObstacle('house', x + 3, y + 3);
          chests.push({ x: px(x + 1), y: px(y + 1), rarity: 'common', hidden: false });
          reserve(x, y, 6);
          break;
        }
        case 'secret': {
          clearArea(x, y, 4, T.FOREST);
          setArea(x, y, 1, T.FLOWERS);
          // Anillo de árboles con un único hueco al sur.
          for (let dy = -3; dy <= 3; dy++)
            for (let dx = -3; dx <= 3; dx++) {
              const ring = Math.max(Math.abs(dx), Math.abs(dy)) === 3;
              if (ring && !(dx === 0 && dy === 3)) addObstacle('tree', x + dx, y + dy);
            }
          chests.push({ x: px(x), y: px(y), rarity: rng() < 0.4 ? 'legendary' : 'epic', hidden: true });
          reserve(x, y, 4);
          break;
        }
      }
    }
  }

  // Caminos desde el centro hacia los POI visibles (puentes sobre el agua).
  for (const poi of pois) {
    if (poi.type === 'secret') continue;
    let x = cx;
    let y = cy;
    const tx = Math.floor(poi.x / TILE);
    const ty = Math.floor(poi.y / TILE);
    let guard = 0;
    while ((x !== tx || y !== ty) && guard++ < 1000) {
      const dx = tx - x;
      const dy = ty - y;
      if (rng() < 0.15) {
        if (rng() < 0.5) x += rng() < 0.5 ? 1 : -1;
        else y += rng() < 0.5 ? 1 : -1;
      } else if (Math.abs(dx) * rng() > Math.abs(dy) * rng()) x += Math.sign(dx);
      else y += Math.sign(dy);
      x = Math.max(2, Math.min(W - 3, x));
      y = Math.max(2, Math.min(H - 3, y));
      for (const [ox, oy] of [[0, 0], [1, 0], [0, 1]] as const) {
        const xx = x + ox;
        const yy = y + oy;
        const cur = tiles[yy][xx];
        if (cur === T.STONE || cur === T.DIRT || cur === T.CLIFF) continue;
        tiles[yy][xx] = cur === T.WATER || cur === T.BRIDGE ? T.BRIDGE : T.PATH;
        occ[idx(xx, yy)] = 1;
      }
    }
  }

  // Montañas (3x3 tiles).
  for (let i = 0, tries = 0; i < def.mountains && tries < 600; tries++) {
    const x = randInt(rng, 5, W - 6);
    const y = randInt(rng, 5, H - 6);
    if (Math.hypot(x - cx, y - cy) < 14 || !areaFree(x, y, 1)) continue;
    addObstacle('mountain', x, y + 1);
    reserve(x, y, 1);
    i++;
  }

  // Árboles, rocas y rocas destructibles.
  for (let y = 3; y < H - 3; y++) {
    for (let x = 3; x < W - 3; x++) {
      if (occ[idx(x, y)]) continue;
      const t = tiles[y][x];
      const r = rng();
      if (t === T.FOREST) {
        if (r < def.forestTreeDensity) {
          addObstacle('tree', x, y);
          occ[idx(x, y)] = 1;
        }
      } else if (t === T.GRASS || t === T.GRASS2 || t === T.FLOWERS || t === T.SAND) {
        if (r < def.treeDensity) {
          addObstacle('tree', x, y);
          occ[idx(x, y)] = 1;
        } else if (r < def.treeDensity + def.rockDensity) {
          addObstacle('rock', x, y);
          occ[idx(x, y)] = 1;
        } else if (r < def.treeDensity + def.rockDensity + def.boulderDensity) {
          addObstacle('boulder', x, y);
          occ[idx(x, y)] = 1;
        }
      }
    }
  }

  const freeSpot = (minCenter: number): { x: number; y: number } | null => {
    for (let i = 0; i < 300; i++) {
      const x = randInt(rng, 4, W - 5);
      const y = randInt(rng, 4, H - 5);
      if (occ[idx(x, y)] || Math.hypot(x - cx, y - cy) < minCenter) continue;
      const t = tiles[y][x];
      if (BLOCKING_TILES.includes(t)) continue;
      occ[idx(x, y)] = 1;
      return { x: px(x), y: px(y) };
    }
    return null;
  };

  for (let i = 0; i < 12; i++) {
    const s = freeSpot(10);
    if (s) chests.push({ ...s, rarity: rng() < 0.72 ? 'common' : 'rare', hidden: false });
  }
  const capsules: GeneratedMap['capsules'] = [];
  for (let i = 0; i < 48; i++) {
    const s = freeSpot(4);
    if (s) capsules.push({ ...s, kind: rollCapsuleKind(rng) });
  }
  const items: GeneratedMap['items'] = [];
  const itemPool = Object.values(ITEMS);
  for (let i = 0; i < 26; i++) {
    const s = freeSpot(6);
    if (s) items.push({ ...s, kind: weightedPick(itemPool, (it) => it.weight, rng).kind });
  }

  return {
    width: W,
    height: H,
    tiles,
    obstacles,
    pois,
    chests,
    capsules,
    items,
    spawn: { x: px(cx), y: px(cy) },
  };
}

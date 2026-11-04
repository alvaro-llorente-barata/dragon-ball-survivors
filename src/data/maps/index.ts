export interface MapPalette {
  grass: string;
  grass2: string;
  flowers: string;
  path: string;
  sand: string;
  water: string;
  waterLight: string;
  stone: string;
  forest: string;
  cliff: string;
  dirt: string;
  treeLeaf: string;
  treeLeafDark: string;
  trunk: string;
  rock: string;
  sky: string;
}

export interface EnemySpawnEntry {
  id: string;
  /** segundo desde el que aparece */
  from: number;
  weight: number;
}

export interface MapDef {
  id: string;
  name: string;
  description: string;
  unlock: { type: 'default' } | { type: 'boss'; bossId: string; label: string };
  palette: MapPalette;
  treeStyle: 'round' | 'namek' | 'cactus';
  houseStyle: 'capsule' | 'namek';
  waterLevel: number;
  forestLevel: number;
  treeDensity: number;
  forestTreeDensity: number;
  rockDensity: number;
  boulderDensity: number;
  mountains: number;
  flowers: boolean;
  enemies: EnemySpawnEntry[];
  bosses: { bossId: string; at: number }[];
}

export const MAPS: MapDef[] = [
  {
    id: 'earth',
    name: 'Montañas de la Tierra',
    description: 'Praderas, bosques, lagos y ruinas. Territorio de la Patrulla Roja y de los Saiyans recién llegados.',
    unlock: { type: 'default' },
    palette: {
      grass: '#5a9a3c',
      grass2: '#4f8c35',
      flowers: '#e8d84a',
      path: '#b89a68',
      sand: '#d8c48a',
      water: '#2f6fb8',
      waterLight: '#5a9ad8',
      stone: '#8a8a92',
      forest: '#3f7a2c',
      cliff: '#5a4a3a',
      dirt: '#8a6a44',
      treeLeaf: '#3f8a2a',
      treeLeafDark: '#2a6a1f',
      trunk: '#6a4426',
      rock: '#8a8a92',
      sky: '#0b1a12',
    },
    treeStyle: 'round',
    houseStyle: 'capsule',
    waterLevel: 0.3,
    forestLevel: 0.64,
    treeDensity: 0.012,
    forestTreeDensity: 0.26,
    rockDensity: 0.008,
    boulderDensity: 0.004,
    mountains: 14,
    flowers: true,
    enemies: [
      { id: 'saibaman', from: 0, weight: 10 },
      { id: 'red_ribbon', from: 20, weight: 5 },
      { id: 'saibaman_kamikaze', from: 60, weight: 4 },
      { id: 'freezer_soldier', from: 120, weight: 3 },
      { id: 'babidi_minion', from: 200, weight: 2 },
      { id: 'cell_jr', from: 260, weight: 4 },
      { id: 'saibaman_planter', from: 320, weight: 1 },
    ],
    bosses: [
      { bossId: 'general_blue', at: 90 },
      { bossId: 'raditz', at: 180 },
      { bossId: 'tao_pai_pai', at: 300 },
      { bossId: 'nappa', at: 420 },
      { bossId: 'vegeta', at: 600 },
    ],
  },
  {
    id: 'wasteland',
    name: 'Páramo rocoso',
    description: 'El desierto donde aterrizaron los Saiyans. Mucha roca, poca agua y enemigos agresivos.',
    unlock: { type: 'boss', bossId: 'raditz', label: 'Derrota a Raditz' },
    palette: {
      grass: '#c8a46a',
      grass2: '#bc9860',
      flowers: '#a8844a',
      path: '#9a7a50',
      sand: '#e0c890',
      water: '#3a6a9a',
      waterLight: '#6a9ac8',
      stone: '#9a8a7a',
      forest: '#b08a58',
      cliff: '#6a4a32',
      dirt: '#8a6440',
      treeLeaf: '#6a9a3a',
      treeLeafDark: '#4a7a2a',
      trunk: '#7a5a3a',
      rock: '#a8846a',
      sky: '#1a120b',
    },
    treeStyle: 'cactus',
    houseStyle: 'capsule',
    waterLevel: 0.2,
    forestLevel: 0.8,
    treeDensity: 0.008,
    forestTreeDensity: 0.05,
    rockDensity: 0.03,
    boulderDensity: 0.01,
    mountains: 24,
    flowers: false,
    enemies: [
      { id: 'saibaman', from: 0, weight: 10 },
      { id: 'saibaman_kamikaze', from: 0, weight: 6 },
      { id: 'red_ribbon', from: 40, weight: 4 },
      { id: 'saibaman_planter', from: 120, weight: 2 },
      { id: 'freezer_soldier', from: 180, weight: 3 },
      { id: 'cell_jr', from: 240, weight: 4 },
      { id: 'babidi_minion', from: 300, weight: 2 },
    ],
    bosses: [
      { bossId: 'tao_pai_pai', at: 90 },
      { bossId: 'nappa', at: 180 },
      { bossId: 'general_blue', at: 300 },
      { bossId: 'vegeta', at: 420 },
      { bossId: 'raditz', at: 600 },
    ],
  },
  {
    id: 'namek',
    name: 'Planeta Namek',
    description: 'Hierba verde azulada, mares y árboles Ajisa. El ejército de Freezer busca las Bolas de Dragón.',
    unlock: { type: 'boss', bossId: 'vegeta', label: 'Derrota a Vegeta' },
    palette: {
      grass: '#6aae7a',
      grass2: '#5fa06e',
      flowers: '#a8e0c8',
      path: '#a8b88a',
      sand: '#c8d8a0',
      water: '#2a8a8a',
      waterLight: '#5ac0b0',
      stone: '#8aa098',
      forest: '#4f9a6a',
      cliff: '#4a6a5a',
      dirt: '#7a8a5a',
      treeLeaf: '#3a9a8a',
      treeLeafDark: '#2a7a6a',
      trunk: '#7a6a4a',
      rock: '#8aa098',
      sky: '#0b1a16',
    },
    treeStyle: 'namek',
    houseStyle: 'namek',
    waterLevel: 0.36,
    forestLevel: 0.7,
    treeDensity: 0.01,
    forestTreeDensity: 0.16,
    rockDensity: 0.01,
    boulderDensity: 0.005,
    mountains: 16,
    flowers: true,
    enemies: [
      { id: 'freezer_soldier', from: 0, weight: 8 },
      { id: 'freezer_gunner', from: 0, weight: 5 },
      { id: 'saibaman', from: 0, weight: 4 },
      { id: 'saibaman_kamikaze', from: 90, weight: 3 },
      { id: 'cell_jr', from: 200, weight: 3 },
      { id: 'babidi_minion', from: 240, weight: 2 },
    ],
    bosses: [
      { bossId: 'dodoria', at: 90 },
      { bossId: 'zarbon', at: 180 },
      { bossId: 'ginyu', at: 360 },
      { bossId: 'freezer', at: 560 },
    ],
  },
];

// ---------- 2.0: oleadas por tramos, enemigos con habilidades y jefe definitivo al minuto 30 ----------
const EXTRA_ENEMIES: Record<string, EnemySpawnEntry[]> = {
  earth: [
    { id: 'saiyan_scout', from: 180, weight: 5 },
    { id: 'red_ribbon_robot', from: 240, weight: 3 },
    { id: 'frieza_elite', from: 420, weight: 3 },
    { id: 'android_unit', from: 600, weight: 3 },
    { id: 'babidi_mage', from: 900, weight: 3 },
    { id: 'majin_guardian', from: 1200, weight: 2 },
  ],
  wasteland: [
    { id: 'saiyan_scout', from: 120, weight: 6 },
    { id: 'red_ribbon_robot', from: 200, weight: 3 },
    { id: 'frieza_elite', from: 360, weight: 3 },
    { id: 'android_unit', from: 540, weight: 3 },
    { id: 'babidi_mage', from: 840, weight: 3 },
    { id: 'majin_guardian', from: 1080, weight: 3 },
  ],
  namek: [
    { id: 'frieza_elite', from: 120, weight: 5 },
    { id: 'saiyan_scout', from: 200, weight: 4 },
    { id: 'android_unit', from: 480, weight: 3 },
    { id: 'babidi_mage', from: 780, weight: 3 },
    { id: 'majin_guardian', from: 1080, weight: 3 },
  ],
};
const EXTRA_BOSSES: Record<string, { bossId: string; at: number }[]> = {
  earth: [
    { bossId: 'cell', at: 840 },
    { bossId: 'majin_buu', at: 1140 },
    { bossId: 'broly_fp', at: 1800 },
  ],
  wasteland: [
    { bossId: 'cell', at: 780 },
    { bossId: 'majin_buu', at: 1080 },
    { bossId: 'jiren_full', at: 1800 },
  ],
  namek: [
    { bossId: 'cell', at: 840 },
    { bossId: 'majin_buu', at: 1140 },
    { bossId: 'broly_fp', at: 1800 },
  ],
};
for (const m of MAPS) {
  m.enemies.push(...(EXTRA_ENEMIES[m.id] ?? []));
  m.bosses.push(...(EXTRA_BOSSES[m.id] ?? []));
}

export function getMap(id: string): MapDef {
  const m = MAPS.find((x) => x.id === id);
  if (!m) throw new Error(`Mapa desconocido: ${id}`);
  return m;
}

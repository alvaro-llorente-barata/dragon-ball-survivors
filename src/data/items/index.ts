import type { CapsuleKind, ChestRarity, ItemKind } from '../types';

export interface ItemDef {
  kind: ItemKind;
  name: string;
  description: string;
  color: number;
  /** segundos (0 = instantáneo) */
  duration: number;
  weight: number;
}

export const ITEMS: Record<ItemKind, ItemDef> = {
  senzu: { kind: 'senzu', name: 'Semilla Senzu', description: 'Recupera el 60% de la vida.', color: 0x6ac83a, duration: 0, weight: 5 },
  ki_orb: { kind: 'ki_orb', name: 'Orbe de Ki', description: 'Recupera 40 de Ki.', color: 0x4ad8ff, duration: 0, weight: 8 },
  magnet: { kind: 'magnet', name: 'Imán de experiencia', description: 'Atrae toda la experiencia del mapa.', color: 0xff4a6a, duration: 0, weight: 4 },
  power: { kind: 'power', name: 'Potenciador de ataque', description: 'Daño x1.5 durante 15 s.', color: 0xff8a2a, duration: 15, weight: 4 },
  speed: { kind: 'speed', name: 'Potenciador de velocidad', description: 'Velocidad x1.4 durante 15 s.', color: 0x4aff8a, duration: 15, weight: 4 },
  shield: { kind: 'shield', name: 'Escudo de energía', description: 'Bloquea los próximos 3 golpes.', color: 0x8ab4ff, duration: 0, weight: 3 },
  time_watch: { kind: 'time_watch', name: 'Reloj del tiempo', description: 'Congela a los enemigos 5 s.', color: 0xd8d8ff, duration: 5, weight: 2 },
  xp_mult: { kind: 'xp_mult', name: 'Multiplicador de experiencia', description: 'Experiencia x2 durante 30 s.', color: 0xc88aff, duration: 30, weight: 3 },
};

export interface CapsuleDef {
  kind: CapsuleKind;
  name: string;
  color: number;
  weight: number;
}

export const CAPSULES: Record<CapsuleKind, CapsuleDef> = {
  coins: { kind: 'coins', name: 'Cápsula de monedas', color: 0xffd84a, weight: 10 },
  xp: { kind: 'xp', name: 'Cápsula de experiencia', color: 0x4a9aff, weight: 9 },
  heal: { kind: 'heal', name: 'Cápsula de curación', color: 0x6ac83a, weight: 6 },
  ki: { kind: 'ki', name: 'Cápsula de Ki', color: 0x4ad8ff, weight: 6 },
  upgrade: { kind: 'upgrade', name: 'Cápsula de mejora', color: 0xff8a2a, weight: 3 },
  mystery: { kind: 'mystery', name: 'Cápsula misteriosa', color: 0xc84aff, weight: 4 },
};

export const CHEST_NAMES: Record<ChestRarity, string> = {
  common: 'Común',
  rare: 'Raro',
  epic: 'Épico',
  legendary: 'Legendario',
  divine: 'Divino',
};

export const CHEST_COLORS: Record<ChestRarity, number> = {
  common: 0xb08a5a,
  rare: 0x4a9aff,
  epic: 0xb45aff,
  legendary: 0xffc83a,
  divine: 0xff5ad0,
};

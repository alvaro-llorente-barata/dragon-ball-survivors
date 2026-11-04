import type { WeaponDef, WeaponLevelStats } from '../types';

const base: WeaponLevelStats = {
  damage: 10,
  cooldown: 1000,
  count: 1,
  pierce: 1,
  speed: 400,
  area: 1,
  range: 400,
  duration: 1000,
};

/** Crea los niveles de un ataque aplicando cambios acumulativos. */
function levels(first: Partial<WeaponLevelStats>, ...steps: Partial<WeaponLevelStats>[]): WeaponLevelStats[] {
  const out: WeaponLevelStats[] = [{ ...base, ...first }];
  for (const s of steps) out.push({ ...out[out.length - 1], ...s });
  return out;
}

export const WEAPONS: Record<string, WeaponDef> = {
  ki_blast: {
    id: 'ki_blast',
    name: 'Ráfaga de Ki',
    description: 'Dispara esferas de Ki al enemigo más cercano.',
    behavior: 'projectile',
    damageType: 'energy',
    color: 0x8fd8ff,
    levelNotes: ['Disparo básico', '+1 esfera', '+1 perforación', '+1 esfera, más rápido', '+1 esfera, +1 perforación'],
    levels: levels(
      { damage: 10, cooldown: 800, speed: 480, range: 460, duration: 1100 },
      { damage: 12, count: 2 },
      { damage: 14, pierce: 2 },
      { damage: 16, count: 3, cooldown: 680 },
      { damage: 20, count: 4, pierce: 3 },
    ),
  },
  rapid_punch: {
    id: 'rapid_punch',
    name: 'Golpes rápidos',
    description: 'Combo de puñetazos en arco frente a ti.',
    behavior: 'melee',
    damageType: 'physical',
    color: 0xffe2a8,
    knockback: 180,
    levelNotes: ['Combo simple', '+1 golpe', 'Más daño y alcance', '+1 golpe', 'Golpes devastadores'],
    levels: levels(
      { damage: 14, cooldown: 700, count: 1, range: 70 },
      { damage: 15, count: 2 },
      { damage: 19, area: 1.2 },
      { damage: 21, count: 3, cooldown: 560 },
      { damage: 30, area: 1.45, cooldown: 460 },
    ),
  },
  kamehameha: {
    id: 'kamehameha',
    name: 'Kamehameha',
    description: 'Carga y lanza una onda de energía que atraviesa todo.',
    behavior: 'beam',
    damageType: 'energy',
    color: 0x5ec8ff,
    levelNotes: ['Onda de energía', 'Más daño', 'Onda más ancha', 'Recarga más rápida', 'Kamehameha x10'],
    levels: levels(
      { damage: 26, cooldown: 5200, range: 540, duration: 480, area: 1 },
      { damage: 36 },
      { damage: 44, area: 1.35 },
      { damage: 52, cooldown: 4200 },
      { damage: 80, area: 1.7, cooldown: 3600, range: 680 },
    ),
  },
  kiai: {
    id: 'kiai',
    name: 'Kiai',
    description: 'Onda expansiva que daña y empuja a los enemigos cercanos.',
    behavior: 'shockwave',
    damageType: 'physical',
    color: 0xffffff,
    knockback: 380,
    levelNotes: ['Onda expansiva', 'Más radio', 'Más daño', 'Recarga más rápida', 'Onda gigante'],
    levels: levels(
      { damage: 12, cooldown: 3400, range: 130 },
      { range: 155 },
      { damage: 20 },
      { cooldown: 2600 },
      { damage: 32, range: 210, cooldown: 2200 },
    ),
  },
  dragon_fist: {
    id: 'dragon_fist',
    name: 'Puño del Dragón',
    description: 'Un dragón dorado de energía que atraviesa a todos los enemigos.',
    behavior: 'piercing',
    damageType: 'physical',
    color: 0xffc83a,
    knockback: 220,
    levelNotes: ['Dragón dorado', 'Más daño', 'Dragón más grande', 'Recarga más rápida', '+1 dragón'],
    levels: levels(
      { damage: 55, cooldown: 7000, speed: 520, range: 700, duration: 1500, area: 1.2, pierce: 999 },
      { damage: 75 },
      { area: 1.5 },
      { cooldown: 5600 },
      { damage: 110, count: 2, area: 1.7 },
    ),
  },
  ki_barrier: {
    id: 'ki_barrier',
    name: 'Esferas protectoras',
    description: 'Esferas de Ki giran a tu alrededor, golpean enemigos y bloquean disparos.',
    behavior: 'orbit',
    damageType: 'energy',
    color: 0xb48cff,
    knockback: 120,
    levelNotes: ['2 esferas', '+1 esfera', 'Más duración', '+1 esfera, más daño', '+1 esfera permanente'],
    levels: levels(
      { damage: 9, cooldown: 3000, count: 2, range: 82, duration: 4000, speed: 3.2 },
      { count: 3 },
      { duration: 6000 },
      { count: 4, damage: 13 },
      { count: 5, damage: 17, duration: 60000, cooldown: 500 },
    ),
  },
  homing_ki: {
    id: 'homing_ki',
    name: 'Ki teledirigido',
    description: 'Esferas que persiguen a los enemigos.',
    behavior: 'homing',
    damageType: 'energy',
    color: 0xff9ad8,
    levelNotes: ['1 esfera', '+1 esfera', 'Más daño', '+1 esfera', 'Más rápido y fuerte'],
    levels: levels(
      { damage: 18, cooldown: 1700, count: 1, speed: 300, range: 520, duration: 2600 },
      { count: 2 },
      { damage: 24 },
      { count: 3 },
      { damage: 32, speed: 380, cooldown: 1300 },
    ),
  },
  genkidama: {
    id: 'genkidama',
    name: 'Genkidama',
    description: 'Ataque definitivo (Q): reúne energía y la lanza en una explosión enorme.',
    behavior: 'bomb',
    damageType: 'energy',
    color: 0x9fe6ff,
    ultimate: { kiCost: 60 },
    levelNotes: ['Genkidama'],
    levels: levels({ damage: 420, cooldown: 22000, range: 270, duration: 1400, area: 1 }),
  },
};

export function getWeapon(id: string): WeaponDef {
  const w = WEAPONS[id];
  if (!w) throw new Error(`Ataque desconocido: ${id}`);
  return w;
}

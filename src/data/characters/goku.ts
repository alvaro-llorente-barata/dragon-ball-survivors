import type { CharacterDef, SpriteSpec } from '../types';

const gokuSprite: SpriteSpec = {
  skin: '#f2c49b',
  hair: '#1b1b24',
  hairStyle: 'spiky',
  gi: '#f07a1a',
  giAccent: '#2a4fb8',
  belt: '#2a4fb8',
  pants: '#f07a1a',
  boots: '#2a4fb8',
  eye: '#16161c',
};

const POOL = ['ki_blast', 'rapid_punch', 'kamehameha', 'kiai', 'dragon_fist', 'ki_barrier', 'homing_ki'];
const saiyanBlood = { id: 'saiyan_blood', name: 'Sangre Saiyan', description: 'Hasta +30% de daño cuando tienes poca vida.' } as const;

type Version = Omit<CharacterDef, 'family' | 'saga' | 'weaponPool' | 'ultimate' | 'unlock' | 'sprite' | 'dodge'> & {
  saga?: CharacterDef['saga'];
  sprite?: Partial<SpriteSpec>;
  dodge?: Partial<CharacterDef['dodge']>;
};

function version(v: Version): CharacterDef {
  return {
    family: 'goku',
    saga: 'saiyan',
    weaponPool: POOL,
    ultimate: 'genkidama',
    unlock: v.id === 'goku' ? { type: 'default' } : { type: 'summon' },
    ...v,
    sprite: { ...gokuSprite, ...v.sprite },
    dodge: { name: 'Teletransporte', distance: 150, cooldown: 2400, ...v.dodge },
  };
}

/**
 * Todas las fases de Goku. Cada una es un personaje que se consigue con tickets
 * (Goku base es el inicial). Más estrellas = más poder y menos probabilidad.
 */
export const GOKU_VERSIONS: CharacterDef[] = [
  version({
    id: 'goku',
    name: 'Goku',
    stars: 1,
    stats: { hp: 120, ki: 100, physical: 100, energy: 100, defense: 10, speed: 100 },
    startingWeapon: 'ki_blast',
    passives: [saiyanBlood],
    description: 'El Saiyan criado en la Tierra. Equilibrado: Ki a distancia y combos cuerpo a cuerpo.',
  }),
  version({
    id: 'goku_kaioken',
    name: 'Goku Kaioken',
    saga: 'saiyan',
    stars: 2,
    stats: { hp: 125, ki: 100, physical: 125, energy: 110, defense: 8, speed: 115 },
    startingWeapon: 'rapid_punch',
    passives: [saiyanBlood],
    aura: 0xff3030,
    attackMods: { projectileTint: 0xff7a6a },
    description: 'Aura roja del Kaioken. Muy rápido y fuerte cuerpo a cuerpo, pero con menos defensa.',
  }),
  version({
    id: 'goku_ssj',
    name: 'Goku Super Saiyan',
    saga: 'freezer',
    stars: 3,
    stats: { hp: 140, ki: 110, physical: 135, energy: 135, defense: 14, speed: 110 },
    startingWeapon: 'ki_blast',
    passives: [saiyanBlood],
    aura: 0xffd84a,
    sprite: { hair: '#ffe14d', eye: '#1fa58f' },
    attackMods: { pierceBonus: 1, projectileTint: 0xfff07a },
    description: 'El legendario Super Saiyan. Sus disparos atraviesan un enemigo más.',
  }),
  version({
    id: 'goku_ssj2',
    name: 'Goku Super Saiyan 2',
    saga: 'buu',
    stars: 4,
    stats: { hp: 150, ki: 115, physical: 150, energy: 150, defense: 16, speed: 115 },
    startingWeapon: 'kiai',
    passives: [saiyanBlood],
    aura: 0xfff27a,
    lightning: true,
    sprite: { hair: '#fff27a', eye: '#17c7a8' },
    attackMods: { pierceBonus: 1, projectileTint: 0xfff9b8 },
    description: 'Aura con rayos. Más poder en todo y empieza con el Kiai.',
  }),
  version({
    id: 'goku_ssj3',
    name: 'Goku Super Saiyan 3',
    saga: 'buu',
    stars: 4,
    stats: { hp: 160, ki: 130, physical: 165, energy: 160, defense: 15, speed: 108 },
    startingWeapon: 'dragon_fist',
    passives: [saiyanBlood],
    aura: 0xffc83a,
    lightning: true,
    sprite: { hair: '#ffd23a', hairStyle: 'long', eye: '#17c7a8' },
    attackMods: { pierceBonus: 2, projectileTint: 0xffe08a },
    description: 'Pelo larguísimo y un poder enorme. Empieza con el Puño del Dragón.',
  }),
  version({
    id: 'goku_god',
    name: 'Goku Super Saiyan God',
    saga: 'super',
    stars: 5,
    stats: { hp: 175, ki: 140, physical: 170, energy: 185, defense: 22, speed: 120 },
    startingWeapon: 'homing_ki',
    passives: [{ id: 'regeneration', name: 'Ki divino', description: 'Recupera el 1% de la vida por segundo.' }],
    aura: 0xff4a6a,
    sprite: { hair: '#d8264a', eye: '#d8264a' },
    attackMods: { pierceBonus: 1, extraCount: 1, projectileTint: 0xff8aa8 },
    description: 'Poder divino. Regenera vida y dispara un proyectil extra.',
  }),
  version({
    id: 'goku_blue',
    name: 'Goku Super Saiyan Blue',
    saga: 'super',
    stars: 6,
    stats: { hp: 190, ki: 160, physical: 190, energy: 210, defense: 24, speed: 122 },
    startingWeapon: 'kamehameha',
    passives: [saiyanBlood],
    aura: 0x4ac8ff,
    sprite: { hair: '#3ab0ff', eye: '#3ab0ff' },
    attackMods: { pierceBonus: 2, extraCount: 1, projectileTint: 0x9fe6ff },
    description: 'Ki divino con poder Saiyan. Empieza con el Kamehameha.',
  }),
  version({
    id: 'goku_ui_sign',
    name: 'Goku Ultra Instinto Señal',
    saga: 'super',
    stars: 6,
    stats: { hp: 180, ki: 160, physical: 200, energy: 200, defense: 20, speed: 135 },
    startingWeapon: 'ki_barrier',
    passives: [{ id: 'auto_dodge', name: 'Instinto', description: '20% de esquivar automáticamente un golpe.' }],
    aura: 0xb8c8ff,
    sprite: { eye: '#8aa0d8' },
    attackMods: { pierceBonus: 2, extraCount: 1, projectileTint: 0xd8e0ff },
    dodge: { cooldown: 1500 },
    description: 'El cuerpo se mueve solo. Esquiva golpes por sí mismo.',
  }),
  version({
    id: 'goku_ui',
    name: 'Goku Ultra Instinto',
    saga: 'super',
    stars: 7,
    stats: { hp: 210, ki: 180, physical: 230, energy: 230, defense: 26, speed: 145 },
    startingWeapon: 'rapid_punch',
    passives: [{ id: 'auto_dodge', name: 'Ultra Instinto dominado', description: '35% de esquivar automáticamente un golpe.' }],
    aura: 0xe8f0ff,
    lightning: true,
    sprite: { hair: '#e0e4f0', eye: '#c0c8e0' },
    attackMods: { pierceBonus: 3, extraCount: 1, projectileTint: 0xffffff },
    dodge: { cooldown: 1000, distance: 190 },
    description: 'La técnica de los dioses dominada. El guerrero más poderoso.',
  }),
];

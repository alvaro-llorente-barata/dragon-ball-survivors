import type { BaseStats, CharacterDef, CharacterPassive, FormDef, Saga, SpriteSpec } from '../types';

/**
 * Estilos de juego. Cada uno da estadísticas base distintas; las estrellas las multiplican.
 * Así dos personajes con la misma rareza no se juegan igual.
 */
export type Style = 'balanced' | 'brawler' | 'blaster' | 'tank' | 'speedster' | 'sniper' | 'giant' | 'support' | 'swordsman' | 'glass';

const STYLE_STATS: Record<Style, BaseStats> = {
  balanced: { hp: 120, ki: 100, physical: 100, energy: 100, defense: 10, speed: 100 },
  brawler: { hp: 140, ki: 85, physical: 130, energy: 70, defense: 14, speed: 104 },
  blaster: { hp: 100, ki: 120, physical: 70, energy: 132, defense: 8, speed: 100 },
  tank: { hp: 185, ki: 90, physical: 112, energy: 80, defense: 24, speed: 84 },
  speedster: { hp: 95, ki: 105, physical: 108, energy: 95, defense: 6, speed: 128 },
  sniper: { hp: 92, ki: 130, physical: 60, energy: 142, defense: 6, speed: 104 },
  giant: { hp: 240, ki: 100, physical: 140, energy: 110, defense: 18, speed: 76 },
  support: { hp: 110, ki: 145, physical: 65, energy: 105, defense: 12, speed: 102 },
  swordsman: { hp: 115, ki: 95, physical: 128, energy: 85, defense: 10, speed: 116 },
  glass: { hp: 85, ki: 110, physical: 120, energy: 130, defense: 4, speed: 110 },
};

/** multiplicador de poder por estrellas */
const STAR_POWER = [1, 1, 1.12, 1.25, 1.4, 1.58, 1.78, 2];

export const PASSIVE_LIB: Record<CharacterPassive['id'], CharacterPassive> = {
  saiyan_blood: { id: 'saiyan_blood', name: 'Sangre Saiyan', description: 'Hasta +30% de daño cuando tienes poca vida.' },
  regeneration: { id: 'regeneration', name: 'Regeneración', description: 'Recupera el 1% de la vida por segundo.' },
  auto_dodge: { id: 'auto_dodge', name: 'Reflejos divinos', description: 'Probabilidad de esquivar golpes automáticamente.' },
  crit_master: { id: 'crit_master', name: 'Potencial oculto', description: '+15% de crítico y críticos más fuertes.' },
  tank: { id: 'tank', name: 'Cuerpo de acero', description: '+40% de defensa.' },
  glass: { id: 'glass', name: 'Orgullo', description: '+25% de daño, -20% de vida.' },
  ki_efficient: { id: 'ki_efficient', name: 'Ki eficiente', description: 'El Ki se recupera un 80% más rápido.' },
  berserker: { id: 'berserker', name: 'Furia creciente', description: 'Gana daño cuanto más tiempo sobrevives (hasta +40%).' },
};

const DEFAULT_PASSIVE: Record<Style, CharacterPassive['id']> = {
  balanced: 'ki_efficient',
  brawler: 'berserker',
  blaster: 'crit_master',
  tank: 'tank',
  speedster: 'auto_dodge',
  sniper: 'crit_master',
  giant: 'tank',
  support: 'regeneration',
  swordsman: 'berserker',
  glass: 'glass',
};

const STYLE_DESC: Record<Style, string> = {
  balanced: 'Equilibrado entre golpes y Ki.',
  brawler: 'Luchador cuerpo a cuerpo: más fuerte cuanto más aguanta.',
  blaster: 'Especialista en ataques de energía.',
  tank: 'Muy resistente pero lento.',
  speedster: 'Rapidísimo y difícil de golpear, pero frágil.',
  sniper: 'Ataques de energía a distancia con muchos críticos.',
  giant: 'Enorme: muchísima vida y área, poca movilidad.',
  support: 'Mucho Ki y se cura solo.',
  swordsman: 'Combate con espada, rápido y físico.',
  glass: 'Daño enorme a cambio de poca vida.',
};

/** Número estable en [0, 1) a partir del id (no aleatorio: siempre igual). */
function jitter(id: string, salt: number): number {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  h = Math.imul(h ^ (h >>> 15), 2246822507);
  return ((h ^ (h >>> 13)) >>> 0) / 4294967296;
}

export interface CharOpts {
  family?: string;
  passive?: CharacterPassive['id'];
  size?: number;
  aura?: number;
  lightning?: boolean;
  forms?: FormDef[];
  mods?: CharacterDef['attackMods'];
  desc?: string;
  dodge?: Partial<CharacterDef['dodge']>;
  /** ajuste fino de estadísticas (multiplicador) */
  stat?: Partial<Record<keyof BaseStats, number>>;
}

export function makeChar(
  id: string,
  name: string,
  saga: Saga,
  stars: number,
  style: Style,
  start: string,
  pool: string[],
  ultimate: string,
  sprite: SpriteSpec,
  o: CharOpts = {},
): CharacterDef {
  const b = STYLE_STATS[style];
  const p = STAR_POWER[stars] ?? 1;
  const m = o.stat ?? {};
  // Variación estable por personaje (±8%): dos personajes del mismo estilo y rareza nunca son idénticos.
  const v = (k: number) => 0.92 + jitter(id, k) * 0.16;
  const stats: BaseStats = {
    hp: Math.round(b.hp * p * (m.hp ?? 1) * v(1)),
    ki: Math.round(b.ki * (1 + (stars - 1) * 0.06) * (m.ki ?? 1) * v(2)),
    physical: Math.round(b.physical * p * (m.physical ?? 1) * v(3)),
    energy: Math.round(b.energy * p * (m.energy ?? 1) * v(4)),
    defense: Math.round((b.defense + stars * 2) * (m.defense ?? 1) * v(5)),
    speed: Math.round((b.speed + stars * 2) * (m.speed ?? 1) * (0.96 + jitter(id, 6) * 0.08)),
  };
  const weaponPool = pool.includes(start) ? pool : [start, ...pool];
  return {
    id,
    name,
    family: o.family ?? id.split('_')[0],
    saga,
    stars,
    stats,
    startingWeapon: start,
    weaponPool,
    ultimate,
    dodge: { name: style === 'speedster' ? 'Velocidad extrema' : 'Teletransporte', distance: 150, cooldown: style === 'giant' ? 3600 : 2400, ...o.dodge },
    passives: [PASSIVE_LIB[o.passive ?? DEFAULT_PASSIVE[style]]],
    aura: o.aura,
    lightning: o.lightning,
    attackMods: o.mods ?? (stars >= 5 ? { pierceBonus: Math.floor((stars - 3) / 2) } : undefined),
    sprite,
    size: o.size,
    transformations: o.forms,
    description: o.desc ?? STYLE_DESC[style],
    unlock: id === 'goku' ? { type: 'default' } : { type: 'summon' },
  };
}

// ---------- Ayudas para sprites ----------
const SKIN = '#f2c49b';

/** Artista marcial con gi (Goku, Krilin, Yamcha...). */
export function giSprite(gi: string, accent: string, hair: string, hairStyle: SpriteSpec['hairStyle'], extra: Partial<SpriteSpec> = {}): SpriteSpec {
  return { skin: SKIN, hair, hairStyle, gi, giAccent: accent, belt: accent, pants: gi, boots: accent, eye: '#16161c', ...extra };
}

/** Guerrero con armadura Saiyan o del ejército de Freezer. */
export function armorSprite(suit: string, armor: string, hair: string, hairStyle: SpriteSpec['hairStyle'], extra: Partial<SpriteSpec> = {}): SpriteSpec {
  return { skin: SKIN, hair, hairStyle, gi: suit, giAccent: suit, belt: suit, pants: suit, boots: '#f0f0f0', armor, eye: '#16161c', ...extra };
}

/** Alienígena o criatura (piel propia). */
export function alienSprite(skin: string, body: string, pants: string, hairStyle: SpriteSpec['hairStyle'], hair = skin, extra: Partial<SpriteSpec> = {}): SpriteSpec {
  return { skin, hair, hairStyle, gi: body, giAccent: body, belt: pants, pants, boots: pants, eye: '#16161c', ...extra };
}

export function form(
  id: string,
  name: string,
  minLevel: number,
  kiCost: number,
  kiDrain: number,
  damageMul: number,
  aura: number,
  sprite?: Partial<SpriteSpec>,
  extra: Partial<FormDef> = {},
): FormDef {
  return {
    id,
    name,
    minLevel,
    kiCost,
    kiDrain,
    damageMul,
    speedMul: 1 + (damageMul - 1) * 0.2,
    defenseMul: 1 + (damageMul - 1) * 0.5,
    cooldownMul: 1 - Math.min(0.3, (damageMul - 1) * 0.15),
    aura,
    sprite,
    description: `Daño x${damageMul} mientras dure el Ki`,
    ...extra,
  };
}

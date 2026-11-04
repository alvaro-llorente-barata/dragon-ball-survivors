// Tipos compartidos por todos los datos del juego.
// Los datos (src/data) no dependen de Phaser ni de React: se pueden testear y ampliar solos.

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
export type ChestRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'divine';

export type Saga = 'dragonball' | 'saiyan' | 'freezer' | 'cell' | 'buu' | 'gt' | 'super' | 'daima' | 'movies';

export const SAGAS: readonly Saga[] = ['dragonball', 'saiyan', 'freezer', 'cell', 'buu', 'gt', 'super', 'daima', 'movies'];

export interface BaseStats {
  hp: number;
  ki: number;
  physical: number;
  energy: number;
  defense: number;
  /** 100 = velocidad estándar */
  speed: number;
}

export type HairStyle =
  | 'spiky'
  | 'vegeta'
  | 'long'
  | 'bald'
  | 'flat'
  | 'dome'
  | 'gohan'
  | 'bowl'
  | 'turban'
  | 'buu'
  | 'crest'
  | 'bob'
  | 'wild'
  | 'mohawk';

/** Descripción de un sprite pixel art generado por código (arte original, sin recursos externos). */
export interface SpriteSpec {
  skin: string;
  hair: string;
  hairStyle: HairStyle;
  gi: string;
  giAccent: string;
  belt: string;
  pants: string;
  boots: string;
  eye?: string;
  armor?: string;
  tail?: string;
  antenna?: string;
  horns?: string;
  mustache?: string;
  beard?: string;
  cape?: string;
  /** complexión: delgada, normal o corpulenta (más ancha) */
  build?: 'slim' | 'normal' | 'bulky';
  /** marca en la frente o el pecho (Majin, Babidi, armadura) */
  mark?: string;
  sword?: boolean;
  halo?: boolean;
  earring?: string;
}

export type WeaponBehavior = 'projectile' | 'homing' | 'melee' | 'beam' | 'shockwave' | 'orbit' | 'piercing' | 'bomb';

export interface WeaponLevelStats {
  damage: number;
  /** milisegundos */
  cooldown: number;
  count: number;
  pierce: number;
  speed: number;
  /** multiplicador de tamaño */
  area: number;
  range: number;
  /** milisegundos */
  duration: number;
}

/** Efectos especiales que cambian de verdad cómo funciona un ataque. */
export interface WeaponFx {
  /** explota al impactar (radio en píxeles) */
  explode?: number;
  /** dispara en todas direcciones a la vez */
  ring?: boolean;
  /** número de rayos (abanico) */
  beams?: number;
  /** golpe cuerpo a cuerpo en 360° */
  full?: boolean;
  /** número de ondas seguidas */
  pulses?: number;
  /** los proyectiles persiguen */
  homing?: boolean;
  /** ralentiza (segundos) */
  slow?: number;
  /** paraliza (segundos) */
  stun?: number;
  /** al impactar se divide en N proyectiles */
  split?: number;
  /** fracción del daño que cura */
  lifesteal?: number;
  /** textura del proyectil */
  texture?: string;
}

export interface WeaponEvolution {
  name: string;
  /** pasiva necesaria (id) */
  passive: string;
  description: string;
  stats: Partial<WeaponLevelStats>;
  fx?: WeaponFx;
  color?: number;
}

export interface WeaponDef {
  id: string;
  name: string;
  description: string;
  behavior: WeaponBehavior;
  damageType: 'physical' | 'energy';
  color: number;
  /** texto de cada mejora (índice = nivel - 1) */
  levelNotes: string[];
  levels: WeaponLevelStats[];
  ultimate?: { kiCost: number };
  knockback?: number;
  fx?: WeaponFx;
  evolution?: WeaponEvolution;
}

export interface StatBonus {
  damage?: number;
  physical?: number;
  energy?: number;
  moveSpeed?: number;
  cooldown?: number;
  area?: number;
  maxHp?: number;
  kiRegen?: number;
  crit?: number;
  magnet?: number;
  amount?: number;
  defense?: number;
  xp?: number;
  /** fracción de vida máxima por segundo */
  regen?: number;
}

export interface PassiveDef {
  id: string;
  name: string;
  description: string;
  maxLevel: number;
  perLevel: StatBonus;
}

export interface CharacterPassive {
  /**
   * saiyan_blood: más daño con poca vida · regeneration: recupera vida · auto_dodge: esquiva golpes
   * crit_master: más críticos · tank: menos daño recibido · glass: más daño, menos vida
   * ki_efficient: el Ki se recupera más rápido · berserker: más daño cuanto más tiempo vivo
   */
  id: 'saiyan_blood' | 'regeneration' | 'auto_dodge' | 'crit_master' | 'tank' | 'glass' | 'ki_efficient' | 'berserker';
  name: string;
  description: string;
}

export type UnlockCondition = { type: 'default' } | { type: 'summon' };

/** Transformación temporal dentro de una partida (tecla E). */
export interface FormDef {
  id: string;
  name: string;
  minLevel: number;
  kiCost: number;
  /** Ki por segundo mientras dura */
  kiDrain: number;
  damageMul: number;
  speedMul: number;
  defenseMul: number;
  cooldownMul: number;
  aura: number;
  lightning?: boolean;
  sprite?: Partial<SpriteSpec>;
  /** escala del sprite en esta forma (Ozaru, Broly) */
  size?: number;
  description: string;
}

/**
 * Personaje jugable. Las versiones fijas (Goku SSJ, Gohan Beast...) se consiguen invocando.
 * Algunos personajes base además pueden transformarse durante la partida (transformations).
 */
export interface CharacterDef {
  id: string;
  name: string;
  /** familia para agrupar versiones del mismo personaje (goku, vegeta...) */
  family: string;
  saga: Saga;
  /** 1 a 7 estrellas: la rareza y las estrellas de la Bola de Dragón al invocarlo */
  stars: number;
  stats: BaseStats;
  startingWeapon: string;
  weaponPool: string[];
  ultimate: string;
  dodge: { name: string; distance: number; cooldown: number };
  passives: CharacterPassive[];
  /** aura permanente (color) y rayos */
  aura?: number;
  lightning?: boolean;
  attackMods?: { pierceBonus?: number; extraCount?: number; projectileTint?: number };
  sprite: SpriteSpec;
  /** escala del sprite (niños 0.8, Broly 1.3) */
  size?: number;
  transformations?: FormDef[];
  description: string;
  unlock: UnlockCondition;
}

export function rarityForStars(stars: number): Rarity {
  if (stars >= 7) return 'mythic';
  if (stars >= 5) return 'legendary';
  if (stars === 4) return 'epic';
  if (stars === 3) return 'rare';
  return 'common';
}

export type EnemyBehavior =
  | 'chaser'
  | 'ranged'
  | 'exploder'
  | 'healer'
  | 'summoner'
  /** rodea al jugador antes de atacar */
  | 'flanker'
  /** carga rápida con aviso */
  | 'charger'
  /** rayo con aviso previo */
  | 'beamer'
  /** protege a los aliados cercanos (reduce su daño recibido) */
  | 'guardian'
  /** deja zonas peligrosas */
  | 'bomber'
  /** ráfagas de tres disparos */
  | 'burst';

export interface EnemyDef {
  id: string;
  name: string;
  behavior: EnemyBehavior;
  hp: number;
  damage: number;
  speed: number;
  xp: number;
  scale: number;
  coinChance: number;
  sprite: SpriteSpec;
  ranged?: { range: number; cooldown: number; bulletSpeed: number; damage: number };
}

export type BossPattern = 'volley' | 'ring' | 'beam' | 'dash' | 'ground_burst' | 'big_ball' | 'summon' | 'spiral' | 'cross_beam';

export interface BossPhase {
  /** la fase empieza cuando la vida baja de esta fracción (1 = desde el inicio) */
  hpBelow: number;
  name?: string;
  sprite?: Partial<SpriteSpec>;
  scale?: number;
  speedMul: number;
  patternCooldown: number;
  patterns: BossPattern[];
  summonId?: string;
  color: number;
  attackName?: string;
}

export interface BossDef {
  id: string;
  name: string;
  mini: boolean;
  hp: number;
  damage: number;
  speed: number;
  scale: number;
  sprite: SpriteSpec;
  chest: ChestRarity;
  phases: BossPhase[];
}

export type ItemKind = 'senzu' | 'ki_orb' | 'magnet' | 'power' | 'speed' | 'shield' | 'time_watch' | 'xp_mult';

export type CapsuleKind = 'coins' | 'xp' | 'heal' | 'ki' | 'upgrade' | 'mystery';

export type BuffId = 'power' | 'speed' | 'xp' | 'freeze';

export type Difficulty = 'normal' | 'hard' | 'nightmare';

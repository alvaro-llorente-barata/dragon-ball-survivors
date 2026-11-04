// Tipos compartidos por todos los datos del juego.
// Los datos (src/data) no dependen de Phaser ni de React: se pueden testear y ampliar solos.

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
export type ChestRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'divine';

export type Saga =
  | 'dragonball'
  | 'saiyan'
  | 'freezer'
  | 'cell'
  | 'buu'
  | 'gt'
  | 'super'
  | 'daima'
  | 'movies';

export interface BaseStats {
  hp: number;
  ki: number;
  physical: number;
  energy: number;
  defense: number;
  /** 100 = velocidad estándar */
  speed: number;
}

export type HairStyle = 'spiky' | 'vegeta' | 'long' | 'bald' | 'flat' | 'dome';

/** Descripción de un sprite chibi generado por código (arte original, sin recursos externos). */
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
}

export type WeaponBehavior =
  | 'projectile'
  | 'homing'
  | 'melee'
  | 'beam'
  | 'shockwave'
  | 'orbit'
  | 'piercing'
  | 'bomb';

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
}

export interface StatBonus {
  damage?: number;
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
}

export interface PassiveDef {
  id: string;
  name: string;
  description: string;
  maxLevel: number;
  perLevel: StatBonus;
}

export interface TransformationDef {
  id: string;
  name: string;
  /** nivel de partida necesario */
  minLevel: number;
  /** Ki que cuesta activarla */
  kiCost: number;
  /** Ki por segundo que consume mientras dura */
  kiDrain: number;
  damageMul: number;
  cooldownMul: number;
  speedMul: number;
  defenseMul: number;
  aura: number;
  sprite?: Partial<SpriteSpec>;
  attackMods?: { pierceBonus?: number; extraCount?: number; projectileTint?: number };
  /** requisito permanente: haber derrotado a este jefe alguna vez */
  requiresBossEver?: string;
  description: string;
}

export interface CharacterPassive {
  id: 'saiyan_blood' | 'regeneration' | 'namek_body';
  name: string;
  description: string;
}

export type UnlockCondition =
  | { type: 'default' }
  | { type: 'boss'; bossId: string }
  | { type: 'summon' };

export interface CharacterDef {
  id: string;
  name: string;
  saga: Saga;
  rarity: Rarity;
  stats: BaseStats;
  startingWeapon: string;
  weaponPool: string[];
  ultimate: string;
  dodge: { name: string; distance: number; cooldown: number };
  passives: CharacterPassive[];
  transformations: TransformationDef[];
  sprite: SpriteSpec;
  description: string;
  unlock: UnlockCondition;
}

export type EnemyBehavior = 'chaser' | 'ranged' | 'exploder' | 'healer' | 'summoner';

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

export type BossPattern = 'volley' | 'ring' | 'beam' | 'dash' | 'ground_burst' | 'big_ball' | 'summon';

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

export type ItemKind =
  | 'senzu'
  | 'ki_orb'
  | 'magnet'
  | 'power'
  | 'speed'
  | 'shield'
  | 'time_watch'
  | 'xp_mult';

export type CapsuleKind = 'coins' | 'xp' | 'heal' | 'ki' | 'upgrade' | 'mystery';

export type BuffId = 'power' | 'speed' | 'xp' | 'freeze';

import Phaser from 'phaser';
import type { BossDef, EnemyDef } from '../../data/types';
import { displayScale, realSheet } from '../../assets/realSheets';

let nextUid = 1;

/** Enemigo reutilizable (object pooling): se reactiva con spawn() en vez de crearse de nuevo. */
export class Enemy extends Phaser.Physics.Arcade.Sprite {
  uid = 0;
  def!: EnemyDef;
  boss: BossDef | null = null;
  hp = 0;
  maxHp = 0;
  damage = 0;
  speed = 0;
  xp = 0;
  elite = false;
  nextActionAt = 0;
  kbUntil = 0;
  fuseAt = 0;
  jitter = 0;
  hitFlashUntil = 0;
  baseTint = 0xffffff;
  textureBase = '';
  stunUntil = 0;
  slowUntil = 0;
  /** protegido por un Guerrero Majin cercano (recibe menos daño) */
  guardedUntil = 0;
  dashUntil = 0;
  /** 1 o -1: sentido en el que rodea al jugador */
  orbitDir = 1;
  burstLeft = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, frame?: string | number) {
    super(scene, x, y, texture, frame);
  }

  get arcadeBody(): Phaser.Physics.Arcade.Body {
    return this.body as Phaser.Physics.Arcade.Body;
  }

  activate(def: EnemyDef, textureKey: string, x: number, y: number, hp: number, damage: number, elite: boolean): void {
    this.uid = nextUid++;
    this.def = def;
    this.boss = null;
    this.textureBase = textureKey;
    this.enableBody(true, x, y, true, true);
    const sheet = realSheet(textureKey);
    this.setTexture(textureKey, sheet ? 0 : '4');
    this.play(`${textureKey}_side`, true);
    this.hp = hp;
    this.maxHp = hp;
    this.damage = damage;
    this.speed = def.speed * (elite ? 1.1 : 1);
    this.xp = def.xp * (elite ? 6 : 1);
    this.elite = elite;
    this.nextActionAt = 0;
    this.kbUntil = 0;
    this.fuseAt = 0;
    this.hitFlashUntil = 0;
    this.jitter = (Math.random() - 0.5) * 0.7;
    this.stunUntil = 0;
    this.slowUntil = 0;
    this.guardedUntil = 0;
    this.dashUntil = 0;
    this.burstLeft = 0;
    this.orbitDir = Math.random() < 0.5 ? 1 : -1;
    this.baseTint = elite ? 0xffb0ff : 0xffffff;
    this.clearTint();
    if (elite) this.setTint(this.baseTint);
    this.setScale(def.scale * (elite ? 1.35 : 1) * displayScale(textureKey));
    this.setAlpha(1);
    if (sheet) {
      // Hoja real: la caja de colisión sigue los pies, con la misma proporción que el chibi (24 px).
      const f = sheet.frameH / 24;
      this.arcadeBody.setSize(12 * f, 10 * f);
      this.arcadeBody.setOffset(sheet.frameW / 2 - 6 * f, sheet.frameH - 10 * f);
    } else {
      this.arcadeBody.setSize(12, 10);
      this.arcadeBody.setOffset(4, 13);
    }
  }

  deactivate(): void {
    this.disableBody(true, true);
    this.boss = null;
  }
}

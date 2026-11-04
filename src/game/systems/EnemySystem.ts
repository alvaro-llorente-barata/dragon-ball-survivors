import Phaser from 'phaser';
import { getEnemy } from '../../data/enemies';
import type { BossDef, EnemyDef } from '../../data/types';
import { audio } from '../../services/audioService';
import { DEPTH, MAX_ENEMIES_POOL, MAX_ENEMY_BULLETS } from '../constants';
import { Enemy } from '../entities/Enemy';
import { eliteChance, enemyDamageMul, enemyHpMul, maxEnemies, pickEnemyId, spawnRatePerSecond } from '../logic/spawn';
import type { GameScene } from '../scenes/GameScene';

export class EnemyBullet extends Phaser.Physics.Arcade.Image {
  damage = 0;
  expireAt = 0;
}

/** Aparición, IA, daño y muerte de los enemigos, con pools de objetos. */
export class EnemySystem {
  readonly group: Phaser.Physics.Arcade.Group;
  readonly bullets: Phaser.Physics.Arcade.Group;
  private spawnAcc = 0;
  /** multiplicador temporal (eventos) */
  spawnMul = 1;
  extraPool: { id: string; weight: number }[] = [];
  frozenUntil = 0;

  constructor(private scene: GameScene) {
    this.group = scene.physics.add.group({ classType: Enemy, maxSize: MAX_ENEMIES_POOL, runChildUpdate: false });
    this.bullets = scene.physics.add.group({ classType: EnemyBullet, maxSize: MAX_ENEMY_BULLETS, runChildUpdate: false });
  }

  textureFor(def: EnemyDef): string {
    return `enemy_${def.id}`;
  }

  activeEnemies(): Enemy[] {
    return this.group.getChildren().filter((c) => c.active) as Enemy[];
  }

  count(): number {
    return this.group.countActive(true);
  }

  spawn(id: string, x: number, y: number, forceElite = false): Enemy | null {
    const def = getEnemy(id);
    const t = this.scene.run.time;
    const elite = forceElite || Math.random() < eliteChance(t);
    const e = this.group.get(x, y, this.textureFor(def), '4') as Enemy | null;
    if (!e) return null;
    const hp = Math.round(def.hp * enemyHpMul(t) * (elite ? 4 : 1));
    e.activate(def, this.textureFor(def), x, y, hp, def.damage * enemyDamageMul(t) * (elite ? 1.4 : 1), elite);
    e.setDepth(DEPTH.entity + y);
    return e;
  }

  spawnBoss(def: BossDef, x: number, y: number, hp: number): Enemy | null {
    const base = getEnemy('saibaman');
    const e = this.group.get(x, y, `boss_${def.id}_0`, '4') as Enemy | null;
    if (!e) return null;
    e.activate(
      { ...base, id: def.id, name: def.name, hp, damage: def.damage, speed: def.speed, xp: 0, scale: def.scale, coinChance: 0, sprite: def.sprite },
      `boss_${def.id}_0`,
      x,
      y,
      hp,
      def.damage,
      false,
    );
    e.boss = def;
    e.xp = 0;
    e.arcadeBody.setSize(14, 14);
    e.arcadeBody.setOffset(3, 10);
    return e;
  }

  /** Punto de aparición fuera de la cámara, dentro del mundo y sin obstáculos. */
  ringPoint(extra = 80): { x: number; y: number } | null {
    const cam = this.scene.cameras.main;
    const radius = Math.hypot(cam.width / cam.zoom, cam.height / cam.zoom) / 2 + extra;
    const p = this.scene.player;
    const size = this.scene.world.worldSize;
    for (let i = 0; i < 8; i++) {
      const a = Math.random() * Math.PI * 2;
      const x = p.x + Math.cos(a) * radius;
      const y = p.y + Math.sin(a) * radius;
      if (x < 80 || y < 80 || x > size - 80 || y > size - 80) continue;
      return { x, y };
    }
    return null;
  }

  update(dt: number, now: number): void {
    const t = this.scene.run.time;
    // Aparición progresiva
    this.spawnAcc += dt * spawnRatePerSecond(t) * this.spawnMul;
    const cap = maxEnemies(t) * Math.min(1.6, this.spawnMul);
    const pool = [...this.scene.mapDef.enemies, ...this.extraPool.map((e) => ({ ...e, from: 0 }))];
    while (this.spawnAcc >= 1) {
      this.spawnAcc -= 1;
      if (this.count() >= cap) break;
      const pt = this.ringPoint();
      if (!pt) continue;
      this.spawn(pickEnemyId(pool, t, Math.random), pt.x, pt.y);
    }

    const px = this.scene.player.x;
    const py = this.scene.player.y;
    const frozen = now < this.frozenUntil;
    const children = this.group.getChildren() as Enemy[];
    for (const e of children) {
      if (!e.active) continue;
      if (e.boss) {
        e.setDepth(DEPTH.entity + e.y + 10);
        this.updateFlash(e, now);
        continue;
      }
      if (frozen) {
        e.setVelocity(0, 0);
        e.setTint(0x8ad8ff);
        e.anims.pause();
        continue;
      } else if (e.anims.isPaused) {
        e.anims.resume();
      }
      this.updateFlash(e, now);
      e.setDepth(DEPTH.entity + e.y);
      if (now < e.kbUntil) continue;
      const dx = px - e.x;
      const dy = py - e.y;
      const dist = Math.hypot(dx, dy) || 1;
      // Los enemigos muy lejanos se reubican cerca del jugador.
      if (dist > 1700) {
        const pt = this.ringPoint();
        if (pt) e.setPosition(pt.x, pt.y);
        continue;
      }
      const ang = Math.atan2(dy, dx) + e.jitter * Math.min(1, dist / 300);
      let speed = e.speed;
      const def = e.def;
      switch (def.behavior) {
        case 'ranged': {
          const range = def.ranged?.range ?? 260;
          if (dist < range * 0.55) speed = -speed * 0.6;
          else if (dist < range * 0.85) speed = 0;
          if (def.ranged && dist < range && now >= e.nextActionAt) {
            e.nextActionAt = now + def.ranged.cooldown * (0.8 + Math.random() * 0.4);
            this.fireBullet(e.x, e.y - 10, Math.atan2(dy, dx), def.ranged.bulletSpeed, def.ranged.damage * enemyDamageMul(t), 0xff6a3a);
          }
          break;
        }
        case 'exploder': {
          if (e.fuseAt === 0 && dist < 46) {
            e.fuseAt = now + 550;
            audio.play('warning');
          }
          if (e.fuseAt > 0) {
            speed = 0;
            e.setTintFill(Math.floor(now / 80) % 2 ? 0xffffff : 0xff4a2a);
            if (now >= e.fuseAt) {
              this.scene.effects.explosion(e.x, e.y, 70, 0xff7a2a, 0.003);
              audio.play('explode');
              if (Math.hypot(px - e.x, py - e.y) < 78) this.scene.damagePlayer(e.damage);
              this.kill(e, false);
              continue;
            }
          }
          break;
        }
        case 'healer': {
          if (dist < 150) speed = 0;
          if (now >= e.nextActionAt) {
            e.nextActionAt = now + 3200;
            let healed = 0;
            for (const o of children) {
              if (!o.active || o === e || o.boss) continue;
              if (Math.hypot(o.x - e.x, o.y - e.y) < 160 && o.hp < o.maxHp) {
                o.hp = Math.min(o.maxHp, o.hp + o.maxHp * 0.35);
                healed++;
              }
            }
            if (healed > 0) this.scene.effects.ring(e.x, e.y, 160, 0x6aff8a, 500);
          }
          break;
        }
        case 'summoner': {
          if (dist < 220) speed = 0;
          if (now >= e.nextActionAt) {
            e.nextActionAt = now + 5200;
            if (this.count() < cap) {
              for (let i = 0; i < 2; i++) this.spawn('saibaman', e.x + Phaser.Math.Between(-30, 30), e.y + Phaser.Math.Between(-30, 30));
              this.scene.effects.smoke(e.x, e.y, 0x6ac83a, 8);
            }
          }
          break;
        }
        default:
          break;
      }
      e.setVelocity(Math.cos(ang) * speed, Math.sin(ang) * speed);
      e.setFlipX(dx < 0);
    }

    // Balas enemigas
    for (const b of this.bullets.getChildren() as EnemyBullet[]) {
      if (b.active && now >= b.expireAt) b.disableBody(true, true);
    }
  }

  private updateFlash(e: Enemy, now: number): void {
    if (now < e.hitFlashUntil) e.setTintFill(0xffffff);
    else if (e.fuseAt === 0) {
      if (e.baseTint === 0xffffff) e.clearTint();
      else e.setTint(e.baseTint);
    }
  }

  fireBullet(x: number, y: number, angle: number, speed: number, damage: number, tint: number, scale = 1): void {
    const b = this.bullets.get(x, y, 'ebullet') as EnemyBullet | null;
    if (!b) return;
    b.enableBody(true, x, y, true, true);
    b.setTint(tint).setScale(scale).setDepth(DEPTH.effect - 1).setBlendMode('ADD');
    (b.body as Phaser.Physics.Arcade.Body).setCircle(5, 2, 2);
    b.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    b.damage = damage;
    b.expireAt = this.scene.time.now + 4000;
  }

  /** Daña a un enemigo. Devuelve true si muere. */
  damage(e: Enemy, amount: number, crit: boolean, fromX: number, fromY: number, knock = 0): boolean {
    if (!e.active) return false;
    if (e.boss && this.scene.bosses.isInvulnerable()) return false;
    e.hp -= amount;
    const now = this.scene.time.now;
    e.hitFlashUntil = now + 70;
    this.scene.effects.damageNumber(e.x, e.y - 10 * e.scaleY, amount, crit);
    if (knock > 0 && !e.boss) {
      const a = Math.atan2(e.y - fromY, e.x - fromX);
      e.setVelocity(Math.cos(a) * knock, Math.sin(a) * knock);
      e.kbUntil = now + 120;
    }
    if (e.boss) this.scene.bosses.onBossDamaged(e);
    if (e.hp <= 0) {
      this.kill(e, true);
      return true;
    }
    return false;
  }

  kill(e: Enemy, byPlayer: boolean): void {
    if (!e.active) return;
    const x = e.x;
    const y = e.y;
    if (e.boss) {
      const def = e.boss;
      e.deactivate();
      this.scene.bosses.onBossKilled(def, x, y);
      return;
    }
    const def = e.def;
    const elite = e.elite;
    const xp = e.xp;
    e.deactivate();
    this.scene.effects.sparks(x, y, 0xffe08a, 5);
    this.scene.effects.smoke(x, y, 0xcccccc, 2);
    if (byPlayer || def.behavior === 'exploder') {
      this.scene.run.kills += 1;
      this.scene.loot.onEnemyDeath(x, y, xp, def.coinChance, elite);
    }
  }

  /** Daña a todos los enemigos en un círculo (explosiones, Kiai, Genkidama). */
  damageInCircle(x: number, y: number, r: number, amountFn: () => { amount: number; crit: boolean }, knock: number): number {
    let hits = 0;
    const r2 = r * r;
    for (const e of this.group.getChildren() as Enemy[]) {
      if (!e.active) continue;
      const dx = e.x - x;
      const dy = e.y - y;
      const er = e.boss ? 30 : 0;
      if (dx * dx + dy * dy <= r2 + er * er + 2 * r * er) {
        const d = amountFn();
        this.damage(e, d.amount, d.crit, x, y, knock);
        hits++;
      }
    }
    return hits;
  }

  clearAll(): void {
    for (const e of this.group.getChildren() as Enemy[]) if (e.active && !e.boss) e.deactivate();
    for (const b of this.bullets.getChildren() as EnemyBullet[]) if (b.active) b.disableBody(true, true);
  }
}

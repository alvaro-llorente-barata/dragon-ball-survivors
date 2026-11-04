import Phaser from 'phaser';
import { getWeapon } from '../../data/attacks';
import type { WeaponDef, WeaponLevelStats } from '../../data/types';
import { audio } from '../../services/audioService';
import { DEPTH, MAX_SHOTS_POOL } from '../constants';
import type { Enemy } from '../entities/Enemy';
import { pointInArc, pointInBeam, rollDamage } from '../logic/combat';
import type { PlayerStats } from '../logic/stats';
import type { GameScene } from '../scenes/GameScene';
import type { Destructible } from '../world/WorldBuilder';

export class Shot extends Phaser.Physics.Arcade.Image {
  weaponId = '';
  dmg = 0;
  physical = false;
  pierce = 0;
  knock = 0;
  expireAt = 0;
  homing = false;
  turnRate = 0;
  speed = 0;
  hits = new Set<number>();
}

interface Orb {
  img: Phaser.GameObjects.Image;
}

/** Ataques automáticos: cada comportamiento (proyectil, rayo, cuerpo a cuerpo...) tiene su lógica propia. */
export class WeaponSystem {
  readonly shots: Phaser.Physics.Arcade.Group;
  private nextFire = new Map<string, number>();
  private orbs: Orb[] = [];
  private orbAngle = 0;
  private orbActiveUntil = 0;
  private orbHitAt = new Map<number, number>();
  ultimateReadyAt = 0;
  private ultimateBusy = false;

  constructor(private scene: GameScene) {
    this.shots = scene.physics.add.group({ classType: Shot, maxSize: MAX_SHOTS_POOL, runChildUpdate: false });
  }

  private stats(): PlayerStats {
    return this.scene.stats;
  }

  private eff(def: WeaponDef, lvl: number): WeaponLevelStats {
    return def.levels[Math.min(def.levels.length, lvl) - 1];
  }

  private roll(base: number, physical: boolean) {
    const s = this.stats();
    return rollDamage(base, physical ? s.physicalMul : s.energyMul, s.crit, s.critMul, Math.random);
  }

  nearestEnemy(range: number): Enemy | null {
    const px = this.scene.player.x;
    const py = this.scene.player.y;
    let best: Enemy | null = null;
    let bestD = range * range;
    for (const e of this.scene.enemies.group.getChildren() as Enemy[]) {
      if (!e.active) continue;
      const d = (e.x - px) ** 2 + (e.y - py) ** 2;
      if (d < bestD) {
        bestD = d;
        best = e;
      }
    }
    return best;
  }

  update(now: number, dt: number): void {
    const s = this.stats();
    for (const [id, lvl] of Object.entries(this.scene.run.weapons)) {
      const def = getWeapon(id);
      if (def.ultimate) continue;
      const next = this.nextFire.get(id) ?? 0;
      if (now < next) continue;
      const st = this.eff(def, lvl);
      const fired = this.fire(def, st, now);
      this.nextFire.set(id, now + (fired ? st.cooldown * s.cooldownMul : 150));
    }
    this.updateShots(now, dt);
    this.updateOrbs(now, dt);
  }

  private fire(def: WeaponDef, st: WeaponLevelStats, now: number): boolean {
    switch (def.behavior) {
      case 'projectile':
        return this.fireProjectiles(def, st, false);
      case 'homing':
        return this.fireProjectiles(def, st, true);
      case 'piercing':
        return this.fireDragon(def, st);
      case 'melee':
        return this.fireMelee(def, st);
      case 'beam':
        return this.fireBeam(def, st);
      case 'shockwave':
        return this.fireShockwave(def, st);
      case 'orbit':
        return this.fireOrbit(def, st, now);
      default:
        return false;
    }
  }

  private spawnShot(def: WeaponDef, st: WeaponLevelStats, x: number, y: number, angle: number, opts: { homing?: boolean; texture?: string; scale?: number }): Shot | null {
    const s = this.stats();
    const shot = this.shots.get(x, y, opts.texture ?? 'kiball') as Shot | null;
    if (!shot) return null;
    shot.enableBody(true, x, y, true, true);
    shot.setTexture(opts.texture ?? 'kiball');
    const tint = def.behavior === 'piercing' ? def.color : (s.projectileTint ?? def.color);
    shot.setTint(tint).setBlendMode('ADD').setDepth(DEPTH.effect - 2);
    const scale = (opts.scale ?? 1) * st.area * s.areaMul;
    shot.setScale(scale);
    shot.setRotation(angle);
    const body = shot.body as Phaser.Physics.Arcade.Body;
    body.setSize(shot.width * 0.7, shot.height * 0.7, true);
    shot.weaponId = def.id;
    shot.dmg = st.damage;
    shot.physical = def.damageType === 'physical';
    shot.pierce = st.pierce + (def.behavior === 'piercing' ? 0 : s.pierceBonus);
    shot.knock = def.knockback ?? 40;
    shot.speed = st.speed;
    shot.homing = !!opts.homing;
    shot.turnRate = 5;
    shot.expireAt = this.scene.time.now + st.duration;
    shot.hits.clear();
    shot.setVelocity(Math.cos(angle) * st.speed, Math.sin(angle) * st.speed);
    return shot;
  }

  private fireProjectiles(def: WeaponDef, st: WeaponLevelStats, homing: boolean): boolean {
    const target = this.nearestEnemy(st.range);
    if (!target) return false;
    const p = this.scene.player;
    const base = Math.atan2(target.y - p.y, target.x - p.x);
    const count = st.count + this.stats().amount;
    const spread = homing ? 0.9 : 0.16;
    for (let i = 0; i < count; i++) {
      const a = base + (i - (count - 1) / 2) * spread;
      this.spawnShot(def, st, p.x, p.y - 6, a, { homing });
    }
    p.showAttack(120);
    audio.play('shoot');
    return true;
  }

  private fireDragon(def: WeaponDef, st: WeaponLevelStats): boolean {
    const target = this.nearestEnemy(st.range);
    const p = this.scene.player;
    const base = target ? Math.atan2(target.y - p.y, target.x - p.x) : Math.atan2(p.facing.y, p.facing.x);
    if (!target && this.scene.enemies.count() === 0) return false;
    for (let i = 0; i < st.count; i++) {
      const a = base + (i === 0 ? 0 : Math.PI);
      const shot = this.spawnShot(def, st, p.x, p.y - 6, a, { texture: 'dragon', scale: 1.2 });
      if (shot) shot.setBlendMode('NORMAL');
    }
    this.scene.effects.sparks(p.x, p.y, def.color, 12);
    p.showAttack(250);
    audio.play('punch');
    return true;
  }

  private fireMelee(def: WeaponDef, st: WeaponLevelStats): boolean {
    const s = this.stats();
    const radius = st.range * st.area * s.areaMul;
    const target = this.nearestEnemy(radius + 50);
    if (!target) return false;
    const p = this.scene.player;
    for (let i = 0; i < st.count; i++) {
      this.scene.time.delayedCall(i * 100, () => {
        const t = target.active ? target : this.nearestEnemy(radius + 50);
        const angle = t ? Math.atan2(t.y - p.y, t.x - p.x) : Math.atan2(p.facing.y, p.facing.x);
        const ox = p.x;
        const oy = p.y;
        const fx = ox + Math.cos(angle) * 18;
        const fy = oy + Math.sin(angle) * 18;
        const slash = this.scene.add
          .image(fx, fy, 'slash')
          .setOrigin(0.15, 0.5)
          .setRotation(angle)
          .setTint(def.color)
          .setBlendMode('ADD')
          .setDepth(DEPTH.effect)
          .setScale(radius / 40);
        this.scene.tweens.add({ targets: slash, alpha: 0, scale: slash.scale * 1.2, duration: 160, onComplete: () => slash.destroy() });
        p.showAttack(110);
        audio.play('punch');
        for (const e of this.scene.enemies.group.getChildren() as Enemy[]) {
          if (!e.active) continue;
          if (pointInArc(e.x, e.y, ox, oy, angle, radius + (e.boss ? 24 : 8), 1.05)) {
            const d = this.roll(st.damage, true);
            this.scene.enemies.damage(e, d.amount, d.crit, ox, oy, def.knockback ?? 0);
            this.scene.effects.sparks(e.x, e.y, 0xffffff, 3);
          }
        }
        this.hitDestructiblesArc(ox, oy, angle, radius, st.damage);
      });
    }
    return true;
  }

  private fireBeam(def: WeaponDef, st: WeaponLevelStats): boolean {
    const target = this.nearestEnemy(st.range);
    if (!target) return false;
    const s = this.stats();
    const p = this.scene.player;
    const angle = Math.atan2(target.y - p.y, target.x - p.x);
    const halfW = 14 * st.area * s.areaMul;
    const length = st.range;
    const color = s.projectileTint ?? def.color;

    // Carga
    const charge = this.scene.add.image(p.x, p.y, 'glow').setTint(color).setBlendMode('ADD').setDepth(DEPTH.effect).setScale(0.1);
    this.scene.tweens.add({ targets: charge, scale: halfW / 20, duration: 320 });
    p.showAttack(320 + st.duration);
    this.scene.time.delayedCall(320, () => {
      charge.destroy();
      audio.play('beam');
      const beam = this.scene.add
        .image(p.x, p.y, 'beam')
        .setOrigin(0, 0.5)
        .setRotation(angle)
        .setTint(color)
        .setBlendMode('ADD')
        .setDepth(DEPTH.effect)
        .setDisplaySize(length, halfW * 2.4);
      const core = this.scene.add
        .image(p.x, p.y, 'beam')
        .setOrigin(0, 0.5)
        .setRotation(angle)
        .setBlendMode('ADD')
        .setDepth(DEPTH.effect + 1)
        .setDisplaySize(length, halfW);
      const head = this.scene.add.image(p.x, p.y, 'glow').setTint(color).setBlendMode('ADD').setDepth(DEPTH.effect + 1).setScale(halfW / 16);
      this.scene.cameras.main.shake(st.duration, 0.002);
      const ticks = 3;
      for (let i = 0; i < ticks; i++) {
        this.scene.time.delayedCall((i * st.duration) / ticks, () => {
          const ox = p.x;
          const oy = p.y;
          for (const e of this.scene.enemies.group.getChildren() as Enemy[]) {
            if (!e.active) continue;
            if (pointInBeam(e.x, e.y, ox, oy, angle, length, halfW + (e.boss ? 24 : 6))) {
              const d = this.roll(st.damage, false);
              this.scene.enemies.damage(e, d.amount, d.crit, ox, oy, 60);
            }
          }
          for (const ds of this.scene.world.destructibles) {
            if (ds.alive && pointInBeam(ds.img.x, ds.img.y - 10, ox, oy, angle, length, halfW + 12)) this.hitDestructible(ds, st.damage);
          }
        });
      }
      const follow = this.scene.time.addEvent({
        delay: 16,
        loop: true,
        callback: () => {
          beam.setPosition(p.x, p.y);
          core.setPosition(p.x, p.y);
          head.setPosition(p.x + Math.cos(angle) * length, p.y + Math.sin(angle) * length);
        },
      });
      this.scene.tweens.add({
        targets: [beam, core, head],
        alpha: { from: 1, to: 0 },
        delay: st.duration * 0.7,
        duration: st.duration * 0.3 + 120,
        onComplete: () => {
          follow.remove();
          beam.destroy();
          core.destroy();
          head.destroy();
        },
      });
    });
    return true;
  }

  private fireShockwave(def: WeaponDef, st: WeaponLevelStats): boolean {
    const s = this.stats();
    const radius = st.range * st.area * s.areaMul;
    if (!this.nearestEnemy(radius + 40)) return false;
    const p = this.scene.player;
    this.scene.effects.ring(p.x, p.y, radius, def.color, 300);
    this.scene.effects.sparks(p.x, p.y, 0xffffff, 10);
    audio.play('explode');
    this.scene.enemies.damageInCircle(p.x, p.y, radius, () => this.roll(st.damage, true), def.knockback ?? 300);
    for (const ds of this.scene.world.destructibles) {
      if (ds.alive && Math.hypot(ds.img.x - p.x, ds.img.y - p.y) < radius) this.hitDestructible(ds, st.damage);
    }
    // Las ondas también destruyen balas enemigas
    for (const b of this.scene.enemies.bullets.getChildren() as Phaser.Physics.Arcade.Image[]) {
      if (b.active && Math.hypot(b.x - p.x, b.y - p.y) < radius) b.disableBody(true, true);
    }
    return true;
  }

  private fireOrbit(def: WeaponDef, st: WeaponLevelStats, now: number): boolean {
    const s = this.stats();
    while (this.orbs.length < st.count) {
      const img = this.scene.add.image(0, 0, 'kiball').setBlendMode('ADD').setDepth(DEPTH.effect - 1);
      this.orbs.push({ img });
    }
    for (const o of this.orbs) o.img.setTint(def.color).setScale(1.6 * st.area * s.areaMul).setVisible(true);
    this.orbActiveUntil = now + st.duration;
    return true;
  }

  private updateOrbs(now: number, dt: number): void {
    const lvl = this.scene.run.weapons['ki_barrier'];
    if (!lvl || this.orbs.length === 0) return;
    const def = getWeapon('ki_barrier');
    const st = this.eff(def, lvl);
    const s = this.stats();
    const active = now < this.orbActiveUntil;
    this.orbAngle += dt * st.speed;
    const p = this.scene.player;
    const radius = st.range * s.areaMul;
    const hitR = 16 * st.area * s.areaMul;
    this.orbs.forEach((o, i) => {
      if (!active || i >= st.count) {
        o.img.setVisible(false);
        return;
      }
      const a = this.orbAngle + (i / st.count) * Math.PI * 2;
      const x = p.x + Math.cos(a) * radius;
      const y = p.y - 6 + Math.sin(a) * radius;
      o.img.setVisible(true).setPosition(x, y);
      for (const e of this.scene.enemies.group.getChildren() as Enemy[]) {
        if (!e.active) continue;
        const rr = hitR + (e.boss ? 24 : 8);
        if ((e.x - x) ** 2 + (e.y - y) ** 2 > rr * rr) continue;
        const key = e.uid * 10 + i;
        if ((this.orbHitAt.get(key) ?? 0) > now) continue;
        this.orbHitAt.set(key, now + 450);
        const d = this.roll(st.damage, false);
        this.scene.enemies.damage(e, d.amount, d.crit, p.x, p.y, def.knockback ?? 0);
      }
      for (const b of this.scene.enemies.bullets.getChildren() as Phaser.Physics.Arcade.Image[]) {
        if (b.active && (b.x - x) ** 2 + (b.y - y) ** 2 < (hitR + 6) ** 2) {
          b.disableBody(true, true);
          this.scene.effects.sparks(x, y, def.color, 3);
        }
      }
    });
    if (this.orbHitAt.size > 4000) this.orbHitAt.clear();
  }

  private updateShots(now: number, dt: number): void {
    for (const shot of this.shots.getChildren() as Shot[]) {
      if (!shot.active) continue;
      if (now >= shot.expireAt) {
        shot.disableBody(true, true);
        continue;
      }
      if (shot.homing) {
        let best: Enemy | null = null;
        let bestD = 420 * 420;
        for (const e of this.scene.enemies.group.getChildren() as Enemy[]) {
          if (!e.active || shot.hits.has(e.uid)) continue;
          const d = (e.x - shot.x) ** 2 + (e.y - shot.y) ** 2;
          if (d < bestD) {
            bestD = d;
            best = e;
          }
        }
        if (best) {
          const body = shot.body as Phaser.Physics.Arcade.Body;
          const cur = Math.atan2(body.velocity.y, body.velocity.x);
          const want = Math.atan2(best.y - shot.y, best.x - shot.x);
          const next = Phaser.Math.Angle.RotateTo(cur, want, shot.turnRate * dt);
          shot.setVelocity(Math.cos(next) * shot.speed, Math.sin(next) * shot.speed);
          shot.setRotation(next);
        }
      }
    }
  }

  /** Callback de colisión proyectil-enemigo. */
  onShotHit(shot: Shot, e: Enemy): void {
    if (!shot.active || !e.active || shot.hits.has(e.uid)) return;
    shot.hits.add(e.uid);
    const d = this.roll(shot.dmg, shot.physical);
    this.scene.enemies.damage(e, d.amount, d.crit, shot.x, shot.y, shot.knock);
    this.scene.effects.sparks(shot.x, shot.y, shot.tintTopLeft, 4);
    audio.play(d.crit ? 'crit' : 'hit');
    shot.pierce -= 1;
    if (shot.pierce <= 0) shot.disableBody(true, true);
  }

  onShotHitDestructible(shot: Shot, d: Destructible): void {
    if (!shot.active || !d.alive) return;
    this.hitDestructible(d, shot.dmg);
    if (shot.weaponId !== 'dragon_fist') shot.disableBody(true, true);
  }

  private hitDestructiblesArc(ox: number, oy: number, angle: number, radius: number, dmg: number): void {
    for (const d of this.scene.world.destructibles) {
      if (d.alive && pointInArc(d.img.x, d.img.y - 10, ox, oy, angle, radius + 16, 1.05)) this.hitDestructible(d, dmg);
    }
  }

  hitDestructible(d: Destructible, dmg: number): void {
    if (!d.alive) return;
    d.hp -= dmg;
    this.scene.effects.debris(d.img.x, d.img.y - 12, 0x8a8a92, 4);
    this.scene.tweens.add({ targets: d.img, x: d.img.x + 2, duration: 40, yoyo: true, repeat: 1 });
    if (d.hp <= 0) {
      d.alive = false;
      this.scene.effects.debris(d.img.x, d.img.y - 12, 0x8a7a6a, 14);
      this.scene.effects.smoke(d.img.x, d.img.y - 10, 0xbbbbbb, 6);
      audio.play('explode');
      d.zone.destroy();
      d.img.destroy();
      this.scene.loot.onDestructibleBroken(d.img.x, d.img.y - 10);
    }
  }

  // ---------- Ataque definitivo (Q) ----------

  ultimateId(): string {
    return this.scene.char.ultimate;
  }

  canUltimate(): boolean {
    const def = getWeapon(this.ultimateId());
    return !this.ultimateBusy && this.scene.time.now >= this.ultimateReadyAt && this.scene.run.ki >= (def.ultimate?.kiCost ?? 0);
  }

  ultimateCooldownFraction(): number {
    const def = getWeapon(this.ultimateId());
    const left = this.ultimateReadyAt - this.scene.time.now;
    return left <= 0 ? 0 : Math.min(1, left / def.levels[0].cooldown);
  }

  castUltimate(): boolean {
    if (!this.canUltimate()) return false;
    const def = getWeapon(this.ultimateId());
    const st = def.levels[0];
    const s = this.stats();
    this.scene.run.ki -= def.ultimate?.kiCost ?? 0;
    this.ultimateReadyAt = this.scene.time.now + st.cooldown * s.cooldownMul;
    this.ultimateBusy = true;
    const p = this.scene.player;
    this.scene.toast(`¡${def.name}!`, '#9fe6ff', true);
    audio.play('transform');
    const ball = this.scene.add.image(p.x, p.y - 90, 'glow').setTint(def.color).setBlendMode('ADD').setDepth(DEPTH.effect + 5).setScale(0.3);
    const core = this.scene.add.image(p.x, p.y - 90, 'kiball').setBlendMode('ADD').setDepth(DEPTH.effect + 6).setScale(0.5);
    const radius = st.range * s.areaMul;
    this.scene.tweens.add({ targets: [ball], scale: radius / 40, duration: st.duration });
    this.scene.tweens.add({ targets: [core], scale: radius / 18, duration: st.duration });
    const gather = this.scene.time.addEvent({
      delay: 60,
      repeat: Math.floor(st.duration / 60),
      callback: () => {
        ball.setPosition(p.x, p.y - 90);
        core.setPosition(p.x, p.y - 90);
        this.scene.effects.sparks(p.x + Phaser.Math.Between(-200, 200), p.y + Phaser.Math.Between(-200, 120), def.color, 2);
      },
    });
    this.scene.time.delayedCall(st.duration, () => {
      gather.remove();
      const target = this.nearestEnemy(700);
      const tx = target ? target.x : p.x + p.facing.x * 220;
      const ty = target ? target.y : p.y + p.facing.y * 220;
      this.scene.tweens.add({
        targets: [ball, core],
        x: tx,
        y: ty,
        duration: 420,
        ease: 'Quad.easeIn',
        onComplete: () => {
          ball.destroy();
          core.destroy();
          this.ultimateBusy = false;
          this.scene.effects.explosion(tx, ty, radius, def.color, 0.012);
          this.scene.effects.flash(0xcff4ff, 220);
          audio.play('explode');
          this.scene.enemies.damageInCircle(tx, ty, radius, () => this.roll(st.damage, false), 420);
          for (const d of this.scene.world.destructibles) {
            if (d.alive && Math.hypot(d.img.x - tx, d.img.y - ty) < radius) this.hitDestructible(d, 999);
          }
        },
      });
    });
    return true;
  }

  clearOrbs(): void {
    for (const o of this.orbs) o.img.destroy();
    this.orbs = [];
  }
}

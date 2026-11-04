import Phaser from 'phaser';
import { getWeapon } from '../../data/attacks';
import type { WeaponDef, WeaponFx, WeaponLevelStats } from '../../data/types';
import { audio } from '../../services/audioService';
import { DEPTH, MAX_SHOTS_POOL } from '../constants';
import type { Enemy } from '../entities/Enemy';
import { pointInArc, pointInBeam, rollDamage } from '../logic/combat';
import { activeWeapons } from '../logic/slots';
import type { PlayerStats } from '../logic/stats';
import type { GameScene } from '../scenes/GameScene';
import type { Destructible } from '../world/InfiniteWorld';

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
  fx: WeaponFx = {};
  /** las sub-balas no se vuelven a dividir */
  child = false;
  hits = new Set<number>();
}

interface Orb {
  img: Phaser.GameObjects.Image;
}

/**
 * Ataques automáticos. Solo disparan los ataques del hueco seleccionado (run.selected);
 * todos los ataques vinculados en ese hueco disparan juntos, cada uno con su propia recarga.
 * Las recargas se conservan al cambiar de hueco.
 */
export class WeaponSystem {
  readonly shots: Phaser.Physics.Arcade.Group;
  /** id -> momento en que puede volver a disparar */
  readonly nextFire = new Map<string, number>();
  private orbs = new Map<string, { list: Orb[]; until: number; angle: number }>();
  private orbHitAt = new Map<number, number>();
  ultimateReadyAt = 0;
  private ultimateBusy = false;
  /** contador de disparos (pruebas) */
  readonly fired = new Map<string, number>();

  constructor(private scene: GameScene) {
    this.shots = scene.physics.add.group({ classType: Shot, maxSize: MAX_SHOTS_POOL, runChildUpdate: false });
  }

  private stats(): PlayerStats {
    return this.scene.stats;
  }

  /** Estadísticas efectivas (con la evolución aplicada si la tiene). */
  eff(def: WeaponDef, lvl: number): WeaponLevelStats {
    const st = def.levels[Math.min(def.levels.length, Math.max(1, lvl)) - 1];
    if (def.evolution && this.scene.run.evolved[def.id]) return { ...st, ...def.evolution.stats };
    return st;
  }

  fxOf(def: WeaponDef): WeaponFx {
    if (def.evolution && this.scene.run.evolved[def.id]) return { ...def.fx, ...def.evolution.fx };
    return def.fx ?? {};
  }

  private colorOf(def: WeaponDef): number {
    if (def.evolution && this.scene.run.evolved[def.id] && def.evolution.color) return def.evolution.color;
    return def.color;
  }

  private roll(base: number, physical: boolean) {
    const s = this.stats();
    return rollDamage(base, physical ? s.physicalMul : s.energyMul, s.crit, s.critMul, Math.random);
  }

  /** Aplica efectos de control y robo de vida tras golpear. */
  private onHitFx(e: Enemy, fx: WeaponFx, dealt: number): void {
    if (fx.stun || fx.slow) this.scene.enemies.applyControl(e, fx.stun, fx.slow);
    if (fx.lifesteal) this.scene.heal(dealt * fx.lifesteal, false);
  }

  private hit(e: Enemy, base: number, physical: boolean, fx: WeaponFx, fromX: number, fromY: number, knock: number): void {
    const d = this.roll(base, physical);
    this.onHitFx(e, fx, d.amount);
    this.scene.enemies.damage(e, d.amount, d.crit, fromX, fromY, knock);
  }

  nearestEnemy(range: number, fromX = this.scene.player.x, fromY = this.scene.player.y): Enemy | null {
    let best: Enemy | null = null;
    let bestD = range * range;
    for (const e of this.scene.enemies.group.getChildren() as Enemy[]) {
      if (!e.active) continue;
      const d = (e.x - fromX) ** 2 + (e.y - fromY) ** 2;
      if (d < bestD) {
        bestD = d;
        best = e;
      }
    }
    return best;
  }

  /** Recarga restante (0-1) de un ataque, para la interfaz. */
  cooldownFraction(id: string): number {
    const def = getWeapon(id);
    const st = this.eff(def, this.scene.run.weapons[id] ?? 1);
    const left = (this.nextFire.get(id) ?? 0) - this.scene.time.now;
    return left <= 0 ? 0 : Math.min(1, left / (st.cooldown * this.stats().cooldownMul));
  }

  update(now: number, dt: number): void {
    const s = this.stats();
    for (const id of activeWeapons(this.scene.run)) {
      const def = getWeapon(id);
      if (def.ultimate) continue;
      if (now < (this.nextFire.get(id) ?? 0)) continue;
      const st = this.eff(def, this.scene.run.weapons[id] ?? 1);
      const fired = this.fire(def, st, now);
      if (fired) this.fired.set(id, (this.fired.get(id) ?? 0) + 1);
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
        return this.firePiercing(def, st);
      case 'melee':
        return this.fireMelee(def, st);
      case 'beam':
        return this.fireBeam(def, st);
      case 'shockwave':
        return this.fireShockwave(def, st);
      case 'orbit':
        return this.fireOrbit(def, st, now);
      case 'bomb':
        return this.fireBlast(def, st);
      default:
        return false;
    }
  }

  private spawnShot(def: WeaponDef, st: WeaponLevelStats, x: number, y: number, angle: number, opts: { homing?: boolean; scale?: number; child?: boolean; dmg?: number } = {}): Shot | null {
    const s = this.stats();
    const fx = this.fxOf(def);
    const tex = fx.texture ?? 'kiball';
    const shot = this.shots.get(x, y, tex) as Shot | null;
    if (!shot) return null;
    shot.enableBody(true, x, y, true, true);
    shot.setTexture(tex);
    const tint = def.behavior === 'piercing' || fx.texture ? this.colorOf(def) : (s.projectileTint ?? this.colorOf(def));
    shot.setTint(tint).setBlendMode(tex === 'dragon' ? 'NORMAL' : 'ADD').setDepth(DEPTH.effect - 2);
    shot.setScale((opts.scale ?? 1) * st.area * s.areaMul);
    shot.setRotation(angle);
    const body = shot.body as Phaser.Physics.Arcade.Body;
    body.setSize(shot.width * 0.7, shot.height * 0.7, true);
    shot.weaponId = def.id;
    shot.dmg = opts.dmg ?? st.damage;
    shot.physical = def.damageType === 'physical';
    shot.pierce = st.pierce + (def.behavior === 'piercing' ? 0 : s.pierceBonus);
    shot.knock = def.knockback ?? 40;
    shot.speed = st.speed;
    shot.homing = !!opts.homing || !!fx.homing;
    shot.turnRate = 5;
    shot.fx = fx;
    shot.child = !!opts.child;
    shot.expireAt = this.scene.time.now + st.duration;
    shot.hits.clear();
    shot.setVelocity(Math.cos(angle) * st.speed, Math.sin(angle) * st.speed);
    return shot;
  }

  private fireProjectiles(def: WeaponDef, st: WeaponLevelStats, homing: boolean): boolean {
    const target = this.nearestEnemy(st.range);
    if (!target) return false;
    const p = this.scene.player;
    const fx = this.fxOf(def);
    const base = Math.atan2(target.y - p.y, target.x - p.x);
    const count = st.count + this.stats().amount;
    for (let i = 0; i < count; i++) {
      // ring: en todas direcciones · normal: abanico hacia el objetivo
      const a = fx.ring ? base + (i / count) * Math.PI * 2 : base + (i - (count - 1) / 2) * (homing ? 0.9 : 0.16);
      this.spawnShot(def, st, p.x, p.y - 6, a, { homing });
    }
    p.showAttack(120);
    audio.play('shoot');
    return true;
  }

  private firePiercing(def: WeaponDef, st: WeaponLevelStats): boolean {
    const target = this.nearestEnemy(st.range);
    if (!target) return false;
    const p = this.scene.player;
    const base = Math.atan2(target.y - p.y, target.x - p.x);
    for (let i = 0; i < st.count; i++) {
      const a = base + (i === 0 ? 0 : ((i % 2 ? 1 : -1) * Math.ceil(i / 2) * Math.PI) / Math.max(2, st.count));
      this.spawnShot(def, st, p.x, p.y - 6, a, { scale: 1.2 });
    }
    this.scene.effects.sparks(p.x, p.y, this.colorOf(def), 12);
    p.showAttack(250);
    audio.play(def.damageType === 'physical' ? 'punch' : 'shoot');
    return true;
  }

  private fireMelee(def: WeaponDef, st: WeaponLevelStats): boolean {
    const s = this.stats();
    const fx = this.fxOf(def);
    const radius = st.range * st.area * s.areaMul;
    const target = this.nearestEnemy(radius + 50);
    if (!target) return false;
    const p = this.scene.player;
    const color = this.colorOf(def);
    for (let i = 0; i < st.count; i++) {
      this.scene.time.delayedCall(i * 100, () => {
        const t = target.active ? target : this.nearestEnemy(radius + 50);
        const angle = t ? Math.atan2(t.y - p.y, t.x - p.x) : Math.atan2(p.facing.y, p.facing.x);
        const ox = p.x;
        const oy = p.y;
        if (fx.full) {
          this.scene.effects.ring(ox, oy, radius, color, 180);
        } else {
          const slash = this.scene.add
            .image(ox + Math.cos(angle) * 18, oy + Math.sin(angle) * 18, 'slash')
            .setOrigin(0.15, 0.5)
            .setRotation(angle)
            .setTint(color)
            .setBlendMode('ADD')
            .setDepth(DEPTH.effect)
            .setScale(radius / 40);
          this.scene.tweens.add({ targets: slash, alpha: 0, scale: slash.scale * 1.2, duration: 160, onComplete: () => slash.destroy() });
        }
        p.showAttack(110);
        audio.play('punch');
        const half = fx.full ? Math.PI : 1.05;
        for (const e of this.scene.enemies.group.getChildren() as Enemy[]) {
          if (!e.active) continue;
          if (pointInArc(e.x, e.y, ox, oy, angle, radius + (e.boss ? 24 : 8), half)) {
            this.hit(e, st.damage, def.damageType === 'physical', fx, ox, oy, def.knockback ?? 0);
            this.scene.effects.sparks(e.x, e.y, 0xffffff, 3);
            if (fx.explode) this.explodeAt(e.x, e.y, fx.explode, st.damage * 0.5, def, fx);
          }
        }
        if (fx.split && i === st.count - 1) {
          for (let k = 0; k < fx.split; k++) this.spawnShot(def, { ...st, speed: 420, duration: 700, pierce: 3 }, ox, oy, angle + (k - (fx.split - 1) / 2) * 0.5, { child: true, dmg: st.damage * 0.5, scale: 0.8 });
        }
        for (const d of this.scene.world.destructibles) {
          if (d.alive && pointInArc(d.img.x, d.img.y - 10, ox, oy, angle, radius + 16, half)) this.hitDestructible(d, st.damage);
        }
      });
    }
    return true;
  }

  private fireBeam(def: WeaponDef, st: WeaponLevelStats): boolean {
    const target = this.nearestEnemy(st.range);
    if (!target) return false;
    const fx = this.fxOf(def);
    const p = this.scene.player;
    const base = Math.atan2(target.y - p.y, target.x - p.x);
    const n = fx.beams ?? 1;
    // 2 rayos = cruz (opuestos), 3+ = abanico
    const angles = n === 2 ? [base, base + Math.PI] : Array.from({ length: n }, (_, i) => base + (i - (n - 1) / 2) * 0.35);
    this.castBeam(def, st, angles, fx, 320);
    return true;
  }

  /** Rayo (o varios) desde el jugador: carga, daña en 3 golpes y sigue al jugador. */
  private castBeam(def: WeaponDef, st: WeaponLevelStats, angles: number[], fx: WeaponFx, chargeMs: number, huge = false): void {
    const s = this.stats();
    const p = this.scene.player;
    const halfW = 14 * st.area * s.areaMul;
    const length = st.range;
    const color = s.projectileTint && !def.ultimate ? s.projectileTint : this.colorOf(def);
    const charge = this.scene.add.image(p.x, p.y, 'glow').setTint(color).setBlendMode('ADD').setDepth(DEPTH.effect).setScale(0.1);
    this.scene.tweens.add({ targets: charge, scale: halfW / 20, duration: chargeMs });
    p.showAttack(chargeMs + st.duration);
    this.scene.time.delayedCall(chargeMs, () => {
      charge.destroy();
      audio.play('beam');
      const parts: Phaser.GameObjects.Image[] = [];
      for (const angle of angles) {
        parts.push(
          this.scene.add.image(p.x, p.y, 'beam').setOrigin(0, 0.5).setRotation(angle).setTint(color).setBlendMode('ADD').setDepth(DEPTH.effect).setDisplaySize(length, halfW * 2.4),
          this.scene.add.image(p.x, p.y, 'beam').setOrigin(0, 0.5).setRotation(angle).setBlendMode('ADD').setDepth(DEPTH.effect + 1).setDisplaySize(length, halfW),
        );
      }
      this.scene.cameras.main.shake(st.duration, huge ? 0.008 : 0.002);
      if (huge) this.scene.effects.flash(color, 200);
      const ticks = 3;
      for (let i = 0; i < ticks; i++) {
        this.scene.time.delayedCall((i * st.duration) / ticks, () => {
          const ox = p.x;
          const oy = p.y;
          for (const angle of angles) {
            for (const e of this.scene.enemies.group.getChildren() as Enemy[]) {
              if (!e.active) continue;
              if (pointInBeam(e.x, e.y, ox, oy, angle, length, halfW + (e.boss ? 24 : 6))) {
                this.hit(e, st.damage, false, fx, ox, oy, 60);
                if (fx.explode && i === ticks - 1 && Math.random() < 0.35) this.explodeAt(e.x, e.y, fx.explode, st.damage * 0.4, def, {});
              }
            }
            for (const ds of this.scene.world.destructibles) {
              if (ds.alive && pointInBeam(ds.img.x, ds.img.y - 10, ox, oy, angle, length, halfW + 12)) this.hitDestructible(ds, st.damage);
            }
          }
        });
      }
      const follow = this.scene.time.addEvent({ delay: 16, loop: true, callback: () => parts.forEach((b) => b.setPosition(p.x, p.y)) });
      this.scene.tweens.add({
        targets: parts,
        alpha: { from: 1, to: 0 },
        delay: st.duration * 0.7,
        duration: st.duration * 0.3 + 120,
        onComplete: () => {
          follow.remove();
          parts.forEach((b) => b.destroy());
        },
      });
    });
  }

  private fireShockwave(def: WeaponDef, st: WeaponLevelStats): boolean {
    const s = this.stats();
    const fx = this.fxOf(def);
    const radius = st.range * st.area * s.areaMul;
    if (!this.nearestEnemy(radius + 40)) return false;
    const p = this.scene.player;
    const pulses = fx.pulses ?? 1;
    for (let k = 0; k < pulses; k++) {
      this.scene.time.delayedCall(k * 260, () => {
        this.scene.effects.ring(p.x, p.y, radius, this.colorOf(def), 300);
        this.scene.effects.sparks(p.x, p.y, 0xffffff, 10);
        audio.play('explode');
        this.scene.enemies.damageInCircle(p.x, p.y, radius, () => this.roll(st.damage, def.damageType === 'physical'), def.knockback ?? 300, (e) => this.onHitFx(e, fx, st.damage));
        for (const ds of this.scene.world.destructibles) {
          if (ds.alive && Math.hypot(ds.img.x - p.x, ds.img.y - p.y) < radius) this.hitDestructible(ds, st.damage);
        }
        for (const b of this.scene.enemies.bullets.getChildren() as Phaser.Physics.Arcade.Image[]) {
          if (b.active && Math.hypot(b.x - p.x, b.y - p.y) < radius) b.disableBody(true, true);
        }
      });
    }
    return true;
  }

  /** Explosión en el enemigo cercano (Kikoho y similares). */
  private fireBlast(def: WeaponDef, st: WeaponLevelStats): boolean {
    const s = this.stats();
    const fx = this.fxOf(def);
    const target = this.nearestEnemy(260);
    if (!target) return false;
    const radius = st.range * s.areaMul;
    const p = this.scene.player;
    p.showAttack(200);
    const pulses = fx.pulses ?? 1;
    for (let k = 0; k < pulses; k++) {
      this.scene.time.delayedCall(k * 220, () => {
        const t = target.active ? target : this.nearestEnemy(300);
        if (!t) return;
        this.explodeAt(t.x, t.y, radius, st.damage, def, fx);
      });
    }
    return true;
  }

  private explodeAt(x: number, y: number, radius: number, dmg: number, def: WeaponDef, fx: WeaponFx): void {
    this.scene.effects.explosion(x, y, radius, this.colorOf(def), radius > 80 ? 0.004 : 0);
    audio.play('explode');
    this.scene.enemies.damageInCircle(x, y, radius, () => this.roll(dmg, def.damageType === 'physical'), 160, (e) => this.onHitFx(e, fx, dmg));
    for (const d of this.scene.world.destructibles) if (d.alive && Math.hypot(d.img.x - x, d.img.y - y) < radius) this.hitDestructible(d, dmg);
  }

  private fireOrbit(def: WeaponDef, st: WeaponLevelStats, now: number): boolean {
    const s = this.stats();
    let o = this.orbs.get(def.id);
    if (!o) {
      o = { list: [], until: 0, angle: 0 };
      this.orbs.set(def.id, o);
    }
    while (o.list.length < st.count) o.list.push({ img: this.scene.add.image(0, 0, 'kiball').setBlendMode('ADD').setDepth(DEPTH.effect - 1) });
    for (const orb of o.list) orb.img.setTint(this.colorOf(def)).setScale(1.6 * st.area * s.areaMul).setVisible(true);
    o.until = now + st.duration;
    return true;
  }

  private updateOrbs(now: number, dt: number): void {
    const s = this.stats();
    const p = this.scene.player;
    const active = new Set(activeWeapons(this.scene.run));
    for (const [id, o] of this.orbs) {
      const def = getWeapon(id);
      const st = this.eff(def, this.scene.run.weapons[id] ?? 1);
      const fx = this.fxOf(def);
      // Las esferas solo giran mientras su hueco está seleccionado.
      const on = active.has(id) && now < o.until;
      o.angle += dt * st.speed;
      const radius = st.range * s.areaMul;
      const hitR = 16 * st.area * s.areaMul;
      o.list.forEach((orb, i) => {
        if (!on || i >= st.count) {
          orb.img.setVisible(false);
          return;
        }
        const a = o.angle + (i / st.count) * Math.PI * 2;
        const x = p.x + Math.cos(a) * radius;
        const y = p.y - 6 + Math.sin(a) * radius;
        orb.img.setVisible(true).setPosition(x, y);
        for (const e of this.scene.enemies.group.getChildren() as Enemy[]) {
          if (!e.active) continue;
          const rr = hitR + (e.boss ? 24 : 8);
          if ((e.x - x) ** 2 + (e.y - y) ** 2 > rr * rr) continue;
          const key = e.uid * 100 + i;
          if ((this.orbHitAt.get(key) ?? 0) > now) continue;
          this.orbHitAt.set(key, now + 450);
          this.hit(e, st.damage, false, fx, p.x, p.y, def.knockback ?? 0);
        }
        for (const b of this.scene.enemies.bullets.getChildren() as Phaser.Physics.Arcade.Image[]) {
          if (b.active && (b.x - x) ** 2 + (b.y - y) ** 2 < (hitR + 6) ** 2) {
            b.disableBody(true, true);
            this.scene.effects.sparks(x, y, def.color, 3);
          }
        }
      });
    }
    if (this.orbHitAt.size > 4000) this.orbHitAt.clear();
  }

  private updateShots(now: number, dt: number): void {
    for (const shot of this.shots.getChildren() as Shot[]) {
      if (!shot.active) continue;
      if (now >= shot.expireAt) {
        if (shot.fx.explode && !shot.child) this.explodeAt(shot.x, shot.y, shot.fx.explode * 0.7, shot.dmg * 0.5, getWeapon(shot.weaponId), shot.fx);
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
    const def = getWeapon(shot.weaponId);
    const d = this.roll(shot.dmg, shot.physical);
    this.onHitFx(e, shot.fx, d.amount);
    this.scene.enemies.damage(e, d.amount, d.crit, shot.x, shot.y, shot.knock);
    this.scene.effects.sparks(shot.x, shot.y, shot.tintTopLeft, 4);
    audio.play(d.crit ? 'crit' : 'hit');
    if (shot.fx.explode) this.explodeAt(shot.x, shot.y, shot.fx.explode, shot.dmg * 0.6, def, {});
    if (shot.fx.split && !shot.child) {
      const st = this.eff(def, this.scene.run.weapons[def.id] ?? 1);
      const base = Math.random() * Math.PI * 2;
      for (let k = 0; k < shot.fx.split; k++) {
        this.spawnShot(def, { ...st, speed: Math.max(300, st.speed), duration: 800, pierce: 1, area: st.area * 0.6 }, shot.x, shot.y, base + (k / shot.fx.split) * Math.PI * 2, {
          child: true,
          dmg: shot.dmg * 0.45,
          homing: true,
        });
      }
    }
    shot.pierce -= 1;
    if (shot.pierce <= 0) shot.disableBody(true, true);
  }

  onShotHitDestructible(shot: Shot, d: Destructible): void {
    if (!shot.active || !d.alive) return;
    this.hitDestructible(d, shot.dmg);
    if (getWeapon(shot.weaponId).behavior !== 'piercing') shot.disableBody(true, true);
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
      const x = d.img.x;
      const y = d.img.y - 10;
      this.scene.world.breakDestructible(d);
      this.scene.loot.onDestructibleBroken(x, y);
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
    this.scene.toast(`¡${def.name}!`, '#9fe6ff', true);
    audio.play('transform');
    const p = this.scene.player;
    if (def.behavior === 'beam') {
      const target = this.nearestEnemy(900);
      const angle = target ? Math.atan2(target.y - p.y, target.x - p.x) : Math.atan2(p.facing.y, p.facing.x);
      p.invulnUntil = Math.max(p.invulnUntil, this.scene.time.now + 900 + st.duration);
      this.castBeam(def, st, [angle], {}, 900, true);
      return true;
    }
    this.ultimateBusy = true;
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
    for (const o of this.orbs.values()) for (const orb of o.list) orb.img.destroy();
    this.orbs.clear();
  }
}

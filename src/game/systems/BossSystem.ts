import Phaser from 'phaser';
import { getBoss } from '../../data/bosses';
import { CHEST_NAMES } from '../../data/items';
import type { BossDef, BossPattern } from '../../data/types';
import { audio } from '../../services/audioService';
import { DEPTH } from '../constants';
import type { Enemy } from '../entities/Enemy';
import { pointInBeam, pointInCircle } from '../logic/combat';
import { bossHpMul } from '../logic/spawn';
import type { GameScene } from '../scenes/GameScene';

/** Jefes: calendario de aparición, fases, patrones con aviso previo y recompensas. */
export class BossSystem {
  private schedule: { bossId: string; at: number }[];
  private nextIdx = 0;
  private loop = 0;
  private loopNextAt = 0;
  boss: Enemy | null = null;
  private def: BossDef | null = null;
  private phase = 0;
  private nextPatternAt = 0;
  private patternIdx = 0;
  private busyUntil = 0;
  private invulnUntil = 0;
  private dashUntil = 0;

  constructor(private scene: GameScene) {
    this.schedule = [...scene.mapDef.bosses].sort((a, b) => a.at - b.at);
  }

  isInvulnerable(): boolean {
    return this.scene.time.now < this.invulnUntil;
  }

  current(): { def: BossDef; enemy: Enemy } | null {
    return this.boss && this.def && this.boss.active ? { def: this.def, enemy: this.boss } : null;
  }

  update(): void {
    const t = this.scene.run.time;
    const now = this.scene.time.now;
    if (!this.current()) {
      if (this.nextIdx < this.schedule.length && t >= this.schedule[this.nextIdx].at) {
        this.spawn(this.schedule[this.nextIdx].bossId);
        this.nextIdx++;
      } else if (this.nextIdx >= this.schedule.length && this.schedule.length > 0) {
        if (this.loopNextAt === 0) this.loopNextAt = t + 120;
        if (t >= this.loopNextAt) {
          this.loop++;
          this.loopNextAt = t + 150;
          const pick = this.schedule[Math.floor(Math.random() * this.schedule.length)];
          this.spawn(pick.bossId);
        }
      }
      return;
    }
    const b = this.boss!;
    const def = this.def!;
    const ph = def.phases[this.phase];
    const p = this.scene.player;
    const dx = p.x - b.x;
    const dy = p.y - b.y;
    const dist = Math.hypot(dx, dy) || 1;
    b.setFlipX(dx < 0);

    if (now < this.dashUntil) return;
    if (now < this.busyUntil) {
      b.setVelocity(0, 0);
      return;
    }
    // Mantener distancia media
    const speed = def.speed * ph.speedMul;
    let v = 0;
    if (dist > 230) v = speed;
    else if (dist < 130) v = -speed * 0.6;
    if (dist > 1400) {
      // Si el jugador se aleja demasiado, el jefe se teletransporta cerca.
      const pt = this.scene.enemies.ringPoint(-60);
      if (pt) b.setPosition(pt.x, pt.y);
    }
    b.setVelocity((dx / dist) * v, (dy / dist) * v);

    if (now >= this.nextPatternAt) {
      const pattern = ph.patterns[this.patternIdx % ph.patterns.length];
      this.patternIdx++;
      this.nextPatternAt = now + ph.patternCooldown;
      this.runPattern(pattern, b, def);
    }
  }

  private spawn(bossId: string): void {
    const def = getBoss(bossId);
    const pt = this.scene.enemies.ringPoint(-40) ?? { x: this.scene.player.x + 300, y: this.scene.player.y };
    const hp = Math.round(def.hp * bossHpMul(this.scene.run.time, this.loop, this.scene.diff));
    const e = this.scene.enemies.spawnBoss(def, pt.x, pt.y, hp);
    if (!e) return;
    this.boss = e;
    this.def = def;
    this.phase = 0;
    this.patternIdx = 0;
    this.nextPatternAt = this.scene.time.now + 1500;
    this.busyUntil = 0;
    this.dashUntil = 0;
    audio.play('boss');
    this.scene.effects.flash(0xff4a4a, 250);
    const final = def.chest === 'divine';
    this.scene.toast(
      `${final ? '☠ JEFE DEFINITIVO' : def.mini ? 'Miniboss' : '¡JEFE!'}: ${def.name}${this.loop > 0 ? ` (poder x${Math.pow(1.7, this.loop).toFixed(1)})` : ''}`,
      final ? '#ff3a3a' : '#ff6a6a',
      true,
    );
  }

  onBossDamaged(e: Enemy): void {
    const def = this.def;
    if (!def || e !== this.boss) return;
    const ratio = e.hp / e.maxHp;
    let next = this.phase;
    while (next + 1 < def.phases.length && ratio <= def.phases[next + 1].hpBelow) next++;
    if (next !== this.phase) {
      this.phase = next;
      const ph = def.phases[next];
      this.invulnUntil = this.scene.time.now + 1200;
      this.busyUntil = this.scene.time.now + 1200;
      this.nextPatternAt = this.scene.time.now + 1400;
      this.patternIdx = 0;
      e.textureBase = `boss_${def.id}_${next}`;
      e.setTexture(e.textureBase, '4');
      e.play(`${e.textureBase}_side`, true);
      e.setScale(ph.scale ?? def.scale);
      this.scene.effects.explosion(e.x, e.y, 120, ph.color, 0.008);
      this.scene.effects.flash(0xffffff, 300);
      audio.play('transform');
      this.scene.toast(ph.name ? `¡${ph.name}!` : `${def.name} se enfurece`, '#ffb04a', true);
    }
  }

  onBossKilled(def: BossDef, x: number, y: number): void {
    this.scene.telegraphs.clear();
    this.scene.effects.explosion(x, y, 180, 0xffe08a, 0.015);
    this.scene.effects.flash(0xffffff, 400);
    audio.play('explode');
    this.scene.run.bossesDefeated.push(def.id);
    this.scene.run.kills += 1;
    // Los jefes dan tickets de invocación (miniboss 1, jefe 2).
    const tickets = def.chest === 'divine' ? 8 : def.mini ? 1 : 2;
    this.scene.run.tickets += tickets;
    this.scene.effects.floatText(x, y - 60, `+${tickets} 🎫`, '#ffd84a');
    // Los jefes (no los minibosses) dan un Vínculo de Ki.
    if (!def.mini) this.scene.grantLink(`${def.name} soltó un Vínculo de Ki`);
    this.scene.loot.spawnChest(x, y, def.chest, false, true);
    for (let i = 0; i < 14; i++) this.scene.loot.dropGem(x + Phaser.Math.Between(-60, 60), y + Phaser.Math.Between(-60, 60), def.mini ? 8 : 20);
    for (let i = 0; i < 8; i++) this.scene.loot.dropGem(x + Phaser.Math.Between(-50, 50), y + Phaser.Math.Between(-50, 50), def.mini ? 5 : 12, true);
    this.scene.toast(`¡${def.name} derrotado! Cofre ${CHEST_NAMES[def.chest]}`, '#ffd84a', true);
    this.boss = null;
    this.def = null;
  }

  private runPattern(pattern: BossPattern, b: Enemy, def: BossDef): void {
    const ph = def.phases[this.phase];
    const p = this.scene.player;
    const now = this.scene.time.now;
    const dmg = b.damage;
    const tg = this.scene.telegraphs;
    if (ph.attackName && (pattern === 'beam' || pattern === 'big_ball')) this.scene.toast(ph.attackName, '#ffd0a0');
    switch (pattern) {
      case 'volley': {
        this.busyUntil = now + 400;
        const base = Math.atan2(p.y - b.y, p.x - b.x);
        for (let i = 0; i < 5; i++) this.scene.enemies.fireBullet(b.x, b.y - 10, base + (i - 2) * 0.22, 250, dmg * 0.6, ph.color, 1.4);
        audio.play('shoot');
        break;
      }
      case 'ring': {
        this.busyUntil = now + 500;
        const n = 16;
        const off = Math.random();
        for (let i = 0; i < n; i++) this.scene.enemies.fireBullet(b.x, b.y - 10, ((i + off) / n) * Math.PI * 2, 200, dmg * 0.5, ph.color, 1.3);
        this.scene.effects.ring(b.x, b.y, 80, ph.color);
        audio.play('shoot');
        break;
      }
      case 'beam': {
        this.busyUntil = now + 1300;
        const angle = Math.atan2(p.y - b.y, p.x - b.x);
        const ox = b.x;
        const oy = b.y;
        audio.play('warning');
        tg.rect(ox, oy, angle, 820, 34, 950, () => {
          if (!b.active) return;
          audio.play('beam');
          const beam = this.scene.add
            .image(ox, oy, 'beam')
            .setOrigin(0, 0.5)
            .setRotation(angle)
            .setTint(ph.color)
            .setBlendMode('ADD')
            .setDepth(DEPTH.effect)
            .setDisplaySize(820, 80);
          this.scene.tweens.add({ targets: beam, alpha: 0, duration: 380, onComplete: () => beam.destroy() });
          this.scene.cameras.main.shake(200, 0.006);
          if (pointInBeam(p.x, p.y, ox, oy, angle, 820, 40)) this.scene.damagePlayer(dmg * 1.8);
        }, ph.color);
        break;
      }
      case 'dash': {
        const angle = Math.atan2(p.y - b.y, p.x - b.x);
        const len = Math.min(560, Math.hypot(p.x - b.x, p.y - b.y) + 120);
        this.busyUntil = now + 600;
        tg.rect(b.x, b.y, angle, len, 24, 550, () => {
          if (!b.active) return;
          const sp = 900;
          b.setVelocity(Math.cos(angle) * sp, Math.sin(angle) * sp);
          this.dashUntil = this.scene.time.now + (len / sp) * 1000;
          this.scene.effects.smoke(b.x, b.y, 0xffffff, 6);
          audio.play('dodge');
          this.scene.time.delayedCall((len / sp) * 1000, () => {
            if (b.active) b.setVelocity(0, 0);
          });
        }, 0xff8a3a);
        break;
      }
      case 'ground_burst': {
        this.busyUntil = now + 700;
        const spots = [{ x: p.x, y: p.y }];
        for (let i = 0; i < 5; i++) spots.push({ x: p.x + Phaser.Math.Between(-170, 170), y: p.y + Phaser.Math.Between(-170, 170) });
        audio.play('warning');
        spots.forEach((s, i) => {
          this.scene.time.delayedCall(i * 110, () =>
            tg.circle(s.x, s.y, 66, 1000, () => {
              this.scene.effects.explosion(s.x, s.y, 66, ph.color, 0.004);
              audio.play('explode');
              if (pointInCircle(p.x, p.y, s.x, s.y, 70)) this.scene.damagePlayer(dmg * 1.2);
            }, ph.color),
          );
        });
        break;
      }
      case 'big_ball': {
        this.busyUntil = now + 1800;
        const tx = p.x;
        const ty = p.y;
        const ball = this.scene.add.image(b.x, b.y - 60, 'glow').setTint(ph.color).setBlendMode('ADD').setDepth(DEPTH.effect).setScale(0.4);
        this.scene.tweens.add({ targets: ball, scale: 4, duration: 1100 });
        audio.play('warning');
        tg.circle(tx, ty, 160, 1700, () => {
          this.scene.tweens.add({
            targets: ball,
            x: tx,
            y: ty,
            duration: 200,
            onComplete: () => {
              ball.destroy();
              this.scene.effects.explosion(tx, ty, 160, ph.color, 0.014);
              audio.play('explode');
              if (pointInCircle(p.x, p.y, tx, ty, 165)) this.scene.damagePlayer(dmg * 2.6);
            },
          });
        }, ph.color);
        break;
      }
      case 'spiral': {
        // Espiral de balas: obliga a moverse en círculo.
        this.busyUntil = now + 1500;
        const base = Math.random() * Math.PI * 2;
        for (let w = 0; w < 6; w++) {
          this.scene.time.delayedCall(w * 220, () => {
            if (!b.active) return;
            for (let i = 0; i < 8; i++) this.scene.enemies.fireBullet(b.x, b.y - 10, base + w * 0.32 + (i / 8) * Math.PI * 2, 190, dmg * 0.45, ph.color, 1.2);
          });
        }
        audio.play('shoot');
        break;
      }
      case 'cross_beam': {
        // Cuatro rayos en cruz con aviso: hay que meterse entre ellos.
        this.busyUntil = now + 1500;
        const rot = Math.random() * Math.PI;
        const ox = b.x;
        const oy = b.y;
        audio.play('warning');
        for (let i = 0; i < 4; i++) {
          const angle = rot + (i * Math.PI) / 2;
          tg.rect(ox, oy, angle, 900, 30, 1100, () => {
            if (!b.active) return;
            const beam = this.scene.add.image(ox, oy, 'beam').setOrigin(0, 0.5).setRotation(angle).setTint(ph.color).setBlendMode('ADD').setDepth(DEPTH.effect).setDisplaySize(900, 70);
            this.scene.tweens.add({ targets: beam, alpha: 0, duration: 380, onComplete: () => beam.destroy() });
            if (pointInBeam(p.x, p.y, ox, oy, angle, 900, 34)) this.scene.damagePlayer(dmg * 1.6);
          }, ph.color);
        }
        this.scene.time.delayedCall(1100, () => {
          audio.play('beam');
          this.scene.cameras.main.shake(220, 0.007);
        });
        break;
      }
      case 'summon': {
        this.busyUntil = now + 600;
        const id = ph.summonId ?? 'saibaman';
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          this.scene.enemies.spawn(id, b.x + Math.cos(a) * 70, b.y + Math.sin(a) * 70);
        }
        this.scene.effects.ring(b.x, b.y, 100, 0x6aff6a);
        break;
      }
    }
  }
}

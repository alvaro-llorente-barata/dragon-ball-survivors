import Phaser from 'phaser';
import { DEPTH } from '../constants';

/** Partículas, números de daño, explosiones y temblores, con límites para el rendimiento. */
export class Effects {
  private emitters = new Map<string, Phaser.GameObjects.Particles.ParticleEmitter>();
  private texts: Phaser.GameObjects.Text[] = [];
  private textIdx = 0;
  private low: boolean;

  constructor(
    private scene: Phaser.Scene,
    quality: 'low' | 'high',
    private damageNumbers: boolean,
  ) {
    this.low = quality === 'low';
    for (let i = 0; i < 40; i++) {
      const t = scene.add
        .text(0, 0, '', {
          fontFamily: 'monospace',
          fontSize: '14px',
          fontStyle: 'bold',
          color: '#ffffff',
          stroke: '#1a1020',
          strokeThickness: 3,
        })
        .setOrigin(0.5)
        .setDepth(DEPTH.text)
        .setVisible(false);
      this.texts.push(t);
    }
  }

  private emitter(kind: 'spark' | 'debris' | 'smoke', color: number): Phaser.GameObjects.Particles.ParticleEmitter {
    const key = `${kind}_${color}`;
    let e = this.emitters.get(key);
    if (e) return e;
    const cfg: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig =
      kind === 'spark'
        ? {
            speed: { min: 60, max: 220 },
            lifespan: { min: 180, max: 380 },
            scale: { start: 0.7, end: 0 },
            blendMode: 'ADD',
            tint: color,
            emitting: false,
            maxAliveParticles: this.low ? 120 : 320,
          }
        : kind === 'debris'
          ? {
              speed: { min: 40, max: 160 },
              lifespan: { min: 300, max: 600 },
              scale: { start: 1.2, end: 0.2 },
              rotate: { min: 0, max: 360 },
              tint: color,
              emitting: false,
              maxAliveParticles: this.low ? 60 : 160,
            }
          : {
              speed: { min: 10, max: 50 },
              lifespan: { min: 500, max: 900 },
              scale: { start: 1.2, end: 2.4 },
              alpha: { start: 0.5, end: 0 },
              tint: color,
              emitting: false,
              maxAliveParticles: this.low ? 40 : 100,
            };
    e = this.scene.add.particles(0, 0, kind === 'debris' ? 'px' : 'spark', cfg);
    e.setDepth(DEPTH.effect);
    this.emitters.set(key, e);
    return e;
  }

  sparks(x: number, y: number, color: number, count = 6): void {
    this.emitter('spark', color).explode(this.low ? Math.ceil(count / 2) : count, x, y);
  }

  debris(x: number, y: number, color: number, count = 10): void {
    this.emitter('debris', color).explode(this.low ? Math.ceil(count / 2) : count, x, y);
  }

  smoke(x: number, y: number, color = 0xdddddd, count = 6): void {
    this.emitter('smoke', color).explode(this.low ? Math.ceil(count / 2) : count, x, y);
  }

  damageNumber(x: number, y: number, amount: number, crit: boolean, color?: string): void {
    if (!this.damageNumbers) return;
    const t = this.texts[this.textIdx];
    this.textIdx = (this.textIdx + 1) % this.texts.length;
    this.scene.tweens.killTweensOf(t);
    t.setText(String(amount))
      .setPosition(x + Phaser.Math.Between(-8, 8), y - 20)
      .setColor(color ?? (crit ? '#ffd84a' : '#ffffff'))
      .setFontSize(crit ? 18 : 13)
      .setAlpha(1)
      .setVisible(true);
    this.scene.tweens.add({
      targets: t,
      y: t.y - 26,
      alpha: 0,
      duration: 600,
      ease: 'Cubic.easeOut',
      onComplete: () => t.setVisible(false),
    });
  }

  floatText(x: number, y: number, text: string, color: string): void {
    const t = this.scene.add
      .text(x, y, text, { fontFamily: 'monospace', fontSize: '15px', fontStyle: 'bold', color, stroke: '#1a1020', strokeThickness: 4 })
      .setOrigin(0.5)
      .setDepth(DEPTH.text);
    this.scene.tweens.add({ targets: t, y: y - 40, alpha: 0, duration: 1200, onComplete: () => t.destroy() });
  }

  ring(x: number, y: number, radius: number, color: number, duration = 350): void {
    const r = this.scene.add.image(x, y, 'ring').setTint(color).setBlendMode('ADD').setDepth(DEPTH.effect).setScale(0.1);
    this.scene.tweens.add({
      targets: r,
      scale: (radius * 2) / 128,
      alpha: 0,
      duration,
      ease: 'Cubic.easeOut',
      onComplete: () => r.destroy(),
    });
  }

  explosion(x: number, y: number, radius: number, color: number, shake = 0.004): void {
    const g = this.scene.add.image(x, y, 'glow').setTint(color).setBlendMode('ADD').setDepth(DEPTH.effect).setScale(0.2);
    this.scene.tweens.add({
      targets: g,
      scale: (radius * 2.2) / 64,
      alpha: 0,
      duration: 420,
      ease: 'Cubic.easeOut',
      onComplete: () => g.destroy(),
    });
    this.ring(x, y, radius, color, 420);
    this.sparks(x, y, color, 16);
    this.debris(x, y, 0x6a5a4a, 8);
    if (shake > 0) this.scene.cameras.main.shake(180, shake);
  }

  flash(color = 0xffffff, duration = 150): void {
    const c = Phaser.Display.Color.IntegerToRGB(color);
    this.scene.cameras.main.flash(duration, c.r, c.g, c.b);
  }
}

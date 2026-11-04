import Phaser from 'phaser';
import { DEPTH } from '../constants';

type Dir = 'down' | 'up' | 'side';

/** Personaje controlado por el jugador: movimiento en 8 direcciones, animación y aura. */
export class Player {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  readonly aura: Phaser.GameObjects.Image;
  private auraSparks: Phaser.GameObjects.Particles.ParticleEmitter;
  private shieldImg: Phaser.GameObjects.Image;
  facing = new Phaser.Math.Vector2(1, 0);
  private dir: Dir = 'down';
  private textureKey: string;
  private attackUntil = 0;
  invulnUntil = 0;
  dodgeReadyAt = 0;
  private lightningAt = 0;

  constructor(
    private scene: Phaser.Scene,
    x: number,
    y: number,
    textureKey: string,
  ) {
    this.textureKey = textureKey;
    this.aura = scene.add.image(x, y, 'aura').setBlendMode('ADD').setVisible(false).setScale(1.6);
    this.sprite = scene.physics.add.sprite(x, y, textureKey, '0');
    this.sprite.setScale(2);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(10, 7);
    body.setOffset(5, 16);
    this.auraSparks = scene.add.particles(0, 0, 'spark', {
      follow: this.sprite,
      followOffset: { x: 0, y: 10 },
      speedY: { min: -120, max: -50 },
      speedX: { min: -30, max: 30 },
      lifespan: 420,
      scale: { start: 0.6, end: 0 },
      blendMode: 'ADD',
      frequency: 45,
      emitting: false,
      maxAliveParticles: 40,
    });
    this.shieldImg = scene.add.image(x, y, 'ring').setTint(0x8ab4ff).setBlendMode('ADD').setScale(0.55).setAlpha(0.7).setVisible(false);
  }

  get x(): number {
    return this.sprite.x;
  }

  get y(): number {
    return this.sprite.y;
  }

  setTextureKey(key: string): void {
    this.textureKey = key;
    this.sprite.setTexture(key, '0');
    this.sprite.anims.stop();
  }

  setAura(color: number | null, lightning: boolean): void {
    if (color === null) {
      this.aura.setVisible(false);
      this.auraSparks.stop();
      this.lightningAt = 0;
      return;
    }
    this.aura.setVisible(true).setTint(color);
    this.auraSparks.setParticleTint(color);
    this.auraSparks.start();
    this.lightningAt = lightning ? 1 : 0;
  }

  showAttack(ms: number): void {
    this.attackUntil = this.scene.time.now + ms;
  }

  update(move: Phaser.Math.Vector2, speed: number, now: number, shield: boolean): void {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const moving = move.lengthSq() > 0.01;
    if (moving) {
      const m = move.clone();
      if (m.lengthSq() > 1) m.normalize();
      body.setVelocity(m.x * speed, m.y * speed);
      this.facing.copy(m).normalize();
      if (Math.abs(m.x) > Math.abs(m.y) * 0.6) {
        this.dir = 'side';
        this.sprite.setFlipX(m.x < 0);
      } else {
        this.dir = m.y < 0 ? 'up' : 'down';
      }
    } else {
      body.setVelocity(0, 0);
    }

    if (now < this.attackUntil) {
      this.sprite.anims.stop();
      this.sprite.setFrame('6');
      this.sprite.setFlipX(this.facing.x < 0);
    } else if (moving) {
      this.sprite.anims.play(`${this.textureKey}_${this.dir}`, true);
      this.sprite.anims.timeScale = speed / 160;
    } else {
      this.sprite.anims.stop();
      this.sprite.setFrame(this.dir === 'down' ? '0' : this.dir === 'up' ? '2' : '4');
    }

    const blink = now < this.invulnUntil && Math.floor(now / 70) % 2 === 0;
    this.sprite.setAlpha(blink ? 0.45 : 1);
    this.sprite.setDepth(DEPTH.entity + this.sprite.y + 12);
    this.aura.setPosition(this.sprite.x, this.sprite.y - 4).setDepth(this.sprite.depth - 1);
    this.aura.setAlpha(0.55 + 0.25 * Math.sin(now / 90));
    this.aura.setScale(1.5 + 0.08 * Math.sin(now / 70), 1.6 + 0.1 * Math.sin(now / 55));
    this.shieldImg.setVisible(shield).setPosition(this.sprite.x, this.sprite.y).setDepth(this.sprite.depth + 1);

    // Rayos en el aura (Super Saiyan 2).
    if (this.lightningAt && this.aura.visible && Math.random() < 0.08) {
      const g = this.scene.add.graphics().setDepth(this.sprite.depth + 2);
      g.lineStyle(2, 0x9fe6ff, 1);
      let px = this.sprite.x + Phaser.Math.Between(-18, 18);
      let py = this.sprite.y - 30;
      g.beginPath();
      g.moveTo(px, py);
      for (let i = 0; i < 4; i++) {
        px += Phaser.Math.Between(-8, 8);
        py += 12;
        g.lineTo(px, py);
      }
      g.strokePath();
      this.scene.time.delayedCall(70, () => g.destroy());
    }
  }

  destroy(): void {
    this.auraSparks.destroy();
    this.aura.destroy();
    this.shieldImg.destroy();
    this.sprite.destroy();
  }
}

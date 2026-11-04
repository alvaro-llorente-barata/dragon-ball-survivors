import Phaser from 'phaser';
import { DEPTH } from '../constants';

interface Telegraph {
  g: Phaser.GameObjects.Graphics;
  shape: 'circle' | 'rect';
  x: number;
  y: number;
  r: number;
  angle: number;
  length: number;
  halfWidth: number;
  elapsed: number;
  delay: number;
  color: number;
  onFire: () => void;
}

/** Avisos visuales de ataques grandes: zona roja que se llena antes del impacto. */
export class TelegraphSystem {
  private list: Telegraph[] = [];

  constructor(private scene: Phaser.Scene) {}

  circle(x: number, y: number, r: number, delay: number, onFire: () => void, color = 0xff3030): void {
    this.add({ shape: 'circle', x, y, r, angle: 0, length: 0, halfWidth: 0, delay, onFire, color });
  }

  rect(x: number, y: number, angle: number, length: number, halfWidth: number, delay: number, onFire: () => void, color = 0xff3030): void {
    this.add({ shape: 'rect', x, y, r: 0, angle, length, halfWidth, delay, onFire, color });
  }

  private add(t: Omit<Telegraph, 'g' | 'elapsed'>): void {
    const g = this.scene.add.graphics().setDepth(DEPTH.telegraph);
    this.list.push({ ...t, g, elapsed: 0 });
  }

  update(dtMs: number): void {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const t = this.list[i];
      t.elapsed += dtMs;
      const p = Math.min(1, t.elapsed / t.delay);
      const pulse = 0.25 + 0.15 * Math.sin(t.elapsed / 60);
      t.g.clear();
      if (t.shape === 'circle') {
        t.g.fillStyle(t.color, pulse);
        t.g.fillCircle(t.x, t.y, t.r);
        t.g.fillStyle(t.color, 0.35);
        t.g.fillCircle(t.x, t.y, t.r * p);
        t.g.lineStyle(2, t.color, 0.9);
        t.g.strokeCircle(t.x, t.y, t.r);
      } else {
        t.g.save();
        t.g.translateCanvas(t.x, t.y);
        t.g.rotateCanvas(t.angle);
        t.g.fillStyle(t.color, pulse);
        t.g.fillRect(0, -t.halfWidth, t.length, t.halfWidth * 2);
        t.g.fillStyle(t.color, 0.35);
        t.g.fillRect(0, -t.halfWidth, t.length * p, t.halfWidth * 2);
        t.g.lineStyle(2, t.color, 0.9);
        t.g.strokeRect(0, -t.halfWidth, t.length, t.halfWidth * 2);
        t.g.restore();
      }
      if (t.elapsed >= t.delay) {
        t.g.destroy();
        this.list.splice(i, 1);
        t.onFire();
      }
    }
  }

  clear(): void {
    for (const t of this.list) t.g.destroy();
    this.list = [];
  }
}

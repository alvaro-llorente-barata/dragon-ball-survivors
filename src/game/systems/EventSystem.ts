import Phaser from 'phaser';
import { audio } from '../../services/audioService';
import { pointInCircle } from '../logic/combat';
import type { GameScene } from '../scenes/GameScene';

type EventId = 'meteor_shower' | 'saiyan_invasion' | 'freezer_army' | 'guarded_chest' | 'whis_training';

interface EventDef {
  id: EventId;
  name: string;
  description: string;
  duration: number;
  color: string;
  weight: number;
}

const EVENTS: EventDef[] = [
  { id: 'meteor_shower', name: 'Lluvia de meteoritos', description: '¡Esquiva las zonas rojas!', duration: 18, color: '#ff8a4a', weight: 3 },
  { id: 'saiyan_invasion', name: 'Invasión Saiyan', description: 'Oleadas de Saibamans. Sobrevive para ganar un cofre.', duration: 24, color: '#6aff6a', weight: 3 },
  { id: 'freezer_army', name: 'Ejército de Freezer', description: 'Muchos más enemigos. Recompensa: cofre épico.', duration: 28, color: '#c88aff', weight: 2 },
  { id: 'guarded_chest', name: 'Cofre legendario', description: 'Un cofre legendario protegido por élites. Mira el minimapa.', duration: 60, color: '#ffd84a', weight: 2 },
  { id: 'whis_training', name: 'Entrenamiento de Whis', description: 'EXP x2. Al terminar, mejora especial.', duration: 20, color: '#9fe6ff', weight: 2 },
];

/** Eventos aleatorios con aviso, duración y recompensa. */
export class EventSystem {
  private nextAt = 70;
  active: { def: EventDef; endsAt: number; tick: number } | null = null;

  constructor(private scene: GameScene) {}

  update(dt: number): void {
    const t = this.scene.run.time;
    if (!this.active) {
      if (t >= this.nextAt && !this.scene.bosses.current()) this.start(EVENTS[this.pick()]);
      return;
    }
    const ev = this.active;
    ev.tick -= dt;
    if (ev.tick <= 0) this.tick(ev.def.id);
    if (t >= ev.endsAt) this.finish();
  }

  remaining(): number {
    return this.active ? Math.max(0, this.active.endsAt - this.scene.run.time) : 0;
  }

  private pick(): number {
    const total = EVENTS.reduce((a, e) => a + e.weight, 0);
    let r = Math.random() * total;
    for (let i = 0; i < EVENTS.length; i++) {
      r -= EVENTS[i].weight;
      if (r < 0) return i;
    }
    return 0;
  }

  private start(def: EventDef): void {
    this.active = { def, endsAt: this.scene.run.time + def.duration, tick: 0 };
    audio.play('warning');
    this.scene.toast(`⚠ ${def.name}: ${def.description}`, def.color, true);
    if (def.id === 'freezer_army') {
      this.scene.enemies.spawnMul = 2.4;
      this.scene.enemies.extraPool = [{ id: 'freezer_soldier', weight: 12 }];
    }
    if (def.id === 'whis_training') this.scene.addBuffSeconds('xp', def.duration);
    if (def.id === 'guarded_chest') {
      const p = this.scene.player;
      let x = p.x;
      let y = p.y;
      for (let i = 0; i < 20; i++) {
        const a = Math.random() * Math.PI * 2;
        x = p.x + Math.cos(a) * 650;
        y = p.y + Math.sin(a) * 650;
        if (!this.scene.world.isBlocked(x, y)) break;
      }
      this.scene.loot.spawnChest(x, y, 'legendary', false, true);
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        this.scene.enemies.spawn(i % 2 ? 'freezer_soldier' : 'red_ribbon', x + Math.cos(a) * 110, y + Math.sin(a) * 110, true);
      }
    }
  }

  private tick(id: EventId): void {
    if (!this.active) return;
    const p = this.scene.player;
    switch (id) {
      case 'meteor_shower': {
        this.active.tick = 0.55;
        const x = p.x + Phaser.Math.Between(-260, 260);
        const y = p.y + Phaser.Math.Between(-200, 200);
        this.scene.telegraphs.circle(x, y, 58, 1000, () => {
          this.scene.effects.explosion(x, y, 58, 0xff8a3a, 0.004);
          audio.play('explode');
          if (pointInCircle(p.x, p.y, x, y, 62)) this.scene.damagePlayer(18);
          this.scene.enemies.damageInCircle(x, y, 58, () => ({ amount: 40, crit: false }), 200);
        }, 0xff6a2a);
        break;
      }
      case 'saiyan_invasion': {
        this.active.tick = 3;
        for (let i = 0; i < 8; i++) {
          const pt = this.scene.enemies.ringPoint(20);
          if (pt) this.scene.enemies.spawn(i === 0 ? 'saibaman_kamikaze' : 'saibaman', pt.x, pt.y);
        }
        break;
      }
      default:
        this.active.tick = 999;
    }
  }

  private finish(): void {
    if (!this.active) return;
    const def = this.active.def;
    this.active = null;
    this.nextAt = this.scene.run.time + 80 + Math.random() * 50;
    this.scene.enemies.spawnMul = 1;
    this.scene.enemies.extraPool = [];
    const p = this.scene.player;
    switch (def.id) {
      case 'meteor_shower':
        this.scene.toast('¡Has sobrevivido a la lluvia! +Ki completo', def.color);
        this.scene.addKi(999);
        this.scene.run.coins += 25;
        break;
      case 'saiyan_invasion':
        this.scene.toast('Invasión rechazada: cofre raro', def.color);
        this.scene.loot.spawnChest(p.x + 60, p.y, 'rare', false, true);
        break;
      case 'freezer_army':
        this.scene.toast('Ejército derrotado: cofre épico', def.color);
        this.scene.loot.spawnChest(p.x + 60, p.y, 'epic', false, true);
        break;
      case 'whis_training':
        this.scene.toast('Whis: "No está mal". ¡Mejora especial!', def.color);
        this.scene.queueLevelUp('Entrenamiento de Whis');
        break;
      case 'guarded_chest':
        break;
    }
  }
}

import Phaser from 'phaser';
import { CAPSULES, CHEST_COLORS, CHEST_NAMES, ITEMS } from '../../data/items';
import type { CapsuleKind, ChestRarity, ItemKind } from '../../data/types';
import { audio } from '../../services/audioService';
import { DEPTH, MAX_GEMS } from '../constants';
import { CHEST_RARITIES, rollCapsule, rollChestRarity, rollChestRewards, rollEnemyDrop, type Reward } from '../logic/loot';
import type { ChunkData, PoiSpec } from '../logic/chunkgen';
import type { GameScene } from '../scenes/GameScene';
import type { ChestRewardView } from '../../stores/runStore';

interface Gem {
  img: Phaser.GameObjects.Image;
  value: number;
  magnet: boolean;
  active: boolean;
  coin: boolean;
}

/** id/chunk: solo para lo generado con el mapa (null = soltado por enemigos o eventos) */
interface Owned {
  id: string | null;
  chunk: string | null;
}

interface Pickup extends Owned {
  img: Phaser.GameObjects.Image;
  kind: ItemKind;
  alive: boolean;
}

interface Capsule extends Owned {
  img: Phaser.GameObjects.Image;
  kind: CapsuleKind;
  alive: boolean;
}

export interface Chest extends Owned {
  img: Phaser.GameObjects.Image;
  glow: Phaser.GameObjects.Image | null;
  sparkle: Phaser.GameObjects.Particles.ParticleEmitter | null;
  rarity: ChestRarity;
  opened: boolean;
  hidden: boolean;
  discovered: boolean;
}

interface Altar {
  poi: PoiSpec;
  img: Phaser.GameObjects.Image;
  ring: Phaser.GameObjects.Graphics;
  progress: number;
  used: boolean;
  chunk: string;
}

const GEM_TINTS: [number, number][] = [
  [100, 0xc84aff],
  [20, 0xff4a4a],
  [5, 0x4aff6a],
  [0, 0x4ab4ff],
];

/** Experiencia, monedas, objetos, cápsulas Hoi-Poi, cofres y altares. */
export class LootSystem {
  private gems: Gem[] = [];
  private freeGems: Gem[] = [];
  private activeGems: Gem[] = [];
  private pickups: Pickup[] = [];
  private capsules: Capsule[] = [];
  chests: Chest[] = [];
  private altars: Altar[] = [];
  private magnetAll = false;
  /** POI conocidos (se conservan aunque su trozo se descargue) */
  readonly pois: (PoiSpec & { discovered: boolean; guarded: boolean })[] = [];
  private poiIds = new Set<string>();
  private discoverTimer = 0;
  private cleanupTimer = 0;

  constructor(private scene: GameScene) {
    for (let i = 0; i < MAX_GEMS; i++) {
      const img = scene.add.image(0, 0, 'gem').setVisible(false).setDepth(DEPTH.pickup);
      const g: Gem = { img, value: 0, magnet: false, active: false, coin: false };
      this.gems.push(g);
      this.freeGems.push(g);
    }
  }

  /** Crea el contenido de un trozo de mapa recién cargado. */
  loadChunk(data: ChunkData, consumed: ReadonlySet<string>): void {
    for (const c of data.chests) if (!consumed.has(c.id)) this.spawnChest(c.x, c.y, c.rarity, c.hidden, false, c.id, data.key);
    for (const c of data.capsules) if (!consumed.has(c.id)) this.spawnCapsule(c.x, c.y, c.kind, c.id, data.key);
    for (const it of data.items) if (!consumed.has(it.id)) this.spawnPickup(it.x, it.y, it.kind, it.id, data.key);
    for (const poi of data.pois) {
      if (!this.poiIds.has(poi.id)) {
        this.poiIds.add(poi.id);
        this.pois.push({ ...poi, discovered: false, guarded: false });
      }
      if (poi.type === 'altar' && !consumed.has(poi.id)) {
        const img = this.scene.add.image(poi.x, poi.y + 16, 'altar').setOrigin(0.5, 1).setDepth(DEPTH.entity + poi.y);
        const ring = this.scene.add.graphics().setDepth(DEPTH.telegraph);
        this.altars.push({ poi, img, ring, progress: 0, used: false, chunk: data.key });
      }
    }
  }

  /** Libera lo que no se ha recogido de un trozo que queda lejos (volverá a aparecer). */
  unloadChunk(key: string): void {
    for (const p of this.pickups) if (p.chunk === key && p.alive) this.destroyImg(p.img);
    this.pickups = this.pickups.filter((p) => p.chunk !== key && p.alive);
    for (const c of this.capsules) if (c.chunk === key && c.alive) this.destroyImg(c.img);
    this.capsules = this.capsules.filter((c) => c.chunk !== key && c.alive);
    for (const c of this.chests)
      if (c.chunk === key) {
        this.destroyImg(c.img);
        if (c.glow) this.destroyImg(c.glow);
        c.sparkle?.destroy();
      }
    this.chests = this.chests.filter((c) => c.chunk !== key);
    for (const a of this.altars)
      if (a.chunk === key) {
        a.img.destroy();
        a.ring.destroy();
      }
    this.altars = this.altars.filter((a) => a.chunk !== key);
  }

  private destroyImg(img: Phaser.GameObjects.Image): void {
    this.scene.tweens.killTweensOf(img);
    img.destroy();
  }

  private consume(id: string | null): void {
    if (id) this.scene.world.consumed.add(id);
  }

  // ---------- creación ----------

  dropGem(x: number, y: number, value: number, coin = false): void {
    let g = this.freeGems.pop();
    if (!g) {
      // Límite alcanzado: se suma el valor a una gema existente.
      const other = this.activeGems[Math.floor(Math.random() * this.activeGems.length)];
      if (other && !other.coin && !coin) other.value += value;
      return;
    }
    g.active = true;
    g.value = value;
    g.coin = coin;
    g.magnet = this.magnetAll;
    g.img.setTexture(coin ? 'coin' : 'gem');
    if (coin) g.img.clearTint();
    else g.img.setTint(GEM_TINTS.find(([min]) => value >= min)?.[1] ?? 0x4ab4ff);
    g.img.setPosition(x + Phaser.Math.Between(-6, 6), y + Phaser.Math.Between(-6, 6)).setVisible(true).setScale(value >= 20 ? 1.4 : 1);
    this.activeGems.push(g);
  }

  spawnPickup(x: number, y: number, kind: ItemKind, id: string | null = null, chunk: string | null = null): void {
    const img = this.scene.add.image(x, y, `item_${kind}`).setDepth(DEPTH.pickup + 1);
    this.scene.tweens.add({ targets: img, y: y - 4, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.pickups.push({ img, kind, alive: true, id, chunk });
  }

  spawnCapsule(x: number, y: number, kind: CapsuleKind, id: string | null = null, chunk: string | null = null): void {
    const img = this.scene.add.image(x, y, `capsule_${kind}`).setDepth(DEPTH.pickup + 1);
    this.scene.tweens.add({ targets: img, angle: { from: -8, to: 8 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.capsules.push({ img, kind, alive: true, id, chunk });
  }

  spawnChest(
    x: number,
    y: number,
    rarity: ChestRarity,
    hidden: boolean,
    discovered: boolean,
    id: string | null = null,
    chunk: string | null = null,
  ): Chest {
    const color = CHEST_COLORS[rarity];
    const tier = CHEST_RARITIES.indexOf(rarity);
    const glow =
      tier >= 1
        ? this.scene.add.image(x, y, 'glow').setTint(color).setBlendMode('ADD').setScale(1 + tier * 0.4).setDepth(DEPTH.pickup).setAlpha(0.6)
        : null;
    if (glow) this.scene.tweens.add({ targets: glow, alpha: 0.25, duration: 800, yoyo: true, repeat: -1 });
    const img = this.scene.add.image(x, y + 12, `chest_${rarity}`).setOrigin(0.5, 1).setDepth(DEPTH.entity + y).setScale(1.2);
    const sparkle =
      tier >= 3
        ? this.scene.add.particles(x, y - 4, 'spark', {
            speedY: { min: -60, max: -20 },
            speedX: { min: -20, max: 20 },
            lifespan: 900,
            scale: { start: 0.5, end: 0 },
            tint: color,
            blendMode: 'ADD',
            frequency: 120,
            maxAliveParticles: 12,
          })
        : null;
    sparkle?.setDepth(DEPTH.entity + y + 1);
    const chest: Chest = { img, glow, sparkle, rarity, opened: false, hidden, discovered, id, chunk };
    this.chests.push(chest);
    return chest;
  }

  // ---------- eventos ----------

  onEnemyDeath(x: number, y: number, xp: number, coinChance: number, elite: boolean): void {
    this.dropGem(x, y, xp);
    const drop = rollEnemyDrop(Math.random, coinChance, elite);
    if (drop.coins > 0) this.dropGem(x + 6, y, drop.coins, true);
    if (drop.item) this.spawnPickup(x, y + 8, drop.item);
    if (drop.chest) {
      const rarity = rollChestRarity(Math.random, this.scene.stats.luck, 'rare');
      this.spawnChest(x, y, rarity, false, true);
      this.scene.toast(`Un élite soltó un cofre ${CHEST_NAMES[rarity]}`, '#' + CHEST_COLORS[rarity].toString(16));
    }
  }

  onDestructibleBroken(x: number, y: number): void {
    const r = Math.random();
    if (r < 0.45) this.spawnCapsule(x, y, (['coins', 'xp', 'heal', 'ki'] as const)[Math.floor(Math.random() * 4)]);
    else if (r < 0.65) this.spawnPickup(x, y, Math.random() < 0.5 ? 'ki_orb' : 'senzu');
    else for (let i = 0; i < 3; i++) this.dropGem(x, y, 1, true);
  }

  magnetize(): void {
    for (const g of this.activeGems) g.magnet = true;
  }

  // ---------- actualización ----------

  update(dt: number): void {
    const p = this.scene.player;
    const px = p.x;
    const py = p.y;
    const magnet = this.scene.stats.magnet;
    const m2 = magnet * magnet;

    for (let i = this.activeGems.length - 1; i >= 0; i--) {
      const g = this.activeGems[i];
      const dx = px - g.img.x;
      const dy = py - g.img.y;
      const d2 = dx * dx + dy * dy;
      if (!g.magnet && d2 < m2) g.magnet = true;
      if (g.magnet) {
        const d = Math.sqrt(d2) || 1;
        const sp = Math.min(900, 380 + 6000 / d) * dt;
        g.img.x += (dx / d) * Math.min(sp, d);
        g.img.y += (dy / d) * Math.min(sp, d);
        if (d < 18) {
          if (g.coin) {
            this.scene.run.coins += g.value;
            audio.play('coin');
          } else {
            this.scene.gainXp(g.value);
            audio.play('pickup');
          }
          g.active = false;
          g.img.setVisible(false);
          this.activeGems[i] = this.activeGems[this.activeGems.length - 1];
          this.activeGems.pop();
          this.freeGems.push(g);
        }
      }
    }

    for (const it of this.pickups) {
      if (!it.alive) continue;
      if ((it.img.x - px) ** 2 + (it.img.y - py) ** 2 < 30 * 30) {
        it.alive = false;
        this.consume(it.id);
        this.scene.tweens.killTweensOf(it.img);
        this.scene.tweens.add({ targets: it.img, y: it.img.y - 30, alpha: 0, scale: 1.8, duration: 300, onComplete: () => it.img.destroy() });
        this.scene.applyItem(it.kind);
      }
    }

    for (const c of this.capsules) {
      if (!c.alive) continue;
      if ((c.img.x - px) ** 2 + (c.img.y - py) ** 2 < 32 * 32) {
        c.alive = false;
        this.consume(c.id);
        this.openCapsule(c);
      }
    }

    for (const c of this.chests) {
      if (c.opened) continue;
      const d2 = (c.img.x - px) ** 2 + (c.img.y - 12 - py) ** 2;
      if (d2 < 44 * 44) this.openChest(c);
    }

    this.updateAltars(dt);

    // Limpieza: experiencia y objetos soltados muy lejos se liberan (mundo infinito).
    this.cleanupTimer -= dt;
    if (this.cleanupTimer <= 0) {
      this.cleanupTimer = 2;
      const far2 = 2800 * 2800;
      for (let i = this.activeGems.length - 1; i >= 0; i--) {
        const g = this.activeGems[i];
        if ((g.img.x - px) ** 2 + (g.img.y - py) ** 2 > far2) {
          g.active = false;
          g.img.setVisible(false);
          this.activeGems[i] = this.activeGems[this.activeGems.length - 1];
          this.activeGems.pop();
          this.freeGems.push(g);
        }
      }
      this.pickups = this.pickups.filter((it) => {
        if (!it.alive) return false;
        if (it.chunk || (it.img.x - px) ** 2 + (it.img.y - py) ** 2 < far2 * 2) return true;
        this.destroyImg(it.img);
        return false;
      });
      this.capsules = this.capsules.filter((c) => c.alive);
    }

    this.discoverTimer -= dt;
    if (this.discoverTimer <= 0) {
      this.discoverTimer = 0.25;
      for (const c of this.chests) {
        if (c.discovered || c.opened) continue;
        const r = c.hidden ? 260 : 650;
        if ((c.img.x - px) ** 2 + (c.img.y - py) ** 2 < r * r) {
          c.discovered = true;
          if (c.hidden) this.scene.toast('¡Has encontrado un lugar oculto!', '#ffd84a');
        }
      }
      for (const poi of this.pois) {
        if (poi.discovered) continue;
        const r = poi.type === 'secret' ? 260 : 700;
        if ((poi.x - px) ** 2 + (poi.y - py) ** 2 < r * r) {
          poi.discovered = true;
          if (poi.type !== 'secret') this.scene.toast(`Descubierto: ${poi.name}`, '#cfe8ff');
          if (poi.type === 'camp' && !poi.guarded) {
            poi.guarded = true;
            for (let i = 0; i < 6; i++) {
              const a = (i / 6) * Math.PI * 2;
              this.scene.enemies.spawn('red_ribbon', poi.x + Math.cos(a) * 90, poi.y + Math.sin(a) * 90, i === 0);
            }
          }
        }
      }
    }
  }

  private updateAltars(dt: number): void {
    const p = this.scene.player;
    for (const a of this.altars) {
      a.ring.clear();
      if (a.used) continue;
      const near = Math.hypot(a.poi.x - p.x, a.poi.y - p.y) < 56;
      a.progress = near ? a.progress + dt : Math.max(0, a.progress - dt * 2);
      const need = 3;
      a.ring.lineStyle(3, 0xffd84a, 0.25);
      a.ring.strokeCircle(a.poi.x, a.poi.y, 56);
      if (a.progress > 0) {
        a.ring.lineStyle(4, 0xffd84a, 0.9);
        a.ring.beginPath();
        a.ring.arc(a.poi.x, a.poi.y, 56, -Math.PI / 2, -Math.PI / 2 + (a.progress / need) * Math.PI * 2);
        a.ring.strokePath();
      }
      if (a.progress >= need) {
        a.used = true;
        this.consume(a.poi.id);
        a.img.setTint(0x777777);
        this.scene.effects.ring(a.poi.x, a.poi.y, 120, 0xffd84a, 600);
        audio.play('levelup');
        this.scene.queueLevelUp('Altar de entrenamiento: ¡mejora gratis!');
      }
    }
  }

  private openCapsule(c: Capsule): void {
    audio.play('capsule');
    const def = CAPSULES[c.kind];
    this.scene.tweens.killTweensOf(c.img);
    this.scene.effects.smoke(c.img.x, c.img.y, 0xffffff, 10);
    this.scene.effects.sparks(c.img.x, c.img.y, def.color, 8);
    this.scene.tweens.add({ targets: c.img, scale: 2, alpha: 0, angle: 0, duration: 260, onComplete: () => c.img.destroy() });
    const out = rollCapsule(c.kind, Math.random, Math.floor(this.scene.run.time / 60));
    const color = '#' + def.color.toString(16).padStart(6, '0');
    this.scene.effects.floatText(c.img.x, c.img.y - 16, out.label, color);
    switch (out.kind) {
      case 'reward':
        this.scene.applyReward(out.reward);
        break;
      case 'heal':
        this.scene.heal(this.scene.stats.maxHp * out.fraction);
        break;
      case 'ki':
        this.scene.addKi(out.amount);
        break;
      case 'ambush':
        this.scene.toast('¡La cápsula era una trampa! Emboscada de Saibamans', '#ff6a6a');
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * Math.PI * 2;
          this.scene.enemies.spawn('saibaman', c.img.x + Math.cos(a) * 140, c.img.y + Math.sin(a) * 140, i === 0);
        }
        break;
    }
  }

  private openChest(c: Chest): void {
    c.opened = true;
    this.consume(c.id);
    c.discovered = true;
    audio.play('chest');
    const color = CHEST_COLORS[c.rarity];
    // Animación: temblor, tapa abierta y destello.
    this.scene.tweens.add({
      targets: c.img,
      x: c.img.x + 3,
      duration: 50,
      yoyo: true,
      repeat: 4,
      onComplete: () => {
        c.img.setTexture(`chest_${c.rarity}_open`);
        this.scene.effects.explosion(c.img.x, c.img.y - 16, 60 + CHEST_RARITIES.indexOf(c.rarity) * 20, color, 0);
        c.sparkle?.stop();
        if (c.glow) this.scene.tweens.add({ targets: c.glow, alpha: 0, duration: 600 });
        const rewards = rollChestRewards(c.rarity, Math.random, Math.floor(this.scene.run.time / 60));
        const views: ChestRewardView[] = rewards.map((r) => this.scene.applyReward(r, false));
        this.scene.run.chestsOpened += 1;
        this.scene.showModal(() => ({ type: 'chest', rarity: c.rarity, rewards: views }));
      },
    });
  }

  /** Cofres conocidos y sin abrir (minimapa e indicador). */
  knownChests(): Chest[] {
    return this.chests.filter((c) => !c.opened && c.discovered);
  }
}

export function rewardLabel(r: Reward): ChestRewardView {
  switch (r.kind) {
    case 'coins':
      return { icon: '🪙', label: `${r.amount} monedas` };
    case 'xp':
      return { icon: '✨', label: `${r.amount} de experiencia` };
    case 'upgrade':
      return { icon: '⬆', label: 'Mejora' };
    case 'item':
      return { icon: '🎁', label: ITEMS[r.item].name };
    case 'tickets':
      return { icon: '🎫', label: `${r.amount} ticket(s) de invocación` };
    case 'fragments':
      return { icon: '💠', label: `${r.amount} fragmentos para tu personaje` };
    case 'buff':
      return { icon: '🔥', label: `Transformación temporal: ${r.buff === 'power' ? 'daño x1.5' : r.buff === 'speed' ? 'velocidad x1.4' : 'EXP x2'} (${r.seconds} s)` };
  }
}

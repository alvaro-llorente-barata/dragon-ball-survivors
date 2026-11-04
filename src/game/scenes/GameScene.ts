import Phaser from 'phaser';
import { getWeapon } from '../../data/attacks';
import { getCharacter } from '../../data/characters';
import { ITEMS } from '../../data/items';
import { getMap, type MapDef } from '../../data/maps';
import { PASSIVES } from '../../data/passives';
import type { BuffId, CharacterDef, ItemKind } from '../../data/types';
import { audio } from '../../services/audioService';
import type { RunResult } from '../../services/progressionService';
import { useRunStore, type ChestRewardView, type HudState, type Modal } from '../../stores/runStore';
import { minimapImage } from '../art/textures';
import { bridge, virtualInput, type GameCommands, type RunConfig } from '../bridge';
import type { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { damageTaken } from '../logic/combat';
import type { Reward } from '../logic/loot';
import { generateMap } from '../logic/mapgen';
import { addBuff, addXp, createRunState, tickBuffs, xpForLevel, type RunState } from '../logic/run';
import { baseMaxHp, computeStats, getForm, type PlayerStats } from '../logic/stats';
import { drainForm, nextForm, tryTransform } from '../logic/transform';
import { applyChoice, generateChoices, type UpgradeChoice } from '../logic/upgrades';
import { BossSystem } from '../systems/BossSystem';
import { Effects } from '../systems/Effects';
import { EnemySystem, type EnemyBullet } from '../systems/EnemySystem';
import { EventSystem } from '../systems/EventSystem';
import { LootSystem, rewardLabel } from '../systems/LootSystem';
import { TelegraphSystem } from '../systems/TelegraphSystem';
import { WeaponSystem, type Shot } from '../systems/WeaponSystem';
import { WorldBuilder, type Destructible } from '../world/WorldBuilder';

type Keys = Record<'W' | 'A' | 'S' | 'D' | 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'SPACE' | 'Q' | 'E' | 'ESC', Phaser.Input.Keyboard.Key>;

const BUFF_LABELS: Record<BuffId, string> = {
  power: 'Daño x1.5',
  speed: 'Velocidad x1.4',
  xp: 'EXP x2',
  freeze: 'Tiempo detenido',
};

/** Escena principal: une el mundo, el jugador y todos los sistemas del modo Supervivencia. */
export class GameScene extends Phaser.Scene {
  cfg!: RunConfig;
  char!: CharacterDef;
  mapDef!: MapDef;
  run!: RunState;
  stats!: PlayerStats;
  world!: WorldBuilder;
  player!: Player;
  enemies!: EnemySystem;
  weapons!: WeaponSystem;
  loot!: LootSystem;
  bosses!: BossSystem;
  telegraphs!: TelegraphSystem;
  effects!: Effects;
  randomEvents!: EventSystem;

  private keys!: Keys;
  private activeModal: Modal | null = null;
  private modalQueue: (() => Modal)[] = [];
  private ended = false;
  private hudTimer = 0;
  private miniTimer = 0;
  private lastMaxHp = 0;
  private pending = { dodge: false, ultimate: false, transform: false };
  private reasonToastAt = 0;
  private minimapBg = '';

  constructor() {
    super('game');
  }

  create(): void {
    this.cfg = this.registry.get('runConfig') as RunConfig;
    this.char = getCharacter(this.cfg.characterId);
    this.mapDef = getMap(this.cfg.mapId);
    this.ended = false;
    this.activeModal = null;
    this.modalQueue = [];

    const gen = generateMap(this.mapDef, this.cfg.seed);
    this.world = new WorldBuilder(this, this.mapDef, gen, `tiles_${this.mapDef.id}`);
    this.physics.world.setBounds(0, 0, this.world.worldSize, this.world.worldSize);
    this.minimapBg = minimapImage(gen.tiles, this.mapDef);

    const maxHp = baseMaxHp(this.char, this.cfg.meta);
    this.run = createRunState(this.char, maxHp, this.char.stats.ki, this.cfg.meta.revives);
    this.stats = computeStats(this.char, this.run, this.cfg.meta);
    this.lastMaxHp = this.stats.maxHp;

    this.effects = new Effects(this, this.cfg.settings.particles, this.cfg.settings.damageNumbers);
    this.telegraphs = new TelegraphSystem(this);
    this.player = new Player(this, gen.spawn.x, gen.spawn.y, `char_${this.char.id}`);
    this.enemies = new EnemySystem(this);
    this.loot = new LootSystem(this, gen);
    this.weapons = new WeaponSystem(this);
    this.bosses = new BossSystem(this);
    this.randomEvents = new EventSystem(this);

    // Colisiones
    this.physics.add.collider(this.player.sprite, this.world.obstacles);
    this.physics.add.collider(this.player.sprite, this.world.destructibleGroup);
    this.physics.add.collider(this.player.sprite, this.world.layer);
    this.physics.add.overlap(this.weapons.shots, this.enemies.group, (a, b) =>
      this.weapons.onShotHit(a as unknown as Shot, b as unknown as Enemy),
    );
    this.physics.add.overlap(this.weapons.shots, this.world.destructibleGroup, (a, b) => {
      const d = (b as unknown as Phaser.GameObjects.Zone).getData('destructible') as Destructible | undefined;
      if (d) this.weapons.onShotHitDestructible(a as unknown as Shot, d);
    });
    this.physics.add.overlap(this.player.sprite, this.enemies.group, (_p, e) => {
      const en = e as unknown as Enemy;
      if (en.active && this.time.now >= this.enemies.frozenUntil) this.damagePlayer(en.damage);
    });
    this.physics.add.overlap(this.player.sprite, this.enemies.bullets, (_p, b) => {
      const bullet = b as unknown as EnemyBullet;
      if (!bullet.active) return;
      bullet.disableBody(true, true);
      this.damagePlayer(bullet.damage);
    });

    // Cámara
    const cam = this.cameras.main;
    cam.setBounds(0, 0, this.world.worldSize, this.world.worldSize);
    cam.startFollow(this.player.sprite, true, 0.12, 0.12);
    cam.setBackgroundColor(this.mapDef.palette.sky);
    cam.setRoundPixels(true);
    this.applyZoom();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.applyZoom, this);

    // Entrada
    const kb = this.input.keyboard;
    if (kb) {
      this.keys = kb.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE,Q,E,ESC') as Keys;
      kb.on('keydown-ESC', () => this.openPause());
      // Eventos (no sondeo): una pulsación muy corta tampoco se pierde.
      kb.on('keydown-SPACE', () => (this.pending.dodge = true));
      kb.on('keydown-Q', () => (this.pending.ultimate = true));
      kb.on('keydown-E', () => (this.pending.transform = true));
    }
    this.game.events.on(Phaser.Core.Events.BLUR, this.onBlur, this);

    const commands: GameCommands = {
      chooseUpgrade: (id) => this.chooseUpgrade(id),
      closeModal: () => this.closeModal(),
      pause: () => this.openPause(),
      resume: () => {
        if (this.activeModal?.type === 'pause') this.closeModal();
      },
      abandon: () => this.endRun('abandon'),
      dodge: () => (this.pending.dodge = true),
      ultimate: () => (this.pending.ultimate = true),
      transform: () => (this.pending.transform = true),
    };
    bridge.commands = commands;

    const cleanup = () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.applyZoom, this);
      this.game.events.off(Phaser.Core.Events.BLUR, this.onBlur, this);
      if (bridge.commands === commands) bridge.commands = null;
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
    this.events.once(Phaser.Scenes.Events.DESTROY, cleanup);

    // Solo en desarrollo: acceso para pruebas automatizadas en navegador.
    if (import.meta.env.DEV) (window as unknown as { __dbs?: GameScene }).__dbs = this;

    audio.startMusic();
    this.toast(`${this.mapDef.name}: ¡sobrevive!`, '#ffffff', true);
    this.pushHud();
    this.pushMinimap();
  }

  private applyZoom(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    const zoom = Phaser.Math.Clamp(Math.min(w, h) / 680, 0.7, 1.6);
    this.cameras.main.setZoom(zoom);
  }

  private onBlur(): void {
    if (this.cfg.settings.pauseOnBlur) this.openPause();
  }

  // ---------- Bucle principal ----------

  update(time: number, delta: number): void {
    if (this.ended) return;
    const dt = Math.min(delta, 50) / 1000;
    this.run.time += dt;

    this.stats = computeStats(this.char, this.run, this.cfg.meta);
    if (this.stats.maxHp > this.lastMaxHp) this.run.hp += this.stats.maxHp - this.lastMaxHp;
    this.lastMaxHp = this.stats.maxHp;
    this.run.hp = Math.min(this.run.hp, this.stats.maxHp);

    this.handleInput(time);

    // Ki: se regenera en forma base y se consume transformado.
    if (getForm(this.char, this.run.formId).kiDrain > 0) {
      if (drainForm(this.char, this.run, dt)) this.onFormChanged(true);
    } else {
      this.run.ki = Math.min(this.stats.maxKi, this.run.ki + this.stats.kiRegen * dt);
    }

    for (const b of tickBuffs(this.run, dt)) this.toast(`${BUFF_LABELS[b]}: terminado`, '#aaaaaa');

    this.enemies.update(dt, time);
    this.weapons.update(time, dt);
    this.loot.update(dt);
    this.bosses.update();
    this.randomEvents.update(dt);
    this.telegraphs.update(delta);

    this.hudTimer -= delta;
    if (this.hudTimer <= 0) {
      this.hudTimer = 100;
      this.pushHud();
    }
    this.miniTimer -= delta;
    if (this.miniTimer <= 0) {
      this.miniTimer = 250;
      this.pushMinimap();
    }
  }

  private handleInput(now: number): void {
    const k = this.keys;
    const move = new Phaser.Math.Vector2(virtualInput.x, virtualInput.y);
    if (k) {
      if (k.A.isDown || k.LEFT.isDown) move.x -= 1;
      if (k.D.isDown || k.RIGHT.isDown) move.x += 1;
      if (k.W.isDown || k.UP.isDown) move.y -= 1;
      if (k.S.isDown || k.DOWN.isDown) move.y += 1;
    }
    this.player.update(move, this.stats.moveSpeed, now, this.run.shieldHits > 0);

    if (this.pending.dodge) {
      this.pending.dodge = false;
      this.tryDodge(move);
    }
    if (this.pending.ultimate) {
      this.pending.ultimate = false;
      if (!this.weapons.castUltimate()) {
        const def = getWeapon(this.char.ultimate);
        this.reasonToast(this.weapons.ultimateCooldownFraction() > 0 ? `${def.name} se está recargando` : `Necesitas ${def.ultimate?.kiCost ?? 0} de Ki`);
      }
    }
    if (this.pending.transform) {
      this.pending.transform = false;
      this.tryTransformation();
    }
  }

  private reasonToast(text: string): void {
    if (this.time.now - this.reasonToastAt < 900) return;
    this.reasonToastAt = this.time.now;
    this.toast(text, '#bbbbbb');
  }

  private tryDodge(move: Phaser.Math.Vector2): void {
    const p = this.player;
    const now = this.time.now;
    if (now < p.dodgeReadyAt) return;
    const dir = move.lengthSq() > 0.01 ? move.clone().normalize() : p.facing.clone();
    for (let d = this.char.dodge.distance; d >= 40; d -= 20) {
      const tx = p.x + dir.x * d;
      const ty = p.y + dir.y * d;
      if (this.world.isBlocked(tx, ty + 18)) continue;
      const ghost = this.add
        .image(p.x, p.y, p.sprite.texture.key, p.sprite.frame.name)
        .setScale(2)
        .setFlipX(p.sprite.flipX)
        .setTint(0x9fe6ff)
        .setAlpha(0.7)
        .setDepth(p.sprite.depth - 1);
      this.tweens.add({ targets: ghost, alpha: 0, duration: 300, onComplete: () => ghost.destroy() });
      this.effects.sparks(p.x, p.y, 0x9fe6ff, 8);
      (p.sprite.body as Phaser.Physics.Arcade.Body).reset(tx, ty);
      this.effects.sparks(tx, ty, 0x9fe6ff, 8);
      p.invulnUntil = now + 380;
      p.dodgeReadyAt = now + this.char.dodge.cooldown;
      audio.play('dodge');
      return;
    }
  }

  private tryTransformation(): void {
    const check = nextForm(this.char, this.run, this.cfg.everDefeated);
    if (!check) {
      this.reasonToast('Ya estás en tu forma más poderosa');
      return;
    }
    if (!check.ready) {
      this.reasonToast(`${check.form.name}: ${check.reason}`);
      return;
    }
    tryTransform(this.char, this.run, this.cfg.everDefeated);
    this.onFormChanged(false);
  }

  private onFormChanged(reverted: boolean): void {
    const form = getForm(this.char, this.run.formId);
    const p = this.player;
    p.setTextureKey(form.sprite ? `char_${this.char.id}_${form.id}` : `char_${this.char.id}`);
    if (form.id === this.char.transformations[0].id) {
      p.setAura(null, false);
      p.sprite.clearTint();
      if (reverted) this.toast('Sin Ki: vuelves a tu forma base', '#bbbbbb');
      return;
    }
    p.setAura(form.aura, form.id === 'ssj2');
    if (form.id === 'kaioken') p.sprite.setTint(0xffb0b0);
    else p.sprite.clearTint();
    // Efecto de transformación: destello, onda que empuja y daña, invulnerabilidad breve.
    this.effects.flash(form.aura, 300);
    this.effects.explosion(p.x, p.y, 150, form.aura, 0.01);
    this.enemies.damageInCircle(p.x, p.y, 150, () => ({ amount: Math.round(25 * this.stats.energyMul), crit: false }), 420);
    p.invulnUntil = this.time.now + 1000;
    audio.play('transform');
    this.toast(`¡${form.name}!`, '#' + form.aura.toString(16).padStart(6, '0'), true);
  }

  // ---------- Jugador ----------

  damagePlayer(amount: number): void {
    if (this.ended) return;
    const now = this.time.now;
    const p = this.player;
    if (now < p.invulnUntil) return;
    if (this.run.shieldHits > 0) {
      this.run.shieldHits -= 1;
      p.invulnUntil = now + 350;
      this.effects.ring(p.x, p.y, 40, 0x8ab4ff, 250);
      return;
    }
    const dmg = damageTaken(amount, this.stats.defense);
    this.run.hp -= dmg;
    p.invulnUntil = now + 450;
    this.effects.damageNumber(p.x, p.y, dmg, false, '#ff5a5a');
    this.cameras.main.shake(90, 0.003);
    audio.play('hurt');
    if (this.run.hp <= 0) {
      if (this.run.revivesLeft > 0) {
        this.run.revivesLeft -= 1;
        this.run.hp = Math.round(this.stats.maxHp * 0.5);
        p.invulnUntil = now + 2500;
        this.effects.flash(0xffffff, 500);
        this.enemies.damageInCircle(p.x, p.y, 260, () => ({ amount: 9999, crit: false }), 600);
        this.toast('¡Segunda oportunidad!', '#ffd84a', true);
      } else {
        this.run.hp = 0;
        this.endRun('death');
      }
    }
  }

  heal(amount: number): void {
    this.run.hp = Math.min(this.stats.maxHp, this.run.hp + amount);
    this.effects.sparks(this.player.x, this.player.y, 0x6aff6a, 10);
  }

  addKi(amount: number): void {
    this.run.ki = Math.min(this.stats.maxKi, this.run.ki + amount);
    this.effects.sparks(this.player.x, this.player.y, 0x4ad8ff, 8);
  }

  addBuffSeconds(id: BuffId, seconds: number): void {
    addBuff(this.run, id, seconds);
  }

  gainXp(amount: number): void {
    const levels = addXp(this.run, amount * this.stats.xpMul);
    for (let i = 0; i < levels; i++) {
      const lvl = this.run.level - levels + i + 1;
      this.queueLevelUp(`¡Nivel ${lvl}!`);
    }
    if (levels > 0) {
      audio.play('levelup');
      this.effects.ring(this.player.x, this.player.y, 90, 0xffd84a, 500);
      const check = nextForm(this.char, this.run, this.cfg.everDefeated);
      if (check && this.run.level === check.form.minLevel) this.toast(`Nueva transformación disponible: ${check.form.name} (E)`, '#ffd84a', true);
    }
  }

  applyItem(kind: ItemKind): void {
    const def = ITEMS[kind];
    audio.play('pickup');
    this.effects.floatText(this.player.x, this.player.y - 30, def.name, '#' + def.color.toString(16).padStart(6, '0'));
    switch (kind) {
      case 'senzu':
        this.heal(this.stats.maxHp * 0.6);
        break;
      case 'ki_orb':
        this.addKi(40);
        break;
      case 'magnet':
        this.loot.magnetize();
        break;
      case 'power':
        addBuff(this.run, 'power', def.duration);
        break;
      case 'speed':
        addBuff(this.run, 'speed', def.duration);
        break;
      case 'xp_mult':
        addBuff(this.run, 'xp', def.duration);
        break;
      case 'shield':
        this.run.shieldHits = 3;
        break;
      case 'time_watch':
        this.enemies.frozenUntil = this.time.now + def.duration * 1000;
        addBuff(this.run, 'freeze', def.duration);
        this.effects.flash(0xd8d8ff, 200);
        break;
    }
  }

  /** Aplica una recompensa (cofres, cápsulas, eventos) y devuelve su descripción. */
  applyReward(r: Reward, showFloat = true): ChestRewardView {
    let view = rewardLabel(r);
    switch (r.kind) {
      case 'coins':
        this.run.coins += r.amount;
        break;
      case 'xp':
        this.gainXp(r.amount);
        break;
      case 'upgrade': {
        const [c] = generateChoices(this.run, this.char, Math.random, 1);
        if (c) {
          this.applyUpgrade(c);
          view = { icon: '⬆', label: `${c.name} (Nv ${c.level})` };
        }
        break;
      }
      case 'item':
        this.applyItem(r.item);
        break;
      case 'tickets':
        this.run.tickets += r.amount;
        break;
      case 'fragments':
        this.run.fragments += r.amount;
        break;
      case 'buff':
        addBuff(this.run, r.buff, r.seconds);
        break;
    }
    if (showFloat && r.kind !== 'item') this.effects.floatText(this.player.x, this.player.y - 40, view.label, '#ffe08a');
    return view;
  }

  private applyUpgrade(c: UpgradeChoice): void {
    applyChoice(this.run, c);
    if (c.kind === 'heal') this.heal(this.stats.maxHp * 0.4);
    this.stats = computeStats(this.char, this.run, this.cfg.meta);
  }

  // ---------- Ventanas (subida de nivel, cofres, pausa, fin) ----------

  queueLevelUp(title: string): void {
    this.showModal(() => ({ type: 'levelup', title, choices: generateChoices(this.run, this.char, Math.random, 3) }));
  }

  showModal(factory: () => Modal): void {
    if (this.ended) return;
    if (this.activeModal) {
      this.modalQueue.push(factory);
      return;
    }
    this.openModal(factory());
  }

  private openModal(m: Modal): void {
    this.activeModal = m;
    this.pushHud();
    useRunStore.getState().setModal(m);
    if (this.scene.isActive()) this.scene.pause();
  }

  closeModal(): void {
    if (this.ended || !this.activeModal) return;
    this.activeModal = null;
    const next = this.modalQueue.shift();
    if (next) {
      this.openModal(next());
      return;
    }
    useRunStore.getState().setModal(null);
    this.scene.resume();
    this.input.keyboard?.resetKeys();
  }

  private openPause(): void {
    if (this.ended || this.activeModal) return;
    this.openModal({ type: 'pause' });
  }

  private chooseUpgrade(id: string): void {
    const m = this.activeModal;
    if (!m || m.type !== 'levelup') return;
    const c = m.choices.find((x) => x.id === id);
    if (!c) return;
    this.applyUpgrade(c);
    audio.play('pickup');
    this.closeModal();
  }

  endRun(reason: 'death' | 'abandon'): void {
    if (this.ended) return;
    const result: RunResult = {
      characterId: this.char.id,
      mapId: this.mapDef.id,
      time: Math.floor(this.run.time),
      kills: this.run.kills,
      level: this.run.level,
      coins: this.run.coins,
      tickets: this.run.tickets,
      fragments: this.run.fragments,
      chestsOpened: this.run.chestsOpened,
      bossesDefeated: [...this.run.bossesDefeated],
      died: reason === 'death',
    };
    this.pushHud();
    this.ended = true;
    this.modalQueue = [];
    audio.stopMusic();
    if (reason === 'death') {
      audio.play('explode');
      this.effects.explosion(this.player.x, this.player.y, 90, 0xffffff, 0.01);
    }
    const unlockedMaps = this.cfg.onEnd(result);
    this.activeModal = { type: 'gameover', result, reason, unlockedMaps };
    useRunStore.getState().setModal(this.activeModal);
    this.time.delayedCall(reason === 'death' ? 400 : 0, () => this.scene.pause());
    if (reason === 'abandon') this.scene.pause();
  }

  toast(text: string, color = '#ffffff', big = false): void {
    useRunStore.getState().toast(text, color, big);
  }

  // ---------- Interfaz ----------

  private pushHud(): void {
    const run = this.run;
    const s = this.stats;
    const form = getForm(this.char, run.formId);
    const nf = nextForm(this.char, run, this.cfg.everDefeated);
    const ult = getWeapon(this.char.ultimate);
    const boss = this.bosses.current();
    const p = this.player;
    let nearest: HudState['nearestChest'] = null;
    let best = Infinity;
    for (const c of this.loot.knownChests()) {
      const d = Math.hypot(c.img.x - p.x, c.img.y - p.y);
      if (d < best) {
        best = d;
        nearest = { distance: Math.round(d / 10), angle: Math.atan2(c.img.y - p.y, c.img.x - p.x), rarity: c.rarity };
      }
    }
    const hud: HudState = {
      hp: Math.max(0, Math.ceil(run.hp)),
      maxHp: s.maxHp,
      ki: Math.floor(run.ki),
      maxKi: s.maxKi,
      xp: Math.floor(run.xp),
      xpNext: xpForLevel(run.level),
      level: run.level,
      time: run.time,
      kills: run.kills,
      coins: run.coins,
      weapons: Object.entries(run.weapons).map(([id, level]) => {
        const w = getWeapon(id);
        return { id, name: w.name, level, max: w.levels.length };
      }),
      passives: Object.entries(run.passives).map(([id, level]) => ({ id, name: PASSIVES[id].name, level, max: PASSIVES[id].maxLevel })),
      formName: form.name,
      formColor: form.aura,
      nextForm: nf ? { name: nf.form.name, ready: nf.ready, reason: nf.reason, kiCost: nf.form.kiCost } : null,
      ultimate: {
        name: ult.name,
        kiCost: ult.ultimate?.kiCost ?? 0,
        ready: this.weapons.canUltimate(),
        cooldown: this.weapons.ultimateCooldownFraction(),
      },
      dodgeCooldown: Math.max(0, Math.min(1, (p.dodgeReadyAt - this.time.now) / this.char.dodge.cooldown)),
      buffs: Object.entries(run.buffs).map(([id, rem]) => ({ id, label: BUFF_LABELS[id as BuffId], remaining: Math.ceil(rem ?? 0) })),
      shieldHits: run.shieldHits,
      boss: boss ? { name: this.bossName(boss.enemy), hp: Math.max(0, Math.ceil(boss.enemy.hp)), maxHp: boss.enemy.maxHp, mini: boss.def.mini } : null,
      nearestChest: nearest && best > 220 ? nearest : null,
    };
    if (this.randomEvents.active) {
      hud.buffs.push({ id: 'event', label: this.randomEvents.active.def.name, remaining: Math.ceil(this.randomEvents.remaining()) });
    }
    useRunStore.getState().setHud(hud);
  }

  private bossName(e: Enemy): string {
    const def = e.boss;
    if (!def) return '';
    const ratio = e.hp / e.maxHp;
    let name = def.name;
    for (const ph of def.phases) if (ratio <= ph.hpBelow && ph.name) name = ph.name;
    return name;
  }

  private pushMinimap(): void {
    const boss = this.bosses.current();
    useRunStore.getState().setMinimap({
      bg: this.minimapBg,
      worldSize: this.world.worldSize,
      player: { x: this.player.x, y: this.player.y },
      pois: this.loot.pois.filter((p) => p.discovered).map((p) => ({ x: p.x, y: p.y, type: p.type })),
      chests: this.loot.knownChests().map((c) => ({ x: c.img.x, y: c.img.y, rarity: c.rarity })),
      boss: boss ? { x: boss.enemy.x, y: boss.enemy.y } : null,
    });
  }
}


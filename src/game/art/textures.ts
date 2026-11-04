import Phaser from 'phaser';
import type { MapDef } from '../../data/maps';
import type { SpriteSpec } from '../../data/types';
import { CAPSULES, CHEST_COLORS, ITEMS } from '../../data/items';
import { CHEST_RARITIES } from '../logic/loot';
import { T, TILE, TILE_COUNT, terrainAt } from '../logic/chunkgen';
import { mulberry32 } from '../logic/rng';
import { FRAME_COUNT, FRAME_H, FRAME_W, drawCharacterSheet } from './chibi';

/** Todas las texturas se generan por código: arte original y sin imágenes rotas. */

type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

export function canvasTexture(scene: Phaser.Scene, key: string, w: number, h: number, draw: Draw): void {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, w, h);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.imageSmoothingEnabled = false;
  draw(ctx, w, h);
  tex.refresh();
}

const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;

/**
 * Crea la hoja de sprites de un personaje. Si ya existe una textura con esa clave
 * (por ejemplo, un PNG cargado desde src/assets/manifest.ts), se usa esa y solo se crean las animaciones.
 */
export function characterTexture(scene: Phaser.Scene, key: string, spec: SpriteSpec): void {
  if (!scene.textures.exists(key)) {
    const tex = scene.textures.createCanvas(key, FRAME_W * FRAME_COUNT, FRAME_H);
    if (!tex) return;
    drawCharacterSheet(tex.getContext(), spec);
    tex.refresh();
    for (let i = 0; i < FRAME_COUNT; i++) tex.add(String(i), 0, i * FRAME_W, 0, FRAME_W, FRAME_H);
  }
  const anims: [string, number[]][] = [
    ['down', [0, 1]],
    ['up', [2, 3]],
    ['side', [4, 5]],
  ];
  for (const [name, frames] of anims) {
    const animKey = `${key}_${name}`;
    if (scene.anims.exists(animKey)) continue;
    scene.anims.create({
      key: animKey,
      frames: frames.map((f) => ({ key, frame: String(f) })),
      frameRate: 7,
      repeat: -1,
    });
  }
}

function radial(ctx: CanvasRenderingContext2D, w: number, h: number, stops: [number, string][]) {
  const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.min(w, h) / 2);
  for (const [o, c] of stops) g.addColorStop(o, c);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

export function generateCommonTextures(scene: Phaser.Scene): void {
  canvasTexture(scene, 'px', 4, 4, (c) => {
    c.fillStyle = '#fff';
    c.fillRect(0, 0, 4, 4);
  });
  canvasTexture(scene, 'spark', 16, 16, (c, w, h) =>
    radial(c, w, h, [
      [0, 'rgba(255,255,255,1)'],
      [0.4, 'rgba(255,255,255,0.7)'],
      [1, 'rgba(255,255,255,0)'],
    ]),
  );
  canvasTexture(scene, 'glow', 64, 64, (c, w, h) =>
    radial(c, w, h, [
      [0, 'rgba(255,255,255,0.9)'],
      [0.5, 'rgba(255,255,255,0.35)'],
      [1, 'rgba(255,255,255,0)'],
    ]),
  );
  canvasTexture(scene, 'ring', 128, 128, (c) => {
    c.strokeStyle = 'rgba(255,255,255,0.9)';
    c.lineWidth = 6;
    c.beginPath();
    c.arc(64, 64, 58, 0, Math.PI * 2);
    c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.35)';
    c.lineWidth = 12;
    c.beginPath();
    c.arc(64, 64, 52, 0, Math.PI * 2);
    c.stroke();
  });
  canvasTexture(scene, 'kiball', 16, 16, (c, w, h) =>
    radial(c, w, h, [
      [0, 'rgba(255,255,255,1)'],
      [0.45, 'rgba(255,255,255,0.95)'],
      [0.7, 'rgba(255,255,255,0.5)'],
      [1, 'rgba(255,255,255,0)'],
    ]),
  );
  canvasTexture(scene, 'ebullet', 14, 14, (c, w, h) =>
    radial(c, w, h, [
      [0, 'rgba(255,255,255,1)'],
      [0.4, 'rgba(255,200,200,1)'],
      [0.75, 'rgba(255,60,60,0.8)'],
      [1, 'rgba(255,0,0,0)'],
    ]),
  );
  canvasTexture(scene, 'beam', 32, 32, (c) => {
    const g = c.createLinearGradient(0, 0, 0, 32);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.2, 'rgba(255,255,255,0.55)');
    g.addColorStop(0.4, 'rgba(255,255,255,1)');
    g.addColorStop(0.6, 'rgba(255,255,255,1)');
    g.addColorStop(0.8, 'rgba(255,255,255,0.55)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 32, 32);
  });
  canvasTexture(scene, 'slash', 48, 48, (c) => {
    c.strokeStyle = 'rgba(255,255,255,0.95)';
    c.lineWidth = 5;
    c.beginPath();
    c.arc(8, 24, 30, -Math.PI / 3, Math.PI / 3);
    c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.4)';
    c.lineWidth = 10;
    c.beginPath();
    c.arc(8, 24, 24, -Math.PI / 3, Math.PI / 3);
    c.stroke();
  });
  canvasTexture(scene, 'dragon', 56, 32, (c) => {
    // Dragón de energía: cabeza con cuernos y cuerpo en estela.
    c.fillStyle = 'rgba(255,220,90,0.5)';
    c.beginPath();
    c.moveTo(0, 16);
    c.quadraticCurveTo(14, 2, 30, 10);
    c.quadraticCurveTo(14, 30, 0, 16);
    c.fill();
    c.fillStyle = '#ffd84a';
    c.beginPath();
    c.ellipse(38, 16, 14, 10, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#fff4b0';
    c.beginPath();
    c.moveTo(48, 10);
    c.lineTo(56, 16);
    c.lineTo(48, 22);
    c.fill();
    c.fillStyle = '#c8901a';
    c.fillRect(30, 3, 3, 6);
    c.fillRect(36, 2, 3, 6);
    c.fillStyle = '#d42020';
    c.fillRect(42, 12, 3, 3);
  });
  canvasTexture(scene, 'disc', 24, 24, (c) => {
    // Kienzan: disco con borde brillante
    c.fillStyle = 'rgba(255,255,255,0.35)';
    c.beginPath();
    c.ellipse(12, 12, 11, 5, 0, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = 'rgba(255,255,255,1)';
    c.lineWidth = 2;
    c.beginPath();
    c.ellipse(12, 12, 10, 4, 0, 0, Math.PI * 2);
    c.stroke();
  });
  canvasTexture(scene, 'needle', 28, 6, (c) => {
    const g = c.createLinearGradient(0, 0, 28, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.6, 'rgba(255,255,255,0.8)');
    g.addColorStop(1, 'rgba(255,255,255,1)');
    c.fillStyle = g;
    c.fillRect(0, 1, 28, 4);
  });
  canvasTexture(scene, 'aura', 48, 64, (c) => {
    const g = c.createRadialGradient(24, 40, 4, 24, 36, 30);
    g.addColorStop(0, 'rgba(255,255,255,0.0)');
    g.addColorStop(0.45, 'rgba(255,255,255,0.55)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(24, 0);
    c.quadraticCurveTo(46, 30, 40, 60);
    c.lineTo(8, 60);
    c.quadraticCurveTo(2, 30, 24, 0);
    c.fill();
  });
  canvasTexture(scene, 'gem', 10, 14, (c) => {
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.moveTo(5, 0);
    c.lineTo(10, 6);
    c.lineTo(5, 14);
    c.lineTo(0, 6);
    c.fill();
    c.fillStyle = 'rgba(0,0,0,0.25)';
    c.beginPath();
    c.moveTo(5, 14);
    c.lineTo(10, 6);
    c.lineTo(5, 7);
    c.fill();
  });
  canvasTexture(scene, 'coin', 12, 12, (c) => {
    c.fillStyle = '#c8901a';
    c.beginPath();
    c.arc(6, 6, 6, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#ffd84a';
    c.beginPath();
    c.arc(6, 6, 4.5, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#c8901a';
    c.fillRect(5, 3, 2, 6);
  });
  canvasTexture(scene, 'warning_px', 2, 2, (c) => {
    c.fillStyle = '#fff';
    c.fillRect(0, 0, 2, 2);
  });

  // Objetos del mapa.
  for (const item of Object.values(ITEMS)) {
    canvasTexture(scene, `item_${item.kind}`, 20, 20, (c) => {
      const col = hex(item.color);
      c.fillStyle = 'rgba(0,0,0,0.3)';
      c.beginPath();
      c.ellipse(10, 18, 7, 2, 0, 0, Math.PI * 2);
      c.fill();
      if (item.kind === 'senzu') {
        c.fillStyle = '#4a9a2a';
        c.beginPath();
        c.ellipse(10, 10, 5, 7, 0.4, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#8ad85a';
        c.beginPath();
        c.ellipse(9, 8, 2, 3, 0.4, 0, Math.PI * 2);
        c.fill();
        return;
      }
      c.fillStyle = '#1a1424';
      c.beginPath();
      c.arc(10, 9, 8, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = col;
      c.beginPath();
      c.arc(10, 9, 6.5, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#ffffff';
      c.font = 'bold 9px monospace';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      const glyph: Record<string, string> = {
        ki_orb: 'K',
        magnet: 'U',
        power: '⚔',
        speed: '»',
        shield: '◆',
        time_watch: '◷',
        xp_mult: '×2',
      };
      c.fillText(glyph[item.kind] ?? '?', 10, 9.5);
    });
  }
  for (const cap of Object.values(CAPSULES)) {
    canvasTexture(scene, `capsule_${cap.kind}`, 16, 22, (c) => {
      c.fillStyle = 'rgba(0,0,0,0.3)';
      c.beginPath();
      c.ellipse(8, 20, 6, 2, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#20202a';
      c.fillRect(3, 1, 10, 18);
      c.fillStyle = '#f0f0f0';
      c.fillRect(4, 2, 8, 8);
      c.fillStyle = hex(cap.color);
      c.fillRect(4, 10, 8, 8);
      c.fillStyle = '#20202a';
      c.fillRect(4, 9, 8, 2);
      c.fillStyle = '#ffffff';
      c.fillRect(5, 3, 2, 3);
      c.fillStyle = '#d42020';
      c.fillRect(7, 5, 2, 2);
    });
  }
  for (const r of CHEST_RARITIES) {
    const col = hex(CHEST_COLORS[r]);
    const drawChest = (c: CanvasRenderingContext2D, open: boolean) => {
      c.fillStyle = 'rgba(0,0,0,0.35)';
      c.beginPath();
      c.ellipse(16, 29, 13, 3, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#1a1424';
      c.fillRect(2, 12, 28, 17);
      c.fillStyle = '#6a4426';
      c.fillRect(3, 13, 26, 15);
      c.fillStyle = col;
      c.fillRect(3, 13, 26, 3);
      c.fillRect(3, 25, 26, 3);
      c.fillRect(14, 13, 4, 15);
      if (open) {
        c.fillStyle = '#1a1424';
        c.fillRect(2, 2, 28, 9);
        c.fillStyle = '#4a2e1a';
        c.fillRect(3, 3, 26, 7);
        c.fillStyle = 'rgba(255,240,160,0.9)';
        c.fillRect(5, 11, 22, 3);
      } else {
        c.fillStyle = '#1a1424';
        c.fillRect(2, 6, 28, 8);
        c.fillStyle = '#7a5030';
        c.fillRect(3, 7, 26, 6);
        c.fillStyle = col;
        c.fillRect(3, 7, 26, 2);
        c.fillStyle = '#ffe14d';
        c.fillRect(14, 11, 4, 5);
      }
    };
    canvasTexture(scene, `chest_${r}`, 32, 32, (c) => drawChest(c, false));
    canvasTexture(scene, `chest_${r}_open`, 32, 32, (c) => drawChest(c, true));
  }
  canvasTexture(scene, 'altar', 64, 48, (c) => {
    c.fillStyle = 'rgba(0,0,0,0.3)';
    c.beginPath();
    c.ellipse(32, 42, 28, 6, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#5a5a66';
    c.fillRect(6, 26, 52, 16);
    c.fillStyle = '#8a8a96';
    c.fillRect(8, 24, 48, 6);
    c.fillStyle = '#3a3a46';
    c.fillRect(28, 6, 8, 20);
    c.fillStyle = '#ffd84a';
    c.beginPath();
    c.arc(32, 8, 6, 0, Math.PI * 2);
    c.fill();
  });
}

/** Tileset del escenario (11 tiles de 32x32 en una fila). */
export function generateMapTextures(scene: Phaser.Scene, map: MapDef): string {
  const key = `tiles_${map.id}`;
  const p = map.palette;
  const rng = mulberry32(42);
  canvasTexture(scene, key, TILE * TILE_COUNT, TILE, (c) => {
    const speck = (ox: number, color: string, count: number, size = 2) => {
      c.fillStyle = color;
      for (let i = 0; i < count; i++) c.fillRect(ox + Math.floor(rng() * (TILE - size)), Math.floor(rng() * (TILE - size)), size, size);
    };
    const tile = (i: number, base: string, draw?: (ox: number) => void) => {
      const ox = i * TILE;
      c.fillStyle = base;
      c.fillRect(ox, 0, TILE, TILE);
      draw?.(ox);
    };
    const darker = (h: string, a: number) => {
      const n = parseInt(h.slice(1), 16);
      const f = (v: number) => Math.max(0, Math.min(255, v + a));
      return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
    };
    tile(T.GRASS, p.grass, (ox) => {
      speck(ox, darker(p.grass, -18), 14);
      speck(ox, darker(p.grass, 16), 8);
    });
    tile(T.GRASS2, p.grass2, (ox) => {
      speck(ox, darker(p.grass2, -16), 16);
      c.fillStyle = darker(p.grass2, 22);
      for (let i = 0; i < 5; i++) c.fillRect(ox + Math.floor(rng() * 28), Math.floor(rng() * 26), 1, 4);
    });
    tile(T.FLOWERS, p.grass, (ox) => {
      speck(ox, darker(p.grass, -18), 10);
      speck(ox, p.flowers, 6, 3);
      speck(ox, '#ffffff', 3, 2);
    });
    tile(T.PATH, p.path, (ox) => {
      speck(ox, darker(p.path, -20), 14);
      speck(ox, darker(p.path, 18), 6);
    });
    tile(T.SAND, p.sand, (ox) => {
      speck(ox, darker(p.sand, -18), 12);
      speck(ox, darker(p.sand, 15), 6);
    });
    tile(T.WATER, p.water, (ox) => {
      c.fillStyle = p.waterLight;
      for (let i = 0; i < 4; i++) c.fillRect(ox + Math.floor(rng() * 22), 4 + i * 7, 8, 2);
    });
    tile(T.STONE, p.stone, (ox) => {
      c.fillStyle = darker(p.stone, -30);
      c.fillRect(ox, 15, TILE, 2);
      c.fillRect(ox + 15, 0, 2, 15);
      c.fillRect(ox + 6, 17, 2, 15);
      c.fillRect(ox + 24, 17, 2, 15);
      speck(ox, darker(p.stone, 15), 6);
    });
    tile(T.FOREST, p.forest, (ox) => {
      speck(ox, darker(p.forest, -20), 18);
      speck(ox, darker(p.forest, 12), 6);
    });
    tile(T.BRIDGE, p.water, (ox) => {
      c.fillStyle = '#7a5030';
      c.fillRect(ox, 3, TILE, 26);
      c.fillStyle = '#5a3a20';
      for (let i = 0; i < 4; i++) c.fillRect(ox + i * 8, 3, 1, 26);
      c.fillRect(ox, 3, TILE, 2);
      c.fillRect(ox, 27, TILE, 2);
    });
    tile(T.CLIFF, p.cliff, (ox) => {
      speck(ox, darker(p.cliff, -25), 18, 3);
      speck(ox, darker(p.cliff, 25), 8, 2);
    });
    tile(T.DIRT, p.dirt, (ox) => {
      speck(ox, darker(p.dirt, -20), 14);
      speck(ox, darker(p.dirt, 14), 6);
    });
  });

  // Obstáculos.
  const t = map.treeStyle;
  canvasTexture(scene, `tree_${map.id}`, 48, 64, (c) => {
    c.fillStyle = 'rgba(0,0,0,0.3)';
    c.beginPath();
    c.ellipse(24, 60, 16, 4, 0, 0, Math.PI * 2);
    c.fill();
    if (t === 'cactus') {
      c.fillStyle = '#1a1424';
      c.fillRect(18, 14, 12, 47);
      c.fillRect(6, 26, 10, 18);
      c.fillRect(32, 20, 10, 16);
      c.fillStyle = p.treeLeaf;
      c.fillRect(19, 15, 10, 45);
      c.fillRect(7, 27, 8, 16);
      c.fillRect(33, 21, 8, 14);
      c.fillRect(14, 38, 6, 4);
      c.fillRect(28, 32, 6, 4);
      c.fillStyle = p.treeLeafDark;
      c.fillRect(25, 15, 4, 45);
      return;
    }
    c.fillStyle = '#1a1424';
    c.fillRect(19, 38, 10, 23);
    c.fillStyle = p.trunk;
    c.fillRect(20, 38, 8, 22);
    if (t === 'namek') {
      // árbol Ajisa: tronco fino y copa redonda
      c.fillStyle = '#1a1424';
      c.beginPath();
      c.arc(24, 22, 20, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = p.treeLeafDark;
      c.beginPath();
      c.arc(24, 22, 19, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = p.treeLeaf;
      c.beginPath();
      c.arc(21, 19, 14, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = 'rgba(255,255,255,0.25)';
      c.beginPath();
      c.arc(17, 14, 5, 0, Math.PI * 2);
      c.fill();
      return;
    }
    const blob = (x: number, y: number, r: number, col: string) => {
      c.fillStyle = col;
      c.beginPath();
      c.arc(x, y, r, 0, Math.PI * 2);
      c.fill();
    };
    blob(24, 24, 22, '#1a1424');
    blob(24, 26, 20, p.treeLeafDark);
    blob(16, 22, 12, p.treeLeaf);
    blob(30, 18, 12, p.treeLeaf);
    blob(24, 12, 10, p.treeLeaf);
    blob(20, 10, 4, 'rgba(255,255,255,0.2)');
  });
  canvasTexture(scene, `rock_${map.id}`, 36, 30, (c) => {
    c.fillStyle = 'rgba(0,0,0,0.3)';
    c.beginPath();
    c.ellipse(18, 27, 15, 3, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#1a1424';
    c.beginPath();
    c.moveTo(3, 27);
    c.lineTo(8, 8);
    c.lineTo(20, 3);
    c.lineTo(32, 12);
    c.lineTo(34, 27);
    c.fill();
    c.fillStyle = p.rock;
    c.beginPath();
    c.moveTo(5, 26);
    c.lineTo(9, 9);
    c.lineTo(20, 5);
    c.lineTo(31, 13);
    c.lineTo(32, 26);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.25)';
    c.fillRect(11, 10, 8, 3);
  });
  canvasTexture(scene, `boulder_${map.id}`, 36, 32, (c) => {
    c.fillStyle = 'rgba(0,0,0,0.3)';
    c.beginPath();
    c.ellipse(18, 29, 15, 3, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#1a1424';
    c.beginPath();
    c.arc(18, 17, 15, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = p.rock;
    c.beginPath();
    c.arc(18, 17, 13.5, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#1a1424';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(10, 10);
    c.lineTo(17, 17);
    c.lineTo(14, 25);
    c.moveTo(17, 17);
    c.lineTo(26, 14);
    c.stroke();
  });
  canvasTexture(scene, `mountain_${map.id}`, 112, 104, (c) => {
    c.fillStyle = 'rgba(0,0,0,0.3)';
    c.beginPath();
    c.ellipse(56, 98, 52, 6, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#1a1424';
    c.beginPath();
    c.moveTo(2, 98);
    c.lineTo(36, 20);
    c.lineTo(56, 2);
    c.lineTo(80, 30);
    c.lineTo(110, 98);
    c.fill();
    c.fillStyle = p.cliff;
    c.beginPath();
    c.moveTo(5, 96);
    c.lineTo(37, 22);
    c.lineTo(56, 5);
    c.lineTo(78, 31);
    c.lineTo(107, 96);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.15)';
    c.beginPath();
    c.moveTo(56, 5);
    c.lineTo(37, 22);
    c.lineTo(28, 60);
    c.lineTo(56, 40);
    c.fill();
    c.fillStyle = 'rgba(0,0,0,0.2)';
    c.beginPath();
    c.moveTo(56, 5);
    c.lineTo(78, 31);
    c.lineTo(107, 96);
    c.lineTo(70, 96);
    c.fill();
  });
  canvasTexture(scene, `house_${map.id}`, 80, 72, (c) => {
    c.fillStyle = 'rgba(0,0,0,0.3)';
    c.beginPath();
    c.ellipse(40, 68, 36, 4, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#1a1424';
    c.beginPath();
    c.ellipse(40, 44, 37, 28, 0, Math.PI, 0);
    c.fill();
    c.fillRect(3, 44, 74, 24);
    const wall = map.houseStyle === 'namek' ? '#e8f0e0' : '#f0f0f0';
    c.fillStyle = wall;
    c.beginPath();
    c.ellipse(40, 44, 35, 26, 0, Math.PI, 0);
    c.fill();
    c.fillRect(5, 44, 70, 22);
    c.fillStyle = map.houseStyle === 'namek' ? '#7ab88a' : '#f0c040';
    c.fillRect(5, 44, 70, 4);
    c.fillStyle = '#3a4a6a';
    c.beginPath();
    c.ellipse(40, 56, 8, 10, 0, Math.PI, 0);
    c.fill();
    c.fillRect(32, 56, 16, 10);
    c.fillStyle = '#6ab8ff';
    c.beginPath();
    c.arc(18, 36, 5, 0, Math.PI * 2);
    c.arc(62, 36, 5, 0, Math.PI * 2);
    c.fill();
  });
  canvasTexture(scene, 'tent', 56, 48, (c) => {
    c.fillStyle = 'rgba(0,0,0,0.3)';
    c.beginPath();
    c.ellipse(28, 44, 26, 4, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#1a1424';
    c.beginPath();
    c.moveTo(1, 44);
    c.lineTo(28, 3);
    c.lineTo(55, 44);
    c.fill();
    c.fillStyle = '#5a6a3a';
    c.beginPath();
    c.moveTo(4, 43);
    c.lineTo(28, 6);
    c.lineTo(52, 43);
    c.fill();
    c.fillStyle = '#c62828';
    c.fillRect(22, 18, 12, 6);
    c.fillStyle = '#2a2a1a';
    c.beginPath();
    c.moveTo(20, 43);
    c.lineTo(28, 26);
    c.lineTo(36, 43);
    c.fill();
  });
  canvasTexture(scene, 'pillar', 28, 64, (c) => {
    c.fillStyle = 'rgba(0,0,0,0.3)';
    c.beginPath();
    c.ellipse(14, 61, 12, 3, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#1a1424';
    c.fillRect(3, 2, 22, 59);
    c.fillStyle = '#a8a8b0';
    c.fillRect(4, 3, 20, 57);
    c.fillStyle = '#c8c8d0';
    c.fillRect(2, 3, 24, 5);
    c.fillRect(2, 54, 24, 6);
    c.fillStyle = '#7a7a86';
    c.fillRect(18, 8, 4, 46);
    c.fillStyle = '#5a5a66';
    c.fillRect(8, 24, 6, 2);
    c.fillRect(10, 26, 2, 8);
  });
  canvasTexture(scene, 'crate', 28, 30, (c) => {
    c.fillStyle = 'rgba(0,0,0,0.3)';
    c.beginPath();
    c.ellipse(14, 27, 12, 3, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#1a1424';
    c.fillRect(1, 3, 26, 24);
    c.fillStyle = '#a8783a';
    c.fillRect(2, 4, 24, 22);
    c.fillStyle = '#7a5020';
    c.fillRect(2, 4, 24, 3);
    c.fillRect(2, 23, 24, 3);
    c.fillRect(2, 4, 3, 22);
    c.fillRect(23, 4, 3, 22);
    c.fillStyle = '#c62828';
    c.fillRect(10, 11, 8, 8);
  });
  return key;
}

/**
 * Minimapa del mundo infinito: muestrea el terreno alrededor de (cx, cy).
 * size = píxeles de la imagen, extent = mitad del lado en píxeles de mundo.
 */
export function minimapImage(map: MapDef, seed: number, cx: number, cy: number, extent: number, size = 64): string {
  const w = size;
  const h = size;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const c = canvas.getContext('2d');
  if (!c) return '';
  const step = (extent * 2) / size;
  const tileAt = (x: number, y: number) =>
    terrainAt(map, seed, Math.floor((cx - extent + x * step) / TILE), Math.floor((cy - extent + y * step) / TILE));
  const p = map.palette;
  const colors: Record<number, string> = {
    [T.GRASS]: p.grass,
    [T.GRASS2]: p.grass2,
    [T.FLOWERS]: p.grass,
    [T.PATH]: p.path,
    [T.SAND]: p.sand,
    [T.WATER]: p.water,
    [T.STONE]: p.stone,
    [T.FOREST]: p.treeLeafDark,
    [T.BRIDGE]: '#7a5030',
    [T.CLIFF]: p.cliff,
    [T.DIRT]: p.dirt,
  };
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      c.fillStyle = colors[tileAt(x, y)] ?? '#000';
      c.fillRect(x, y, 1, 1);
    }
  return canvas.toDataURL();
}

import type { SpriteSpec } from '../../data/types';

/**
 * Generador de sprites chibi pixel art (arte original, sin recursos externos).
 * Hoja: 7 fotogramas de 20x24 px:
 *   0-1 abajo (andar), 2-3 arriba (andar), 4-5 lateral derecha (andar), 6 lateral atacando.
 * Para sustituirlos por arte final, ver src/assets/README.md.
 */
export const FRAME_W = 20;
export const FRAME_H = 24;
export const FRAME_COUNT = 7;

type Dir = 'down' | 'up' | 'side';

function rect(ctx: CanvasRenderingContext2D, ox: number, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(ox + x, y, w, h);
}

function shade(hex: string, amount: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 255) + amount));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amount));
  const b = Math.max(0, Math.min(255, (n & 255) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function drawHair(ctx: CanvasRenderingContext2D, ox: number, s: SpriteSpec, dir: Dir) {
  const h = s.hair;
  const hd = shade(h, -30);
  switch (s.hairStyle) {
    case 'bald':
      return;
    case 'dome':
      rect(ctx, ox, 6, 2, 8, 4, h);
      rect(ctx, ox, 7, 1, 6, 1, h);
      rect(ctx, ox, 7, 2, 2, 1, shade(h, 40));
      return;
    case 'flat':
      if (dir === 'up') {
        rect(ctx, ox, 5, 3, 10, 7, h);
      } else if (dir === 'side') {
        rect(ctx, ox, 6, 3, 8, 3, h);
        rect(ctx, ox, 6, 5, 3, 4, h);
      } else {
        rect(ctx, ox, 5, 3, 10, 3, h);
        rect(ctx, ox, 5, 5, 2, 3, h);
        rect(ctx, ox, 13, 5, 2, 3, h);
      }
      return;
    case 'long':
      if (dir === 'side') {
        rect(ctx, ox, 6, 2, 8, 4, h);
        rect(ctx, ox, 3, 4, 5, 15, h);
        rect(ctx, ox, 2, 8, 2, 10, hd);
      } else {
        rect(ctx, ox, 5, 2, 10, 4, h);
        rect(ctx, ox, 3, 4, 3, 15, h);
        rect(ctx, ox, 14, 4, 3, 15, h);
        if (dir === 'up') rect(ctx, ox, 5, 4, 10, 14, h);
        rect(ctx, ox, 3, 16, 2, 3, hd);
        rect(ctx, ox, 15, 16, 2, 3, hd);
      }
      return;
    case 'vegeta':
      // pelo en forma de llama hacia arriba
      rect(ctx, ox, 6, 0, 8, 6, h);
      rect(ctx, ox, 5, 1, 1, 4, h);
      rect(ctx, ox, 14, 1, 1, 4, h);
      rect(ctx, ox, 7, 0, 1, 1, shade(h, 40));
      if (dir === 'down') {
        rect(ctx, ox, 9, 5, 2, 1, h);
        rect(ctx, ox, 6, 5, 1, 2, h);
        rect(ctx, ox, 13, 5, 1, 2, h);
      }
      if (dir === 'up') rect(ctx, ox, 6, 5, 8, 4, h);
      return;
    case 'gohan':
      // pelo de punta corto con un mechón en la frente
      rect(ctx, ox, 5, 2, 10, 4, h);
      rect(ctx, ox, 6, 1, 2, 1, h);
      rect(ctx, ox, 10, 0, 2, 2, h);
      rect(ctx, ox, 13, 1, 2, 1, h);
      if (dir === 'down') rect(ctx, ox, 9, 6, 1, 2, h);
      if (dir === 'up') rect(ctx, ox, 5, 5, 10, 4, h);
      if (dir === 'side') rect(ctx, ox, 5, 4, 3, 3, h);
      rect(ctx, ox, 7, 2, 2, 1, shade(h, 45));
      return;
    case 'bowl':
      // melena lisa con raya (Trunks)
      rect(ctx, ox, 5, 2, 10, 4, h);
      rect(ctx, ox, 4, 4, 2, 6, h);
      rect(ctx, ox, 14, 4, 2, 6, h);
      if (dir === 'down') {
        rect(ctx, ox, 6, 5, 3, 2, h);
        rect(ctx, ox, 11, 5, 3, 2, h);
      }
      if (dir === 'up') rect(ctx, ox, 5, 5, 10, 6, h);
      rect(ctx, ox, 9, 2, 1, 2, shade(h, -40));
      return;
    case 'turban':
      // turbante blanco con banda morada (Piccolo)
      rect(ctx, ox, 5, 1, 10, 5, h);
      rect(ctx, ox, 5, 4, 10, 1, '#6a3aa8');
      rect(ctx, ox, 6, 1, 3, 1, shade(h, 30));
      return;
    case 'buu':
      // antena de goma hacia atrás
      rect(ctx, ox, 8, 1, 4, 3, h);
      rect(ctx, ox, dir === 'side' ? 4 : 11, 0, 4, 2, h);
      rect(ctx, ox, dir === 'side' ? 3 : 14, 1, 2, 2, shade(h, -25));
      return;
    case 'crest':
      // cresta / coraza de cabeza (Cell, Freezer 3ª forma, dragones)
      rect(ctx, ox, 6, 1, 8, 4, h);
      rect(ctx, ox, 4, 2, 2, 4, h);
      rect(ctx, ox, 14, 2, 2, 4, h);
      rect(ctx, ox, 9, 0, 2, 1, h);
      rect(ctx, ox, 7, 2, 6, 1, shade(h, 30));
      return;
    case 'bob':
      // media melena (18, Pan, 17)
      rect(ctx, ox, 5, 2, 10, 4, h);
      rect(ctx, ox, 4, 4, 2, 7, h);
      rect(ctx, ox, 14, 4, 2, 7, h);
      if (dir === 'down') rect(ctx, ox, 6, 5, 8, 1, h);
      if (dir === 'up') rect(ctx, ox, 5, 5, 10, 7, h);
      rect(ctx, ox, 6, 2, 3, 1, shade(h, 40));
      return;
    case 'wild':
      // melena salvaje enorme (Broly, Gohan Beast)
      rect(ctx, ox, 4, 0, 12, 6, h);
      rect(ctx, ox, 3, 2, 2, 9, h);
      rect(ctx, ox, 15, 2, 2, 9, h);
      rect(ctx, ox, 2, 5, 1, 4, h);
      rect(ctx, ox, 17, 5, 1, 4, h);
      rect(ctx, ox, 6, 0, 2, 1, shade(h, 40));
      if (dir === 'up') rect(ctx, ox, 4, 5, 12, 8, h);
      return;
    case 'mohawk':
      rect(ctx, ox, 8, 0, 4, 5, h);
      rect(ctx, ox, 7, 2, 6, 2, h);
      rect(ctx, ox, 9, 0, 1, 1, shade(h, 40));
      return;
    case 'spiky':
    default:
      if (dir === 'side') {
        rect(ctx, ox, 7, 2, 7, 4, h);
        rect(ctx, ox, 4, 3, 4, 3, h);
        rect(ctx, ox, 3, 5, 4, 2, h);
        rect(ctx, ox, 5, 7, 3, 2, h);
        rect(ctx, ox, 9, 1, 3, 1, h);
        rect(ctx, ox, 12, 5, 2, 2, h);
        rect(ctx, ox, 2, 4, 1, 1, hd);
      } else {
        rect(ctx, ox, 5, 2, 10, 4, h);
        rect(ctx, ox, 4, 3, 2, 6, h);
        rect(ctx, ox, 14, 3, 2, 6, h);
        rect(ctx, ox, 3, 4, 1, 2, h);
        rect(ctx, ox, 16, 4, 1, 2, h);
        rect(ctx, ox, 5, 0, 2, 2, h);
        rect(ctx, ox, 9, 0, 2, 2, h);
        rect(ctx, ox, 13, 0, 2, 2, h);
        rect(ctx, ox, 7, 1, 2, 1, h);
        rect(ctx, ox, 11, 1, 2, 1, h);
        if (dir === 'down') {
          rect(ctx, ox, 6, 6, 2, 1, h);
          rect(ctx, ox, 9, 6, 1, 2, h);
          rect(ctx, ox, 12, 6, 2, 1, h);
        } else {
          rect(ctx, ox, 5, 6, 10, 4, h);
          rect(ctx, ox, 6, 10, 2, 1, hd);
          rect(ctx, ox, 12, 10, 2, 1, hd);
        }
        rect(ctx, ox, 6, 2, 2, 1, shade(h, 45));
      }
  }
}

function drawFrame(ctx: CanvasRenderingContext2D, ox: number, s: SpriteSpec, dir: Dir, step: 0 | 1, attack: boolean) {
  const skin = s.skin;
  const skinD = shade(skin, -28);
  const eye = s.eye ?? '#16161c';
  const top = s.armor ?? s.gi;
  const topD = shade(top, -30);
  // Complexión: los corpulentos tienen torso y brazos 1 px más anchos por cada lado.
  const w = s.build === 'bulky' ? 1 : 0;

  // Capa (detrás del cuerpo)
  if (s.cape) {
    if (dir === 'up') rect(ctx, ox, 4, 11, 12, 11, s.cape);
    else if (dir === 'side') rect(ctx, ox, 3, 11, 4, 10, s.cape);
    else {
      rect(ctx, ox, 3, 11, 2, 10, s.cape);
      rect(ctx, ox, 15, 11, 2, 10, s.cape);
    }
  }
  // Halo de ángel
  if (s.halo) {
    rect(ctx, ox, 6, 0, 8, 1, '#c8f0ff');
  }
  // Espada a la espalda (Trunks, Tapion)
  if (s.sword && dir !== 'side') {
    rect(ctx, ox, dir === 'up' ? 12 : 14, 3, 1, 10, '#c8d8e8');
    rect(ctx, ox, dir === 'up' ? 11 : 13, 9, 3, 1, '#8a5a2a');
  }

  // Cola
  if (s.tail) {
    if (dir === 'up') rect(ctx, ox, 9, 17, 2, 3, s.tail);
    else if (dir === 'side') rect(ctx, ox, 4, 16, 3, 2, s.tail);
    else rect(ctx, ox, 14, 15, 2, 2, s.tail);
  }

  // Piernas (alternan al andar)
  const lUp = step === 0 ? 0 : 1;
  const rUp = step === 0 ? 1 : 0;
  if (dir === 'side') {
    rect(ctx, ox, 7, 18, 3, 4 - lUp, s.pants);
    rect(ctx, ox, 11, 18, 3, 4 - rUp, shade(s.pants, -20));
    rect(ctx, ox, 7 - (step === 0 ? 1 : 0), 22 - lUp, 4, 2, s.boots);
    rect(ctx, ox, 11 + (step === 1 ? 1 : 0), 22 - rUp, 4, 2, shade(s.boots, -20));
  } else {
    rect(ctx, ox, 6, 18, 3, 4 - lUp, s.pants);
    rect(ctx, ox, 11, 18, 3, 4 - rUp, s.pants);
    rect(ctx, ox, 6, 22 - lUp, 3, 2, s.boots);
    rect(ctx, ox, 11, 22 - rUp, 3, 2, s.boots);
  }

  // Torso
  rect(ctx, ox, 6 - w, 12, 8 + w * 2, 6, top);
  rect(ctx, ox, 6 - w, 16, 8 + w * 2, 1, s.belt);
  rect(ctx, ox, 6 - w, 17, 8 + w * 2, 1, topD);
  // Pectorales marcados en corpulentos sin armadura
  if (w && !s.armor && dir === 'down') {
    rect(ctx, ox, 7, 13, 2, 1, shade(top, -25));
    rect(ctx, ox, 11, 13, 2, 1, shade(top, -25));
  }
  // Marca: color (#...) en el pecho, o letra (Majin "M", Gamma 1/2) en la frente
  if (s.mark?.startsWith('#') && dir === 'down') rect(ctx, ox, 9, 14, 2, 1, s.mark);
  if (!s.armor && dir === 'down') {
    rect(ctx, ox, 9, 12, 2, 2, s.giAccent);
  }
  if (s.armor) {
    // hombreras
    if (dir !== 'side') {
      rect(ctx, ox, 4, 12, 2, 2, s.armor);
      rect(ctx, ox, 14, 12, 2, 2, s.armor);
    }
    rect(ctx, ox, 6, 12, 8, 1, shade(s.armor, 25));
    if (dir === 'down') rect(ctx, ox, 9, 13, 2, 1, s.gi);
  }

  // Brazos
  const sleeve = s.armor ? s.gi : s.giAccent;
  if (dir === 'side') {
    if (attack) {
      rect(ctx, ox, 11, 13, 6, 2, skin);
      rect(ctx, ox, 15, 13, 3, 2, s.belt);
      rect(ctx, ox, 17, 12, 2, 3, skin);
    } else {
      const swing = step === 0 ? 0 : 1;
      rect(ctx, ox, 9, 12 + swing, 3, 2, sleeve);
      rect(ctx, ox, 9, 14 + swing, 3, 2, skin);
      rect(ctx, ox, 9, 15 + swing, 3, 1, s.belt);
    }
  } else {
    const swing = step === 0 ? 0 : 1;
    const aw = 2 + w;
    rect(ctx, ox, 4 - w * 2, 12, aw, 2, sleeve);
    rect(ctx, ox, 14 + w, 12, aw, 2, sleeve);
    rect(ctx, ox, 4 - w * 2, 14 + swing, aw, 2, skin);
    rect(ctx, ox, 14 + w, 15 - swing, aw, 2, skin);
    rect(ctx, ox, 4 - w * 2, 15 + swing, aw, 1, s.belt);
    rect(ctx, ox, 14 + w, 16 - swing, aw, 1, s.belt);
  }

  // Cabeza
  if (dir === 'side') {
    rect(ctx, ox, 7, 4, 7, 8, skin);
    rect(ctx, ox, 7, 10, 7, 2, skinD);
    rect(ctx, ox, 12, 7, 1, 2, eye);
    rect(ctx, ox, 13, 6, 1, 1, shade(skin, -15));
  } else {
    rect(ctx, ox, 6, 4, 8, 8, skin);
    rect(ctx, ox, 6, 11, 8, 1, skinD);
    if (dir === 'down') {
      rect(ctx, ox, 7, 7, 2, 2, '#ffffff');
      rect(ctx, ox, 11, 7, 2, 2, '#ffffff');
      rect(ctx, ox, 8, 7, 1, 2, eye);
      rect(ctx, ox, 11, 7, 1, 2, eye);
      rect(ctx, ox, 9, 10, 2, 1, skinD);
    }
  }
  if (s.mustache && dir !== 'up') rect(ctx, ox, dir === 'side' ? 11 : 8, 9, dir === 'side' ? 3 : 4, 1, s.mustache);
  if (s.beard && dir !== 'up') {
    rect(ctx, ox, dir === 'side' ? 10 : 7, 10, dir === 'side' ? 4 : 6, 3, s.beard);
    rect(ctx, ox, dir === 'side' ? 11 : 9, 13, 2, 1, s.beard);
  }
  if (s.earring && dir !== 'up') {
    rect(ctx, ox, dir === 'side' ? 8 : 5, 9, 1, 2, s.earring);
    if (dir === 'down') rect(ctx, ox, 14, 9, 1, 2, s.earring);
  }
  if (s.antenna) {
    rect(ctx, ox, 8, 1, 1, 3, s.antenna);
    rect(ctx, ox, 11, 1, 1, 3, s.antenna);
  }
  if (s.horns) {
    rect(ctx, ox, 4, 2, 2, 3, s.horns);
    rect(ctx, ox, 14, 2, 2, 3, s.horns);
    rect(ctx, ox, 4, 1, 1, 1, s.horns);
    rect(ctx, ox, 15, 1, 1, 1, s.horns);
  }
  drawHair(ctx, ox, s, dir);
  // Marca Majin (letra) en la frente, por encima del pelo
  if (s.mark && !s.mark.startsWith('#') && dir === 'down') {
    rect(ctx, ox, 8, 5, 1, 2, '#1b1b24');
    rect(ctx, ox, 11, 5, 1, 2, '#1b1b24');
    rect(ctx, ox, 9, 6, 2, 1, '#1b1b24');
  }
}

/** Contorno oscuro de 1 px y sombra bajo los pies. */
function postProcess(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const solid = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) solid[i] = d[i * 4 + 3] > 0 ? 1 : 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (solid[i]) continue;
      const fx = x % FRAME_W;
      const n =
        (fx > 0 && solid[i - 1]) ||
        (fx < FRAME_W - 1 && solid[i + 1]) ||
        (y > 0 && solid[i - w]) ||
        (y < h - 1 && solid[i + w]);
      if (n) {
        d[i * 4] = 20;
        d[i * 4 + 1] = 14;
        d[i * 4 + 2] = 28;
        d[i * 4 + 3] = 255;
      } else if (y >= 22) {
        const dx = (fx - 10) / 7;
        const dy = (y - 23) / 1.6;
        if (dx * dx + dy * dy <= 1) {
          d[i * 4] = 0;
          d[i * 4 + 1] = 0;
          d[i * 4 + 2] = 0;
          d[i * 4 + 3] = 70;
        }
      }
    }
  }
  ctx.putImageData(img, 0, 0);
}

/** Dibuja la hoja de 7 fotogramas en un canvas (ancho FRAME_W*7). */
export function drawCharacterSheet(ctx: CanvasRenderingContext2D, spec: SpriteSpec): void {
  ctx.clearRect(0, 0, FRAME_W * FRAME_COUNT, FRAME_H);
  ctx.imageSmoothingEnabled = false;
  const frames: [Dir, 0 | 1, boolean][] = [
    ['down', 0, false],
    ['down', 1, false],
    ['up', 0, false],
    ['up', 1, false],
    ['side', 0, false],
    ['side', 1, false],
    ['side', 0, true],
  ];
  frames.forEach(([dir, step, atk], i) => drawFrame(ctx, i * FRAME_W, spec, dir, step, atk));
  postProcess(ctx, FRAME_W * FRAME_COUNT, FRAME_H);
}

export function mergeSpec(base: SpriteSpec, override?: Partial<SpriteSpec>): SpriteSpec {
  if (!override) return base;
  const out = { ...base } as Record<string, unknown>;
  for (const [k, v] of Object.entries(override)) out[k] = v;
  return out as unknown as SpriteSpec;
}

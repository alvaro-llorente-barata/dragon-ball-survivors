import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import type { SpriteSpec } from '../../data/types';
import { FRAME_COUNT, FRAME_H, FRAME_W, drawCharacterSheet } from '../../game/art/chibi';
import { realSheet } from '../../assets/realSheets';

export function Button({
  variant = 'primary',
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' }) {
  const styles = {
    primary: 'bg-gradient-to-b from-amber-300 to-orange-500 text-slate-950 hover:from-amber-200 hover:to-orange-400 shadow-[0_4px_0_#7a3300]',
    ghost: 'bg-panel2 text-slate-100 hover:bg-slate-700 shadow-[0_4px_0_#0a0e1a]',
    danger: 'bg-red-700 text-white hover:bg-red-600 shadow-[0_4px_0_#4a0a0a]',
  }[variant];
  return (
    <button
      {...rest}
      className={`rounded-xl px-5 py-3 font-bold transition active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300 ${styles} ${className}`}
    />
  );
}

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-slate-700/70 bg-panel/90 p-4 ${className}`}>{children}</div>;
}

/**
 * Vista previa del sprite. Si se pasa `textureKey` y existe una hoja real para
 * ese personaje, muestra el arte real (animado: quieto + andar). Si no, usa el
 * generador chibi por código, como el resto del juego.
 */
export function CharacterPreview({
  spec,
  frame = 0,
  scale = 5,
  label,
  textureKey,
}: {
  spec: SpriteSpec;
  frame?: number;
  scale?: number;
  label: string;
  textureKey?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const sheet = textureKey ? realSheet(textureKey) : undefined;

  useEffect(() => {
    const c = ref.current?.getContext('2d');
    if (!c) return;
    c.imageSmoothingEnabled = false;

    if (sheet) {
      // Arte real: dibuja fotogramas de la hoja PNG (0 idle, 1-2 andar).
      const img = new Image();
      img.src = sheet.url;
      const seq = [0, 1, 0, 2];
      let i = 0;
      let raf = 0;
      const draw = () => {
        c.clearRect(0, 0, sheet.frameW, sheet.frameH);
        const f = seq[i % seq.length];
        c.drawImage(img, f * sheet.frameW, 0, sheet.frameW, sheet.frameH, 0, 0, sheet.frameW, sheet.frameH);
      };
      img.onload = draw;
      const id = window.setInterval(() => {
        i += 1;
        if (img.complete) draw();
      }, 230);
      return () => {
        window.clearInterval(id);
        if (raf) cancelAnimationFrame(raf);
      };
    }

    const off = document.createElement('canvas');
    off.width = FRAME_W * FRAME_COUNT;
    off.height = FRAME_H;
    const sctx = off.getContext('2d');
    if (!sctx) return;
    drawCharacterSheet(sctx, spec);
    let f = frame;
    const draw = () => {
      c.clearRect(0, 0, FRAME_W, FRAME_H);
      c.drawImage(off, f * FRAME_W, 0, FRAME_W, FRAME_H, 0, 0, FRAME_W, FRAME_H);
    };
    draw();
    const id = window.setInterval(() => {
      f = f === frame ? frame + 1 : frame;
      draw();
    }, 260);
    return () => window.clearInterval(id);
  }, [spec, frame, sheet]);

  const w = sheet ? sheet.frameW : FRAME_W;
  const h = sheet ? sheet.frameH : FRAME_H;
  // Mantiene una altura visual parecida entre arte real y chibi.
  const px = sheet ? (FRAME_H * scale) / h : scale;
  return (
    <canvas
      ref={ref}
      width={w}
      height={h}
      role="img"
      aria-label={label}
      className="pixel"
      style={{ width: w * px, height: h * px }}
    />
  );
}

export function formatTime(t: number): string {
  const s = Math.floor(t);
  return `${Math.floor(s / 60)
    .toString()
    .padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
}

export const hexColor = (n: number) => `#${n.toString(16).padStart(6, '0')}`;

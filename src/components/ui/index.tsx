import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import type { SpriteSpec } from '../../data/types';
import { FRAME_COUNT, FRAME_H, FRAME_W, drawCharacterSheet } from '../../game/art/chibi';

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

/** Vista previa del sprite (usa el mismo generador que el juego). */
export function CharacterPreview({ spec, frame = 0, scale = 5, label }: { spec: SpriteSpec; frame?: number; scale?: number; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const sheet = document.createElement('canvas');
    sheet.width = FRAME_W * FRAME_COUNT;
    sheet.height = FRAME_H;
    const sctx = sheet.getContext('2d');
    const c = ref.current?.getContext('2d');
    if (!sctx || !c) return;
    drawCharacterSheet(sctx, spec);
    let f = frame;
    const draw = () => {
      c.clearRect(0, 0, FRAME_W, FRAME_H);
      c.drawImage(sheet, f * FRAME_W, 0, FRAME_W, FRAME_H, 0, 0, FRAME_W, FRAME_H);
    };
    draw();
    const id = window.setInterval(() => {
      f = f === frame ? frame + 1 : frame;
      draw();
    }, 260);
    return () => window.clearInterval(id);
  }, [spec, frame]);
  return (
    <canvas
      ref={ref}
      width={FRAME_W}
      height={FRAME_H}
      role="img"
      aria-label={label}
      className="pixel"
      style={{ width: FRAME_W * scale, height: FRAME_H * scale }}
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

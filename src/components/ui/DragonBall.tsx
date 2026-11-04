import { useId } from 'react';

const LAYOUTS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[38, 50], [62, 50]],
  3: [[50, 37], [38, 60], [62, 60]],
  4: [[38, 38], [62, 38], [38, 62], [62, 62]],
  5: [[36, 36], [64, 36], [50, 50], [36, 64], [64, 64]],
  6: [[38, 32], [62, 32], [30, 50], [70, 50], [38, 68], [62, 68]],
  7: [[50, 28], [31, 40], [69, 40], [50, 50], [31, 60], [69, 60], [50, 72]],
};

export const STAR_GLOW: Record<number, string> = {
  1: '#b0b8c8',
  2: '#8ad88a',
  3: '#4a9aff',
  4: '#b45aff',
  5: '#ffc83a',
  6: '#ff8a2a',
  7: '#ff4ad0',
};

function starPath(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(`${(cx + Math.cos(a) * rad).toFixed(2)},${(cy + Math.sin(a) * rad).toFixed(2)}`);
  }
  return `M${pts.join('L')}Z`;
}

/** Bola de Dragón dibujada en SVG (arte original) con 1 a 7 estrellas. */
export function DragonBall({ stars, size = 120, glow = true, className = '' }: { stars: number; size?: number; glow?: boolean; className?: string }) {
  const id = useId().replace(/:/g, '');
  const n = Math.max(1, Math.min(7, stars));
  const starR = n >= 6 ? 7 : n >= 4 ? 8.5 : 10;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={`Bola de Dragón de ${n} estrella${n > 1 ? 's' : ''}`}
      className={className}
      style={glow ? { filter: `drop-shadow(0 0 ${size / 8}px ${STAR_GLOW[n]})` } : undefined}
    >
      <defs>
        <radialGradient id={`g${id}`} cx="38%" cy="32%" r="70%">
          <stop offset="0%" stopColor="#fff2b0" />
          <stop offset="25%" stopColor="#ffb83a" />
          <stop offset="70%" stopColor="#f07a10" />
          <stop offset="100%" stopColor="#a84400" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill={`url(#g${id})`} stroke="#6a2a00" strokeWidth="2" />
      {LAYOUTS[n].map(([x, y], i) => (
        <path key={i} d={starPath(x, y, starR)} fill="#d41a1a" stroke="#8a0a0a" strokeWidth="0.8" />
      ))}
      <ellipse cx="34" cy="26" rx="12" ry="6" fill="#ffffff" opacity="0.55" transform="rotate(-25 34 26)" />
    </svg>
  );
}

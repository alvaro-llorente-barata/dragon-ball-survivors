import { useEffect, useRef } from 'react';
import { CHEST_COLORS } from '../../data/items';
import { useRunStore } from '../../stores/runStore';
import { hexColor } from './index';

const SIZE = 140;
const POI_COLORS: Record<string, string> = {
  ruins: '#c8c8d0',
  camp: '#ff5a5a',
  altar: '#ffd84a',
  village: '#ffffff',
  secret: '#ff9aff',
};

export function Minimap() {
  const mm = useRunStore((s) => s.minimap);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgRef = useRef<HTMLImageElement | null>(null);
  const bgSrc = useRef('');

  useEffect(() => {
    if (!mm) return;
    if (bgSrc.current !== mm.bg) {
      bgSrc.current = mm.bg;
      const img = new Image();
      img.src = mm.bg;
      bgRef.current = img;
    }
    const c = canvasRef.current?.getContext('2d');
    if (!c) return;
    const k = SIZE / (mm.extent * 2);
    const mx = (x: number) => (x - mm.cx + mm.extent) * k;
    const my = (y: number) => (y - mm.cy + mm.extent) * k;
    const inView = (x: number, y: number) => mx(x) >= 0 && mx(x) <= SIZE && my(y) >= 0 && my(y) <= SIZE;
    c.imageSmoothingEnabled = false;
    c.clearRect(0, 0, SIZE, SIZE);
    if (bgRef.current?.complete) c.drawImage(bgRef.current, 0, 0, SIZE, SIZE);
    c.fillStyle = 'rgba(0,0,0,0.25)';
    c.fillRect(0, 0, SIZE, SIZE);
    for (const p of mm.pois) {
      if (!inView(p.x, p.y)) continue;
      c.fillStyle = POI_COLORS[p.type] ?? '#fff';
      c.fillRect(mx(p.x) - 2, my(p.y) - 2, 4, 4);
    }
    for (const ch of mm.chests) {
      if (!inView(ch.x, ch.y)) continue;
      c.fillStyle = hexColor(CHEST_COLORS[ch.rarity]);
      c.fillRect(mx(ch.x) - 1.5, my(ch.y) - 1.5, 3, 3);
    }
    if (mm.boss) {
      // Si el jefe está fuera del minimapa, se marca en el borde.
      const bx = Math.max(3, Math.min(SIZE - 3, mx(mm.boss.x)));
      const by = Math.max(3, Math.min(SIZE - 3, my(mm.boss.y)));
      c.fillStyle = '#ff2a2a';
      c.beginPath();
      c.arc(bx, by, 3.5, 0, Math.PI * 2);
      c.fill();
    }
    c.fillStyle = '#ffffff';
    c.strokeStyle = '#000';
    c.beginPath();
    c.arc(mx(mm.player.x), my(mm.player.y), 3, 0, Math.PI * 2);
    c.fill();
    c.stroke();
  }, [mm]);

  if (!mm) return null;
  return (
    <canvas
      ref={canvasRef}
      width={SIZE}
      height={SIZE}
      role="img"
      aria-label="Minimapa"
      className="pixel h-24 w-24 rounded-lg border-2 border-slate-600 bg-black/60 sm:h-[140px] sm:w-[140px]"
    />
  );
}

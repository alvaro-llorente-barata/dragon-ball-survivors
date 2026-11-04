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
    const k = SIZE / mm.worldSize;
    c.imageSmoothingEnabled = false;
    c.clearRect(0, 0, SIZE, SIZE);
    if (bgRef.current?.complete) c.drawImage(bgRef.current, 0, 0, SIZE, SIZE);
    c.fillStyle = 'rgba(0,0,0,0.25)';
    c.fillRect(0, 0, SIZE, SIZE);
    for (const p of mm.pois) {
      c.fillStyle = POI_COLORS[p.type] ?? '#fff';
      c.fillRect(p.x * k - 2, p.y * k - 2, 4, 4);
    }
    for (const ch of mm.chests) {
      c.fillStyle = hexColor(CHEST_COLORS[ch.rarity]);
      c.fillRect(ch.x * k - 1.5, ch.y * k - 1.5, 3, 3);
    }
    if (mm.boss) {
      c.fillStyle = '#ff2a2a';
      c.beginPath();
      c.arc(mm.boss.x * k, mm.boss.y * k, 3.5, 0, Math.PI * 2);
      c.fill();
    }
    c.fillStyle = '#ffffff';
    c.strokeStyle = '#000';
    c.beginPath();
    c.arc(mm.player.x * k, mm.player.y * k, 3, 0, Math.PI * 2);
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

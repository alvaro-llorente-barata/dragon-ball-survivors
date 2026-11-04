import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { bridge, virtualInput } from '../../game/bridge';
import { useMetaStore } from '../../stores/metaStore';
import { useRunStore } from '../../stores/runStore';

const RADIUS = 52;

/** Joystick virtual y botones táctiles. Escriben en virtualInput / bridge, que lee Phaser. */
export function TouchControls() {
  const setting = useMetaStore((s) => s.meta.settings.touchControls);
  const modal = useRunStore((s) => s.modal);
  const hud = useRunStore((s) => s.hud);
  const [coarse, setCoarse] = useState(false);
  const [stick, setStick] = useState<{ ox: number; oy: number; x: number; y: number } | null>(null);
  const pointerId = useRef<number | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)');
    setCoarse(mq.matches);
    const on = (e: MediaQueryListEvent) => setCoarse(e.matches);
    mq.addEventListener('change', on);
    return () => {
      mq.removeEventListener('change', on);
      virtualInput.x = 0;
      virtualInput.y = 0;
    };
  }, []);

  const show = setting === 'on' || (setting === 'auto' && coarse);
  if (!show || modal) return null;

  const down = (e: RPointerEvent<HTMLDivElement>) => {
    if (pointerId.current !== null) return;
    pointerId.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    setStick({ ox: e.clientX, oy: e.clientY, x: 0, y: 0 });
  };
  const move = (e: RPointerEvent<HTMLDivElement>) => {
    if (pointerId.current !== e.pointerId || !stick) return;
    let dx = e.clientX - stick.ox;
    let dy = e.clientY - stick.oy;
    const d = Math.hypot(dx, dy);
    if (d > RADIUS) {
      dx = (dx / d) * RADIUS;
      dy = (dy / d) * RADIUS;
    }
    virtualInput.x = dx / RADIUS;
    virtualInput.y = dy / RADIUS;
    setStick({ ...stick, x: dx, y: dy });
  };
  const up = (e: RPointerEvent<HTMLDivElement>) => {
    if (pointerId.current !== e.pointerId) return;
    pointerId.current = null;
    virtualInput.x = 0;
    virtualInput.y = 0;
    setStick(null);
  };

  const btn = 'pointer-events-auto flex h-16 w-16 items-center justify-center rounded-full border-2 text-xs font-black backdrop-blur active:scale-95';

  return (
    <>
      <div
        className="pointer-events-auto absolute bottom-0 left-0 h-1/2 w-1/2"
        style={{ touchAction: 'none' }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        aria-label="Zona del joystick"
      >
        {stick && (
          <div className="pointer-events-none fixed" style={{ left: stick.ox - RADIUS, top: stick.oy - RADIUS }}>
            <div className="h-[104px] w-[104px] rounded-full border-2 border-white/40 bg-white/10" />
            <div
              className="absolute h-11 w-11 rounded-full bg-white/60"
              style={{ left: RADIUS - 22 + stick.x, top: RADIUS - 22 + stick.y }}
            />
          </div>
        )}
        {!stick && <div className="absolute bottom-8 left-8 text-xs text-white/50">Arrastra para moverte</div>}
      </div>
      <div className="absolute bottom-6 right-4 flex flex-col items-end gap-3">
        <div className="flex gap-3">
          <button
            className={`${btn} ${hud?.ultimate.ready ? 'border-sky-300 bg-sky-500/50' : 'border-white/30 bg-black/40'}`}
            onPointerDown={() => bridge.commands?.ultimate()}
            aria-label="Ataque definitivo"
          >
            Q<br />Ult.
          </button>
          <button className={`${btn} border-white/40 bg-black/40`} onPointerDown={() => bridge.commands?.dodge()} aria-label="Esquivar">
            Esq.
          </button>
        </div>
      </div>
      <button
        className="pointer-events-auto absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full border border-white/30 bg-black/50 px-4 py-1 text-xs"
        onPointerDown={() => bridge.commands?.pause()}
      >
        Pausa
      </button>
    </>
  );
}

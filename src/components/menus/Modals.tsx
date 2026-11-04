import { useEffect, type ReactNode } from 'react';
import { BOSSES } from '../../data/bosses';
import { CHEST_COLORS, CHEST_NAMES } from '../../data/items';
import { getMap } from '../../data/maps';
import { bridge } from '../../game/bridge';
import { runAccountXp } from '../../services/progressionService';
import { useRunStore, type Modal } from '../../stores/runStore';
import { Button, formatTime, hexColor } from '../ui';

const KIND_LABEL: Record<string, string> = {
  weapon_new: 'NUEVO ATAQUE',
  weapon_up: 'MEJORA',
  evolve: '✨ EVOLUCIÓN',
  link: '🔗 VÍNCULO DE KI',
  passive: 'PASIVA',
  heal: 'CURACIÓN',
  coins: 'MONEDAS',
};

function Backdrop({ children, tint = 'bg-black/70' }: { children: ReactNode; tint?: string }) {
  return <div className={`absolute inset-0 z-20 flex items-center justify-center p-4 ${tint}`}>{children}</div>;
}

function LevelUp({ modal }: { modal: Extract<Modal, { type: 'levelup' }> }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key === 'r' || e.key === 'R') return bridge.commands?.reroll();
      const i = Number(e.key) - 1;
      if (i >= 0 && i < modal.choices.length) bridge.commands?.chooseUpgrade(modal.choices[i].id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modal]);
  const style = (kind: string) =>
    kind === 'evolve'
      ? 'border-amber-300 bg-gradient-to-b from-amber-500/40 to-panel2 shine'
      : kind === 'link'
        ? 'border-sky-300 bg-gradient-to-b from-sky-600/40 to-panel2'
        : 'border-amber-300/60 bg-panel2';
  return (
    <Backdrop>
      <div className="pop-in w-full max-w-3xl text-center">
        <h2 className="title-text text-4xl">{modal.title}</h2>
        <p className="mb-4 text-sm text-slate-300">Elige una mejora · teclas 1 2 3</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {modal.choices.map((c, i) => (
            <button
              key={c.id}
              onClick={() => bridge.commands?.chooseUpgrade(c.id)}
              style={c.kind === 'evolve' ? { ['--glow' as string]: '#ffd84a' } : undefined}
              className={`rounded-2xl border-2 p-4 text-left transition hover:-translate-y-1 hover:border-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300 ${style(c.kind)}`}
            >
              <div className="flex items-center justify-between text-[10px] font-bold text-amber-300">
                <span>{KIND_LABEL[c.kind]}</span>
                <span className="rounded bg-black/40 px-1.5">{i + 1}</span>
              </div>
              <div className="mt-1 text-lg font-black">{c.name}</div>
              {c.kind !== 'evolve' && c.kind !== 'link' && (
                <div className="text-xs text-slate-400">
                  Nivel {c.level}/{c.maxLevel}
                </div>
              )}
              <div className="mt-2 text-sm text-slate-200">{c.description}</div>
            </button>
          ))}
        </div>
        <button
          className="mt-4 rounded-lg bg-slate-800 px-4 py-2 text-sm disabled:opacity-40"
          disabled={modal.rerolls <= 0}
          onClick={() => bridge.commands?.reroll()}
        >
          🎲 Cambiar cartas (R) · quedan {modal.rerolls}
        </button>
      </div>
    </Backdrop>
  );
}

/** Ventana del Vínculo de Ki: elige dos huecos para unirlos en uno. */
function Link({ modal }: { modal: Extract<Modal, { type: 'link' }> }) {
  const label = (i: number) => modal.slots[i].weapons.map((w) => `${w.name} ${w.evolved ? 'EVO' : `Nv${w.level}`}`).join(' + ');
  return (
    <Backdrop tint="bg-sky-950/80">
      <div className="pop-in w-full max-w-2xl rounded-3xl border-2 border-sky-300 bg-panel p-6 text-center shine" style={{ ['--glow' as string]: '#6ac8ff' }}>
        <div className="text-5xl" aria-hidden>
          🔗
        </div>
        <h2 className="title-text text-4xl">Vínculo de Ki</h2>
        <p className="mt-1 text-sm text-slate-300">
          Une dos huecos: sus ataques atacarán juntos y quedará un hueco libre para aprender otro. Máximo 3 ataques por hueco. Tienes {modal.links}.
        </p>
        <div className="mt-4 grid grid-cols-4 gap-2 text-xs">
          {modal.slots.map((s, i) => (
            <div key={i} className="rounded-xl border border-slate-600 bg-black/40 p-2">
              <div className="font-black text-amber-300">Hueco {i + 1}</div>
              {s.weapons.length ? s.weapons.map((w) => <div key={w.id}>{w.name}</div>) : <div className="text-slate-500">Libre</div>}
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-2">
          {modal.pairs.map(([a, b]) => (
            <button key={`${a}-${b}`} className="block w-full rounded-xl border border-sky-400/60 bg-sky-900/40 px-3 py-2 text-left text-sm hover:bg-sky-800/60" onClick={() => bridge.commands?.link(a, b)}>
              <b className="text-sky-200">
                Hueco {a + 1} + Hueco {b + 1}
              </b>
              : {label(a)} + {label(b)}
            </button>
          ))}
        </div>
        <Button variant="ghost" className="mt-4" onClick={() => bridge.commands?.closeModal()}>
          Guardar para después (V)
        </Button>
      </div>
    </Backdrop>
  );
}

function Chest({ modal }: { modal: Extract<Modal, { type: 'chest' }> }) {
  const color = hexColor(CHEST_COLORS[modal.rarity]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') bridge.commands?.closeModal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return (
    <Backdrop>
      <div className="pop-in shine w-full max-w-md rounded-3xl border-2 bg-panel p-6 text-center" style={{ borderColor: color, ['--glow' as string]: color }}>
        <div className="text-sm font-bold" style={{ color }}>
          COFRE {CHEST_NAMES[modal.rarity].toUpperCase()}
        </div>
        <h2 className="text-3xl font-black">¡Recompensas!</h2>
        <ul className="mt-4 space-y-2">
          {modal.rewards.map((r, i) => (
            <li key={i} className="pop-in flex items-center gap-3 rounded-xl bg-black/40 px-3 py-2 text-left" style={{ animationDelay: `${i * 120}ms` }}>
              <span className="text-2xl" aria-hidden>
                {r.icon}
              </span>
              <span className="font-semibold">{r.label}</span>
            </li>
          ))}
        </ul>
        <Button className="mt-5" onClick={() => bridge.commands?.closeModal()}>
          Continuar
        </Button>
      </div>
    </Backdrop>
  );
}

function Pause() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') bridge.commands?.resume();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return (
    <Backdrop>
      <div className="pop-in w-full max-w-sm rounded-3xl bg-panel p-6 text-center">
        <h2 className="title-text text-4xl">Pausa</h2>
        <p className="mt-2 text-sm text-slate-300">
          WASD/flechas mover · 1-4 o Tab cambiar hueco · Espacio teletransporte · Q definitivo · E transformación · V usar Vínculo
        </p>
        <div className="mt-5 flex flex-col gap-3">
          <Button onClick={() => bridge.commands?.resume()}>Continuar</Button>
          <Button variant="danger" onClick={() => bridge.commands?.abandon()}>
            Abandonar (conservas lo ganado)
          </Button>
        </div>
      </div>
    </Backdrop>
  );
}

function GameOver({ modal, onRetry, onMenu }: { modal: Extract<Modal, { type: 'gameover' }>; onRetry: () => void; onMenu: () => void }) {
  const r = modal.result;
  const rows: [string, string][] = [
    ['Tiempo', formatTime(r.time)],
    ['Nivel alcanzado', String(r.level)],
    ['Enemigos derrotados', String(r.kills)],
    ['Cofres abiertos', String(r.chestsOpened)],
    ['Jefes derrotados', r.bossesDefeated.length ? r.bossesDefeated.map((id) => BOSSES[id]?.name ?? id).join(', ') : '—'],
    ['Monedas', `+${r.coins}`],
    ['Tickets', `+${r.tickets}`],
    ['Fragmentos', `+${r.fragments}`],
    ['EXP de cuenta', `+${runAccountXp(r)}`],
  ];
  return (
    <Backdrop tint="bg-black/80">
      <div className="pop-in w-full max-w-md rounded-3xl bg-panel p-6 text-center">
        <h2 className="title-text text-4xl">{modal.reason === 'death' ? 'Has caído' : 'Partida terminada'}</h2>
        <p className="text-sm text-slate-300">Todo lo ganado se ha guardado.</p>
        <div className="mt-4 space-y-1 text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between border-b border-slate-800 py-1">
              <span className="text-slate-400">{k}</span>
              <span className="font-bold">{v}</span>
            </div>
          ))}
        </div>
        {modal.unlockedMaps.map((id) => (
          <div key={id} className="mt-3 rounded-lg bg-amber-500/20 p-2 font-bold text-amber-200">
            🔓 Nuevo escenario: {getMap(id).name}
          </div>
        ))}
        <div className="mt-5 flex justify-center gap-3">
          <Button onClick={onRetry}>Reintentar</Button>
          <Button variant="ghost" onClick={onMenu}>
            Menú
          </Button>
        </div>
      </div>
    </Backdrop>
  );
}

export function Modals({ onRetry, onMenu }: { onRetry: () => void; onMenu: () => void }) {
  const modal = useRunStore((s) => s.modal);
  if (!modal) return null;
  switch (modal.type) {
    case 'levelup':
      return <LevelUp modal={modal} />;
    case 'chest':
      return <Chest modal={modal} />;
    case 'link':
      return <Link modal={modal} />;
    case 'pause':
      return <Pause />;
    case 'gameover':
      return <GameOver modal={modal} onRetry={onRetry} onMenu={onMenu} />;
  }
}

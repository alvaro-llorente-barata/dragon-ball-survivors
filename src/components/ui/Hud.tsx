import { CHEST_COLORS } from '../../data/items';
import { bridge } from '../../game/bridge';
import { useRunStore } from '../../stores/runStore';
import { Minimap } from './Minimap';
import { formatTime, hexColor } from './index';

function Bar({ value, max, color, label, height = 'h-3' }: { value: number; max: number; color: string; label: string; height?: string }) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));
  return (
    <div
      className={`relative w-full overflow-hidden rounded-full border border-black/60 bg-black/60 ${height}`}
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(value)}
      aria-valuemax={max}
    >
      <div className="h-full transition-[width] duration-100" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

/** Interfaz de la partida (React encima del canvas de Phaser). */
export function Hud() {
  const hud = useRunStore((s) => s.hud);
  const toasts = useRunStore((s) => s.toasts);
  if (!hud) return null;
  const auraColor = hexColor(hud.auraColor);
  return (
    <div className="pointer-events-none absolute inset-0 text-white [text-shadow:0_1px_2px_#000]">
      {/* Experiencia */}
      <div className="absolute inset-x-0 top-0 px-2 pt-1">
        <Bar value={hud.xp} max={hud.xpNext} color="linear-gradient(90deg,#4ab4ff,#9fe6ff)" label="Experiencia" height="h-2.5" />
      </div>

      {/* Vida, Ki, nivel */}
      <div className="absolute left-2 top-5 w-52 space-y-1 sm:w-64">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-amber-300 bg-black/70 text-sm font-black">
            {hud.level}
          </div>
          <div className="flex-1 space-y-1">
            <Bar value={hud.hp} max={hud.maxHp} color="linear-gradient(90deg,#e83a3a,#ff8a6a)" label="Vida" />
            <Bar value={hud.ki} max={hud.maxKi} color="linear-gradient(90deg,#1a9aff,#6ae0ff)" label="Ki" />
          </div>
        </div>
        <div className="text-[11px] text-slate-200">
          ❤ {hud.hp}/{hud.maxHp} · Ki {hud.ki}/{hud.maxKi}
          {hud.shieldHits > 0 && <span className="ml-1 text-sky-300">◆{hud.shieldHits}</span>}
        </div>
        <div className="text-xs font-bold" style={{ color: auraColor }}>
          {hud.charName} <span className="text-amber-300">{'★'.repeat(hud.stars)}</span>
          {hud.formName && <span className="ml-1 rounded bg-black/60 px-1">⚡ {hud.formName}</span>}
        </div>
        {hud.nextForm && (
          <div className={`text-[11px] ${hud.nextForm.ready ? 'font-bold text-amber-300' : 'text-slate-400'}`}>
            [E] {hud.nextForm.name}: {hud.nextForm.reason}
            <div className="mt-0.5 w-40">
              <Bar value={hud.ki} max={hud.nextForm.kiCost} color={hud.nextForm.ready ? '#ffd84a' : '#8a7a3a'} label="Medidor de transformación" height="h-1.5" />
            </div>
          </div>
        )}
        <div className={`text-[11px] ${hud.ultimate.ready ? 'font-bold text-sky-300' : 'text-slate-400'}`}>
          [Q] {hud.ultimate.name} ({hud.ultimate.kiCost} Ki){hud.ultimate.cooldown > 0 ? ` · ${Math.round(hud.ultimate.cooldown * 100)}%` : ''}
        </div>
        {hud.links > 0 && (
          <div className="pointer-events-auto">
            <button className="rounded bg-sky-700/80 px-2 py-0.5 text-[11px] font-bold" onClick={() => bridge.commands?.useLink()}>
              🔗 Vínculos de Ki: {hud.links} (V)
            </button>
          </div>
        )}
        <div className="flex flex-wrap gap-1">
          {hud.passives.map((p) => (
            <span key={p.id} className="rounded bg-emerald-950/70 px-1.5 py-0.5 text-[10px] text-emerald-200">
              {p.name} {p.level}
            </span>
          ))}
        </div>
        {hud.buffs.map((b) => (
          <div key={b.id} className="text-[11px] text-amber-200">
            ✦ {b.label} {b.remaining}s
          </div>
        ))}
      </div>

      {/* Tiempo, bajas, monedas */}
      <div className="absolute left-1/2 top-5 -translate-x-1/2 text-center">
        <div className="text-2xl font-black tabular-nums">{formatTime(hud.time)}</div>
        <div className="text-xs text-slate-200">
          💀 {hud.kills} · 🪙 {hud.coins}
        </div>
      </div>

      {/* Jefe */}
      {hud.boss && (
        <div className="absolute left-1/2 top-20 w-[min(560px,80vw)] -translate-x-1/2 text-center">
          <div className={`text-sm font-black ${hud.boss.mini ? 'text-orange-300' : 'text-red-300'}`}>
            {hud.boss.mini ? 'MINIBOSS' : 'JEFE'} · {hud.boss.name}
          </div>
          <Bar value={hud.boss.hp} max={hud.boss.maxHp} color="linear-gradient(90deg,#8a0a2a,#ff3a5a)" label={`Vida de ${hud.boss.name}`} height="h-3.5" />
        </div>
      )}

      {/* Minimapa e indicador de cofre */}
      <div className="absolute right-2 top-5 flex flex-col items-end gap-1">
        <Minimap />
        {hud.nearestChest && (
          <div className="flex items-center gap-1 rounded bg-black/60 px-2 py-0.5 text-[11px]">
            <span
              className="inline-block"
              style={{ transform: `rotate(${hud.nearestChest.angle}rad)`, color: hexColor(CHEST_COLORS[hud.nearestChest.rarity]) }}
            >
              ➤
            </span>
            Cofre a {hud.nearestChest.distance} m
          </div>
        )}
      </div>

      {/* Huecos de ataque (1-4). Solo ataca el seleccionado; los vinculados atacan juntos. */}
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2" role="toolbar" aria-label="Huecos de ataque">
        {hud.slots.map((slot, i) => {
          const sel = i === hud.selected;
          const empty = slot.weapons.length === 0;
          return (
            <button
              key={i}
              disabled={empty}
              onClick={() => bridge.commands?.selectSlot(i)}
              aria-pressed={sel}
              title={slot.weapons.map((w) => `${w.name} Nv ${w.level}${w.evolved ? ' (evolucionado)' : ''}`).join(' + ') || 'Hueco libre'}
              className={`group pointer-events-auto relative min-w-[64px] rounded-xl border-2 px-1.5 pb-1 pt-3 text-left transition sm:min-w-[96px] ${
                sel ? 'border-amber-300 bg-black/80 shadow-[0_0_14px_#ffd84a88]' : 'border-slate-600 bg-black/55'
              } ${empty ? 'opacity-40' : ''}`}
            >
              <span className={`absolute left-1 top-0 text-[10px] font-black ${sel ? 'text-amber-300' : 'text-slate-400'}`}>{i + 1}</span>
              {slot.weapons.length > 1 && <span className="absolute right-1 top-0 text-[10px] text-sky-300">🔗</span>}
              {empty ? (
                <span className="block text-center text-[10px] text-slate-400">Libre</span>
              ) : (
                slot.weapons.map((w) => (
                  <div key={w.id} className="relative mb-0.5 overflow-hidden rounded bg-slate-900/80 px-1 text-[10px] leading-4">
                    <div className="absolute inset-y-0 left-0 bg-white/15" style={{ width: `${w.cooldown * 100}%` }} />
                    <span className="relative" style={{ color: w.evolved ? '#ffd84a' : hexColor(w.color) }}>
                      {w.evolved ? '✦' : '●'}
                    </span>{' '}
                    <span className="relative hidden sm:inline">{w.name}</span> <b className="relative text-amber-300">{w.evolved ? 'EVO' : w.level}</b>
                  </div>
                ))
              )}
            </button>
          );
        })}
      </div>
      <div className="absolute bottom-[86px] left-1/2 -translate-x-1/2 text-[10px] text-slate-300 sm:bottom-[92px]">
        {hud.stage} · {hud.difficulty} · 1-4 / Tab: cambiar hueco
      </div>

      {/* Avisos */}
      <div className="absolute inset-x-0 top-32 flex flex-col items-center gap-1 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast-in rounded-lg bg-black/65 px-3 py-1 text-center font-bold ${t.big ? 'text-lg' : 'text-sm'}`}
            style={{ color: t.color }}
          >
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}

import { useState } from 'react';
import type { Screen } from '../../App';
import { Button, Panel } from '../../components/ui';
import { chestProbabilities, CHEST_RARITIES } from '../../game/logic/loot';
import { CHEST_NAMES } from '../../data/items';
import { META_UPGRADES, metaBonuses, upgradeCost } from '../../services/economyService';
import { useMetaStore } from '../../stores/metaStore';

export function UpgradesPage({ go }: { go: (s: Screen) => void }) {
  const meta = useMetaStore((s) => s.meta);
  const buy = useMetaStore((s) => s.buy);
  const [msg, setMsg] = useState<string | null>(null);
  const probs = chestProbabilities(metaBonuses(meta).luck);

  return (
    <div className="mx-auto flex min-h-full max-w-3xl flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => go('home')}>
          ← Volver
        </Button>
        <h1 className="title-text text-3xl">Mejoras permanentes</h1>
        <div className="font-bold text-gold">🪙 {meta.coins}</div>
      </div>
      {msg && (
        <div className="rounded-lg bg-red-900/60 px-3 py-2 text-sm" role="alert">
          {msg}
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {META_UPGRADES.map((u) => {
          const lvl = meta.upgrades[u.id] ?? 0;
          const maxed = lvl >= u.max;
          const cost = upgradeCost(u, lvl);
          return (
            <Panel key={u.id}>
              <div className="flex items-center justify-between">
                <h2 className="font-black">{u.name}</h2>
                <span className="text-xs text-slate-400">
                  {lvl}/{u.max}
                </span>
              </div>
              <p className="text-sm text-slate-300">{u.description} por nivel</p>
              <div className="mt-2 flex gap-1" aria-hidden>
                {Array.from({ length: u.max }, (_, i) => (
                  <span key={i} className={`h-2 flex-1 rounded ${i < lvl ? 'bg-amber-400' : 'bg-slate-700'}`} />
                ))}
              </div>
              <Button
                className="mt-3 w-full py-2"
                disabled={maxed || meta.coins < cost}
                onClick={() => setMsg(buy(u.id))}
              >
                {maxed ? 'Máximo' : `Mejorar · 🪙 ${cost}`}
              </Button>
            </Panel>
          );
        })}
      </div>
      <Panel>
        <h2 className="font-bold">Probabilidad real de rareza de cofres aleatorios</h2>
        <div className="mt-2 grid grid-cols-5 gap-2 text-center text-xs">
          {CHEST_RARITIES.map((r) => (
            <div key={r}>
              <div className="text-slate-400">{CHEST_NAMES[r]}</div>
              <div className="font-bold">{probs[r].toFixed(1)}%</div>
            </div>
          ))}
        </div>
      </Panel>
      <Panel>
        <h2 className="font-bold">Inventario</h2>
        <p className="text-sm text-slate-300">
          🎫 Tickets de invocación: <b>{meta.tickets}</b>
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Usa los tickets en Invocaciones. Los fragmentos de cada personaje (al repetirlo) sirven para subirlo de nivel en la Colección.
        </p>
      </Panel>
    </div>
  );
}

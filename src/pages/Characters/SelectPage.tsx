import { useState } from 'react';
import type { Screen } from '../../App';
import { Button, CharacterPreview, Panel, hexColor } from '../../components/ui';
import { getWeapon } from '../../data/attacks';
import { CHARACTERS, SAGA_NAMES } from '../../data/characters';
import { MAPS } from '../../data/maps';
import { mergeSpec } from '../../game/art/chibi';
import { audio } from '../../services/audioService';
import { useMetaStore } from '../../stores/metaStore';

const RARITY: Record<string, string> = {
  common: 'Común',
  rare: 'Raro',
  epic: 'Épico',
  legendary: 'Legendario',
  mythic: 'Mítico',
};

export function SelectPage({ go }: { go: (s: Screen) => void }) {
  const meta = useMetaStore((s) => s.meta);
  const select = useMetaStore((s) => s.select);
  const [charId, setCharId] = useState(meta.selectedCharacter);
  const [mapId, setMapId] = useState(meta.unlockedMaps.includes(meta.selectedMap) ? meta.selectedMap : 'earth');
  const char = CHARACTERS.find((c) => c.id === charId) ?? CHARACTERS[0];
  const everDefeated = Object.keys(meta.bossesDefeated);

  const start = () => {
    audio.ensure();
    select(char.id, mapId);
    go('game');
  };

  const statRows: [string, number][] = [
    ['Vida', char.stats.hp],
    ['Ki', char.stats.ki],
    ['Ataque físico', char.stats.physical],
    ['Ataque de energía', char.stats.energy],
    ['Defensa', char.stats.defense],
    ['Velocidad', char.stats.speed],
  ];

  return (
    <div className="mx-auto flex min-h-full max-w-5xl flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => go('home')}>
          ← Volver
        </Button>
        <h1 className="title-text text-3xl">Elige guerrero y escenario</h1>
        <div className="w-24" />
      </div>

      <div className="flex flex-wrap gap-2">
        {CHARACTERS.map((c) => (
          <button
            key={c.id}
            onClick={() => setCharId(c.id)}
            className={`rounded-xl border-2 p-2 ${c.id === char.id ? 'border-amber-300 bg-panel2' : 'border-slate-700 bg-panel'}`}
            aria-pressed={c.id === char.id}
          >
            <CharacterPreview spec={c.sprite} scale={3} label={c.name} />
            <div className="text-sm font-bold">{c.name}</div>
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel>
          <div className="flex gap-4">
            <CharacterPreview spec={char.sprite} scale={6} label={char.name} />
            <div>
              <h2 className="text-2xl font-black">{char.name}</h2>
              <div className="text-xs text-amber-300">
                {SAGA_NAMES[char.saga]} · {RARITY[char.rarity]}
              </div>
              <p className="mt-2 text-sm text-slate-300">{char.description}</p>
              {char.passives.map((p) => (
                <p key={p.id} className="mt-1 text-xs text-emerald-300">
                  Pasiva: {p.name}. {p.description}
                </p>
              ))}
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            {statRows.map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-slate-800">
                <span className="text-slate-400">{k}</span>
                <span className="font-bold">{v}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <h3 className="font-bold">Ataques</h3>
          <ul className="mt-1 space-y-1 text-sm">
            {char.weaponPool.map((id) => {
              const w = getWeapon(id);
              return (
                <li key={id}>
                  <span className="font-semibold" style={{ color: hexColor(w.color) }}>
                    {w.name}
                  </span>
                  {id === char.startingWeapon && <span className="ml-1 text-xs text-amber-300">(inicial)</span>}
                  <span className="text-slate-400"> · {w.description}</span>
                </li>
              );
            })}
            <li>
              <span className="font-semibold text-sky-300">{getWeapon(char.ultimate).name}</span>
              <span className="text-slate-400"> · {getWeapon(char.ultimate).description}</span>
            </li>
            <li>
              <span className="font-semibold text-sky-300">{char.dodge.name}</span>
              <span className="text-slate-400"> · Esquiva instantánea (Espacio).</span>
            </li>
          </ul>
        </Panel>
      </div>

      <Panel>
        <h3 className="font-bold">Transformaciones (E durante la partida)</h3>
        <div className="mt-2 flex flex-wrap gap-3">
          {char.transformations.map((f) => {
            const locked = f.requiresBossEver && !everDefeated.includes(f.requiresBossEver);
            return (
              <div key={f.id} className={`w-40 rounded-xl border border-slate-700 p-2 text-center ${locked ? 'opacity-50' : ''}`}>
                <div className="flex justify-center rounded-lg" style={{ boxShadow: `0 0 18px ${hexColor(f.aura)}55 inset` }}>
                  <CharacterPreview spec={mergeSpec(char.sprite, f.sprite)} scale={3} label={f.name} />
                </div>
                <div className="font-bold" style={{ color: f.id === 'base' ? undefined : hexColor(f.aura) }}>
                  {f.name}
                </div>
                <div className="text-[11px] text-slate-400">
                  {f.id === 'base' ? 'Inicial' : `Nivel ${f.minLevel} · ${f.kiCost} Ki · -${f.kiDrain} Ki/s`}
                </div>
                {f.id !== 'base' && <div className="text-[11px] text-slate-300">Daño x{f.damageMul}</div>}
                {locked && <div className="text-[11px] text-red-300">🔒 {f.description}</div>}
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel>
        <h3 className="font-bold">Escenario</h3>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          {MAPS.map((m) => {
            const unlocked = meta.unlockedMaps.includes(m.id);
            return (
              <button
                key={m.id}
                disabled={!unlocked}
                onClick={() => setMapId(m.id)}
                aria-pressed={m.id === mapId}
                className={`rounded-xl border-2 p-3 text-left disabled:opacity-50 ${m.id === mapId ? 'border-amber-300' : 'border-slate-700'}`}
                style={{ background: `linear-gradient(135deg, ${m.palette.grass}55, ${m.palette.water}55)` }}
              >
                <div className="font-bold">{m.name}</div>
                <div className="text-xs text-slate-200">{m.description}</div>
                {!unlocked && m.unlock.type === 'boss' && <div className="mt-1 text-xs text-red-200">🔒 {m.unlock.label}</div>}
              </button>
            );
          })}
        </div>
      </Panel>

      <Button className="self-center px-12 text-xl" onClick={start}>
        ¡A luchar!
      </Button>
      <p className="text-center text-xs text-slate-400">
        WASD/flechas: mover · Espacio: teletransporte · Q: ataque definitivo · E: transformarse · Esc: pausa
      </p>
    </div>
  );
}

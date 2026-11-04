import { useMemo, useState } from 'react';
import type { Screen } from '../../App';
import { Button, CharacterPreview, Panel, hexColor } from '../../components/ui';
import { DragonBall } from '../../components/ui/DragonBall';
import { getWeapon } from '../../data/attacks';
import { CHARACTERS, RARITY_NAMES, SAGA_NAMES } from '../../data/characters';
import { MAPS } from '../../data/maps';
import { rarityForStars } from '../../data/types';
import { MAX_WEAPONS } from '../../game/logic/upgrades';
import { audio } from '../../services/audioService';
import { CHAR_POWER_PER_LEVEL } from '../../services/economyService';
import { levelUpCost } from '../../services/gachaService';
import { MAX_CHAR_LEVEL } from '../../services/saveService/meta';
import { useMetaStore } from '../../stores/metaStore';

/** Colección y selección: todos los personajes, solo se juega con los conseguidos. */
export function SelectPage({ go }: { go: (s: Screen) => void }) {
  const meta = useMetaStore((s) => s.meta);
  const select = useMetaStore((s) => s.select);
  const levelUp = useMetaStore((s) => s.levelUp);
  const [charId, setCharId] = useState(meta.unlockedCharacters.includes(meta.selectedCharacter) ? meta.selectedCharacter : 'goku');
  const [mapId, setMapId] = useState(meta.unlockedMaps.includes(meta.selectedMap) ? meta.selectedMap : 'earth');
  const [query, setQuery] = useState('');
  const [starFilter, setStarFilter] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const char = CHARACTERS.find((c) => c.id === charId) ?? CHARACTERS[0];
  const owned = meta.unlockedCharacters.includes(char.id);
  const prog = meta.characters[char.id] ?? { level: 1, shards: 0 };
  const cost = levelUpCost(prog.level);

  const list = useMemo(
    () =>
      CHARACTERS.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()) && (starFilter === 0 || c.stars === starFilter)).sort(
        (a, b) => a.stars - b.stars,
      ),
    [query, starFilter],
  );

  const start = () => {
    if (!owned) return;
    audio.ensure();
    select(char.id, mapId);
    go('game');
  };

  const power = 1 + (prog.level - 1) * CHAR_POWER_PER_LEVEL;
  const statRows: [string, number][] = [
    ['Vida', Math.round(char.stats.hp * power)],
    ['Ki', char.stats.ki],
    ['Ataque físico', Math.round(char.stats.physical * power)],
    ['Ataque de energía', Math.round(char.stats.energy * power)],
    ['Defensa', char.stats.defense],
    ['Velocidad', char.stats.speed],
  ];

  return (
    <div className="mx-auto flex min-h-full max-w-5xl flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => go('home')}>
          ← Volver
        </Button>
        <h1 className="title-text text-3xl">Colección</h1>
        <Button variant="ghost" onClick={() => go('summon')}>
          🎫 Invocar
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre"
          aria-label="Buscar personaje"
          className="rounded-lg bg-panel2 px-3 py-2 text-sm"
        />
        <select value={starFilter} onChange={(e) => setStarFilter(Number(e.target.value))} aria-label="Filtrar por estrellas" className="rounded-lg bg-panel2 px-3 py-2 text-sm">
          <option value={0}>Todas las rarezas</option>
          {[1, 2, 3, 4, 5, 6, 7].map((s) => (
            <option key={s} value={s}>
              {'★'.repeat(s)} {RARITY_NAMES[rarityForStars(s)]}
            </option>
          ))}
        </select>
        <span className="text-xs text-slate-400">
          {meta.unlockedCharacters.length}/{CHARACTERS.length} conseguidos
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-9">
        {list.map((c) => {
          const has = meta.unlockedCharacters.includes(c.id);
          return (
            <button
              key={c.id}
              onClick={() => setCharId(c.id)}
              aria-pressed={c.id === char.id}
              className={`rounded-xl border-2 p-1 text-center ${c.id === char.id ? 'border-amber-300 bg-panel2' : 'border-slate-700 bg-panel'} ${has ? '' : 'opacity-45 grayscale'}`}
            >
              <div className="flex justify-center">
                <CharacterPreview spec={c.sprite} scale={3} label={c.name} />
              </div>
              <div className="text-[10px] text-amber-300">{'★'.repeat(c.stars)}</div>
              <div className="truncate text-[10px] font-bold">{c.name.replace('Goku ', '')}</div>
              {has ? <div className="text-[9px] text-slate-400">Nv {meta.characters[c.id]?.level ?? 1}</div> : <div className="text-[9px]">🔒</div>}
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel>
          <div className="flex gap-4">
            <div className="flex flex-col items-center gap-2">
              <div style={char.aura ? { filter: `drop-shadow(0 0 12px ${hexColor(char.aura)})` } : undefined}>
                <CharacterPreview spec={char.sprite} scale={6} label={char.name} />
              </div>
              <DragonBall stars={char.stars} size={44} />
            </div>
            <div>
              <h2 className="text-2xl font-black">{char.name}</h2>
              <div className="text-xs text-amber-300">
                {'★'.repeat(char.stars)} · {RARITY_NAMES[rarityForStars(char.stars)]} · {SAGA_NAMES[char.saga]}
              </div>
              <p className="mt-2 text-sm text-slate-300">{char.description}</p>
              {char.passives.map((p) => (
                <p key={p.id} className="mt-1 text-xs text-emerald-300">
                  Pasiva: {p.name}. {p.description}
                </p>
              ))}
              {!owned && <p className="mt-2 text-sm font-bold text-red-300">🔒 Consíguelo en las invocaciones.</p>}
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
          {owned && (
            <div className="mt-3 rounded-xl bg-black/30 p-3 text-sm">
              <div className="flex justify-between">
                <span>
                  Nivel <b>{prog.level}</b>/{MAX_CHAR_LEVEL}
                </span>
                <span>💠 {prog.shards} fragmentos</span>
              </div>
              {prog.level < MAX_CHAR_LEVEL && (
                <Button className="mt-2 w-full py-2" disabled={prog.shards < cost.shards || meta.coins < cost.coins} onClick={() => setMsg(levelUp(char.id))}>
                  Subir nivel (+6% vida y daño) · 💠{cost.shards} · 🪙{cost.coins}
                </Button>
              )}
              {msg && <p className="mt-1 text-xs text-red-300">{msg}</p>}
            </div>
          )}
        </Panel>

        <Panel>
          <h3 className="font-bold">Ataques (máximo {MAX_WEAPONS} a la vez en partida)</h3>
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
              <span className="font-semibold text-sky-300">[Q] {getWeapon(char.ultimate).name}</span>
              <span className="text-slate-400"> · {getWeapon(char.ultimate).description}</span>
            </li>
            <li>
              <span className="font-semibold text-sky-300">[Espacio] {char.dodge.name}</span>
              <span className="text-slate-400"> · Esquiva instantánea.</span>
            </li>
          </ul>
        </Panel>
      </div>

      <Panel>
        <h3 className="font-bold">Escenario (mapa infinito)</h3>
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

      <Button className="self-center px-12 text-xl" disabled={!owned} onClick={start}>
        {owned ? `¡A luchar con ${char.name}!` : 'Personaje bloqueado'}
      </Button>
      <p className="text-center text-xs text-slate-400">WASD/flechas: mover · Espacio: teletransporte · Q: ataque definitivo · Esc: pausa</p>
    </div>
  );
}

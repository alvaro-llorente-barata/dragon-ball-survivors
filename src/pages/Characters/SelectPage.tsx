import { useMemo, useState } from 'react';
import type { Screen } from '../../App';
import { Button, CharacterPreview, Panel, hexColor } from '../../components/ui';
import { DragonBall } from '../../components/ui/DragonBall';
import { getWeapon } from '../../data/attacks';
import { CHARACTERS, RARITY_NAMES, SAGA_NAMES, SAGA_THEME } from '../../data/characters';
import { MAPS } from '../../data/maps';
import { PASSIVES } from '../../data/passives';
import { SAGAS, rarityForStars, type Saga } from '../../data/types';
import { mergeSpec } from '../../game/art/chibi';
import { DIFFICULTIES } from '../../game/logic/spawn';
import { MAX_PER_SLOT, MAX_SLOTS } from '../../game/logic/slots';
import { audio } from '../../services/audioService';
import { CHAR_POWER_PER_LEVEL } from '../../services/economyService';
import { levelUpCost, sagaProgress } from '../../services/gachaService';
import { MAX_CHAR_LEVEL } from '../../services/saveService/meta';
import { useMetaStore } from '../../stores/metaStore';

type Tab = Saga | 'all' | 'favorites';

/** Colección por sagas y selección de personaje, escenario y dificultad. */
export function SelectPage({ go }: { go: (s: Screen) => void }) {
  const meta = useMetaStore((s) => s.meta);
  const { select, levelUp, toggleFavorite, setDifficulty } = useMetaStore();
  const [charId, setCharId] = useState(meta.unlockedCharacters.includes(meta.selectedCharacter) ? meta.selectedCharacter : 'goku');
  const [mapId, setMapId] = useState(meta.unlockedMaps.includes(meta.selectedMap) ? meta.selectedMap : 'earth');
  const initial = CHARACTERS.find((c) => c.id === charId)?.saga ?? 'saiyan';
  const [tab, setTab] = useState<Tab>(initial);
  const [query, setQuery] = useState('');
  const [starFilter, setStarFilter] = useState(0);
  const [ownedOnly, setOwnedOnly] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const char = CHARACTERS.find((c) => c.id === charId) ?? CHARACTERS[0];
  const owned = meta.unlockedCharacters.includes(char.id);
  const prog = meta.characters[char.id] ?? { level: 1, shards: 0 };
  const cost = levelUpCost(prog.level);
  const totalOwned = CHARACTERS.filter((c) => meta.unlockedCharacters.includes(c.id)).length;

  const list = useMemo(
    () =>
      CHARACTERS.filter(
        (c) =>
          (tab === 'all' || (tab === 'favorites' ? meta.favorites.includes(c.id) : c.saga === tab)) &&
          (query === '' || c.name.toLowerCase().includes(query.toLowerCase())) &&
          (starFilter === 0 || c.stars === starFilter) &&
          (!ownedOnly || meta.unlockedCharacters.includes(c.id)),
      ).sort((a, b) => a.stars - b.stars),
    [tab, query, starFilter, ownedOnly, meta.favorites, meta.unlockedCharacters],
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
  const theme = SAGA_THEME[char.saga];

  return (
    <div className="mx-auto flex min-h-full max-w-6xl flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => go('home')}>
          ← Volver
        </Button>
        <h1 className="title-text text-3xl">Colección · {totalOwned}/{CHARACTERS.length}</h1>
        <Button variant="ghost" onClick={() => go('summon')}>
          🎫 Invocar
        </Button>
      </div>

      {/* Pestañas de sagas */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Sagas">
        {(['all', 'favorites', ...SAGAS] as Tab[]).map((t) => {
          const isSaga = t !== 'all' && t !== 'favorites';
          const p = isSaga ? sagaProgress(meta, t as Saga) : null;
          const th = isSaga ? SAGA_THEME[t as Saga] : null;
          return (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`rounded-xl border-2 px-3 py-1.5 text-xs font-bold ${tab === t ? 'border-amber-300' : 'border-slate-700'}`}
              style={th ? { background: `linear-gradient(160deg, ${th.from}, ${th.to})` } : { background: '#1d2540' }}
            >
              {th?.icon} {t === 'all' ? 'Todas' : t === 'favorites' ? '★ Favoritos' : SAGA_NAMES[t as Saga]}
              {p && (
                <span className="ml-1 font-normal text-slate-200">
                  {p.owned}/{p.total} ({Math.round((p.owned / p.total) * 100)}%)
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nombre" aria-label="Buscar personaje" className="rounded-lg bg-panel2 px-3 py-2 text-sm" />
        <select value={starFilter} onChange={(e) => setStarFilter(Number(e.target.value))} aria-label="Filtrar por rareza" className="rounded-lg bg-panel2 px-3 py-2 text-sm">
          <option value={0}>Todas las rarezas</option>
          {[1, 2, 3, 4, 5, 6, 7].map((s) => (
            <option key={s} value={s}>
              {'★'.repeat(s)} {RARITY_NAMES[rarityForStars(s)]}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1 text-sm">
          <input type="checkbox" checked={ownedOnly} onChange={(e) => setOwnedOnly(e.target.checked)} className="accent-amber-400" /> Solo conseguidos
        </label>
        <span className="text-xs text-slate-400">{list.length} personajes</span>
      </div>

      <div className="grid max-h-[340px] grid-cols-4 gap-2 overflow-y-auto pr-1 sm:grid-cols-6 md:grid-cols-10">
        {list.map((c) => {
          const has = meta.unlockedCharacters.includes(c.id);
          return (
            <button
              key={c.id}
              onClick={() => setCharId(c.id)}
              aria-pressed={c.id === char.id}
              aria-label={has ? c.name : `Bloqueado (${c.stars} estrellas)`}
              className={`relative rounded-xl border-2 p-1 text-center ${c.id === char.id ? 'border-amber-300 bg-panel2' : 'border-slate-700 bg-panel'}`}
            >
              {meta.favorites.includes(c.id) && <span className="absolute right-1 top-0 text-[10px] text-amber-300">★</span>}
              <div className={`flex justify-center ${has ? '' : 'brightness-0 opacity-50'}`}>
                <CharacterPreview spec={c.sprite} textureKey={`char_${c.id}`} scale={3} label={has ? c.name : 'Silueta'} />
              </div>
              <div className="text-[9px] text-amber-300">{'★'.repeat(c.stars)}</div>
              <div className="truncate text-[10px] font-bold">{has ? c.name : '???'}</div>
              {has && <div className="text-[9px] text-slate-400">Nv {meta.characters[c.id]?.level ?? 1}</div>}
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 opacity-30" style={{ background: `radial-gradient(ellipse at top left, ${theme.from}, transparent 70%)` }} />
          <div className="relative flex gap-4">
            <div className="flex flex-col items-center gap-2">
              <div className={owned ? '' : 'brightness-0 opacity-60'} style={owned && char.aura ? { filter: `drop-shadow(0 0 12px ${hexColor(char.aura)})` } : undefined}>
                <CharacterPreview spec={char.sprite} textureKey={`char_${char.id}`} scale={6} label={char.name} />
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
              {!owned && <p className="mt-2 text-sm font-bold text-red-300">🔒 Consíguelo en la máquina de {SAGA_NAMES[char.saga]}.</p>}
              {owned && (
                <button className="mt-2 rounded bg-slate-800 px-2 py-1 text-xs" onClick={() => toggleFavorite(char.id)}>
                  {meta.favorites.includes(char.id) ? '★ Quitar de favoritos' : '☆ Marcar como favorito'}
                </button>
              )}
            </div>
          </div>
          <div className="relative mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            {statRows.map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-slate-800">
                <span className="text-slate-400">{k}</span>
                <span className="font-bold">{v}</span>
              </div>
            ))}
          </div>
          {owned && (
            <div className="relative mt-3 rounded-xl bg-black/30 p-3 text-sm">
              <div className="flex justify-between">
                <span>
                  Dominio <b>{prog.level}</b>/{MAX_CHAR_LEVEL}
                </span>
                <span>💠 {prog.shards} fragmentos</span>
              </div>
              {prog.level < MAX_CHAR_LEVEL && (
                <Button className="mt-2 w-full py-2" disabled={prog.shards < cost.shards || meta.coins < cost.coins} onClick={() => setMsg(levelUp(char.id))}>
                  Subir dominio (+6% vida y daño) · 💠{cost.shards} · 🪙{cost.coins}
                </Button>
              )}
              {msg && <p className="mt-1 text-xs text-red-300">{msg}</p>}
            </div>
          )}
        </Panel>

        <Panel>
          <h3 className="font-bold">
            Ataques ({MAX_SLOTS} huecos · hasta {MAX_PER_SLOT} vinculados por hueco)
          </h3>
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
                  {w.evolution && (
                    <div className="ml-3 text-[11px] text-amber-200">
                      ✨ Evoluciona a {w.evolution.name} (nivel 5 + {PASSIVES[w.evolution.passive]?.name})
                    </div>
                  )}
                </li>
              );
            })}
            <li>
              <span className="font-semibold text-sky-300">[Q] {getWeapon(char.ultimate).name}</span>
              <span className="text-slate-400"> · {getWeapon(char.ultimate).description}</span>
            </li>
          </ul>
          {char.transformations?.length ? (
            <>
              <h3 className="mt-3 font-bold">Transformaciones en partida (E)</h3>
              <div className="mt-1 flex flex-wrap gap-2">
                {char.transformations.map((f, i) => {
                  const spec = char.transformations!.slice(0, i + 1).reduce((acc, ff) => mergeSpec(acc, ff.sprite), char.sprite);
                  return (
                    <div key={f.id} className="w-28 rounded-xl border border-slate-700 p-1 text-center">
                      <div className="flex justify-center" style={{ filter: `drop-shadow(0 0 6px ${hexColor(f.aura)})` }}>
                        <CharacterPreview spec={spec} textureKey={`char_${char.id}_${f.id}`} scale={2} label={f.name} />
                      </div>
                      <div className="text-[11px] font-bold" style={{ color: hexColor(f.aura) }}>
                        {f.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Nv {f.minLevel} · {f.kiCost} Ki · x{f.damageMul}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="mt-3 text-xs text-slate-500">Sin transformaciones en partida: esta versión ya tiene su poder fijo.</p>
          )}
        </Panel>
      </div>

      <Panel>
        <h3 className="font-bold">Dificultad</h3>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {Object.values(DIFFICULTIES).map((d) => (
            <button
              key={d.id}
              onClick={() => setDifficulty(d.id)}
              aria-pressed={meta.difficulty === d.id}
              className={`rounded-xl border-2 p-3 text-left ${meta.difficulty === d.id ? 'border-amber-300 bg-panel2' : 'border-slate-700'}`}
            >
              <div className="font-bold">{d.name}</div>
              <div className="text-xs text-slate-300">{d.description}</div>
            </button>
          ))}
        </div>
      </Panel>

      <Panel>
        <h3 className="font-bold">Escenario (mapa infinito · jefe definitivo en el minuto 30)</h3>
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
      <p className="text-center text-xs text-slate-400">WASD: mover · 1-4/Tab: hueco · Espacio: esquivar · Q: definitivo · E: transformarse · V: Vínculo · Esc: pausa</p>
    </div>
  );
}

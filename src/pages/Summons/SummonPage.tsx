import { useEffect, useState } from 'react';
import type { Screen } from '../../App';
import { Button, CharacterPreview, Panel } from '../../components/ui';
import { DragonBall, STAR_GLOW } from '../../components/ui/DragonBall';
import { RARITY_NAMES, SAGA_NAMES, SAGA_THEME, getCharacter } from '../../data/characters';
import { SAGAS, rarityForStars, type Saga } from '../../data/types';
import { audio } from '../../services/audioService';
import { PITY_EPIC, PITY_TOP, PULL_SIZES, SAGA_REWARD, bannerPool, pityOf, sagaProgress, starProbabilities, type SummonBatch, type SummonResult } from '../../services/gachaService';
import { useMetaStore } from '../../stores/metaStore';

/** Máquina tragaperras: tres rodillos de Bolas de Dragón que se paran en las estrellas del resultado. */
function SlotMachine({ result, saga, onDone }: { result: SummonResult; saga: Saga; onDone: () => void }) {
  const [spin, setSpin] = useState([1, 1, 1]);
  const [stopped, setStopped] = useState(0);
  const theme = SAGA_THEME[saga];
  useEffect(() => {
    setStopped(0);
    audio.play('capsule');
    const id = window.setInterval(() => setSpin((s) => s.map(() => 1 + Math.floor(Math.random() * 7))), 70);
    const stops = [500, 850, 1200 + result.stars * 120].map((ms, i) =>
      window.setTimeout(() => {
        setStopped(i + 1);
        audio.play(i === 2 ? (result.stars >= 5 ? 'transform' : 'chest') : 'coin');
      }, ms),
    );
    const done = window.setTimeout(onDone, 1700 + result.stars * 120);
    return () => {
      window.clearInterval(id);
      stops.forEach(window.clearTimeout);
      window.clearTimeout(done);
    };
  }, [result, onDone]);
  return (
    <div className="flex flex-col items-center">
      <div className="rounded-3xl border-4 p-4 shadow-2xl" style={{ borderColor: theme.accent, background: `linear-gradient(180deg, ${theme.from}, ${theme.to})` }}>
        <div className="mb-2 flex justify-center gap-1" aria-hidden>
          {Array.from({ length: 9 }, (_, i) => (
            <span key={i} className="h-2 w-2 rounded-full" style={{ background: (i + stopped) % 2 ? theme.accent : '#ffffff55' }} />
          ))}
        </div>
        <div className="flex gap-2">
          {[0, 1, 2].map((r) => (
            <div key={r} className="flex h-28 w-24 items-center justify-center rounded-xl bg-black/70">
              <div className={stopped > r ? 'pop-in' : ''}>
                <DragonBall stars={stopped > r ? result.stars : spin[r]} size={72} glow={stopped > r} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-3 text-slate-300">Las Bolas de Dragón giran…</p>
    </div>
  );
}

function Reveal({ result, saga, index, total, onNext, onSkip }: { result: SummonResult; saga: Saga; index: number; total: number; onNext: () => void; onSkip: () => void }) {
  const [open, setOpen] = useState(false);
  const char = getCharacter(result.characterId);
  const glow = STAR_GLOW[result.stars];
  const mythic = result.stars >= 7;
  const legendary = result.stars >= 5;
  useEffect(() => setOpen(false), [result]);
  return (
    <div
      className="fixed inset-0 z-30 flex flex-col items-center justify-center p-4 text-center"
      style={{
        background: mythic
          ? 'conic-gradient(from 0deg, #ff4ad0, #ffd84a, #4ad8ff, #9aff6a, #ff4ad0)'
          : legendary
            ? `radial-gradient(circle, ${glow}55 0%, #000000ee 70%)`
            : '#000000e6',
      }}
      onClick={() => (open ? onNext() : setOpen(true))}
    >
      {mythic && open && <div className="absolute inset-0 bg-black/70" />}
      <div className="absolute right-4 top-4 z-10 flex gap-2">
        <span className="text-sm text-slate-200">
          {index + 1}/{total}
        </span>
        <button
          className="rounded bg-slate-800 px-3 py-1 text-sm"
          onClick={(e) => {
            e.stopPropagation();
            onSkip();
          }}
        >
          Saltar animaciones
        </button>
      </div>
      {!open ? (
        <SlotMachine result={result} saga={saga} onDone={() => setOpen(true)} />
      ) : (
        <div className="relative z-10">
          <div className="relative flex h-64 w-64 items-center justify-center">
            <div className="ball-flash absolute h-64 w-64 rounded-full" style={{ background: `radial-gradient(circle, ${glow} 0%, transparent 70%)` }} />
            <div className="pop-in float-y relative" style={{ filter: `drop-shadow(0 0 ${legendary ? 30 : 16}px ${glow})` }}>
              <CharacterPreview spec={char.sprite} textureKey={`char_${char.id}`} scale={8} label={char.name} />
            </div>
          </div>
          <div className="pop-in mt-2">
            {mythic && <div className="title-text text-3xl">¡¡MÍTICO!!</div>}
            {!mythic && legendary && <div className="title-text text-2xl">¡LEGENDARIO!</div>}
            <div className="text-2xl text-amber-300">{'★'.repeat(result.stars)}</div>
            <div className="text-3xl font-black">{char.name}</div>
            <div className="text-sm font-bold" style={{ color: glow }}>
              {RARITY_NAMES[rarityForStars(result.stars)]} · {SAGA_NAMES[char.saga]}
            </div>
            <div className="mt-2 text-lg font-bold">{result.isNew ? <span className="text-emerald-300">¡NUEVO!</span> : <span className="text-sky-300">Repetido: +{result.shards} fragmentos</span>}</div>
            <p className="mt-3 text-xs text-slate-300">Toca para continuar</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function SummonPage({ go }: { go: (s: Screen) => void }) {
  const meta = useMetaStore((s) => s.meta);
  const doSummon = useMetaStore((s) => s.summon);
  const [saga, setSaga] = useState<Saga>('saiyan');
  const [batch, setBatch] = useState<(SummonBatch & { saga: Saga }) | null>(null);
  const [idx, setIdx] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const pool = bannerPool(saga);
  const probs = starProbabilities(pool);
  const pity = pityOf(meta, saga);
  const prog = sagaProgress(meta, saga);
  const theme = SAGA_THEME[saga];

  const pull = (n: number) => {
    audio.ensure();
    const r = doSummon(n, saga);
    if (typeof r === 'string') return setMsg(r);
    setMsg(null);
    // Las tiradas de 100 van directas al resumen (solo se anima lo mejor si es 6★ o más).
    setIdx(n >= 100 ? r.results.length : 0);
    setBatch({ ...r, saga });
  };

  const revealing = batch && idx < batch.results.length;
  const sorted = batch ? [...batch.results].sort((a, b) => b.stars - a.stars) : [];
  const newCount = batch?.results.filter((r) => r.isNew).length ?? 0;

  return (
    <div className="mx-auto flex min-h-full max-w-5xl flex-col gap-4 p-4">
      {revealing && (
        <Reveal result={batch.results[idx]} saga={batch.saga} index={idx} total={batch.results.length} onNext={() => setIdx(idx + 1)} onSkip={() => setIdx(batch.results.length)} />
      )}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => go('home')}>
          ← Volver
        </Button>
        <h1 className="title-text text-3xl">Invocaciones</h1>
        <div className="text-lg font-bold">🎫 {meta.tickets}</div>
      </div>

      {/* Máquinas por saga */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9" role="tablist" aria-label="Banners por saga">
        {SAGAS.map((s) => {
          const t = SAGA_THEME[s];
          const p = sagaProgress(meta, s);
          return (
            <button
              key={s}
              role="tab"
              aria-selected={s === saga}
              onClick={() => setSaga(s)}
              className={`rounded-xl border-2 p-2 text-center text-[11px] font-bold ${s === saga ? 'scale-105' : 'opacity-75'}`}
              style={{ borderColor: s === saga ? t.accent : '#334', background: `linear-gradient(160deg, ${t.from}, ${t.to})` }}
            >
              <div className="text-2xl" aria-hidden>
                {t.icon}
              </div>
              {SAGA_NAMES[s]}
              <div className="text-[10px] font-normal text-slate-200">
                {p.owned}/{p.total}
              </div>
            </button>
          );
        })}
      </div>

      <Panel className="text-center" >
        <div className="rounded-2xl p-4" style={{ background: `radial-gradient(ellipse at top, ${theme.from} 0%, transparent 75%)` }}>
          <div className="text-4xl" aria-hidden>
            {theme.icon}
          </div>
          <h2 className="text-2xl font-black" style={{ color: theme.accent }}>
            Máquina de {SAGA_NAMES[saga]}
          </h2>
          <p className="text-sm text-slate-300">
            Solo salen personajes de esta saga ({pool.length}). Colección: {prog.owned}/{prog.total}
            {meta.claimedSagas.includes(saga) ? ' · ✔ completada' : ` · completa para ganar 🎫${SAGA_REWARD.tickets} y 🪙${SAGA_REWARD.coins}`}
          </p>
          <div className="my-4 flex flex-wrap items-end justify-center gap-3">
            {Object.entries(probs).map(([s, p]) => (
              <div key={s} className="flex flex-col items-center">
                <DragonBall stars={Number(s)} size={30 + Number(s) * 4} glow={false} />
                <span className="mt-1 text-[11px] text-slate-200">{p.toFixed(1)}%</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {PULL_SIZES.map((n) => (
              <Button key={n} disabled={meta.tickets < n} onClick={() => pull(n)}>
                Invocar x{n} · 🎫{n}
              </Button>
            ))}
          </div>
          {msg && <p className="mt-2 text-sm text-red-300">{msg}</p>}
          <p className="mt-3 text-xs text-slate-400">
            Garantías de este banner: 4★ o más como mucho cada {PITY_EPIC} tiradas (faltan {PITY_EPIC - pity.sinceEpic}) · la rareza máxima ({Math.max(...pool.map((c) => c.stars))}★) como mucho cada {PITY_TOP} (faltan {PITY_TOP - pity.sinceTop}).
          </p>
          <p className="mt-1 text-xs text-slate-500">Los tickets se ganan jugando: jefes, cofres, cápsulas y 1 por cada 3 minutos. Sin pagos.</p>
        </div>
      </Panel>

      {batch && !revealing && (
        <Panel>
          <h2 className="mb-1 font-bold">
            Resumen: {batch.results.length} invocaciones · {newCount} nuevos
          </h2>
          {batch.completed.map((s) => (
            <div key={s} className="mb-2 rounded-lg bg-amber-500/20 p-2 text-sm font-bold text-amber-200">
              🏆 ¡Colección {SAGA_NAMES[s]} completa! +🎫{SAGA_REWARD.tickets} +🪙{SAGA_REWARD.coins}
            </div>
          ))}
          <div className="grid max-h-96 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-6 lg:grid-cols-10">
            {sorted.map((r, i) => {
              const c = getCharacter(r.characterId);
              return (
                <div key={i} className="rounded-xl border p-1 text-center" style={{ borderColor: STAR_GLOW[r.stars] }}>
                  <div className="flex justify-center">
                    <CharacterPreview spec={c.sprite} textureKey={`char_${c.id}`} scale={2} label={c.name} />
                  </div>
                  <div className="text-[10px] text-amber-300">{'★'.repeat(r.stars)}</div>
                  <div className="truncate text-[10px] font-bold">{c.name}</div>
                  <div className="text-[9px]">{r.isNew ? <span className="text-emerald-300">NUEVO</span> : <span className="text-sky-300">+{r.shards}</span>}</div>
                </div>
              );
            })}
          </div>
        </Panel>
      )}

      <Panel>
        <h2 className="mb-2 font-bold">Personajes de la máquina</h2>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {[...pool]
            .sort((a, b) => a.stars - b.stars)
            .map((c) => {
              const owned = meta.unlockedCharacters.includes(c.id);
              return (
                <div key={c.id} className="rounded-xl border border-slate-700 p-2 text-center">
                  <div className={`flex justify-center ${owned ? '' : 'brightness-0 opacity-60'}`}>
                    <CharacterPreview spec={c.sprite} textureKey={`char_${c.id}`} scale={3} label={owned ? c.name : 'Personaje bloqueado'} />
                  </div>
                  <div className="text-xs text-amber-300">{'★'.repeat(c.stars)}</div>
                  <div className="text-[11px] font-bold">{owned ? c.name : '???'}</div>
                </div>
              );
            })}
        </div>
      </Panel>
    </div>
  );
}

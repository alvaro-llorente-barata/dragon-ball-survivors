import { useEffect, useState } from 'react';
import type { Screen } from '../../App';
import { Button, CharacterPreview, Panel } from '../../components/ui';
import { DragonBall, STAR_GLOW } from '../../components/ui/DragonBall';
import { CHARACTERS, RARITY_NAMES, getCharacter } from '../../data/characters';
import { rarityForStars } from '../../data/types';
import { audio } from '../../services/audioService';
import { PITY_EPIC, PITY_MYTHIC, starProbabilities, type SummonResult } from '../../services/gachaService';
import { useMetaStore } from '../../stores/metaStore';

type Phase = 'ball' | 'open';

/** Revela una invocación: la Bola de Dragón tiembla, brilla y muestra al personaje. */
function Reveal({ result, index, total, onNext, onSkip }: { result: SummonResult; index: number; total: number; onNext: () => void; onSkip: () => void }) {
  const [phase, setPhase] = useState<Phase>('ball');
  const char = getCharacter(result.characterId);
  const glow = STAR_GLOW[result.stars];
  useEffect(() => {
    setPhase('ball');
    audio.play('warning');
    // Cuantas más estrellas, más dura el suspense.
    const t = window.setTimeout(() => {
      setPhase('open');
      audio.play(result.stars >= 5 ? 'transform' : 'chest');
    }, 700 + result.stars * 180);
    return () => window.clearTimeout(t);
  }, [result]);

  return (
    <div className="fixed inset-0 z-30 flex flex-col items-center justify-center bg-black/90 p-4 text-center" onClick={() => (phase === 'open' ? onNext() : setPhase('open'))}>
      <div className="absolute right-4 top-4 flex gap-2">
        <span className="text-sm text-slate-400">
          {index + 1}/{total}
        </span>
        {total > 1 && (
          <button
            className="rounded bg-slate-800 px-3 py-1 text-sm"
            onClick={(e) => {
              e.stopPropagation();
              onSkip();
            }}
          >
            Saltar
          </button>
        )}
      </div>
      <div className="relative flex h-64 w-64 items-center justify-center">
        {phase === 'ball' ? (
          <div className="ball-shake">
            <DragonBall stars={result.stars} size={180} />
          </div>
        ) : (
          <>
            <div className="ball-flash absolute h-64 w-64 rounded-full" style={{ background: `radial-gradient(circle, ${glow} 0%, transparent 70%)` }} />
            <div className="pop-in float-y relative" style={{ filter: `drop-shadow(0 0 18px ${glow})` }}>
              <CharacterPreview spec={char.sprite} scale={8} label={char.name} />
            </div>
          </>
        )}
      </div>
      {phase === 'open' ? (
        <div className="pop-in mt-4">
          <div className="text-2xl text-amber-300">{'★'.repeat(result.stars)}</div>
          <div className="text-3xl font-black">{char.name}</div>
          <div className="text-sm font-bold" style={{ color: glow }}>
            {RARITY_NAMES[rarityForStars(result.stars)]}
          </div>
          <div className="mt-2 text-lg font-bold">
            {result.isNew ? <span className="text-emerald-300">¡NUEVO!</span> : <span className="text-sky-300">Repetido: +{result.shards} fragmentos</span>}
          </div>
          <p className="mt-3 text-xs text-slate-400">Toca para continuar</p>
        </div>
      ) : (
        <p className="mt-4 text-slate-300">La Bola de Dragón brilla…</p>
      )}
    </div>
  );
}

export function SummonPage({ go }: { go: (s: Screen) => void }) {
  const meta = useMetaStore((s) => s.meta);
  const doSummon = useMetaStore((s) => s.summon);
  const [results, setResults] = useState<SummonResult[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const probs = starProbabilities();

  const pull = (n: number) => {
    audio.ensure();
    const r = doSummon(n);
    if (typeof r === 'string') {
      setMsg(r);
      return;
    }
    setMsg(null);
    setIdx(0);
    setResults(r);
  };

  const revealing = results && idx < results.length;

  return (
    <div className="mx-auto flex min-h-full max-w-4xl flex-col gap-4 p-4">
      {revealing && (
        <Reveal result={results[idx]} index={idx} total={results.length} onNext={() => setIdx(idx + 1)} onSkip={() => setIdx(results.length)} />
      )}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => go('home')}>
          ← Volver
        </Button>
        <h1 className="title-text text-3xl">Invocaciones</h1>
        <div className="font-bold">🎫 {meta.tickets}</div>
      </div>

      <Panel className="bg-[radial-gradient(ellipse_at_top,#4a2a10_0%,transparent_70%)] text-center">
        <h2 className="text-xl font-black text-amber-300">Banner: Las fases de Goku</h2>
        <p className="text-sm text-slate-300">Cada invocación abre una Bola de Dragón. Sus estrellas dicen la rareza del guerrero.</p>
        <div className="my-4 flex flex-wrap items-end justify-center gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((s) => (
            <div key={s} className="flex flex-col items-center">
              <DragonBall stars={s} size={34 + s * 4} glow={false} />
              <span className="mt-1 text-[11px] text-slate-300">{probs[s] !== undefined ? `${probs[s].toFixed(1)}%` : '—'}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-3">
          <Button disabled={meta.tickets < 1} onClick={() => pull(1)}>
            Invocar x1 · 🎫1
          </Button>
          <Button disabled={meta.tickets < 10} onClick={() => pull(10)}>
            Invocar x10 · 🎫10
          </Button>
        </div>
        {msg && <p className="mt-2 text-sm text-red-300">{msg}</p>}
        <p className="mt-3 text-xs text-slate-400">
          Garantías: 4★ o más como mucho cada {PITY_EPIC} invocaciones (te faltan {PITY_EPIC - meta.gacha.sinceEpic}) · 7★ como mucho cada {PITY_MYTHIC} (te faltan{' '}
          {PITY_MYTHIC - meta.gacha.sinceMythic}).
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Los tickets se ganan jugando: jefes (1-2), cofres legendarios y divinos, cápsulas misteriosas y 1 por cada 3 minutos sobrevividos. Sin pagos.
        </p>
      </Panel>

      {results && !revealing && (
        <Panel>
          <h2 className="mb-2 font-bold">Resultado</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {results.map((r, i) => {
              const c = getCharacter(r.characterId);
              return (
                <div key={i} className="rounded-xl border p-2 text-center" style={{ borderColor: STAR_GLOW[r.stars] }}>
                  <div className="flex justify-center">
                    <CharacterPreview spec={c.sprite} scale={3} label={c.name} />
                  </div>
                  <div className="text-xs text-amber-300">{'★'.repeat(r.stars)}</div>
                  <div className="text-xs font-bold">{c.name}</div>
                  <div className="text-[10px]">{r.isNew ? <span className="text-emerald-300">NUEVO</span> : <span className="text-sky-300">+{r.shards} frag.</span>}</div>
                </div>
              );
            })}
          </div>
        </Panel>
      )}

      <Panel>
        <h2 className="mb-2 font-bold">Personajes de este banner</h2>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {[...CHARACTERS]
            .sort((a, b) => a.stars - b.stars)
            .map((c) => {
              const owned = meta.unlockedCharacters.includes(c.id);
              return (
                <div key={c.id} className={`rounded-xl border border-slate-700 p-2 text-center ${owned ? '' : 'opacity-50'}`}>
                  <div className="flex justify-center">
                    <CharacterPreview spec={c.sprite} scale={3} label={c.name} />
                  </div>
                  <div className="text-xs text-amber-300">{'★'.repeat(c.stars)}</div>
                  <div className="text-[11px] font-bold">{c.name}</div>
                  <div className="text-[10px] text-slate-400">{owned ? 'Conseguido' : 'Por conseguir'}</div>
                </div>
              );
            })}
        </div>
      </Panel>
    </div>
  );
}

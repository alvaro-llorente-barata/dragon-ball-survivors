import type { Screen } from '../../App';
import { Button, CharacterPreview, Panel, formatTime } from '../../components/ui';
import { getCharacter } from '../../data/characters';
import { audio } from '../../services/audioService';
import { accountLevel } from '../../services/saveService/meta';
import { useMetaStore } from '../../stores/metaStore';

export function HomePage({ go }: { go: (s: Screen) => void }) {
  const meta = useMetaStore((s) => s.meta);
  const acc = accountLevel(meta.accountXp);
  // Muestra el personaje seleccionado; si por algún motivo no existe, cae a Goku.
  const selId = meta.unlockedCharacters.includes(meta.selectedCharacter) ? meta.selectedCharacter : 'goku';
  const hero = getCharacter(selId);

  return (
    <div className="relative flex min-h-full flex-col items-center justify-center gap-6 overflow-hidden bg-[radial-gradient(ellipse_at_top,#2a3a7a_0%,#0b0f1a_70%)] p-6">
      <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(#ffd84a_1px,transparent_1px)] [background-size:28px_28px]" />
      <div className="relative text-center">
        <h1 className="title-text text-5xl sm:text-7xl">DRAGON BALL</h1>
        <h2 className="title-text text-4xl sm:text-6xl">SURVIVORS</h2>
        <p className="mt-2 text-sm text-slate-300">Fan game gratuito · sobrevive en un mundo infinito, invoca guerreros y vence a los jefes</p>
      </div>

      <div className="relative flex flex-col items-center gap-1">
        <CharacterPreview spec={hero.sprite} textureKey={`char_${hero.id}`} frame={0} scale={7} label={hero.name} />
        <span className="text-sm font-bold text-amber-200">{hero.name}</span>
      </div>

      <div className="relative flex w-full max-w-xs flex-col gap-3">
        <Button
          onClick={() => {
            audio.ensure();
            go('select');
          }}
        >
          Jugar
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            audio.ensure();
            go('summon');
          }}
        >
          🐉 Invocaciones ({meta.tickets} 🎫)
        </Button>
        <Button variant="ghost" onClick={() => go('upgrades')}>
          Mejoras permanentes
        </Button>
        <Button variant="ghost" onClick={() => go('settings')}>
          Ajustes y guardado
        </Button>
      </div>

      <Panel className="relative grid w-full max-w-md grid-cols-3 gap-2 text-center text-sm">
        <div>
          <div className="text-xs text-slate-400">Monedas</div>
          <div className="font-bold text-gold">🪙 {meta.coins}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400">Tickets</div>
          <div className="font-bold">🎫 {meta.tickets}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400">Cuenta</div>
          <div className="font-bold">Nv {acc.level}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400">Mejor tiempo</div>
          <div className="font-bold">{formatTime(meta.stats.bestTime)}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400">Enemigos</div>
          <div className="font-bold">{meta.stats.totalKills}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400">Partidas</div>
          <div className="font-bold">{meta.stats.runs}</div>
        </div>
      </Panel>

      <p className="relative max-w-md text-center text-[11px] leading-snug text-slate-500">
        Proyecto de fans sin ánimo de lucro, sin anuncios ni pagos. No está afiliado ni aprobado por los titulares de Dragon Ball.
        Gráficos y sonidos originales generados por código.
      </p>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import type Phaser from 'phaser';
import type { Screen } from '../../App';
import { Hud } from '../../components/ui/Hud';
import { Modals } from '../../components/menus/Modals';
import { TouchControls } from '../../components/ui/TouchControls';
import { createGame } from '../../game/createGame';
import { metaBonuses } from '../../services/economyService';
import { audio } from '../../services/audioService';
import { useMetaStore } from '../../stores/metaStore';
import { useRunStore } from '../../stores/runStore';

export function GamePage({ go }: { go: (s: Screen) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [runKey, setRunKey] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { meta, applyRun } = useMetaStore.getState();
    useRunStore.getState().reset();
    let game: Phaser.Game | null = null;
    // Se crea en el siguiente tick para que el doble montaje de StrictMode no cree dos juegos.
    const timer = window.setTimeout(() => {
      game = createGame(el, {
        characterId: meta.selectedCharacter,
        mapId: meta.selectedMap,
        seed: Math.floor(Math.random() * 2 ** 31),
        meta: metaBonuses(meta, meta.selectedCharacter),
        settings: meta.settings,
        everDefeated: Object.keys(meta.bossesDefeated),
        onEnd: (result) => applyRun(result),
      });
    }, 0);
    return () => {
      window.clearTimeout(timer);
      audio.stopMusic();
      (game as Phaser.Game | null)?.destroy(true);
      game = null;
      useRunStore.getState().reset();
    };
  }, [runKey]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-black select-none" style={{ touchAction: 'none' }}>
      <div ref={ref} key={runKey} className="absolute inset-0" />
      <Hud />
      <TouchControls />
      <Modals onRetry={() => setRunKey((k) => k + 1)} onMenu={() => go('home')} />
    </div>
  );
}

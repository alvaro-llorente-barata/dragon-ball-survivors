import { useEffect, useState } from 'react';
import { useMetaStore } from './stores/metaStore';
import { HomePage } from './pages/Home/HomePage';
import { SelectPage } from './pages/Characters/SelectPage';
import { GamePage } from './pages/Game/GamePage';
import { UpgradesPage } from './pages/Upgrades/UpgradesPage';
import { SettingsPage } from './pages/Settings/SettingsPage';
import { SummonPage } from './pages/Summons/SummonPage';

export type Screen = 'home' | 'select' | 'game' | 'upgrades' | 'settings' | 'summon';

export function App() {
  const { loaded, load, error } = useMetaStore();
  const [screen, setScreen] = useState<Screen>('home');

  useEffect(() => {
    void load();
  }, [load]);

  if (!loaded) {
    return <div className="flex h-full items-center justify-center text-lg text-slate-300">Cargando partida…</div>;
  }

  return (
    <div className="h-full">
      {error && <div className="bg-red-900 px-4 py-2 text-sm text-red-100">{error}</div>}
      {screen === 'home' && <HomePage go={setScreen} />}
      {screen === 'select' && <SelectPage go={setScreen} />}
      {screen === 'game' && <GamePage go={setScreen} />}
      {screen === 'upgrades' && <UpgradesPage go={setScreen} />}
      {screen === 'settings' && <SettingsPage go={setScreen} />}
      {screen === 'summon' && <SummonPage go={setScreen} />}
    </div>
  );
}

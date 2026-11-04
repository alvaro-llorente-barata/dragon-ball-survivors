import { useRef, useState } from 'react';
import type { Screen } from '../../App';
import { Button, Panel } from '../../components/ui';
import { audio } from '../../services/audioService';
import { useMetaStore } from '../../stores/metaStore';

export function SettingsPage({ go }: { go: (s: Screen) => void }) {
  const { meta, updateSettings, exportSave, importSave, resetSave } = useMetaStore();
  const s = meta.settings;
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const onImport = async (file: File | undefined) => {
    if (!file) return;
    const err = importSave(await file.text());
    setMsg(err ? `Error al importar: ${err}` : 'Partida importada correctamente.');
  };

  return (
    <div className="mx-auto flex min-h-full max-w-xl flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => go('home')}>
          ← Volver
        </Button>
        <h1 className="title-text text-3xl">Ajustes</h1>
        <div className="w-20" />
      </div>
      {msg && (
        <div className="rounded-lg bg-slate-800 px-3 py-2 text-sm" role="status">
          {msg}
        </div>
      )}
      <Panel className="space-y-4">
        <label className="block">
          <span className="text-sm">Efectos de sonido: {Math.round(s.sfxVolume * 100)}%</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={s.sfxVolume}
            onChange={(e) => {
              updateSettings({ sfxVolume: Number(e.target.value) });
              audio.ensure();
              audio.play('coin');
            }}
            className="w-full accent-amber-400"
          />
        </label>
        <label className="block">
          <span className="text-sm">Música: {Math.round(s.musicVolume * 100)}%</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={s.musicVolume}
            onChange={(e) => updateSettings({ musicVolume: Number(e.target.value) })}
            className="w-full accent-amber-400"
          />
        </label>
        <label className="flex items-center justify-between gap-3">
          <span className="text-sm">Calidad de partículas</span>
          <select
            value={s.particles}
            onChange={(e) => updateSettings({ particles: e.target.value === 'low' ? 'low' : 'high' })}
            className="rounded bg-panel2 px-2 py-1"
          >
            <option value="high">Alta</option>
            <option value="low">Baja (más rendimiento)</option>
          </select>
        </label>
        <label className="flex items-center justify-between gap-3">
          <span className="text-sm">Controles táctiles</span>
          <select
            value={s.touchControls}
            onChange={(e) => updateSettings({ touchControls: e.target.value as 'auto' | 'on' | 'off' })}
            className="rounded bg-panel2 px-2 py-1"
          >
            <option value="auto">Automático</option>
            <option value="on">Siempre</option>
            <option value="off">Nunca</option>
          </select>
        </label>
        <label className="flex items-center justify-between gap-3">
          <span className="text-sm">Números de daño</span>
          <input type="checkbox" checked={s.damageNumbers} onChange={(e) => updateSettings({ damageNumbers: e.target.checked })} className="h-5 w-5 accent-amber-400" />
        </label>
        <label className="flex items-center justify-between gap-3">
          <span className="text-sm">Pausar al cambiar de ventana</span>
          <input type="checkbox" checked={s.pauseOnBlur} onChange={(e) => updateSettings({ pauseOnBlur: e.target.checked })} className="h-5 w-5 accent-amber-400" />
        </label>
      </Panel>

      <Panel className="space-y-3">
        <h2 className="font-bold">Partida guardada</h2>
        <p className="text-xs text-slate-400">Se guarda sola en este navegador (IndexedDB).</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={exportSave}>
            Exportar JSON
          </Button>
          <Button variant="ghost" onClick={() => fileRef.current?.click()}>
            Importar JSON
          </Button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => void onImport(e.target.files?.[0])} />
          <Button
            variant="danger"
            onClick={() => {
              if (window.confirm('¿Seguro que quieres borrar TODA la progresión? No se puede deshacer (exporta antes si quieres una copia).')) {
                resetSave();
                setMsg('Progresión reiniciada.');
              }
            }}
          >
            Reiniciar progresión
          </Button>
        </div>
      </Panel>
    </div>
  );
}

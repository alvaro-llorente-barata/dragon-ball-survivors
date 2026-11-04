import { create } from 'zustand';
import { buyUpgrade } from '../services/economyService';
import { applyRunResult, type RunResult } from '../services/progressionService';
import { loadMeta, saveMeta, importJson, downloadJson } from '../services/saveService/indexedDb';
import { defaultMeta, type MetaState, type Settings } from '../services/saveService/meta';
import { audio } from '../services/audioService';

interface MetaStore {
  meta: MetaState;
  loaded: boolean;
  error: string | null;
  load(): Promise<void>;
  set(meta: MetaState): void;
  applyRun(result: RunResult): string[];
  buy(id: string): string | null;
  updateSettings(patch: Partial<Settings>): void;
  select(characterId: string, mapId: string): void;
  exportSave(): void;
  importSave(text: string): string | null;
  resetSave(): void;
}

function persist(meta: MetaState) {
  saveMeta(meta).catch((err) => console.error('Error al guardar', err));
}

export const useMetaStore = create<MetaStore>((set, get) => ({
  meta: defaultMeta(),
  loaded: false,
  error: null,
  load: async () => {
    try {
      const meta = await loadMeta();
      audio.setVolumes(meta.settings.sfxVolume, meta.settings.musicVolume);
      set({ meta, loaded: true });
    } catch (err) {
      console.error(err);
      set({ loaded: true, error: 'No se pudo leer la partida guardada. Se usará una nueva.' });
    }
  },
  set: (meta) => {
    set({ meta });
    persist(meta);
  },
  applyRun: (result) => {
    const { meta, unlockedMaps } = applyRunResult(get().meta, result);
    get().set(meta);
    return unlockedMaps;
  },
  buy: (id) => {
    const r = buyUpgrade(get().meta, id);
    if (!r.ok) return r.reason ?? 'No se puede comprar';
    get().set(r.meta);
    return null;
  },
  updateSettings: (patch) => {
    const meta = { ...get().meta, settings: { ...get().meta.settings, ...patch } };
    audio.setVolumes(meta.settings.sfxVolume, meta.settings.musicVolume);
    get().set(meta);
  },
  select: (characterId, mapId) => get().set({ ...get().meta, selectedCharacter: characterId, selectedMap: mapId }),
  exportSave: () => downloadJson(get().meta),
  importSave: (text) => {
    try {
      get().set(importJson(text));
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : 'Archivo no válido';
    }
  },
  resetSave: () => get().set(defaultMeta()),
}));

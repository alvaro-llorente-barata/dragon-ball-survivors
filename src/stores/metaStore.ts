import { create } from 'zustand';
import { buyUpgrade } from '../services/economyService';
import { applyRunResult, type RunResult } from '../services/progressionService';
import { loadMeta, saveMeta, importJson, downloadJson } from '../services/saveService/indexedDb';
import { defaultMeta, type Difficulty, type MetaState, type Settings } from '../services/saveService/meta';
import { audio } from '../services/audioService';
import { claimSagaRewards, levelUpCharacter, summon, type SummonBatch } from '../services/gachaService';
import { redeemCode } from '../services/codeService';
import type { Saga } from '../data/types';

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
  summon(count: number, saga: Saga): SummonBatch | string;
  toggleFavorite(id: string): void;
  setDifficulty(d: Difficulty): void;
  levelUp(id: string): string | null;
  exportSave(): void;
  importSave(text: string): string | null;
  resetSave(): void;
  /** Canjea un código; devuelve el mensaje para la persona. */
  redeem(code: string): { ok: boolean; message: string };
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
      // Migración: los jugadores que ya tenían sagas completas reciben su premio.
      const meta = claimSagaRewards(await loadMeta()).meta;
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
  summon: (count, saga) => {
    try {
      const r = summon(get().meta, count, Math.random, saga);
      get().set(r.meta);
      return r;
    } catch (err) {
      return err instanceof Error ? err.message : 'No se pudo invocar';
    }
  },
  toggleFavorite: (id) => {
    const m = get().meta;
    if (!m.unlockedCharacters.includes(id)) return;
    const favorites = m.favorites.includes(id) ? m.favorites.filter((f) => f !== id) : [...m.favorites, id];
    get().set({ ...m, favorites });
  },
  setDifficulty: (difficulty) => get().set({ ...get().meta, difficulty }),
  levelUp: (id) => {
    const r = levelUpCharacter(get().meta, id);
    if (!r.ok) return r.reason ?? 'No se puede mejorar';
    get().set(r.meta);
    return null;
  },
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
  redeem: (code) => {
    const r = redeemCode(get().meta, code);
    if (r.ok) get().set(r.meta);
    return { ok: r.ok, message: r.message };
  },
}));

// Solo en desarrollo: acceso para pruebas automatizadas en navegador.
if (import.meta.env.DEV) (globalThis as unknown as { __meta?: typeof useMetaStore }).__meta = useMetaStore;

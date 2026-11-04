import { create } from 'zustand';
import type { ChestRarity } from '../data/types';
import type { UpgradeChoice } from '../game/logic/upgrades';
import type { RunResult } from '../services/progressionService';

export interface HudState {
  hp: number;
  maxHp: number;
  ki: number;
  maxKi: number;
  xp: number;
  xpNext: number;
  level: number;
  time: number;
  kills: number;
  coins: number;
  weapons: { id: string; name: string; level: number; max: number }[];
  passives: { id: string; name: string; level: number; max: number }[];
  charName: string;
  stars: number;
  auraColor: number;
  ultimate: { name: string; kiCost: number; ready: boolean; cooldown: number };
  dodgeCooldown: number;
  buffs: { id: string; label: string; remaining: number }[];
  shieldHits: number;
  boss: { name: string; hp: number; maxHp: number; mini: boolean } | null;
  nearestChest: { distance: number; angle: number; rarity: ChestRarity } | null;
}

export interface MinimapState {
  bg: string;
  /** centro y semilado (píxeles de mundo) de la zona que muestra el minimapa */
  cx: number;
  cy: number;
  extent: number;
  player: { x: number; y: number };
  pois: { x: number; y: number; type: string }[];
  chests: { x: number; y: number; rarity: ChestRarity }[];
  boss: { x: number; y: number } | null;
}

export interface ChestRewardView {
  icon: string;
  label: string;
}

export type Modal =
  | { type: 'levelup'; choices: UpgradeChoice[]; title: string }
  | { type: 'chest'; rarity: ChestRarity; rewards: ChestRewardView[] }
  | { type: 'pause' }
  | { type: 'gameover'; result: RunResult; reason: 'death' | 'abandon'; unlockedMaps: string[] };

export interface Toast {
  id: number;
  text: string;
  color: string;
  big?: boolean;
}

interface RunStore {
  hud: HudState | null;
  minimap: MinimapState | null;
  modal: Modal | null;
  toasts: Toast[];
  setHud(h: HudState): void;
  setMinimap(m: MinimapState): void;
  setModal(m: Modal | null): void;
  toast(text: string, color?: string, big?: boolean): void;
  reset(): void;
}

let toastId = 0;

export const useRunStore = create<RunStore>((set, get) => ({
  hud: null,
  minimap: null,
  modal: null,
  toasts: [],
  setHud: (hud) => set({ hud }),
  setMinimap: (minimap) => set({ minimap }),
  setModal: (modal) => set({ modal }),
  toast: (text, color = '#ffffff', big = false) => {
    const id = ++toastId;
    set({ toasts: [...get().toasts.slice(-4), { id, text, color, big }] });
    setTimeout(() => set({ toasts: get().toasts.filter((t) => t.id !== id) }), big ? 3200 : 2400);
  },
  reset: () => set({ hud: null, minimap: null, modal: null, toasts: [] }),
}));

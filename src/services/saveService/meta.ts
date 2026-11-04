/** Partida permanente (lo que se guarda en IndexedDB). Lógica pura y validación. */

export const SAVE_VERSION = 1;

export interface Settings {
  sfxVolume: number;
  musicVolume: number;
  particles: 'low' | 'high';
  damageNumbers: boolean;
  touchControls: 'auto' | 'on' | 'off';
  pauseOnBlur: boolean;
}

export interface MetaStats {
  runs: number;
  totalKills: number;
  bestTime: number;
  chestsOpened: number;
  totalCoins: number;
  deaths: number;
}

export interface MetaState {
  version: number;
  coins: number;
  tickets: number;
  fragments: number;
  accountXp: number;
  upgrades: Record<string, number>;
  unlockedCharacters: string[];
  unlockedMaps: string[];
  selectedCharacter: string;
  selectedMap: string;
  bossesDefeated: Record<string, number>;
  stats: MetaStats;
  settings: Settings;
  updatedAt: number;
}

export function defaultSettings(): Settings {
  return {
    sfxVolume: 0.7,
    musicVolume: 0.35,
    particles: 'high',
    damageNumbers: true,
    touchControls: 'auto',
    pauseOnBlur: true,
  };
}

export function defaultMeta(): MetaState {
  return {
    version: SAVE_VERSION,
    coins: 0,
    tickets: 0,
    fragments: 0,
    accountXp: 0,
    upgrades: {},
    unlockedCharacters: ['goku'],
    unlockedMaps: ['earth'],
    selectedCharacter: 'goku',
    selectedMap: 'earth',
    bossesDefeated: {},
    stats: { runs: 0, totalKills: 0, bestTime: 0, chestsOpened: 0, totalCoins: 0, deaths: 0 },
    settings: defaultSettings(),
    updatedAt: Date.now(),
  };
}

const num = (v: unknown, d: number, min = 0, max = Number.MAX_SAFE_INTEGER): number =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : d;

const strArr = (v: unknown, d: string[]): string[] =>
  Array.isArray(v) && v.every((x) => typeof x === 'string') ? [...new Set(v as string[])] : d;

const numRecord = (v: unknown): Record<string, number> => {
  const out: Record<string, number> = {};
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      if (typeof val === 'number' && Number.isFinite(val) && val >= 0) out[k] = Math.floor(val);
    }
  }
  return out;
};

/** Valida datos desconocidos (IndexedDB o JSON importado) y rellena lo que falte. */
export function parseMeta(raw: unknown): MetaState {
  const d = defaultMeta();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Formato de partida no válido');
  const r = raw as Record<string, unknown>;
  if (typeof r.version !== 'number' || r.version > SAVE_VERSION) throw new Error('Versión de partida no compatible');
  const s = (r.stats ?? {}) as Record<string, unknown>;
  const st = (r.settings ?? {}) as Record<string, unknown>;
  const unlockedCharacters = strArr(r.unlockedCharacters, d.unlockedCharacters);
  const unlockedMaps = strArr(r.unlockedMaps, d.unlockedMaps);
  if (!unlockedCharacters.includes('goku')) unlockedCharacters.unshift('goku');
  if (!unlockedMaps.includes('earth')) unlockedMaps.unshift('earth');
  const selectedCharacter =
    typeof r.selectedCharacter === 'string' && unlockedCharacters.includes(r.selectedCharacter) ? r.selectedCharacter : 'goku';
  const selectedMap = typeof r.selectedMap === 'string' && unlockedMaps.includes(r.selectedMap) ? r.selectedMap : 'earth';
  return {
    version: SAVE_VERSION,
    coins: Math.floor(num(r.coins, 0)),
    tickets: Math.floor(num(r.tickets, 0)),
    fragments: Math.floor(num(r.fragments, 0)),
    accountXp: Math.floor(num(r.accountXp, 0)),
    upgrades: numRecord(r.upgrades),
    unlockedCharacters,
    unlockedMaps,
    selectedCharacter,
    selectedMap,
    bossesDefeated: numRecord(r.bossesDefeated),
    stats: {
      runs: Math.floor(num(s.runs, 0)),
      totalKills: Math.floor(num(s.totalKills, 0)),
      bestTime: num(s.bestTime, 0),
      chestsOpened: Math.floor(num(s.chestsOpened, 0)),
      totalCoins: Math.floor(num(s.totalCoins, 0)),
      deaths: Math.floor(num(s.deaths, 0)),
    },
    settings: {
      sfxVolume: num(st.sfxVolume, d.settings.sfxVolume, 0, 1),
      musicVolume: num(st.musicVolume, d.settings.musicVolume, 0, 1),
      particles: st.particles === 'low' ? 'low' : 'high',
      damageNumbers: typeof st.damageNumbers === 'boolean' ? st.damageNumbers : true,
      touchControls: st.touchControls === 'on' || st.touchControls === 'off' ? st.touchControls : 'auto',
      pauseOnBlur: typeof st.pauseOnBlur === 'boolean' ? st.pauseOnBlur : true,
    },
    updatedAt: num(r.updatedAt, Date.now()),
  };
}

export function serializeMeta(meta: MetaState): string {
  return JSON.stringify({ ...meta, updatedAt: Date.now() }, null, 2);
}

/** Nivel de cuenta a partir de la experiencia total. */
export function accountLevel(xp: number): { level: number; current: number; next: number } {
  let level = 1;
  let rest = xp;
  let need = 100;
  while (rest >= need) {
    rest -= need;
    level++;
    need = Math.floor(100 * Math.pow(level, 1.25));
  }
  return { level, current: rest, next: need };
}

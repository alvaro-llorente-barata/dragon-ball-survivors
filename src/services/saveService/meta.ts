/** Partida permanente (lo que se guarda en IndexedDB). Lógica pura y validación. */

/**
 * v1 = 0.1 / 0.2 · v2 = 2.0 (banners por saga, favoritos, dificultad) ·
 * v3 = regalo de 1000 tickets de bienvenida (se aplica una vez a los guardados < 3).
 * Todas las versiones anteriores se migran sin perder nada.
 */
export const SAVE_VERSION = 3;

/** Tickets de bienvenida que recibe tanto un jugador nuevo como un guardado antiguo (una sola vez). */
export const WELCOME_TICKETS = 1000;

export type Difficulty = 'normal' | 'hard' | 'nightmare';

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
  /** nivel (1-10) y fragmentos de cada personaje conseguido */
  characters: Record<string, CharacterProgress>;
  gacha: GachaState;
  /** sagas con la colección completa ya premiada */
  claimedSagas: string[];
  favorites: string[];
  difficulty: Difficulty;
  stats: MetaStats;
  settings: Settings;
  updatedAt: number;
}

export interface CharacterProgress {
  level: number;
  shards: number;
}

/** Contadores de garantía de las invocaciones */
export interface GachaState {
  pulls: number;
  /** invocaciones seguidas sin 4★ o más */
  sinceEpic: number;
  /** invocaciones seguidas sin 7★ */
  sinceMythic: number;
  /** contadores de garantía de cada banner (saga) */
  banners: Record<string, BannerPity>;
}

export interface BannerPity {
  pulls: number;
  /** tiradas seguidas sin 4★ o más */
  sinceEpic: number;
  /** tiradas seguidas sin la rareza más alta del banner */
  sinceTop: number;
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
    tickets: WELCOME_TICKETS,
    fragments: 0,
    accountXp: 0,
    upgrades: {},
    unlockedCharacters: ['goku'],
    unlockedMaps: ['earth'],
    selectedCharacter: 'goku',
    selectedMap: 'earth',
    bossesDefeated: {},
    characters: { goku: { level: 1, shards: 0 } },
    gacha: { pulls: 0, sinceEpic: 0, sinceMythic: 0, banners: {} },
    claimedSagas: [],
    favorites: [],
    difficulty: 'normal',
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

export const MAX_CHAR_LEVEL = 10;

function parseCharacters(v: unknown, owned: string[]): Record<string, CharacterProgress> {
  const out: Record<string, CharacterProgress> = {};
  const src = v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
  for (const id of owned) {
    const c = (src[id] ?? {}) as Record<string, unknown>;
    out[id] = {
      level: Math.floor(num(c.level, 1, 1, MAX_CHAR_LEVEL)),
      shards: Math.floor(num(c.shards, 0)),
    };
  }
  return out;
}

/** Valida datos desconocidos (IndexedDB o JSON importado) y rellena lo que falte. */
export function parseMeta(raw: unknown): MetaState {
  const d = defaultMeta();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Formato de partida no válido');
  const r = raw as Record<string, unknown>;
  if (typeof r.version !== 'number' || r.version > SAVE_VERSION) throw new Error('Versión de partida no compatible');
  // Regalo de bienvenida para guardados anteriores a la v3: se suma una sola vez.
  // Al guardarse con la versión actual, no se vuelve a aplicar.
  const welcomeBonus = r.version < 3 ? WELCOME_TICKETS : 0;
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
    tickets: Math.floor(num(r.tickets, 0)) + welcomeBonus,
    fragments: Math.floor(num(r.fragments, 0)),
    accountXp: Math.floor(num(r.accountXp, 0)),
    upgrades: numRecord(r.upgrades),
    unlockedCharacters,
    unlockedMaps,
    selectedCharacter,
    selectedMap,
    bossesDefeated: numRecord(r.bossesDefeated),
    characters: parseCharacters(r.characters, unlockedCharacters),
    gacha: (() => {
      const g = (r.gacha ?? {}) as Record<string, unknown>;
      const banners: Record<string, BannerPity> = {};
      const b = g.banners && typeof g.banners === 'object' ? (g.banners as Record<string, Record<string, unknown>>) : {};
      for (const [k, v] of Object.entries(b)) {
        if (!v || typeof v !== 'object') continue;
        banners[k] = { pulls: Math.floor(num(v.pulls, 0)), sinceEpic: Math.floor(num(v.sinceEpic, 0)), sinceTop: Math.floor(num(v.sinceTop, 0)) };
      }
      return {
        pulls: Math.floor(num(g.pulls, 0)),
        sinceEpic: Math.floor(num(g.sinceEpic, 0)),
        sinceMythic: Math.floor(num(g.sinceMythic, 0)),
        banners,
      };
    })(),
    claimedSagas: strArr(r.claimedSagas, []),
    favorites: strArr(r.favorites, []).filter((id) => unlockedCharacters.includes(id)),
    difficulty: r.difficulty === 'hard' || r.difficulty === 'nightmare' ? r.difficulty : 'normal',
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

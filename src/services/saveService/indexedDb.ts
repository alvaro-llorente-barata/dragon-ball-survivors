import { defaultMeta, parseMeta, serializeMeta, type MetaState } from './meta';

const DB_NAME = 'dragon-ball-survivors';
const STORE = 'saves';
const KEY = 'main';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('No se pudo abrir IndexedDB'));
  });
}

export async function loadMeta(): Promise<MetaState> {
  if (typeof indexedDB === 'undefined') return defaultMeta();
  const db = await openDb();
  try {
    const raw = await new Promise<unknown>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(KEY);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    if (raw == null) return defaultMeta();
    try {
      return parseMeta(typeof raw === 'string' ? JSON.parse(raw) : raw);
    } catch (err) {
      console.warn('Partida guardada corrupta, se empieza de cero', err);
      return defaultMeta();
    }
  } finally {
    db.close();
  }
}

export async function saveMeta(meta: MetaState): Promise<void> {
  if (typeof indexedDB === 'undefined') return;
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(serializeMeta(meta), KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export function downloadJson(meta: MetaState): void {
  const blob = new Blob([serializeMeta(meta)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dragon-ball-survivors-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function importJson(text: string): MetaState {
  return parseMeta(JSON.parse(text));
}

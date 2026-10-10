import { levels, tempos, type Level, type Tempo } from './game/generator';
export type Language = 'pl' | 'en';
export type Settings = { level: Level; tempo: Tempo; language: Language; muted: boolean };
export type Best = { score: number; date: string };
export type Profile = {
  id: string;
  name: string;
  settings: Settings;
  records: Record<string, Best>;
};
export type Store = { version: 1; activeId: string; profiles: Profile[] };
export const STORAGE_KEY = 'number-trouble-profiles-v1';
export const recordKey = (level: Level, tempo: Tempo) => `${level}-${tempo}`;
export function createProfile(
  name = '',
  id: string = globalThis.crypto.randomUUID?.() ??
    Array.from(globalThis.crypto.getRandomValues(new Uint8Array(16)), (n) =>
      n.toString(16).padStart(2, '0'),
    ).join(''),
): Profile {
  return {
    id,
    name: name.trim().slice(0, 30),
    settings: { level: 1, tempo: 'turtle', language: 'pl', muted: false },
    records: {},
  };
}
export function parseStore(raw: string | null): Store {
  try {
    const data = JSON.parse(raw || 'null');
    if (data?.version === 1 && Array.isArray(data.profiles)) {
      const ids = new Set<string>();
      const profiles: Profile[] = [];
      for (const item of data.profiles) {
        if (!item || typeof item.id !== 'string' || !item.id.trim() || ids.has(item.id)) continue;
        ids.add(item.id);
        const profile = createProfile(typeof item.name === 'string' ? item.name : '', item.id);
        const settings = item.settings;
        if (settings && typeof settings === 'object') {
          if (levels.includes(settings.level)) profile.settings.level = settings.level;
          if (tempos.includes(settings.tempo)) profile.settings.tempo = settings.tempo;
          if (settings.language === 'en') profile.settings.language = 'en';
          if (typeof settings.muted === 'boolean') profile.settings.muted = settings.muted;
        }
        for (const level of levels)
          for (const tempo of tempos) {
            const key = recordKey(level, tempo),
              best = item.records?.[key];
            if (
              best &&
              Number.isSafeInteger(best.score) &&
              best.score >= 0 &&
              typeof best.date === 'string' &&
              Number.isFinite(Date.parse(best.date))
            )
              profile.records[key] = { score: best.score, date: best.date };
          }
        profiles.push(profile);
      }
      if (profiles.length)
        return {
          version: 1,
          activeId: ids.has(data.activeId) ? data.activeId : profiles[0].id,
          profiles,
        };
    }
  } catch {
    /* Malformed storage starts a usable empty profile. */
  }
  const profile = createProfile('', 'first-player');
  return { version: 1, activeId: profile.id, profiles: [profile] };
}
export function updateProfile(store: Store, id: string, update: (p: Profile) => Profile): Store {
  return { ...store, profiles: store.profiles.map((p) => (p.id === id ? update(p) : p)) };
}
export function removeProfile(store: Store, id: string): Store {
  if (store.profiles.length <= 1) return store;
  const profiles = store.profiles.filter((p) => p.id !== id);
  return {
    ...store,
    profiles,
    activeId: profiles.some((p) => p.id === store.activeId) ? store.activeId : profiles[0].id,
  };
}
export function saveResult(
  store: Store,
  id: string,
  level: Level,
  tempo: Tempo,
  score: number,
  date = new Date().toISOString(),
): Store {
  return updateProfile(store, id, (p) => {
    const key = recordKey(level, tempo),
      best = p.records[key];
    return best && best.score >= score
      ? p
      : { ...p, records: { ...p.records, [key]: { score, date } } };
  });
}

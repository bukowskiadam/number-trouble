import { describe, it, expect } from 'vitest';
import {
  createProfile,
  parseStore,
  removeProfile,
  saveResult,
  updateProfile,
  recordKey,
  type Store,
} from './profiles';
import { levels, tempos } from './game/generator';
const fixture = (): Store => ({
  version: 1,
  activeId: 'a',
  profiles: [createProfile('Adam', 'a'), createProfile('Maja', 'b')],
});
describe('profiles', () => {
  it('starts with an empty default profile and repairs malformed input', () => {
    for (const raw of [null, 'bad', '{}', '{"version":1,"profiles":[]}']) {
      const store = parseStore(raw);
      expect(store.profiles).toHaveLength(1);
      expect(store.profiles[0].name).toBe('');
      expect(store.profiles[0].records).toEqual({});
    }
  });
  it('sanitizes every field, skips duplicate IDs and repairs active ID', () => {
    const store = parseStore(
      JSON.stringify({
        version: 1,
        activeId: 'unknown',
        profiles: [
          null,
          {
            id: 'a',
            name: ' A '.repeat(40),
            settings: { level: 7, tempo: 'rocket', muted: 'no', language: 'fr' },
            records: { '1-turtle': { score: -1, date: 'bad' } },
          },
          { id: 'a' },
          { id: 2 },
        ],
      }),
    );
    expect(store.profiles).toHaveLength(1);
    expect(store.activeId).toBe('a');
    expect(store.profiles[0].name.length).toBe(30);
    expect(store.profiles[0].settings).toEqual(createProfile().settings);
    expect(store.profiles[0].records).toEqual({});
  });
  it('isolates all 12 records by profile, level and tempo and preserves ties', () => {
    let store = fixture();
    let score = 0;
    for (const level of levels)
      for (const tempo of tempos)
        store = saveResult(store, 'a', level, tempo, score++, '2026-10-10T10:00:00Z');
    expect(Object.keys(store.profiles[0].records)).toHaveLength(12);
    expect(store.profiles[1].records).toEqual({});
    const previous = store.profiles[0].records[recordKey(4, 'cheetah')];
    store = saveResult(store, 'a', 4, 'cheetah', 11);
    store = saveResult(store, 'a', 4, 'cheetah', 5);
    expect(store.profiles[0].records[recordKey(4, 'cheetah')]).toEqual(previous);
    expect(parseStore(JSON.stringify(store))).toEqual(store);
  });
  it('renames without changing identity; reset retains settings and other child', () => {
    let store = saveResult(fixture(), 'a', 1, 'turtle', 33);
    store = saveResult(store, 'b', 4, 'horse', 44);
    store = updateProfile(store, 'a', (p) => ({
      ...p,
      name: 'New name',
      settings: { ...p.settings, muted: true },
    }));
    expect(store.profiles[0].records['1-turtle'].score).toBe(33);
    store = updateProfile(store, 'a', (p) => ({ ...p, records: {} }));
    expect(store.profiles[0].id).toBe('a');
    expect(store.profiles[0].name).toBe('New name');
    expect(store.profiles[0].settings.muted).toBe(true);
    expect(store.profiles[1].records['4-horse'].score).toBe(44);
  });
  it('selects a remaining child on deletion and protects the final child', () => {
    let store = removeProfile(fixture(), 'a');
    expect(store.activeId).toBe('b');
    expect(removeProfile(store, 'b')).toEqual(store);
  });
});

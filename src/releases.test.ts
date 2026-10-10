import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  APP_VERSION,
  compareVersions,
  getReleaseNotes,
  hasNewVersion,
  isAppVersion,
  type ReleaseNote,
} from './releases';
import notes from './release-notes.json';
import { parseStore, createProfile, removeProfile, updateProfile, saveResult } from './profiles';

describe('release history and launch versions', () => {
  it('compares SemVer numbers and prereleases, ignoring build metadata', () => {
    const ordered = [
      '1.0.0-alpha',
      '1.0.0-alpha.1',
      '1.0.0-alpha.beta',
      '1.0.0-beta',
      '1.0.0-beta.2',
      '1.0.0-beta.11',
      '1.0.0-rc.1',
      '1.0.0',
      '1.0.1',
      '1.1.0',
      '1.9.0',
      '1.10.0',
      '2.0.0',
    ];
    for (let i = 1; i < ordered.length; i++) {
      expect(compareVersions(ordered[i - 1], ordered[i])).toBeLessThan(0);
      expect(compareVersions(ordered[i], ordered[i - 1])).toBeGreaterThan(0);
    }
    expect(compareVersions('1.1.0+build.1', '1.1.0+build.2')).toBe(0);
    expect(compareVersions('1.1.0-rc.1+build', '1.1.0-rc.1')).toBe(0);
    expect(() => compareVersions('broken', '1.0.0')).toThrow();
  });
  it('only announces upgrades from valid, previously launched versions', () => {
    for (const previous of [
      undefined,
      null,
      1,
      '',
      'v1.0.0',
      '01.0.0',
      '1.0',
      '1.0.0-01',
      '1.0.0+',
    ]) {
      expect(isAppVersion(previous)).toBe(false);
      expect(hasNewVersion(previous, '1.1.0')).toBe(false);
    }
    expect(hasNewVersion('1.1.0', '1.1.0')).toBe(false);
    expect(hasNewVersion('2.0.0', '1.1.0')).toBe(false);
    expect(hasNewVersion('1.1.0+old', '1.1.0+new')).toBe(false);
    expect(hasNewVersion('1.1.0-rc.1', '1.1.0')).toBe(true);
  });
  it('includes skipped releases and excludes seen or future versions', () => {
    const history: ReleaseNote[] = ['1.0.0', '1.0.1', '1.1.0', '2.0.0'].map((version) => ({
      version,
      pl: { title: 'Wydanie', changes: ['Zmiana'] },
      en: { title: 'Release', changes: ['Change'] },
    }));
    expect(getReleaseNotes('1.0.0', '1.1.0', history).map((n) => n.version)).toEqual([
      '1.1.0',
      '1.0.1',
    ]);
    expect(getReleaseNotes(undefined, '1.0.1', history).map((n) => n.version)).toEqual([
      '1.0.1',
      '1.0.0',
    ]);
    expect(getReleaseNotes('1.1.0', '1.1.0', history)).toEqual([]);
  });
  it('keeps both language histories, changelog, package and lockfile aligned', () => {
    const changelog = readFileSync(new URL('../CHANGELOG.md', import.meta.url), 'utf8');
    const published = [...changelog.matchAll(/^## v([^ ]+) — /gm)].map((match) => match[1]);
    expect(notes.map((note) => note.version)).toEqual(published);
    expect(notes[0].version).toBe(APP_VERSION);
    expect(new Set(published).size).toBe(published.length);
    const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'));
    expect(lock.version).toBe(APP_VERSION);
    expect(lock.packages[''].version).toBe(APP_VERSION);
    for (const note of notes)
      for (const language of ['pl', 'en'] as const) {
        expect(isAppVersion(note.version)).toBe(true);
        expect(note[language].title.trim()).not.toBe('');
        expect(note[language].changes.length).toBeGreaterThan(0);
        expect(note[language].changes.every((change) => change.trim().length > 0)).toBe(true);
        expect(JSON.stringify(note[language])).not.toContain('Unreleased');
      }
  });
  it('loads optional version metadata without changing legacy profiles and records', () => {
    const original = saveResult(parseStore(null), 'first-player', 1, 'turtle', 33);
    expect(original.lastLaunchedVersion).toBeUndefined();
    for (const previous of ['1.0.1', '1.1.0-rc.1', null, {}, 'broken']) {
      const loaded = parseStore(JSON.stringify({ ...original, lastLaunchedVersion: previous }));
      expect(loaded.profiles).toEqual(original.profiles);
      expect(loaded.lastLaunchedVersion).toBe(isAppVersion(previous) ? previous : undefined);
    }
  });
  it('preserves shared version metadata across records, rename, reset and deletion', () => {
    let store = { ...parseStore(null), lastLaunchedVersion: APP_VERSION };
    store.profiles.push(createProfile('Maja', 'maja'));
    const updated = saveResult(store, 'maja', 4, 'horse', 43);
    const renamed = updateProfile(updated, 'maja', (p) => ({ ...p, name: 'New name' }));
    const reset = updateProfile(renamed, 'maja', (p) => ({ ...p, records: {} }));
    const removed = removeProfile(reset, 'first-player');
    for (const result of [updated, renamed, reset, removed])
      expect(result.lastLaunchedVersion).toBe(APP_VERSION);
    expect(removed.activeId).toBe('maja');
    expect(parseStore(JSON.stringify(removed))).toEqual(removed);
  });
});

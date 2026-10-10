import { version } from '../package.json';
import notes from './release-notes.json';

export const APP_VERSION = version;
export type ReleaseSummary = { title: string; changes: string[] };
export type ReleaseNote = { version: string; pl: ReleaseSummary; en: ReleaseSummary };

// SemVer precedence includes prereleases, but ignores build metadata.
const semver =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+[0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*)?$/;

export const isAppVersion = (value: unknown): value is string =>
  typeof value === 'string' && semver.test(value);

export function compareVersions(a: string, b: string): number {
  const left = semver.exec(a);
  const right = semver.exec(b);
  if (!left || !right) throw new Error('Invalid semantic version');
  const compare = (x: string, y: string) => {
    const xn = /^\d+$/.test(x);
    const yn = /^\d+$/.test(y);
    if (xn && yn) return BigInt(x) < BigInt(y) ? -1 : BigInt(x) > BigInt(y) ? 1 : 0;
    if (xn !== yn) return xn ? -1 : 1;
    return x < y ? -1 : x > y ? 1 : 0;
  };
  for (let i = 1; i <= 3; i++) {
    const difference = compare(left[i], right[i]);
    if (difference) return difference;
  }
  if (!left[4] || !right[4]) return left[4] ? -1 : right[4] ? 1 : 0;
  const preLeft = left[4].split('.');
  const preRight = right[4].split('.');
  for (let i = 0; i < Math.max(preLeft.length, preRight.length); i++) {
    if (preLeft[i] === undefined) return -1;
    if (preRight[i] === undefined) return 1;
    const difference = compare(preLeft[i], preRight[i]);
    if (difference) return difference;
  }
  return 0;
}

export const hasNewVersion = (previous: unknown, current = APP_VERSION) =>
  isAppVersion(previous) && compareVersions(current, previous) > 0;

export function getReleaseNotes(
  previous?: string,
  current = APP_VERSION,
  history: ReleaseNote[] = notes,
): ReleaseNote[] {
  return history
    .filter(
      (note) =>
        compareVersions(note.version, current) <= 0 &&
        (!isAppVersion(previous) || compareVersions(note.version, previous) > 0),
    )
    .sort((a, b) => compareVersions(b.version, a.version));
}

import { describe, expect, it } from 'vitest';
import { EquationDeck, levels, MAX_ANSWER_RUN, type Equation, type Level } from './generator';

function seeded(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
const sizes: Record<Level, number> = { 1: 66, 2: 121, 3: 187, 4: 5151 };
const key = (e: Equation) => `${e.a}${e.operator}${e.b}`;

describe('equation decks', () => {
  for (const level of levels) {
    // Five random sources and three complete decks include 77,265 level-4 equations.
    it(`covers every level ${level} operation once per cycle with balanced, bounded answers`, () => {
      for (const random of [seeded(42), seeded(17), seeded(1234), () => 0, () => 0.999999]) {
        const generator = new EquationDeck(level, random);
        let previous: Equation | undefined;
        let previousTruth: boolean | undefined;
        let run = 0;
        for (let cycle = 0; cycle < 3; cycle++) {
          const seen = new Set<string>();
          let truths = 0;
          let subtractions = 0;
          for (let i = 0; i < sizes[level]; i++) {
            const e = generator.next();
            expect(key(e)).not.toBe(previous && key(previous));
            expect(seen.has(key(e))).toBe(false);
            seen.add(key(e));
            for (const value of [e.a, e.b, e.result, e.shown]) {
              expect(Number.isInteger(value)).toBe(true);
              expect(value).toBeGreaterThanOrEqual(0);
            }
            expect(e.a).toBeLessThanOrEqual(level === 4 ? 100 : 10);
            expect(e.b).toBeLessThanOrEqual(level === 4 ? 100 : 10);
            expect(e.result).toBe(e.operator === '+' ? e.a + e.b : e.a - e.b);
            const max = level === 4 ? 100 : level === 1 || e.operator === '−' ? 10 : 20;
            expect(e.result).toBeLessThanOrEqual(max);
            expect(e.shown).toBeLessThanOrEqual(max);
            expect(Math.abs(e.shown - e.result)).toBeLessThanOrEqual(level === 4 ? 10 : 3);
            if (level !== 3) expect(e.operator).toBe('+');
            if (e.operator === '−') subtractions++;
            const truth = e.shown === e.result;
            truths += Number(truth);
            run = truth === previousTruth ? run + 1 : 1;
            expect(run).toBeLessThanOrEqual(MAX_ANSWER_RUN);
            previousTruth = truth;
            previous = e;
          }
          // Valid, unique operations plus the exact set size prove exhaustive coverage.
          expect(seen.size).toBe(sizes[level]);
          expect(Math.abs(truths - (sizes[level] - truths))).toBeLessThanOrEqual(1);
          expect(subtractions).toBe(level === 3 ? 66 : 0);
          expect(seen.has('0+0')).toBe(true);
          expect(seen.has('2+3') && seen.has('3+2')).toBe(true);
        }
      }
    }, 30_000);

    it(`prevents a repeated operation at a level ${level} cycle boundary`, () => {
      let value = 0;
      const generator = new EquationDeck(level, () => value);
      const first = Array.from({ length: sizes[level] }, () => generator.next());
      expect(key(first.at(-1)!)).toBe('0+0');
      value = 0.999999; // The next shuffle would put 0+0 first without boundary repair.
      const second = Array.from({ length: sizes[level] }, () => generator.next());
      expect(key(second[0])).not.toBe('0+0');
      expect(new Set(second.map(key))).toEqual(new Set(first.map(key)));
    });
  }

  it('reshuffles cycles and does not alternate answers mechanically', () => {
    const generator = new EquationDeck(1, seeded(42));
    const first = Array.from({ length: sizes[1] }, () => generator.next());
    const second = Array.from({ length: sizes[1] }, () => generator.next());
    expect(first.map(key)).not.toEqual(second.map(key));
    const answers = first.map((e) => (e.result === e.shown ? 'T' : 'F')).join('');
    expect(answers).toContain('TT');
    expect(answers).toContain('FF');
    expect(answers).toContain('TFT');
    expect(answers).toContain('FTF');
    expect(new EquationDeck(1, seeded(17)).next()).not.toEqual(first[0]);
  });
});

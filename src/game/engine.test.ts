import { describe, it, expect } from 'vitest';
import { Game, CORRECTION_MS } from './engine';
import { generate, levels, equationKey, type Equation } from './generator';
function seeded(seed = 42) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
const trueEquation: Equation = { a: 2, b: 1, operator: '+', result: 3, shown: 3 };
const falseEquation: Equation = { a: 7, b: 5, operator: '−', result: 2, shown: 4 };
const make = () => new Game({ profileId: 'a', level: 1, tempo: 'turtle' }, 0, seeded());
describe('generator', () => {
  for (const level of levels)
    it(`generates varied, valid level ${level} equations`, () => {
      const random = seeded(),
        seen = new Set<string>();
      let previous: Equation | undefined;
      let truths = 0;
      let plus = 0;
      let minus = 0;
      let highest = 0;
      let bigOperand = false;
      for (let i = 0; i < 15000; i++) {
        const e = generate(level, random, previous);
        expect(equationKey(e)).not.toBe(previous && equationKey(previous));
        for (const value of [e.a, e.b, e.result, e.shown]) {
          expect(Number.isInteger(value)).toBe(true);
          expect(value).toBeGreaterThanOrEqual(0);
        }
        expect(e.result).toBe(e.operator === '+' ? e.a + e.b : e.a - e.b);
        if (level === 1) expect(e.result).toBeLessThanOrEqual(10);
        if (level === 2 || level === 3) {
          expect(e.a).toBeLessThanOrEqual(10);
          expect(e.b).toBeLessThanOrEqual(10);
        }
        const max = level === 4 ? 100 : level === 1 || e.operator === '−' ? 10 : 20;
        expect(e.shown).toBeLessThanOrEqual(max);
        expect(e.result).toBeLessThanOrEqual(max);
        if (level !== 3) expect(e.operator).toBe('+');
        if (e.operator === '−') {
          minus++;
          expect(e.a).toBeGreaterThanOrEqual(e.b);
        } else plus++;
        if (e.shown === e.result) truths++;
        seen.add(String(e.result));
        highest = Math.max(highest, e.result);
        bigOperand ||= e.a > 10 || e.b > 10;
        previous = e;
      }
      expect(truths / 15000).toBeGreaterThan(0.45);
      expect(truths / 15000).toBeLessThan(0.55);
      expect(highest).toBe(level === 4 ? 100 : level === 1 ? 10 : 20);
      expect(generate(level, () => 0).result).toBe(0);
      if (level === 3) {
        expect(minus).toBeGreaterThan(6000);
        expect(plus).toBeGreaterThan(6000);
      }
      if (level === 4) expect(bigOperand).toBe(true);
    });
  it('avoids immediate repeats even for a constant RNG', () => {
    const previous = generate(1, () => 0);
    expect(generate(1, () => 0, previous)).not.toEqual(previous);
  });
});
describe('game', () => {
  for (const [equation, answer, correct] of [
    [trueEquation, true, true],
    [trueEquation, false, false],
    [falseEquation, true, false],
    [falseEquation, false, true],
  ] as const)
    it(`judges ${equation.shown} / ${answer}`, () => {
      const game = make();
      game.state.equation = equation;
      game.answer(answer, 1, 0);
      expect(game.state.score).toBe(correct ? 10 : 0);
      expect(game.state.phase).toBe(correct ? 'correct' : 'correction');
      game.advance(2400);
      expect(game.state.stack.length).toBe(correct ? 0 : 1);
    });
  it('scores streak 10, 11, 12, resets only streak and resumes with 10', () => {
    const game = make();
    let now = 0;
    for (let i = 0; i < 3; i++) {
      game.answer(
        game.state.equation.shown === game.state.equation.result,
        game.state.blockId,
        now,
      );
      now += 280;
      game.advance(now);
    }
    expect(game.state.score).toBe(33);
    expect(game.state.streak).toBe(3);
    game.answer(game.state.equation.shown !== game.state.equation.result, game.state.blockId, now);
    expect(game.state.score).toBe(33);
    expect(game.state.streak).toBe(0);
    now += 2400;
    game.advance(now);
    game.answer(game.state.equation.shown === game.state.equation.result, game.state.blockId, now);
    expect(game.state.score).toBe(43);
    expect(game.state.streak).toBe(1);
  });
  it('holds correction 2 seconds then drops it, and never strikes a true result', () => {
    const game = make();
    game.state.equation = trueEquation;
    game.answer(false, 1, 0);
    game.advance(CORRECTION_MS - 1);
    expect(game.state.y).toBe(0);
    expect(game.state.stack).toHaveLength(0);
    expect(game.state.equation.shown).toBe(game.state.equation.result);
    game.advance(CORRECTION_MS);
    expect(game.state.phase).toBe('dropping');
    game.advance(2200);
    expect(game.state.y).toBeGreaterThan(0);
    expect(game.state.stack).toHaveLength(0);
    game.advance(2400);
    expect(game.state.stack).toHaveLength(1);
    expect(game.state.blockId).toBe(2);
  });
  it('rejects double clicks, stale block IDs and answers after landing', () => {
    const game = make();
    const value = game.state.equation.shown === game.state.equation.result;
    game.answer(value, 1, 0);
    game.answer(value, 1, 0);
    expect(game.state.score).toBe(10);
    game.advance(280);
    game.answer(true, 1, 280);
    expect(game.state.correct).toBe(1);
    game.state.y = game.target;
    game.answer(true, 2, 281);
    expect(game.state.missed).toBe(1);
    expect(game.state.correct).toBe(1);
  });
  it('treats a click at the exact landing boundary as missed', () => {
    const game = make();
    const target = game.target;
    const seconds = (-1 + Math.sqrt(1 + (4 * target) / (0.55 * 180))) * 90;
    game.answer(true, 1, seconds * 1000);
    expect(game.state.missed).toBe(1);
    expect(game.state.phase).toBe('missed');
    expect(game.state.score).toBe(0);
  });
  it('missed answer resets streak without subtracting points and waits before next', () => {
    const game = make();
    game.state.score = 33;
    game.state.streak = 3;
    game.state.y = game.target;
    game.advance(1);
    expect(game.state.missed).toBe(1);
    expect(game.state.score).toBe(33);
    expect(game.state.streak).toBe(0);
    game.advance(1999);
    expect(game.state.phase).toBe('missed');
    game.advance(2000);
    expect(game.state.phase).toBe('falling');
  });
  it('seven blocks keep playing; eighth waits for final correction then ends once', () => {
    const game = make();
    let now = 0;
    for (let i = 0; i < 7; i++) {
      game.answer(
        game.state.equation.shown !== game.state.equation.result,
        game.state.blockId,
        now,
      );
      now += 2400;
      game.advance(now);
    }
    expect(game.state.stack).toHaveLength(7);
    expect(game.state.phase).toBe('falling');
    game.state.y = game.target;
    game.advance(++now);
    expect(game.state.stack).toHaveLength(8);
    expect(game.state.phase).toBe('missed');
    game.advance(now + 1998);
    expect(game.state.phase).toBe('missed');
    game.advance(now + 1999);
    expect(game.state.phase).toBe('over');
    game.answer(true, game.state.blockId, now + 999999);
    expect(game.state.stack).toHaveLength(8);
    expect(game.state.blockId).toBe(8);
    expect(game.drainEvents().filter((e) => e === 'over')).toHaveLength(1);
  });
  it('pauses movement, correction timer, speed and answers', () => {
    const game = make();
    game.advance(1000);
    game.pause(1000);
    const snapshot = structuredClone(game.state);
    game.advance(100000);
    game.answer(true, 1, 100001);
    expect(game.state).toEqual(snapshot);
    game.resume(200000);
    game.answer(game.state.equation.shown !== game.state.equation.result, 1, 200000);
    game.advance(201000);
    game.pause(201000);
    game.advance(300000);
    expect(game.state.phaseMs).toBe(1000);
    game.resume(300000);
    game.advance(301000);
    expect(game.state.phase).toBe('dropping');
  });
  it('is frame-rate independent, accelerates and shortens the path', () => {
    const a = make(),
      b = make();
    a.advance(6000);
    for (let i = 1; i <= 600; i++) b.advance(i * 10);
    expect(a.state.y).toBeCloseTo(b.state.y, 8);
    expect(a.speed).toBeGreaterThan(0.55);
    a.state.stack.push(trueEquation);
    expect(a.target).toBe(7);
    const fresh = make();
    expect(fresh.speed).toBe(0.55);
    expect(fresh.state.score).toBe(0);
  });
});

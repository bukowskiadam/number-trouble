import { describe, it, expect } from 'vitest';
import { Game, CORRECTION_MS } from './engine';
import { type Equation } from './generator';
function seeded(seed = 42) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
const trueEquation: Equation = { a: 2, b: 1, operator: '+', result: 3, shown: 3 };
const falseEquation: Equation = { a: 7, b: 5, operator: '−', result: 2, shown: 4 };
const make = () => new Game({ profileId: 'a', level: 1, tempo: 'turtle' }, 0, seeded());
describe('game', () => {
  it('keeps a complete deck per game and resets it for a new game', () => {
    const game = make();
    const first = structuredClone(game.state.equation);
    const other = make();
    for (let cycle = 0; cycle < 2; cycle++) {
      const seen = new Set<string>();
      for (let i = 0; i < 66; i++) {
        const e = game.state.equation;
        seen.add(`${e.a}${e.operator}${e.b}`);
        const now = (cycle * 66 + i) * 280;
        game.answer(e.shown === e.result, game.state.blockId, now);
        game.advance(now + 280);
      }
      expect(seen.size).toBe(66);
    }
    expect(other.state.equation).toEqual(first);
    expect(make().state.equation).toEqual(first);
    expect(game.state.correct).toBe(132);
  });
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
    const seconds = (-1 + Math.sqrt(1 + (4 * target) / (0.4 * 240))) * 120;
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
  it.each([
    ['turtle', 0.4],
    ['horse', 0.8],
    ['cheetah', 1.2],
  ] as const)(
    'accelerates %s to double at 120 seconds and caps at triple after 240',
    (tempo, base) => {
      const game = new Game({ profileId: 'a', level: 1, tempo }, 0, seeded());
      expect(game.speed).toBe(base);
      let now = 0;
      for (let seconds = 1; seconds <= 300; seconds++) {
        now += 1000;
        game.advance(now);
        if (seconds === 60) expect(game.speed).toBeCloseTo(base * 1.5);
        if (seconds === 120) expect(game.speed).toBeCloseTo(base * 2);
        if (seconds >= 240) expect(game.speed).toBeCloseTo(base * 3);
        game.answer(
          game.state.equation.shown === game.state.equation.result,
          game.state.blockId,
          now,
        );
        now += 280;
        game.advance(now);
      }
      expect(game.state.activeMs).toBe(300000);
      expect(game.state.correct).toBe(300);
      expect(game.state.stack).toHaveLength(0);
    },
  );
  it('integrates movement across the acceleration cap independently of frame size', () => {
    const a = make(),
      b = make();
    a.state.activeMs = b.state.activeMs = 239000;
    a.advance(2000);
    for (let i = 1; i <= 200; i++) b.advance(i * 10);
    // One second averaging the speeds at 239/240 s, then one second at the cap.
    expect(a.state.y).toBeCloseTo((1.1966666666666668 + 1.2) / 2 + 1.2, 8);
    expect(a.state.y).toBeCloseTo(b.state.y, 8);
    expect(a.speed).toBeCloseTo(1.2);
  });
  it('is frame-rate independent, accelerates and shortens the path', () => {
    const a = make(),
      b = make();
    a.advance(6000);
    for (let i = 1; i <= 600; i++) b.advance(i * 10);
    expect(a.state.y).toBeCloseTo(b.state.y, 8);
    expect(a.speed).toBeGreaterThan(0.4);
    a.state.stack.push(trueEquation);
    expect(a.target).toBe(7);
    const fresh = make();
    expect(fresh.speed).toBe(0.4);
    expect(fresh.state.score).toBe(0);
  });
});

import { describe, expect, it } from 'vitest';
import { Game } from './engine';
import { GameTracking } from './tracking';
import { createTracker, type TrackingEvent } from '../tracking';

function setup(source: 'start' | 'replay' = 'start') {
  const events: TrackingEvent[] = [];
  const game = new Game({ profileId: 'private-child-id', level: 3, tempo: 'horse' }, 0);
  const tracker = createTracker({
    track: (event) => {
      events.push(event);
    },
  });
  const session = new GameTracking(game.state, source, tracker);
  const refresh = () => session.resolve(game.drainResolutions());
  return { game, session, events, refresh, tracker };
}

describe('game tracking', () => {
  it('tracks accepted outcomes once and excludes pauses and feedback from response time', () => {
    const { game, session, events, refresh } = setup();
    game.pause(500);
    session.pause('hidden');
    game.answer(true, 1, 20000);
    refresh();
    expect(events.filter((e) => e.name === 'equation_resolved')).toHaveLength(0);
    game.resume(60000);
    session.resume();
    const correct = game.state.equation.result === game.state.equation.shown;
    game.answer(correct, 1, 60500);
    game.answer(correct, 1, 60500);
    refresh();
    refresh();
    game.advance(60780);
    game.answer(true, 1, 60780); // Stale block ID.
    game.answer(game.state.equation.result !== game.state.equation.shown, 2, 60980);
    refresh();
    const resolved = events.filter((e) => e.name === 'equation_resolved');
    expect(resolved.map((e) => e.properties)).toEqual([
      expect.objectContaining({
        blockId: 1,
        outcome: 'correct',
        responseMs: 1000,
        score: 10,
        streak: 1,
      }),
      expect.objectContaining({
        blockId: 2,
        outcome: 'wrong',
        responseMs: 200,
        score: 10,
        streak: 0,
      }),
    ]);
    session.end(game.state, 'exit');
    session.end(game.state, 'exit');
    expect(events.filter((e) => e.name === 'game_ended')).toHaveLength(1);
    expect(events.at(-1)?.properties).toMatchObject({
      reason: 'exit',
      correct: 1,
      mistakes: 1,
      missed: 0,
      activeFallingMs: 1200,
      bestStreak: 1,
    });
    expect(JSON.stringify(events)).not.toContain('private-child-id');
    expect(events[0].properties).not.toHaveProperty('profileId');
  });

  it('captures all eight misses in a long frame with original IDs and per-block durations', () => {
    const { game, session, events, refresh } = setup();
    game.advance(180000);
    refresh();
    session.end(game.state, 'board_full');
    game.answer(true, 8, 180001);
    refresh();
    session.end(game.state, 'board_full');
    const resolved = events.filter((e) => e.name === 'equation_resolved');
    expect(resolved.map((e) => e.properties.blockId)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(resolved.every((e) => e.properties.outcome === 'missed')).toBe(true);
    expect(resolved[0].properties.responseMs).toBeGreaterThan(resolved[7].properties.responseMs);
    expect(resolved.reduce((sum, e) => sum + e.properties.responseMs, 0)).toBeCloseTo(
      Math.round(game.state.activeMs),
      -1,
    );
    expect(events.filter((e) => e.name === 'game_ended')).toHaveLength(1);
    expect(events.at(-1)?.properties).toMatchObject({
      reason: 'board_full',
      missed: 8,
      mistakes: 0,
      correct: 0,
    });
  });

  it('records a boundary click as a miss, never as a submitted answer', () => {
    const { game, events, refresh } = setup();
    const seconds = (-1 + Math.sqrt(1 + (4 * game.target) / (0.8 * 240))) * 120;
    game.answer(true, 1, seconds * 1000);
    refresh();
    expect(events.filter((e) => e.name === 'equation_resolved')).toEqual([
      expect.objectContaining({
        properties: expect.objectContaining({ blockId: 1, outcome: 'missed' }),
      }),
    ]);
  });

  it('gives each replay its own ID and uses the initial configuration', () => {
    const { game, session, events, tracker } = setup();
    game.state.level = 4;
    session.end(game.state, 'exit');
    new GameTracking(game.state, 'replay', tracker);
    const starts = events.filter((e) => e.name === 'game_started');
    expect(starts[0].properties.gameId).not.toBe(starts[1].properties.gameId);
    expect(starts[1].properties.source).toBe('replay');
    expect(events.find((e) => e.name === 'game_ended')?.properties.level).toBe(3);
  });
});

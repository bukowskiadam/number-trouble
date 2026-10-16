import { tracking } from '../tracking';
import type { GameState, EquationResolution } from './engine';

export class GameTracking {
  private readonly context;
  private ended = false;

  constructor(
    state: GameState,
    source: 'start' | 'replay',
    private readonly tracker = tracking,
  ) {
    this.context = {
      gameId:
        globalThis.crypto.randomUUID?.() ??
        Array.from(globalThis.crypto.getRandomValues(new Uint8Array(16)), (n) =>
          n.toString(16).padStart(2, '0'),
        ).join(''),
      level: state.level,
      tempo: state.tempo,
    };
    this.tracker.track('game_started', { ...this.context, source });
  }

  resolve(resolutions: EquationResolution[]) {
    if (this.ended) return;
    for (const resolution of resolutions) {
      this.tracker.track('equation_resolved', {
        ...this.context,
        ...resolution,
        responseMs: Math.round(resolution.responseMs),
      });
    }
  }

  pause(reason: 'manual' | 'hidden') {
    if (!this.ended) this.tracker.track('game_paused', { ...this.context, reason });
  }

  resume() {
    if (!this.ended) this.tracker.track('game_resumed', this.context);
  }

  end(state: GameState, reason: 'board_full' | 'exit') {
    if (this.ended) return;
    this.ended = true;
    this.tracker.track('game_ended', {
      ...this.context,
      reason,
      score: state.score,
      correct: state.correct,
      mistakes: state.mistakes,
      missed: state.missed,
      bestStreak: state.bestStreak,
      activeFallingMs: Math.round(state.activeMs),
    });
  }
}

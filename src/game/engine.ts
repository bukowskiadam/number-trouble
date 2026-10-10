import { generate, type Equation, type Level, type Random, type Tempo } from './generator';
export const CAPACITY = 8;
export const CORRECTION_MS = 2000;
export const BASE_SPEED: Record<Tempo, number> = { turtle: 0.4, horse: 0.8, cheetah: 1.2 };
export type Phase = 'falling' | 'correct' | 'correction' | 'dropping' | 'missed' | 'over';
export type GameConfig = { profileId: string; level: Level; tempo: Tempo };
export type GameState = GameConfig & {
  equation: Equation;
  blockId: number;
  y: number;
  stack: Equation[];
  phase: Phase;
  phaseMs: number;
  dropStart: number;
  paused: boolean;
  activeMs: number;
  score: number;
  streak: number;
  bestStreak: number;
  correct: number;
  mistakes: number;
  missed: number;
  award: number;
};
export type GameEvent = 'correct' | 'wrong' | 'missed' | 'over';
// Pure elapsed-time simulation. No browser APIs, pixels or animation frames.
export class Game {
  state: GameState;
  private lastTime: number;
  events: GameEvent[] = [];
  constructor(
    config: GameConfig,
    now = 0,
    private random: Random = Math.random,
  ) {
    this.lastTime = now;
    this.state = {
      ...config,
      equation: generate(config.level, random),
      blockId: 1,
      y: 0,
      stack: [],
      phase: 'falling',
      phaseMs: 0,
      dropStart: 0,
      paused: false,
      activeMs: 0,
      score: 0,
      streak: 0,
      bestStreak: 0,
      correct: 0,
      mistakes: 0,
      missed: 0,
      award: 0,
    };
  }
  get target() {
    return CAPACITY - this.state.stack.length;
  }
  get speed() {
    return BASE_SPEED[this.state.tempo] * (1 + Math.min(this.state.activeMs / 1000, 240) / 120);
  }
  private distance(ms: number) {
    const t = this.state.activeMs / 1000;
    const dt = ms / 1000;
    const growing = Math.max(0, Math.min(dt, 240 - t));
    return (
      BASE_SPEED[this.state.tempo] *
      (growing * (1 + t / 120) + (growing * growing) / 240 + (dt - growing) * 3)
    );
  }
  advance(now: number) {
    let remaining = Math.max(0, now - this.lastTime);
    this.lastTime = Math.max(now, this.lastTime);
    const s = this.state;
    if (s.paused || s.phase === 'over') return;
    while (remaining > 0 && (s.phase as Phase) !== 'over') {
      if (s.phase === 'falling') {
        const distance = this.distance(remaining);
        if (s.y + distance < this.target - 1e-9) {
          s.y += distance;
          s.activeMs += remaining;
          return;
        }
        // Find the exact landing time so one long frame equals many short frames.
        let low = 0,
          high = remaining;
        for (let i = 0; i < 45; i++) {
          const mid = (low + high) / 2;
          if (s.y + this.distance(mid) < this.target) low = mid;
          else high = mid;
        }
        s.activeMs += high;
        remaining = Math.max(0, remaining - high);
        s.y = this.target;
        s.stack.push(s.equation);
        s.missed++;
        s.streak = 0;
        s.phase = 'missed';
        s.phaseMs = 0;
        this.events.push('missed');
      } else {
        const duration = s.phase === 'correct' ? 280 : s.phase === 'dropping' ? 400 : CORRECTION_MS;
        const used = Math.min(remaining, duration - s.phaseMs);
        s.phaseMs += used;
        remaining -= used;
        if (s.phase === 'dropping')
          s.y = s.dropStart + (this.target - s.dropStart) * (s.phaseMs / duration);
        if (s.phaseMs < duration) return;
        if (s.phase === 'correction') {
          s.phase = 'dropping';
          s.phaseMs = 0;
          s.dropStart = s.y;
        } else {
          if (s.phase === 'dropping') s.stack.push(s.equation);
          this.next();
        }
      }
    }
  }
  private next() {
    const s = this.state;
    if (s.stack.length === CAPACITY) {
      s.phase = 'over';
      this.events.push('over');
      return;
    }
    s.equation = generate(s.level, this.random, s.equation);
    s.blockId++;
    s.y = 0;
    s.phase = 'falling';
    s.phaseMs = 0;
  }
  answer(value: boolean, blockId: number, now: number) {
    this.advance(now);
    const s = this.state;
    if (s.paused || s.phase !== 'falling' || blockId !== s.blockId) return;
    s.phaseMs = 0;
    if (value === (s.equation.result === s.equation.shown)) {
      s.award = 10 + s.streak;
      s.score += s.award;
      s.streak++;
      s.correct++;
      s.bestStreak = Math.max(s.bestStreak, s.streak);
      s.phase = 'correct';
      this.events.push('correct');
    } else {
      s.mistakes++;
      s.streak = 0;
      s.phase = 'correction';
      this.events.push('wrong');
    }
  }
  pause(now: number) {
    this.advance(now);
    this.state.paused = true;
  }
  resume(now: number) {
    this.lastTime = now;
    this.state.paused = false;
  }
  drainEvents() {
    const events = this.events;
    this.events = [];
    return events;
  }
}

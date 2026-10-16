import { useCallback, useEffect, useRef, useState } from 'react';
import { Game, type GameConfig, type GameState } from './engine';
import { playSound, unlockAudio } from '../sound';
import { GameTracking } from './tracking';

interface UseGameLoopOptions {
  muted: boolean;
  onResult: (result: GameState) => void;
}

export function useGameLoop({ muted, onResult }: UseGameLoopOptions) {
  const [game, setGame] = useState<Game | null>(null);
  const [frame, setFrame] = useState<GameState | null>(null);
  const gameTracking = useRef<GameTracking | null>(null);
  const latest = useRef({ muted, onResult });
  latest.current = { muted, onResult };

  // Every engine transition publishes one snapshot and consumes its events once.
  const refresh = useCallback((current: Game) => {
    gameTracking.current?.resolve(current.drainResolutions());
    for (const event of current.drainEvents()) {
      playSound(event, latest.current.muted);
      if (event === 'over') {
        gameTracking.current?.end(current.state, 'board_full');
        latest.current.onResult({ ...current.state, stack: [...current.state.stack] });
      }
    }
    setFrame({ ...current.state, stack: [...current.state.stack] });
  }, []);

  const answer = useCallback(
    (value: boolean, id: number) => {
      if (!game) return;
      if (!latest.current.muted) unlockAudio();
      game.answer(value, id, performance.now());
      refresh(game);
    },
    [game, refresh],
  );

  const pauseWithReason = useCallback(
    (reason: 'manual' | 'hidden') => {
      if (!game || game.state.phase === 'over' || game.state.paused) return;
      game.pause(performance.now());
      refresh(game);
      gameTracking.current?.pause(reason);
    },
    [game, refresh],
  );

  const pause = useCallback(() => pauseWithReason('manual'), [pauseWithReason]);

  const resume = useCallback(() => {
    if (!game || game.state.phase === 'over' || !game.state.paused) return;
    if (!latest.current.muted) unlockAudio();
    game.resume(performance.now());
    gameTracking.current?.resume();
    refresh(game);
  }, [game, refresh]);

  // Tie browser listeners and animation cleanup to the actual game instance.
  useEffect(() => {
    if (!game) return;
    let raf = 0;
    const tick = (now: number) => {
      if (!game.state.paused) {
        game.advance(now);
        refresh(game);
      }
      if (game.state.phase !== 'over') raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const visibility = () => {
      if (document.hidden) pauseWithReason('hidden');
    };
    document.addEventListener('visibilitychange', visibility);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [game, refresh, pauseWithReason]);

  useEffect(() => {
    if (!game) return;
    const keyboard = (event: KeyboardEvent) => {
      if (
        event.repeat ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        document.querySelector('dialog[open]') ||
        game.state.phase === 'over'
      )
        return;
      if ((event.target as HTMLElement)?.matches('input,select,textarea,button')) return;
      if (event.code === 'Space' || event.code === 'Escape') {
        event.preventDefault();
        pause();
      }
      if (['ArrowLeft', 'KeyT', 'ArrowRight', 'KeyF'].includes(event.code)) {
        event.preventDefault();
        answer(event.code === 'ArrowLeft' || event.code === 'KeyT', game.state.blockId);
      }
    };
    document.addEventListener('keydown', keyboard);
    return () => document.removeEventListener('keydown', keyboard);
  }, [game, answer, pause]);

  const start = useCallback(
    (config: GameConfig, source: 'start' | 'replay' = 'start') => {
      if (!latest.current.muted) unlockAudio();
      const next = new Game(config, performance.now());
      gameTracking.current = new GameTracking(next.state, source);
      setGame(next);
      refresh(next);
    },
    [refresh],
  );

  const stop = useCallback(() => {
    gameTracking.current = null;
    setGame(null);
    setFrame(null);
  }, []);

  const finishEarly = useCallback(() => {
    if (!game || game.state.phase === 'over') return;
    gameTracking.current?.end(game.state, 'exit');
  }, [game]);

  return {
    frame,
    playing: !!frame && frame.phase !== 'over',
    start,
    stop,
    pause,
    resume,
    answer,
    finishEarly,
  };
}

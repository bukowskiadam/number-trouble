import { useCallback, useEffect, useRef, useState } from 'react';
import { Game, type GameConfig, type GameState } from './engine';
import { playSound, unlockAudio } from '../sound';

interface UseGameLoopOptions {
  muted: boolean;
  onResult: (result: GameState) => void;
}

export function useGameLoop({ muted, onResult }: UseGameLoopOptions) {
  const [game, setGame] = useState<Game | null>(null);
  const [frame, setFrame] = useState<GameState | null>(null);
  const latest = useRef({ muted, onResult });
  latest.current = { muted, onResult };

  // Every engine transition publishes one snapshot and consumes its events once.
  const refresh = useCallback((current: Game) => {
    for (const event of current.drainEvents()) {
      playSound(event, latest.current.muted);
      if (event === 'over')
        latest.current.onResult({ ...current.state, stack: [...current.state.stack] });
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

  const pause = useCallback(() => {
    if (!game || game.state.phase === 'over') return;
    game.pause(performance.now());
    refresh(game);
  }, [game, refresh]);

  const resume = useCallback(() => {
    if (!game || game.state.phase === 'over') return;
    if (!latest.current.muted) unlockAudio();
    game.resume(performance.now());
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
      if (document.hidden) pause();
    };
    document.addEventListener('visibilitychange', visibility);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [game, refresh, pause]);

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
    (config: GameConfig) => {
      if (!latest.current.muted) unlockAudio();
      const next = new Game(config, performance.now());
      setGame(next);
      refresh(next);
    },
    [refresh],
  );

  const stop = useCallback(() => {
    setGame(null);
    setFrame(null);
  }, []);

  return { frame, playing: !!frame && frame.phase !== 'over', start, stop, pause, resume, answer };
}

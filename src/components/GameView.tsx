import { Flame, Pause } from 'lucide-react';
import { animals } from '../i18n';
import type { Copy } from '../i18n';
import { tempos } from '../game/generator';
import type { GameState } from '../game/engine';
import { Board } from './Board';

interface GameViewProps {
  t: Copy;
  frame: GameState;
  answer: (value: boolean, id: number) => void;
  pause: () => void;
}

export function GameView({ t, frame, answer, pause }: GameViewProps) {
  const feedback =
    frame.phase === 'correct'
      ? t.correct
      : frame.phase === 'missed'
        ? t.missed
        : frame.phase === 'correction' || frame.phase === 'dropping'
          ? frame.equation.shown === frame.equation.result
            ? t.wasTrue
            : t.wrong
          : t.ready;
  const levelIndex = frame.level - 1;
  const tempoIndex = tempos.indexOf(frame.tempo);
  const animal = animals[tempoIndex];

  return (
    <section className="game-section">
      <div className="game-heading">
        <div>
          <h1 className="eyebrow">{t.levels[levelIndex]}</h1>
          <p className="game-tempo">
            {animal} {t.tempos[tempoIndex]}
          </p>
        </div>
        <button className="secondary pause-button" onClick={pause}>
          <Pause size={18} />
          {t.pause}
        </button>
      </div>
      <div className="scoreboard">
        <div>
          <small>{t.points}</small>
          <strong data-testid="score">{frame.score}</strong>
        </div>
        <div>
          <small>
            <Flame size={15} />
            {t.streak}
          </small>
          <strong data-testid="streak">{frame.streak}</strong>
        </div>
        <div>
          <small>{t.blocks}</small>
          <strong data-testid="blocks">
            {frame.stack.length}
            <span> / 8</span>
          </strong>
        </div>
      </div>
      <p className={`game-feedback ${frame.phase !== 'falling' ? 'highlight' : ''}`} role="status">
        {feedback}
      </p>
      <Board state={frame} copy={t} answer={answer} />
      <p className="keyboard-hint">{t.keyboard}</p>
    </section>
  );
}

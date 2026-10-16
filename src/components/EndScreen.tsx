import { ArrowLeft, RotateCcw, Trophy } from 'lucide-react';
import { recordKey } from '../profiles';
import type { Copy } from '../i18n';
import type { GameState } from '../game/engine';
import type { Profile } from '../profiles';

interface EndScreenProps {
  t: Copy;
  frame: GameState;
  bestBefore: number | undefined;
  profile: Profile;
  onReplay: () => void;
  onHome: () => void;
}

export function EndScreen({ t, frame, bestBefore, profile, onReplay, onHome }: EndScreenProps) {
  const isNewRecord = bestBefore === undefined || frame.score > bestBefore;

  return (
    <section className="summary content-panel">
      <div className="summary-medal">
        <Trophy size={42} />
      </div>
      <p className="eyebrow">{isNewRecord ? t.newRecord : t.full}</p>
      <h1>{t.gameOver}</h1>
      <p>{t.summary}</p>
      <div className="final-score">
        <strong>{frame.score}</strong>
        <span>{t.points}</span>
      </div>
      <div className="summary-stats">
        {[
          [t.correctCount, frame.correct],
          [t.wrongCount, frame.mistakes],
          [t.missedCount, frame.missed],
          [t.bestStreak, frame.bestStreak],
        ].map(([label, value]) => (
          <div key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <p className="summary-record">
        <Trophy size={18} />
        {t.best}: {profile.records[recordKey(frame.level, frame.tempo)]?.score ?? frame.score}
      </p>
      <div className="summary-actions">
        <button className="primary" onClick={onReplay}>
          <RotateCcw size={18} />
          {t.again}
        </button>
        <button className="secondary" onClick={onHome}>
          <ArrowLeft size={18} />
          {t.home}
        </button>
      </div>
    </section>
  );
}

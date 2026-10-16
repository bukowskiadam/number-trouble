import { ArrowRight, Check, Settings2, Trophy } from 'lucide-react';
import type { Copy } from '../i18n';
import { animals, examples } from '../i18n';
import { levels, tempos, type Level, type Tempo } from '../game/generator';
import type { Best, Profile } from '../profiles';

interface WelcomeScreenProps {
  t: Copy;
  profile: Profile;
  best: Best | undefined;
  onLevelChange: (level: Level) => void;
  onTempoChange: (tempo: Tempo) => void;
  onStart: () => void;
}

const levelSymbols = ['+', '++', '±', '100'];

export function WelcomeScreen({
  t,
  profile,
  best,
  onLevelChange,
  onTempoChange,
  onStart,
}: WelcomeScreenProps) {
  return (
    <>
      <section className="welcome">
        <div>
          <p className="eyebrow">
            {t.hello} {profile.name || t.explorer}! <span aria-hidden="true">✦</span>
          </p>
          <h1>{t.invitation}</h1>
          <p>{t.intro}</p>
        </div>
        <div className="math-art" aria-hidden="true">
          <span className="art-one">2 + 3</span>
          <span className="art-two">
            = 5 <Check size={24} />
          </span>
          <span className="art-spark">✧</span>
        </div>
      </section>
      <section className="level-section" aria-labelledby="level-title">
        <div className="section-heading">
          <div>
            <h2 id="level-title">
              <span className="step">1</span>
              {t.level}
            </h2>
            <p>{t.levelHint}</p>
          </div>
          <Settings2 size={21} />
        </div>
        <div className="level-grid">
          {levels.map((level, i) => (
            <button
              className={`level-card level-${level}`}
              key={level}
              aria-pressed={profile.settings.level === level}
              onClick={() => onLevelChange(level)}
            >
              <div className="level-top">
                <span className="level-symbol">{levelSymbols[i]}</span>
                <span className="selection-check">
                  {profile.settings.level === level && <Check size={15} />}
                </span>
              </div>
              <strong>{t.levels[i]}</strong>
              <span className="level-description">{t.descriptions[i]}</span>
              <span className="example">{examples[i]}</span>
            </button>
          ))}
        </div>
      </section>
      <section className="tempo-section" aria-labelledby="tempo-title">
        <div className="section-heading">
          <div>
            <h2 id="tempo-title">
              <span className="step">2</span>
              {t.tempo}
            </h2>
            <p>{t.tempoHint}</p>
          </div>
        </div>
        <div className="tempo-grid">
          {tempos.map((tempo, i) => (
            <button
              className="tempo-card"
              key={tempo}
              aria-pressed={profile.settings.tempo === tempo}
              onClick={() => onTempoChange(tempo)}
            >
              <span className="animal" aria-hidden="true">
                {animals[i]}
              </span>
              <span>
                <strong>{t.tempos[i]}</strong>
                <small>{t.speeds[i]}</small>
              </span>
              <span className="selection-check">
                {profile.settings.tempo === tempo && <Check size={15} />}
              </span>
            </button>
          ))}
        </div>
      </section>
      <section className="start-strip">
        <div className="best-preview">
          <span className="trophy-circle">
            <Trophy size={24} />
          </span>
          <div>
            <small>{t.best}</small>
            <strong>{best ? `${best.score} ${t.points.toLowerCase()}` : t.noRecord}</strong>
          </div>
        </div>
        <button className="primary start-button" onClick={onStart}>
          {t.start}
          <ArrowRight size={22} />
        </button>
      </section>
      <p className="gentle-hint">
        <span>✓</span> {t.instruction}
      </p>
    </>
  );
}

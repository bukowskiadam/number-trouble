import type { CSSProperties } from 'react';
import type { GameState } from '../game/engine';
import type { Equation } from '../game/generator';
import type { Copy } from '../i18n';
export function EquationView({
  equation: e,
  correction = false,
}: {
  equation: Equation;
  correction?: boolean;
}) {
  return (
    <span className="equation">
      {e.a} {e.operator} {e.b} ={' '}
      {correction ? (
        <>
          {e.shown !== e.result && <del>{e.shown}</del>} <strong>{e.result}</strong>
        </>
      ) : (
        e.shown
      )}
    </span>
  );
}
export function Board({
  state: s,
  copy: t,
  answer,
}: {
  state: GameState;
  copy: Copy;
  answer: (v: boolean, id: number) => void;
}) {
  const isCorrection = s.phase === 'correction' || s.phase === 'dropping';
  const showActive = s.phase !== 'missed' && s.phase !== 'over';
  const fraction = s.y / (8 - s.stack.length);
  const style = { '--travel': fraction, '--target-rows': 7 - s.stack.length } as CSSProperties;
  return (
    <div className="board" aria-label={t.board} data-phase={s.phase}>
      <div className="board-grid" aria-hidden="true">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i}>
            <span>{8 - i}</span>
          </div>
        ))}
      </div>
      {s.stack.map((equation, i) => (
        <div
          className={`stack-block ${s.phase === 'missed' && i === s.stack.length - 1 ? 'just-landed' : ''}`}
          key={i}
          style={{ bottom: `calc(var(--apron) + ${i} * var(--row))` }}
        >
          <EquationView equation={equation} correction />
        </div>
      ))}
      {showActive && (
        <div
          className={`active-block ${isCorrection ? 'corrected' : ''} ${s.phase === 'correct' ? 'success' : ''}`}
          style={style}
          data-testid="active-block"
        >
          <div className="falling-equation">
            <EquationView equation={s.equation} correction={isCorrection} />
          </div>
          {s.phase === 'falling' ? (
            <div className="answer-buttons">
              {[true, false].map((value) => (
                <button
                  key={String(value)}
                  className={value ? 'answer yes' : 'answer no'}
                  aria-label={value ? t.trueLabel : t.falseLabel}
                  disabled={s.paused}
                  onPointerDown={(event) => {
                    if (event.button !== 0) return;
                    event.preventDefault();
                    event.currentTarget.setPointerCapture(event.pointerId);
                    answer(value, s.blockId);
                  }}
                  onClick={(event) => {
                    if (event.detail === 0) answer(value, s.blockId);
                  }}
                >
                  {value ? '✓' : '✗'}
                </button>
              ))}
            </div>
          ) : (
            <div className="block-feedback">{s.phase === 'correct' ? `✓ +${s.award}` : '✓'}</div>
          )}
        </div>
      )}
      <div className="board-floor" aria-hidden="true">
        {Array.from({ length: 8 }, (_, i) => (
          <span key={i} className={i < s.stack.length ? 'filled' : ''} />
        ))}
      </div>
    </div>
  );
}

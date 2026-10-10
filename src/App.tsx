import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Cloud,
  Download,
  Flame,
  Gamepad2,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Settings2,
  Sparkles,
  Trophy,
  Users,
  Volume2,
  VolumeX,
  WifiOff,
} from 'lucide-react';
import { Game, type GameState } from './game/engine';
import { levels, tempos } from './game/generator';
import {
  createProfile,
  parseStore,
  recordKey,
  removeProfile,
  saveResult,
  STORAGE_KEY,
  updateProfile,
  type Profile,
  type Settings,
  type Store,
} from './profiles';
import { animals, examples, text } from './i18n';
import { playSound, unlockAudio } from './sound';
import { usePwa } from './pwa';
import { Board } from './components/Board';
import { Dialog } from './components/Dialog';

type Page = 'play' | 'profiles' | 'records';
type InstallEvent = Event & { prompt: () => Promise<void> };
export function App() {
  const [initial] = useState(() => {
    try {
      return { store: parseStore(localStorage.getItem(STORAGE_KEY)), failed: false };
    } catch {
      return { store: parseStore(null), failed: true };
    }
  });
  const [store, setStore] = useState<Store>(initial.store);
  const [storageError, setStorageError] = useState(initial.failed);
  const [page, setPage] = useState<Page>('play');
  const [game, setGame] = useState<Game | null>(null);
  const [frame, setFrame] = useState<GameState | null>(null);
  const [help, setHelp] = useState<'help' | 'start' | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [confirmation, setConfirmation] = useState<{ kind: 'delete' | 'reset'; id: string } | null>(
    null,
  );
  const [newName, setNewName] = useState('');
  const [install, setInstall] = useState<InstallEvent | null>(null);
  const [installHelp, setInstallHelp] = useState(false);
  const pwa = usePwa();
  const profile = store.profiles.find((p) => p.id === store.activeId)!;
  const t = text[profile.settings.language];
  const name = (p: Profile) => p.name || t.explorer;
  const [rename, setRename] = useState(profile.name);
  const bestBefore = useRef<number | undefined>(undefined);
  const finished = useRef<Game | null>(null);
  const muted = useRef(profile.settings.muted);
  muted.current = profile.settings.muted;
  const playing = !!game && frame?.phase !== 'over';
  const best = profile.records[recordKey(profile.settings.level, profile.settings.tempo)];

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [store]);
  useEffect(() => {
    document.documentElement.lang = profile.settings.language;
  }, [profile.settings.language]);
  useEffect(() => {
    setRename(profile.name);
  }, [profile.id, profile.name]);
  useEffect(() => {
    const listener = (event: Event) => {
      event.preventDefault();
      setInstall(event as InstallEvent);
    };
    window.addEventListener('beforeinstallprompt', listener);
    return () => window.removeEventListener('beforeinstallprompt', listener);
  }, []);
  const changeSettings = (change: Partial<Settings>) =>
    setStore((s) =>
      updateProfile(s, profile.id, (p) => ({ ...p, settings: { ...p.settings, ...change } })),
    );
  const refresh = useCallback((current: Game) => {
    current.drainEvents().forEach((event) => playSound(event, muted.current));
    setFrame({ ...current.state, stack: [...current.state.stack] });
    if (current.state.phase === 'over' && finished.current !== current) {
      finished.current = current;
      const s = current.state;
      setStore((store) => saveResult(store, s.profileId, s.level, s.tempo, s.score));
    }
  }, []);
  const answer = useCallback(
    (value: boolean, id: number) => {
      if (!game) return;
      if (!muted.current) unlockAudio();
      game.answer(value, id, performance.now());
      refresh(game);
    },
    [game, refresh],
  );
  const pause = useCallback(() => {
    if (game) {
      game.pause(performance.now());
      refresh(game);
    }
  }, [game, refresh]);
  const resume = () => {
    if (game) {
      if (!muted.current) unlockAudio();
      game.resume(performance.now());
      refresh(game);
    }
  };
  useEffect(() => {
    if (!game) return;
    let raf = 0;
    const tick = (now: number) => {
      game.advance(now);
      refresh(game);
      if (game.state.phase !== 'over') raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const visibility = () => {
      if (document.hidden && game.state.phase !== 'over') {
        game.pause(performance.now());
        refresh(game);
      }
    };
    document.addEventListener('visibilitychange', visibility);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [game, refresh]);
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
  function start() {
    if (!muted.current) unlockAudio();
    bestBefore.current =
      profile.records[recordKey(profile.settings.level, profile.settings.tempo)]?.score;
    const next = new Game(
      { profileId: profile.id, level: profile.settings.level, tempo: profile.settings.tempo },
      performance.now(),
    );
    setHelp(null);
    setGame(next);
    setFrame({ ...next.state });
    setPage('play');
    (document.activeElement as HTMLElement)?.blur();
    window.scrollTo({ top: 0 });
  }
  function home() {
    setGame(null);
    setFrame(null);
    setLeaving(false);
    setPage('play');
  }
  const feedback =
    frame?.phase === 'correct'
      ? t.correct
      : frame?.phase === 'missed'
        ? t.missed
        : frame?.phase === 'correction' || frame?.phase === 'dropping'
          ? frame.equation.shown === frame.equation.result
            ? t.wasTrue
            : t.wrong
          : t.ready;
  const confirming = store.profiles.find((p) => p.id === confirmation?.id);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            if (!playing) home();
          }}
          aria-label="Number Trouble"
        >
          <span className="brand-icon">
            +<small>−</small>
          </span>
          <span>
            number
            <span className="brand-second">
              trouble<span className="brand-dot">.</span>
            </span>
          </span>
        </a>
        <p className="tagline">{t.tagline}</p>
        <nav aria-label="Number Trouble">
          {(
            [
              { key: 'play', icon: Gamepad2, label: t.play },
              { key: 'profiles', icon: Users, label: t.profiles },
              { key: 'records', icon: Trophy, label: t.records },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              className={`nav-item ${page === item.key ? 'selected' : ''}`}
              aria-current={page === item.key ? 'page' : undefined}
              disabled={playing}
              onClick={() => {
                setGame(null);
                setFrame(null);
                setPage(item.key);
              }}
            >
              <item.icon size={21} />
              <span>{item.label}</span>
              {page === item.key && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <Sparkles size={24} />
            <p>{t.footer}</p>
            <span aria-hidden="true">+ &nbsp; − &nbsp; =</span>
          </div>
          <button className="help-link" disabled={playing} onClick={() => setHelp('help')}>
            <BookOpen size={18} />
            {t.how}
          </button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="current-profile">
            <span className="avatar">
              {name(profile).slice(0, 1).toLocaleUpperCase(profile.settings.language)}
            </span>
            <span>{name(profile)}</span>
          </div>
          <div className="toolbar">
            <button
              className="icon-button"
              onClick={() => {
                if (profile.settings.muted) unlockAudio();
                changeSettings({ muted: !profile.settings.muted });
              }}
              aria-label={profile.settings.muted ? t.soundOff : t.soundOn}
            >
              {profile.settings.muted ? <VolumeX size={21} /> : <Volume2 size={21} />}
            </button>
            <label className="language">
              <span className="sr-only">{t.language}</span>
              <select
                aria-label={t.language}
                value={profile.settings.language}
                onChange={(e) => changeSettings({ language: e.target.value as 'pl' | 'en' })}
              >
                <option value="pl">PL</option>
                <option value="en">EN</option>
              </select>
            </label>
          </div>
        </header>
        {storageError && (
          <p className="storage-warning" role="alert">
            {t.storageError}
          </p>
        )}
        <main>
          {!game && page === 'play' && (
            <>
              <section className="welcome">
                <div>
                  <p className="eyebrow">
                    {t.hello} {name(profile)}! <span aria-hidden="true">✦</span>
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
                      onClick={() => changeSettings({ level })}
                    >
                      <div className="level-top">
                        <span className="level-symbol">{['+', '++', '±', '100'][i]}</span>
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
                      onClick={() => changeSettings({ tempo })}
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
                <button className="primary start-button" onClick={() => setHelp('start')}>
                  {t.start}
                  <ArrowRight size={22} />
                </button>
              </section>
              <p className="gentle-hint">
                <span>✓</span> {t.instruction}
              </p>
            </>
          )}
          {!game && page === 'profiles' && (
            <section className="content-panel">
              <p className="eyebrow">Number Trouble</p>
              <h1>{t.who}</h1>
              <p>{t.profileInfo}</p>
              <div className="profile-list">
                {store.profiles.map((p) => (
                  <div className="profile-row" key={p.id}>
                    <button
                      className="profile-choice"
                      aria-pressed={p.id === profile.id}
                      onClick={() => {
                        setStore((s) => ({ ...s, activeId: p.id }));
                        setPage('play');
                      }}
                    >
                      <span className="avatar">{name(p).slice(0, 1).toLocaleUpperCase()}</span>
                      <span>
                        <strong>{name(p)}</strong>
                        <small>{p.id === profile.id ? t.selected : t.select}</small>
                      </span>
                      <ChevronRight size={18} />
                    </button>
                    <button
                      className="text-danger"
                      disabled={store.profiles.length === 1}
                      aria-label={`${t.remove}: ${name(p)}`}
                      onClick={() => setConfirmation({ kind: 'delete', id: p.id })}
                    >
                      {t.remove}
                    </button>
                  </div>
                ))}
              </div>
              <form
                className="profile-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newName.trim()) return;
                  const added = createProfile(newName);
                  added.settings.language = profile.settings.language;
                  setStore((s) => ({ ...s, profiles: [...s.profiles, added], activeId: added.id }));
                  setNewName('');
                  setPage('play');
                }}
              >
                <label htmlFor="new-name">{t.newName}</label>
                <div className="form-row">
                  <input
                    id="new-name"
                    value={newName}
                    maxLength={30}
                    required
                    onChange={(e) => setNewName(e.target.value)}
                  />
                  <button className="primary" disabled={!newName.trim()}>
                    <Plus size={18} />
                    {t.add}
                  </button>
                </div>
              </form>
              <form
                className="profile-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (rename.trim())
                    setStore((s) =>
                      updateProfile(s, profile.id, (p) => ({
                        ...p,
                        name: rename.trim().slice(0, 30),
                      })),
                    );
                }}
              >
                <label htmlFor="rename">{t.name}</label>
                <div className="form-row">
                  <input
                    id="rename"
                    value={rename}
                    maxLength={30}
                    required
                    onChange={(e) => setRename(e.target.value)}
                  />
                  <button className="secondary" disabled={!rename.trim()}>
                    {t.rename}
                  </button>
                </div>
              </form>
              <button
                className="text-danger reset-button"
                onClick={() => setConfirmation({ kind: 'reset', id: profile.id })}
              >
                <RotateCcw size={16} />
                {t.reset}
              </button>
              {store.profiles.length === 1 && <p className="small-note">{t.lastProfile}</p>}
              <p className="local-note">{t.local}</p>
            </section>
          )}
          {!game && page === 'records' && (
            <section className="content-panel">
              <p className="eyebrow">{name(profile)}</p>
              <h1>{t.records}</h1>
              <p>{t.recordsHint}</p>
              <div className="records-table">
                <table>
                  <thead>
                    <tr>
                      <th scope="col">
                        {t.level.replace('Wybierz ', '').replace('Choose a ', '')}
                      </th>
                      {tempos.map((tempo, i) => (
                        <th scope="col" key={tempo}>
                          <span aria-hidden="true">{animals[i]}</span> {t.tempos[i]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {levels.map((level, i) => (
                      <tr key={level}>
                        <th scope="row">{t.levels[i]}</th>
                        {tempos.map((tempo) => {
                          const record = profile.records[recordKey(level, tempo)];
                          return (
                            <td key={tempo}>
                              {record ? (
                                <strong>{record.score}</strong>
                              ) : (
                                <span aria-label={t.emptyRecord}>—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="local-note">{t.local}</p>
            </section>
          )}
          {game && frame && frame.phase !== 'over' && (
            <section className="game-section">
              <div className="game-heading">
                <div>
                  <h1 className="eyebrow">{t.levels[frame.level - 1]}</h1>
                  <p className="game-tempo">
                    {animals[tempos.indexOf(frame.tempo)]} {t.tempos[tempos.indexOf(frame.tempo)]}
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
              <p
                className={`game-feedback ${frame.phase !== 'falling' ? 'highlight' : ''}`}
                role="status"
              >
                {feedback}
              </p>
              <Board state={frame} copy={t} answer={answer} />
              <p className="keyboard-hint">{t.keyboard}</p>
            </section>
          )}
          {game && frame?.phase === 'over' && (
            <section className="summary content-panel">
              <div className="summary-medal">
                <Trophy size={42} />
              </div>
              <p className="eyebrow">
                {bestBefore.current === undefined || frame.score > bestBefore.current
                  ? t.newRecord
                  : t.full}
              </p>
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
                {t.best}:{' '}
                {profile.records[recordKey(frame.level, frame.tempo)]?.score ?? frame.score}
              </p>
              <div className="summary-actions">
                <button className="primary" onClick={start}>
                  <RotateCcw size={18} />
                  {t.again}
                </button>
                <button className="secondary" onClick={home}>
                  <ArrowLeft size={18} />
                  {t.home}
                </button>
              </div>
            </section>
          )}
        </main>
        {!playing && (
          <footer>
            <span className={`offline-status ${pwa.status}`} role="status">
              {pwa.status === 'ready' ? <Cloud size={17} /> : <WifiOff size={17} />}{' '}
              {pwa.status === 'ready'
                ? t.offlineReady
                : pwa.status === 'preparing'
                  ? t.offlinePreparing
                  : t.offlineUnavailable}
            </span>
            {pwa.status === 'unavailable' && import.meta.env.PROD && (
              <button onClick={pwa.retry}>{t.offlineRetry}</button>
            )}
            <button
              onClick={() => {
                if (install) {
                  void install.prompt().then(() => setInstall(null));
                } else setInstallHelp(true);
              }}
            >
              <Download size={16} />
              {t.install}
            </button>
            {pwa.waiting && (
              <button className="update-button" onClick={pwa.update}>
                {t.update} · {t.updateAction}
              </button>
            )}
          </footer>
        )}
      </div>
      {help && (
        <Dialog title={t.how} closeLabel={t.close} onClose={() => setHelp(null)}>
          <p>{t.instruction}</p>
          <div className="instruction-example">
            <strong>
              2 + 1 = 3 <span>✓</span>
            </strong>
            <p>{t.exampleTrue}</p>
          </div>
          <div className="instruction-example">
            <strong>
              7 − 5 = 4 <span>✗</span>
            </strong>
            <p>{t.exampleFalse}</p>
          </div>
          <p>{t.rules}</p>
          <p className="series-note">{t.seriesRule}</p>
          <p className="small-note">{t.keyboard}</p>
          <button
            className="primary dialog-action"
            onClick={help === 'start' ? start : () => setHelp(null)}
          >
            <Play size={18} />
            {help === 'start' ? t.letsPlay : t.close}
          </button>
        </Dialog>
      )}
      {frame?.paused && frame.phase !== 'over' && !leaving && (
        <Dialog title={t.paused} closeLabel={t.resume} onClose={resume}>
          <p>{t.pauseHint}</p>
          <button className="primary dialog-action" onClick={resume}>
            <Play size={18} />
            {t.resume}
          </button>
          <button className="secondary dialog-action" onClick={() => setLeaving(true)}>
            {t.home}
          </button>
        </Dialog>
      )}
      {leaving && (
        <Dialog title={t.leave} closeLabel={t.cancel} onClose={() => setLeaving(false)}>
          <p>{t.leaveHint}</p>
          <div className="dialog-actions">
            <button className="secondary" onClick={() => setLeaving(false)}>
              {t.cancel}
            </button>
            <button className="danger" onClick={home}>
              {t.confirmLeave}
            </button>
          </div>
        </Dialog>
      )}
      {confirmation && confirming && (
        <Dialog
          title={`${confirmation.kind === 'delete' ? t.deleteQuestion : t.resetQuestion} „${name(confirming)}”?`}
          closeLabel={t.cancel}
          onClose={() => setConfirmation(null)}
        >
          <p>{confirmation.kind === 'delete' ? t.deleteHint : t.resetHint}</p>
          <div className="dialog-actions">
            <button className="secondary" onClick={() => setConfirmation(null)}>
              {t.cancel}
            </button>
            <button
              className="danger"
              onClick={() => {
                setStore((s) =>
                  confirmation.kind === 'delete'
                    ? removeProfile(s, confirmation.id)
                    : updateProfile(s, confirmation.id, (p) => ({ ...p, records: {} })),
                );
                setConfirmation(null);
              }}
            >
              {confirmation.kind === 'delete' ? t.remove : t.reset}
            </button>
          </div>
        </Dialog>
      )}
      {installHelp && (
        <Dialog title={t.install} closeLabel={t.close} onClose={() => setInstallHelp(false)}>
          <p>{t.installHint}</p>
          <button className="primary dialog-action" onClick={() => setInstallHelp(false)}>
            {t.close}
          </button>
        </Dialog>
      )}
    </div>
  );
}

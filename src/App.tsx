import { useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import { useGameLoop } from './game/useGameLoop';
import { useStore } from './useStore';
import {
  createProfile,
  recordKey,
  removeProfile,
  saveResult,
  updateProfile,
  type Settings,
} from './profiles';
import { text } from './i18n';
import { unlockAudio } from './sound';
import { usePwa } from './pwa';
import { Dialog } from './components/Dialog';
import { Sidebar, type Page } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ProfileManager } from './components/ProfileManager';
import { RecordsTable } from './components/RecordsTable';
import { GameView } from './components/GameView';
import { EndScreen } from './components/EndScreen';
import { Footer } from './components/Footer';
import { ReleaseHistory } from './components/ReleaseHistory';
import { hasNewVersion } from './releases';
import { tracking } from './tracking';
import type { GameState } from './game/engine';

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};
type Confirmation = { kind: 'delete' | 'reset'; id: string };

export function App() {
  const { store, setStore, storageError, previousVersion } = useStore();
  const [page, setPage] = useState<Page>('play');
  const profile = store.profiles.find((p) => p.id === store.activeId)!;
  const t = text[profile.settings.language];
  const pwa = usePwa();
  const [help, setHelp] = useState<'help' | 'start' | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [releaseHistory, setReleaseHistory] = useState<'all' | 'updates' | null>(() =>
    hasNewVersion(previousVersion) ? 'updates' : null,
  );
  const [install, setInstall] = useState<InstallEvent | null>(null);
  const [installHelp, setInstallHelp] = useState(false);
  const bestBefore = useRef<number | undefined>(undefined);

  useEffect(() => {
    document.documentElement.lang = profile.settings.language;
  }, [profile.settings.language]);

  useEffect(() => {
    const listener = (event: Event) => {
      event.preventDefault();
      setInstall(event as InstallEvent);
    };
    const installed = () => tracking.track('app_installed', {});
    window.addEventListener('beforeinstallprompt', listener);
    window.addEventListener('appinstalled', installed);
    return () => {
      window.removeEventListener('beforeinstallprompt', listener);
      window.removeEventListener('appinstalled', installed);
    };
  }, []);

  const game = useGameLoop({
    muted: profile.settings.muted,
    onResult: saveGameResult,
  });

  const screen = game.frame ? (game.frame.phase === 'over' ? 'summary' : 'game') : page;
  const observed = useRef<{
    launched: boolean;
    screen?: typeof screen;
    storageError?: boolean;
    offline?: typeof pwa.status;
    history?: typeof releaseHistory;
  }>({ launched: false });

  useEffect(() => {
    const previous = observed.current;
    if (!previous.launched) {
      previous.launched = true;
      tracking.track('app_opened', {
        language: profile.settings.language,
        online: navigator.onLine,
        displayMode: window.matchMedia('(display-mode: standalone)').matches
          ? 'standalone'
          : 'browser',
      });
    }
    if (previous.screen !== screen) {
      previous.screen = screen;
      tracking.track('screen_viewed', { screen });
    }
    if (previous.storageError !== storageError) {
      previous.storageError = storageError;
      tracking.track('storage_status_changed', { available: !storageError });
    }
    if (previous.offline !== pwa.status) {
      previous.offline = pwa.status;
      tracking.track('offline_status_changed', { status: pwa.status });
    }
    if (previous.history !== releaseHistory) {
      previous.history = releaseHistory;
      if (releaseHistory)
        tracking.track('release_history_opened', {
          source: releaseHistory === 'updates' ? 'update' : 'manual',
        });
    }
  }, [screen, storageError, pwa.status, releaseHistory, profile.settings.language]);

  function saveGameResult(result: GameState) {
    const previousScore = store.profiles.find((p) => p.id === result.profileId)?.records[
      recordKey(result.level, result.tempo)
    ]?.score;
    if (previousScore === undefined || result.score > previousScore) {
      tracking.track('record_improved', {
        level: result.level,
        tempo: result.tempo,
        score: result.score,
        previousScore: previousScore ?? null,
      });
    }
    setStore((s) => saveResult(s, result.profileId, result.level, result.tempo, result.score));
  }

  function openHelp(source: 'help' | 'start') {
    tracking.track('help_opened', { source: source === 'start' ? 'before_game' : 'menu' });
    setHelp(source);
  }

  function changeSettings<K extends keyof Settings>(setting: K, value: Settings[K]) {
    const previous = profile.settings[setting];
    if (previous === value) return;
    // The key and values come from the same Settings property.
    tracking.track('setting_changed', { setting, previous, value } as {
      [P in keyof Settings]: { setting: P; previous: Settings[P]; value: Settings[P] };
    }[keyof Settings]);
    const change = { [setting]: value };

    setStore((s) =>
      updateProfile(s, profile.id, (p) => ({
        ...p,
        settings: { ...p.settings, ...change },
      })),
    );
  }

  function navigate(next: Page) {
    game.stop();
    setPage(next);
  }

  function switchProfile(id: string) {
    if (!store.profiles.some((p) => p.id === id)) return;
    if (id !== profile.id) tracking.track('profile_changed', { action: 'selected' });
    setStore((s) => ({ ...s, activeId: id }));
    navigate('play');
  }

  function addProfile(name: string) {
    if (!name.trim()) return;
    const added = createProfile(name);
    tracking.track('profile_changed', { action: 'created' });
    added.settings.language = profile.settings.language;
    setStore((s) => ({ ...s, profiles: [...s.profiles, added], activeId: added.id }));
    navigate('play');
  }

  function renameProfile(name: string) {
    if (!name.trim() || name.trim().slice(0, 30) === profile.name) return;
    tracking.track('profile_changed', { action: 'renamed' });
    setStore((s) =>
      updateProfile(s, profile.id, (p) => ({ ...p, name: name.trim().slice(0, 30) })),
    );
  }

  function confirmProfileChange() {
    if (!confirmation) return;
    const { kind, id } = confirmation;
    if (
      !store.profiles.some((p) => p.id === id) ||
      (kind === 'delete' && store.profiles.length === 1)
    )
      return;
    tracking.track('profile_changed', { action: kind === 'delete' ? 'deleted' : 'reset' });
    setStore((s) =>
      kind === 'delete'
        ? removeProfile(s, id)
        : updateProfile(s, id, (p) => ({ ...p, records: {} })),
    );
    setConfirmation(null);
  }

  function handleStart(source: 'start' | 'replay' = 'start') {
    bestBefore.current =
      profile.records[recordKey(profile.settings.level, profile.settings.tempo)]?.score;
    setHelp(null);
    game.start(
      {
        profileId: profile.id,
        level: profile.settings.level,
        tempo: profile.settings.tempo,
      },
      source,
    );
    setPage('play');
    (document.activeElement as HTMLElement)?.blur();
    window.scrollTo({ top: 0 });
  }

  function handleHome() {
    navigate('play');
    setLeaving(false);
  }

  function handleLeave() {
    const result = game.frame;
    if (result && result.phase !== 'over') {
      game.finishEarly();
      saveGameResult(result);
    }
    handleHome();
  }

  function handleMuteToggle() {
    if (profile.settings.muted) unlockAudio();
    changeSettings('muted', !profile.settings.muted);
  }

  async function handleInstallClick() {
    tracking.track('install_requested', { method: install ? 'prompt' : 'instructions' });
    if (install) {
      const prompt = install;
      setInstall(null);
      try {
        await prompt.prompt();
        const { outcome } = await prompt.userChoice;
        tracking.track('install_prompt_result', { outcome });
      } catch {
        tracking.track('install_prompt_result', { outcome: 'failed' });
      }
    } else {
      setInstallHelp(true);
    }
  }

  const best = profile.records[recordKey(profile.settings.level, profile.settings.tempo)];
  const confirmProfile = store.profiles.find((p) => p.id === confirmation?.id);

  return (
    <div className="app-shell">
      <Sidebar
        t={t}
        page={page}
        onNavigate={navigate}
        playing={game.playing}
        onHelp={() => openHelp('help')}
      />
      <div className="workspace">
        <Topbar
          t={t}
          profile={profile}
          onMuteToggle={handleMuteToggle}
          onLanguageChange={(language) => changeSettings('language', language)}
        />
        {storageError && (
          <p className="storage-warning" role="alert">
            {t.storageError}
          </p>
        )}
        <main>
          {!game.frame && page === 'play' && (
            <WelcomeScreen
              t={t}
              profile={profile}
              best={best}
              onLevelChange={(level) => changeSettings('level', level)}
              onTempoChange={(tempo) => changeSettings('tempo', tempo)}
              onStart={() => openHelp('start')}
            />
          )}
          {!game.frame && page === 'profiles' && (
            <ProfileManager
              t={t}
              store={store}
              profile={profile}
              onSwitch={switchProfile}
              onAdd={addProfile}
              onRename={renameProfile}
              onDelete={(id) => setConfirmation({ kind: 'delete', id })}
              onReset={(id) => setConfirmation({ kind: 'reset', id })}
            />
          )}
          {!game.frame && page === 'records' && <RecordsTable t={t} profile={profile} />}
          {game.frame && game.frame.phase !== 'over' && (
            <GameView t={t} frame={game.frame} answer={game.answer} pause={game.pause} />
          )}
          {game.frame && game.frame.phase === 'over' && (
            <EndScreen
              t={t}
              frame={game.frame}
              bestBefore={bestBefore.current}
              profile={profile}
              onReplay={() => handleStart('replay')}
              onHome={handleHome}
            />
          )}
        </main>
        {!game.playing && (
          <Footer
            t={t}
            pwa={pwa}
            onInstallClick={handleInstallClick}
            onReleaseHistory={() => setReleaseHistory('all')}
          />
        )}
      </div>
      {releaseHistory && (
        <ReleaseHistory
          language={profile.settings.language}
          previousVersion={releaseHistory === 'updates' ? previousVersion : undefined}
          onClose={() => setReleaseHistory(null)}
        />
      )}
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
            onClick={help === 'start' ? () => handleStart() : () => setHelp(null)}
          >
            <Play size={18} />
            {help === 'start' ? t.letsPlay : t.close}
          </button>
        </Dialog>
      )}
      {game.frame?.paused && game.frame.phase !== 'over' && !leaving && (
        <Dialog title={t.paused} closeLabel={t.resume} onClose={game.resume}>
          <p>{t.pauseHint}</p>
          <button className="primary dialog-action" onClick={game.resume}>
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
            <button className="danger" onClick={handleLeave}>
              {t.confirmLeave}
            </button>
          </div>
        </Dialog>
      )}
      {confirmation && confirmProfile && (
        <Dialog
          title={`${confirmation.kind === 'delete' ? t.deleteQuestion : t.resetQuestion} „${confirmProfile.name || t.explorer}”?`}
          closeLabel={t.cancel}
          onClose={() => setConfirmation(null)}
        >
          <p>{confirmation.kind === 'delete' ? t.deleteHint : t.resetHint}</p>
          <div className="dialog-actions">
            <button className="secondary" onClick={() => setConfirmation(null)}>
              {t.cancel}
            </button>
            <button className="danger" onClick={confirmProfileChange}>
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

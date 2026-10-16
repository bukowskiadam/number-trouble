import { UmamiAdapter } from './analytics/umami';
import { umamiEnabled, UMAMI_WEBSITE_ID } from './analytics/config';
import { APP_VERSION } from './releases';
import type { Level, Tempo } from './game/generator';
import type { Language, Settings } from './profiles';

type GameContext = { gameId: string; level: Level; tempo: Tempo };
type SettingChange = {
  [K in keyof Settings]: { setting: K; previous: Settings[K]; value: Settings[K] };
}[keyof Settings];

export type TrackingEvents = {
  app_opened: { language: Language; online: boolean; displayMode: 'standalone' | 'browser' };
  screen_viewed: { screen: 'play' | 'profiles' | 'records' | 'game' | 'summary' };
  help_opened: { source: 'menu' | 'before_game' };
  release_history_opened: { source: 'manual' | 'update' };
  setting_changed: SettingChange;
  profile_changed: { action: 'created' | 'selected' | 'renamed' | 'reset' | 'deleted' };
  game_started: GameContext & { source: 'start' | 'replay' };
  equation_resolved: GameContext & {
    blockId: number;
    outcome: 'correct' | 'wrong' | 'missed';
    operator: '+' | '−';
    equationTrue: boolean;
    responseMs: number;
    score: number;
    streak: number;
  };
  game_paused: GameContext & { reason: 'manual' | 'hidden' };
  game_resumed: GameContext;
  game_ended: GameContext & {
    reason: 'board_full' | 'exit';
    score: number;
    correct: number;
    mistakes: number;
    missed: number;
    bestStreak: number;
    activeFallingMs: number;
  };
  record_improved: { level: Level; tempo: Tempo; score: number; previousScore: number | null };
  storage_status_changed: { available: boolean };
  offline_status_changed: { status: 'preparing' | 'ready' | 'unavailable' };
  install_requested: { method: 'prompt' | 'instructions' };
  install_prompt_result: { outcome: 'accepted' | 'dismissed' | 'failed' };
  app_installed: Record<string, never>;
  update_requested: Record<string, never>;
  offline_retry_requested: Record<string, never>;
};

export type TrackingEvent = {
  [K in keyof TrackingEvents]: Readonly<{
    name: K;
    properties: Readonly<TrackingEvents[K]>;
    schemaVersion: 1;
    appVersion: string;
    timestamp: string;
  }>;
}[keyof TrackingEvents];

export interface TrackingAdapter {
  track(event: TrackingEvent): void | Promise<void>;
}

export const consoleTrackingAdapter: TrackingAdapter = {
  track(event) {
    console.log('[tracking]', event);
  },
};

export function createTracker(adapter: TrackingAdapter) {
  return {
    track<K extends keyof TrackingEvents>(name: K, properties: TrackingEvents[K]): void {
      // Analytics is best effort: neither synchronous nor async failures interrupt play.
      try {
        const event = Object.freeze({
          name,
          properties: Object.freeze({ ...properties }),
          schemaVersion: 1 as const,
          appVersion: APP_VERSION,
          timestamp: new Date().toISOString(),
        }) as TrackingEvent;
        void Promise.resolve(adapter.track(event)).catch(() => {});
      } catch {
        // Do not recursively report adapter failures through analytics.
      }
    },
  };
}

const websiteId = import.meta.env.VITE_UMAMI_WEBSITE_ID ?? UMAMI_WEBSITE_ID;
const useUmami =
  typeof window !== 'undefined' &&
  umamiEnabled(
    websiteId,
    import.meta.env.PROD,
    window.location.hostname,
    import.meta.env.VITE_UMAMI_HOSTNAME || 'bukowskiadam.github.io',
  );

// Local development and unconfigured builds remain console-only.
export const tracking = createTracker(
  useUmami
    ? new UmamiAdapter(websiteId, () => ({
        hostname: window.location.hostname,
        language: document.documentElement.lang || navigator.language,
      }))
    : consoleTrackingAdapter,
);

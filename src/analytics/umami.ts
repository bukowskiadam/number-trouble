import type { TrackingAdapter, TrackingEvent } from '../tracking';
import { IndexedEventQueue, type EventQueue } from './queue';

export const UMAMI_ENDPOINT = 'https://gateway.umami.is/api/send';
export const APP_TAG = 'number-trouble';
export const RETRY_MS = 30_000;

export type UmamiRequest = {
  type: 'event';
  payload: {
    website: string;
    hostname: string;
    url: string;
    title: string;
    language: string;
    tag: typeof APP_TAG;
    timestamp: number;
    name?: string;
    data?: Record<string, unknown>;
  };
};

type PageContext = { hostname: string; language: string };

export function toUmamiRequest(
  event: TrackingEvent,
  websiteId: string,
  context: PageContext,
): UmamiRequest {
  const pageview = event.name === 'screen_viewed';
  const screen = pageview ? event.properties.screen : 'play';
  return {
    type: 'event',
    payload: {
      website: websiteId,
      hostname: context.hostname,
      language: context.language,
      url: `/number-trouble/${screen === 'play' ? '' : screen}`,
      title: pageview ? `Number Trouble · ${screen}` : 'Number Trouble',
      tag: APP_TAG,
      timestamp: Math.floor(Date.parse(event.timestamp) / 1000),
      ...(pageview
        ? {}
        : {
            name: event.name,
            data: {
              ...event.properties,
              app: APP_TAG,
              appVersion: event.appVersion,
              schemaVersion: event.schemaVersion,
              occurredAt: event.timestamp,
            },
          }),
    },
  };
}

export class UmamiAdapter implements TrackingAdapter {
  private readonly queue: EventQueue;
  private running = false;
  private pending = false;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private retryAfter = 0;
  private stopped = false;
  private readonly lockName: string;
  private readonly online = () => {
    this.retryAfter = 0;
    void this.flush();
  };
  private readonly visible = () => {
    if (!document.hidden) void this.flush();
  };

  constructor(
    private readonly websiteId: string,
    private readonly context: () => PageContext,
    queue?: EventQueue,
    private readonly send: typeof fetch = globalThis.fetch.bind(globalThis),
  ) {
    this.lockName = `number-trouble-umami-${websiteId}`;
    this.queue = queue ?? new IndexedEventQueue(this.lockName);
    window.addEventListener('online', this.online);
    document.addEventListener('visibilitychange', this.visible);
    void this.flush();
  }

  async track(event: TrackingEvent) {
    await this.queue.add(toUmamiRequest(event, this.websiteId, this.context()));
    void this.flush();
  }

  private schedule() {
    if (this.timer || this.stopped) return;
    this.timer = setTimeout(() => {
      this.timer = undefined;
      void this.flush();
    }, RETRY_MS);
  }

  async flush() {
    if (this.stopped) return;
    if (this.running) {
      this.pending = true;
      return;
    }
    if (!navigator.onLine || Date.now() < this.retryAfter) {
      this.schedule();
      return;
    }
    this.running = true;
    try {
      const drain = async () => {
        while (!this.stopped && navigator.onLine) {
          const entry = await this.queue.first();
          if (!entry) return;
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 10_000);
          try {
            const response = await this.send(UMAMI_ENDPOINT, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'omit',
              referrerPolicy: 'no-referrer',
              body: JSON.stringify(entry.request),
              signal: controller.signal,
            });
            if (!response.ok) throw new Error('Analytics delivery failed');
            await this.queue.remove(entry.id!);
          } finally {
            clearTimeout(timeout);
          }
        }
      };
      // All tabs sharing this origin and destination use a single sender.
      if (navigator.locks) {
        await navigator.locks.request(this.lockName, { ifAvailable: true }, async (lock) => {
          if (lock) await drain();
        });
      } else {
        await drain();
      }
    } catch {
      this.retryAfter = Date.now() + RETRY_MS;
    } finally {
      this.running = false;
      if (this.pending) {
        this.pending = false;
        void this.flush();
      }
      // Also picks up entries added by another tab or while the last read was pending.
      this.schedule();
    }
  }

  dispose() {
    this.stopped = true;
    clearTimeout(this.timer);
    window.removeEventListener('online', this.online);
    document.removeEventListener('visibilitychange', this.visible);
  }
}

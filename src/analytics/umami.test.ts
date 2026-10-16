import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTracker, type TrackingEvent } from '../tracking';
import { UmamiAdapter, toUmamiRequest, RETRY_MS, UMAMI_ENDPOINT } from './umami';
import { umamiEnabled, UMAMI_WEBSITE_ID } from './config';
import type { EventQueue, QueueEntry } from './queue';

const event: TrackingEvent = {
  name: 'game_ended',
  properties: {
    gameId: 'random-game',
    level: 1,
    tempo: 'turtle',
    reason: 'exit',
    score: 10,
    correct: 1,
    mistakes: 0,
    missed: 0,
    bestStreak: 1,
    activeFallingMs: 2000,
  },
  schemaVersion: 1,
  appVersion: '1.0.1',
  timestamp: '2026-10-16T12:00:00.000Z',
};
const context = () => ({ hostname: 'bukowskiadam.github.io', language: 'pl' });

class MemoryQueue implements EventQueue {
  entries: QueueEntry[] = [];
  nextId = 0;
  async add(request: QueueEntry['request']) {
    this.entries.push({ id: ++this.nextId, queuedAt: Date.now(), request });
  }
  async first() {
    return this.entries[0];
  }
  async remove(id: number) {
    this.entries = this.entries.filter((entry) => entry.id !== id);
  }
}

let online = true;
const instances: UmamiAdapter[] = [];
function adapter(
  send = vi.fn<typeof fetch>().mockResolvedValue(new Response('{}')),
  queue = new MemoryQueue(),
) {
  const result = new UmamiAdapter(UMAMI_WEBSITE_ID, context, queue, send);
  instances.push(result);
  return { adapter: result, send, queue };
}

beforeEach(() => {
  vi.useFakeTimers();
  online = true;
  vi.stubGlobal('window', new EventTarget());
  vi.stubGlobal('document', Object.assign(new EventTarget(), { hidden: false }));
  vi.stubGlobal('navigator', {
    get onLine() {
      return online;
    },
  });
});
afterEach(() => {
  instances.splice(0).forEach((item) => item.dispose());
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

async function settle() {
  await vi.advanceTimersByTimeAsync(0);
}

describe('Umami adapter', () => {
  it('adds a native tag, app property and original timestamp without profile identity or referrer', () => {
    const request = toUmamiRequest(event, UMAMI_WEBSITE_ID, context());
    expect(request.payload).toMatchObject({
      website: UMAMI_WEBSITE_ID,
      tag: 'number-trouble',
      hostname: 'bukowskiadam.github.io',
      url: '/number-trouble/',
      name: 'game_ended',
      timestamp: Date.parse(event.timestamp) / 1000,
      data: { app: 'number-trouble', score: 10, occurredAt: event.timestamp },
    });
    expect(request.payload).not.toHaveProperty('id');
    expect(request.payload).not.toHaveProperty('referrer');
  });

  it('maps screen views to one native pageview, including the app path and tag', () => {
    const request = toUmamiRequest(
      { ...event, name: 'screen_viewed', properties: { screen: 'profiles' } },
      UMAMI_WEBSITE_ID,
      context(),
    );
    expect(request.payload.url).toBe('/number-trouble/profiles');
    expect(request.payload.tag).toBe('number-trouble');
    expect(request.payload).not.toHaveProperty('name');
    expect(request.payload).not.toHaveProperty('data');
  });

  it('only enables configured production hosts, never localhost by default', () => {
    expect(umamiEnabled(UMAMI_WEBSITE_ID, true, context().hostname, context().hostname)).toBe(true);
    expect(umamiEnabled(UMAMI_WEBSITE_ID, false, context().hostname, context().hostname)).toBe(
      false,
    );
    expect(umamiEnabled(UMAMI_WEBSITE_ID, true, 'localhost', context().hostname)).toBe(false);
    expect(umamiEnabled('', true, context().hostname, context().hostname)).toBe(false);
    expect(umamiEnabled('invalid', true, context().hostname, context().hostname)).toBe(false);
  });

  it('queues while offline and sends on the online event', async () => {
    online = false;
    const { adapter: client, queue, send } = adapter();
    await client.track(event);
    await settle();
    expect(send).not.toHaveBeenCalled();
    expect(queue.entries).toHaveLength(1);
    online = true;
    window.dispatchEvent(new Event('online'));
    await settle();
    expect(send).toHaveBeenCalledWith(
      UMAMI_ENDPOINT,
      expect.objectContaining({
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        method: 'POST',
      }),
    );
    expect(queue.entries).toHaveLength(0);
  });

  it('keeps rejected requests and non-2xx responses, then retries without losing the original time', async () => {
    const send = vi
      .fn<typeof fetch>()
      .mockRejectedValueOnce(new Error('Offline'))
      .mockResolvedValueOnce(new Response('', { status: 429 }))
      .mockResolvedValue(new Response('{}'));
    const { adapter: client, queue } = adapter(send);
    await settle();
    await client.track(event);
    await settle();
    expect(queue.entries).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(RETRY_MS);
    expect(queue.entries).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(RETRY_MS);
    expect(queue.entries).toHaveLength(0);
    expect(send).toHaveBeenCalledTimes(3);
    expect(
      send.mock.calls.map((call) => JSON.parse(call[1]!.body as string).payload.timestamp),
    ).toEqual(Array(3).fill(Date.parse(event.timestamp) / 1000));
  });

  it('does not delete an in-flight entry before acknowledgement and serializes concurrent flushes', async () => {
    let finish!: (value: Response) => void;
    const send = vi
      .fn<typeof fetch>()
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      )
      .mockResolvedValue(new Response('{}'));
    const { adapter: client, queue } = adapter(send);
    await settle();
    await client.track(event);
    await settle();
    await client.track(event);
    await client.flush();
    expect(send).toHaveBeenCalledTimes(1);
    expect(queue.entries).toHaveLength(2);
    finish(new Response('{}'));
    await settle();
    expect(send).toHaveBeenCalledTimes(2);
    expect(queue.entries).toHaveLength(0);
  });

  it('retries a timed-out request and isolates queue failures from the app', async () => {
    const send = vi.fn<typeof fetch>().mockImplementation(
      (_url, options) =>
        new Promise((_resolve, reject) => {
          options!.signal!.addEventListener('abort', () => reject(new Error('Aborted')));
        }),
    );
    const { adapter: client, queue } = adapter(send);
    await settle();
    await client.track(event);
    await settle();
    await vi.advanceTimersByTimeAsync(10000);
    expect(queue.entries).toHaveLength(1);
    const failing = adapter(
      vi.fn(),
      Object.assign(new MemoryQueue(), {
        add: async () => {
          throw new Error('Storage unavailable');
        },
        first: async () => undefined,
        remove: async () => {},
      }),
    );
    expect(() => createTracker(failing.adapter).track('app_installed', {})).not.toThrow();
    await settle();
  });
});

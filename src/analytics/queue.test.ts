import { afterEach, expect, it, vi } from 'vitest';
import { IndexedEventQueue, QUEUE_LIMIT, QUEUE_TTL_MS } from './queue';
import type { UmamiRequest } from './umami';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

it('bounds and expires the fallback queue when durable storage is denied', async () => {
  vi.useFakeTimers();
  vi.stubGlobal('indexedDB', {
    open() {
      throw new Error('Denied');
    },
  });
  const queue = new IndexedEventQueue('test');
  const request: UmamiRequest = {
    type: 'event',
    payload: {
      website: 'test',
      hostname: 'test',
      language: 'pl',
      url: '/number-trouble/',
      title: 'test',
      tag: 'number-trouble',
      timestamp: 1,
    },
  };
  for (let i = 0; i < QUEUE_LIMIT + 2; i++)
    await queue.add({ ...request, payload: { ...request.payload, name: String(i) } });
  const first = (await queue.first())!;
  expect(first.request.payload.name).toBe('2');
  await queue.remove(first.id!);
  expect((await queue.first())!.request.payload.name).toBe('3');
  await vi.advanceTimersByTimeAsync(QUEUE_TTL_MS + 1);
  expect(await queue.first()).toBeUndefined();
});

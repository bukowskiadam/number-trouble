import { describe, expect, it, vi } from 'vitest';
import { createTracker, consoleTrackingAdapter, type TrackingEvent } from './tracking';
import { APP_VERSION } from './releases';

describe('tracking boundary', () => {
  it('delivers a copied, immutable event with versioned metadata', () => {
    const events: TrackingEvent[] = [];
    const tracker = createTracker({
      track: (event) => {
        events.push(event);
      },
    });
    const properties = { screen: 'play' as const };
    tracker.track('screen_viewed', properties);
    expect(events[0]).toEqual({
      name: 'screen_viewed',
      properties,
      schemaVersion: 1,
      appVersion: APP_VERSION,
      timestamp: expect.any(String),
    });
    expect(Number.isFinite(Date.parse(events[0].timestamp))).toBe(true);
    expect(events[0].properties).not.toBe(properties);
    expect(Object.isFrozen(events[0])).toBe(true);
    expect(Object.isFrozen(events[0].properties)).toBe(true);
  });

  it('uses console.log through the default adapter', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      createTracker(consoleTrackingAdapter).track('app_installed', {});
      expect(log).toHaveBeenCalledWith(
        '[tracking]',
        expect.objectContaining({ name: 'app_installed' }),
      );
    } finally {
      log.mockRestore();
    }
  });

  it('isolates thrown errors and rejected promises and keeps accepting events', async () => {
    const track = vi
      .fn()
      .mockImplementationOnce(() => {
        throw new Error('sync failure');
      })
      .mockRejectedValueOnce(new Error('async failure'))
      .mockResolvedValue(undefined);
    const tracker = createTracker({ track });
    expect(() => tracker.track('app_installed', {})).not.toThrow();
    tracker.track('app_installed', {});
    await new Promise((resolve) => setTimeout(resolve, 0));
    tracker.track('app_installed', {});
    expect(track).toHaveBeenCalledTimes(3);
  });
});

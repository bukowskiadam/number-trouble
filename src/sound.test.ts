import { it, expect, vi } from 'vitest';
it('generates local sounds, honors mute and tolerates blocked audio', async () => {
  const start = vi.fn();
  const resume = vi.fn().mockResolvedValue(undefined);
  const parameter = () => ({
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  });
  class MockAudio {
    state = 'running';
    currentTime = 0;
    destination = {};
    resume = resume;
    createOscillator() {
      return { frequency: { value: 0 }, connect: vi.fn(), start, stop: vi.fn() };
    }
    createGain() {
      return { gain: parameter(), connect: vi.fn() };
    }
  }
  vi.stubGlobal('AudioContext', MockAudio);
  const { unlockAudio, playSound } = await import('./sound');
  unlockAudio();
  expect(resume).toHaveBeenCalledOnce();
  playSound('correct', true);
  expect(start).not.toHaveBeenCalled();
  playSound('correct', false);
  expect(start).toHaveBeenCalledTimes(3);
  playSound('wrong', false);
  expect(start).toHaveBeenCalledTimes(5);
  playSound('missed', false);
  expect(start).toHaveBeenCalledTimes(7);
  playSound('over', false);
  expect(start).toHaveBeenCalledTimes(10);
  vi.resetModules();
  vi.stubGlobal(
    'AudioContext',
    class {
      constructor() {
        throw new Error('Unavailable');
      }
    },
  );
  const unavailable = await import('./sound');
  expect(() => {
    unavailable.unlockAudio();
    unavailable.playSound('correct', false);
  }).not.toThrow();
  vi.unstubAllGlobals();
});

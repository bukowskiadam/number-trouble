import type { GameEvent } from './game/engine';
let context: AudioContext | undefined;
export function unlockAudio() {
  try {
    context ??= new AudioContext();
    void context.resume().catch(() => {});
  } catch {
    /* Audio is optional. */
  }
}
export function playSound(event: GameEvent, muted: boolean) {
  if (muted || !context || context.state !== 'running') return;
  try {
    const notes =
      event === 'correct' ? [523, 659, 784] : event === 'over' ? [523, 440, 349] : [294, 247];
    notes.forEach((frequency, index) => {
      const oscillator = context!.createOscillator(),
        gain = context!.createGain();
      const start = context!.currentTime + index * 0.09;
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.07, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.17);
      oscillator.connect(gain);
      gain.connect(context!.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.18);
    });
  } catch {
    /* Playback failures never interrupt a game. */
  }
}

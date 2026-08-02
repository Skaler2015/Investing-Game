/**
 * Lightweight sound-effects service using the Web Audio API — no audio files,
 * everything is synthesised from oscillators, so it stays tiny and offline.
 * Sounds only play after a user gesture (browser policy), which is fine since
 * they fire on taps. Preference persists on the device.
 */
const STORAGE_KEY = 'invest-master:sound';

let ctx: AudioContext | null = null;
let enabled = readEnabled();

function readEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function isSoundEnabled(): boolean {
  return enabled;
}

export function setSoundEnabled(on: boolean) {
  enabled = on;
  try {
    localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off');
  } catch {
    /* ignore */
  }
  if (on) playSound('click');
}

function audioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  return ctx;
}

/** Play a single tone with a short attack/decay envelope. */
function tone(freq: number, start: number, dur: number, type: OscillatorType, peak: number) {
  const ac = audioCtx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t0 = ac.currentTime + start;
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(peak, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export type SoundName = 'click' | 'buy' | 'sell' | 'reward' | 'achievement' | 'error';

const SEQ: Record<SoundName, { f: number; d: number; type?: OscillatorType }[]> = {
  click: [{ f: 660, d: 0.05, type: 'triangle' }],
  buy: [{ f: 523, d: 0.09 }, { f: 784, d: 0.12 }],
  sell: [{ f: 659, d: 0.09 }, { f: 440, d: 0.12 }],
  reward: [{ f: 523, d: 0.09 }, { f: 659, d: 0.09 }, { f: 880, d: 0.16 }],
  achievement: [{ f: 523, d: 0.1 }, { f: 659, d: 0.1 }, { f: 784, d: 0.1 }, { f: 1047, d: 0.24 }],
  error: [{ f: 200, d: 0.16, type: 'sawtooth' }],
};

export function playSound(name: SoundName) {
  if (!enabled) return;
  const ac = audioCtx();
  if (!ac) return;
  if (ac.state === 'suspended') void ac.resume();
  const seq = SEQ[name];
  let t = 0;
  for (const note of seq) {
    tone(note.f, t, note.d, note.type ?? 'sine', 0.16);
    t += note.d * 0.7;
  }
}

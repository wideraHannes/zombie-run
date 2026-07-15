// Classic-style SFX via WebAudio oscillators. Self-contained, no assets.
// Guarded: never throws if AudioContext is unavailable (SSR, tests, old browsers).

let muted = false;
let ctxCache = null;
let ctxTried = false;

function getCtx() {
  if (ctxCache) return ctxCache;
  if (ctxTried) return null;
  ctxTried = true;
  try {
    if (typeof window === 'undefined' && typeof globalThis === 'undefined') return null;
    const root = typeof window !== 'undefined' ? window : globalThis;
    const Ctor = root.AudioContext || root.webkitAudioContext;
    if (!Ctor) return null;
    ctxCache = new Ctor();
    return ctxCache;
  } catch (_e) {
    return null;
  }
}

export function setMuted(v) { muted = !!v; }
export function isMuted() { return muted; }

function beep({ freq, freqEnd, type = 'square', duration = 0.12, peak = 0.15 }) {
  if (muted) return;
  const ctx = getCtx();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (typeof freqEnd === 'number') {
      osc.frequency.linearRampToValueAtTime(freqEnd, now + duration);
    }
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(peak, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(now + duration);
  } catch (_e) {
    // swallow — audio must never break the game
  }
}

export function playShot() {
  beep({ freq: 220, freqEnd: 110, type: 'square', duration: 0.08, peak: 0.18 });
}

export function playHit() {
  beep({ freq: 140, freqEnd: 60, type: 'sawtooth', duration: 0.12, peak: 0.16 });
}

export function playPickup() {
  beep({ freq: 660, freqEnd: 990, type: 'triangle', duration: 0.14, peak: 0.15 });
}

export function playReload() {
  beep({ freq: 440, freqEnd: 330, type: 'square', duration: 0.1, peak: 0.12 });
}

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

let oscs;
let gains;

function installFakeAudio() {
  oscs = [];
  gains = [];
  const ctx = {
    currentTime: 0,
    destination: {},
    createOscillator() {
      const osc = {
        frequency: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} },
        type: 'sine',
        connect() {},
        start() {},
        stop(t) { this._stopAt = t; },
      };
      oscs.push(osc);
      return osc;
    },
    createGain() {
      const gain = {
        gain: {
          value: 0,
          setValueAtTime() {},
          linearRampToValueAtTime() {},
          exponentialRampToValueAtTime() {},
        },
        connect() {},
      };
      gains.push(gain);
      return gain;
    },
  };
  const Ctor = function () { return ctx; };
  global.AudioContext = Ctor;
  global.webkitAudioContext = Ctor;
  if (typeof window !== 'undefined') {
    window.AudioContext = Ctor;
    window.webkitAudioContext = Ctor;
  }
  return ctx;
}

function uninstallFakeAudio() {
  delete global.AudioContext;
  delete global.webkitAudioContext;
  if (typeof window !== 'undefined') {
    delete window.AudioContext;
    delete window.webkitAudioContext;
  }
}

describe('sound module', () => {
  let sound;
  let ctx;

  beforeEach(async () => {
    ctx = installFakeAudio();
    // fresh module each test so muted state and ctx cache reset
    sound = await import(/* @vite-ignore */ `../sound.js?t=${Math.random()}`);
    sound.setMuted(false);
  });

  afterEach(() => {
    uninstallFakeAudio();
  });

  const fns = ['playShot', 'playHit', 'playPickup', 'playReload'];

  for (const name of fns) {
    it(`${name} creates oscillator + gain and schedules short stop`, () => {
      const oBefore = oscs.length;
      const gBefore = gains.length;
      sound[name]();
      expect(oscs.length).toBeGreaterThan(oBefore);
      expect(gains.length).toBeGreaterThan(gBefore);
      const lastOsc = oscs[oscs.length - 1];
      expect(lastOsc._stopAt - ctx.currentTime).toBeLessThanOrEqual(0.4);
    });
  }

  it('setMuted(true) short-circuits all play fns (zero new nodes)', () => {
    sound.setMuted(true);
    expect(sound.isMuted()).toBe(true);
    const oBefore = oscs.length;
    const gBefore = gains.length;
    sound.playShot();
    sound.playHit();
    sound.playPickup();
    sound.playReload();
    expect(oscs.length).toBe(oBefore);
    expect(gains.length).toBe(gBefore);
  });
});

describe('sound module without AudioContext', () => {
  it('import does not throw when AudioContext is undefined', async () => {
    uninstallFakeAudio();
    let err = null;
    try {
      const mod = await import(/* @vite-ignore */ `../sound.js?noaudio=${Math.random()}`);
      mod.setMuted(false);
      // calls should be no-ops, not throws
      mod.playShot();
      mod.playHit();
      mod.playPickup();
      mod.playReload();
    } catch (e) {
      err = e;
    }
    expect(err).toBeNull();
  });
});

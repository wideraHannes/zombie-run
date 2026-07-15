import { describe, expect, it, beforeEach } from 'vitest';
import {
  loadScores,
  saveScore,
  clearScores,
  STORAGE_KEY,
  MAX_ENTRIES,
} from '../scoreboard';

beforeEach(() => {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
});

describe('US-0016 local scoreboard', () => {
  it('returns [] when storage is empty', () => {
    expect(loadScores()).toEqual([]);
  });

  it('trims name and stores entry', () => {
    saveScore({ name: '  Ash  ', score: 500 });
    const s = loadScores();
    expect(s).toHaveLength(1);
    expect(s[0].name).toBe('Ash');
    expect(s[0].score).toBe(500);
    expect(typeof s[0].date).toBe('string');
  });

  it('keeps only top MAX_ENTRIES sorted descending by score', () => {
    for (let i = 0; i < 12; i += 1) saveScore({ name: `P${i}`, score: i * 10 });
    const s = loadScores();
    expect(s).toHaveLength(MAX_ENTRIES);
    for (let i = 1; i < s.length; i += 1) {
      expect(s[i - 1].score).toBeGreaterThanOrEqual(s[i].score);
    }
    // lowest scores dropped
    expect(s.every((e) => e.score >= 20)).toBe(true);
  });

  it('returns [] (does not throw) when stored value is corrupt', () => {
    localStorage.setItem(STORAGE_KEY, 'not-json');
    expect(loadScores()).toEqual([]);
  });

  it('empty/whitespace name falls back to Anonymous', () => {
    saveScore({ name: '   ', score: 100 });
    expect(loadScores()[0].name).toBe('Anonymous');
  });

  it('clamps name to 16 chars', () => {
    saveScore({ name: 'a'.repeat(30), score: 1 });
    expect(loadScores()[0].name.length).toBe(16);
  });

  it('clearScores removes all entries', () => {
    saveScore({ name: 'x', score: 1 });
    clearScores();
    expect(loadScores()).toEqual([]);
  });
});

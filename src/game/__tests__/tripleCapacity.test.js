import { describe, it, expect } from 'vitest';
import { WEAPONS } from '../constants';

const cap = (id) => WEAPONS.find((w) => w.id === id).capacity;

describe('US-0019 triple magazine capacity', () => {
  it('pistol capacity is 36', () => {
    expect(cap('pistol')).toBe(36);
  });
  it('shotgun capacity is 18', () => {
    expect(cap('shotgun')).toBe(18);
  });
  it('smg capacity is 90', () => {
    expect(cap('smg')).toBe(90);
  });
  it('rocket capacity is 9', () => {
    expect(cap('rocket')).toBe(9);
  });
});

import { describe, it, expect } from 'vitest';
import { drawHeldWeapon } from '../drawHeldWeapon';
import { WEAPONS } from '../constants';

function makeCtx() {
  const ctx = {
    _colors: [],
    _fillStyle: '',
    fillRect() {},
    save() {},
    restore() {},
    translate() {},
    rotate() {},
  };
  Object.defineProperty(ctx, 'fillStyle', {
    get() { return this._fillStyle; },
    set(v) { this._fillStyle = v; this._colors.push(v); },
  });
  return ctx;
}

describe('drawHeldWeapon', () => {
  const player = { x: 0, y: 0, radius: 14, angle: 0 };

  it('uses pistol color #faff00 for gun body', () => {
    const ctx = makeCtx();
    const pistol = WEAPONS.find(w => w.id === 'pistol');
    drawHeldWeapon(ctx, player, pistol);
    expect(ctx._colors).toContain('#faff00');
  });

  it('uses rocket color #ff2bd6 for gun body', () => {
    const ctx = makeCtx();
    const rocket = WEAPONS.find(w => w.id === 'rocket');
    drawHeldWeapon(ctx, player, rocket);
    expect(ctx._colors).toContain('#ff2bd6');
  });
});

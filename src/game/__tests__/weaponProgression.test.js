import { describe, expect, it } from 'vitest';
import { WEAPONS } from '../constants';
import {
  initWeaponProgression,
  xpForLevel,
  gainXp,
  effectiveDamage,
  effectiveStats,
  MAX_LEVEL,
  DAMAGE_GROWTH,
  creditKill,
} from '../weaponProgression';

const wpBase = (id) => WEAPONS.find((w) => w.id === id);

describe('US-0017 weapon leveling — base', () => {
  it('starts every weapon at level 1, xp 0', () => {
    const prog = initWeaponProgression();
    for (const w of WEAPONS) {
      expect(prog[w.id]).toEqual({ level: 1, xp: 0 });
    }
  });

  it('gainXp equal to xpForLevel(1) promotes SMG to level 2 with xp 0', () => {
    const prog = initWeaponProgression();
    gainXp(prog, 'smg', xpForLevel(1));
    expect(prog.smg.level).toBe(2);
    expect(prog.smg.xp).toBe(0);
  });

  it('effectiveDamage at level 3 = base * DAMAGE_GROWTH^2', () => {
    const smg = wpBase('smg');
    const expected = smg.damage * DAMAGE_GROWTH ** 2;
    expect(effectiveDamage(smg, 3)).toBeCloseTo(expected, 6);
  });

  it('level is capped at MAX_LEVEL; excess xp does not overflow past cap', () => {
    const prog = initWeaponProgression();
    // pour in more XP than the full curve requires
    let total = 0;
    for (let lvl = 1; lvl < MAX_LEVEL; lvl += 1) total += xpForLevel(lvl);
    gainXp(prog, 'pistol', total + 9999);
    expect(prog.pistol.level).toBe(MAX_LEVEL);
    // at cap, xp does not accumulate further
    expect(prog.pistol.xp).toBe(0);
  });

  it('creditKill awards XP only to the firing weapon', () => {
    const prog = initWeaponProgression();
    creditKill(prog, 'shotgun', 5);
    expect(prog.shotgun.xp).toBe(5);
    expect(prog.pistol.xp).toBe(0);
    expect(prog.smg.xp).toBe(0);
    expect(prog.rocket.xp).toBe(0);
  });
});

describe('US-0018 per-weapon level bonuses — differentiation', () => {
  it('shotgun L3: +2 pellets, spread *= 0.9^2', () => {
    const sg = wpBase('shotgun');
    const st = effectiveStats(sg, 3);
    expect(st.pellets).toBe(sg.pellets + 2);
    expect(st.spread).toBeCloseTo(sg.spread * 0.9 ** 2, 6);
  });

  it('smg L4: fireRate *= 0.9^3', () => {
    const smg = wpBase('smg');
    const st = effectiveStats(smg, 4);
    expect(st.fireRate).toBeCloseTo(smg.fireRate * 0.9 ** 3, 6);
  });

  it('rocket L5: explosionRadius +60, capacity +2 (levels 3 & 5)', () => {
    const rl = wpBase('rocket');
    const st = effectiveStats(rl, 5);
    expect(st.explosionRadius).toBe(rl.explosionRadius + 60);
    expect(st.capacity).toBe(rl.capacity + 2);
  });

  it('pistol L4: pierce = 2 (1 per 2 levels above 1)', () => {
    const pl = wpBase('pistol');
    const st = effectiveStats(pl, 4);
    expect(st.pierce).toBe(2);
  });

  it('effectiveStats includes damage scaling from US-0017', () => {
    const smg = wpBase('smg');
    const st = effectiveStats(smg, 3);
    expect(st.damage).toBeCloseTo(smg.damage * DAMAGE_GROWTH ** 2, 6);
  });
});

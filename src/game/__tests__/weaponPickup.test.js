import { describe, expect, it } from 'vitest';
import { WEAPONS } from '../constants';
import {
  maybeSpawnWeaponPickup,
  pickUpWeapon,
  checkPickupContact,
} from '../weaponPickup';

function makeState({ weaponId = 'pistol', ammo } = {}) {
  const idx = WEAPONS.findIndex((w) => w.id === weaponId);
  const cap = WEAPONS[idx].capacity;
  return {
    weaponPickups: [],
    player: {
      x: 100, y: 100, radius: 16,
      inventory: [weaponId],
      weaponIndex: idx,
      ammo: ammo ?? cap,
      reloadEnd: 0,
    },
  };
}

describe('US-0010 start with single weapon', () => {
  it('fresh player inventory contains exactly the starter weapon', () => {
    const s = makeState();
    expect(s.player.inventory).toEqual(['pistol']);
    expect(s.player.inventory.length).toBe(1);
  });
});

describe('US-0008 weapon pickup spawns at 1/3 mag', () => {
  it('spawns exactly one pickup when ammo crosses to floor(capacity/3)', () => {
    const pistolCap = WEAPONS.find((w) => w.id === 'pistol').capacity;
    const threshold = Math.floor(pistolCap / 3);
    const s = makeState({ ammo: threshold + 1 });
    // Above threshold — no spawn
    expect(maybeSpawnWeaponPickup(s)).toBeNull();
    expect(s.weaponPickups.length).toBe(0);

    // Cross threshold
    s.player.ammo = threshold;
    const pu = maybeSpawnWeaponPickup(s);
    expect(pu).not.toBeNull();
    expect(s.weaponPickups.length).toBe(1);
    expect(pu.weaponId).not.toBe('pistol');
  });

  it('does not spawn a second pickup while one is uncollected', () => {
    const pistolCap = WEAPONS.find((w) => w.id === 'pistol').capacity;
    const threshold = Math.floor(pistolCap / 3);
    const s = makeState({ ammo: threshold });
    maybeSpawnWeaponPickup(s);
    expect(s.weaponPickups.length).toBe(1);

    // continue firing below threshold — no new spawn
    s.player.ammo = threshold - 1;
    maybeSpawnWeaponPickup(s);
    s.player.ammo = threshold - 2;
    maybeSpawnWeaponPickup(s);
    expect(s.weaponPickups.length).toBe(1);
  });

  it('allows a fresh spawn after the previous pickup is collected and threshold re-crosses', () => {
    const pistolCap = WEAPONS.find((w) => w.id === 'pistol').capacity;
    const threshold = Math.floor(pistolCap / 3);
    const s = makeState({ ammo: threshold });
    maybeSpawnWeaponPickup(s);
    // player collects it (removes from field + adds to inventory)
    const pickedId = s.weaponPickups[0].weaponId;
    s.weaponPickups.length = 0;
    pickUpWeapon(s, pickedId);

    // simulate reload — ammo back above threshold
    s.player.ammo = WEAPONS[s.player.weaponIndex].capacity;
    maybeSpawnWeaponPickup(s);
    expect(s.weaponPickups.length).toBe(0);

    // fire back down to threshold
    s.player.ammo = threshold;
    maybeSpawnWeaponPickup(s);
    expect(s.weaponPickups.length).toBe(1);
  });
});

describe('US-0009 pickup on contact', () => {
  it('overlapping player collects pickup, inventory grows by one', () => {
    const s = makeState();
    s.weaponPickups.push({
      x: s.player.x, y: s.player.y, radius: 16,
      weaponId: 'shotgun', spawn: 0,
    });
    checkPickupContact(s);
    expect(s.weaponPickups.length).toBe(0);
    expect(s.player.inventory).toContain('shotgun');
    expect(s.player.inventory.length).toBe(2);
  });

  it('duplicate pickup refills ammo of held weapon instead of adding to inventory', () => {
    const s = makeState({ ammo: 2 });
    const cap = WEAPONS[s.player.weaponIndex].capacity;
    s.weaponPickups.push({
      x: s.player.x, y: s.player.y, radius: 16,
      weaponId: 'pistol', spawn: 0,
    });
    checkPickupContact(s);
    expect(s.player.inventory).toEqual(['pistol']);
    expect(s.player.ammo).toBe(cap);
  });

  it('does not collect a pickup that does not overlap the player', () => {
    const s = makeState();
    s.weaponPickups.push({
      x: 800, y: 500, radius: 16,
      weaponId: 'smg', spawn: 0,
    });
    checkPickupContact(s);
    expect(s.weaponPickups.length).toBe(1);
    expect(s.player.inventory).toEqual(['pistol']);
  });
});

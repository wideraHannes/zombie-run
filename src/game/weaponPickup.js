import { WEAPONS, WORLD } from './constants';

export function maybeSpawnWeaponPickup(state, rng = Math.random) {
  const p = state.player;
  const w = WEAPONS[p.weaponIndex];
  const threshold = Math.floor(w.capacity / 3);
  const belowNow = p.ammo <= threshold;
  const belowPrev = p._prevAmmoBelowThreshold === true;
  p._prevAmmoBelowThreshold = belowNow;
  if (!belowNow || belowPrev) return null;
  if (state.weaponPickups.length > 0) return null;

  const candidates = WEAPONS.filter((cand) => cand.id !== w.id);
  const pick = candidates[Math.floor(rng() * candidates.length)] || w;
  const margin = 40;
  const pickup = {
    x: margin + rng() * (WORLD.width - margin * 2),
    y: margin + rng() * (WORLD.height - margin * 2),
    radius: 16,
    weaponId: pick.id,
    spawn: 0,
  };
  state.weaponPickups.push(pickup);
  return pickup;
}

export function pickUpWeapon(state, weaponId) {
  const p = state.player;
  const idx = WEAPONS.findIndex((w) => w.id === weaponId);
  if (idx < 0) return;
  if (p.inventory.includes(weaponId)) {
    if (p.weaponIndex === idx) {
      p.ammo = WEAPONS[idx].capacity;
      p.reloadEnd = 0;
      p._prevAmmoBelowThreshold = false;
    }
    return;
  }
  p.inventory.push(weaponId);
}

export function checkPickupContact(state) {
  const p = state.player;
  const arr = state.weaponPickups;
  for (let i = arr.length - 1; i >= 0; i--) {
    const pu = arr[i];
    const dx = pu.x - p.x;
    const dy = pu.y - p.y;
    const r = pu.radius + p.radius;
    if (dx * dx + dy * dy < r * r) {
      pickUpWeapon(state, pu.weaponId);
      arr.splice(i, 1);
    }
  }
}

import { WEAPONS, WEAPON_PROGRESSION } from './constants';

export const MAX_LEVEL = WEAPON_PROGRESSION.maxLevel;
export const DAMAGE_GROWTH = WEAPON_PROGRESSION.damageGrowth;

export function xpForLevel(level) {
  const idx = level - 1;
  const curve = WEAPON_PROGRESSION.xpPerLevel;
  if (idx < 0) return curve[0];
  if (idx >= curve.length) return curve[curve.length - 1];
  return curve[idx];
}

export function initWeaponProgression() {
  const out = {};
  for (const w of WEAPONS) out[w.id] = { level: 1, xp: 0 };
  return out;
}

export function gainXp(prog, weaponId, amount) {
  const p = prog[weaponId];
  if (!p) return;
  if (p.level >= MAX_LEVEL) {
    p.xp = 0;
    return;
  }
  p.xp += amount;
  while (p.level < MAX_LEVEL && p.xp >= xpForLevel(p.level)) {
    p.xp -= xpForLevel(p.level);
    p.level += 1;
  }
  if (p.level >= MAX_LEVEL) p.xp = 0;
}

export function creditKill(prog, weaponId, xp) {
  gainXp(prog, weaponId, xp);
}

export function effectiveDamage(weapon, level) {
  return weapon.damage * DAMAGE_GROWTH ** (level - 1);
}

export function effectiveStats(weapon, level) {
  const pl = weapon.perLevel || {};
  const levelsAbove1 = Math.max(0, level - 1);
  const out = {
    damage: effectiveDamage(weapon, level),
    fireRate: weapon.fireRate,
    spread: weapon.spread,
    pellets: weapon.pellets,
    capacity: weapon.capacity,
    speed: weapon.speed,
    radius: weapon.radius,
    reloadTime: weapon.reloadTime,
    explosionRadius: weapon.explosionRadius ?? 0,
    pierce: 0,
  };

  if (pl.pelletsPerLevel) out.pellets += pl.pelletsPerLevel * levelsAbove1;
  if (pl.spreadMul) out.spread *= pl.spreadMul ** levelsAbove1;
  if (pl.fireRateMul) out.fireRate *= pl.fireRateMul ** levelsAbove1;
  if (pl.explosionRadiusPerLevel) {
    out.explosionRadius += pl.explosionRadiusPerLevel * levelsAbove1;
  }
  if (Array.isArray(pl.capacityBumpLevels)) {
    for (const bump of pl.capacityBumpLevels) if (level >= bump) out.capacity += 1;
  }
  if (pl.pierceEvery) out.pierce = Math.floor(level / pl.pierceEvery);

  return out;
}

export function xpForKillByVariant(variant) {
  const table = WEAPON_PROGRESSION.xpPerKill;
  return table[variant] ?? table.normal;
}

export function levelProgress(prog, weaponId) {
  const p = prog[weaponId];
  if (!p) return { level: 1, xp: 0, needed: xpForLevel(1), pct: 0 };
  if (p.level >= MAX_LEVEL) return { level: p.level, xp: 0, needed: 0, pct: 1 };
  const needed = xpForLevel(p.level);
  return { level: p.level, xp: p.xp, needed, pct: p.xp / needed };
}

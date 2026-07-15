---
id: US-0018
title: Per-weapon specific level bonuses (differentiate feel)
status: done
created: 2026-07-15
---

## Story
As a player, I want each weapon to grow along a **different** axis when it levels, so that Pistol, Shotgun, SMG, and Rocket feel tactically distinct at higher levels — encouraging me to pick the right tool rather than empty a mag into the wrong situation.

## Acceptance criteria
- [ ] Each `WEAPONS` entry declares a `perLevel` object of stat deltas/multipliers unique to that weapon (see suggested design below).
- [ ] Firing logic reads `effectiveStats(weapon, level)` — a pure function combining base stats + `damageGrowth^(level-1)` (from US-0017) + `perLevel` deltas.
- [ ] Behavior visibly differs: e.g. Shotgun gets more pellets/tighter spread per level, SMG gets faster fire-rate, Pistol gets pierce, Rocket gets bigger explosion radius.
- [ ] HUD tooltip (or a menu screen) shows the current weapon's next-level bonus text.
- [ ] Values are data-driven — no per-weapon `switch` statements in the fire path.

## Suggested `perLevel` design (adjust in story review)
- **Pistol** — `+1 pierce per 2 levels` (bullet passes through N zombies)
- **Shotgun** — `+1 pellet per level`, `spread *= 0.9 per level` (tighter cone)
- **SMG** — `fireRate *= 0.9 per level` (faster), `spread *= 0.92 per level`
- **Rocket** — `explosionRadius += 15 per level`, `capacity + 1 at level 3 & 5`

## Test (the precise test)
Vitest, in `weaponProgression.test.js` (extend US-0017 tests):
1. `effectiveStats(shotgun, level: 3)` returns `pellets: base.pellets + 2` and `spread: base.spread * 0.9^2` (allow floating epsilon).
2. `effectiveStats(smg, level: 4)` returns `fireRate: base.fireRate * 0.9^3` (float epsilon).
3. `effectiveStats(rocket, level: 5)` returns `explosionRadius: base + 60` and `capacity: base + 2` (level 3 and 5 bumps).
4. `effectiveStats(pistol, level: 4)` returns `pierce: 2` (base 0 + 1 per 2 levels).

## Notes
- Depends on [[US-0017-weapon-leveling-base]] landing first (needs `level` on weapon state and `effectiveDamage` merged into `effectiveStats`).
- Piercing is new behavior — bullet needs a `pierce` counter decremented on hit; keep bullet alive until pierce hits 0.
- Files likely touched: `src/game/constants.js` (add `perLevel` per weapon), `src/game/weaponProgression.js` (extend to `effectiveStats`), `src/game/useGameEngine.js` (bullet pierce + fire-path reads).

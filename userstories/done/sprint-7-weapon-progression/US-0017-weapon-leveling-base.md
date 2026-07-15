---
id: US-0017
title: Per-weapon XP and leveling with base damage scaling
status: done
created: 2026-07-15
---

## Story
As a player, I want each weapon to accumulate XP from kills and level up, so that using a weapon makes it stronger and creates a reason to invest instead of dumping magazines mindlessly.

## Acceptance criteria
- [ ] Each `WEAPONS` entry tracks per-run `xp` and `level` (starts `level: 1`, `xp: 0`).
- [ ] Kills credit XP to the weapon that dealt the killing blow (rocket splash counts for the rocket).
- [ ] XP threshold curve is data-driven (e.g. `xpForLevel(level)` in constants); levels cap at 5.
- [ ] Each level multiplies **base damage** by a configured `damageGrowth` factor (default 1.15) applied at fire time — the constant `WEAPONS[i].damage` stays the immutable base.
- [ ] HUD shows current weapon's level (e.g. "SMG L3") and an XP bar toward next level.
- [ ] On new run, all weapon xp/levels reset.

## Test (the precise test)
Vitest, in a new `weaponProgression.test.js`:
1. `gainXp(state, 'smg', xpForLevel(1))` → SMG becomes `level: 2, xp: 0` (or overflow correctly carried).
2. `effectiveDamage(weapon)` at `level: 3` with `damage: 8, damageGrowth: 1.15` equals `8 * 1.15^2` (levels above 1 apply growth).
3. Leveling stops at cap 5 — extra XP past L5 threshold does not raise level and either caps xp or discards it (assert the chosen behavior).
4. Kill credit: simulating a bullet kill on a zombie awards XP to the firing weapon only (no XP to inactive weapons).

## Notes
- Extend `stateRef` with a per-run weapon-progression map. Do not mutate the exported `WEAPONS` constants.
- Bullets must remember which weapon id fired them so kill credit works (already needed for damage; verify).
- Follow-up: [[US-0018-weapon-specific-level-bonuses]] applies per-weapon-specific perks on top of this base scaling.
- Files likely touched: `src/game/constants.js` (xp curve, damageGrowth), `src/game/useGameEngine.js`, HUD component, new module `src/game/weaponProgression.js`.

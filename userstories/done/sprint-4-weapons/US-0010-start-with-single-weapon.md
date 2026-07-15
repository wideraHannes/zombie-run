---
id: US-0010
title: Start run with a single weapon
status: done
created: 2026-07-15
---

## Story
As a player, I want to begin each run holding exactly one weapon, so that subsequent weapon drops feel meaningful.

## Acceptance criteria
- [ ] On new game / restart, player inventory contains exactly one weapon (the starter).
- [ ] `WeaponBar` HUD shows only that one weapon slot occupied.
- [ ] No weapon-switch input has any effect until a second weapon is picked up.

## Test (the precise test)
Start a new game. Assert: `WeaponBar` shows 1 filled slot, cycling weapon key does nothing, current weapon is the configured starter (e.g., pistol).

## Notes
- Prereq for US-0008 / US-0009.
- May require trimming any dev/default multi-weapon loadout in `useGameEngine.js`.

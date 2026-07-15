---
id: US-0019
title: Triple magazine capacity for every weapon
status: todo
created: 2026-07-15
---

## Story
As a player, I want every weapon to hold three times as much ammo as before, so that I can sustain fire longer between reloads.

## Acceptance criteria
- [ ] Pistol capacity is 36 (was 12).
- [ ] Shotgun capacity is 18 (was 6).
- [ ] SMG capacity is 90 (was 30).
- [ ] Rocket Launcher capacity is 9 (was 3).
- [ ] No other weapon fields change.

## Test (the precise test)
Import `WEAPONS` from `src/game/constants.js` and assert `capacity` per id: `pistol=36`, `shotgun=18`, `smg=90`, `rocket=9`.

## Notes
Touches only `src/game/constants.js`. Rocket's `perLevel.capacityBumpLevels` stays as-is (bumps on top of the new base).

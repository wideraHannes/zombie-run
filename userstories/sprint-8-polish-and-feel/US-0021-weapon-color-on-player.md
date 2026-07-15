---
id: US-0021
title: Player-held weapon renders in the equipped weapon's color
status: todo
created: 2026-07-15
---

## Story
As a player, I want the gun sprite my character is holding to change color based on the equipped weapon, so that I can tell at a glance which weapon is active.

## Acceptance criteria
- [ ] Each weapon in `WEAPONS` has a distinct `color` used when drawing the held weapon on the player (pistol/shotgun/smg/rocket already have unique colors — reuse them).
- [ ] Switching weapons (Digit1–4 or picking up a drop) immediately changes the drawn weapon color on the next frame.
- [ ] Bullet color logic is unaffected (bullets keep whatever color they use today).

## Test (the precise test)
Unit test in `src/game/__tests__/`: instantiate a fake 2D canvas context that records `fillStyle`/`strokeStyle` assignments, call the draw helper responsible for the player's held weapon (extracted or exposed for test) with `equipped = 'pistol'` then `'rocket'`, and assert the color used matches `WEAPONS.find(w => w.id === equipped).color` in each case.

## Notes
Likely touches `src/game/useGameEngine.js` (draw path for the player's weapon). If the weapon-draw code isn't isolated, extract a tiny pure helper `drawHeldWeapon(ctx, player, weapon)` so it can be tested without the full engine.

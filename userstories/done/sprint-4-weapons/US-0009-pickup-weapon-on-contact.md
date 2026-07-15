---
id: US-0009
title: Player picks up dropped weapon on contact
status: done
created: 2026-07-15
---

## Story
As a player, I want to grab a dropped weapon by walking over it, so that swapping weapons is fluid.

## Acceptance criteria
- [ ] When the player's hitbox overlaps a weapon pickup, the weapon is added to inventory and the pickup is removed from the map.
- [ ] If inventory already contains that weapon type, ammo is refilled to full instead of adding a duplicate.
- [ ] After pickup, `WeaponBar` HUD reflects the new slot immediately.
- [ ] Picking up a weapon while a new one is on the field allows US-0008 to spawn again on the next 1/3 trigger.

## Test (the precise test)
With a pickup on the field (spawned via US-0008), walk over it. Assert: pickup entity is removed within one frame of overlap, `WeaponBar` shows the second slot filled (or ammo refilled if duplicate), next 1/3-threshold event successfully spawns a fresh pickup.

## Notes
- Depends on US-0008.
- Simple AABB or circle overlap check; reuse the collision helper already in `useGameEngine.js` if present.

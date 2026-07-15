---
id: US-0008
title: Spawn weapon pickup when magazine hits 1/3
status: done
created: 2026-07-15
---

## Story
As a player, I want a fresh weapon to appear on the map when my current mag drops to 1/3, so that I always have a fallback before running dry.

## Acceptance criteria
- [ ] When the currently held weapon's magazine transitions from >1/3 to ≤1/3 (capacity-based, floor), one weapon pickup spawns at a random reachable spot on the map.
- [ ] Only one such pickup exists on the map at a time; re-crossing the 1/3 threshold while a pickup is already on the field does nothing.
- [ ] The spawned weapon is a different type than the currently held one (if possible), chosen from the weapon pool.
- [ ] Pickup is visually rendered and remains until collected.

## Test (the precise test)
Fire until ammo reaches exactly floor(capacity/3). Assert: exactly one weapon pickup entity appears at a valid map position, its weapon type differs from held weapon. Continue firing and reloading; no additional pickup spawns while one is uncollected.

## Notes
- Depends on US-0010.
- Consider using the pool from US-0002 for pickup entities too.

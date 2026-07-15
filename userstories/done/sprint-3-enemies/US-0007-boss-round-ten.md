---
id: US-0007
title: Boss enemy on round 10
status: done
created: 2026-07-15
---

## Story
As a player, I want a boss fight on wave 10, so that reaching round 10 feels like a milestone.

## Acceptance criteria
- [ ] Wave 10 spawns exactly 1 boss enemy alongside the normal wave-10 count.
- [ ] Boss HP = 3× strong enemy HP = 9× normal enemy HP.
- [ ] Boss is visually distinct (larger, different color) from normal and strong enemies.
- [ ] Wave 10 does not end until the boss and all normals are dead.
- [ ] Killing the boss awards a dedicated score bonus (configurable, default 9× normal).

## Test (the precise test)
Advance to wave 10. Assert: exactly 1 boss present, boss requires 9× the shots of a normal enemy to kill, wave 10 does not transition to `betweenWaves` while boss is alive, banner for wave 11 appears only after boss death.

## Notes
- Depends on US-0004 and US-0006 (variant infrastructure).
- Wave 11+ resumes the every-3rd-round strong-enemy rule (wave 12 gets a strong).

---
id: US-0006
title: Strong enemy variant spawns every 3rd round
status: done
created: 2026-07-15
---

## Story
As a player, I want stronger enemies to appear periodically, so that later waves feel meaningfully harder than just "more zombies".

## Acceptance criteria
- [ ] A `strong` enemy type exists with 3× the HP of a normal enemy (config in `constants.js`).
- [ ] Every 3rd wave (waves 3, 6, 9, 12…) spawns exactly 1 strong enemy in addition to the normal count.
- [ ] Strong enemy is visually distinguishable (color/size).
- [ ] Killing a strong enemy awards proportionally more score (e.g., 3× normal).

## Test (the precise test)
Advance to wave 3. Assert: enemies alive at wave start = `baseEnemies*4 + 1` (12 normal + 1 strong at defaults). Strong enemy requires 3× the shots of a normal to kill. Wave 4 spawns zero strong enemies.

## Notes
- Depends on US-0004.
- Boss on wave 10 is US-0007; the "every 3rd" rule still fires on wave 9 and wave 12, but wave 10 is handled by the boss story.

---
id: US-0004
title: Round/wave state machine with doubling enemy count
status: done
created: 2026-07-15
---

## Story
As a player, I want the game to progress in rounds where each round spawns twice as many enemies as the previous, so that difficulty ramps predictably.

## Acceptance criteria
- [ ] Game tracks `currentWave` (starts at 1) and `enemiesRemainingInWave`.
- [ ] Wave N spawns `baseEnemies * 2^(N-1)` enemies (base configurable in `constants.js`, default 4 → wave 1: 4, wave 2: 8, wave 3: 16…).
- [ ] Wave ends when all spawned enemies for that wave are dead.
- [ ] After wave ends, engine transitions to a `betweenWaves` state (visual/pause behavior handled in US-0005).
- [ ] No new enemies spawn during `betweenWaves`.

## Test (the precise test)
Start a new game. Kill all wave-1 enemies. Assert: exactly `base` enemies spawned in wave 1, HUD reads "Wave 1" during wave, engine state flips to `betweenWaves` on last kill, and once wave 2 begins exactly `base*2` enemies spawn.

## Notes
- Prereq for US-0005, US-0006, US-0007.
- Cap total simultaneous alive enemies at pool size (US-0002); overflow enemies queue and spawn as slots free.

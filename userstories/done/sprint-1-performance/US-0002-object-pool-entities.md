---
id: US-0002
title: Object-pool enemies, bullets, and particles
status: todo
created: 2026-07-15
---

## Story
As a player on a low-end laptop, I want steady framerate during heavy combat, so that the game doesn't stutter from garbage collection pauses.

## Acceptance criteria
- [ ] Enemies, bullets, and particles are drawn from fixed-size pools; no `new`/object-literal allocation on spawn during steady-state play.
- [ ] Pool sizes are configurable in `constants.js` (defaults: 256 enemies, 512 bullets, 1024 particles).
- [ ] Freed entities are marked inactive and reused instead of being GC'd.
- [ ] Heap snapshot after 2 minutes of continuous play shows no monotonic growth of entity objects.

## Test (the precise test)
Open Chrome DevTools > Performance > record 60s of active play with wave 5+ combat. Assertion: (a) no "Minor GC" bars longer than 4ms, (b) average frame time <= 8ms, (c) taking heap snapshots at t=30s and t=90s shows entity-object count delta within ±5% (proving reuse).

## Notes
- Touches `src/game/useGameEngine.js`, `src/game/constants.js`.
- Keep the game state outside React refs where possible; React re-render should only be driven by HUD-relevant scalar values (score, hp, ammo, wave).

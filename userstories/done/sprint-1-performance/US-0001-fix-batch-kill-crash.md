---
id: US-0001
title: Fix crash when multiple enemies die in same frame
status: todo
created: 2026-07-15
---

## Story
As a player, I want the game to keep running when several enemies die simultaneously, so that a lucky multi-kill doesn't freeze or crash the tab.

## Acceptance criteria
- [ ] Killing >=5 enemies in the same tick does not stall, freeze, or throw.
- [ ] Enemy/bullet arrays remain internally consistent (no stale refs, no double-removal).
- [ ] Iteration over enemies during damage resolution does not mutate the array being iterated (or does so safely via index-safe pattern / deferred removal queue).

## Test (the precise test)
Reproduce: spawn 10 enemies clustered at one point, fire a shot that damages all of them to 0 HP in the same frame (or force it via a debug helper). Expected: all 10 removed, score increments by 10, no console errors, next frame renders normally. Measured over 60 subsequent frames the loop must not exceed 20ms/frame.

## Notes
- Likely root cause in `src/game/useGameEngine.js`: mutating enemies array mid-iteration or overlapping React state updates.
- Fix pattern: mark dead → sweep once after the update pass; or use a single `filter` at frame end.
- Do not introduce pooling here — that is US-0002.

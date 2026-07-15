---
id: US-0003
title: Reduce per-frame allocations in game loop
status: todo
created: 2026-07-15
---

## Story

As a player, I want the game loop to avoid needless allocations, so that memory usage stays flat and rendering stays smooth.

## Acceptance criteria

- [ ] Hot-path loop (movement, collision, render prep) creates zero new arrays/objects per frame.
- [ ] Vector math uses scratch/reusable variables, not `{x,y}` literals.
- [ ] React state updates in the loop are throttled to HUD-relevant scalars (no per-frame `setState` with new arrays of entities).
- [ ] Rendering uses a single `requestAnimationFrame` driver; no `setInterval` for game logic.

## Test (the precise test)

Chrome DevTools > Memory > Allocation instrumentation on timeline for 30s of active combat. Assertion: total allocated bytes during steady-state play < 5 MB (excluding initial pool warm-up), and no single frame allocates > 50 KB.

## Notes

- Depends on US-0002 (pooling) being in place.
- Consider moving entity state to a plain module-level ref rather than React state.
  q

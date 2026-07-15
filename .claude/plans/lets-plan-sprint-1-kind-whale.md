# Sprint 1 — Performance & Stability

## Context
Sprint 1 (`userstories/sprint-1-performance/`) has three stories that all mutate the same 630-line hot loop in `src/game/useGameEngine.js`:

- **US-0001** — batch-kill crash (mutating `s.zombies`/`s.bullets` during nested iteration via `splice`)
- **US-0002** — pool zombies (256), bullets (512), particles (1024); no per-spawn allocation
- **US-0003** — zero per-frame allocations in hot path; scratch vectors instead of `{x,y}` literals

Sprints 2–4 build on this pooling/loop rewrite, so it has to land first (per `userstories/BACKLOG.md`). The stories are dependency-ordered (US-0002 needs the deferred-removal pattern from US-0001; US-0003 needs the pools from US-0002), so naive parallel work on the single engine file would collide. Speedup comes from splitting the engine into per-entity modules **first**, then converting each pool in parallel worktrees.

Definition of done (from BACKLOG.md): 2-min play session in wave-5+ combat holds ≤8 ms avg frame time, flat heap, zero freezes on cluster-kills.

## Approach

Four phases. Phase 2 fans out to 3 parallel agents; the rest are sequential.

### Phase 1 — Foundation (sequential, one agent)
Prepare the ground so pool work is isolated per entity.

Files to create / modify:
- `package.json` — add `vitest`, `@vitest/ui`, `jsdom`; add `"test": "vitest"` script.
- `vitest.config.js` — jsdom env.
- `src/game/pools.js` *(new)* — generic `createPool(factory, size)` returning `{ items, acquire(), release(idx), forEachActive(cb) }`. Uses `active: boolean` flag + a free-list index stack. No `splice`, no allocation on `acquire`/`release`.
- `src/game/entities/zombies.js` *(new)* — export `updateZombies(state, dt, now)` + `spawnZombie(state)` + `drawZombies(ctx, state, now)`. Extracted verbatim from `useGameEngine.js` initially (array-based), then Phase 2 swaps to pools.
- `src/game/entities/bullets.js`, `src/game/entities/particles.js`, `src/game/entities/explosions.js` *(new)* — same pattern (extract-only in Phase 1).
- `src/game/entities/collision.js` *(new)* — houses the bullet↔zombie loop (the code at `useGameEngine.js:236-271`) and the splash-damage loop (`:244-255`). This is the file where US-0001's fix lands.
- `src/game/useGameEngine.js` — becomes a thin composer: input, RAF loop, `update()` calls into the entity modules, `draw()` delegates likewise. HUD sync stays.
- `src/game/constants.js` — add `POOLS = { zombies: 256, bullets: 512, particles: 1024 }`.
- `src/game/__tests__/collision.test.js` *(new, TDD for US-0001)* — construct a minimal state with 10 zombies clustered at one point and a rocket bullet that damages all of them to 0 HP; assert (a) no throw, (b) `kills === 10`, (c) zombie array/pool consistent (no `undefined` slots, no duplicates), (d) score delta matches. Test must fail against extracted-but-unfixed code and pass after Phase 2.

Deliverable of Phase 1: identical runtime behavior (verified with `npm run dev`), the failing US-0001 vitest, and clean module seams so Phase 2 agents don't touch each other.

### Phase 2 — Pool the three entity types (3 parallel agents, 3 worktrees)
Each agent works in an isolated `EnterWorktree`. Each converts **one** entity type from array-based to pool-based using `pools.js`, plus applies the deferred-removal / active-flag pattern that fixes US-0001 for its slice.

- **Agent Z** — `entities/zombies.js` + zombie half of `entities/collision.js` (mark-dead, sweep after pass). Wires `POOLS.zombies` into `useGameEngine`'s state init.
- **Agent B** — `entities/bullets.js` + bullet half of collision. Deferred bullet removal via active flag.
- **Agent P** — `entities/particles.js` + `entities/explosions.js`. Particles pool of 1024; explosions stay small array (bounded, short-lived) unless trivially poolable.

Each agent must:
- Not touch the other two entity files.
- Only touch `useGameEngine.js` in its own state-init line (small, easy merge) and in the `update`/`draw` call sites for its entity.
- Not touch `collision.js` outside the loop half it owns — the shared function skeleton is set up in Phase 1 with clearly-labeled sections.
- Run the vitest and `npm run dev` before reporting done.

Merge order: Z → B → P (particles last since it's largest but least interlocked with collision). Resolve `useGameEngine.js` state-init conflicts by hand — they should be additive.

After all three merged: the US-0001 vitest passes.

### Phase 3 — Kill remaining per-frame allocations (sequential, one agent)
Now that entities are pooled, US-0003 becomes mechanical:

- Replace per-frame `{x,y}` literals in `useGameEngine.js` movement/collision with a module-level `_scratch = { x: 0, y: 0 }` (or two scalars).
- `s.zombies.forEach` / `s.bullets.forEach` in `draw()` → `pool.forEachActive(cb)` with a hoisted callback (no closure allocation per frame).
- `Math.atan2` / `Math.hypot` results reused via locals.
- Confirm no `.push`, `.splice`, `.filter`, `.map`, `[...spread]`, or `{...}` object literals inside `update()` or `draw()` hot paths (spawn functions excluded — they run rarely and go through the pool now).
- Confirm `setHud` still only receives scalars (already true; do not regress).

### Phase 4 — Verification
- `npm test` — vitest US-0001 batch-kill test passes.
- `npm run dev` — play 2 minutes in wave-5+ combat.
  - Chrome DevTools ▸ Performance: record 60s. Assert avg frame time ≤ 8 ms, no Minor GC bars > 4 ms.
  - Chrome DevTools ▸ Memory ▸ Allocations on timeline: 30s steady-state < 5 MB total, no single frame > 50 KB.
  - Heap snapshots at t=30s and t=90s: entity object count delta within ±5%.
- Manual cluster-kill: spawn wave, funnel zombies, fire rocket into cluster — no freeze, no console error.
- Update each story's checkboxes in `userstories/sprint-1-performance/US-000{1,2,3}.md` to done.

## Reused code / patterns
- Deferred-removal + active-flag sweep pattern (from CLAUDE.md's "Sprint 1 perf model" note).
- Existing `dist`, `clamp`, `rand` helpers at `useGameEngine.js:4-6` — move to `src/game/math.js` in Phase 1 so all entity modules can import without circular deps.
- Constants pattern (`WORLD`, `PLAYER`, `WEAPONS`, `ZOMBIE`, `POWERUP`) in `src/game/constants.js` — add `POOLS` alongside.

## Risks
- Phase 1 extraction is behavior-preserving but touches every part of `useGameEngine.js`; a subtle wiring bug will silently regress gameplay. Mitigation: manual smoke via `npm run dev` before Phase 2 fan-out.
- Explosions are currently `push`ed in the nested collision loop (`useGameEngine.js:240`). If pooled naively, splash-damage recursion could exhaust the pool. Keep explosions as bounded array in Phase 2; revisit only if profiling shows GC pressure from them.

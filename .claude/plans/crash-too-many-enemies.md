# Bug Report & Implementation Plan: Crash When Too Many Enemies Appear

**Reported:** 2026-07-21
**Status:** Diagnosed, ready for implementation

---

## Summary

The game becomes unresponsive and eventually crashes when players reach wave 7+. The root cause is a combination of exponential enemy count growth, unbounded array pools, an O(n²) collision loop, a per-draw `shadowBlur` that is prohibitively expensive at scale, and a splice-during-iteration bug in the rocket splash kill path that corrupts array indices and causes incorrect behavior or errors.

---

## Symptoms

- Frame rate drops below 10 fps starting around wave 6–7
- Tab freeze / out-of-memory kill in Chrome/Firefox on wave 8–10 (512–2048 enemies spawning)
- Rocket explosions in large crowds sometimes kill wrong enemies or miss some entirely; kill counter can be incorrect
- No explicit error thrown in most cases — just a dead tab

---

## Root Causes

### RC-1 · Exponential Wave Growth [CRITICAL]

**Files:** `src/game/constants.js`, `src/game/waveLogic.js`

`WAVES.growth = 2` produces geometric growth: wave 7 = 256 enemies, wave 8 = 512, wave 10 = 2048. `enemiesForWave()` applies no ceiling so the value grows without bound.

```
wave 1:     4
wave 5:    64
wave 7:   256
wave 8:   512
wave 10: 2048  ← game-breaking
```

**Fix:** Change `WAVES.growth` to `1.4` and add `WAVES.maxEnemiesPerWave: 80`. In `enemiesForWave()`, wrap the result in `Math.min(WAVES.maxEnemiesPerWave, ...)`.

---

### RC-2 · Pool Limits Never Enforced [CRITICAL]

**Files:** `src/game/entities/zombies.js`, `src/game/entities/particles.js`, `src/game/entities/bullets.js`

`POOLS` constants (enemies: 256, bullets: 512, particles: 1024, explosions: 64) are defined in `constants.js` but never read by any spawn function. All four arrays grow unbounded, causing heap exhaustion and GC pressure at high wave counts.

**Fix:** Import `POOLS` in each spawn file and guard at the entry point of each spawn function:
- `spawnZombie`: bail (return early) if `state.zombies.length >= POOLS.enemies`
- `spawnParticles`: trim oldest N entries so array stays at `POOLS.particles` (trim rather than bail, to avoid visual gaps)
- Bullet spawn site (in `useGameEngine.js` at `state.bullets.push`): bail if `state.bullets.length >= POOLS.bullets`
- Explosion push sites: bail if `state.explosions.length >= POOLS.explosions`

---

### RC-3 · Rocket Splash Splice Bug [HIGH]

**File:** `src/game/entities/collision.js` → `resolveBulletZombieCollisions`

The outer loop iterates `s.zombies[zi]` backward (high → 0). The inner rocket splash loop also walks the same array with index `k` and calls `s.zombies.splice(k, 1)` inline. After any inner splice where `k < zi`, the outer `zi` becomes stale — it now refers to a different zombie than intended, or goes out of bounds when `zi` equals the last valid index.

The existing test (`src/game/__tests__/collision.test.js` · US-0001) already documents and exercises this bug.

**Fix:** Collect splash-kill candidates in a `Set<zombie object>` during the inner loop (applying damage, marking `health <= 0`). After the inner loop completes, do a single backward-splice pass over `s.zombies` to remove any zombie in the kill set. This keeps outer `zi` valid throughout.

---

### RC-4 · `shadowBlur` Per Zombie Draw Call [HIGH]

**File:** `src/game/entities/zombies.js` → `drawZombies`

Every zombie sets `ctx.shadowBlur = 10` (normal) or `18` (boss/strong) before drawing. Canvas 2D `shadowBlur` triggers a full software blur pass per draw call — it does not batch. With 200 zombies this is 200 blur passes per frame, consuming ~8–15 ms of GPU/CPU time on a mid-range laptop.

**Fix:** Skip `shadowBlur` entirely when `state.zombies.length > 30`. Use the flat `fill` color only. Below the threshold, the glow effect is retained with no visual regression. Add a local boolean `const useGlow = state.zombies.length <= 30` at the top of `drawZombies` and gate the `shadowBlur` lines behind it.

---

### RC-5 · O(n²) Collision Detection [MEDIUM]

**File:** `src/game/entities/collision.js` → `resolveBulletZombieCollisions`

The loop is zombies × bullets per frame with no spatial partitioning. At 200 zombies × 50 bullets = 10,000 `dist()` (i.e. `Math.sqrt`) calls per frame at 60 fps = 600,000 square roots per second.

**Fix (pragmatic, no spatial hash required at this scale):** Add a fast AABB pre-check before the `dist()` call. Compute `dx = Math.abs(b.x - z.x); dy = Math.abs(b.y - z.y); const sumR = b.radius + z.radius` and `continue` if `dx > sumR || dy > sumR`. This eliminates `Math.sqrt` for the vast majority of pairs. Pool caps from RC-2 bound the worst-case n to 256 × 512 which is still 131k, but AABB rejection makes the constant ~10× smaller in practice.

---

## Implementation Slices

Slices are ordered so each one is independently mergeable. Constants must go first (it unblocks RC-2 and RC-1 fixes in other files). The splice fix is isolated to one function. ShadowBlur and AABB each touch one file only.

---

### SLICE-1 · Constants: growth cap + maxEnemiesPerWave

**Files to change:**
- `src/game/constants.js` — change `WAVES.growth: 2` → `1.4`; add `WAVES.maxEnemiesPerWave: 80`
- `src/game/waveLogic.js` — change `enemiesForWave()` return to `Math.min(WAVES.maxEnemiesPerWave, WAVES.baseEnemies * Math.pow(WAVES.growth, n - 1))`

**Acceptance criteria:**
- `enemiesForWave(10)` returns ≤ 80
- `enemiesForWave(1)` still returns 4
- Existing `src/game/__tests__/waveLogic.test.js` suite passes
- New test: `enemiesForWave(n) <= 80` for n = 1..20

**Decision required:** Is growth=1.4 / cap=80 the right gameplay balance? At 1.4: wave 5 ≈ 16, wave 10 ≈ 54, cap kicks in around wave 11. Alternatives: growth=1.5 cap=80 (wave 10 ≈ 57, cap ~wave 9), growth=1.4 cap=60 (harder cap, easier for lower-end devices). Confirm before merge.

---

### SLICE-2 · Pool enforcement in spawn functions

**Files to change:**
- `src/game/entities/zombies.js` — import `POOLS`; add guard at top of `spawnZombie`
- `src/game/entities/particles.js` — import `POOLS`; in `spawnParticles` trim oldest entries if `state.particles.length + count > POOLS.particles` before pushing
- `src/game/useGameEngine.js` — guard bullet push before `state.bullets.push`
- `src/game/entities/collision.js` — guard explosion push before `s.explosions.push`

**Acceptance criteria:**
- Spawning 300 zombies in a test state still leaves `state.zombies.length === 256` (POOLS.enemies)
- Spawning 2000 particles in a test still leaves `state.particles.length <= 1024`
- No existing tests broken

---

### SLICE-3 · Rocket splash splice fix

**File to change:**
- `src/game/entities/collision.js` — refactor inner splash loop in `resolveBulletZombieCollisions` to collect kill candidates in a `Set`, defer splices to after inner loop completes

**Acceptance criteria:**
- Both tests in `src/game/__tests__/collision.test.js` (US-0001) pass
- `state.kills === 10` after single rocket into 10-zombie cluster
- `state.kills === 10` after two rockets in same frame into 10-zombie cluster (no double-count)
- `state.zombies` contains no `undefined` entries after resolution

---

### SLICE-4 · ShadowBlur LOD in drawZombies

**File to change:**
- `src/game/entities/zombies.js` — add `const useGlow = state.zombies.length <= 30;` at top of `drawZombies`; gate the `ctx.shadowBlur = ...` and `ctx.shadowBlur = 0` lines behind `if (useGlow)`

**Acceptance criteria:**
- No visual change when zombie count ≤ 30 (glow still visible)
- When 31+ zombies are present, draw loop completes without setting `shadowBlur`
- Frame time in browser DevTools drops measurably in a wave-7 scenario (manual check)

---

### SLICE-5 · AABB pre-check in collision loop

**File to change:**
- `src/game/entities/collision.js` — in `resolveBulletZombieCollisions`, inside the `zi`/`bi` loop body, add AABB rejection before the `dist()` call

**Acceptance criteria:**
- All existing collision tests still pass
- AABB short-circuit fires before `dist()`: `dx > sumR || dy > sumR` skips `Math.sqrt`

---

## Test Strategy

| Slice | Existing tests affected | New tests needed |
|-------|------------------------|-----------------|
| SLICE-1 | `waveLogic.test.js` | `enemiesForWave(n) <= 80` for n up to 20 |
| SLICE-2 | None (no pool tests exist) | Pool cap enforcement unit tests |
| SLICE-3 | `collision.test.js` (US-0001 — must now pass) | None additional |
| SLICE-4 | None | Manual frame-time check; no automated test needed |
| SLICE-5 | `collision.test.js` | Verify no regressions |

Run `npx vitest run` after each slice. SLICE-3 is the only one where a pre-existing failing test is the acceptance gate.

---

## Risk Notes

1. **Gameplay balance:** Capping at 80 enemies/wave with growth 1.4 is a significant difficulty reduction for high-wave players. Confirm with the game designer before shipping SLICE-1.

2. **Particle trim strategy:** Trimming oldest particles (front of array) in SLICE-2 may cause a flash if many particles expire at the same moment. Alternative: skip spawning new particles when at cap (simpler, no trim needed). Choose based on acceptable visual quality.

3. **SLICE-3 deferred-splice approach:** The `Set` collect + backward splice is a safe pattern already used in `updateZombiesMovementAndContact`. But rocket XP/score accounting in the new loop must be verified — current code credits score inline during the splice; the refactor must move that accounting to the deferred pass.

4. **SLICE-4 threshold (30):** The `30` cutoff is a pragmatic estimate. It should be tuned if the game regularly runs with 30–40 enemies in early waves where glow is aesthetically important. Consider a `ZOMBIE_GLOW_THRESHOLD` constant in `constants.js` for tunability.

5. **Slice ordering dependency:** SLICE-2 benefits from SLICE-1 being merged first (pool caps only make sense if wave counts are bounded). All other slices are fully independent of each other.

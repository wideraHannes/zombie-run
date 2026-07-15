# Sprint 8 — Polish & Feel: Implementation Plan

## Slice S19 — Triple magazine capacity (US-0019)
**Goal:** Bump `capacity` for all 4 weapons in `WEAPONS` to 3×.

- **Files:** `src/game/constants.js` (lines ~51, 69, 88, 107).
- **Red test first:** `src/game/__tests__/tripleCapacity.test.js`
  - `import { WEAPONS } from '../constants';`
  - `const cap = (id) => WEAPONS.find(w => w.id === id).capacity;`
  - Assert `cap('pistol') === 36`, `cap('shotgun') === 18`, `cap('smg') === 90`, `cap('rocket') === 9`.
- **Impl:** Change 4 numeric literals only. Leave `rocket.perLevel.capacityBumpLevels` alone.
- **Verify:** `npm test`.
- **Post:** flip US-0019 frontmatter `status: todo` → `done`; update `userstories/README.md` Sprint 8 table row for US-0019.

## Slice S20 — Classic sound effects (US-0020)
**Goal:** New self-contained sound module + call sites at fire / zombie-death / pickup / reload-start; `M` toggles mute.

- **Files:**
  - NEW `src/game/sound.js` — exports `playShot()`, `playHit()`, `playPickup()`, `playReload()`, `setMuted(bool)`, `isMuted()`. Lazily construct `AudioContext` on first play (guard with `typeof window !== 'undefined'` and `try/catch` — no throw if unavailable). Each play: create `OscillatorNode` + `GainNode`, connect, `osc.start()`, `osc.stop(ctx.currentTime + duration)` where duration ≤ 0.35s. Gain envelope with peak ≤ 0.2. `setMuted(true)` short-circuits — zero nodes.
  - `src/game/useGameEngine.js` — 4 insertion points:
    1. **Fire:** inside `fire()` after `p.ammo--` (~line 170) → `playShot()`.
    2. **Reload start:** in `reload()` after setting `p.reloadEnd` (~line 158) AND at the auto-reload trigger in `update()` (~line 270) → `playReload()`. Only when transitioning from `reloadEnd === 0` to avoid duplicates.
    3. **Pickup:** on successful power-up or weapon-pickup collection. Simplest: have `checkPickupContact` (in `src/game/weaponPickup.js`) return a bool; call `playPickup()` on true. Same for power-up collection path (~line 227).
    4. **Zombie death:** in `src/game/entities/collision.js` — import `playHit` from `../sound`; call at each death site (~lines 13, 43, 56 where `killed` is true).
  - `src/game/useGameEngine.js` `onKeyDown` (~line 446): add `if (e.code === 'KeyM') setMuted(!isMuted());`.
- **Red test first:** `src/game/__tests__/sound.test.js`
  - Stub `global.AudioContext` with a fake recording `createOscillator` / `createGain` invocations and `osc.stop(when)`.
  - For each of the 4 fns: assert ≥1 oscillator, ≥1 gain, `stop()` scheduled with `when - ctx.currentTime <= 0.4`.
  - After `setMuted(true)`, all four fns create zero new nodes.
  - Module import does not throw when `AudioContext` is undefined.
- **Verify:** `npm test`.
- **Post:** flip US-0020 → done; update README Sprint 8 table.

## Slice S21 — Player-held weapon color (US-0021)
**Goal:** Draw the gun-body using `WEAPONS[weaponIndex].color`.

- **Files:**
  - NEW `src/game/drawHeldWeapon.js` — pure helper `drawHeldWeapon(ctx, player, weapon)` performing the gun-body `fillRect` with `weapon.color` (muzzle tip stays `#e5e7eb`).
  - `src/game/useGameEngine.js` `drawPlayer` (~lines 348–351): replace the hardcoded `#94a3b8` gun-body fill with a call to the new helper, passing the currently equipped weapon.
- **Red test first:** `src/game/__tests__/heldWeaponColor.test.js`
  - Fake ctx recording `fillStyle` assignments via `Object.defineProperty`.
  - `import { drawHeldWeapon } from '../drawHeldWeapon'; import { WEAPONS } from '../constants';`
  - Call with `pistol` → assert `_colors.includes('#faff00')`.
  - Call with `rocket` → assert `_colors.includes('#ff2bd6')`.
- **Verify:** `npm test`.
- **Post:** flip US-0021 → done; update README Sprint 8 table.

## Shared-write callouts
- `src/game/useGameEngine.js` — modified by **S20 and S21**.
- `userstories/README.md` — modified by all three post-steps.

## Execution schedule
1. **Wave 1 (parallel):** S19 ∥ S21. No file overlap.
2. **Wave 2 (serial):** S20 alone, after Wave 1 lands.
3. **Post-steps serialized** (README.md is a shared write).

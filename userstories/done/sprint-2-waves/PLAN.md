# Sprint 2 — Wave System — Implementation Plan

Two stories, executed in order. TDD where the behavior is unit-testable (both are).

---

## US-0004 — Wave state machine with doubling enemy count

### Constants (`src/game/constants.js`)
Add:
```js
export const WAVES = {
  baseEnemies: 4,
  growth: 2,
  betweenMs: 10_000,
};
```

### Engine (`src/game/useGameEngine.js`)
Extend `stateRef` with:
- `currentWave: 1`
- `enemiesToSpawnInWave: WAVES.baseEnemies`
- `enemiesAliveInWave: 0`
- `waveStatus: 'active'` (`'active' | 'between'`)
- `betweenWavesUntil: 0`

Replace the current spawn/wave logic (approx. lines 177–188):
- On wave start: `enemiesToSpawnInWave = baseEnemies * growth^(currentWave-1)`.
- Spawn tick: while `enemiesToSpawnInWave > 0` AND zombie pool has a free slot AND spawn-interval elapsed → `spawnZombie(s)`, decrement `enemiesToSpawnInWave`, increment `enemiesAliveInWave`.
- Zombie death: at the exact point the pooled zombie flips `active = false`, decrement `enemiesAliveInWave` (exactly once per kill — hook the flag flip, not per-hit damage).
- Wave end: when `enemiesToSpawnInWave === 0 && enemiesAliveInWave === 0` → `waveStatus = 'between'`, `betweenWavesUntil = now + WAVES.betweenMs`.

HUD sync (`syncHud`): expose `currentWave`, `waveStatus`.

### Test (vitest)
Drive engine headlessly:
1. Start game → assert exactly `baseEnemies` zombies spawned in wave 1.
2. Mark them all inactive (simulate kills) → assert `waveStatus === 'between'` on last kill.
3. Force `betweenWavesUntil` elapsed → assert `enemiesToSpawnInWave === baseEnemies * 2` at wave-2 start.

---

## US-0005 — 10s inter-round pause + "Nächste Runde X!" banner

### Engine
In `update(dt)`:
- If `waveStatus === 'between'`: skip zombie AI and spawning. When `now >= betweenWavesUntil` → `currentWave++`, `waveStatus = 'active'`, seed `enemiesToSpawnInWave = baseEnemies * growth^(currentWave-1)`.
- Countdown driven by engine time (`now`), not `setInterval` — stays pause-safe.

HUD sync: expose `betweenWavesRemainingMs = Math.max(0, betweenWavesUntil - now)`.

### Overlay (`src/components/Overlays.jsx`)
When `hud.waveStatus === 'between'`, render a centered banner:
- Line 1: `Nächste Runde {hud.currentWave + 1}!`
- Line 2: `Math.ceil(hud.betweenWavesRemainingMs / 1000)` seconds.

### Test
1. Finish wave 1 headlessly → tick engine by 10 000 ms → assert `currentWave === 2`, `waveStatus === 'active'`, spawn count reset to `base * 2`.
2. Render `<Overlays>` mid-pause with `waveStatus === 'between'`, `currentWave === 1`, `betweenWavesRemainingMs === 7000` → assert banner text contains `Nächste Runde 2!` and `7`.

---

## Order & risks
1. US-0004 first (state + failing test → green).
2. US-0005 (timer + overlay).

Risks:
- **Double-decrement bug** on `enemiesAliveInWave`. Hook the pool `active`-flag flip, not every damage event.
- **Pool overflow**: spawn is gated by "pool has free slot", so overflow enemies simply wait — matches US-0004 notes.
- **Pause safety**: countdown uses engine `now`, so `status === 'paused'` freezes the timer for free.

## Definition of done (sprint)
Waves 1 → 2 → 3 progress cleanly with correct spawn counts (4, 8, 16), banner + countdown visible for the full 10 s between rounds, no zombies spawn or act during the pause.

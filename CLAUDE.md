# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` / `npm run build` / `npm run preview` (Vite)
- `npm test` — vitest; tests live under `src/game/__tests__/`. No linter configured.

## Workflow

Develop TDD when plausible: for any story or change whose behavior can be expressed as a unit/integration test, write the failing test first (use the `tdd` skill), then implement. Skip only when the acceptance criteria are inherently manual — e.g. DevTools perf measurements, visual/rendering checks — and say so explicitly instead of silently dropping tests.

## Architecture

Canvas-rendered 2D zombie shooter. Vite + React 18 + Tailwind. React is thin — it mounts the canvas and renders HUD/overlays; all game logic runs outside React state.

**`src/game/useGameEngine.js`** is the whole engine:
- `stateRef` holds the mutable world (player, bullets, zombies, powerUps, particles, explosions, input, timers). Mutated in place every frame.
- Only HUD-relevant scalars flow into React via `syncHud()` — entity arrays never do.
- Single `requestAnimationFrame` loop: `update(dt)` runs only when `status === 'playing'`; `draw()` always runs.
- `status`: `menu | playing | paused | over`.
- Mouse coords are converted from client px to world coords (`WORLD.width × WORLD.height`) so logic is resolution-independent.

**`src/game/constants.js`** — data-driven config for `WORLD`, `PLAYER`, `ZOMBIE`, `WEAPONS`, `POOLS`, etc. Adding a weapon = append to `WEAPONS`; UI and keybinds (Digit1–4, Q) pick it up.

**Sprint 1 perf model (in progress):** object pools with an `active` flag + deferred removal. Do not `splice` during iteration; do not allocate per-frame. See `userstories/sprint-1-performance/`.

## User stories

`userstories/BACKLOG.md` is the prioritized index; active stories live in `userstories/sprint-N-<slug>/US-XXXX-*.md`; shipped stories/sprints move into `userstories/done/`.

## Dark Coding Factory

This repo runs as an autonomous feature-delivery pipeline. Five role-specialized skills chain together so new features can be planned, implemented, tested, and archived without hand-holding. Prefer routing work through this pipeline over ad-hoc edits — that is what keeps `BACKLOG.md`, story frontmatter, tests, and `done/` in lockstep.

**The team (skills, each owns one surface):**

| Skill              | Role         | Owns                                                          |
|--------------------|--------------|---------------------------------------------------------------|
| `story-backlog`    | Product      | `userstories/BACKLOG.md` — priority, sprint grouping.         |
| `user-stories`     | Dev          | Story files under `sprint-N-*/`; `status:` frontmatter.       |
| `tdd`              | QA           | One failing → passing vitest per story, under `src/game/__tests__/`. |
| `archive-done`     | Archivist    | `userstories/done/` and Done sections of BACKLOG/README.      |
| `plan-and-delegate`| Architect    | Multi-story plans; fans out parallel implementation subagents.|
| `ship-story`       | Orchestrator | Chains the above end-to-end for a single story or sprint.     |

**Default automatic pipeline (`ship-story`):**

```
story-backlog  →  user-stories  →  tdd  →  user-stories  →  archive-done
   (pick)         (in-progress)    (red)     (green + done)    (archive)
```

**How to trigger the factory:**

- `ship US-XXXX` or `ship the next story` → one story end-to-end via `ship-story`.
- `ship sprint N` → loop `ship-story` over every open story in that sprint, then whole-folder archive.
- `plan sprint N` / `plan feature X` → `plan-and-delegate` writes a plan to `.claude/plans/` and fans implementation slices to subagents (use this instead of `ship-story` when scope spans several stories or files and would flood context).
- `what's next` / `reprioritize` → `story-backlog` (no code change).
- `archive done stories` / `close sprint N` → `archive-done` (no code change).

**Guardrails the factory enforces:**

- **TDD is not optional** when behavior is unit-testable. `ship-story` refuses to skip the `tdd` red step; skip only for inherently manual acceptance criteria (perf/visual) and say so.
- **Single source of truth per surface.** Only `user-stories` edits `status:` frontmatter; only `story-backlog` edits `BACKLOG.md` priority/order; only `archive-done` touches `userstories/done/`. Don't cross the streams from ad-hoc edits.
- **Stop on first failure.** A failing red test that fails for the wrong reason, a green step that can't reach passing, a regressed pre-existing test — all halt the pipeline and report. No silent skips.
- **One story per pipeline run.** `ship sprint N` is a loop of single-story runs, not a batched cross-cutting rewrite. Keeps failures attributable.
- **Ask before whole-sprint archive.** Individual story archive is automatic; folder-level archive requires confirmation.
- **Linear by default; parallel by intent.** `ship-story` is single-threaded. For genuine parallel work, hand off to `plan-and-delegate` — don't spawn subagents from `ship-story`.

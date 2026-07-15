# User stories

Active stories live in per-sprint folders (`sprint-N-<slug>/`). Shipped sprints move to `done/`. Priority + sprint grouping is in `BACKLOG.md`.

Tests live under `src/game/__tests__/` (vitest, run with `npm test`).

## Sprint 1 — Performance & Stability
| ID      | Title                                             | Status |
|---------|---------------------------------------------------|--------|
| US-0001 | Fix crash when multiple enemies die in same frame | todo   |
| US-0002 | Object-pool enemies, bullets, and particles       | todo   |
| US-0003 | Reduce per-frame allocations in game loop         | todo   |

## Sprint 6 — Local Scoreboard
| ID      | Title                                          | Status |
|---------|------------------------------------------------|--------|
| US-0016 | Local scoreboard with name entry (localStorage)| done   |

## Sprint 7 — Weapon Progression
| ID      | Title                                                | Status |
|---------|------------------------------------------------------|--------|
| US-0017 | Per-weapon XP and leveling with base damage scaling  | done   |
| US-0018 | Per-weapon specific level bonuses (differentiate feel)| done  |

## Sprint 8 — Polish & Feel
| ID      | Title                                                 | Status |
|---------|-------------------------------------------------------|--------|
| US-0019 | Triple magazine capacity for every weapon             | todo   |
| US-0020 | Add tasteful classic sound effects                    | todo   |
| US-0021 | Player-held weapon renders in equipped weapon's color | todo   |

## Done — `done/`
| ID      | Title                                                | Sprint                  |
|---------|------------------------------------------------------|-------------------------|
| US-0004 | Round/wave state machine with doubling enemy count   | done/sprint-2-waves     |
| US-0005 | 10s inter-round pause with "Nächste Runde X!" banner | done/sprint-2-waves     |
| US-0006 | Strong enemy variant spawns every 3rd round          | done/sprint-3-enemies   |
| US-0007 | Boss enemy on round 10                               | done/sprint-3-enemies   |
| US-0010 | Start run with a single weapon                       | done/sprint-4-weapons   |
| US-0008 | Spawn weapon pickup when magazine hits 1/3           | done/sprint-4-weapons   |
| US-0009 | Player picks up dropped weapon on contact            | done/sprint-4-weapons   |

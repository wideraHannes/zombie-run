---
id: US-0016
title: Local scoreboard with name entry (localStorage)
status: todo
created: 2026-07-15
---

## Story
As a player, I want my best runs saved locally with my name, so that I can chase my own high scores across sessions.

## Acceptance criteria
- [ ] On game over, player is prompted for a name (default: last used name, persisted).
- [ ] Score + name + date persist to `localStorage` under a single key (e.g. `yasin:scores`).
- [ ] Top 10 scores (descending) are shown on the menu screen and on the game-over screen.
- [ ] Storage tolerates missing/corrupt JSON — falls back to empty list without throwing.
- [ ] Names are trimmed and clamped to 16 chars; empty name falls back to "Anonymous".

## Test (the precise test)
Unit test `scoreboard.js` (or wherever the module lives):
1. `loadScores()` returns `[]` when localStorage is empty.
2. `saveScore({ name: '  Ash  ', score: 500 })` stores an entry with `name: 'Ash'`.
3. Adding 12 scores then calling `loadScores()` returns exactly 10 entries, sorted descending by `score`.
4. `loadScores()` returns `[]` (not throw) when the stored value is `"not-json"`.
5. `saveScore({ name: '', score: 100 })` stores `name: 'Anonymous'`.

## Notes
- Pure module — no React, no engine coupling. React game-over overlay reads/writes via the module.
- Files likely touched: new `src/game/scoreboard.js`, `src/game/__tests__/scoreboard.test.js`, HUD/overlay component for name input + top-10 display.

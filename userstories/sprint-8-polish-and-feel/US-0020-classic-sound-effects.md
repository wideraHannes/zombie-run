---
id: US-0020
title: Add tasteful classic sound effects
status: todo
created: 2026-07-15
---

## Story
As a player, I want to hear crisp, classic sound effects for the key moments of play, so that combat feels punchy without becoming noisy.

## Acceptance criteria
- [ ] A shot sound plays each time the player fires (all weapons; can share one SFX or vary per weapon type).
- [ ] A zombie-hit / death sound plays when a zombie takes fatal damage.
- [ ] A pickup sound plays when the player collects a power-up or weapon drop.
- [ ] A reload sound plays when a reload starts.
- [ ] Sounds are short (<400ms), retro/classic in character (square/triangle blips or brief noise bursts — WebAudio-generated is fine, no asset files required), and gain-limited so overlapping instances don't distort.
- [ ] Sound is opt-out via a simple master mute (e.g. `M` key or HUD button) and does not throw if `AudioContext` is unavailable.

## Test (the precise test)
Unit test in `src/game/__tests__/`: import the sound module (e.g. `src/game/sound.js`) with a mocked/stubbed `AudioContext`, call `playShot()`, `playHit()`, `playPickup()`, `playReload()`, and assert each creates at least one oscillator/gain node and schedules a `stop()` within 400ms. With `setMuted(true)`, calling the same functions creates zero audio nodes.

## Notes
Keep it self-contained in a new `src/game/sound.js`. Wire calls from `useGameEngine.js` at the four event points (fire, zombie death, pickup, reload start). Lazily create the `AudioContext` on the first user gesture to satisfy browser autoplay policies.

---
id: US-0005
title: 10s inter-round pause with "Nächste Runde X!" banner
status: done
created: 2026-07-15
---

## Story
As a player, I want a 10-second breather between waves with a clear announcement, so that I can reposition and know what's coming.

## Acceptance criteria
- [ ] When engine enters `betweenWaves`, a 10s countdown starts.
- [ ] Overlay banner displays `Nächste Runde <N+1>!` with a visible countdown (10 → 0).
- [ ] Player can still move but no new enemies spawn and no existing enemies act (or the field is already empty).
- [ ] At countdown 0, wave N+1 begins per US-0004.

## Test (the precise test)
Finish wave 1. Assert: banner appears with text "Nächste Runde 2!", countdown ticks from 10 to 0 in ~10 seconds (±0.2s), wave 2 spawning begins exactly when countdown hits 0, banner disappears.

## Notes
- Banner belongs in `src/components/Overlays.jsx`.
- Countdown driven from engine time, not `setInterval`, to stay pause-safe.

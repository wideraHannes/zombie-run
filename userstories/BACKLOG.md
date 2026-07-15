# Backlog — grouped into sprints

Sprints run top-to-bottom. Finish a sprint before starting the next. Story files live under `sprint-N-<slug>/`; shipped sprints move to `done/`.

---

## Sprint 1 — Performance & Stability *(do first)* — `sprint-1-performance/`
Goal: rock-solid 60 fps with flat memory, no crashes on multi-kills. Everything downstream depends on the pooling/loop rewrite landing here.

1. **US-0001** — Fix crash when multiple enemies die in same frame *(blocker)*
2. **US-0002** — Object-pool enemies, bullets, and particles
3. **US-0003** — Reduce per-frame allocations in game loop

**Definition of done:** 2-minute play session in wave-5+ combat holds ≤8 ms avg frame time, flat heap, zero freezes on cluster-kills.

---

## Sprint 6 — Local Scoreboard — `sprint-6-local-scoreboard/`
Goal: give the player persistent local high scores with a name so runs feel connected across sessions.

1. **US-0016** — Local scoreboard with name entry (localStorage)

---

## Sprint 7 — Weapon Progression — `sprint-7-weapon-progression/`
Goal: make weapons scale and diverge so combat is tactical — invest in the right weapon, don't dump mags into the wrong one.

1. **US-0017** — Per-weapon XP and leveling with base damage scaling
2. **US-0018** — Per-weapon specific level bonuses (differentiate feel)

---

## Done

- ✅ **Sprint 2 — Wave System** — `done/sprint-2-waves/` (US-0004, US-0005)
- ✅ **Sprint 3 — Enemy Variants** — `done/sprint-3-enemies/` (US-0006, US-0007)
- ✅ **Sprint 4 — Weapon Drop Loop** — `done/sprint-4-weapons/` (US-0010, US-0008, US-0009)

---

## Rationale
- Sprint 1 lands the pooling + loop rewrite that Sprints 2–4 were built on top of; the current implementation still uses splice-during-iteration and will benefit once pooling lands.
- Wave system (S2) was a prereq for enemy variants (S3).
- Weapon-drop loop (S4) is self-contained and can slip without blocking anything else.

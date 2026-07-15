---
name: tdd
description: Test-driven development for user stories. Use when the user asks to "write a test for US-X", "TDD story X", "add tests for the story", "red-green story X", or wants to turn a user story's Test section into a real failing → passing test. Produces one slim, precise test per story, run via vitest. Pairs with the `user-stories` skill.
---

# TDD skill

Turns the **Test** section of a user story into a real, executable test — red first, then the minimal code to make it green. One story, one test, one behavior. No suites of speculative cases.

## Setup (one-time)

This project uses Vite + React but has no test runner. On first use, if `vitest` is not in `package.json`:

1. Install: `npm i -D vitest @testing-library/react @testing-library/jest-dom jsdom`
2. Add to `package.json` scripts: `"test": "vitest"`, `"test:run": "vitest run"`
3. Add to `vite.config.js`:
   ```js
   test: { environment: 'jsdom', globals: true, setupFiles: './src/test/setup.js' }
   ```
4. Create `src/test/setup.js` with `import '@testing-library/jest-dom'`

Do this in one go, commit-ready, then proceed with the story.

## Test layout

- Colocate: `Foo.jsx` → `Foo.test.jsx` next to it.
- Pure logic (no React) → `foo.test.js` next to `foo.js`.
- Never a `__tests__/` folder. Never a top-level `tests/` mirror.
- One `describe` per unit under test. One `it` per story unless the story's Test section explicitly lists multiple assertions.

## Naming

`it('<observable behavior in plain English>', ...)` — match the story's Test section verbatim when possible. The test name is the acceptance criterion, readable in CI output without context.

## Operating modes

### 1. WRITE-TEST mode — "write the test for US-X" / "red for story X"

1. Read `userstories/sprint-*/US-NNNN-*.md`. The **Test** section is the contract.
2. If the Test section is vague ("it works", "handles edge cases"), stop and ask the user to sharpen it — do not invent assertions.
3. Locate or create the test file per the layout rules above.
4. Write **one** test that asserts exactly what the Test section says. No extra cases, no "while we're here" coverage.
5. Run `npm run test:run -- <path>` and confirm it fails **for the right reason** (missing implementation, not a syntax error or missing import). Report the failure line.
6. Stop. Do not implement yet.

### 2. GREEN mode — "make it pass" / "green US-X"

1. Write the **minimum** code to make the failing test pass. No extra features, no defensive branches the test doesn't cover.
2. Run the single test — confirm green.
3. Run `npm run test:run` (full suite) — confirm no regressions.
4. Update the story: set `status: done`, tick acceptance criteria, update `userstories/README.md`.

### 3. FULL-CYCLE mode — "TDD US-X" / "do story X test-first"

Run WRITE-TEST → confirm red → GREEN in one pass. Report both the red output and the green output so the user sees the cycle.

### 4. RETRO-TEST mode — "add a test for the existing X"

For code already written without a test. Same rules: one behavior, matches a story's Test section (or a new story if none exists — spawn the `user-stories` skill to author it first).

## Rules

- **One test per story.** If the story needs more, the story is too big — kick back to `user-stories` to split.
- **Red before green, always.** Never write the implementation first and backfill the test. If code already exists, delete/comment the relevant path, watch the test fail, then restore.
- **Test behavior, not implementation.** Assert on rendered output, return values, dispatched events — not on internal state or private functions.
- **No mocks unless a boundary demands it.** Real components, real reducers, real math. Mock only network, timers, or randomness — and note *why* in a one-line comment.
- **Slim.** A test should fit on one screen. If the arrange block is longer than the assert block by 3×, the code under test is doing too much — flag it, don't paper over with fixtures.
- **Deterministic.** No sleeps, no wall-clock dates, no ordering assumptions on Sets/Maps. Use `vi.useFakeTimers()` and `vi.setSystemTime()` when time matters.
- **Fast.** A single test should run in <100ms. If it doesn't, the unit is too coarse.
- **Never expand scope.** If you spot a bug adjacent to the story, note it — do not fix it in the same test/commit. Suggest a new story.
- **Never mark a story done on a skipped or `.todo` test.** Skips = not done.

## Anti-patterns to reject

- `expect(true).toBe(true)` placeholder tests.
- Snapshot tests as the primary assertion for a story (they're for regression, not for describing intent).
- Testing multiple stories in one file's `describe` — each story owns its own `it`.
- Long `beforeEach` chains — prefer inline arrange so each test reads top-to-bottom.
- Asserting on CSS class names or DOM structure when a user-visible query (`getByRole`, `getByText`) works.

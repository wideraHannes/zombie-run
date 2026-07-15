---
name: ship-story
description: Orchestrate the full lifecycle of a user story from backlog to archive by chaining the other story skills in order. Use when the user asks to "ship US-XXXX", "ship the next story", "do the next story end-to-end", "ship sprint N", "work the backlog", or wants a one-shot command that picks a story, writes its test, implements it, and archives it. Delegates each step to the specialist skill — never re-implements their logic.
---

# Ship-story orchestrator skill

Runbook that chains the existing story skills into a single pipeline. Owns no files of its own. Every step calls the skill that owns that surface.

## The pipeline

```
story-backlog  →  user-stories  →  tdd  →  user-stories  →  archive-done
   (pick)         (in-progress)    (red)     (green+done)     (archive)
```

Each arrow is a **hand-off to another skill**, not work done here. This skill's only job is: pick the right target, run the steps in order, stop on failure, and report.

## Modes

### 1. SHIP ONE — "ship US-XXXX", "ship the next story", "do the next one"
Target = the named id, or (if none) whatever `story-backlog` reports as the top pending row in the current sprint.

Steps, in order — stop and report on the first failure:

1. **Pick + verify** — invoke `story-backlog` in SHOW mode to confirm the target exists and is not already `done`. Read the story file to grab its Test section and Acceptance criteria.
2. **Mark in-progress** — invoke `user-stories` to flip the story's frontmatter `status: todo → in-progress`.
3. **Red** — invoke `tdd` for that story id. It turns the story's Test section into one failing vitest and confirms it fails for the right reason.
4. **Green** — invoke `user-stories` in IMPLEMENT mode for that id. It writes the code until the new test (and the rest of `npm test`) passes.
5. **Verify suite** — run `npm test -- --run`. If any pre-existing test regresses, stop and report.
6. **Mark done** — invoke `user-stories` to flip `status: in-progress → done`.
7. **Archive** — invoke `archive-done` in ARCHIVE STORY mode for that id. If it was the last open story in its sprint, ask the user whether to also archive the whole sprint folder.

Report at the end: story id, one-line summary of the change, test file path, and where the story now lives (`done/…`).

### 2. SHIP SPRINT — "ship sprint N", "close out sprint N end-to-end"
Target = every story in `sprint-N-<slug>/` with `status: todo` or `in-progress`, in the order given by `story-backlog`.

Loop SHIP ONE for each story. After the last one:
- Invoke `archive-done` in ARCHIVE SPRINT mode to move the whole folder into `done/sprint-N-<slug>/`.
- Report: stories shipped, tests added, final backlog state.

Stop the loop on the first failure. Do not skip failing stories.

### 3. DRY RUN — "what would ship-story do for US-XXXX", "plan the ship"
Walk through the pipeline naming each skill and the concrete action it would take, without invoking anything. Useful before committing to a long chain.

## Rules

- **Delegate; never re-implement.** If a step feels like it needs custom code here, that logic belongs in one of the underlying skills instead.
- **Stop on the first failure.** A failed red step, a green step that can't reach passing, a regressed pre-existing test, or a broken build — all halt the pipeline. Report the failing step; do not silently continue.
- **Don't touch frontmatter directly.** Route every `status:` change through `user-stories`. This keeps the source-of-truth logic in one place.
- **Don't touch `BACKLOG.md` or `README.md` directly.** `story-backlog` owns priority/order; `archive-done` owns the Done sections. This skill only *asks* them to update.
- **One story per pipeline run.** SHIP SPRINT is a loop of SHIP ONE — never batch steps across stories (e.g. don't write all tests then all impls). Interleaving hides which story broke.
- **Ask before whole-sprint archive.** Individual archive is automatic; folder-level archive requires confirmation, because it removes the sprint from active view.
- **Never spawn subagents.** This is a linear orchestrator by design. If parallel implementation is wanted, hand off to `plan-and-delegate` and stop.
- **Report terse.** End-of-run summary is one paragraph: what shipped, what tests, where it now lives, what's next in the backlog.

## Non-goals

- Authoring new stories (use `user-stories`).
- Reordering the backlog (use `story-backlog`).
- Unarchiving (use `archive-done`).
- Sprint planning across multiple sprints (use `plan-and-delegate`).

---
name: user-stories
description: Create, manage, and implement user stories for the zombie-shooter game. Use when the user asks to "create a user story", "add user stories", "implement story X", "list stories", or references anything in the `userstories/` directory. Handles 1-n stories in a single prompt, keeps each story small and independently testable, and supports parallel implementation via subagents.
---

# User Stories skill

User stories live in `userstories/` at the project root. Each story is a single markdown file that is small enough to implement and test in one focused pass. The goal: **fast, iterable, parallelizable pieces built test-first**.

## Directory layout

Stories are grouped into **sprint folders**. Each sprint is a self-contained batch that can be built and shipped together.

```
userstories/
  README.md                       # sprint-grouped index (status per story)
  BACKLOG.md                      # prioritized roadmap (owned by story-backlog skill)
  sprint-1-<slug>/
    US-0001-<slug>.md
    US-0002-<slug>.md
  sprint-2-<slug>/
    US-0003-<slug>.md
  sprint-unassigned/              # holding pen for stories not yet slotted
    US-0004-<slug>.md
```

Rules:
- Story files always live inside a `sprint-N-<slug>/` folder — never at the `userstories/` root.
- Sprint folder names are `sprint-<number>-<kebab-slug>` (e.g. `sprint-1-performance`).
- IDs (`US-NNNN`) are globally unique across all sprints — never reset per sprint.
- Any story not yet slotted into a sprint goes in `sprint-unassigned/`.

Create `userstories/`, `userstories/README.md`, and `sprint-unassigned/` on first use if missing.

## Story file format

Every story file uses this exact structure — keep it terse, one screen max:

```markdown
---
id: US-0001
title: <imperative, <60 chars>
status: todo   # todo | in-progress | done
created: YYYY-MM-DD
---

## Story
As a <role>, I want <capability>, so that <benefit>.

## Acceptance criteria
- [ ] <precise, observable condition 1>
- [ ] <precise, observable condition 2>

## Test (the precise test)
<One concrete test — describe the exact assertion or scenario that proves the
story is done. This is the contract. Prefer a single testable behavior over a
list. If it needs multiple tests, the story is too big — split it.>

## Notes
<Optional: constraints, files likely touched, out-of-scope items>
```

The **Test** section is the load-bearing part. It must be precise enough that two engineers would write the same test from it.

## Operating modes

The skill has three modes. Pick based on the prompt.

### 1. CREATE mode — "create a user story for X" / "add stories for X, Y, Z"
- Parse the prompt for 1-n distinct stories. A single prompt often contains several — split them.
- For each story:
  1. Read `userstories/README.md` to find the next free `US-NNNN` id (highest id across all sprint folders + 1).
  2. Decide the sprint folder:
     - If the user named a sprint ("add to sprint 2", "for the weapons sprint") → that folder.
     - If the new story is a clear continuation of an existing sprint's theme → that folder (mention the choice).
     - Otherwise → `sprint-unassigned/` (and mention it so the user can slot it later or via `story-backlog`).
  3. Write `userstories/sprint-N-<slug>/US-NNNN-<kebab-slug>.md` using the format above.
  4. Update `userstories/README.md` — add the row under the correct sprint's table (create the sprint's section if new).
- Keep each story small: one behavior, one precise test, ideally <1 hour to implement. If a request is too broad, split it into multiple stories and say so.
- Do **not** implement anything in CREATE mode. Just author the files and report the ids created + which sprint each landed in.

#### Creating a new sprint
When the user asks to create a sprint ("make a sprint for X", "group these into a new sprint"):
- Next sprint number = max existing sprint number + 1.
- `mkdir userstories/sprint-N-<kebab-slug>/`.
- Move/create the relevant story files into it.
- Add the sprint's section to `README.md` and (if `BACKLOG.md` exists) prompt `story-backlog` to update the roadmap.

### 2. IMPLEMENT mode — "implement US-0003" / "build stories 3 and 5" / "do the next todo story" / "do sprint 1"
- Locate the story by id: `userstories/sprint-*/US-NNNN-*.md` (glob, since sprint folder is not encoded in the id).
- "Do sprint N" = implement every `todo` story in `sprint-N-*/` in the order they appear in `BACKLOG.md`.
- Test-driven, one story at a time per agent:
  1. Read the story file.
  2. Set status to `in-progress`.
  3. Write the failing test first (matching the story's **Test** section).
  4. Run the test — confirm it fails for the right reason.
  5. Implement the minimal code to pass.
  6. Run the test — confirm it passes. Run the full suite — confirm no regressions.
  7. Set status to `done` and update `userstories/README.md`.
- **Parallel execution**: if the user asks for multiple stories at once ("implement US-0003 and US-0004 in parallel"), spawn one `general-purpose` subagent per story in a single message with parallel Agent tool calls. Only parallelize stories whose "Notes" or file lists don't overlap — otherwise do them sequentially to avoid merge conflicts.
- This project has no test runner configured yet. If implementing a story requires tests and none exists, propose adding vitest (Vite-native) in one setup story before doing test-first work — do not silently skip the test step.

### 3. LIST / STATUS mode — "what stories do we have" / "show todo stories"
- Read `userstories/README.md` and summarize. Don't re-read every file unless asked for detail on one.

## README.md index format

`userstories/README.md` groups stories by sprint — one table per sprint folder, in sprint-number order. Stories in `sprint-unassigned/` get their own table at the bottom.

```markdown
# User stories

Stories live in per-sprint folders (`sprint-N-<slug>/`). Priority + sprint grouping is in `BACKLOG.md`.

## Sprint 1 — Performance
| ID      | Title                    | Status      |
|---------|--------------------------|-------------|
| US-0001 | Add pause menu           | done        |
| US-0002 | Track high score         | in-progress |

## Sprint 2 — Waves
| ID      | Title                    | Status |
|---------|--------------------------|--------|
| US-0003 | Wave counter HUD         | todo   |

## Unassigned
| ID      | Title                    | Status |
|---------|--------------------------|--------|
| US-0004 | Multiplayer spike        | todo   |
```

Keep it in sync with story frontmatter — the frontmatter is the source of truth for **status**; the folder a story sits in is the source of truth for **sprint**.

## Rules

- **One behavior per story.** If you're writing "and" in the title, split it.
- **The Test section is mandatory.** No story ships without a precise test.
- **Never invent stories the user didn't ask for.** In CREATE mode, only author what was requested (splitting a broad ask into narrower stories is fine and encouraged — mention the split).
- **Don't refactor beyond the story** during IMPLEMENT. Story scope is the contract.
- **Update status honestly.** If a test can't be written yet (no test runner), say so; don't mark `done`.
- **Every story lives in a sprint folder.** Never write a story file directly under `userstories/`. If unsure, use `sprint-unassigned/`.
- **IDs are global, not per-sprint.** `US-0007` exists exactly once, regardless of which sprint folder it moves to.

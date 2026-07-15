---
name: archive-done
description: Move finished user stories and sprints into `userstories/done/`. Use when the user asks to "archive done stories", "move finished sprints to done", "close sprint N", "put shipped stories on the stack", "clean up userstories/", or when a sprint's stories all have `status: done` and should leave the active area. Keeps `userstories/` focused on active work by relocating completed folders/files into the `done/` stack and syncing `BACKLOG.md` + `README.md`.
---

# Archive-done skill

Owns the **`userstories/done/`** stack — the archive of shipped user stories and completed sprints. Keeps the top level of `userstories/` scoped to *active* work only.

- `user-stories` skill = author + implement individual stories.
- `story-backlog` skill = order/prioritize active work in `BACKLOG.md`.
- **`archive-done` skill = physically move finished stories/sprints into `done/` and update the index.**

## Directory layout

```
userstories/
  BACKLOG.md
  README.md
  sprint-1-<slug>/              # active sprint(s)
    US-0001-*.md
  done/                         # archive stack
    sprint-2-<slug>/            # whole sprint archived when all stories done
      US-0004-*.md
      US-0005-*.md
    US-0011-<slug>.md           # individual stories archived from an active sprint
```

Rules:
- The `done/` folder is created on first use if missing.
- Whole sprints move as folders — the folder name is preserved (`done/sprint-N-<slug>/`).
- Individual stories archived from a still-active sprint sit directly under `done/` (flat), tagged with their original sprint in the story frontmatter's `archived_from:` field.
- Never renumber sprints. Never rename archived folders. The archive is immutable history.
- Only stories with frontmatter `status: done` are eligible.

## Operating modes

### 1. SCAN — "what can be archived", "show me finished sprints"
- Read every `userstories/sprint-*/` folder.
- For each sprint: list stories, mark those with `status: done`.
- Report:
  - **Sprints ready to archive whole** — every story `status: done`.
  - **Individual done stories in still-active sprints** — candidates for flat archive.
  - **Not ready** — sprints with a mix of statuses (list what's still open).
- Do not move anything in SCAN mode. Just report.

### 2. ARCHIVE SPRINT — "archive sprint N", "close sprint N to done", "move sprint-2 into done"
- Verify every story in `sprint-N-<slug>/` has frontmatter `status: done`. If any is not, refuse and list the offenders.
- `mv userstories/sprint-N-<slug>/ userstories/done/sprint-N-<slug>/`
- Update `BACKLOG.md`:
  - Remove that sprint's section.
  - Add a compact bullet under a `## Done` section: `- ✅ **Sprint N — <name>** — \`done/sprint-N-<slug>/\` (US-XXXX, US-YYYY)`.
- Update `README.md`:
  - Remove the sprint's table.
  - Add its rows to the flat `## Done — \`done/\`` table with the `Sprint` column set to `done/sprint-N-<slug>`.
- Never delete files. Never edit story frontmatter during a sprint archive — the folder move IS the archive.

### 3. ARCHIVE STORY — "archive US-XXXX", "move done stories into done/"
- For each named id (or, if none named, every `status: done` story still in an active sprint):
  - Read the story file's frontmatter to confirm `status: done`.
  - Add `archived_from: sprint-N-<slug>` to the frontmatter (preserve every other field).
  - `mv userstories/sprint-N-<slug>/US-XXXX-*.md userstories/done/US-XXXX-*.md`.
- Update `BACKLOG.md`: remove the row from its sprint's table; add it to the `## Done` bullet/table.
- Update `README.md`: remove the row from the sprint's table; add it to the `## Done — \`done/\`` table.
- If archiving empties a sprint folder, do NOT auto-archive-the-sprint — ask the user whether to also remove the (now empty) sprint folder or leave it as a placeholder.

### 4. SYNC — "sync done", or automatically at the start of any other mode
- Cross-check `done/` against `BACKLOG.md` and `README.md`:
  - Story file in `done/` but not in the Done section of `BACKLOG.md`/`README.md` → add it.
  - Backlog Done section lists a story id with no file under `done/` → flag as stale, ask before removing.
  - Whole `done/sprint-N-*/` folder present but not summarized in Done → add the bullet.
- Never move files during SYNC without explicit user confirmation.

### 5. UNARCHIVE — "restore US-XXXX", "reopen sprint N"
- Rare. Only if the user explicitly asks.
- Story: read `archived_from:` frontmatter → move file back into that sprint folder, drop `archived_from`, ask user whether to reset `status` to `todo`/`in-progress`.
- Sprint: `mv userstories/done/sprint-N-<slug>/ userstories/sprint-N-<slug>/`, restore its section in `BACKLOG.md` and `README.md`.

## Update conventions

- **Sprint archive bullet in `BACKLOG.md` `## Done`**:
  ```
  - ✅ **Sprint 2 — Wave System** — `done/sprint-2-waves/` (US-0004, US-0005)
  ```
- **Story row in `README.md` `## Done — \`done/\`` table**:
  ```
  | ID      | Title                                     | Sprint                |
  |---------|-------------------------------------------|-----------------------|
  | US-0004 | Round/wave state machine …                | done/sprint-2-waves   |
  ```

## Rules

- **Only `status: done` stories are archivable.** If the user asks to archive something else, refuse and point at the `user-stories` skill to close it out first.
- **Folder move IS the archive.** Do not duplicate files, do not leave symlinks.
- **Never renumber sprints.** Sprint 2 is Sprint 2 forever, whether it lives in `sprint-2-*/` or `done/sprint-2-*/`.
- **Never delete story files.** Archive is append-only unless the user explicitly asks to UNARCHIVE.
- **Whole-sprint archive requires every story done.** No partial-sprint folder moves — split into individual story archives instead.
- **Keep `BACKLOG.md` and `README.md` in lockstep with disk.** Every archive action updates both.
- **The archive is history, not a backlog.** Don't include Priority/Effort/Value columns in Done listings — just id, title, and where it shipped.

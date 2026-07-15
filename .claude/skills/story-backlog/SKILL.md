---
name: story-backlog
description: Own the prioritized backlog and roadmap for user stories in `userstories/`. Use when the user asks "what's next", "reprioritize", "show the backlog", "what should I work on", "move US-X up", "what's the roadmap", or any question about priority, ordering, sprints, or the big picture of features. This skill owns `userstories/BACKLOG.md` — the single source of truth for priority and sprint grouping. The `user-stories` skill authors and implements individual stories; this skill decides the order and keeps the overview.
---

# Story Backlog skill

This skill owns **`userstories/BACKLOG.md`** — the sprint-grouped, prioritized overview of every user story. It is the source of truth for "what comes next" and "which sprint does this story belong to".

- `user-stories` skill = author + implement individual stories (files live in `userstories/sprint-N-<slug>/`).
- `story-backlog` skill = order, prioritize, group into sprints, keep the overview honest.
- `userstories/README.md` = flat sprint-grouped index (id/title/status), managed by `user-stories`.
- `userstories/BACKLOG.md` = **prioritized sprint roadmap, managed here.**

## Sprint model

Work is batched into **sprints**. Each sprint is a folder (`userstories/sprint-N-<slug>/`) and a section in `BACKLOG.md`. Sprints run top-to-bottom: finish sprint N before starting sprint N+1. Stories within a sprint are also ordered (top = do first).

- Sprint numbering is monotonic (1, 2, 3…). Never renumber existing sprints.
- Every story in `BACKLOG.md` belongs to exactly one sprint section (or to `Unassigned` if not yet slotted).
- A story's sprint is determined by which folder its file lives in — moving a story between sprints means moving the file.

## BACKLOG.md format

Single markdown file at `userstories/BACKLOG.md`. One section per sprint, in order.

```markdown
# Backlog — grouped into sprints

Last updated: YYYY-MM-DD

Sprints run top-to-bottom. Finish a sprint before starting the next. Story files live under `sprint-N-<slug>/`.

---

## Sprint 1 — Performance *(do first)* — `sprint-1-performance/`
Goal: <one line>.

| Prio | ID      | Title              | Priority | Effort | Value | Notes           |
|------|---------|--------------------|----------|--------|-------|-----------------|
| 1    | US-0001 | Fix crash          | P0       | S      | H     | blocker         |
| 2    | US-0002 | Object pooling     | P0       | M      | H     |                 |

**Definition of done:** <observable criterion for sprint completion>.

---

## Sprint 2 — Waves — `sprint-2-waves/`
Goal: <one line>.

| Prio | ID      | Title              | Priority | Effort | Value | Notes           |
|------|---------|--------------------|----------|--------|-------|-----------------|
| 1    | US-0004 | Wave state machine | P1       | M      | H     |                 |

**Definition of done:** <criterion>.

---

## Unassigned
Stories not yet slotted into a sprint. Files live in `sprint-unassigned/`.

| ID      | Title              | Priority | Effort | Value | Notes                    |
|---------|--------------------|----------|--------|-------|--------------------------|
| US-0011 | Multiplayer spike  | P3       | XL     | H     | needs design first       |

---

## Done
| ID      | Title              | Sprint | Completed  |
|---------|--------------------|--------|------------|
| US-0000 | Basic movement     | 1      | 2026-07-14 |
```

### Column meanings
- **Prio** — ordinal within the sprint (1 = do first). Renumber on any reorder.
- **Priority** — `P0` (must ship / blocker), `P1` (should ship), `P2` (nice), `P3` (someday).
- **Effort** — `XS` (<15 min), `S` (<1h), `M` (<half day), `L` (day), `XL` (multi-day → probably split).
- **Value** — `H` / `M` / `L`. Rough impact on player experience or unblocking.
- **Notes** — dependencies, blockers, links. Keep terse.

Sections:
- **Sprint N** — one section per sprint folder, in numeric order. Contains a Goal, an ordered table, and a Definition of Done.
- **Unassigned** — stories that exist on disk in `sprint-unassigned/` but haven't been slotted yet.
- **Done** — completed stories, compact rows with the sprint they shipped in.

## Operating modes

### 1. INIT — file missing
- Scan `userstories/sprint-*/` folders and `userstories/sprint-unassigned/`.
- Build one section per sprint folder in numeric order.
- Group stories by their folder; use frontmatter status to route done stories to the **Done** section.
- Propose Goal + Definition of Done per sprint from story titles; ask user to confirm/edit.

### 2. SHOW — "what's next", "show backlog", "roadmap", "what sprint am I on"
- Read `BACKLOG.md` and summarize the current sprint (first sprint with any `todo`/`in-progress` rows) and the next 1-2 upcoming sprints. Don't dump the whole file unless asked.

### 3. REPRIORITIZE — "move US-X up", "US-Y is now P0", "swap 3 and 4", "move US-X to sprint 3"
- Within-sprint reorder → edit that sprint's table, renumber **Prio**.
- Move-between-sprints → also **move the story file** on disk from `sprint-A-*/` to `sprint-B-*/`, then update both sprint tables (remove from source, add to destination bottom or specified position) and the `README.md` index.
- Update the `Last updated:` date to today.
- Never silently reorder unrelated rows.

### 4. SPRINT MANAGEMENT — "create a new sprint", "close sprint N", "rename sprint N"
- **Create**: next sprint number = max existing + 1. `mkdir userstories/sprint-N-<kebab-slug>/`. Add a new section to `BACKLOG.md` with Goal + empty table + Definition of Done. Ask user which stories (if any) to move in.
- **Close**: verify every story in the sprint has `status: done` in frontmatter. Move all rows to **Done** section (with Sprint column = N). Remove the sprint section from `BACKLOG.md`. Leave the folder on disk (historical record) or archive per user preference.
- **Rename**: rename the folder AND update the sprint section header + any references. IDs and files inside are untouched.

### 5. SYNC — "sync backlog", or run automatically at the start of any other mode
Cross-check `BACKLOG.md` against the filesystem:
- Story file exists in `sprint-N-*/` but missing from that sprint's table → add to bottom of that sprint and flag.
- Backlog references a story id with no file → flag as stale, ask whether to remove.
- Story file's folder doesn't match its backlog sprint section → the folder wins; move the row.
- `status: in-progress` in frontmatter → ensure it sits at the top of its sprint's table.
- `status: done` in frontmatter but not in **Done** section → move it, add Sprint column, drop effort/value/priority.

Sources of truth:
- **Sprint membership** → the folder the story file is in.
- **Status** → the story's frontmatter.
- **Priority / Effort / Value / ordering** → `BACKLOG.md`.

### 6. GROOM — "groom the backlog", "what should we drop"
- Suggest splits for `XL` effort rows, demotions for stale `P2/P3` rows, promotions when notes mention blockers that just cleared, and consolidation of sprints that have grown too large. Propose — do not apply without confirmation.

## Rules

- **Priority = row order within a sprint.** If you change Prio numbers, actually reorder the rows to match. No mismatches.
- **Sprints run in order.** Never suggest starting sprint N+1 while sprint N still has non-done stories, unless the user explicitly asks to parallelize.
- **One story, one sprint.** Never list the same id in two sprint sections.
- **Update `Last updated:`** on every write.
- **Don't invent stories.** This skill orders and groups existing stories; it does not author new ones. If a needed story doesn't exist, tell the user to use the `user-stories` skill to create it first.
- **Don't change story files' status.** That belongs to the `user-stories` skill during IMPLEMENT. This skill only moves rows between sections to *reflect* status changes.
- **Moving between sprints = moving files.** Never edit only the backlog; the folder is the source of truth for sprint membership.
- **Keep it terse.** BACKLOG is a decision surface, not documentation. If a row's Notes need a paragraph, put it in the story file and link the id.

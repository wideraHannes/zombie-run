---
name: plan-and-delegate
description: Plan a multi-step feature or sprint before touching code, save the plan to disk, then delegate implementation to subagents so main context stays clean. Use when the user asks to "plan X", "plan phase/sprint/feature X", "write a plan and implement", or when a task spans multiple stories/files and would otherwise flood main context. Always forks context — planning runs in a Plan subagent, each implementation slice runs in its own claude subagent, main thread only orchestrates.
---

# plan-and-delegate skill

**Rule of the skill: main thread never reads code, never edits code.** It only orchestrates. All reading, planning, and implementing happens inside forked subagent contexts. This keeps the main window free of file contents, diffs, and search noise.

## When to use

- User says "plan phase 2", "plan sprint 3", "plan this feature", "write a plan for X".
- User says "plan and implement" or "plan then delegate".
- A request spans ≥2 stories or ≥3 files and would otherwise pull large chunks into main context.

Skip for one-file edits or single-story work — that's what `user-stories` / `tdd` already cover.

## Workflow (three phases, all forked)

### Phase 1 — Plan (forked to `Plan` subagent)

Spawn one `Plan` subagent with a self-contained brief. It must:
1. Read the relevant source, stories, or backlog.
2. Produce a written plan as a **file on disk** at a location that fits the work:
   - Sprint work → `userstories/sprint-N-<slug>/PLAN.md`
   - Feature work → `docs/plans/<feature>-PLAN.md` (create dir if needed)
   - Ask the user if unclear.
3. Return **only** a ≤200-word summary: the path it wrote, the list of implementation slices with IDs, and any decisions the user should confirm.

Do **not** ask the `Plan` agent to paste the full plan back into its reply — the file is the artifact, the reply is the handoff.

After the Plan agent returns:
- Show the user the summary + path.
- If the user needs to confirm anything, ask via `AskUserQuestion` before Phase 2.

### Phase 2 — Confirm & slice

Before delegating, verify the plan file exists (one `Bash` `ls` is fine — do not `Read` it into main context unless the user asks).

Split the plan into **independent implementation slices**. A slice = one story, one file group, or one PR-sized unit. Slices must be safe to run in parallel (no shared file writes; or serialize them if not).

### Phase 3 — Delegate implementation (forked, parallel when safe)

For each slice, spawn a `claude` subagent (or `general-purpose` if broad research is needed). Each brief must:
- Point to the plan file path — the agent reads it, main thread does not.
- Name the exact slice (story ID, files, or section heading in the plan).
- State the acceptance criteria and how to verify (tests, `npm run build`, manual check).
- Require the agent to run the project's test/build gate before returning.
- Ask for a ≤150-word report: files changed, tests added, verification result.

Launch parallel slices in a **single message with multiple `Agent` tool calls**. Serialize only when slices touch the same file.

After all agents return:
- Summarize outcomes to the user in 2–3 sentences.
- Surface any failures or open questions immediately — do not paper over them.

## Guardrails

- **Never read source files in the main thread.** If you catch yourself about to `Read` or `Grep`, stop and delegate.
- **Never edit files in the main thread.** All `Edit`/`Write` happens inside subagents.
- **Exception:** you may `Bash ls` / `Bash cat <small-file>` for orchestration checks (path existence, plan file present) — but not to load code into context.
- If the user pushes back on the plan, update the plan file via a fresh `Plan` subagent, not by rewriting inline.
- Track the phases with `TaskCreate` when there are ≥3 slices — one task per slice, updated as agents finish.

## Anti-patterns

- Reading the whole codebase in main thread "just to understand" before planning — that's what the Plan agent is for.
- Pasting the full plan into chat instead of writing it to disk.
- One giant implementation agent doing "everything in the plan" — split into slices so context stays small and failures are localized.
- Skipping the plan file and jumping straight to implementation agents — the plan file is the shared contract between agents.

## Example

User: "plan phase 2 and implement it"

1. Spawn `Plan` agent → writes `userstories/sprint-2-waves/PLAN.md`, returns summary listing US-0004 and US-0005 as slices.
2. Show summary. If OK, proceed.
3. Spawn two `claude` agents **in parallel** (one message, two `Agent` calls):
   - Agent A: "Implement US-0004 per `userstories/sprint-2-waves/PLAN.md` §US-0004. TDD via vitest. Report changed files + test result."
   - Agent B: "Implement US-0005 per same plan §US-0005. Depends on US-0004 state fields — wait for A if file conflict, else parallel."
   (If they touch `useGameEngine.js`, serialize B after A.)
4. Report results to user.

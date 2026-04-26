# Superpowers — Feature Development Workflow

Six-phase workflow from idea to merged code. Never skip phases. Never
advance past a gate without explicit user approval.

---

## Before Starting

Read `PROJECT.md` at the project root. Confirm two things:

1. The requested feature aligns with the current phase or active backlog.
2. No other feature is currently in-progress (working agreement: one
   frontend issue at a time).

If there's a conflict, surface it before doing anything else:
> "PROJECT.md shows [X] is currently in-progress. Should we pause that
> and start this instead, or finish [X] first?"

**Skip-brainstorm exception:** If the user says "skip the brainstorm,
just do it" — allow it for clearly small, bounded tasks. Still write a
brief spec (minimum 3–5 bullet points). Never skip the spec entirely.

---

## Phase 1 — Brainstorm

Ask 2–4 targeted clarifying questions. Make them specific to this
project and this feature — not generic ("tell me more"). Questions
should surface:

- **Goal**: What outcome does this create, for which user?
- **Scope**: What is explicitly out of scope?
- **Constraints**: Technical, design, or business limits that apply.
- **Success**: How will we know it worked?

Draw on PROJECT.md, DESIGN.md, and PRODUCT.md when forming questions.
A good brainstorm question names something concrete from the codebase.

**Gate:** Do not proceed to Phase 2 until the user has answered.

---

## Phase 2 — Spec

Write a spec to `.claude/skills/superpowers/spec.md`. This file is
overwritten each run — it's a session artifact, not a permanent record.
The permanent record goes in PROJECT.md at the end.

Template:

```markdown
# Spec: [Feature Name]
Date: [today]

## Goal
One sentence. What this does and why it matters.

## User Impact
Specific. "A returning customer can now..." not "users will be able to..."

## Scope
**In:** What this includes.
**Out:** What this explicitly does not include.

## Success Criteria
- [ ] Observable, testable criterion
- [ ] Observable, testable criterion
- [ ] Observable, testable criterion

## Dependencies
Files, components, routes, or services this touches.

## Risks / Open Questions
Anything unresolved that could affect execution.
```

Show the spec to the user.

**Gate:** Wait for explicit approval ("looks good", "go", "approved",
or equivalent) before proceeding. Offer to revise if the user has
changes.

---

## Phase 3 — Plan

Break the approved spec into ordered tasks using TaskCreate. Rules:

- Each task is one concrete action. Not "build the feature" — "add
  `Cabinet Grotesk` import to `layout.tsx`".
- Set `blockedBy` dependencies where order matters.
- Last task is always: "Run review and merge (Phase 5–6)".

Show the full task list after creating it.

**Gate:** Wait for "go" before executing.

---

## Phase 4 — Execute

Work through tasks one at a time, in dependency order:

1. Mark the task `in_progress` via TaskUpdate **before** touching code.
2. Make the change.
3. Show what changed: file path, lines added/removed, what it does.
4. Ask the user to verify on localhost before marking `completed`.

Do not start the next task until the current one is confirmed working.
If verification is blocked (dev server not running, etc.), say so
explicitly rather than assuming it works.

---

## Phase 5 — Review

Run `/impeccable audit` on every component touched in Phase 4.
Show the full score table.

**16–20:** Proceed to Phase 6.

**Under 16:** List the specific findings dragging the score. Offer:
> "Want me to run a polish pass before merging?"

If yes, apply the skills run order from the working agreements:
`typeset → animate → layout → harden → polish`
then re-run audit and show the delta.

Do not proceed to Phase 6 until the score is 16+ or the user explicitly
waives the threshold.

---

## Phase 6 — Merge

Steps in order:

1. **Pre-deploy check** — run `/predeploy` if
   `.claude/commands/predeploy.md` exists. Otherwise run manually:
   - `npm run build` — verify no errors
   - Scan for leftover `console.log` statements
   - List all files changed since last commit

2. **Commit** — write a message that summarizes the feature, not just
   the files changed.

3. **Push** — push to origin, confirm success, show the remote URL.

4. **Update PROJECT.md**:
   - Move completed tasks to "Done This Session"
   - Add a Decisions Log entry for any non-obvious choices made
   - Remove from Active Backlog anything now resolved
   - Update Current Phase if it changed

5. **Commit PROJECT.md** with message: `"Update PROJECT.md after [feature name]"`

Confirm everything pushed cleanly before declaring done.

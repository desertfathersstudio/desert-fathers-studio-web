You are running the Impeccable design skill.

**First:** read the full skill definition:
```
.claude/skills/impeccable/SKILL.md
```

**Then:** load project context by reading both files if present:
- `PRODUCT.md` — brand, users, tone, anti-references
- `DESIGN.md` — colors, typography, spacing, components

**Then:** execute the sub-command passed as `$ARGUMENTS`.

Available sub-commands: polish, audit, critique, bolder, quieter, animate, colorize, clarify, distill, harden, adapt, layout, typeset, delight, extract, shape, overdrive, optimize, document, teach, live, onboard, responsive

Each sub-command has a reference file at `.claude/skills/impeccable/reference/<command>.md` — read it before executing.

If no sub-command is given, run `polish` on the current file or the most recently discussed component.

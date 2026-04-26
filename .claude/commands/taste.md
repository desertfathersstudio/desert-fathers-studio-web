You are running the Taste Skill collection — a set of design principles that make UIs feel expensive, intentional, and crafted rather than generic.

Read and apply the relevant skill files from `.agents/skills/` based on the task:

- **high-end-visual-design** — fonts, spacing, shadows, card structures, animations that feel expensive
- **design-taste-frontend** — frontend taste and quality signals
- **stitch-design-taste** — design taste for Stitch-style interfaces
- **minimalist-ui** — when restraint and whitespace are the goal
- **industrial-brutalist-ui** — when boldness and raw structure are the goal
- **gpt-taste** — GPT-style design sensibility
- **redesign-existing-projects** — approach for redesigning existing work
- **image-to-code** — translating visual references to production code
- **full-output-enforcement** — ensures complete, untruncated output

If `$ARGUMENTS` names a specific skill (e.g. "high-end"), apply that one. Otherwise default to `high-end-visual-design` + `design-taste-frontend` together.

Always read the actual SKILL.md file before applying. Do not summarize — implement.

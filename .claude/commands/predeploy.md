Run a pre-deploy verification sequence. Work through each step in order. Stop and report if any step fails — do not continue to the next step.

## Step 1 — Dev build check

Run the dev server in check mode:

```bash
cd dfs-website && npm run build 2>&1
```

If there are TypeScript errors, missing modules, or build failures: **stop here**, report what failed, and do not proceed.

## Step 2 — Production build

Run the production build and verify it exits cleanly:

```bash
npm run build
```

Report the output size summary. If the build fails for any reason: **stop here**.

## Step 3 — Leftover console.log statements

Search for any `console.log` calls left in source files (excluding node_modules and .next):

```bash
grep -r "console\.log" --include="*.ts" --include="*.tsx" --include="*.js" \
  --exclude-dir=node_modules --exclude-dir=.next -n .
```

List every match with file and line number. Note: `console.error` and `console.warn` are acceptable — only flag `console.log`.

## Step 4 — Environment variables

Check that required env vars are present:

```bash
cat .env.example
```

Then verify each key listed in `.env.example` exists in `.env.local`. Report any that are missing or empty.

## Step 5 — Changed files since last commit

```bash
git status
git diff --stat HEAD
```

List all modified, added, and deleted files. Summarize what's changed so the user can confirm the scope of the push is intentional.

## Step 6 — Confirm

Present a summary table:

| Check | Status |
|---|---|
| Dev build | ✓ / ✗ |
| Production build | ✓ / ✗ |
| console.log statements | N found / none |
| Env vars | ✓ / missing: X |
| Changed files | N files |

Then ask:

> Everything looks good. Ready to push? (yes / no)

Do not run `git push` until the user explicitly confirms. If the user says yes, push with:

```bash
git push
```

Then confirm the push succeeded and print the remote URL.

# Database Restore Runbook

## When to use this

Use this if the Supabase database is corrupted, accidentally deleted, or you need to roll back to a prior state.

## Prerequisites

- `psql` installed locally
- `SUPABASE_DB_URL` — get from Supabase Dashboard → Project Settings → Database → Connection String (URI)
- A `.sql.gz` backup file from `scripts/backup-db.sh` or the GitHub Actions artifacts

## Steps

### 1. Download the backup

From GitHub Actions: Actions tab → Weekly DB Backup → select a run → download artifact.

### 2. Decompress

```bash
gunzip dfs-backup-YYYY-MM-DD_HH-MM-SS.sql.gz
```

### 3. Restore (DESTRUCTIVE — drops existing data)

```bash
# Drop all existing data in public schema first
psql "$SUPABASE_DB_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Restore
psql "$SUPABASE_DB_URL" < dfs-backup-YYYY-MM-DD_HH-MM-SS.sql
```

### 4. Re-apply RLS

After restore, RLS policies need to be re-applied. Run all migrations in order:

```bash
# From Supabase dashboard, run each migration in supabase/migrations/ in order
```

### 5. Verify

```bash
psql "$SUPABASE_DB_URL" -c "SELECT COUNT(*) FROM products;"
psql "$SUPABASE_DB_URL" -c "SELECT COUNT(*) FROM wholesale_orders;"
psql "$SUPABASE_DB_URL" -c "SELECT COUNT(*) FROM retail_orders;"
```

### 6. Clear Vercel cache

```bash
# Trigger a redeployment to clear any cached data
vercel deploy --prod
```

## Contacts

- Supabase Dashboard: https://supabase.com/dashboard/project/wzzdynhsjiskqfpwghdn
- GitHub repo: https://github.com/desertfathersstudio/desert-fathers-studio-web
- Owner: desertfathersstudio@gmail.com

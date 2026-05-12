# Next Session Handoff — 2026-05-12

## What was done this session

### Bug fixes

**Bug 1: Wholesale catalog intermittently shows "0 designs"**

Root cause: `ws_auth` session cookie has a 24-hour TTL. `sessionStorage` outlives it. When the cookie expires, `/api/wholesale/products` returns HTTP 401. The dashboard was calling `r.json()` without checking `r.ok`, so `{ error: "Unauthorized" }` was silently treated as an empty product list. Same for `/api/wholesale/last-modified` (also auth-gated), which caused the "Updated [timestamp]" to go missing.

Fix (`app/wholesale-portal/dashboard/page.tsx`): Check `r.status === 401` on the products fetch — clear `sessionStorage` and redirect to `/wholesale-portal`. Separate `!r.ok` guard added for `last-modified` fetch.

**Bug 2: PK-3 (Door of Prophecies Pack) showing in public /packs shop**

Root cause: Migration 023 retroactively set `coming_soon = true` on zero-stock products, but only where `can_buy_individually = true`. Pack product header rows have `can_buy_individually = false` — PK-3 was skipped. The packs page checks `coming_soon` to gate shop visibility, so PK-3 leaked through.

Fix 1 (`supabase/migrations/028_pk3_coming_soon.sql`): Set `coming_soon = true` on all PK-3+ pack products (excludes PK-1/RP and PK-2/HWP which are live).  
Fix 2 (`app/(d2c)/packs/page.tsx`): Added inventory gate — skip packs where all tracked constituent stickers have `on_hand = 0`. This prevents any future 0-inventory pack from leaking even without `coming_soon = true`.

### Other changes (earlier in session)

- Single sticker retail price updated: $1.50 → $2.00 (migration 027 + ProductDetailDrawer fallback)
- Holy Week Pack BACK image re-uploaded to R2 (new version, same filename → auto-refreshes everywhere)
- Admin supplier order design picker: category filter chips + Select All (same pattern as wholesale OrderTab)
- Fixed "no designs found" in supplier order modal — products table uses `categories(name)` FK join, not a bare `category` column
- Wholesale cart sticker count fixed in floating FAB and header badge (used raw qty instead of pack-aware count)

---

## Pending: migration to run

**Run `028_pk3_coming_soon.sql` in Supabase SQL Editor** — this is the only pending migration. Everything else has been applied.

```sql
UPDATE products
SET coming_soon = true
WHERE sku ~ '^PK-\d+$'
  AND sku NOT IN ('PK-1', 'PK-2')
  AND coming_soon = false;
```

Expected: 1 row updated (PK-3).

---

## Architecture reminders

- Wholesale session: `ws_auth` cookie (server, `path: /api/wholesale`, 24h TTL) + `sessionStorage` (client, survives tab close in some browsers). Always check API responses for 401 before treating as empty data.
- Pack visibility gating: `coming_soon` column on the pack's product row gates `/packs` page. `active` column on `sticker_packs` gates the query entirely. Constituent sticker inventory determines `availability` dict passed to `PacksGrid`.
- Images: R2 → WebP at 800px. Cache-busted via `image_updated_at` column appended as query param.
- Wholesale accounts: two files — `config/wholesale-accounts.ts` (client-safe) and `lib/wholesale/accounts-server.ts` (server-only with PINs). Both must be kept in sync.

---

## Known remaining items (from memory/todo)

- `RESEND_FROM_EMAIL` env var should be set to a verified Resend domain address (currently may be using unverified sender)
- Wholesale UI redesign is pending (noted in memory/project_todo.md)

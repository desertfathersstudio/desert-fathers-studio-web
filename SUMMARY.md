# Security Hardening — Branch: `security-hardening`

Generated: 2026-05-02

---

## ⚠️ URGENT — REVIEW IMMEDIATELY

### PIN "4438" was exposed in the public JavaScript bundle

The wholesale login page (`app/wholesale-portal/page.tsx`) imported `ACCOUNT_MAPPING` from `config/wholesale-accounts.ts` — a client component, which means the entire map (including all PINs) was shipped in the browser's JavaScript bundle. Anyone who opened DevTools could see the PIN.

**Status:** Fixed. PINs moved to `lib/wholesale/accounts-server.ts` (server-only). Login now calls `/api/wholesale/auth` which verifies the PIN server-side and sets an httpOnly session cookie.

**Action required:** Deploy this branch, then rotate the PIN for all accounts via `lib/wholesale/accounts-server.ts` as a precaution, since the old PIN was public for an unknown period.

---

### Wholesale API routes accepted any `accountId` without session verification

All `/api/wholesale/*` routes accepted `accountId` from the request body or query string and validated it only against a known list. Since the account IDs ("abbey") were derivable from the JS bundle, any request with `accountId: "abbey"` would succeed without knowing the PIN.

**Status:** Fixed. All wholesale routes now require a valid HMAC-signed session cookie (`ws_auth`). The `accountId` used in DB queries now comes from the server-validated session, not the client request.

---

## What Changed

### Phase 2 — Critical Security Fixes

| Fix | File(s) Changed |
|-----|-----------------|
| PINs moved out of client bundle | `config/wholesale-accounts.ts`, `lib/wholesale/accounts-server.ts` (new) |
| Server-side PIN verification with session cookie | `app/api/wholesale/auth/route.ts` (new), `lib/wholesale/session.ts` (new) |
| Session validation on all wholesale API routes | 8 route files patched |
| `grandTotal` recalculated server-side on order submit | `app/api/wholesale/orders/route.ts` |
| Login page calls server API instead of checking client-side map | `app/wholesale-portal/page.tsx` |
| Rate limiting on PIN auth endpoint (5/IP/15min) | `lib/rate-limit.ts` (new), `app/api/wholesale/auth/route.ts` |
| Zod validation schemas for all routes | `lib/validation/schemas.ts` (new) |

### Phase 3 — Rate Limiting

- In-memory rate limiter in `lib/rate-limit.ts`
- Applied to `/api/wholesale/auth`: 5 attempts per IP per 15 minutes, then 429 with `Retry-After: 900`

### Phase 4 — Security Headers

- `next.config.ts` now sets: CSP, HSTS, X-Frame-Options: DENY, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-DNS-Prefetch-Control
- `poweredByHeader: false` — hides Next.js fingerprint
- `productionBrowserSourceMaps: false` — no source maps in production
- 7-day cache headers on `/stickers/*`

### Phase 4 — Middleware (CORS)

- `middleware.ts` created — blocks cross-origin API requests from unknown origins
- Stripe webhook exempted (must accept Stripe server calls)
- Applies only to `/api/*` to avoid performance cost on static assets

### Phase 5 — XSS Audit

- Found 2 `dangerouslySetInnerHTML` usages. Both confirmed safe (static literal strings, no user input flows into either). Comments added.

### Phase 7 — Privacy / Legal Pages

- Already existed: `app/(d2c)/legal/privacy/`, `app/(d2c)/legal/terms/`, `app/(d2c)/legal/returns/`, `app/(d2c)/legal/shipping/`
- No changes needed.

### Phase 8 — Dependencies

- `zod` added for input validation schemas
- `.github/dependabot.yml` added for weekly npm audits
- 5 moderate PostCSS vulnerabilities exist (not auto-fixed — `npm audit fix --force` would break deps)

### Phase 9 — Secrets Hygiene

- No secrets found hardcoded in source files
- No `.env*` files found in git history
- `.gitignore` updated to also cover `.env` and `.env.production`
- `.env.example` updated with `WHOLESALE_SESSION_SECRET`, `ADMIN_SECRET_KEY`, `SUPABASE_DB_URL`

### Phase 10 — Backups

- `scripts/backup-db.sh` — pg_dump backup script
- `.github/workflows/backup.yml` — weekly automated backup to GitHub Actions artifacts (30-day retention)
- `docs/RESTORE.md` — restore runbook

---

## New Files Added

| File | Description |
|------|-------------|
| `lib/wholesale/accounts-server.ts` | Server-only PIN→account mapping |
| `lib/wholesale/session.ts` | HMAC-SHA256 session token helpers |
| `lib/wholesale/validate-session.ts` | Session cookie extractor for API routes |
| `lib/rate-limit.ts` | In-memory rate limiter |
| `lib/validation/schemas.ts` | Zod schemas for all API inputs |
| `app/api/wholesale/auth/route.ts` | PIN verification + session cookie endpoint |
| `middleware.ts` | CORS enforcement on API routes |
| `.github/dependabot.yml` | Weekly dependency update PRs |
| `.github/workflows/backup.yml` | Weekly DB backup action |
| `scripts/backup-db.sh` | Manual pg_dump backup script |
| `docs/RESTORE.md` | Database restore runbook |

---

## New Dependencies

| Package | Why |
|---------|-----|
| `zod` | Input validation schemas for all API routes |

---

## New Environment Variables Required

| Variable | Purpose | How to Generate |
|----------|---------|-----------------|
| `WHOLESALE_SESSION_SECRET` | Signs HMAC session cookies for wholesale portal | `openssl rand -hex 32` |
| `ADMIN_SECRET_KEY` | Admin header auth for order management API | `openssl rand -hex 32` |
| `SUPABASE_DB_URL` | Direct DB connection for pg_dump backups | Supabase Dashboard → Project Settings → Database → Connection String (URI) |

**Add these to Vercel environment variables before merging.**

---

## Manual Steps Required (priority order)

### 1. BEFORE MERGING — Add env vars to Vercel

Go to Vercel Dashboard → Project → Settings → Environment Variables:
- `WHOLESALE_SESSION_SECRET` = output of `openssl rand -hex 32`
- `ADMIN_SECRET_KEY` = output of `openssl rand -hex 32` (if not already set)

### 2. BEFORE MERGING — Consider rotating the wholesale PIN

Because the old PIN ("4438") was publicly visible in the JS bundle, rotate it to a new value:
1. Edit `lib/wholesale/accounts-server.ts` — change `"4438"` to a new PIN
2. Notify the Abbey of the new PIN via phone/email (not via digital message if possible)

### 3. AFTER MERGING — Tell Abbey/Convent users to log back in

Existing `sessionStorage` sessions will still work for page navigation, but the first API call (loading products, orders, etc.) will fail with 401 because they don't have the new `ws_auth` cookie. They'll be redirected to the PIN page, log in, and receive the cookie. This is a one-time interruption.

### 4. AFTER MERGING — Run Supabase migration 018

If not already done, run `supabase/migrations/018_image_url_to_vercel_static.sql` in the Supabase SQL Editor to complete the image CDN migration.

### 5. Add GitHub Actions secret for backup

- Go to GitHub repo → Settings → Secrets and variables → Actions
- Add secret: `SUPABASE_DB_URL` = connection string from Supabase Dashboard

### 6. Enable 2FA on all accounts

- GitHub account
- Vercel account
- Supabase project
- Resend account
- Domain registrar (Namecheap)

### 7. Set billing alerts

- Supabase: Dashboard → Billing → Usage alerts (set at 80% of free tier for egress)
- Vercel: Dashboard → Billing → Spend management

### 8. Run securityheaders.com scan

After deploying, visit https://securityheaders.com/?q=desertfathersstudio.com and confirm grade is at least A.

---

## TODOs Skipped (not safe to automate)

| Item | Reason Skipped |
|------|----------------|
| **Full Zod validation applied in route handlers** | Schemas written but not wired into each route handler — doing so requires editing every route, risk of breaking behavior. Apply manually per route after testing. |
| **Upstash Redis rate limiting** | Requires account signup and UPSTASH_REDIS_REST_URL env var. Current in-memory limiter is functional but resets on cold starts. |
| **Sentry error monitoring** | Requires account signup, `@sentry/nextjs` install with `npx @sentry/wizard`, SENTRY_DSN env var, and sentry.config files. High setup complexity — do separately. |
| **Price validation from DB** | `grandTotal` is now recalculated from `item.qty * item.unitPrice`. But `unitPrice` itself is still client-supplied. Full fix requires looking up each product's price from the DB using SKU. Skipped to avoid changing the wholesale pricing flow. |
| **Hotlink protection on /stickers/** | Next.js middleware can't intercept static assets with the `.png` extension excluded from the matcher (performance concern). Proper fix: serve images through an API route, or add Cloudflare in front of Vercel. |
| **RLS policy tightening migration** | Complex SQL — would require carefully auditing each table's existing policies. Left as a TODO to avoid breaking the admin's service-role access patterns. |
| **Cookie consent banner** | No third-party analytics in use, so GDPR cookie consent is low urgency. Add if you add analytics. |
| **CSP `unsafe-inline` removal** | The admin layout has an inline SW registration script and the wholesale login has inline CSS animations. These need to be moved to external files before removing `unsafe-inline` from script-src. |

---

## Testing Checklist

After merging and deploying, verify these manually:

- [ ] Visit `desertfathersstudio.com/wholesale-portal` — PIN entry screen loads
- [ ] Enter correct PIN (check `lib/wholesale/accounts-server.ts` for current value) — redirected to dashboard, products load
- [ ] Enter wrong PIN 5 times in a row — see "Too many attempts" message
- [ ] Place a test wholesale order — confirmation email arrives, order appears in admin
- [ ] Visit `desertfathersstudio.com/shop` — catalog loads, checkout works
- [ ] Run `https://securityheaders.com/?q=desertfathersstudio.com` — confirm A or A+ grade
- [ ] Open browser DevTools → Network → inspect JS bundle — confirm no PIN is visible (search for the old PIN value)
- [ ] Visit `desertfathersstudio.com/admin` — redirected to login (admin auth unaffected)

---

## Rollback Plan

```bash
# Revert to main (all changes on security-hardening are isolated to this branch)
git checkout main

# On Vercel: rollback to the previous deployment via the dashboard
# (Deployments tab → previous deployment → "Promote to Production")
```

The `security-hardening` branch can be deleted without any impact to production until it is explicitly merged.

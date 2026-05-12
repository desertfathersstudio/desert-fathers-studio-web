# Deploy Checklist

Deployments happen automatically on push to `main` via Vercel. This checklist covers the manual steps that code changes alone don't handle.

---

## Before pushing code

- [ ] Run `npx tsc --noEmit` — zero TypeScript errors
- [ ] Review `git diff` — no `.env` files, no secrets, no hardcoded PINs or credentials
- [ ] If changing a DB schema: write a migration in `supabase/migrations/` (next sequential number)

---

## After pushing (when a migration was included)

1. **Run the migration** in Supabase SQL Editor (Dashboard → SQL Editor)
   - Paste the new `.sql` file contents
   - Verify: no errors, affected rows match expectations
2. **Check MIGRATION.md** — update the status column from ⏳ to ✅
3. **Force a redeploy** on Vercel if needed (deployments with server components cache schema inferences)

---

## When adding a new wholesale account

1. Add to `config/wholesale-accounts.ts` (client-safe: pricing, qty options, display info)
2. Add to `lib/wholesale/accounts-server.ts` (server-only: PIN, pricing overrides)
3. Both files must have the same `accountId`
4. No migration needed — accounts are in config, not DB

---

## When adding a new sticker pack (PK-N)

1. Insert into `sticker_packs` table with `active = true`
2. Insert pack product into `products` table with `coming_soon = true` initially
3. Insert constituent sticker products with `pack_id` pointing to the sticker_pack row
4. Upload pack image to R2 via admin UI or `scripts/upload-sticker-images.mjs`
5. When ready to sell: set `coming_soon = false` on the pack product row

---

## When updating a sticker image

1. Upload new image via admin UI (converts to WebP automatically)
2. The `image_updated_at` column is bumped automatically, busting CDN cache
3. Hard-refresh in browser to verify

---

## Environment variables (required in Vercel)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role (server only) |
| `WHOLESALE_SESSION_SECRET` | HMAC secret for wholesale session tokens |
| `R2_ACCOUNT_ID` | Cloudflare R2 account |
| `R2_BUCKET_NAME` | R2 bucket name |
| `R2_ACCESS_KEY_ID` | R2 access key |
| `R2_SECRET_ACCESS_KEY` | R2 secret |
| `R2_PUBLIC_URL` | Public CDN URL for R2 bucket |
| `RESEND_API_KEY` | Resend API key for transactional email |
| `RESEND_FROM_EMAIL` | Verified sender (must match Resend domain) |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |

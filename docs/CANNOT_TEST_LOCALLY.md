# What Cannot Be Tested Locally

## Authentication flows

- **Wholesale session cookie expiry bug** — The `ws_auth` cookie is scoped to `path: "/api/wholesale"` with a 24-hour TTL. To reproduce the intermittent "0 designs" bug, you'd need to wait 24 hours or manually expire the cookie while keeping `sessionStorage` alive. Use browser DevTools → Application → Cookies → delete `ws_auth` while keeping the tab open to simulate it.
- **Admin passkey auth** — Requires a registered FIDO2 authenticator (Touch ID / Face ID). Works in production browsers; local dev needs a real device or a software authenticator.

## Email (Resend)

- Transactional emails (order confirmation, discount notification) are sent via Resend using the verified domain `desertfathersstudio.com`. Sending from localhost will fail DKIM validation. Test email flows in a staging deployment or by checking Resend dashboard logs.
- The `RESEND_FROM_EMAIL` env var must be set to a verified Resend domain address.

## Cloudflare R2 image uploads

- Image upload (`/api/admin/upload-image`) writes to R2 using credentials in `.env.local`. This works locally if credentials are set, but the public CDN URL (`R2_PUBLIC_URL`) will show the live images regardless of environment. Changes to images are immediate and global — there is no staging R2 bucket.

## Stripe

- Stripe webhooks require a public URL. Use `stripe listen --forward-to localhost:3000/api/webhooks/stripe` to test locally, or test via Stripe Dashboard event simulation.

## Supabase RLS policies

- RLS policies enforce row-level security. When using the service-role client (most admin and API routes), RLS is bypassed — behavior matches production. When using the anon client, RLS applies. Verify RLS behavior against production Supabase, not local assumptions.

## Vercel-specific behavior

- `export const dynamic = "force-dynamic"` on server pages prevents ISR caching. In local dev, all pages are effectively dynamic anyway. Caching edge cases only appear on Vercel.
- `after()` from `next/server` (used for post-response email sending) runs after the response is sent. In local dev it executes synchronously in the same process, which is functionally equivalent but timing differs from production.

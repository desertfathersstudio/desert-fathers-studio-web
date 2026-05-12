# Local Development Setup

## Prerequisites

- Node.js 20+ (check: `node -v`)
- pnpm or npm
- Access to `.env.local` (get from Jerome — contains Supabase, R2, Stripe, Resend credentials)

## First time setup

```bash
cd "dfs-website"
npm install

# Copy env file (get from team)
cp .env.local.example .env.local   # then fill in real values
```

## Running the dev server

```bash
npm run dev
```

App runs at `http://localhost:3000`.

## Key pages

| URL | Description |
|-----|-------------|
| `/` | Public homepage |
| `/shop` | Individual sticker catalog |
| `/packs` | Pack stickers |
| `/coming-soon` | Products in production |
| `/wholesale-portal` | PIN login for wholesale accounts |
| `/wholesale-portal/dashboard` | Wholesale portal (requires PIN login) |
| `/admin` | Admin panel (requires passkey) |
| `/admin/inventory` | Inventory management |
| `/admin/orders` | Supplier (manufacturing) orders |
| `/admin/wholesale` | Wholesale order management |

## Wholesale portal test login

- Abbey account PIN: `4438` (dev only — do not commit PINs)
- All account PINs are in `lib/wholesale/accounts-server.ts` (server-only file, not exposed to client)

## Architecture

```
app/
  (d2c)/          # Public-facing storefront
  admin/          # Admin panel (passkey-protected)
  wholesale-portal/  # Wholesale portal (PIN-protected)
  api/            # API routes

components/
  d2c/            # Storefront components
  admin/          # Admin components
  wholesale/      # Wholesale portal components

lib/
  supabase/       # Supabase client factories (browser, server, service)
  wholesale/      # Pricing, session, account resolution
  r2.ts           # Cloudflare R2 image storage
  pricing.ts      # D2C price constants

config/
  wholesale-accounts.ts   # Client-safe account config (pricing, display)

lib/wholesale/
  accounts-server.ts      # Server-only account config (PINs, pricing overrides)

supabase/migrations/      # SQL migrations (run manually in Supabase SQL Editor)
```

## Database

- Supabase (PostgreSQL) at `wzzdynhsjiskqfpwghdn.supabase.co`
- Service-role client is used for all server-side mutations (bypasses RLS)
- See `docs/MIGRATION.md` for migration history

## Image storage

- Images are stored in Cloudflare R2
- Public CDN: `https://pub-e59824bedb894365891e449422d22d40.r2.dev`
- Upload via admin UI → `/api/admin/upload-image` (converts PNG → WebP, resizes to 800px)
- `stickerImageUrl(filename)` in `lib/catalog.ts` builds the CDN URL

## Important constraints

- `inventory.status` is a **generated column** — never UPDATE it directly
- The `ws_auth` cookie is scoped to `path: "/api/wholesale"` — it won't be sent to other routes
- Session tokens expire in 24 hours; `sessionStorage` can outlive them — always check `r.ok` on 401 responses

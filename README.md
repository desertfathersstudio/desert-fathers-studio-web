# Desert Fathers Studio — Website

Next.js 16 storefront for [desertfathersstudio.com](https://desertfathersstudio.com).

## Folder structure

```
dfs-website/
├── app/
│   ├── (d2c)/              ← Public storefront (desertfathersstudio.com)
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── wholesale/          ← Wholesale portal (wholesale.desertfathersstudio.com)
│   ├── admin/              ← Admin dashboard (admin.desertfathersstudio.com)
│   ├── layout.tsx          ← Root layout (fonts, html/body shell)
│   └── globals.css         ← Brand token system + base styles
├── components/
│   ├── shared/             ← Logo, StickerCard — used by all three fronts
│   ├── d2c/                ← Nav, HeroSection, FeaturedProducts, BrandStory, Footer
│   ├── wholesale/
│   └── admin/
├── lib/
│   └── utils.ts            ← cn() helper
├── types/                  ← Shared TypeScript types
├── hooks/                  ← Custom React hooks
├── proxy.ts                ← Subdomain routing (Next.js 16 proxy)
├── PRODUCT.md              ← Impeccable context: brand, users, tone, anti-references
└── DESIGN.md               ← Impeccable context: colors, typography, components
```

### How subdomain routing works

`proxy.ts` reads the `host` header and rewrites internally:

| URL | Serves from |
|---|---|
| `desertfathersstudio.com` | `app/(d2c)/` |
| `wholesale.desertfathersstudio.com` | `app/wholesale/` |
| `admin.desertfathersstudio.com` | `app/admin/` |

**Local dev:** use query params to simulate subdomains:
- `localhost:3000` → D2C storefront
- `localhost:3000?front=wholesale` → Wholesale portal
- `localhost:3000?front=admin` → Admin dashboard

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploys

Hosted on Vercel. Every push to `main` triggers a production deploy. PRs get preview URLs automatically.

Manual deploy: `vercel --prod`

## Design skills

All three skill sets are installed and active when Claude Code opens this project.

| Skill | Location | How to invoke |
|---|---|---|
| **Taste Skill** (9 sub-skills) | `.agents/skills/` | "Apply the high-end-visual-design skill" / "use design-taste-frontend" |
| **Emil Kowalski** | `.agents/skills/emil-design-eng/` | "Apply Emil's design principles to this component" |
| **Impeccable** (23 commands) | `.claude/skills/impeccable/` | `/impeccable polish`, `/impeccable audit`, `/impeccable critique`, `/impeccable bolder`, `/impeccable animate`, `/impeccable colorize`, etc. |

Impeccable reads `PRODUCT.md` and `DESIGN.md` at project root for brand context. Keep both files updated as the design evolves.

## Environment variables

Copy `.env.example` → `.env.local` and fill in values.

| Variable | Service |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` + `ANON_KEY` + `SERVICE_ROLE_KEY` | Supabase |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` + `SECRET_KEY` + `WEBHOOK_SECRET` | Stripe |
| `RESEND_API_KEY` | Resend |

## Next steps

- [ ] **Catalog page** — `/catalog` with category filter, search, sort
- [ ] **Product detail** — `/product/[id]` with add-to-cart
- [ ] **Cart + checkout** — Stripe Payment Element, confirmation email via Resend
- [ ] **Supabase schema** — products, orders, wholesale accounts tables
- [ ] **Wholesale auth** — Supabase Auth gating on wholesale subdomain
- [ ] **Admin dashboard** — order management, inventory (replace Google Sheets)
- [ ] **Real images** — swap placehold.co for actual sticker Drive photos
- [ ] **Custom domain** — point desertfathersstudio.com + subdomains at Vercel
- [ ] **Analytics** — add Vercel Analytics or Plausible

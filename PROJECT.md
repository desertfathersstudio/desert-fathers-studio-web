# Desert Fathers Studio — Project Tracker

## Current Phase
Homepage polish: font system, accessibility fixes, animation — before building product/cart pages.

---

## Working Agreements

- Never push without running `/predeploy` first
- Every session starts: "Read PROJECT.md, what's next?"
- Every session ends: "Update PROJECT.md, commit it"
- Don't open more than one frontend issue at a time
- Skills run order: `typeset` → `animate` → `layout` → `harden` → `polish` → `audit`
- After audit, check score improvement before declaring done

---

## Active Backlog (Priority Order)

### P1 — Fix before any public share

- [ ] **Font: Replace Inter with Cabinet Grotesk** — `layout.tsx` still imports `Inter` from next/font; `globals.css` body still uses `var(--font-inter)`; `Logo.tsx` hardcodes `var(--font-inter)`. DESIGN.md says Cabinet Grotesk. Run `/impeccable typeset` to execute. Affects every text element on the page.
- [ ] **Add `:focus-visible` styles to `globals.css`** — Tailwind preflight removes browser outlines. Keyboard nav is currently invisible. Quick fix: `*:focus-visible { outline: 2px solid var(--brand); outline-offset: 3px; }`
- [ ] **Nav link contrast fails WCAG AA** — `var(--text-muted)` (#7a6a5a) on frosted nav background is ~4.3:1, just below the 4.5:1 threshold. Darken to `--text` or add a dedicated `--text-nav` token at ~#5a4a3a.
- [ ] **Footer copyright contrast** — `rgba(250,247,242,0.35)` on `#1a0e05` = ~3.65:1, fails AA. Raise opacity to 0.5 minimum or switch to a solid token.
- [ ] **StickerCard: add link wrapper** — Cards show `cursor-pointer` but are `<article>` elements with no `<Link>` inside. Keyboard users can't activate them; click does nothing. Blocked on product detail routes existing first — but the cursor must be removed until then.
- [ ] **Add `--ochre` and `--ivory` to `globals.css` `:root`** — Both tokens are in DESIGN.md but missing from the CSS file. Any component using `var(--ochre)` silently gets nothing.

### P2 — Fix before launch

- [ ] **Scroll-reveal: replace CSS animation with IntersectionObserver** — `.reveal` class uses CSS `animation` with a delay, meaning all elements animate on page load, including those off-screen. Needs IntersectionObserver to trigger on first viewport entry. Run `/impeccable animate`.
- [ ] **Fix animation starting state** — Current: `translateY(24px)` only. DESIGN.md specifies `scale(0.95) translateY(8px)` with spring easing `cubic-bezier(0.34, 1.2, 0.64, 1)`.
- [ ] **Replace hard-coded `#fff`** — `Nav.tsx`, `HeroSection.tsx`, `StickerCard.tsx` (New badge) all use `color: "#fff"`. Should be `var(--text-inverse)`.
- [ ] **Add `max-width: 65ch` to `BrandStory` body text** — DESIGN.md caps all running prose at 65ch. The body column in BrandStory has no constraint.
- [ ] **Footer wholesale CTA: remove `text-center`** — Centered CTA band is flagged as a banned pattern (mirrors every generic newsletter block). Shift to left-aligned with button inline-right.
- [ ] **Verify sticker image backgrounds** — Real sticker PNGs may have white or off-white backgrounds that clash with `--bg-card`. Check transparent PNG handling; adjust card `padding` or `background` if needed.
- [ ] **Product detail routes** — `/stickers/[id]` pages don't exist. Cards shouldn't show `cursor-pointer` until they navigate somewhere.

### P3 — Polish pass

- [ ] **Cart functionality** — Add-to-cart, cart drawer/page, quantity controls.
- [ ] **Checkout flow** — Likely routes to the existing Google Apps Script order system or a new payment handler.
- [ ] **Mobile hero** — Image cluster is `hidden md:block`. Mobile hero is text-only. Consider a single sticker image inline or below the headline on small screens.
- [ ] **Wholesale page** — `/wholesale` route exists in nav but has no page.
- [ ] **Lighthouse audit** — Run after font changes land. Track score as baseline before any further perf work.

---

## Done This Session

- [x] Created `dfs-website/` Next.js project (Tailwind v4, shadcn/ui, TypeScript)
- [x] Built homepage scaffold: Nav, HeroSection, FeaturedProducts, BrandStory, Footer
- [x] Set up design token system in `globals.css` (maroon, gold, warm cream palette)
- [x] Ran `/impeccable teach` — established PRODUCT.md and DESIGN.md
- [x] Ran `/impeccable teach` refresh — updated DESIGN.md: Cabinet Grotesk replaces Inter, spring motion spec, editorial layout rules, iconography spec, banned-patterns list, new `--ochre` and `--ivory` tokens
- [x] Ran `/impeccable audit app/(d2c)/page.tsx` — scored 12/20, documented 14 issues
- [x] Created private GitHub repo: `desertfathersstudio/desert-fathers-studio-web`
- [x] Added all 90 sticker PNGs to `public/stickers/`
- [x] Wired real sticker images into HeroSection and FeaturedProducts
- [x] Fixed filename typos: `Resssurection` → `Resurrection`, `Ppoe Shenouda` → `Pope Shenouda`, `Isaac Sacrificce` → `Isaac Sacrifice`, `St. Stephen.PNG` → `.png`
- [x] Restructured homepage: compact hero (62vh), full catalog section with all 90 stickers, minimal brand story — page order now Hero → Catalog → Story → Footer
- [x] Created `lib/catalog.ts` with all 90 stickers across 9 categories
- [x] Built `CatalogSection`: category filter pills, editorial 3-col grid, special pack cards, tabular-nums prices, scale(1.04) hover
- [x] Removed BrandStory stat block (hero-metric anti-pattern)
- [x] Deleted unused `FeaturedProducts.tsx`

---

## Decisions Log

- **2026-04-25** — Cabinet Grotesk chosen over Inter for body/UI font. Reason: Inter is banned for premium aesthetics per Taste Skill; Cabinet Grotesk is warmer and more humanist. *Not yet implemented in code — DESIGN.md updated, font import still pending.*
- **2026-04-25** — Full catalog shown on homepage (all 90 stickers with category filters) instead of a curated 4-item featured section. Reason: returning customers should land, scroll once, and find what they want without navigating away.
- **2026-04-25** — Hero reduced to 62vh from `min-h-screen`. Reason: catalog should appear at or near the fold on first load.
- **2026-04-25** — BrandStory stat block (60+ designs / 70¢ / ∞ Sunday schools) removed. Reason: hero-metric SaaS anti-pattern; wrong tone for a liturgical brand.
- **2026-04-25** — All sticker images stored in `public/stickers/` as flat PNGs (no sub-folders). Reason: simplest path for Next.js static serving; filenames match design names for legibility.
- **2026-04-25** — Private GitHub repo chosen over public. Reason: contains unreleased design assets.

---

## Known Issues / Tech Debt

- **Inter/Cabinet Grotesk divergence** — `layout.tsx` imports `Inter`; DESIGN.md says Cabinet Grotesk. The site currently ships in Inter everywhere. Medium-visibility until typeset fix lands.
- **No product routes** — `StickerCard` and `CatalogSection` sticker items have `cursor-pointer` but click does nothing. Users will click and get no feedback. Needs `/stickers/[id]` route before public share.
- **Scroll-reveal fires on page load** — All `.reveal` elements animate immediately, including those below the fold. Harmless but wasteful; items off-screen animate before being seen.
- **`--ochre` / `--ivory` not in CSS** — Defined in DESIGN.md, absent from `globals.css`. Silent breakage if any component references them.
- **No `next.config.ts` image domain config** — The old `placehold.co` URLs were never added. Now moot (switched to local images), but if any external image URL is ever added it will fail without updating `remotePatterns`.
- **No error boundaries or loading states** — Catalog renders synchronously from static data; fine now, but will need skeletons once images are fetched dynamically.

---

## Deploy Checklist

Before any deploy:

- [ ] `npm run dev` — verify locally, no build errors
- [ ] All sticker images load (check a few from each category)
- [ ] No console errors or warnings
- [ ] Mobile view checked (320px, 375px, 430px)
- [ ] Nav links work (Shop anchor, Sunday Schools, Browse Catalog)
- [ ] Category filter pills work and show correct stickers
- [ ] Footer wholesale link navigates correctly
- [ ] Lighthouse score reviewed (target: Performance 90+, Accessibility 90+)
- [ ] Commit with clear message before pushing

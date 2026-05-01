# Design System: Desert Fathers Studio — Wholesale Portal

---

## 1. Visual Theme & Atmosphere

**Scene:** A Sunday school teacher opening the wooden doors of a monastery archive — warm light through amber glass, the scent of old books, a ledger open on a stone desk. Every interaction should feel as deliberate and unhurried as turning a page.

**Atmosphere descriptors:** Scriptorium-warm. Liturgically confident. Gallery-ordered. Never corporate, never rustic, never "startup."

**Density:** 5 out of 10 — "Daily App Balanced." Content-first, readable, generous internal breathing room without feeling sparse. Products get space to live.

**Variance:** 5 out of 10 — Structured asymmetry. Ledger-tab navigation (not pill tabs), ruled separators, grids with intentional visual weight differences. Never a perfectly centered SaaS layout.

**Motion:** 3 out of 10 — "Restrained, reverent." Hover lifts with warm shadows. Tab transitions at 150ms ease-out. No bounce, no elastic, no choreography. Sacred context — motion should feel like a breath, not a performance.

**Register:** Product (app UI — design serves function)

---

## 2. Color Palette & Roles

- **Monastery Maroon** (`#6B1F2A`) — Primary brand. Header backgrounds, CTAs, active text on tabs, section markers. Carries 30–50% of key surfaces.
- **Deep Maroon** (`#4a1228`) — Dark surfaces only: login card background, deep-hover states.
- **Maroon Lift** (`#8b2d4f`) — Hover state for maroon buttons.
- **Sanctuary Gold** (`#B8893E`) — Accent. Active tab underline, price labels, "New" badges, filled PIN dots. Signal, not decoration.
- **Gold Warm** (`#d4a853`) — Hover gold, warm badge fills.
- **Parchment** (`#F8F4EC`) — Primary background. All tab content surfaces, main page bg.
- **Vellum** (`#f5f0e8`) — Elevated surfaces: card backgrounds, section panels, inset fields.
- **Ivory Deep** (`#f0e8d6`) — Inset panels, subtle layering under forms.
- **Ink** (`#2a1a0e`) — Primary text. Warm charcoal, never pure black.
- **Ink Muted** (`#7a6a5a`) — Secondary text, metadata, SKU labels, muted tab labels.
- **Warm Border** (`#e4d8c8`) — Structural borders, ruled separators, input lines.
- **Border Firm** (`#c8b89a`) — Interactive state borders, focused inputs.
- **Cream Text** (`rgba(239,231,214,1)`) — Text on dark maroon surfaces.
- **Cream Muted** (`rgba(239,231,214,0.55)`) — Subtext on dark maroon surfaces.

**Color strategy:** Committed. Maroon carries 30–50% of key surfaces. Gold is the signal color — used sparingly for active states and pricing. Never cold; always warm.

**Banned colors:** Blue, purple, any cool-toned gray. No neon. No gradient backgrounds. No pure `#000000` or `#ffffff`.

---

## 3. Typography Rules

**Display / Headings:** Cormorant Garamond (`var(--font-cormorant)`) — weights 400, 500, 600. Elegant, slightly liturgical, editorial. Used for section headings, tab labels, page titles, lightbox product names. Never used for UI labels or body copy.

**Body / UI:** Cabinet Grotesk (`var(--font-sans)`) — weights 400, 500, 600. Warm humanist geometry — noticeably less sterile than Inter. Used for all functional text: labels, form fields, metadata, SKUs, button copy, filter chips.

**Mono:** System monospace — for order IDs, SKU codes, tracking numbers, PIN input characters.

**Banned:** Inter in any display or heading context. Generic serifs (Times New Roman, Georgia, Palatino). Note: Cormorant Garamond is a distinctive modern display typeface — it is not "Georgia" or "Garamond" in the generic serif sense and is explicitly approved for this brand.

### Scale

| Role | Size | Font | Weight | Notes |
|---|---|---|---|---|
| Page heading | `1.75rem` | Cormorant | 500 | letter-spacing: 0.01em |
| Section heading | `1.3rem` | Cormorant | 500 | Used in Section component |
| Tab label | `1rem` | Cormorant | 400/600 | Active = 600 |
| Card product name | `0.95rem` | Cormorant | 600 | line-height: 1.3 |
| Eyebrow / label | `0.68rem` | Cabinet Grotesk | 600 | Uppercase, 0.06em tracking |
| Body | `0.85rem` | Cabinet Grotesk | 400 | line-height: 1.55 |
| Price | `0.72rem` | Cabinet Grotesk | 700 | Gold color, tabular-nums |
| Metadata / SKU | `0.68rem` | Cabinet Grotesk | 400 | Muted ink |
| Badge | `0.62rem` | Cabinet Grotesk | 600 | Uppercase, tracked |

---

## 4. Component Stylings

### Login / PIN Entry
- Page: Parchment background. Centered column. Gold cross ☩ at `2.75rem` above card. Cormorant brand name `1.75rem` weight 400. Small-caps "Wholesale Portal" Cabinet Grotesk label.
- Card: Deep Maroon background (`#4a1228`), `12px` radius. No card border — dark bg is the container.
- PIN dots: `11×11px` squares (not circles), `2px` border-radius. Sanctuary Gold fill + border when active; `rgba(239,231,214,0.3)` border when empty. 150ms transition.
- Input: Transparent bg, border-bottom only (`2px solid rgba(239,231,214,0.25)`). Cream caret. Characters hidden (color: transparent). Monospace.
- Error: Coral `rgba(248,113,113,0.9)` — warm, not harsh red.
- CTA: Sanctuary Gold when PIN ready. Uppercase, tracked. Dims when not ready. No outer glow.
- Shake: `−8px / +8px` translateX, 400ms ease, wrong PIN only.

### Header
- Top bar: Full Monastery Maroon. Logo `variant="light"` (gold ☩ + cream text). Vertical cream divider. Cormorant italic session name in cream. Small cream-outline "Switch account" button.
- Tab strip: Full-width Parchment. `1px solid` Warm Border bottom.
- Tab items: Cormorant `1rem`. Active: Maroon + `2px solid` Sanctuary Gold bottom. Inactive: Muted Ink. No filled pills, no background tints.
- Cart badge: Sanctuary Gold circle on Order tab label.
- Entire header sticky at `top: 0, z-index: 50`.

### Catalog Grid
- Search: Flat input, border-bottom only, transparent bg, no border-radius, no pill.
- Category filters: Ledger-tab — no pill bg. Active: Maroon text + `2px solid` Gold bottom. Zero border-radius.
- Cards: White bg, `1px solid` Warm Border, `12px` radius. No box-shadow at rest.
- Card hover: `translateY(-3px)`, `box-shadow: 0 6px 20px rgba(107,31,42,0.1)`. 180ms ease-out.
- Image: `aspect-ratio: 1`, Vellum bg, `object-contain`, `1rem` padding.
- "New" badge: Sanctuary Gold bg, white text, uppercase, `3px` radius, top-left.
- Price: Sanctuary Gold color, weight 700.

### Lightbox
- Overlay: `rgba(0,0,0,0.82)`.
- Modal: White bg, `12px` radius. Max-width `820px`. Image left (Vellum bg), detail panel right (`270px`, `1px` border-left Warm Border). Top bar: Vellum bg, Cormorant name.
- Detail panel: Meta, note blocks (Vellum bg + Warm Border), qty select, Add to Order button (full Maroon).
- Touch swipe ≥ 50px navigates.

### Pending Review Lightbox
- Header: Full Monastery Maroon. Cormorant name in Cream. Cream nav/close.
- Comment bubbles: Vellum bg + Warm Border. Never blue.
- Approve: Forest green `#1f6326` — semantically correct for approval.

### Order Tab
- Mode toggle: Ledger-tab — no pills. Active: Maroon + Gold underline on a border-bottom rule.
- Group filter chips: Same ledger-tab style.
- Section component: Vellum bg card. Cormorant heading `1.3rem` weight 500. Ruled heading separator.
- Cart rows: checkbox + thumbnail + name + qty stepper + price + remove. Ruled `borderBottom`.
- Selected rows: `rgba(107,31,42,0.04)` tint.
- Submit: Full-width Maroon, `1rem` padding, uppercase tracking.

### Suggestions Tab
- No card wrapper — form floats on Parchment.
- Ruled `<hr>` separators (`1px solid` Warm Border) between form groups.
- Quick-fill: outlined buttons, hover to Maroon border + text.
- Success: warm green `#f0f9f4` / `#b8dbc5` / `#2c5f3a`.

### Previous Orders
- Cards: White bg, `1px` Warm Border. No `border-left` side stripe (banned).
- ASAP: Header row `rgba(230,81,0,0.03)` tint + amber outline badge.
- Stage tracker: Completed = Sanctuary Gold circle + Gold connector. Current = Maroon. Future = Warm Border.
- Tracking: Text "Tracking:" + maroon underline anchor. No emoji prefix.

### Buttons
- Primary: Maroon fill, white text, `6px` radius. Active: `translateY(-1px)`. No glow.
- Ghost: `1px` Warm Border, Muted Ink. Hover: Maroon border + Maroon text.
- Destructive: warm red text, `#fecaca` border, white bg.
- Disabled: `var(--border)` fill, muted text, `not-allowed` cursor.

---

## 5. Layout Principles

- Max-widths: Catalog `1200px`, Order form `860px`, Suggestions `640px`, Previous Orders `800px`. All centered `margin: 0 auto`.
- Page padding: `1.25rem–1.5rem` horizontal, `1.5rem–2rem` vertical.
- Grid: `auto-fill, minmax(180px, 1fr)` catalog. `auto-fill, minmax(200px, 1fr)` pending.
- Sticky toolbar: Catalog search + filters at `top: 99px`.
- No horizontal scroll — all grids wrap, internal scroll only.
- Spacing rhythm: Varied, not identical. Cards `0.65–0.75rem`, sections `1.25–1.5rem`.
- Responsive: Below `768px` — grid collapses, tab strip horizontal-scrolls (no scrollbar visible).

---

## 6. Motion & Interaction

- Card hover: `translateY(-3px)` + `box-shadow: 0 6px 20px rgba(107,31,42,0.1)`. 180ms ease-out.
- Tab underline: color `150ms ease`.
- PIN dots: bg + border-color `150ms ease`.
- PIN shake: `translateX` cascade, 400ms ease, wrong PIN only.
- Button active: `translateY(-1px)`, 100ms — tactile press.
- Modal/lightbox: No entrance animation — instant. Sacred context.
- Spring spec: `cubic-bezier(0.34, 1.1, 0.64, 1)` — slight overshoot. Scroll-reveal only.

**Banned motion:** Bounce, elastic, `scale(0)` start, layout property animation, shimmer loaders, perpetual animations in portal UI.

---

## 7. Anti-Patterns (Banned)

**Typography**
- Inter in any heading or brand surface
- Generic serifs: Times New Roman, Georgia, Palatino
- Gradient text (`background-clip: text`)
- Emoji in headings, tab labels, section titles, form labels
- All-caps Cormorant headings

**Color**
- Blue or purple anywhere — including link colors, focus rings, comment bubbles
- Neon or oversaturated accents
- Pure `#000000` or `#ffffff`
- Cool-toned grays (Slate, Zinc)
- Gradient backgrounds

**Components**
- Filled pill tabs for navigation
- `border-left > 1px` colored accent stripe on cards, callouts, or list items
- Cards nested inside cards
- Glassmorphism decoratively
- Identical 3-column equal card grids
- Centered hero layout
- Heavy box-shadows (`rgba(0,0,0,0.2)` or above on cards)
- Blue comment bubbles in any review thread

**Motion**
- Bounce or elastic easing
- Shimmer loaders
- Perpetual animations in portal UI
- Animating layout properties (width, height, top, left, margin, padding)

**Copy**
- "Seamless", "Elevate", "Unleash", "Next-Gen", "Revolutionary"
- Generic placeholder names, fake round numbers
- Emoji anywhere in the portal

---

## 8. Wholesale Portal Specifics

- **No friction theater** — no splash screens, no onboarding tours. Users are administrators who know what they're doing.
- **Clarity over cleverness** — button labels are literal. "Add to Order" not "Add to Bag." "Submit Order" not "Place Order."
- **Order form = supply desk** — structured, ledger-like, trustworthy. Not an e-commerce checkout.
- **Pending review = quiet conversation** — not a ticketing system.
- **Inventory states = gentle supplier reminder** — never urgency theater.

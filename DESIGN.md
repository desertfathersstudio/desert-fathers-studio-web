# Design System

## Color

### Palette
- `--brand: #6b1d3b` — Primary maroon. Used for CTAs, headings emphasis, and key UI elements.
- `--brand-light: #8b2d4f` — Lighter maroon for hover states.
- `--brand-dark: #4a1228` — Deeper maroon for dark surfaces.
- `--gold: #b5853a` — Accent gold. Used for labels, eyebrow text, section markers.
- `--gold-light: #d4a853` — Lighter gold for pills and highlights.
- `--ochre: #c8843a` — Deep desert ochre. Used for warmth accents, secondary CTAs, and earthy contrast moments.
- `--ivory: #f0e8d6` — Muted ivory. Softer than bg-card; for inset panels and subtle layering.
- `--bg: #faf7f2` — Warm off-white. Main background.
- `--bg-card: #f5f0e8` — Slightly warmer, for cards and secondary surfaces.
- `--bg-dark: #1a0e05` — Near-black warm dark, for footer and admin surfaces.
- `--text: #2a1a0e` — Warm charcoal body text.
- `--text-muted: #7a6a5a` — Warm gray for secondary text.
- `--border: #e4d8c8` — Warm light border.
- `--border-dark: #c8b89a` — Slightly stronger border for interactive states.

### Color strategy
Committed. The maroon (`--brand`) carries 30–50% of key surfaces. Gold is the signal color — used sparingly for eyebrow labels and metallic moments. Ochre appears as an earthen warmth layer in section backgrounds and accent moments. Never cold; always warm. **Banned: blue, purple, any gradient that uses either.**

## Typography

### Fonts
- **Display / Headings**: Cormorant Garamond (`--font-serif`) — weights 300, 400, 500. Elegant, slightly liturgical, editorial.
- **Body / UI**: Cabinet Grotesk (`--font-sans`) — weights 400, 500, 600. Warm, humanist geometry. Noticeably less sterile than Inter; pairs well with a liturgical serif.
- **Fallback sans**: `system-ui, sans-serif`

### Scale
- Hero: `clamp(3rem, 7vw, 5.5rem)`, weight 300, Cormorant
- Section headings: `clamp(2rem, 4vw, 3rem)`, weight 400, Cormorant
- Eyebrow labels: `11px`, uppercase, `letter-spacing: 0.2em`, Cabinet Grotesk 500, `--gold`
- Body: `1rem` / `1.125rem`, Cabinet Grotesk 400, `line-height: 1.65`, max `65ch`
- Card saint/product names: `~1.05rem`, Cormorant, `--text`, no surrounding box or pill
- Prices: `0.875rem`, Cabinet Grotesk 500, `--brand`, `font-variant-numeric: tabular-nums`

### Body text constraint
All running body text is capped at `65ch`. Never let prose run full-width.

## Spacing
Generous and varied. Cards have `gap-5 md:gap-8`. Sections use `py-24 md:py-32`. Avoid identical padding on every surface — rhythm comes from variation.

## Border radius
- Cards: `12px` (`--radius-card`)
- Buttons: `6px` (`--radius-btn`)

## Motion

### Principles
All animations start from `scale(0.95) translateY(8px)` and fade in from `opacity: 0`. Never start from `scale(0)` — elements should feel like they're surfacing, not appearing from nothing.

Spring physics, not linear easing. Preferred curve: `cubic-bezier(0.34, 1.2, 0.64, 1)` — slight overshoot, settles naturally. Reserve this for entrance animations only.

Hover states use `ease-out` at 200–300ms. Never bouncy on hover.

### Scroll reveals
Fade-up scroll-reveal, 0.7s spring, staggered delays (`.reveal-1` through `.reveal-4`, 80ms apart). Triggered once on first viewport entry.

### Hover
- Sticker images: `scale(1.04)`, 300ms `ease-out`. Never `scale(1.1)` or above.
- Links: opacity 70ms `ease-out`.
- Buttons: slight background lightening, no scale.

### Banned motion
- Bounce or elastic easing on any element
- `scale(0)` as animation start
- Layout property animation (width, height, top, left)

## Layout

### Editorial asymmetry
No 3-column SaaS card grids. Sticker browsing uses editorial asymmetry: varied column widths, intentional whitespace, a mix of portrait and square crops where the grid itself communicates curation. Think gallery wall, not product shelf.

### Hero sections
Force asymmetry. Never centered hero text stacked over a centered image. Text left-anchored or offset; image bleeds off-edge or is cropped unconventionally.

## Iconography

### Christ stickers
Golden halo, circular, with segmented cross-like divisions and radiant texture. The exact line arrangement (four quadrant segments with inner radiance marks) must be preserved consistently across every rendering. Not a plain ring — structured and patterned.

### Saint stickers
Clean digital Byzantine-inspired icon style. Bold outlines, flat vibrant colors, white sticker border. Saint name appears below the image: bottom-centered, Cormorant serif, no surrounding box, pill, or label container of any kind.

## Components

### Nav
Fixed, frosted glass (`backdrop-filter: blur(12px)`), `rgba(250,247,242,0.88)` background.

### Sticker Card
- Aspect-square image container, `--bg-card` background, `--radius-card`
- Image has `object-contain` with generous padding (`p-6`)
- Hover: `scale(1.04)` on image, 300ms `ease-out`
- Below image: category label (uppercase, muted, 11px, Cabinet Grotesk), saint/product name (Cormorant, no box), price (Cabinet Grotesk, `--brand`, `tabular-nums`)
- No nested cards. No border-left accent stripe.

### Buttons
- Primary: `--brand` background, white text, `--radius-btn`
- Outline: border `--gold`, gold text, transparent background

## Banned patterns
- Inter font on any premium or brand surface
- Purple or blue in any form, including gradients
- Emoji in headings or labels
- 3-column icon grids
- Centered hero layout
- Cards nested inside cards
- Gray text on colored backgrounds
- Bounce or elastic easing on any animated element
- `border-left` accent stripes on cards or callouts
- Gradient text (`background-clip: text`)

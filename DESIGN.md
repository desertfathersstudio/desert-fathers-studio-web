# Design System

## Color

### Palette
- `--brand: #6b1d3b` — Primary maroon. Used for CTAs, headings emphasis, and key UI elements.
- `--brand-light: #8b2d4f` — Lighter maroon for hover states.
- `--brand-dark: #4a1228` — Deeper maroon for dark surfaces.
- `--gold: #b5853a` — Accent gold. Used for labels, eyebrow text, section markers.
- `--gold-light: #d4a853` — Lighter gold for pills and highlights.
- `--bg: #faf7f2` — Warm off-white. Main background.
- `--bg-card: #f5f0e8` — Slightly warmer, for cards and secondary surfaces.
- `--bg-dark: #1a0e05` — Near-black warm dark, for footer and admin surfaces.
- `--text: #2a1a0e` — Warm near-black body text.
- `--text-muted: #7a6a5a` — Warm gray for secondary text.
- `--border: #e4d8c8` — Warm light border.
- `--border-dark: #c8b89a` — Slightly stronger border for interactive states.

### Color strategy
Committed. The maroon (`--brand`) carries 30–50% of key surfaces. Gold is the signal color — used sparingly for eyebrow labels and metallic moments. Never cold; always warm.

## Typography

### Fonts
- **Display / Headings**: Cormorant Garamond (`--font-serif`) — weights 300, 400, 500. Elegant, slightly liturgical, editorial.
- **Body / UI**: Inter (`--font-sans`) — weights 400, 500, 600. Clean and legible at small sizes.

### Scale
- Hero: `clamp(3rem, 7vw, 5.5rem)`, weight 300, Cormorant
- Section headings: `clamp(2rem, 4vw, 3rem)`, weight 400, Cormorant
- Eyebrow labels: `11px`, uppercase, `tracking-[0.2em]`, Inter 500, gold color
- Body: `1rem` / `1.125rem`, Inter 400, `leading-relaxed`
- Card names: `~1.05rem`, Cormorant, color `--text`
- Prices: `0.875rem`, Inter 500, color `--brand`

## Spacing
Generous. Cards have `gap-5 md:gap-8`. Sections use `py-24 md:py-32`.

## Border radius
- Cards: `12px` (`--radius-card`)
- Buttons: `6px` (`--radius-btn`)

## Motion
- Subtle scroll-reveal: `fade-up` animation, 0.7s ease, staggered delays (`.reveal-1` through `.reveal-4`)
- Hover: `scale-105` on sticker images, 500ms transition. Opacity transitions on links (70ms).
- No bouncy or playful easing. Ease is `ease` or `ease-out`.

## Components

### Nav
Fixed, frosted glass (`backdrop-filter: blur(12px)`), `rgba(250,247,242,0.88)` background.

### Sticker Card
- Aspect-square image container, `--bg-card` background
- Image has `object-contain` with generous padding (`p-6`)
- Hover: `scale-105` on image, 500ms transition
- Below image: category label (uppercase, muted, tiny), product name (Cormorant), price (Inter, brand color)

### Buttons
- Primary: `--brand` background, white text, `--radius-btn`
- Outline: border `--gold`, gold text, transparent background

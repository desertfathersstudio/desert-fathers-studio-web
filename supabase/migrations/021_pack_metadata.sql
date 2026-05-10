-- Add rich display metadata to sticker_packs so the app can render new packs
-- without hardcoded config in pack-configs.ts. Backfill existing RP/HWP rows.

ALTER TABLE sticker_packs
  ADD COLUMN IF NOT EXISTS name             text,
  ADD COLUMN IF NOT EXISTS sku              text,
  ADD COLUMN IF NOT EXISTS slug             text,
  ADD COLUMN IF NOT EXISTS description      text,
  ADD COLUMN IF NOT EXISTS accent_color     text DEFAULT 'var(--brand)',
  ADD COLUMN IF NOT EXISTS pack_size        integer,
  ADD COLUMN IF NOT EXISTS retail_price     numeric(10,2),
  ADD COLUMN IF NOT EXISTS wholesale_price  numeric(10,2),
  ADD COLUMN IF NOT EXISTS active           boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at       timestamptz DEFAULT now();

-- Unique indexes for slug-based and SKU-based lookups
CREATE UNIQUE INDEX IF NOT EXISTS sticker_packs_slug_idx ON sticker_packs (slug) WHERE slug IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS sticker_packs_sku_idx  ON sticker_packs (sku)  WHERE sku  IS NOT NULL;

-- Backfill Resurrection Pack
UPDATE sticker_packs SET
  name            = 'Resurrection Pack',
  sku             = 'PK-1',
  slug            = 'resurrection-pack',
  description     = 'Ten appearances of the Risen Lord — from the empty tomb through Pentecost. The fifty days of the Bright Season, gathered for wherever joy belongs.',
  accent_color    = 'var(--gold)',
  pack_size       = 10,
  retail_price    = 10.00,
  wholesale_price = 3.00,
  active          = true
WHERE short_code = 'RP';

-- Backfill Holy Week Pack
UPDATE sticker_packs SET
  name            = 'Holy Week Pack',
  sku             = 'PK-2',
  slug            = 'holy-week-pack',
  description     = 'From the triumphal entry into Jerusalem through the burial — the full arc of Holy Week in Coptic iconographic style. Twenty-three moments for the Great Fast.',
  accent_color    = 'var(--brand)',
  pack_size       = 23,
  retail_price    = 18.00,
  wholesale_price = 7.00,
  active          = true
WHERE short_code = 'HWP';

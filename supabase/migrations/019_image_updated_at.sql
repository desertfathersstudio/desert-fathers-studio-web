-- Add image_updated_at for cache-busting and featured flag for homepage control
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_updated_at TIMESTAMPTZ;
ALTER TABLE products ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false;

-- Backfill image_updated_at from updated_at for products that already have images
UPDATE products SET image_updated_at = updated_at WHERE image_url IS NOT NULL;

-- Backfill featured for the 8 products currently hardcoded as FEATURED_IDS
UPDATE products SET featured = true WHERE name IN (
  'Pantokrator',
  'Archangel Michael',
  'Pope Shenouda III — Joy',
  'St. George',
  'The Holy Family',
  'Martyrs of Libya',
  'Ti Theotokos',
  'Transfiguration'
);

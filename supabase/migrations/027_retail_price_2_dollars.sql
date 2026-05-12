-- Update all individual sticker retail prices from $1.50 to $2.00.
-- Packs are excluded (they have their own retail_price set separately).
UPDATE products
SET retail_price = 2.00
WHERE retail_price = 1.50;

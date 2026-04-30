-- Manual inventory correction after inflated on_hand from cancelling pre-tracking orders.

-- Step 1: Fix specific Round 1 designs to their real on-hand counts
UPDATE inventory
SET on_hand = 60, last_updated = now()
WHERE product_id IN (
  SELECT id FROM products
  WHERE sku IN ('STK-1', 'STK-14', 'STK-26', 'STK-29', 'STK-32')
);

-- Step 2: Zero out all Round 2+ designs (STK-36 and above) that are NOT Resurrection Pack
UPDATE inventory
SET on_hand = 0, last_updated = now()
WHERE product_id IN (
  SELECT p.id FROM products p
  JOIN categories c ON c.id = p.category_id
  WHERE p.sku ~ '^STK-[0-9]+$'
    AND (regexp_replace(p.sku, '^STK-', ''))::integer > 35
    AND c.name NOT ILIKE '%resurrection%'
);

-- Step 3: Set all Resurrection Pack designs to 13 each
UPDATE inventory
SET on_hand = 13, last_updated = now()
WHERE product_id IN (
  SELECT p.id FROM products p
  JOIN categories c ON c.id = p.category_id
  WHERE c.name ILIKE '%resurrection%'
);

-- Two-part backfill to make pack-aware sticker counting work on all existing data.
--
-- Part 1: Recalculate pack_size for every row in sticker_packs from the actual
--         count of active constituent sticker products.  Fixes any pack whose
--         size drifted (stickers archived after creation, etc.).
--
-- Part 2: Rewrite the size field inside wholesale_orders.items for every PK-N
--         item that does not yet carry "Set of N".  This lets the shared
--         stickerCount function's "Set of N" regex handle historical orders
--         without any hardcoded per-SKU fallbacks.

-- ── Part 1: Recalculate pack_size ─────────────────────────────────────────────

UPDATE sticker_packs sp
SET pack_size = (
  SELECT COUNT(*)::integer
  FROM products p
  WHERE p.pack_id = sp.id
    AND p.active = true
    AND p.sku !~ '^PK-\d+$'
);

-- ── Part 2: Backfill order items ──────────────────────────────────────────────

UPDATE wholesale_orders AS wo
SET items = sub.new_items
FROM (
  SELECT
    wo2.id,
    jsonb_agg(
      CASE
        WHEN (item->>'productId') ~ '^PK-\d+$'
             AND lower(item->>'size') NOT LIKE 'set of %'
             AND sp.pack_size IS NOT NULL
        THEN item || jsonb_build_object('size', 'Set of ' || sp.pack_size::text)
        ELSE item
      END
    ) AS new_items
  FROM wholesale_orders wo2,
       jsonb_array_elements(wo2.items) AS item
  LEFT JOIN sticker_packs sp ON sp.sku = (item->>'productId')
  GROUP BY wo2.id
) AS sub
WHERE wo.id = sub.id;

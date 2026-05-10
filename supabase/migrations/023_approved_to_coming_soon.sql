-- Retroactively apply the approval flow rule:
-- Approved designs that have never been stocked (on_hand = 0, incoming = 0)
-- should be on the Coming Soon page, not the shop.
-- This catches designs that were approved before the approve route was updated
-- to set coming_soon = true automatically.

UPDATE products p
SET coming_soon = true
FROM inventory i
WHERE i.product_id = p.id
  AND p.review_status = 'approved'
  AND p.can_buy_individually = true
  AND p.coming_soon = false
  AND i.on_hand = 0
  AND i.incoming = 0;

-- Migration 023 set coming_soon = true only for products where can_buy_individually = true.
-- Pack header rows (PK-3+) have can_buy_individually = false so they were skipped.
-- This migration fixes that gap: mark all non-RP/HWP pack products as coming_soon
-- if they haven't been explicitly set to live yet.
--
-- PK-1 = Resurrection Pack (live), PK-2 = Holy Week Pack (live) — excluded.
-- PK-3 = Door of Prophecies — never printed, should be Coming Soon.
-- Any future PK-N added without setting coming_soon = false is also caught here.

UPDATE products
SET coming_soon = true
WHERE sku ~ '^PK-\d+$'
  AND sku NOT IN ('PK-1', 'PK-2')
  AND coming_soon = false;

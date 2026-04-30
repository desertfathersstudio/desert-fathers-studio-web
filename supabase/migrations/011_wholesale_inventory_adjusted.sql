-- Track whether a wholesale order's inventory has actually been decremented.
-- Prevents cancel/delete from "restoring" inventory that was never taken.
ALTER TABLE wholesale_orders
  ADD COLUMN IF NOT EXISTS inventory_adjusted BOOLEAN DEFAULT FALSE;

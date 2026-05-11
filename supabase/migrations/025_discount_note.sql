ALTER TABLE wholesale_orders
  ADD COLUMN IF NOT EXISTS discount_note TEXT;

-- Add optional notes field to wholesale orders
ALTER TABLE wholesale_orders
  ADD COLUMN IF NOT EXISTS notes text;

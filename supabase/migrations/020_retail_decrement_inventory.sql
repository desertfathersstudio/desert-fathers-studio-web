-- Decrements inventory.on_hand for retail (D2C) order items.
-- Accepts a JSONB array of { name: string, qty: number }.
-- Looks up each product by name and decrements, flooring at 0.
CREATE OR REPLACE FUNCTION retail_decrement_inventory(
  p_items jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  item   jsonb;
  v_name text;
  v_qty  integer;
  v_pid  uuid;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_name := item->>'name';
    v_qty  := (item->>'qty')::integer;

    SELECT id INTO v_pid FROM products WHERE name = v_name LIMIT 1;

    IF v_pid IS NOT NULL THEN
      UPDATE inventory
      SET on_hand      = GREATEST(0, on_hand - v_qty),
          last_updated = now()
      WHERE product_id = v_pid;
    END IF;
  END LOOP;
END;
$$;

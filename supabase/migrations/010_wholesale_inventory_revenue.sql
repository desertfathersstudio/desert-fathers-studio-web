-- Adjusts inventory.on_hand for wholesale order items.
-- p_delta = -1 when order is placed, +1 when order is deleted/cancelled.
-- Skips virtual pack SKUs (RP_PACK, HWP_PACK) since they have no product rows.
CREATE OR REPLACE FUNCTION wholesale_adjust_inventory(
  p_items jsonb,
  p_delta integer
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  item     jsonb;
  v_pid    uuid;
  v_qty    integer;
  v_sku    text;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_sku := item->>'productId';
    v_qty := (item->>'qty')::integer;

    -- Skip virtual pack bundles — no product row exists
    CONTINUE WHEN v_sku IN ('RP_PACK', 'HWP_PACK');

    SELECT id INTO v_pid FROM products WHERE sku = v_sku LIMIT 1;

    IF v_pid IS NOT NULL THEN
      UPDATE inventory
      SET
        on_hand      = GREATEST(0, on_hand + (p_delta * v_qty)),
        last_updated = now()
      WHERE product_id = v_pid;
    END IF;
  END LOOP;
END;
$$;

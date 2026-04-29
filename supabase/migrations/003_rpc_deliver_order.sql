-- Atomically marks an order as delivered and moves incoming → on_hand
create or replace function deliver_order(p_order_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- Mark the order delivered
  update mfg_orders
  set status = 'delivered',
      arrival_date = coalesce(arrival_date, current_date)
  where id = p_order_id;

  -- For each unreceived line item, move incoming → on_hand
  update inventory inv
  set on_hand  = inv.on_hand  + item.qty_ordered,
      incoming = greatest(0, inv.incoming - item.qty_ordered),
      status   = case
                   when inv.on_hand + item.qty_ordered > inv.low_stock_threshold then 'in_stock'
                   when inv.on_hand + item.qty_ordered > 0                       then 'low'
                   else 'sold_out'
                 end,
      last_updated = now()
  from mfg_order_items item
  where item.mfg_order_id = p_order_id
    and item.received = false
    and inv.product_id = item.product_id;

  -- Mark all line items received
  update mfg_order_items
  set received = true
  where mfg_order_id = p_order_id
    and received = false;
end;
$$;

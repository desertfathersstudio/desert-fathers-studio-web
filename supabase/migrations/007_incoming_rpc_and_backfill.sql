-- RPC to increment inventory.incoming for a product (called when a new order is placed)
create or replace function increment_incoming(p_product_id uuid, p_qty int)
returns void
language plpgsql
security definer
as $$
begin
  update inventory
  set incoming     = incoming + p_qty,
      last_updated = now()
  where product_id = p_product_id;
end;
$$;

-- Backfill: set inventory.incoming from all undelivered, uncanceled orders
update inventory inv
set incoming = (
  select coalesce(sum(item.qty_ordered), 0)
  from mfg_order_items item
  join mfg_orders o on o.id = item.mfg_order_id
  where item.product_id = inv.product_id
    and item.received   = false
    and o.status        not in ('delivered', 'canceled')
);

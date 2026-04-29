-- Fix log_giveaway and deliver_order: don't update the generated 'status' column.
-- The inventory.status column is generated/computed — setting it explicitly causes an error.

create or replace function log_giveaway(
  p_product_id  uuid,
  p_qty         int,
  p_recipient   text,
  p_reason      text,
  p_notes       text,
  p_date        date default current_date
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_id uuid;
  v_on_hand int;
begin
  select on_hand into v_on_hand from inventory where product_id = p_product_id;
  if v_on_hand is null or v_on_hand < p_qty then
    raise exception 'Insufficient stock: have %, need %', coalesce(v_on_hand, 0), p_qty;
  end if;

  insert into gifts_log (product_id, qty, recipient, reason, notes, date)
  values (p_product_id, p_qty, p_recipient, p_reason, p_notes, p_date)
  returning id into v_id;

  update inventory
  set on_hand      = on_hand - p_qty,
      last_updated = now()
  where product_id = p_product_id;

  return v_id;
end;
$$;

create or replace function deliver_order(p_order_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update mfg_orders
  set status       = 'delivered',
      arrival_date = coalesce(arrival_date, current_date)
  where id = p_order_id;

  update inventory inv
  set on_hand      = inv.on_hand  + item.qty_ordered,
      incoming     = greatest(0, inv.incoming - item.qty_ordered),
      last_updated = now()
  from mfg_order_items item
  where item.mfg_order_id = p_order_id
    and item.received      = false
    and inv.product_id     = item.product_id;

  update mfg_order_items
  set received = true
  where mfg_order_id = p_order_id
    and received      = false;
end;
$$;

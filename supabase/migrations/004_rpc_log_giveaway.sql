-- Atomically logs a giveaway and decrements on_hand
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
  -- Check we have enough stock
  select on_hand into v_on_hand from inventory where product_id = p_product_id;
  if v_on_hand is null or v_on_hand < p_qty then
    raise exception 'Insufficient stock: have %, need %', coalesce(v_on_hand, 0), p_qty;
  end if;

  -- Insert gifts_log row
  insert into gifts_log (product_id, qty, recipient, reason, notes, date)
  values (p_product_id, p_qty, p_recipient, p_reason, p_notes, p_date)
  returning id into v_id;

  -- Decrement inventory
  update inventory
  set on_hand = on_hand - p_qty,
      status  = case
                  when on_hand - p_qty > low_stock_threshold then 'in_stock'
                  when on_hand - p_qty > 0                   then 'low'
                  else 'sold_out'
                end,
      last_updated = now()
  where product_id = p_product_id;

  return v_id;
end;
$$;

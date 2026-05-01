-- Retail (D2C) orders from the public checkout
-- Separate from wholesale_orders; distinguished by table name, not a type column.

create table if not exists retail_orders (
  id                uuid primary key default gen_random_uuid(),
  stripe_pi_id      text not null unique,
  order_number      text not null unique,
  customer_name     text not null,
  customer_email    text not null,
  shipping_address  jsonb not null,   -- { line1, line2, city, state, postal_code, country }
  subtotal_cents    integer not null,
  shipping_cents    integer not null,
  tax_cents         integer not null default 0,
  total_cents       integer not null,
  status            text not null default 'paid',
  stripe_metadata   jsonb,            -- raw PI metadata snapshot for debugging
  created_at        timestamptz not null default now()
);

create index if not exists retail_orders_stripe_pi_id_idx  on retail_orders(stripe_pi_id);
create index if not exists retail_orders_customer_email_idx on retail_orders(customer_email);
create index if not exists retail_orders_created_at_idx    on retail_orders(created_at desc);

create table if not exists retail_order_items (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references retail_orders(id) on delete cascade,
  product_id        text not null,    -- matches Sticker.id in lib/catalog.ts
  product_name      text not null,
  quantity          integer not null check (quantity > 0),
  unit_price_cents  integer not null,
  line_total_cents  integer not null
);

create index if not exists retail_order_items_order_id_idx on retail_order_items(order_id);

-- Enable RLS (admin reads all; public has no direct access — all writes via service role in webhook)
alter table retail_orders      enable row level security;
alter table retail_order_items enable row level security;

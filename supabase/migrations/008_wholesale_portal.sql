-- Wholesale portal orders
create table if not exists wholesale_orders (
  id               uuid primary key default gen_random_uuid(),
  order_id         text not null unique,
  account_id       text not null,
  customer_name    text not null,
  customer_email   text not null,
  items            jsonb not null default '[]',
  grand_total      numeric(10,2) not null,
  asap             boolean not null default false,
  order_stage      text not null default 'Pending',
  tracking_number  text,
  payment_sent     boolean not null default false,
  payment_sent_date date,
  created_at       timestamptz not null default now()
);

create index if not exists wholesale_orders_account_id_idx on wholesale_orders(account_id);
create index if not exists wholesale_orders_created_at_idx on wholesale_orders(created_at desc);

-- Wholesale portal suggestions
create table if not exists wholesale_suggestions (
  id             uuid primary key default gen_random_uuid(),
  account_id     text not null,
  type           text not null,
  priority       text not null default 'Medium',
  related_design text,
  message        text not null,
  created_at     timestamptz not null default now()
);

create index if not exists wholesale_suggestions_account_id_idx on wholesale_suggestions(account_id);

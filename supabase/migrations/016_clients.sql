-- Customer directory — populated automatically on every retail order.
-- Used for return requests and future email campaigns.

create table if not exists clients (
  id                  uuid        primary key default gen_random_uuid(),
  email               text        unique not null,
  name                text        not null default '',
  first_name          text        not null default '',
  phone               text,
  shipping_address    jsonb,
  order_count         integer     not null default 0,
  total_spent_cents   integer     not null default 0,
  first_order_at      timestamptz,
  last_order_at       timestamptz,
  is_subscribed       boolean     not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists clients_email_idx        on clients (email);
create index if not exists clients_last_order_idx   on clients (last_order_at desc);
create index if not exists clients_subscribed_idx   on clients (is_subscribed) where is_subscribed = true;

-- Service role has full access; anon has none
alter table clients enable row level security;

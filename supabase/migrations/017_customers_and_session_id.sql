-- Add stripe_session_id to retail_orders for Stripe hosted Checkout flow
alter table retail_orders add column if not exists stripe_session_id text unique;
create index if not exists retail_orders_stripe_session_id_idx on retail_orders (stripe_session_id);

-- ── Customers table ────────────────────────────────────────────────────
-- Persistent customer records built from retail orders.
-- Used for marketing campaigns, return customer lookup, and lifetime value tracking.
create table if not exists customers (
  id                   uuid        primary key default gen_random_uuid(),
  email                text        unique not null,
  first_name           text        not null default '',
  last_name            text        not null default '',
  phone                text,
  shipping_address     jsonb,
  first_purchase_at    timestamptz,
  last_purchase_at     timestamptz,
  total_spent_cents    integer     not null default 0,
  order_count          integer     not null default 0,
  marketing_opt_in     boolean     not null default false,
  marketing_opt_in_at  timestamptz,
  source               text        not null default 'retail',
  notes                text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists customers_email_idx
  on customers (email);

create index if not exists customers_marketing_opt_in_idx
  on customers (marketing_opt_in)
  where marketing_opt_in = true;

create index if not exists customers_last_purchase_at_idx
  on customers (last_purchase_at desc);

alter table customers enable row level security;
-- No public policies — service role only

alter table wholesale_orders
  add column if not exists payment_received boolean not null default false,
  add column if not exists payment_received_date date;

-- Product review comments: structured storage replacing free-text review_comments field
create table if not exists product_comments (
  id           uuid        primary key default gen_random_uuid(),
  product_id   uuid        not null references products(id) on delete cascade,
  body         text        not null,
  author       text        not null default 'Reviewer',
  author_type  text        not null default 'reviewer'
                           check (author_type in ('admin', 'reviewer')),
  parent_id    uuid        references product_comments(id) on delete set null,
  is_resolved  boolean     not null default false,
  resolved_at  timestamptz,
  resolved_by  text,
  created_at   timestamptz not null default now()
);

create index if not exists product_comments_product_id_idx on product_comments(product_id);
create index if not exists product_comments_created_at_idx  on product_comments(created_at desc);
create index if not exists product_comments_resolved_idx    on product_comments(is_resolved);

-- Enable RLS (service role bypasses, admin/reviewer access only via API)
alter table product_comments enable row level security;

-- Service role can do everything (used by API routes)
create policy "service_all" on product_comments
  for all using (true) with check (true);

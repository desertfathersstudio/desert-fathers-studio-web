create table if not exists misc_expenses (
  id          uuid primary key default gen_random_uuid(),
  date        date not null default current_date,
  description text not null,
  amount      numeric(10,2) not null,
  category    text not null default 'Other',
  notes       text,
  created_at  timestamptz not null default now()
);

alter table misc_expenses enable row level security;

drop policy if exists "misc_expenses_admin_all" on misc_expenses;
create policy "misc_expenses_admin_all" on misc_expenses for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Admin passkeys table for WebAuthn / Face ID login
create table if not exists admin_passkeys (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  credential_id   text not null unique,
  public_key      text not null,
  counter         bigint not null default 0,
  device_name     text,
  created_at      timestamptz not null default now(),
  last_used_at    timestamptz
);

create index if not exists admin_passkeys_user_id_idx on admin_passkeys(user_id);
create index if not exists admin_passkeys_credential_id_idx on admin_passkeys(credential_id);

alter table admin_passkeys enable row level security;

create policy "admin_passkeys_admin_all"
  on admin_passkeys for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

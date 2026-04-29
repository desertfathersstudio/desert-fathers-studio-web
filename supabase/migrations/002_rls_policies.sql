-- RLS: allow all operations for authenticated users on every admin table
-- Tighten when wholesale customer logins are added

do $$
declare
  tbl text;
  tables text[] := array[
    'products','sticker_packs','categories','inventory','pack_inventory',
    'pricing_tiers','wholesale_accounts','mfg_orders','mfg_order_items',
    'sales_orders','sales_order_items','design_ideas','public_suggestions',
    'expenses','gifts_log','suppliers'
  ];
begin
  foreach tbl in array tables loop
    execute format('alter table %I enable row level security', tbl);
    execute format(
      'create policy if not exists "%s_admin_all" on %I for all
       using (auth.role() = ''authenticated'')
       with check (auth.role() = ''authenticated'')',
      tbl, tbl
    );
  end loop;
end $$;

-- NOTE: This migration was superseded by 034_wholesale_portal_accounts.sql.
--
-- The original INSERT targeted wholesale_accounts (wrong name — conflicts with
-- the pre-existing CRM table). Migration 034 seeds wholesale_portal_accounts
-- instead. This file is retained for history and corrected to target the right
-- table; on an existing DB, 034 will have already seeded everything and the
-- ON CONFLICT DO NOTHING clause makes this a safe no-op.

INSERT INTO wholesale_portal_accounts
  (account_id, display_name, notify_email, pin, has_pending_tab, can_edit_fulfillment,
   contact_names, price_single, price_rp_pack, price_hwp_pack, currency_symbol,
   min_qty, qty_options, pack_prices)
VALUES
  ('abbey',
   'St. Mary and St. Moses Abbey',
   'st.mosesbookstore@gmail.com',
   '1001', true, true,
   ARRAY['Fr. Arsanios Abba Moses','Fr. Karas Abba Moses','Fr. Zosima Abba Moses','Br. Abanob Abba Moses'],
   null, null, null, '$', 25, ARRAY[5,10], '{"PK-3": 2.00}'::jsonb),

  ('demiana',
   'St. Demiana Convent, GA',
   'stdemianabookstore@suscopts.org',
   '5095', false, false,
   ARRAY['Omina Dolagy'],
   0.90, 5.00, 10.00, '$', null, null, null),

  ('antony',
   'Saint Antony Coptic Orthodox Monastery',
   'st.mosesbookstore@gmail.com',
   '4372', false, false, '{}',
   0.90, 5.00, 10.00, '$', null, null, null),

  ('paul',
   'Saint Paul Coptic Orthodox Monastery',
   'st.mosesbookstore@gmail.com',
   '3874', false, false, '{}',
   0.90, 5.00, 10.00, '$', null, null, null),

  ('katherine',
   'Saint Katherine of Alexandria & Saint Verena Coptic Orthodox Convent',
   'st.mosesbookstore@gmail.com',
   '2612', false, false, '{}',
   0.90, 5.00, 10.00, '$', null, null, null),

  ('shenouda',
   'Saint Shenouda Monastery',
   'st.mosesbookstore@gmail.com',
   '8419', false, false, '{}',
   1.40, 8.00, 16.00, 'A$', null, null, null),

  ('maryjohn',
   'St. Mary & St. John Convent, Ohio',
   'st.mosesbookstore@gmail.com',
   '8640', false, false, '{}',
   0.90, 5.00, 10.00, '$', null, null, null)

ON CONFLICT (account_id) DO NOTHING;

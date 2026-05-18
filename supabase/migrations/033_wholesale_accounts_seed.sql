-- Seed the 7 existing wholesale accounts from the hardcoded TypeScript config.
-- Uses ON CONFLICT DO NOTHING so this is safe to re-run.

INSERT INTO wholesale_accounts
  (account_id, display_name, notify_email, pin, has_pending_tab, can_edit_fulfillment,
   contact_names, price_single, price_rp_pack, price_hwp_pack, currency_symbol,
   min_qty, qty_options, pack_prices)
VALUES
  -- Abbey: custom pricing (uses global defaults), custom minQty + qtyOptions + packPrices
  ('abbey',
   'St. Mary and St. Moses Abbey',
   'st.mosesbookstore@gmail.com',
   '1001',
   true,   -- hasPendingTab
   true,   -- canEditFulfillment
   ARRAY['Fr. Arsanios Abba Moses', 'Fr. Karas Abba Moses', 'Fr. Zosima Abba Moses', 'Br. Abanob Abba Moses'],
   null, null, null, '$',  -- null pricing = use global wholesale defaults
   25,                     -- minQty
   ARRAY[5, 10],           -- qtyOptions
   '{"PK-3": 2.00}'::jsonb),

  -- Demiana: custom pricing $0.90/$5/$10
  ('demiana',
   'St. Demiana Convent, GA',
   'stdemianabookstore@suscopts.org',
   '5095',
   false, false,
   ARRAY['Omina Dolagy'],
   0.90, 5.00, 10.00, '$',
   null, null, null),

  -- Antony: same pricing as Demiana
  ('antony',
   'Saint Antony Coptic Orthodox Monastery',
   'st.mosesbookstore@gmail.com',
   '4372',
   false, false,
   '{}',
   0.90, 5.00, 10.00, '$',
   null, null, null),

  -- Paul: same pricing as Demiana
  ('paul',
   'Saint Paul Coptic Orthodox Monastery',
   'st.mosesbookstore@gmail.com',
   '3874',
   false, false,
   '{}',
   0.90, 5.00, 10.00, '$',
   null, null, null),

  -- Katherine: same pricing as Demiana
  ('katherine',
   'Saint Katherine of Alexandria & Saint Verena Coptic Orthodox Convent',
   'st.mosesbookstore@gmail.com',
   '2612',
   false, false,
   '{}',
   0.90, 5.00, 10.00, '$',
   null, null, null),

  -- Shenouda: Australian pricing A$1.40/A$8/A$16
  ('shenouda',
   'Saint Shenouda Monastery',
   'st.mosesbookstore@gmail.com',
   '8419',
   false, false,
   '{}',
   1.40, 8.00, 16.00, 'A$',
   null, null, null),

  -- Mary & John: same pricing as Demiana
  ('maryjohn',
   'St. Mary & St. John Convent, Ohio',
   'st.mosesbookstore@gmail.com',
   '8640',
   false, false,
   '{}',
   0.90, 5.00, 10.00, '$',
   null, null, null)
ON CONFLICT (account_id) DO NOTHING;

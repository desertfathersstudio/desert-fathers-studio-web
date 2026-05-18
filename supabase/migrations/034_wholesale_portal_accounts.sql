-- Wholesale PORTAL accounts — PIN-based authentication and per-account config
-- for the /wholesale-portal area.
--
-- The pre-existing wholesale_accounts table (created manually, columns: id,
-- user_id, business_name, contact_name, email, pricing_tier_id, consignment,
-- payment_terms, approved, notes, …) is a separate CRM table for managing
-- external wholesale business relationships and is NOT touched here.
--
-- Migration 032 silently no-op'd (IF NOT EXISTS hit the old table) and
-- migration 033 failed because the columns didn't match. This migration
-- creates the portal table under a non-conflicting name and seeds all data.

-- ── Portal accounts table ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS wholesale_portal_accounts (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id           text UNIQUE NOT NULL,       -- URL-safe slug: "abbey", "demiana"
  display_name         text NOT NULL,
  notify_email         text NOT NULL DEFAULT 'st.mosesbookstore@gmail.com',
  pin                  text NOT NULL,              -- 4–8 digit PIN (portal is internal-only)
  has_pending_tab      boolean NOT NULL DEFAULT false,
  can_edit_fulfillment boolean NOT NULL DEFAULT false,
  contact_names        text[] NOT NULL DEFAULT '{}',
  -- Pricing overrides (null = use global wholesale default)
  price_single         numeric(8,2),
  price_rp_pack        numeric(8,2),
  price_hwp_pack       numeric(8,2),
  currency_symbol      text NOT NULL DEFAULT '$',
  min_qty              integer,                    -- null = global default (50)
  qty_options          integer[],                  -- null = global QTY_OPTIONS
  pack_prices          jsonb,                      -- e.g. {"PK-3": 2.00}; null = none
  active               boolean NOT NULL DEFAULT true,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE wholesale_portal_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_wholesale_portal_accounts"
  ON wholesale_portal_accounts FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ── Private admin notes (one free-form note per account) ──────────────────────

CREATE TABLE IF NOT EXISTS account_admin_notes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES wholesale_portal_accounts(id) ON DELETE CASCADE,
  content    text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE account_admin_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_account_admin_notes"
  ON account_admin_notes FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ── Timestamped conversation log entries ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS account_log_entries (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES wholesale_portal_accounts(id) ON DELETE CASCADE,
  content    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE account_log_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_account_log_entries"
  ON account_log_entries FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ── Reminders / future discounts ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS account_reminders (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES wholesale_portal_accounts(id) ON DELETE CASCADE,
  content    text NOT NULL,
  due_date   date,
  completed  boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE account_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_account_reminders"
  ON account_reminders FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ── Auto-update updated_at ────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION touch_wholesale_portal_account_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_touch_wholesale_portal_account ON wholesale_portal_accounts;
CREATE TRIGGER trg_touch_wholesale_portal_account
  BEFORE UPDATE ON wholesale_portal_accounts
  FOR EACH ROW EXECUTE FUNCTION touch_wholesale_portal_account_updated_at();

-- ── Seed all 7 existing portal accounts ──────────────────────────────────────

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

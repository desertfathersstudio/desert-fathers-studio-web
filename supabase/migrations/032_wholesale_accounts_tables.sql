-- NOTE: This migration was superseded by 034_wholesale_portal_accounts.sql.
--
-- The original intent was to create a wholesale_portal_accounts table, but the
-- table name "wholesale_accounts" conflicted with a pre-existing CRM table
-- (columns: business_name, consignment, payment_terms, pricing_tier_id, etc.)
-- that was created outside of migrations. Migration 032 silently no-op'd
-- (IF NOT EXISTS hit the old table), and migration 033 subsequently failed.
--
-- Migration 034 creates the correct table as wholesale_portal_accounts and
-- seeds all 7 accounts. Run 034 instead of this file on existing databases.
-- On a fresh database, 034 still creates the right table first; this file
-- does nothing (all statements use IF NOT EXISTS or are already idempotent
-- against wholesale_portal_accounts).

-- Re-targeted to wholesale_portal_accounts so fresh-DB runs are correct:

CREATE TABLE IF NOT EXISTS wholesale_portal_accounts (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id           text UNIQUE NOT NULL,
  display_name         text NOT NULL,
  notify_email         text NOT NULL DEFAULT 'st.mosesbookstore@gmail.com',
  pin                  text NOT NULL,
  has_pending_tab      boolean NOT NULL DEFAULT false,
  can_edit_fulfillment boolean NOT NULL DEFAULT false,
  contact_names        text[] NOT NULL DEFAULT '{}',
  price_single         numeric(8,2),
  price_rp_pack        numeric(8,2),
  price_hwp_pack       numeric(8,2),
  currency_symbol      text NOT NULL DEFAULT '$',
  min_qty              integer,
  qty_options          integer[],
  pack_prices          jsonb,
  active               boolean NOT NULL DEFAULT true,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE wholesale_portal_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_wholesale_portal_accounts" ON wholesale_portal_accounts;
CREATE POLICY "admin_all_wholesale_portal_accounts"
  ON wholesale_portal_accounts FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS account_admin_notes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES wholesale_portal_accounts(id) ON DELETE CASCADE,
  content    text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE account_admin_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_account_admin_notes" ON account_admin_notes;
CREATE POLICY "admin_all_account_admin_notes"
  ON account_admin_notes FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS account_log_entries (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES wholesale_portal_accounts(id) ON DELETE CASCADE,
  content    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE account_log_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_account_log_entries" ON account_log_entries;
CREATE POLICY "admin_all_account_log_entries"
  ON account_log_entries FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS account_reminders (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES wholesale_portal_accounts(id) ON DELETE CASCADE,
  content    text NOT NULL,
  due_date   date,
  completed  boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE account_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_account_reminders" ON account_reminders;
CREATE POLICY "admin_all_account_reminders"
  ON account_reminders FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

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

-- Wholesale Accounts Management
-- Moves account config (PINs, pricing, feature flags) from hardcoded TypeScript to the DB.
-- Admin-only tables — accessible only to authenticated Supabase users (admin dashboard).
-- Wholesale portal routes use the service-role key directly, bypassing RLS.

-- ── Main accounts table ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS wholesale_accounts (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id          text UNIQUE NOT NULL,        -- URL-safe slug: "abbey", "demiana"
  display_name        text NOT NULL,
  notify_email        text NOT NULL DEFAULT 'st.mosesbookstore@gmail.com',
  pin                 text NOT NULL,               -- 4–8 digit PIN, stored as plain text (portal is internal-only)
  has_pending_tab     boolean NOT NULL DEFAULT false,
  can_edit_fulfillment boolean NOT NULL DEFAULT false,
  contact_names       text[] NOT NULL DEFAULT '{}',
  -- Pricing overrides (null = use global wholesale default)
  price_single        numeric(8,2),
  price_rp_pack       numeric(8,2),
  price_hwp_pack      numeric(8,2),
  currency_symbol     text NOT NULL DEFAULT '$',
  min_qty             integer,                     -- null = global default (50)
  qty_options         integer[],                   -- null = global QTY_OPTIONS
  pack_prices         jsonb,                       -- e.g. {"PK-3": 2.00}; null = no overrides
  active              boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE wholesale_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_wholesale_accounts"
  ON wholesale_accounts FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ── Private admin notes (one note per account, free-form) ─────────────────────

CREATE TABLE IF NOT EXISTS account_admin_notes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES wholesale_accounts(id) ON DELETE CASCADE,
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
  account_id uuid NOT NULL REFERENCES wholesale_accounts(id) ON DELETE CASCADE,
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
  account_id uuid NOT NULL REFERENCES wholesale_accounts(id) ON DELETE CASCADE,
  content    text NOT NULL,
  due_date   date,
  completed  boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE account_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_account_reminders"
  ON account_reminders FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ── Auto-update updated_at on wholesale_accounts ──────────────────────────────

CREATE OR REPLACE FUNCTION touch_wholesale_account_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_touch_wholesale_account ON wholesale_accounts;
CREATE TRIGGER trg_touch_wholesale_account
  BEFORE UPDATE ON wholesale_accounts
  FOR EACH ROW EXECUTE FUNCTION touch_wholesale_account_updated_at();

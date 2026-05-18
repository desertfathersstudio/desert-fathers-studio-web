-- BUG FIX: account_admin_notes, account_log_entries, account_reminders were
-- created by migration 032 with FK pointing to wholesale_accounts (the CRM
-- table) instead of wholesale_portal_accounts.  Migration 034 used
-- CREATE TABLE IF NOT EXISTS for the support tables, so they were skipped
-- entirely — leaving the wrong FK in place.
--
-- Fix: drop the three wrong FK constraints, recreate pointing to the correct
-- parent table.  Also add a UNIQUE constraint on account_admin_notes.account_id
-- so the upsert in upsertAdminNote can use INSERT … ON CONFLICT DO UPDATE
-- instead of the racy check-then-insert pattern.

-- ── account_admin_notes ───────────────────────────────────────────────────────

ALTER TABLE account_admin_notes
  DROP CONSTRAINT IF EXISTS account_admin_notes_account_id_fkey;

ALTER TABLE account_admin_notes
  ADD CONSTRAINT account_admin_notes_account_id_fkey
  FOREIGN KEY (account_id) REFERENCES wholesale_portal_accounts(id) ON DELETE CASCADE;

-- One note per account (enables true upsert in the server action).
ALTER TABLE account_admin_notes
  DROP CONSTRAINT IF EXISTS account_admin_notes_account_id_key;

ALTER TABLE account_admin_notes
  ADD CONSTRAINT account_admin_notes_account_id_key UNIQUE (account_id);

-- ── account_log_entries ───────────────────────────────────────────────────────

ALTER TABLE account_log_entries
  DROP CONSTRAINT IF EXISTS account_log_entries_account_id_fkey;

ALTER TABLE account_log_entries
  ADD CONSTRAINT account_log_entries_account_id_fkey
  FOREIGN KEY (account_id) REFERENCES wholesale_portal_accounts(id) ON DELETE CASCADE;

-- ── account_reminders ─────────────────────────────────────────────────────────

ALTER TABLE account_reminders
  DROP CONSTRAINT IF EXISTS account_reminders_account_id_fkey;

ALTER TABLE account_reminders
  ADD CONSTRAINT account_reminders_account_id_fkey
  FOREIGN KEY (account_id) REFERENCES wholesale_portal_accounts(id) ON DELETE CASCADE;

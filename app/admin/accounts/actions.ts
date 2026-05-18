"use server";

import { createSupabaseService } from "@/lib/supabase/service";

export interface AccountRow {
  id: string;
  account_id: string;
  display_name: string;
  notify_email: string;
  pin: string;
  has_pending_tab: boolean;
  can_edit_fulfillment: boolean;
  contact_names: string[];
  price_single: number | null;
  price_rp_pack: number | null;
  price_hwp_pack: number | null;
  currency_symbol: string;
  min_qty: number | null;
  qty_options: number[] | null;
  pack_prices: Record<string, number> | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminNote {
  id: string;
  account_id: string;
  content: string;
  updated_at: string;
}

export interface LogEntry {
  id: string;
  account_id: string;
  content: string;
  created_at: string;
}

export interface Reminder {
  id: string;
  account_id: string;
  content: string;
  due_date: string | null;
  completed: boolean;
  created_at: string;
}

// ── Account CRUD ──────────────────────────────────────────────────────────────

export async function listAccounts(): Promise<AccountRow[]> {
  const sb = createSupabaseService();
  const { data, error } = await sb
    .from("wholesale_portal_accounts")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as AccountRow[];
}

export async function getAccount(id: string): Promise<AccountRow | null> {
  const sb = createSupabaseService();
  const { data, error } = await sb
    .from("wholesale_portal_accounts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as AccountRow | null;
}

export async function createAccount(fields: {
  account_id: string;
  display_name: string;
  notify_email: string;
  pin: string;
  has_pending_tab: boolean;
  can_edit_fulfillment: boolean;
  contact_names: string[];
  price_single: number | null;
  price_rp_pack: number | null;
  price_hwp_pack: number | null;
  currency_symbol: string;
  min_qty: number | null;
  qty_options: number[] | null;
  pack_prices: Record<string, number> | null;
}): Promise<AccountRow> {
  const sb = createSupabaseService();
  const { data, error } = await sb
    .from("wholesale_portal_accounts")
    .insert(fields)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as AccountRow;
}

export async function updateAccount(
  id: string,
  fields: Partial<Omit<AccountRow, "id" | "created_at" | "updated_at">>
): Promise<void> {
  const sb = createSupabaseService();
  const { error } = await sb
    .from("wholesale_portal_accounts")
    .update(fields)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteAccount(id: string): Promise<void> {
  const sb = createSupabaseService();
  // Soft delete: set active = false
  const { error } = await sb
    .from("wholesale_portal_accounts")
    .update({ active: false })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function restoreAccount(id: string): Promise<void> {
  const sb = createSupabaseService();
  const { error } = await sb
    .from("wholesale_portal_accounts")
    .update({ active: true })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function duplicateAccount(
  sourceId: string,
  newAccountId: string,
  newDisplayName: string,
  newPin: string
): Promise<AccountRow> {
  const source = await getAccount(sourceId);
  if (!source) throw new Error("Source account not found");

  return createAccount({
    account_id:          newAccountId,
    display_name:        newDisplayName,
    notify_email:        source.notify_email,
    pin:                 newPin,
    has_pending_tab:     false,
    can_edit_fulfillment: false,
    contact_names:       [],
    price_single:        source.price_single,
    price_rp_pack:       source.price_rp_pack,
    price_hwp_pack:      source.price_hwp_pack,
    currency_symbol:     source.currency_symbol,
    min_qty:             source.min_qty,
    qty_options:         source.qty_options,
    pack_prices:         source.pack_prices,
  });
}

// ── Admin Notes ───────────────────────────────────────────────────────────────

export async function getAdminNote(accountId: string): Promise<AdminNote | null> {
  const sb = createSupabaseService();
  const { data, error } = await sb
    .from("account_admin_notes")
    .select("*")
    .eq("account_id", accountId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as AdminNote | null;
}

export async function upsertAdminNote(accountId: string, content: string): Promise<void> {
  const sb = createSupabaseService();
  const { data: existing } = await sb
    .from("account_admin_notes")
    .select("id")
    .eq("account_id", accountId)
    .maybeSingle();

  if (existing) {
    const { error } = await sb
      .from("account_admin_notes")
      .update({ content, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await sb
      .from("account_admin_notes")
      .insert({ account_id: accountId, content });
    if (error) throw new Error(error.message);
  }
}

// ── Log Entries ───────────────────────────────────────────────────────────────

export async function getLogEntries(accountId: string): Promise<LogEntry[]> {
  const sb = createSupabaseService();
  const { data, error } = await sb
    .from("account_log_entries")
    .select("*")
    .eq("account_id", accountId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as LogEntry[];
}

export async function addLogEntry(accountId: string, content: string): Promise<LogEntry> {
  const sb = createSupabaseService();
  const { data, error } = await sb
    .from("account_log_entries")
    .insert({ account_id: accountId, content })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as LogEntry;
}

export async function deleteLogEntry(entryId: string): Promise<void> {
  const sb = createSupabaseService();
  const { error } = await sb
    .from("account_log_entries")
    .delete()
    .eq("id", entryId);
  if (error) throw new Error(error.message);
}

// ── Reminders ─────────────────────────────────────────────────────────────────

export async function getReminders(accountId: string): Promise<Reminder[]> {
  const sb = createSupabaseService();
  const { data, error } = await sb
    .from("account_reminders")
    .select("*")
    .eq("account_id", accountId)
    .order("due_date", { ascending: true, nullsFirst: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Reminder[];
}

export async function addReminder(
  accountId: string,
  content: string,
  dueDate: string | null
): Promise<Reminder> {
  const sb = createSupabaseService();
  const { data, error } = await sb
    .from("account_reminders")
    .insert({ account_id: accountId, content, due_date: dueDate })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Reminder;
}

export async function toggleReminder(reminderId: string, completed: boolean): Promise<void> {
  const sb = createSupabaseService();
  const { error } = await sb
    .from("account_reminders")
    .update({ completed })
    .eq("id", reminderId);
  if (error) throw new Error(error.message);
}

export async function deleteReminder(reminderId: string): Promise<void> {
  const sb = createSupabaseService();
  const { error } = await sb
    .from("account_reminders")
    .delete()
    .eq("id", reminderId);
  if (error) throw new Error(error.message);
}

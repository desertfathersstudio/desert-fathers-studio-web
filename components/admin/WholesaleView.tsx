"use client";

import { useState } from "react";
import { Plus, Edit2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import type { WholesaleAccount, PricingTier } from "@/lib/admin/types";

export function WholesaleView({
  accounts: initialAccounts,
  tiers,
}: {
  accounts: WholesaleAccount[];
  tiers: PricingTier[];
}) {
  const [accounts, setAccounts] = useState<WholesaleAccount[]>(initialAccounts);
  const [addOpen, setAddOpen]   = useState(false);
  const [editAccount, setEditAccount] = useState<WholesaleAccount | null>(null);

  const approved   = accounts.filter((a) => a.approved).length;
  const pending    = accounts.filter((a) => !a.approved).length;
  const consignment = accounts.filter((a) => a.consignment).length;

  async function toggleApproval(account: WholesaleAccount) {
    const sb = createSupabaseBrowser();
    const { error } = await sb
      .from("wholesale_accounts")
      .update({ approved: !account.approved })
      .eq("id", account.id);
    if (error) { toast.error(error.message); return; }
    setAccounts((prev) => prev.map((a) => a.id === account.id ? { ...a, approved: !a.approved } : a));
    toast.success(account.approved ? "Account suspended" : "Account approved");
  }

  return (
    <div style={{ padding: "1.25rem", maxWidth: 900, margin: "0 auto", fontFamily: "Inter, system-ui, sans-serif" }}>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "0.75rem", marginBottom: "1.25rem" }}>
        {[
          { label: "Total Accounts",  value: accounts.length },
          { label: "Approved",        value: approved,    accent: "#16a34a" },
          { label: "Pending",         value: pending,     accent: "#3949ab" },
          { label: "Consignment",     value: consignment, accent: "#b45309" },
        ].map((s) => (
          <div key={s.label} style={{ background: "#fff", border: "1px solid #e8ddd5", borderRadius: 10, padding: "0.875rem 1rem" }}>
            <p style={{ margin: "0 0 4px", fontSize: "0.68rem", fontWeight: 600, color: "#9a7080", textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</p>
            <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: s.accent ?? "#2a1a0e", letterSpacing: "-0.03em", lineHeight: 1 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
        <button
          onClick={() => setAddOpen(true)}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, background: "#6b1d3b", color: "#fff", border: "none", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
        >
          <Plus size={14} />
          Add Account
        </button>
      </div>

      {/* Account list */}
      {accounts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#9a7080", fontSize: "0.9rem" }}>No wholesale accounts.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          {accounts.map((account) => (
            <div key={account.id} style={{ background: "#fff", border: "1px solid #e8ddd5", borderRadius: 10, padding: "0.875rem 1rem", display: "flex", alignItems: "center", gap: "0.875rem" }}>
              {/* Approval indicator */}
              <div style={{ flexShrink: 0 }}>
                {account.approved
                  ? <CheckCircle2 size={18} color="#16a34a" />
                  : <XCircle size={18} color="#9a7080" />
                }
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: "0 0 2px", fontWeight: 600, fontSize: "0.88rem", color: "#2a1a0e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {account.business_name}
                  {account.consignment && (
                    <span style={{ marginLeft: 8, fontSize: "0.7rem", fontWeight: 600, background: "rgba(180,83,9,0.1)", color: "#b45309", borderRadius: 4, padding: "1px 6px" }}>
                      Consignment
                    </span>
                  )}
                </p>
                <p style={{ margin: 0, fontSize: "0.72rem", color: "#9a7080" }}>
                  {account.contact_name ?? ""}
                  {account.email ? ` · ${account.email}` : ""}
                  {account.city ? ` · ${account.city}${account.state ? `, ${account.state}` : ""}` : ""}
                  {account.pricing_tiers?.name ? ` · ${account.pricing_tiers.name}` : ""}
                </p>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button
                  onClick={() => toggleApproval(account)}
                  style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid", borderColor: account.approved ? "#e8ddd5" : "#16a34a", background: "transparent", color: account.approved ? "#6b4050" : "#16a34a", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                >
                  {account.approved ? "Suspend" : "Approve"}
                </button>
                <button onClick={() => setEditAccount(account)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9a7080", padding: 4 }}>
                  <Edit2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(addOpen || editAccount) && (
        <AccountModal
          account={editAccount ?? undefined}
          tiers={tiers}
          onClose={() => { setAddOpen(false); setEditAccount(null); }}
          onSaved={(acc) => {
            if (editAccount) {
              setAccounts((prev) => prev.map((a) => a.id === acc.id ? acc : a));
            } else {
              setAccounts((prev) => [...prev, acc].sort((a, b) => a.business_name.localeCompare(b.business_name)));
            }
            setAddOpen(false);
            setEditAccount(null);
          }}
        />
      )}
    </div>
  );
}

function AccountModal({
  account,
  tiers,
  onClose,
  onSaved,
}: {
  account?: WholesaleAccount;
  tiers: PricingTier[];
  onClose: () => void;
  onSaved: (a: WholesaleAccount) => void;
}) {
  const sb = createSupabaseBrowser();
  const [businessName, setBusinessName] = useState(account?.business_name ?? "");
  const [contactName, setContactName]   = useState(account?.contact_name ?? "");
  const [email, setEmail]               = useState(account?.email ?? "");
  const [phone, setPhone]               = useState(account?.phone ?? "");
  const [city, setCity]                 = useState(account?.city ?? "");
  const [state, setState]               = useState(account?.state ?? "");
  const [tierId, setTierId]             = useState(account?.pricing_tier_id ?? "");
  const [consignment, setConsignment]   = useState(account?.consignment ?? false);
  const [paymentTerms, setPaymentTerms] = useState(account?.payment_terms ?? "");
  const [notes, setNotes]               = useState(account?.notes ?? "");
  const [approved, setApproved]         = useState(account?.approved ?? false);
  const [saving, setSaving]             = useState(false);

  async function handleSave() {
    if (!businessName.trim()) { toast.error("Business name required"); return; }
    setSaving(true);
    try {
      const payload = {
        business_name: businessName.trim(),
        contact_name: contactName || null,
        email: email || null,
        phone: phone || null,
        city: city || null,
        state: state || null,
        pricing_tier_id: tierId || null,
        consignment,
        payment_terms: paymentTerms || null,
        notes: notes || null,
        approved,
      };

      if (account) {
        const { data, error } = await sb.from("wholesale_accounts").update(payload).eq("id", account.id).select("*, pricing_tiers(name)").single();
        if (error) throw error;
        toast.success("Account updated");
        onSaved(data as WholesaleAccount);
      } else {
        const { data, error } = await sb.from("wholesale_accounts").insert(payload).select("*, pricing_tiers(name)").single();
        if (error) throw error;
        toast.success("Account added");
        onSaved(data as WholesaleAccount);
      }
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 20px 60px rgba(0,0,0,0.25)", width: "100%", maxWidth: 500, maxHeight: "90dvh", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "Inter, system-ui, sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.125rem 0.875rem", borderBottom: "1px solid #e8ddd5" }}>
          <p style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#2a1a0e" }}>{account ? "Edit Account" : "Add Wholesale Account"}</p>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9a7080", padding: 4, fontSize: "1rem" }}>✕</button>
        </div>
        <div style={{ padding: "1.125rem", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          <div>
            <Label>Business Name *</Label>
            <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <Label>Contact Name</Label>
              <input value={contactName} onChange={(e) => setContactName(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <Label>Email</Label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <Label>Phone</Label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <Label>Pricing Tier</Label>
              <select value={tierId} onChange={(e) => setTierId(e.target.value)} style={inputStyle}>
                <option value="">— None —</option>
                {tiers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <Label>City</Label>
              <input value={city} onChange={(e) => setCity(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <Label>State</Label>
              <input value={state} onChange={(e) => setState(e.target.value)} style={inputStyle} />
            </div>
          </div>
          <div>
            <Label>Payment Terms</Label>
            <input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder="e.g. Net 30, prepaid" style={inputStyle} />
          </div>
          <div>
            <Label>Notes</Label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical" as const, height: "auto" }} />
          </div>
          <div style={{ display: "flex", gap: "1.25rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: "0.85rem", color: "#2a1a0e", fontFamily: "Inter, system-ui, sans-serif" }}>
              <input type="checkbox" checked={approved} onChange={(e) => setApproved(e.target.checked)} style={{ width: 15, height: 15 }} />
              Approved
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: "0.85rem", color: "#2a1a0e", fontFamily: "Inter, system-ui, sans-serif" }}>
              <input type="checkbox" checked={consignment} onChange={(e) => setConsignment(e.target.checked)} style={{ width: 15, height: 15 }} />
              Consignment
            </label>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.625rem", alignItems: "center", justifyContent: "flex-end", padding: "0.875rem 1.125rem", borderTop: "1px solid #e8ddd5" }}>
          <button onClick={onClose} style={outlineBtn}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={primaryBtn}>{saving ? "Saving…" : account ? "Update" : "Add Account"}</button>
        </div>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "#6b4050", marginBottom: 4, fontFamily: "Inter, system-ui, sans-serif", textTransform: "uppercase", letterSpacing: "0.05em" }}>{children}</label>;
}
const inputStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box" as const, padding: "7px 10px", border: "1px solid #e8ddd5", borderRadius: 7, fontSize: "0.85rem", fontFamily: "Inter, system-ui, sans-serif", color: "#2a1a0e", background: "#fff", outline: "none" };
const primaryBtn: React.CSSProperties = { display: "flex", alignItems: "center", gap: 5, padding: "7px 16px", borderRadius: 7, background: "#6b1d3b", color: "#fff", border: "none", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" };
const outlineBtn: React.CSSProperties = { display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 7, background: "transparent", color: "#6b4050", border: "1px solid #e8ddd5", fontSize: "0.82rem", fontWeight: 500, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" };

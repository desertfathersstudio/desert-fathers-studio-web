"use client";

import { useState, useEffect, useCallback, useTransition, useRef } from "react";
import { toast } from "sonner";
import {
  Plus, Eye, EyeOff, Copy, Trash2, RotateCcw, Save,
  ChevronLeft, ChevronRight, StickyNote, ScrollText, Bell, Settings,
  X, Check, CalendarDays, Loader2,
} from "lucide-react";
import {
  listAccounts, createAccount, updateAccount, deleteAccount, restoreAccount, duplicateAccount,
  getAdminNote, upsertAdminNote,
  getLogEntries, addLogEntry, deleteLogEntry,
  getReminders, addReminder, toggleReminder, deleteReminder,
} from "@/app/admin/accounts/actions";
import type { AccountRow, AdminNote, LogEntry, Reminder } from "@/app/admin/accounts/actions";
import { WS_PRICE_SINGLE, WS_PRICE_RP_PACK, WS_PRICE_HWP_PACK } from "@/lib/wholesale/pricing";

// ── Color tokens ──────────────────────────────────────────────────────────────
const C = {
  bg:        "#f5f0ea",
  surface:   "#fff",
  border:    "#e5ddd6",
  brand:     "#6b1f2a",
  brandDim:  "#9b4d5a",
  text:      "#1a0d12",
  muted:     "#7a6268",
  danger:    "#c0392b",
  green:     "#15803d",
  inputBg:   "#faf7f4",
};

type Tab = "settings" | "notes" | "log" | "reminders";
type MobileView = "list" | "detail";

// ── CSS injected once for responsive layout ───────────────────────────────────
const LAYOUT_CSS = `
  @keyframes acct-spin { to { transform: rotate(360deg); } }

  .acct-root {
    position: relative;
    min-height: calc(100dvh - 52px);
    background: ${C.bg};
  }

  /* ── Mobile: single-pane navigation ── */
  .acct-list-panel {
    display: flex;
    flex-direction: column;
    width: 100%;
    background: #faf7f4;
    min-height: calc(100dvh - 52px - 58px - env(safe-area-inset-bottom, 0px));
    overflow-y: auto;
  }
  .acct-detail-panel {
    display: none;
    flex-direction: column;
    width: 100%;
    min-height: calc(100dvh - 52px - 58px - env(safe-area-inset-bottom, 0px));
    overflow-y: auto;
  }

  /* detail view active on mobile */
  .acct-root.show-detail .acct-list-panel   { display: none; }
  .acct-root.show-detail .acct-detail-panel { display: flex; }

  /* ── Desktop: two-column side-by-side ── */
  @media (min-width: 768px) {
    .acct-root {
      display: flex;
    }
    .acct-list-panel {
      width: 320px;
      flex-shrink: 0;
      border-right: 1px solid ${C.border};
      min-height: calc(100dvh - 52px);
    }
    .acct-detail-panel {
      display: flex !important;  /* always visible on desktop */
      flex: 1;
      min-width: 0;
      min-height: calc(100dvh - 52px);
    }
    .acct-root.show-detail .acct-list-panel { display: flex !important; }
    .acct-back-btn { display: none !important; }
  }

  /* ── Tabs: horizontally scrollable on mobile ── */
  .acct-tabs {
    display: flex;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    border-bottom: 1px solid ${C.border};
    background: ${C.surface};
    padding-left: 0.5rem;
    flex-shrink: 0;
  }
  .acct-tabs::-webkit-scrollbar { display: none; }

  .acct-tab-btn {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.75rem 0.875rem;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    font-size: 0.85rem;
    font-family: inherit;
    white-space: nowrap;
    flex-shrink: 0;
    margin-bottom: -1px;
    transition: color 0.12s;
    color: ${C.muted};
    font-weight: 400;
  }
  .acct-tab-btn.active {
    border-bottom-color: ${C.brand};
    color: ${C.brand};
    font-weight: 600;
  }

  /* ── Tab content: bottom padding clears mobile nav bar ── */
  .acct-tab-content {
    flex: 1;
    padding: 1.25rem;
    max-width: 720px;
    box-sizing: border-box;
    padding-bottom: calc(80px + env(safe-area-inset-bottom, 16px));
  }
  @media (min-width: 768px) {
    .acct-tab-content {
      padding: 1.5rem;
      padding-bottom: 1.5rem;
    }
  }

  /* ── Detail panel header ── */
  .acct-detail-header {
    padding: 0.875rem 1rem;
    border-bottom: 1px solid ${C.border};
    background: ${C.surface};
    display: flex;
    align-items: center;
    gap: 0.625rem;
    flex-shrink: 0;
    min-width: 0;
  }
  @media (min-width: 768px) {
    .acct-detail-header { padding: 1rem 1.5rem; }
  }

  /* ── List header / cards ── */
  .acct-list-header {
    padding: 0.875rem 1rem;
    border-bottom: 1px solid ${C.border};
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    flex-shrink: 0;
  }
  .acct-list-body {
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex: 1;
  }

  /* ── Form grids ── */
  .acct-pricing-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }
  @media (max-width: 480px) {
    .acct-pricing-grid { grid-template-columns: 1fr; }
  }
`;

// ── Account list card ─────────────────────────────────────────────────────────
function AccountCard({
  account,
  selected,
  onSelect,
}: {
  account: AccountRow;
  selected: boolean;
  onSelect: () => void;
}) {
  const [pinVisible, setPinVisible] = useState(false);
  const hasCustomPricing =
    account.price_single != null ||
    account.price_rp_pack != null ||
    account.price_hwp_pack != null;

  return (
    <button
      onClick={onSelect}
      style={{
        width: "100%",
        textAlign: "left",
        background: selected ? "#fdf2f4" : C.surface,
        border: `1px solid ${selected ? "#d4849c" : C.border}`,
        borderRadius: 10,
        padding: "0.875rem 1rem",
        cursor: "pointer",
        transition: "border-color 0.12s, background 0.12s",
        display: "flex",
        flexDirection: "column",
        gap: "0.35rem",
        position: "relative",
      }}
    >
      {/* Name + active badge */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0, paddingRight: "1.25rem" }}>
        <span
          style={{
            fontWeight: 600,
            fontSize: "0.88rem",
            color: C.text,
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {account.display_name}
        </span>
        {!account.active && (
          <span
            style={{
              fontSize: "0.65rem",
              fontWeight: 700,
              background: "#fee2e2",
              color: C.danger,
              borderRadius: 4,
              padding: "1px 6px",
              flexShrink: 0,
            }}
          >
            INACTIVE
          </span>
        )}
      </div>

      {/* account_id slug + PIN */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <span style={{ fontSize: "0.75rem", color: C.muted, fontFamily: "monospace" }}>
          {account.account_id}
        </span>
        <span style={{ fontSize: "0.75rem", color: C.muted }}>•</span>
        <button
          onClick={(e) => { e.stopPropagation(); setPinVisible((v) => !v); }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            color: C.muted,
            fontSize: "0.75rem",
            minHeight: 44,
          }}
          title={pinVisible ? "Hide PIN" : "Reveal PIN"}
        >
          {pinVisible ? <EyeOff size={11} /> : <Eye size={11} />}
          <span style={{ fontFamily: "monospace" }}>
            {pinVisible ? account.pin : "••••"}
          </span>
        </button>
      </div>

      {/* Badges row */}
      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
        {hasCustomPricing && (
          <Badge color="#dbeafe" text="#1e40af">
            {account.currency_symbol ?? "$"}{account.price_single?.toFixed(2)} / sticker
          </Badge>
        )}
        {account.has_pending_tab && <Badge color="#dcfce7" text="#15803d">Pending Tab</Badge>}
        {account.can_edit_fulfillment && <Badge color="#f3e8ff" text="#7e22ce">Fulfillment</Badge>}
        {account.pack_prices && Object.keys(account.pack_prices).length > 0 && (
          <Badge color="#fef9c3" text="#854d0e">Custom Packs</Badge>
        )}
      </div>

      {/* Chevron */}
      <div style={{ position: "absolute", right: "0.875rem", top: "50%", transform: "translateY(-50%)", color: C.muted }}>
        <ChevronRight size={16} />
      </div>
    </button>
  );
}

function Badge({ color, text, children }: { color: string; text: string; children: React.ReactNode }) {
  return (
    <span
      style={{
        fontSize: "0.62rem",
        fontWeight: 600,
        background: color,
        color: text,
        borderRadius: 4,
        padding: "1px 6px",
        letterSpacing: "0.01em",
      }}
    >
      {children}
    </span>
  );
}

// ── Text input helper ─────────────────────────────────────────────────────────
function Field({
  label, value, onChange, type = "text", placeholder, mono = false, hint, readOnly,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  mono?: boolean;
  hint?: string;
  readOnly?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
      <label style={{ fontSize: "0.75rem", fontWeight: 600, color: C.muted, letterSpacing: "0.03em" }}>
        {label.toUpperCase()}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        style={{
          background: readOnly ? "#f0ebe8" : C.inputBg,
          border: `1px solid ${C.border}`,
          borderRadius: 7,
          padding: "0.55rem 0.625rem",
          fontSize: "0.875rem",
          fontFamily: mono ? "monospace" : "inherit",
          color: readOnly ? C.muted : C.text,
          outline: "none",
          width: "100%",
          boxSizing: "border-box",
          minHeight: 44,
        }}
      />
      {hint && <span style={{ fontSize: "0.7rem", color: C.muted }}>{hint}</span>}
    </div>
  );
}

function NumField({
  label, value, onChange, placeholder, hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
      <label style={{ fontSize: "0.75rem", fontWeight: 600, color: C.muted, letterSpacing: "0.03em" }}>
        {label.toUpperCase()}
      </label>
      <input
        type="number"
        step="0.01"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          background: C.inputBg,
          border: `1px solid ${C.border}`,
          borderRadius: 7,
          padding: "0.55rem 0.625rem",
          fontSize: "0.875rem",
          color: C.text,
          outline: "none",
          width: "100%",
          boxSizing: "border-box",
          minHeight: 44,
        }}
      />
      {hint && <span style={{ fontSize: "0.7rem", color: C.muted }}>{hint}</span>}
    </div>
  );
}

function Toggle({
  label, value, onChange, hint,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "0.75rem",
        padding: "0.5rem 0",
        minHeight: 44,
      }}
    >
      <div>
        <div style={{ fontSize: "0.875rem", fontWeight: 500, color: C.text }}>{label}</div>
        {hint && <div style={{ fontSize: "0.7rem", color: C.muted }}>{hint}</div>}
      </div>
      <button
        onClick={() => onChange(!value)}
        style={{
          flexShrink: 0,
          width: 40,
          height: 22,
          borderRadius: 11,
          background: value ? C.brand : "#d1c4c8",
          border: "none",
          cursor: "pointer",
          position: "relative",
          transition: "background 0.18s",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 3,
            left: value ? 21 : 3,
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: "#fff",
            transition: "left 0.18s",
            display: "block",
          }}
        />
      </button>
    </div>
  );
}

// ── Settings panel ────────────────────────────────────────────────────────────
function SettingsPanel({
  account,
  onSaved,
  onDeleted,
  onRestored,
  onDuplicate,
}: {
  account: AccountRow;
  onSaved: (updated: AccountRow) => void;
  onDeleted: (id: string) => void;
  onRestored: (id: string) => void;
  onDuplicate: (account: AccountRow) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [displayName, setDisplayName]           = useState(account.display_name);
  const [notifyEmail, setNotifyEmail]           = useState(account.notify_email);
  const [pin, setPin]                           = useState(account.pin);
  const [hasPendingTab, setHasPendingTab]       = useState(account.has_pending_tab);
  const [canEditFulfillment, setCanEditFulfillment] = useState(account.can_edit_fulfillment);
  const [contactNamesRaw, setContactNamesRaw]   = useState((account.contact_names ?? []).join("\n"));
  const [priceSingle, setPriceSingle]           = useState(account.price_single != null ? String(account.price_single) : "");
  const [priceRp, setPriceRp]                   = useState(account.price_rp_pack != null ? String(account.price_rp_pack) : "");
  const [priceHwp, setPriceHwp]                 = useState(account.price_hwp_pack != null ? String(account.price_hwp_pack) : "");
  const [currencySymbol, setCurrencySymbol]     = useState(account.currency_symbol ?? "$");
  const [minQty, setMinQty]                     = useState(account.min_qty != null ? String(account.min_qty) : "");
  const [qtyOptionsRaw, setQtyOptionsRaw]       = useState((account.qty_options ?? []).join(", "));
  const [packPricesRaw, setPackPricesRaw]       = useState(
    account.pack_prices != null
      ? Object.entries(account.pack_prices).map(([k, v]) => `${k}: ${v}`).join("\n")
      : ""
  );

  useEffect(() => {
    setDisplayName(account.display_name);
    setNotifyEmail(account.notify_email);
    setPin(account.pin);
    setHasPendingTab(account.has_pending_tab);
    setCanEditFulfillment(account.can_edit_fulfillment);
    setContactNamesRaw((account.contact_names ?? []).join("\n"));
    setPriceSingle(account.price_single != null ? String(account.price_single) : "");
    setPriceRp(account.price_rp_pack != null ? String(account.price_rp_pack) : "");
    setPriceHwp(account.price_hwp_pack != null ? String(account.price_hwp_pack) : "");
    setCurrencySymbol(account.currency_symbol ?? "$");
    setMinQty(account.min_qty != null ? String(account.min_qty) : "");
    setQtyOptionsRaw((account.qty_options ?? []).join(", "));
    setPackPricesRaw(
      account.pack_prices != null
        ? Object.entries(account.pack_prices).map(([k, v]) => `${k}: ${v}`).join("\n")
        : ""
    );
    setConfirmDelete(false);
  }, [account.id]);

  function parsePackPrices(raw: string): Record<string, number> | null {
    const lines = raw.trim().split("\n").filter(Boolean);
    if (!lines.length) return null;
    const result: Record<string, number> = {};
    for (const line of lines) {
      const [k, v] = line.split(":").map((s) => s.trim());
      if (k && v && !isNaN(Number(v))) result[k.toUpperCase()] = Number(v);
    }
    return Object.keys(result).length ? result : null;
  }

  function handleSave() {
    startTransition(async () => {
      try {
        const fields = {
          display_name:         displayName.trim(),
          notify_email:         notifyEmail.trim(),
          pin:                  pin.trim(),
          has_pending_tab:      hasPendingTab,
          can_edit_fulfillment: canEditFulfillment,
          contact_names:        contactNamesRaw.split("\n").map((s) => s.trim()).filter(Boolean),
          price_single:         priceSingle.trim() ? Number(priceSingle) : null,
          price_rp_pack:        priceRp.trim() ? Number(priceRp) : null,
          price_hwp_pack:       priceHwp.trim() ? Number(priceHwp) : null,
          currency_symbol:      currencySymbol.trim() || "$",
          min_qty:              minQty.trim() ? Number(minQty) : null,
          qty_options:          qtyOptionsRaw.trim()
            ? qtyOptionsRaw.split(",").map((s) => Number(s.trim())).filter((n) => !isNaN(n))
            : null,
          pack_prices: parsePackPrices(packPricesRaw),
        };
        await updateAccount(account.id, fields);
        onSaved({ ...account, ...fields });
        toast.success("Account saved");
      } catch (e) {
        toast.error(String(e));
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteAccount(account.id);
        onDeleted(account.id);
        toast.success("Account deactivated");
        setConfirmDelete(false);
      } catch (e) {
        toast.error(String(e));
      }
    });
  }

  function handleRestore() {
    startTransition(async () => {
      try {
        await restoreAccount(account.id);
        onRestored(account.id);
        toast.success("Account restored");
      } catch (e) {
        toast.error(String(e));
      }
    });
  }

  const defaultPricingHint = `Global defaults: $${WS_PRICE_SINGLE}/sticker · $${WS_PRICE_RP_PACK}/RP · $${WS_PRICE_HWP_PACK}/HWP`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <Section title="Basic Info">
        <Field label="Display Name" value={displayName} onChange={setDisplayName} />
        <Field label="Notify Email" value={notifyEmail} onChange={setNotifyEmail} type="email" />
        <Field label="PIN" value={pin} onChange={setPin} mono placeholder="e.g. 4321"
          hint="4–8 digit PIN used to log in to the wholesale portal" />
        <Field label="Account ID (slug)" value={account.account_id} onChange={() => {}} mono readOnly
          hint="Cannot be changed after creation" />
      </Section>

      <Section title={`Pricing — ${defaultPricingHint}`}>
        <div className="acct-pricing-grid">
          <NumField label="Price / Sticker" value={priceSingle} onChange={setPriceSingle}
            placeholder={`Default: ${WS_PRICE_SINGLE}`} />
          <Field label="Currency Symbol" value={currencySymbol} onChange={setCurrencySymbol}
            placeholder="$" />
          <NumField label="RP Pack Price" value={priceRp} onChange={setPriceRp}
            placeholder={`Default: ${WS_PRICE_RP_PACK}`} />
          <NumField label="HWP Pack Price" value={priceHwp} onChange={setPriceHwp}
            placeholder={`Default: ${WS_PRICE_HWP_PACK}`} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          <label style={{ fontSize: "0.75rem", fontWeight: 600, color: C.muted, letterSpacing: "0.03em" }}>
            PACK PRICE OVERRIDES
          </label>
          <textarea
            value={packPricesRaw}
            onChange={(e) => setPackPricesRaw(e.target.value)}
            placeholder={"PK-3: 2.00\nPK-4: 3.50"}
            rows={3}
            style={{
              background: C.inputBg,
              border: `1px solid ${C.border}`,
              borderRadius: 7,
              padding: "0.5rem 0.625rem",
              fontSize: "0.8rem",
              fontFamily: "monospace",
              color: C.text,
              outline: "none",
              resize: "vertical",
              width: "100%",
              boxSizing: "border-box",
            }}
          />
          <span style={{ fontSize: "0.7rem", color: C.muted }}>One override per line: SKU: price</span>
        </div>
      </Section>

      <Section title="Order Settings">
        <div className="acct-pricing-grid">
          <NumField label="Min Qty / Line" value={minQty} onChange={setMinQty} placeholder="Default: 50" />
          <Field label="Qty Options" value={qtyOptionsRaw} onChange={setQtyOptionsRaw}
            placeholder="5, 10, 25" hint="Comma-separated; blank = default" />
        </div>
        <Toggle label="Pending Tab (product review)" value={hasPendingTab} onChange={setHasPendingTab}
          hint="Lets this account approve / comment on upcoming designs" />
        <Toggle label="Can Edit Fulfillment" value={canEditFulfillment} onChange={setCanEditFulfillment}
          hint="Allows editing tracking numbers and order stages" />
      </Section>

      <Section title="Contact Names">
        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          <label style={{ fontSize: "0.75rem", fontWeight: 600, color: C.muted, letterSpacing: "0.03em" }}>
            NAMES (one per line)
          </label>
          <textarea
            value={contactNamesRaw}
            onChange={(e) => setContactNamesRaw(e.target.value)}
            placeholder={"Fr. Arsanios\nFr. Karas"}
            rows={4}
            style={{
              background: C.inputBg,
              border: `1px solid ${C.border}`,
              borderRadius: 7,
              padding: "0.5rem 0.625rem",
              fontSize: "0.875rem",
              color: C.text,
              outline: "none",
              resize: "vertical",
              width: "100%",
              boxSizing: "border-box",
            }}
          />
        </div>
      </Section>

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", paddingTop: "0.25rem" }}>
        <ActionBtn onClick={handleSave} loading={pending} icon={<Save size={15} />} label="Save Changes" primary />
        <ActionBtn onClick={() => onDuplicate(account)} icon={<Copy size={15} />} label="Duplicate" />
        {account.active ? (
          confirmDelete ? (
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <span style={{ fontSize: "0.8rem", color: C.danger }}>Deactivate?</span>
              <ActionBtn onClick={handleDelete} loading={pending} icon={<Check size={14} />} label="Yes" danger />
              <ActionBtn onClick={() => setConfirmDelete(false)} icon={<X size={14} />} label="No" />
            </div>
          ) : (
            <ActionBtn onClick={() => setConfirmDelete(true)} icon={<Trash2 size={15} />} label="Deactivate" danger />
          )
        ) : (
          <ActionBtn onClick={handleRestore} loading={pending} icon={<RotateCcw size={15} />} label="Restore" />
        )}
      </div>
    </div>
  );
}

// ── Notes panel ───────────────────────────────────────────────────────────────
function NotesPanel({ accountId }: { accountId: string }) {
  const [content, setContent]           = useState("");
  const [pending, startTransition]      = useTransition();
  const [loaded, setLoaded]             = useState(false);
  const saveTimer                       = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLoaded(false);
    getAdminNote(accountId).then((n) => {
      setContent(n?.content ?? "");
      setLoaded(true);
    });
  }, [accountId]);

  function handleChange(val: string) {
    setContent(val);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      startTransition(async () => {
        try {
          await upsertAdminNote(accountId, val);
        } catch (e) {
          console.error("[NotesPanel] auto-save failed:", e);
          toast.error(e instanceof Error ? e.message : "Note save failed");
        }
      });
    }, 1200);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <p style={{ fontSize: "0.8rem", color: C.muted, margin: 0 }}>
        Private notes — visible only to admins. Auto-saved after 1.2s.
      </p>
      {!loaded ? (
        <div style={{ color: C.muted, fontSize: "0.85rem" }}>Loading...</div>
      ) : (
        <textarea
          value={content}
          onChange={(e) => handleChange(e.target.value)}
          rows={14}
          placeholder="Notes about this account — context, special arrangements, contacts, history..."
          style={{
            background: C.inputBg,
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            padding: "0.75rem",
            fontSize: "0.875rem",
            color: C.text,
            outline: "none",
            resize: "vertical",
            width: "100%",
            boxSizing: "border-box",
            lineHeight: 1.6,
            fontFamily: "inherit",
          }}
        />
      )}
      {pending && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", color: C.muted, fontSize: "0.75rem" }}>
          <Loader2 size={12} style={{ animation: "acct-spin 0.7s linear infinite" }} />
          Saving...
        </div>
      )}
    </div>
  );
}

// ── Log panel ─────────────────────────────────────────────────────────────────
function LogPanel({ accountId }: { accountId: string }) {
  const [entries, setEntries]        = useState<LogEntry[]>([]);
  const [draft, setDraft]            = useState("");
  const [pending, startTransition]   = useTransition();
  const [loaded, setLoaded]          = useState(false);

  useEffect(() => {
    setLoaded(false);
    getLogEntries(accountId).then((data) => { setEntries(data); setLoaded(true); });
  }, [accountId]);

  function handleAdd() {
    if (!draft.trim()) return;
    startTransition(async () => {
      try {
        const entry = await addLogEntry(accountId, draft.trim());
        setEntries((prev) => [entry, ...prev]);
        setDraft("");
      } catch (e) { toast.error(String(e)); }
    });
  }

  function handleDelete(entryId: string) {
    startTransition(async () => {
      try {
        await deleteLogEntry(entryId);
        setEntries((prev) => prev.filter((e) => e.id !== entryId));
      } catch (e) { toast.error(String(e)); }
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAdd(); }}
          rows={3}
          placeholder="Add a log entry — what happened, what was discussed... (⌘+Enter to save)"
          style={{
            flex: 1,
            background: C.inputBg,
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            padding: "0.625rem 0.75rem",
            fontSize: "0.875rem",
            color: C.text,
            outline: "none",
            resize: "vertical",
            fontFamily: "inherit",
            boxSizing: "border-box",
          }}
        />
        <button
          onClick={handleAdd}
          disabled={pending || !draft.trim()}
          style={{
            alignSelf: "flex-end",
            background: C.brand,
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "0.625rem 1rem",
            fontSize: "0.875rem",
            fontWeight: 600,
            cursor: "pointer",
            opacity: !draft.trim() ? 0.5 : 1,
            fontFamily: "inherit",
            minHeight: 44,
          }}
        >
          Add
        </button>
      </div>

      {!loaded ? (
        <div style={{ color: C.muted, fontSize: "0.85rem" }}>Loading...</div>
      ) : entries.length === 0 ? (
        <div style={{ color: C.muted, fontSize: "0.875rem", fontStyle: "italic" }}>No log entries yet.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          {entries.map((entry) => (
            <div
              key={entry.id}
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: "0.75rem",
                display: "flex",
                gap: "0.75rem",
                alignItems: "flex-start",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.875rem", color: C.text, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
                  {entry.content}
                </div>
                <div style={{ fontSize: "0.72rem", color: C.muted, marginTop: "0.35rem" }}>
                  {new Date(entry.created_at).toLocaleString("en-US", {
                    month: "short", day: "numeric", year: "numeric",
                    hour: "numeric", minute: "2-digit",
                  })}
                </div>
              </div>
              <button
                onClick={() => handleDelete(entry.id)}
                style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, padding: 4, flexShrink: 0, minHeight: 44, minWidth: 44, display: "flex", alignItems: "center", justifyContent: "center" }}
                title="Delete entry"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Reminders panel ───────────────────────────────────────────────────────────
function RemindersPanel({ accountId }: { accountId: string }) {
  const [reminders, setReminders]    = useState<Reminder[]>([]);
  const [draft, setDraft]            = useState("");
  const [dueDate, setDueDate]        = useState("");
  const [pending, startTransition]   = useTransition();
  const [loaded, setLoaded]          = useState(false);

  useEffect(() => {
    setLoaded(false);
    getReminders(accountId).then((data) => { setReminders(data); setLoaded(true); });
  }, [accountId]);

  function handleAdd() {
    if (!draft.trim()) return;
    startTransition(async () => {
      try {
        const r = await addReminder(accountId, draft.trim(), dueDate || null);
        setReminders((prev) => [...prev, r].sort((a, b) => {
          if (!a.due_date && !b.due_date) return 0;
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return a.due_date.localeCompare(b.due_date);
        }));
        setDraft("");
        setDueDate("");
      } catch (e) { toast.error(String(e)); }
    });
  }

  function handleToggle(id: string, completed: boolean) {
    startTransition(async () => {
      await toggleReminder(id, completed);
      setReminders((prev) => prev.map((r) => r.id === id ? { ...r, completed } : r));
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteReminder(id);
      setReminders((prev) => prev.filter((r) => r.id !== id));
    });
  }

  const open = reminders.filter((r) => !r.completed);
  const done = reminders.filter((r) => r.completed);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
      <div style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 9,
        padding: "0.875rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.625rem",
      }}>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          placeholder="Reminder — discount to offer, follow up, upcoming event..."
          style={{
            background: C.inputBg,
            border: `1px solid ${C.border}`,
            borderRadius: 7,
            padding: "0.5rem 0.625rem",
            fontSize: "0.875rem",
            color: C.text,
            outline: "none",
            resize: "vertical",
            fontFamily: "inherit",
            boxSizing: "border-box",
            width: "100%",
          }}
        />
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <CalendarDays size={15} color={C.muted} style={{ flexShrink: 0 }} />
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            style={{
              background: C.inputBg,
              border: `1px solid ${C.border}`,
              borderRadius: 7,
              padding: "0.4rem 0.625rem",
              fontSize: "0.875rem",
              color: C.text,
              outline: "none",
              fontFamily: "inherit",
              minHeight: 44,
            }}
          />
          <button
            onClick={handleAdd}
            disabled={pending || !draft.trim()}
            style={{
              marginLeft: "auto",
              background: C.brand,
              color: "#fff",
              border: "none",
              borderRadius: 7,
              padding: "0.45rem 1rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
              opacity: !draft.trim() ? 0.5 : 1,
              fontFamily: "inherit",
              minHeight: 44,
            }}
          >
            Add
          </button>
        </div>
      </div>

      {!loaded ? (
        <div style={{ color: C.muted, fontSize: "0.85rem" }}>Loading...</div>
      ) : (
        <>
          {open.length === 0 && done.length === 0 && (
            <div style={{ color: C.muted, fontSize: "0.875rem", fontStyle: "italic" }}>No reminders yet.</div>
          )}
          {open.map((r) => <ReminderRow key={r.id} reminder={r} onToggle={handleToggle} onDelete={handleDelete} />)}
          {done.length > 0 && (
            <>
              <div style={{ fontSize: "0.72rem", color: C.muted, fontWeight: 600, letterSpacing: "0.04em", paddingTop: "0.5rem" }}>
                COMPLETED
              </div>
              {done.map((r) => <ReminderRow key={r.id} reminder={r} onToggle={handleToggle} onDelete={handleDelete} />)}
            </>
          )}
        </>
      )}
    </div>
  );
}

function ReminderRow({
  reminder, onToggle, onDelete,
}: {
  reminder: Reminder;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const isOverdue =
    !reminder.completed &&
    reminder.due_date != null &&
    reminder.due_date < new Date().toISOString().slice(0, 10);

  return (
    <div style={{
      display: "flex",
      gap: "0.625rem",
      alignItems: "flex-start",
      padding: "0.625rem",
      background: C.surface,
      border: `1px solid ${isOverdue ? "#fca5a5" : C.border}`,
      borderRadius: 8,
      opacity: reminder.completed ? 0.5 : 1,
    }}>
      <button
        onClick={() => onToggle(reminder.id, !reminder.completed)}
        style={{
          flexShrink: 0,
          width: 22,
          height: 22,
          borderRadius: 5,
          border: `2px solid ${reminder.completed ? C.green : C.muted}`,
          background: reminder.completed ? C.green : "transparent",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 1,
          minWidth: 44,
          minHeight: 44,
        }}
      >
        {reminder.completed && <Check size={11} color="#fff" strokeWidth={3} />}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: "0.875rem",
          color: C.text,
          textDecoration: reminder.completed ? "line-through" : "none",
          lineHeight: 1.5,
        }}>
          {reminder.content}
        </div>
        {reminder.due_date && (
          <div style={{ fontSize: "0.72rem", color: isOverdue ? C.danger : C.muted, marginTop: 2 }}>
            Due {new Date(reminder.due_date + "T00:00:00").toLocaleDateString("en-US", {
              month: "short", day: "numeric", year: "numeric",
            })}
            {isOverdue && " — overdue"}
          </div>
        )}
      </div>
      <button
        onClick={() => onDelete(reminder.id)}
        style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, padding: 2, flexShrink: 0, minWidth: 44, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <X size={13} />
      </button>
    </div>
  );
}

// ── Create / Duplicate modal ──────────────────────────────────────────────────
function CreateAccountModal({
  templateAccount, onClose, onCreated,
}: {
  templateAccount: AccountRow | null;
  onClose: () => void;
  onCreated: (account: AccountRow) => void;
}) {
  // Use plain useState rather than useTransition so try/catch reliably catches
  // server action rejections in React 19 (async transitions have edge cases
  // where errors bypass catch and route to the nearest error boundary instead).
  const [pending, setPending]      = useState(false);
  const [slug, setSlug]            = useState("");
  const [name, setName]            = useState("");
  const [email, setEmail]          = useState(templateAccount?.notify_email ?? "st.mosesbookstore@gmail.com");
  const [pin, setPin]              = useState("");

  async function handleCreate() {
    if (pending) return;
    const trimmedSlug = slug.trim().toLowerCase().replace(/\s+/g, "-");
    if (!trimmedSlug || !name.trim() || !pin.trim()) {
      toast.error("Slug, display name, and PIN are required");
      return;
    }
    setPending(true);
    try {
      let created: AccountRow;
      if (templateAccount) {
        created = await duplicateAccount(templateAccount.id, trimmedSlug, name.trim(), pin.trim());
      } else {
        created = await createAccount({
          account_id:           trimmedSlug,
          display_name:         name.trim(),
          notify_email:         email.trim() || "st.mosesbookstore@gmail.com",
          pin:                  pin.trim(),
          has_pending_tab:      false,
          can_edit_fulfillment: false,
          contact_names:        [],
          price_single:         null,
          price_rp_pack:        null,
          price_hwp_pack:       null,
          currency_symbol:      "$",
          min_qty:              null,
          qty_options:          null,
          pack_prices:          null,
        });
      }
      onCreated(created);
      toast.success(`Account "${created.display_name}" created`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[CreateAccountModal]", e);
      toast.error(msg);
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.4)",
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.surface,
          borderRadius: 14,
          padding: "1.25rem",
          width: "100%",
          maxWidth: 420,
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          maxHeight: "90dvh",
          overflowY: "auto",
        }}
      >
        <h3 style={{ margin: 0, fontWeight: 700, fontSize: "1.05rem", color: C.text }}>
          {templateAccount ? `Duplicate: ${templateAccount.display_name}` : "New Wholesale Account"}
        </h3>
        {templateAccount && (
          <p style={{ margin: 0, fontSize: "0.8rem", color: C.muted }}>
            Copies pricing structure. Private notes and order history are not copied.
          </p>
        )}
        <Field label="Account Slug (ID)" value={slug} onChange={setSlug} mono
          placeholder="e.g. antony-2" hint="Lowercase, no spaces — used internally in orders" />
        <Field label="Display Name" value={name} onChange={setName}
          placeholder="e.g. Saint Antony Monastery #2" />
        <Field label="Notify Email" value={email} onChange={setEmail} type="email" />
        <Field label="PIN" value={pin} onChange={setPin} mono placeholder="e.g. 7721" hint="4–8 digits" />
        <div style={{ display: "flex", gap: "0.625rem", justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              padding: "0.55rem 1.25rem",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontFamily: "inherit",
              color: C.text,
              minHeight: 44,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={pending}
            style={{
              background: C.brand,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "0.55rem 1.25rem",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: 600,
              fontFamily: "inherit",
              opacity: pending ? 0.7 : 1,
              minHeight: 44,
            }}
          >
            {pending ? "Creating..." : "Create Account"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div style={{
        fontSize: "0.7rem",
        fontWeight: 700,
        color: C.muted,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        paddingBottom: "0.25rem",
        borderBottom: `1px solid ${C.border}`,
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

// ── Action button ─────────────────────────────────────────────────────────────
function ActionBtn({
  onClick, loading, icon, label, primary, danger,
}: {
  onClick: () => void;
  loading?: boolean;
  icon: React.ReactNode;
  label: string;
  primary?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.375rem",
        background: primary ? C.brand : danger ? "#fee2e2" : C.surface,
        color: primary ? "#fff" : danger ? C.danger : C.text,
        border: `1px solid ${primary ? C.brand : danger ? "#fca5a5" : C.border}`,
        borderRadius: 8,
        padding: "0.55rem 1rem",
        fontSize: "0.85rem",
        fontWeight: 600,
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.7 : 1,
        fontFamily: "inherit",
        minHeight: 44,
      }}
    >
      {loading ? <Loader2 size={14} style={{ animation: "acct-spin 0.7s linear infinite" }} /> : icon}
      {label}
    </button>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────
export function WholesaleAccountsView() {
  const [accounts, setAccounts]       = useState<AccountRow[]>([]);
  const [loading, setLoading]         = useState(true);
  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [activeTab, setActiveTab]     = useState<Tab>("settings");
  const [showInactive, setShowInactive] = useState(false);
  const [mobileView, setMobileView]   = useState<MobileView>("list");
  const [createModal, setCreateModal] = useState<{ open: boolean; template: AccountRow | null }>({
    open: false, template: null,
  });

  useEffect(() => {
    listAccounts().then((data) => {
      setAccounts(data);
      // On desktop pre-select first account; on mobile stay on list
      if (data.length > 0) setSelectedId(data[0].id);
      setLoading(false);
    });
  }, []);

  // Browser back button returns to list on mobile
  useEffect(() => {
    function onPopState() {
      setMobileView("list");
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  function handleSelectAccount(id: string) {
    setSelectedId(id);
    setActiveTab("settings");
    setMobileView("detail");
    // Push a history entry so the system back button can return to list
    window.history.pushState({ accountDetail: id }, "");
  }

  function handleBackToList() {
    setMobileView("list");
    window.history.back();
  }

  const selected = accounts.find((a) => a.id === selectedId) ?? null;

  const visibleAccounts = showInactive
    ? accounts
    : accounts.filter((a) => a.active);

  function handleSaved(updated: AccountRow) {
    setAccounts((prev) => prev.map((a) => a.id === updated.id ? updated : a));
  }

  function handleDeleted(id: string) {
    setAccounts((prev) => prev.map((a) => a.id === id ? { ...a, active: false } : a));
    if (!showInactive && selectedId === id) {
      const next = accounts.find((a) => a.id !== id && a.active);
      setSelectedId(next?.id ?? null);
      if (!next) setMobileView("list");
    }
  }

  function handleRestored(id: string) {
    setAccounts((prev) => prev.map((a) => a.id === id ? { ...a, active: true } : a));
  }

  function handleCreated(account: AccountRow) {
    setAccounts((prev) => [...prev, account]);
    handleSelectAccount(account.id);
    setCreateModal({ open: false, template: null });
  }

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "settings",  label: "Settings",  icon: <Settings size={14} /> },
    { key: "notes",     label: "Notes",     icon: <StickyNote size={14} /> },
    { key: "log",       label: "Log",       icon: <ScrollText size={14} /> },
    { key: "reminders", label: "Reminders", icon: <Bell size={14} /> },
  ];

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4rem" }}>
        <style>{LAYOUT_CSS}</style>
        <Loader2 size={28} style={{ animation: "acct-spin 0.7s linear infinite", color: C.muted }} />
      </div>
    );
  }

  return (
    <div className={`acct-root${mobileView === "detail" ? " show-detail" : ""}`}>
      <style>{LAYOUT_CSS}</style>

      {/* ── Left: account list ────────────────────────────────────────────── */}
      <div className="acct-list-panel">
        <div className="acct-list-header">
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.9rem", color: C.text }}>
              {visibleAccounts.length} Account{visibleAccounts.length !== 1 ? "s" : ""}
            </div>
            <button
              onClick={() => setShowInactive((v) => !v)}
              style={{
                background: "none", border: "none", padding: 0,
                cursor: "pointer", fontSize: "0.72rem", color: C.muted, fontFamily: "inherit",
              }}
            >
              {showInactive ? "Hide inactive" : "Show inactive"}
            </button>
          </div>
          <button
            onClick={() => setCreateModal({ open: true, template: null })}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
              background: C.brand,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "0.55rem 0.875rem",
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              minHeight: 44,
            }}
          >
            <Plus size={14} />
            New
          </button>
        </div>

        <div className="acct-list-body">
          {visibleAccounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              selected={selectedId === account.id}
              onSelect={() => handleSelectAccount(account.id)}
            />
          ))}
          {visibleAccounts.length === 0 && (
            <div style={{ color: C.muted, fontSize: "0.875rem", padding: "1rem 0", fontStyle: "italic" }}>
              No accounts.
            </div>
          )}
        </div>
      </div>

      {/* ── Right: detail panel ───────────────────────────────────────────── */}
      <div className="acct-detail-panel">
        {!selected ? (
          <div style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: C.muted,
            fontSize: "0.9rem",
          }}>
            Select an account
          </div>
        ) : (
          <>
            {/* Panel header */}
            <div className="acct-detail-header">
              {/* Back button — mobile only, hidden via CSS on desktop */}
              <button
                className="acct-back-btn"
                onClick={handleBackToList}
                aria-label="Back to accounts list"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: C.brand,
                  padding: "0.25rem",
                  fontFamily: "inherit",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  flexShrink: 0,
                  minWidth: 44,
                  minHeight: 44,
                  justifyContent: "center",
                  marginLeft: -8,
                }}
              >
                <ChevronLeft size={20} strokeWidth={2.5} />
              </button>

              {/* Name + slug */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: 700,
                  fontSize: "1rem",
                  color: C.text,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {selected.display_name}
                </div>
                <div style={{
                  fontSize: "0.75rem",
                  color: C.muted,
                  fontFamily: "monospace",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {selected.account_id}
                  {!selected.active && (
                    <span style={{ marginLeft: "0.5rem", color: C.danger, fontFamily: "inherit", fontWeight: 600 }}>
                      — INACTIVE
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs — horizontally scrollable */}
            <div className="acct-tabs">
              {TABS.map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`acct-tab-btn${activeTab === key ? " active" : ""}`}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="acct-tab-content">
              {activeTab === "settings" && (
                <SettingsPanel
                  account={selected}
                  onSaved={handleSaved}
                  onDeleted={handleDeleted}
                  onRestored={handleRestored}
                  onDuplicate={(account) => setCreateModal({ open: true, template: account })}
                />
              )}
              {activeTab === "notes"     && <NotesPanel accountId={selected.id} />}
              {activeTab === "log"       && <LogPanel accountId={selected.id} />}
              {activeTab === "reminders" && <RemindersPanel accountId={selected.id} />}
            </div>
          </>
        )}
      </div>

      {/* ── Create / Duplicate modal ──────────────────────────────────────── */}
      {createModal.open && (
        <CreateAccountModal
          templateAccount={createModal.template}
          onClose={() => setCreateModal({ open: false, template: null })}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}

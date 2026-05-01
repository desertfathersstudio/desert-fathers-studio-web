"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Trash2, Plus, Minus } from "lucide-react";
import type { WholesaleProduct, WholesaleCartLine } from "@/types/wholesale";
import {
  unitPriceForSku,
  WS_PRICE_HWP_PACK,
  WS_PRICE_RP_PACK,
  WS_PRICE_SINGLE,
} from "@/lib/wholesale/pricing";

const ABBEY_NAMES = [
  "Fr. Arsanios Abba Moses",
  "Fr. Karas Abba Moses",
  "Fr. Zosima Abba Moses",
  "Br. Abanob Abba Moses",
];

const QTY_OPTIONS = [25, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];

interface Props {
  products: WholesaleProduct[];
  cart: WholesaleCartLine[];
  onCartChange: (lines: WholesaleCartLine[]) => void;
  session: { accountId: string; displayName: string; notifyEmail: string };
  onOrderSubmitted: () => void;
}

type AddMode = "single" | "bulk";

export function OrderTab({ products, cart, onCartChange, session, onOrderSubmitted }: Props) {
  const [mode, setMode] = useState<AddMode>("single");
  const [selectedSku, setSelectedSku] = useState("");
  const [qty, setQty] = useState(25);
  const [asap, setAsap] = useState(false);
  const [bulkSearch, setBulkSearch] = useState("");
  const [bulkQty, setBulkQty] = useState(25);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<string | null>(null);

  const approved = useMemo(
    () => products.filter((p) => p.reviewStatus === "approved" || !p.reviewStatus),
    [products]
  );

  // Wholesale allows ordering any sticker individually — no pack lock
  const orderableProducts = useMemo(() => {
    const packs = approved.filter((p) => p.isPackProduct);
    const singles = approved.filter((p) => !p.isPackProduct);
    return [...packs, ...singles];
  }, [approved]);

  // Unique categories for group chips — exclude pack groups handled separately
  const EXCLUDED_CATS = new Set(["Holy Week Pack", "Resurrection Pack", "HWP", "RP"]);
  const categories = useMemo(() => {
    const cats = new Set<string>();
    approved.filter((p) => !p.isPackProduct).forEach((p) => {
      if (p.category && !EXCLUDED_CATS.has(p.category)) cats.add(p.category);
    });
    return Array.from(cats).sort();
  }, [approved]);

  const [bulkGroupFilter, setBulkGroupFilter] = useState<string>("All");

  // Virtual pack items — not DB rows, handled separately
  const VIRTUAL_PACKS = [
    { sku: "RP_PACK", name: "Resurrection Pack", category: "Resurrection Pack", size: '2"', packType: "RP" as const, unitPrice: WS_PRICE_RP_PACK, imageUrl: "/stickers/Resurrection Pack BACK.png" },
    { sku: "HWP_PACK", name: "Holy Week Pack", category: "Holy Week Pack", size: '2"', packType: "HWP" as const, unitPrice: WS_PRICE_HWP_PACK, imageUrl: "/stickers/Holy Week Pack BACK.png" },
  ];

  const selectedProduct = useMemo(
    () => approved.find((p) => p.sku === selectedSku) ?? VIRTUAL_PACKS.find((p) => p.sku === selectedSku),
    [approved, selectedSku]
  );

  const bulkList = useMemo(() => {
    const q = bulkSearch.toLowerCase();
    function stkNum(sku: string) {
      const m = sku.match(/^STK-(\d+)$/i);
      return m ? parseInt(m[1], 10) : null;
    }
    const stickers = approved.filter((p) => {
      if (p.isPackProduct) return false;
      if (bulkGroupFilter === "RP") return p.packType === "RP";
      if (bulkGroupFilter === "HWP") return p.packType === "HWP";
      if (bulkGroupFilter === "Round 1") {
        const n = stkNum(p.sku);
        return n !== null && n >= 1 && n <= 35;
      }
      if (bulkGroupFilter === "Round 2") {
        const n = stkNum(p.sku);
        return n !== null && n >= 36 && n <= 67;
      }
      if (bulkGroupFilter !== "All") {
        const matchCat = p.category === bulkGroupFilter;
        return matchCat && (!q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
      }
      return !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    });
    // Prepend relevant pack items
    const packs = VIRTUAL_PACKS.filter((pk) => {
      if (bulkGroupFilter === "RP") return pk.packType === "RP";
      if (bulkGroupFilter === "HWP") return pk.packType === "HWP";
      if (bulkGroupFilter === "All") return !q || pk.name.toLowerCase().includes(q);
      return false;
    });
    return [...packs.map((pk) => ({ ...pk, isVirtualPack: true })), ...stickers.map((p) => ({ ...p, isVirtualPack: false }))];
  }, [approved, bulkSearch, bulkGroupFilter]);

  function addToCart(line: WholesaleCartLine) {
    onCartChange(
      (prev => {
        const existing = prev.find((l) => l.productId === line.productId);
        if (existing) {
          return prev.map((l) =>
            l.productId === line.productId ? { ...l, qty: l.qty + line.qty } : l
          );
        }
        return [...prev, line];
      })(cart)
    );
  }

  function handleSingleAdd() {
    if (!selectedSku) { toast.error("Select a design first"); return; }

    // Virtual pack items — may not exist as DB rows
    if (selectedSku === "RP_PACK") {
      addToCart({ productId: "RP_PACK", designName: "Resurrection Pack", category: "Resurrection Pack", size: '2"', imageUrl: "/stickers/Resurrection Pack BACK.png", qty, unitPrice: WS_PRICE_RP_PACK, asap });
      toast.success("Resurrection Pack added");
      return;
    }
    if (selectedSku === "HWP_PACK") {
      addToCart({ productId: "HWP_PACK", designName: "Holy Week Pack", category: "Holy Week Pack", size: '2"', imageUrl: "/stickers/Holy Week Pack BACK.png", qty, unitPrice: WS_PRICE_HWP_PACK, asap });
      toast.success("Holy Week Pack added");
      return;
    }

    const p = approved.find((pr) => pr.sku === selectedSku);
    if (!p) return;
    addToCart({
      productId: p.sku,
      designName: p.name,
      category: p.category,
      size: p.size,
      imageUrl: p.imageUrl,
      qty,
      unitPrice: unitPriceForSku(p.sku),
      asap,
    });
    toast.success(`${p.name} added`);
  }

  function handleBulkAdd() {
    if (!checked.size) { toast.error("Select at least one design"); return; }
    const lines: WholesaleCartLine[] = [];
    for (const sku of checked) {
      // Handle virtual pack items
      const vp = VIRTUAL_PACKS.find((pk) => pk.sku === sku);
      if (vp) {
        lines.push({ productId: vp.sku, designName: vp.name, category: vp.category, size: vp.size, imageUrl: vp.imageUrl, qty: bulkQty, unitPrice: vp.unitPrice, asap: false });
        continue;
      }
      const p = approved.find((pr) => pr.sku === sku);
      if (!p) continue;
      lines.push({
        productId: p.sku,
        designName: p.name,
        category: p.category,
        size: p.size,
        imageUrl: p.imageUrl,
        qty: bulkQty,
        unitPrice: unitPriceForSku(p.sku),
        asap: false,
      });
    }
    // Merge into cart
    let updated = [...cart];
    for (const line of lines) {
      const i = updated.findIndex((l) => l.productId === line.productId);
      if (i >= 0) updated[i] = { ...updated[i], qty: updated[i].qty + line.qty };
      else updated = [...updated, line];
    }
    onCartChange(updated);
    setChecked(new Set());
    toast.success(`Added ${lines.length} item${lines.length !== 1 ? "s" : ""}`);
  }

  function updateQty(productId: string, newQty: number) {
    if (newQty <= 0) {
      onCartChange(cart.filter((l) => l.productId !== productId));
    } else {
      onCartChange(cart.map((l) => l.productId === productId ? { ...l, qty: newQty } : l));
    }
  }

  function removeFromCart(productId: string) {
    onCartChange(cart.filter((l) => l.productId !== productId));
  }

  const grandTotal = cart.reduce((s, l) => s + l.unitPrice * l.qty, 0);
  const cartCount = cart.reduce((s, l) => s + l.qty, 0);
  const hasPackInCart = cart.some((l) => l.productId === "HWP_PACK" || l.productId === "RP_PACK");
  const packSetCount = cart
    .filter((l) => l.productId === "HWP_PACK" || l.productId === "RP_PACK")
    .reduce((s, l) => s + l.qty, 0);

  const defaultName = session.displayName;
  const defaultEmail = session.notifyEmail;
  const [nameChoice, setNameChoice] = useState<string>(ABBEY_NAMES[0]);
  const [customName, setCustomName] = useState("");
  const [emailChoice, setEmailChoice] = useState<"default" | "other">("default");
  const [customEmail, setCustomEmail] = useState("");

  const customerName = nameChoice === "other" ? customName : nameChoice;
  const customerEmail = emailChoice === "other" ? customEmail : defaultEmail;

  async function handleSubmit() {
    if (!cart.length) { toast.error("Cart is empty"); return; }
    if (!customerName.trim()) { toast.error("Please enter a customer name"); return; }
    if (!customerEmail.trim()) { toast.error("Please enter an email"); return; }
    setSubmitting(true);
    try {
      const items = cart.map((l) => ({
        productId: l.productId,
        designName: l.designName,
        category: l.category,
        size: l.size,
        imageUrl: l.imageUrl,
        qty: l.qty,
        unitPrice: l.unitPrice,
        lineTotal: l.unitPrice * l.qty,
      }));
      const res = await fetch("/api/wholesale/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: session.accountId,
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          items,
          grandTotal,
          asap,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const { orderId } = await res.json();
      setSubmitted(orderId);
      onCartChange([]);
      setAsap(false);
      setSelectedSku("");
      onOrderSubmitted();
    } catch (err) {
      toast.error("Error: " + String(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div style={{ maxWidth: 640, margin: "3rem auto", padding: "0 1.25rem", textAlign: "center" }}>
        <div
          style={{
            background: "#d1f5e8",
            border: "1px solid #6fcf97",
            borderRadius: "var(--radius-card)",
            padding: "2rem",
          }}
        >
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>✓</div>
          <h2 style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.4rem", fontWeight: 600, color: "#065f46", margin: "0 0 0.5rem" }}>
            Order Submitted!
          </h2>
          <p style={{ color: "#047857", fontSize: "0.85rem", margin: "0 0 1rem" }}>Order ID: <strong>{submitted}</strong></p>
          <p style={{ color: "#065f46", fontSize: "0.82rem", margin: 0 }}>
            A confirmation has been sent to {customerEmail}.
          </p>
        </div>
        <button
          onClick={() => setSubmitted(null)}
          style={{ marginTop: "1.25rem", ...brandBtn }}
        >
          Place another order
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "1.5rem 1.25rem" }}>
      {/* Customer name + email */}
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-card)",
          padding: "1rem 1.25rem",
          marginBottom: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
        }}
      >
        {/* Name row */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", minWidth: 42 }}>Name</span>
          <select
            value={nameChoice}
            onChange={(e) => setNameChoice(e.target.value)}
            style={inlineSelect}
          >
            {ABBEY_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
            <option value="other">Other…</option>
          </select>
          {nameChoice === "other" && (
            <input
              type="text"
              placeholder="Enter name"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              style={inlineInput}
            />
          )}
        </div>
        {/* Email row */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", minWidth: 42 }}>Email</span>
          <select
            value={emailChoice}
            onChange={(e) => setEmailChoice(e.target.value as "default" | "other")}
            style={inlineSelect}
          >
            <option value="default">{defaultEmail}</option>
            <option value="other">Other…</option>
          </select>
          {emailChoice === "other" && (
            <input
              type="email"
              placeholder="Enter email"
              value={customEmail}
              onChange={(e) => setCustomEmail(e.target.value)}
              style={inlineInput}
            />
          )}
        </div>
      </div>

      {/* Add items */}
      <Section title="Add Items">
        {/* Mode toggle */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
          {(["single", "bulk"] as AddMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                padding: "0.3rem 0.85rem",
                borderRadius: "999px",
                border: "1.5px solid",
                borderColor: mode === m ? "var(--brand)" : "var(--border)",
                background: mode === m ? "var(--brand)" : "white",
                color: mode === m ? "#fff" : "var(--text-muted)",
                fontSize: "0.76rem",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "var(--font-inter)",
              }}
            >
              {m === "single" ? "Single add" : "Add multiple"}
            </button>
          ))}
        </div>

        {mode === "single" ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "0.75rem", alignItems: "end", marginBottom: "0.75rem" }}>
              <div>
                <label style={fieldLabel}>Design</label>
                <select
                  value={selectedSku}
                  onChange={(e) => setSelectedSku(e.target.value)}
                  style={{ ...inputStyle, width: "100%" }}
                >
                  <option value="">— Select a design —</option>
                  <option value="RP_PACK">Resurrection Pack — ${WS_PRICE_RP_PACK.toFixed(2)}/set</option>
                  <option value="HWP_PACK">Holy Week Pack — ${WS_PRICE_HWP_PACK.toFixed(2)}/set</option>
                  <option value="" disabled>──────────</option>
                  {orderableProducts
                    .filter((p) => !p.isPackProduct)
                    .map((p) => (
                      <option key={p.sku} value={p.sku}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label style={fieldLabel}>Qty</label>
                <select value={qty} onChange={(e) => setQty(Number(e.target.value))} style={inputStyle}>
                  {QTY_OPTIONS.map((q) => <option key={q} value={q}>{q}</option>)}
                </select>
              </div>
              <button
                onClick={handleSingleAdd}
                style={{ ...brandBtn, alignSelf: "end", whiteSpace: "nowrap" }}
              >
                + Add
              </button>
            </div>

            {/* Preview thumbnail */}
            {selectedProduct?.imageUrl && (
              <div style={{ marginBottom: "0.75rem" }}>
                <img
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.name}
                  style={{ width: 80, height: 80, objectFit: "contain", background: "#f5f0e8", borderRadius: 8, border: "1px solid var(--border)" }}
                />
              </div>
            )}

            {/* Price note */}
            <p style={{ fontSize: "0.77rem", color: "var(--text-muted)", margin: "0 0 0.4rem" }}>
              ${WS_PRICE_SINGLE.toFixed(2)}/sticker &nbsp;|&nbsp; Resurrection Pack $3.00 &nbsp;|&nbsp; Holy Week Pack $7.00
            </p>
            <p style={{ fontSize: "0.77rem", color: "var(--text-muted)", margin: "0 0 0.75rem" }}>
              🔔 Reminder: Order when you have ~10 left — delivery takes ~2 weeks.
            </p>

            {/* ASAP */}
            <label style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", cursor: "pointer", fontSize: "0.82rem", color: "var(--text)" }}>
              <input
                type="checkbox"
                checked={asap}
                onChange={(e) => setAsap(e.target.checked)}
                style={{ width: 15, height: 15, accentColor: "var(--brand)", marginTop: 2, cursor: "pointer" }}
              />
              <span>
                <strong>⚡ Mark as ASAP</strong>
                <small style={{ display: "block", color: "var(--text-muted)" }}>Check this if stock is completely out</small>
              </span>
            </label>
          </>
        ) : (
          <>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "0 0 0.65rem" }}>
              Check designs, set a quantity, then click Add Selected.
            </p>

            {/* Group quick-select chips */}
            <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
              {(["All", "Round 1", "Round 2", "HWP", "RP", ...categories] as string[]).map((g) => (
                <button
                  key={g}
                  onClick={() => { setBulkGroupFilter(g); setChecked(new Set()); }}
                  style={{
                    padding: "0.25rem 0.7rem",
                    borderRadius: "999px",
                    border: "1.5px solid",
                    borderColor: bulkGroupFilter === g ? "var(--brand)" : "var(--border)",
                    background: bulkGroupFilter === g ? "var(--brand)" : "white",
                    color: bulkGroupFilter === g ? "#fff" : "var(--text-muted)",
                    fontSize: "0.72rem",
                    fontWeight: bulkGroupFilter === g ? 600 : 400,
                    cursor: "pointer",
                    fontFamily: "var(--font-inter)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {g === "HWP" ? "Holy Week Pack" : g === "RP" ? "Resurrection Pack" : g === "Round 1" ? "Round 1 (STK 1–35)" : g === "Round 2" ? "Round 2 (STK 36–67)" : g}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.65rem", alignItems: "center", flexWrap: "wrap" }}>
              <input
                type="search"
                placeholder="Filter designs…"
                value={bulkSearch}
                onChange={(e) => setBulkSearch(e.target.value)}
                style={{ flex: 1, minWidth: 140, padding: "0.4rem 0.85rem", border: "1.5px solid var(--border)", borderRadius: "999px", fontSize: "0.82rem", outline: "none", fontFamily: "var(--font-inter)", color: "var(--text)" }}
              />
              <select
                value={bulkQty}
                onChange={(e) => setBulkQty(Number(e.target.value))}
                style={{ ...inputStyle, width: "auto" }}
              >
                {QTY_OPTIONS.map((q) => <option key={q} value={q}>{q}</option>)}
              </select>
              <button
                onClick={() => {
                  const allVisible = bulkList.map((p) => p.sku);
                  const allChecked = allVisible.every((sku) => checked.has(sku));
                  if (allChecked) setChecked(new Set());
                  else setChecked(new Set(allVisible));
                }}
                style={{ ...outlineBtn, whiteSpace: "nowrap" }}
              >
                {bulkList.every((p) => checked.has(p.sku)) ? "Deselect All" : "Select All"}
              </button>
              <button onClick={handleBulkAdd} style={{ ...brandBtn, whiteSpace: "nowrap" }}>
                Add Selected
              </button>
            </div>

            <div style={{ maxHeight: 360, overflowY: "auto", border: "1.5px solid var(--border)", borderRadius: 8 }}>
              {bulkList.length === 0 ? (
                <p style={{ padding: "1rem", color: "var(--text-muted)", fontSize: "0.82rem", textAlign: "center" }}>No designs match</p>
              ) : (
                bulkList.map((p) => (
                  <label
                    key={p.sku}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.6rem",
                      padding: "0.5rem 0.8rem",
                      borderBottom: "1px solid var(--border)",
                      fontSize: "0.82rem",
                      color: "var(--text)",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked.has(p.sku)}
                      onChange={(e) => {
                        const next = new Set(checked);
                        if (e.target.checked) next.add(p.sku);
                        else next.delete(p.sku);
                        setChecked(next);
                      }}
                      style={{ width: 15, height: 15, accentColor: "var(--brand)", cursor: "pointer", flexShrink: 0 }}
                    />
                    {p.imageUrl && (
                      <img src={p.imageUrl} alt="" aria-hidden style={{ width: 36, height: 36, objectFit: "contain", background: "#f5f0e8", borderRadius: 5, flexShrink: 0 }} />
                    )}
                    <span style={{ flex: 1 }}>
                      {p.name}
                      <small style={{ color: "var(--text-muted)", marginLeft: "0.4rem" }}>
                        ({p.sku}){"unitPrice" in p && p.isVirtualPack ? ` — $${(p as { unitPrice: number }).unitPrice.toFixed(2)}/set` : ""}
                      </small>
                    </span>
                  </label>
                ))
              )}
            </div>
          </>
        )}
      </Section>

      {/* Cart */}
      <Section title="Cart">
        {cart.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No items yet.</p>
        ) : (
          <>
            {cart.map((line) => (
              <div
                key={line.productId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.65rem 0",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                {line.imageUrl && (
                  <img src={line.imageUrl} alt="" aria-hidden style={{ width: 44, height: 44, objectFit: "contain", background: "#f5f0e8", borderRadius: 7, border: "1px solid var(--border)", flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: "0.85rem", color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {line.designName}
                  </p>
                  <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--text-muted)" }}>
                    {line.productId} — ${line.unitPrice.toFixed(2)}/ea
                  </p>
                </div>

                {/* Qty stepper */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <button
                    onClick={() => updateQty(line.productId, line.qty - 25)}
                    style={qtyBtn}
                    aria-label="Decrease quantity"
                  >
                    <Minus size={12} />
                  </button>
                  <input
                    type="number"
                    value={line.qty}
                    min={0}
                    onChange={(e) => updateQty(line.productId, Number(e.target.value))}
                    style={{ width: 56, textAlign: "center", padding: "0.25rem", border: "1px solid var(--border)", borderRadius: 5, fontSize: "0.82rem", fontFamily: "var(--font-inter)", color: "var(--text)" }}
                  />
                  <button
                    onClick={() => updateQty(line.productId, line.qty + 25)}
                    style={qtyBtn}
                    aria-label="Increase quantity"
                  >
                    <Plus size={12} />
                  </button>
                </div>

                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--brand)", minWidth: 64, textAlign: "right" }}>
                  ${(line.unitPrice * line.qty).toFixed(2)}
                </span>
                <button onClick={() => removeFromCart(line.productId)} aria-label="Remove" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}

            {/* Footer */}
            <div style={{ paddingTop: "0.75rem", textAlign: "right" }}>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: "0 0 0.2rem" }}>
                {cartCount} sticker{cartCount !== 1 ? "s" : ""}
                {hasPackInCart ? ` · ${packSetCount} pack set${packSetCount !== 1 ? "s" : ""}` : ""}
              </p>
              <p style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text)", margin: 0 }}>
                Grand Total: <span style={{ color: "var(--brand)" }}>${grandTotal.toFixed(2)}</span>
              </p>
            </div>
          </>
        )}
      </Section>

      {/* Order summary + submit */}
      {cart.length > 0 && (
        <Section title="Order Summary">
          <p style={{ fontSize: "0.85rem", color: "var(--text)", margin: "0 0 0.6rem" }}>
            <strong>{session.displayName}</strong>
            {asap && <span style={{ marginLeft: "0.5rem", color: "#e65100", fontWeight: 700 }}>⚡ ASAP</span>}
          </p>
          {asap && (
            <div style={{ background: "#fff3cd", border: "1px solid #ffc107", borderRadius: 6, padding: "0.5rem 0.75rem", marginBottom: "0.75rem", fontSize: "0.8rem", fontWeight: 600, color: "#e65100" }}>
              ⚡ ASAP order — stock is critically low.
            </div>
          )}
          <div style={{ overflowX: "auto", marginBottom: "0.75rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ background: "#f9f6f1" }}>
                  <th style={{ padding: "6px 8px", textAlign: "left" }}>Design</th>
                  <th style={{ padding: "6px 8px", textAlign: "center" }}>SKU</th>
                  <th style={{ padding: "6px 8px", textAlign: "center" }}>Qty</th>
                  <th style={{ padding: "6px 8px", textAlign: "center" }}>Unit</th>
                  <th style={{ padding: "6px 8px", textAlign: "right" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {cart.map((l) => (
                  <tr key={l.productId} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "6px 8px" }}>{l.designName}</td>
                    <td style={{ padding: "6px 8px", textAlign: "center", fontFamily: "monospace", fontSize: "0.76rem" }}>{l.productId}</td>
                    <td style={{ padding: "6px 8px", textAlign: "center" }}>{l.qty}</td>
                    <td style={{ padding: "6px 8px", textAlign: "center" }}>${l.unitPrice.toFixed(2)}</td>
                    <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: 700, color: "var(--brand)" }}>${(l.unitPrice * l.qty).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ textAlign: "right", fontWeight: 700, fontSize: "1rem", margin: "0 0 1rem" }}>
            Grand Total: <span style={{ color: "var(--brand)" }}>${grandTotal.toFixed(2)}</span>
          </p>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{ ...brandBtn, width: "100%", padding: "1rem", fontSize: "0.95rem", opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? "Submitting…" : "Submit Order"}
          </button>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-card)",
        padding: "1.25rem",
        marginBottom: "1.25rem",
      }}
    >
      <h2
        style={{
          fontFamily: "var(--font-cormorant)",
          fontSize: "1.15rem",
          fontWeight: 600,
          color: "var(--text)",
          margin: "0 0 1rem",
          paddingBottom: "0.6rem",
          borderBottom: "1px solid var(--border)",
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

const fieldLabel: React.CSSProperties = {
  display: "block",
  fontSize: "0.72rem",
  fontWeight: 600,
  color: "var(--text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: 5,
};

const inputStyle: React.CSSProperties = {
  padding: "0.5rem 0.65rem",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-btn)",
  fontSize: "0.85rem",
  fontFamily: "var(--font-inter)",
  color: "var(--text)",
  background: "white",
  outline: "none",
};

const brandBtn: React.CSSProperties = {
  padding: "0.55rem 1rem",
  background: "var(--brand)",
  color: "#fff",
  border: "none",
  borderRadius: "var(--radius-btn)",
  fontSize: "0.85rem",
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "var(--font-inter)",
};

const outlineBtn: React.CSSProperties = {
  padding: "0.4rem 0.85rem",
  background: "white",
  color: "var(--text-muted)",
  border: "1.5px solid var(--border)",
  borderRadius: "999px",
  fontSize: "0.74rem",
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "var(--font-inter)",
};

const qtyBtn: React.CSSProperties = {
  width: 26,
  height: 26,
  border: "1px solid var(--border)",
  borderRadius: 5,
  background: "white",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--text)",
};

const inlineSelect: React.CSSProperties = {
  padding: "0.3rem 0.6rem",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-btn)",
  fontSize: "0.82rem",
  fontFamily: "var(--font-inter)",
  color: "var(--text)",
  background: "white",
  outline: "none",
};

const inlineInput: React.CSSProperties = {
  padding: "0.3rem 0.6rem",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-btn)",
  fontSize: "0.82rem",
  fontFamily: "var(--font-inter)",
  color: "var(--text)",
  background: "white",
  outline: "none",
  minWidth: 200,
};

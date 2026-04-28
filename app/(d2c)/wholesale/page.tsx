"use client";

import { useActionState } from "react";
import { Nav } from "@/components/d2c/Nav";
import { Footer } from "@/components/d2c/Footer";
import { sendWholesaleInquiry } from "@/app/actions/wholesale";

function SubmitButton({ pending }: { pending: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-3.5 text-sm font-medium transition-opacity"
      style={{
        background: pending ? "var(--border)" : "var(--brand)",
        color: pending ? "var(--text-muted)" : "#fff",
        borderRadius: "var(--radius-btn)",
        cursor: pending ? "not-allowed" : "pointer",
      }}
    >
      {pending ? "Sending…" : "Submit Inquiry"}
    </button>
  );
}

const inputStyle = {
  width: "100%",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: "10px 14px",
  background: "var(--bg)",
  color: "var(--text)",
  fontSize: "0.9rem",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.78rem",
  fontWeight: 500,
  color: "var(--text-muted)",
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

export default function WholesaleInquiryPage() {
  const [state, formAction, isPending] = useActionState(sendWholesaleInquiry, {});

  return (
    <>
      <Nav />
      <main style={{ background: "var(--bg)", paddingTop: 64 }}>
        {/* Page header */}
        <div
          className="py-16 md:py-24 px-6 md:px-10 text-center"
          style={{ background: "var(--cream)", borderBottom: "1px solid var(--border)" }}
        >
          <p
            className="text-[11px] uppercase tracking-[0.28em] font-medium mb-4"
            style={{ color: "var(--gold)" }}
          >
            Sunday Schools &amp; Parishes
          </p>
          <h1
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 300,
              color: "var(--text)",
              letterSpacing: "-0.01em",
              marginBottom: "1rem",
            }}
          >
            Wholesale Inquiry
          </h1>
          <p
            className="mx-auto text-sm leading-relaxed"
            style={{ color: "var(--text-muted)", maxWidth: "46ch" }}
          >
            We offer bulk pricing starting at $0.70 / sticker for parishes, Sunday
            schools, and church bookstores. Fill out the form below and we'll respond
            within 1–2 business days.
          </p>
        </div>

        {/* Form */}
        <div className="max-w-2xl mx-auto px-6 md:px-10 py-16 md:py-24">
          {state.success ? (
            <div
              className="text-center py-16 px-8 rounded-2xl"
              style={{ background: "var(--cream)", border: "1px solid var(--border)" }}
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: "var(--brand)", color: "#fff", fontSize: "1.5rem" }}
              >
                ☩
              </div>
              <h2
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "1.6rem",
                  fontWeight: 400,
                  color: "var(--text)",
                  marginBottom: "0.75rem",
                }}
              >
                Inquiry received!
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)", maxWidth: "36ch", margin: "0 auto" }}>
                Thank you — we'll review your request and reach out within 1–2 business
                days at the email you provided.
              </p>
            </div>
          ) : (
            <form action={formAction} className="space-y-6">
              {state.error && (
                <div
                  className="px-4 py-3 rounded-lg text-sm"
                  style={{ background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca" }}
                >
                  {state.error}
                </div>
              )}

              {/* Contact info */}
              <div>
                <h2
                  className="mb-5 pb-3"
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "1.15rem",
                    fontWeight: 400,
                    color: "var(--text)",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  Contact Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" style={labelStyle}>Full Name *</label>
                    <input id="name" name="name" required style={inputStyle} placeholder="Fr. John Doe" />
                  </div>
                  <div>
                    <label htmlFor="church" style={labelStyle}>Church / Organization *</label>
                    <input id="church" name="church" required style={inputStyle} placeholder="St. Mark Coptic Church" />
                  </div>
                  <div>
                    <label htmlFor="email" style={labelStyle}>Email *</label>
                    <input id="email" name="email" type="email" required style={inputStyle} placeholder="you@church.org" />
                  </div>
                  <div>
                    <label htmlFor="phone" style={labelStyle}>Phone</label>
                    <input id="phone" name="phone" type="tel" style={inputStyle} placeholder="(312) 555-0100" />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="location" style={labelStyle}>City &amp; State</label>
                    <input id="location" name="location" style={inputStyle} placeholder="City, State" />
                  </div>
                </div>
              </div>

              {/* Order details */}
              <div>
                <h2
                  className="mb-5 pb-3"
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "1.15rem",
                    fontWeight: 400,
                    color: "var(--text)",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  Order Details
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="grades" style={labelStyle}>Grades / Age Group</label>
                    <input id="grades" name="grades" style={inputStyle} placeholder="e.g. Grades 3–6, Ages 8–12" />
                  </div>
                  <div>
                    <label htmlFor="quantity" style={labelStyle}>Estimated Qty per Order</label>
                    <input id="quantity" name="quantity" style={inputStyle} placeholder="e.g. 100–200 stickers" />
                  </div>
                  <div>
                    <label htmlFor="frequency" style={labelStyle}>Order Frequency</label>
                    <select id="frequency" name="frequency" style={{ ...inputStyle, appearance: "none" }}>
                      <option value="">Select one</option>
                      <option>One-time order</option>
                      <option>Monthly</option>
                      <option>Quarterly</option>
                      <option>Annually</option>
                      <option>Not sure yet</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="designs" style={labelStyle}>Designs Interested In</label>
                    <input id="designs" name="designs" style={inputStyle} placeholder="e.g. Holy Week Pack, Saints…" />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="notes" style={labelStyle}>Additional Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  style={{ ...inputStyle, resize: "vertical" }}
                  placeholder="Anything else we should know — upcoming events, custom requests, timeline, etc."
                />
              </div>

              <SubmitButton pending={isPending} />

              <p className="text-center text-xs" style={{ color: "var(--text-muted)" }}>
                Or email us directly at{" "}
                <a href="mailto:desertfathersstudio@gmail.com" style={{ color: "var(--brand)" }}>
                  desertfathersstudio@gmail.com
                </a>
              </p>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

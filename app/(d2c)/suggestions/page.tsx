"use client";

import { useState } from "react";
import { Nav } from "@/components/d2c/Nav";
import { Footer } from "@/components/d2c/Footer";

const inputStyle: React.CSSProperties = {
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

export default function SuggestionsPage() {
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");

    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      message: (form.elements.namedItem("message") as HTMLTextAreaElement).value,
    };

    try {
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setDone(true);
      } else {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

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
            Desert Fathers Studio
          </p>
          <h1
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(2rem, 4vw, 3.2rem)",
              fontWeight: 300,
              color: "var(--text)",
              letterSpacing: "-0.01em",
            }}
          >
            Share your ideas.
          </h1>
          <p
            className="mt-4 text-sm leading-relaxed mx-auto"
            style={{ color: "var(--text-muted)", maxWidth: "42ch" }}
          >
            Suggest a saint, a scene, or a design you'd love to see. We read every message.
          </p>
        </div>

        {/* Form */}
        <div className="max-w-xl mx-auto px-6 md:px-10 py-16 md:py-24">
          {done ? (
            <div
              className="py-12 text-center"
              style={{
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-card)",
                background: "var(--cream)",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "1.3rem",
                  fontWeight: 300,
                  color: "var(--text)",
                }}
              >
                Thank you.
              </p>
              <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
                Your suggestion has been sent.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="name" style={labelStyle}>
                    Name <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    style={inputStyle}
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="email" style={labelStyle}>
                    Email <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    style={inputStyle}
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="message" style={labelStyle}>
                  Your suggestion
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={6}
                  style={{ ...inputStyle, resize: "vertical" }}
                  placeholder="A saint you'd love to see, a scene, a design idea, or anything else on your mind…"
                />
              </div>

              {error && (
                <p className="text-sm" style={{ color: "var(--brand)" }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={pending}
                className="py-3.5 text-sm font-medium transition-opacity"
                style={{
                  background: pending ? "var(--border)" : "var(--brand)",
                  color: pending ? "var(--text-muted)" : "#fff",
                  borderRadius: "var(--radius-btn)",
                  cursor: pending ? "not-allowed" : "pointer",
                }}
              >
                {pending ? "Sending…" : "Send Suggestion"}
              </button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

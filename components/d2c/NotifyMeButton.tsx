"use client";

import { useState } from "react";
import { Bell, Check, X, Loader2 } from "lucide-react";

type State = "idle" | "open" | "submitting" | "done";

export function NotifyMeButton({
  productName,
  variant = "compact",
}: {
  productName: string;
  variant?: "compact" | "full";
}) {
  const [state, setState] = useState<State>("idle");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setState("submitting");
    try {
      const res = await fetch("/api/notify-me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setState("open");
        return;
      }
      setState("done");
    } catch {
      setError("Connection error. Please try again.");
      setState("open");
    }
  }

  if (state === "done") {
    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.3rem",
          fontSize: "0.72rem",
          color: "#4a7c59",
          fontFamily: "var(--font-sans)",
          fontWeight: 500,
        }}
      >
        <Check size={12} strokeWidth={2.5} />
        You'll be notified
      </div>
    );
  }

  if (state === "idle") {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); setState("open"); }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.3rem",
          fontSize: variant === "full" ? "0.78rem" : "0.7rem",
          color: "var(--text-muted)",
          fontFamily: "var(--font-sans)",
          fontWeight: 500,
          background: "none",
          border: variant === "full"
            ? "1px solid var(--border)"
            : "none",
          borderRadius: variant === "full" ? "999px" : 0,
          padding: variant === "full" ? "0.4rem 0.9rem" : "0",
          cursor: "pointer",
          transition: "opacity 0.15s",
          textDecoration: variant === "compact" ? "underline" : "none",
          textUnderlineOffset: "2px",
        }}
      >
        <Bell size={variant === "full" ? 13 : 11} />
        {variant === "full" ? "Notify me when available" : "Notify me"}
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      onClick={(e) => e.stopPropagation()}
      style={{ display: "flex", flexDirection: "column", gap: "0.35rem", width: "100%" }}
    >
      <div style={{ display: "flex", gap: "0.3rem", alignItems: "center" }}>
        <input
          type="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address"
          required
          style={{
            flex: 1,
            padding: "0.35rem 0.55rem",
            fontSize: "0.72rem",
            border: "1px solid var(--border)",
            borderRadius: 5,
            fontFamily: "var(--font-sans)",
            color: "var(--text)",
            background: "#fff",
            outline: "none",
            minWidth: 0,
          }}
        />
        <button
          type="submit"
          disabled={state === "submitting"}
          style={{
            padding: "0.35rem 0.65rem",
            fontSize: "0.7rem",
            fontWeight: 600,
            background: "var(--brand)",
            color: "#fff",
            border: "none",
            borderRadius: 5,
            cursor: "pointer",
            fontFamily: "var(--font-sans)",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
          }}
        >
          {state === "submitting"
            ? <Loader2 size={11} style={{ animation: "spin 0.6s linear infinite" }} />
            : "Notify"}
        </button>
        <button
          type="button"
          onClick={() => setState("idle")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-muted)",
            padding: "0.2rem",
            display: "flex",
            alignItems: "center",
          }}
          aria-label="Cancel"
        >
          <X size={12} />
        </button>
      </div>
      {error && (
        <p style={{ fontSize: "0.65rem", color: "#e05252", margin: 0, fontFamily: "var(--font-sans)" }}>
          {error}
        </p>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </form>
  );
}

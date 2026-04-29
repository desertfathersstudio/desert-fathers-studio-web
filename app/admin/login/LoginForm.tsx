"use client";

import { useState } from "react";
import { Fingerprint } from "lucide-react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { startAuthentication } from "@simplewebauthn/browser";

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#0d0609",
  border: "1px solid #2d1320",
  borderRadius: 8,
  padding: "0.65rem 0.875rem",
  color: "#f5f0ea",
  fontSize: "0.9rem",
  fontFamily: "Inter, system-ui, sans-serif",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.75rem",
  fontWeight: 600,
  color: "#8a6070",
  marginBottom: "0.375rem",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  fontFamily: "Inter, system-ui, sans-serif",
};

export function LoginForm() {
  const [email, setEmail]       = useState("desertfathersstudio@gmail.com");
  const [sent, setSent]         = useState(false);
  const [loading, setLoading]   = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [error, setError]       = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createSupabaseBrowser();
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/admin/auth/callback`,
      },
    });
    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      setSent(true);
      setLoading(false);
    }
  }

  async function handlePasskey() {
    setPasskeyLoading(true);
    setError("");
    try {
      const optRes = await fetch("/api/passkeys/auth-options");
      if (!optRes.ok) throw new Error(await optRes.text());
      const options = await optRes.json();

      const credential = await startAuthentication({ optionsJSON: options });

      const verRes = await fetch("/api/passkeys/auth-verify", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ credential }),
      });
      const result = await verRes.json();
      if (!verRes.ok) throw new Error(result.error ?? "Authentication failed");

      // Passkey verified — redirect to admin
      window.location.href = "/admin/inventory";
    } catch (err: unknown) {
      const msg = (err as Error).message ?? "Passkey sign-in failed";
      if (!msg.includes("cancel") && !msg.includes("Abort")) {
        setError(msg);
      }
    } finally {
      setPasskeyLoading(false);
    }
  }

  if (sent) {
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>✉️</div>
        <p
          style={{
            color: "#f5f0ea",
            fontFamily: "Inter, system-ui, sans-serif",
            fontWeight: 600,
            fontSize: "0.95rem",
            marginBottom: "0.5rem",
          }}
        >
          Check your email
        </p>
        <p
          style={{
            color: "#8a6070",
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: "0.82rem",
            lineHeight: 1.6,
          }}
        >
          A sign-in link was sent to{" "}
          <span style={{ color: "#c4a0b0" }}>{email}</span>. Click it to
          continue.
        </p>
        <button
          onClick={() => setSent(false)}
          style={{
            marginTop: "1.25rem",
            background: "none",
            border: "none",
            color: "#6b1d3b",
            fontSize: "0.8rem",
            cursor: "pointer",
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          Send again
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <h2
        style={{
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: 600,
          fontSize: "0.95rem",
          color: "#f5f0ea",
          margin: 0,
        }}
      >
        Sign in with email
      </h2>

      <div>
        <label htmlFor="email" style={labelStyle}>Email</label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
          autoComplete="email"
        />
      </div>

      {error && (
        <p
          style={{
            color: "#f87171",
            fontSize: "0.8rem",
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          background: loading ? "#3d1020" : "#6b1d3b",
          color: loading ? "#8a6070" : "#fff",
          border: "none",
          borderRadius: 8,
          padding: "0.75rem",
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: 600,
          fontSize: "0.9rem",
          cursor: loading ? "not-allowed" : "pointer",
          transition: "background 0.15s",
        }}
      >
        {loading ? "Sending…" : "Send Magic Link"}
      </button>

      {/* Passkey sign-in */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", margin: "0.25rem 0" }}>
        <div style={{ flex: 1, height: 1, background: "#2d1320" }} />
        <span style={{ fontSize: "0.72rem", color: "#8a6070", fontFamily: "Inter, system-ui, sans-serif" }}>or</span>
        <div style={{ flex: 1, height: 1, background: "#2d1320" }} />
      </div>

      <button
        type="button"
        onClick={handlePasskey}
        disabled={passkeyLoading}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
          background: "transparent",
          color: passkeyLoading ? "#8a6070" : "#f5f0ea",
          border: "1px solid #2d1320",
          borderRadius: 8,
          padding: "0.7rem",
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: 500,
          fontSize: "0.88rem",
          cursor: passkeyLoading ? "not-allowed" : "pointer",
        }}
      >
        <Fingerprint size={16} />
        {passkeyLoading ? "Authenticating…" : "Sign in with Face ID"}
      </button>
    </form>
  );
}

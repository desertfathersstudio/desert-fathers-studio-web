"use client";

import { useState } from "react";
import { Fingerprint, Eye, EyeOff } from "lucide-react";
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
  const [password, setPassword]     = useState("");
  const [showPw, setShowPw]         = useState(false);
  const [loading, setLoading]       = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [error, setError]           = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createSupabaseBrowser();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: "desertfathersstudio@gmail.com",
      password,
    });
    if (authError) {
      setError("Incorrect password");
      setLoading(false);
    } else {
      window.location.href = "/admin/inventory";
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

      // Navigate to the magic link — Supabase sets the session then redirects to /admin/auth/callback
      if (result.actionLink) {
        window.location.href = result.actionLink;
      } else {
        window.location.href = "/admin/inventory";
      }
    } catch (err: unknown) {
      const msg = (err as Error).message ?? "Passkey sign-in failed";
      if (!msg.toLowerCase().includes("cancel") && !msg.toLowerCase().includes("abort")) {
        setError(msg);
      }
    } finally {
      setPasskeyLoading(false);
    }
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
        Admin Sign In
      </h2>

      <div>
        <label htmlFor="password" style={labelStyle}>Password</label>
        <div style={{ position: "relative" }}>
          <input
            id="password"
            type={showPw ? "text" : "password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ ...inputStyle, paddingRight: "2.5rem" }}
            autoComplete="current-password"
            placeholder="Enter password"
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            style={{
              position: "absolute",
              right: "0.75rem",
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#8a6070",
              padding: 0,
              display: "flex",
            }}
          >
            {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>

      {error && (
        <p
          style={{
            color: "#f87171",
            fontSize: "0.8rem",
            fontFamily: "Inter, system-ui, sans-serif",
            margin: 0,
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
        {loading ? "Signing in…" : "Sign In"}
      </button>

      {/* Passkey / Face ID sign-in */}
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

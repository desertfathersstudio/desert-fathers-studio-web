"use client";

import { useState } from "react";
import { Fingerprint, X } from "lucide-react";
import { toast } from "sonner";
import { startRegistration } from "@simplewebauthn/browser";

export function PasskeySetup({ onDismiss }: { onDismiss: () => void }) {
  const [registering, setRegistering] = useState(false);
  const [deviceName, setDeviceName]   = useState("iPhone");

  async function handleRegister() {
    setRegistering(true);
    try {
      // Get options from server
      const optRes = await fetch("/api/passkeys/register-options");
      if (!optRes.ok) throw new Error(await optRes.text());
      const options = await optRes.json();

      // Trigger platform authenticator (Face ID / Touch ID)
      const credential = await startRegistration({ optionsJSON: options });

      // Verify with server
      const verRes = await fetch("/api/passkeys/register-verify", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ credential, deviceName }),
      });
      const result = await verRes.json();
      if (!verRes.ok) throw new Error(result.error ?? "Verification failed");

      toast.success("Passkey set up! You can now sign in with Face ID.");
      onDismiss();
    } catch (err: unknown) {
      const msg = (err as Error).message ?? "Setup failed";
      if (msg.includes("user cancel") || msg.includes("AbortError")) {
        toast.info("Passkey setup cancelled.");
      } else {
        toast.error(msg);
      }
    } finally {
      setRegistering(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: "0 0 env(safe-area-inset-bottom, 0)",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "18px 18px 0 0",
          padding: "1.5rem 1.5rem calc(1.5rem + env(safe-area-inset-bottom, 0))",
          width: "100%",
          maxWidth: 480,
          boxShadow: "0 -8px 32px rgba(0,0,0,0.2)",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "#6b1d3b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Fingerprint size={22} color="#fff" />
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: "1rem", color: "#2a1a0e" }}>
                Set up Face ID
              </p>
              <p style={{ margin: "2px 0 0", fontSize: "0.78rem", color: "#9a7080" }}>
                Sign in instantly next time
              </p>
            </div>
          </div>
          <button onClick={onDismiss} style={{ background: "none", border: "none", cursor: "pointer", color: "#9a7080", padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <p style={{ margin: "0 0 1.25rem", fontSize: "0.85rem", color: "#4a3040", lineHeight: 1.5 }}>
          Add this device as a passkey so you can open the admin app with Face ID — no email link needed.
        </p>

        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "#6b4050", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Device name
          </label>
          <input
            value={deviceName}
            onChange={(e) => setDeviceName(e.target.value)}
            style={{ width: "100%", boxSizing: "border-box" as const, padding: "8px 10px", border: "1px solid #e8ddd5", borderRadius: 8, fontSize: "0.85rem", fontFamily: "inherit", color: "#2a1a0e", background: "#fff", outline: "none" }}
          />
        </div>

        <div style={{ display: "flex", gap: "0.625rem" }}>
          <button
            onClick={onDismiss}
            style={{ flex: 1, padding: "10px", borderRadius: 10, background: "#f5f0ea", color: "#6b4050", border: "none", fontSize: "0.88rem", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}
          >
            Not now
          </button>
          <button
            onClick={handleRegister}
            disabled={registering}
            style={{ flex: 2, padding: "10px", borderRadius: 10, background: "#6b1d3b", color: "#fff", border: "none", fontSize: "0.88rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
          >
            {registering ? "Setting up…" : "Set up Face ID"}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/shared/Logo";
import { ACCOUNT_MAPPING } from "@/config/wholesale-accounts";
import { SESSION_KEY, CART_KEY_PREFIX } from "@/types/wholesale";
import type { WholesaleSession } from "@/types/wholesale";

export default function WholesalePinPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [debouncing, setDebouncing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // If already logged in, go straight to dashboard
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        router.replace("/wholesale-portal/dashboard");
        return;
      }
    } catch {}
    inputRef.current?.focus();
  }, [router]);

  const triggerShake = useCallback(() => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }, []);

  const handleSubmit = useCallback(
    (candidate: string) => {
      if (debouncing) return;

      const account = ACCOUNT_MAPPING[candidate];
      if (!account) {
        // Wrong PIN
        setError("Incorrect PIN. Please try again.");
        setPin("");
        triggerShake();

        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        if (newAttempts >= 3) {
          setDebouncing(true);
          debounceTimer.current = setTimeout(() => {
            setDebouncing(false);
          }, 1000);
        }

        setTimeout(() => inputRef.current?.focus(), 50);
        return;
      }

      // Correct PIN
      const session: WholesaleSession = {
        accountId: account.accountId,
        displayName: account.displayName,
        hasPendingTab: account.hasPendingTab,
        canEditFulfillment: account.canEditFulfillment,
      };
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      } catch {}

      router.replace("/wholesale-portal/dashboard");
    },
    [attempts, debouncing, router, triggerShake]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (debouncing) return;
      const val = e.target.value.replace(/\D/g, "").slice(0, 4);
      setPin(val);
      setError("");
      if (val.length === 4) {
        handleSubmit(val);
      }
    },
    [debouncing, handleSubmit]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && pin.length === 4) {
        handleSubmit(pin);
      }
    },
    [pin, handleSubmit]
  );

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 340,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "2rem",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
          <Logo />
          <div
            style={{
              fontSize: "0.7rem",
              fontWeight: 600,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
            }}
          >
            Wholesale Portal
          </div>
        </div>

        {/* Card */}
        <div
          style={{
            width: "100%",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-card)",
            padding: "2rem 1.75rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1.25rem",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <h1
              style={{
                fontFamily: "var(--font-cormorant)",
                fontSize: "1.6rem",
                fontWeight: 500,
                color: "var(--text)",
                margin: 0,
                letterSpacing: "-0.01em",
              }}
            >
              Enter your PIN
            </h1>
            <p
              style={{
                fontSize: "0.82rem",
                color: "var(--text-muted)",
                margin: "0.4rem 0 0",
              }}
            >
              Your 4-digit wholesale access code
            </p>
          </div>

          {/* PIN display dots */}
          <div
            aria-hidden
            style={{ display: "flex", gap: "0.75rem" }}
          >
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: i < pin.length ? "var(--brand)" : "var(--border)",
                  border: `2px solid ${i < pin.length ? "var(--brand)" : "var(--border-dark)"}`,
                  transition: "background 0.15s, border-color 0.15s",
                }}
              />
            ))}
          </div>

          {/* Hidden numeric input */}
          <div
            style={{
              position: "relative",
              width: "100%",
              animation: shake ? "ws-shake 0.4s ease" : undefined,
            }}
          >
            <style>{`
              @keyframes ws-shake {
                0%,100% { transform: translateX(0); }
                20% { transform: translateX(-8px); }
                40% { transform: translateX(8px); }
                60% { transform: translateX(-6px); }
                80% { transform: translateX(6px); }
              }
            `}</style>
            <input
              ref={inputRef}
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              value={pin}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              maxLength={4}
              aria-label="4-digit PIN"
              style={{
                width: "100%",
                padding: "0.875rem 1rem",
                border: `1.5px solid ${error ? "#dc2626" : "var(--border)"}`,
                borderRadius: "var(--radius-btn)",
                background: "white",
                fontSize: "1.5rem",
                letterSpacing: "0.5em",
                textAlign: "center",
                color: "transparent",
                caretColor: "var(--brand)",
                outline: "none",
                fontFamily: "monospace",
              }}
              disabled={debouncing}
            />
          </div>

          {error && (
            <p
              role="alert"
              style={{
                fontSize: "0.82rem",
                color: "#dc2626",
                margin: 0,
                textAlign: "center",
              }}
            >
              {error}
            </p>
          )}

          {debouncing && (
            <p
              style={{
                fontSize: "0.78rem",
                color: "var(--text-muted)",
                margin: 0,
                textAlign: "center",
              }}
            >
              Please wait a moment…
            </p>
          )}

          <button
            onClick={() => handleSubmit(pin)}
            disabled={pin.length < 4 || debouncing}
            style={{
              width: "100%",
              padding: "0.875rem",
              background: pin.length === 4 && !debouncing ? "var(--brand)" : "var(--border)",
              color: pin.length === 4 && !debouncing ? "#fff" : "var(--text-muted)",
              border: "none",
              borderRadius: "var(--radius-btn)",
              fontSize: "0.9rem",
              fontWeight: 600,
              cursor: pin.length === 4 && !debouncing ? "pointer" : "not-allowed",
              transition: "background 0.15s, color 0.15s",
              fontFamily: "var(--font-inter)",
            }}
          >
            Access Portal
          </button>
        </div>

        <p
          style={{
            fontSize: "0.72rem",
            color: "var(--text-muted)",
            textAlign: "center",
            margin: 0,
          }}
        >
          For account access, contact{" "}
          <a
            href="mailto:desertfathersstudio@gmail.com"
            style={{ color: "var(--brand)" }}
          >
            desertfathersstudio@gmail.com
          </a>
        </p>
      </div>
    </div>
  );
}

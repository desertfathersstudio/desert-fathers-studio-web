"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ACCOUNT_MAPPING } from "@/config/wholesale-accounts";
import { SESSION_KEY } from "@/types/wholesale";
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

      const session: WholesaleSession = {
        accountId: account.accountId,
        displayName: account.displayName,
        notifyEmail: account.notifyEmail,
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

  const pinReady = pin.length === 4 && !debouncing;

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
      {/* Brand identity */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "2.25rem",
        }}
      >
        <span
          aria-hidden
          style={{
            fontSize: "2.75rem",
            color: "var(--gold)",
            lineHeight: 1,
            fontFamily: "serif",
          }}
        >
          ☩
        </span>
        <span
          style={{
            fontFamily: "var(--font-cormorant)",
            fontSize: "1.75rem",
            fontWeight: 400,
            color: "var(--text)",
            letterSpacing: "0.02em",
          }}
        >
          Desert Fathers Studio
        </span>
        <span
          style={{
            fontSize: "0.62rem",
            fontWeight: 600,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
            fontFamily: "var(--font-inter)",
          }}
        >
          Wholesale Portal
        </span>
      </div>

      {/* Card — dark maroon */}
      <div
        style={{
          width: "100%",
          maxWidth: 340,
          background: "var(--brand-dark)",
          borderRadius: "var(--radius-card)",
          padding: "2rem 1.75rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1.5rem",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h1
            style={{
              fontFamily: "var(--font-cormorant)",
              fontSize: "1.5rem",
              fontWeight: 400,
              color: "var(--cream)",
              margin: "0 0 0.35rem",
              letterSpacing: "0.01em",
            }}
          >
            Enter your PIN
          </h1>
          <p
            style={{
              fontSize: "0.78rem",
              color: "rgba(239,231,214,0.55)",
              margin: 0,
              fontFamily: "var(--font-inter)",
            }}
          >
            Your 4-digit wholesale access code
          </p>
        </div>

        {/* PIN dots — square, manuscript feel */}
        <div aria-hidden style={{ display: "flex", gap: "0.875rem" }}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                width: 11,
                height: 11,
                borderRadius: "2px",
                background: i < pin.length ? "var(--gold)" : "transparent",
                border: `2px solid ${i < pin.length ? "var(--gold)" : "rgba(239,231,214,0.3)"}`,
                transition: "background 0.15s, border-color 0.15s",
              }}
            />
          ))}
        </div>

        {/* Input */}
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
              padding: "0.75rem 1rem",
              border: "none",
              borderBottom: `2px solid ${error ? "rgba(248,113,113,0.7)" : "rgba(239,231,214,0.25)"}`,
              borderRadius: 0,
              background: "transparent",
              fontSize: "1.5rem",
              letterSpacing: "0.5em",
              textAlign: "center",
              color: "transparent",
              caretColor: "var(--gold)",
              outline: "none",
              fontFamily: "monospace",
              boxSizing: "border-box",
            }}
            disabled={debouncing}
          />
        </div>

        {error && (
          <p
            role="alert"
            style={{
              fontSize: "0.78rem",
              color: "rgba(248,113,113,0.9)",
              margin: "-0.75rem 0 0",
              textAlign: "center",
              fontFamily: "var(--font-inter)",
            }}
          >
            {error}
          </p>
        )}

        {debouncing && (
          <p
            style={{
              fontSize: "0.74rem",
              color: "rgba(239,231,214,0.4)",
              margin: "-0.75rem 0 0",
              textAlign: "center",
              fontFamily: "var(--font-inter)",
            }}
          >
            Please wait a moment…
          </p>
        )}

        <button
          onClick={() => handleSubmit(pin)}
          disabled={!pinReady}
          style={{
            width: "100%",
            padding: "0.875rem",
            background: pinReady ? "var(--gold)" : "rgba(239,231,214,0.08)",
            color: pinReady ? "var(--cream)" : "rgba(239,231,214,0.25)",
            border: "none",
            borderRadius: "var(--radius-btn)",
            fontSize: "0.82rem",
            fontWeight: 600,
            fontFamily: "var(--font-inter)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            cursor: pinReady ? "pointer" : "not-allowed",
            transition: "background 0.2s, color 0.2s",
          }}
        >
          Access Portal
        </button>
      </div>

      <p
        style={{
          fontSize: "0.7rem",
          color: "var(--text-muted)",
          textAlign: "center",
          margin: "1.5rem 0 0",
          fontFamily: "var(--font-inter)",
        }}
      >
        For account access, contact{" "}
        <a href="mailto:desertfathersstudio@gmail.com" style={{ color: "var(--brand)" }}>
          desertfathersstudio@gmail.com
        </a>
      </p>
    </div>
  );
}

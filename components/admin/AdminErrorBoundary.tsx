"use client";

import { Component, ReactNode } from "react";

interface Props { children: ReactNode; }
interface State { error: (Error & { digest?: string }) | null; }

export class AdminErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error & { digest?: string }): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    console.error("[AdminErrorBoundary]", error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (error) {
      return (
        <div
          style={{
            padding: "2rem",
            maxWidth: 640,
            margin: "2rem auto",
            fontFamily: "inherit",
          }}
        >
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fca5a5",
              borderRadius: 10,
              padding: "1.25rem",
            }}
          >
            <div style={{ fontWeight: 700, color: "#991b1b", marginBottom: "0.5rem" }}>
              Admin error — unhandled exception
            </div>
            <pre
              style={{
                margin: 0,
                fontSize: "0.8rem",
                color: "#7f1d1d",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                lineHeight: 1.6,
              }}
            >
              {error.message || error.toString()}
              {error.digest ? `\n\nDigest: ${error.digest}` : ""}
            </pre>
          </div>
          <button
            onClick={() => this.setState({ error: null })}
            style={{
              marginTop: "1rem",
              padding: "0.55rem 1.25rem",
              background: "#6b1f2a",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: "0.875rem",
              fontFamily: "inherit",
              fontWeight: 600,
            }}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign In — DFS Admin" };

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0d0609",
        padding: "1.5rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "#6b1d3b",
              marginBottom: "0.875rem",
            }}
          >
            <span
              style={{
                color: "#fff",
                fontFamily: "Inter, system-ui, sans-serif",
                fontWeight: 800,
                fontSize: "1rem",
                letterSpacing: "-0.02em",
              }}
            >
              DFS
            </span>
          </div>
          <h1
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: 700,
              fontSize: "1.2rem",
              color: "#f5f0ea",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            DFS Admin
          </h1>
          <p
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: "0.8rem",
              color: "#8a6070",
              marginTop: "0.25rem",
            }}
          >
            Desert Fathers Studio
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: "#1a0d12",
            border: "1px solid #2d1320",
            borderRadius: 14,
            padding: "1.75rem",
          }}
        >
          {searchParams.error === "unauthorized" && (
            <div
              style={{
                background: "rgba(239,68,68,0.12)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: 8,
                padding: "0.75rem 1rem",
                marginBottom: "1.25rem",
                color: "#f87171",
                fontSize: "0.82rem",
                fontFamily: "Inter, system-ui, sans-serif",
              }}
            >
              Access denied. This account is not authorized.
            </div>
          )}
          {searchParams.error === "auth_failed" && (
            <div
              style={{
                background: "rgba(239,68,68,0.12)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: 8,
                padding: "0.75rem 1rem",
                marginBottom: "1.25rem",
                color: "#f87171",
                fontSize: "0.82rem",
                fontFamily: "Inter, system-ui, sans-serif",
              }}
            >
              Sign-in link expired or invalid. Try again.
            </div>
          )}
          <LoginForm />
        </div>
      </div>
    </main>
  );
}

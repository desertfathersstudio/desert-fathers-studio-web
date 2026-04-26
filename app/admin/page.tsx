export default function AdminPage() {
  return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: "#1a0e05" }}>
      <div className="text-center space-y-3">
        <h1 className="font-serif text-4xl" style={{ color: "var(--gold)" }}>
          Admin Dashboard
        </h1>
        <p style={{ color: "var(--text-muted)" }}>
          Internal tools. Supabase auth gating coming soon.
        </p>
      </div>
    </main>
  );
}

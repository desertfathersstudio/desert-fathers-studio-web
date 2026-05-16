export function StatCard({
  label,
  value,
  accent,
  sub,
}: {
  label: string;
  value: number | string;
  accent?: string;
  sub?: string;
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e8ddd5",
        borderRadius: 10,
        padding: "0.875rem 1rem",
        display: "flex",
        flexDirection: "column",
        gap: 3,
      }}
    >
      <span
        style={{
          fontSize: "0.68rem",
          fontWeight: 600,
          color: "#9a7080",
          textTransform: "uppercase",
          letterSpacing: "0.07em",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: "1.5rem",
          fontWeight: 700,
          color: accent ?? "#2a1a0e",
          letterSpacing: "-0.025em",
          lineHeight: 1.1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </span>
      {sub && (
        <span
          style={{
            fontSize: "0.75rem",
            color: "#9a7080",
            lineHeight: 1.4,
          }}
        >
          {sub}
        </span>
      )}
    </div>
  );
}

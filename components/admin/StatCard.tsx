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
        padding: "1rem 1.125rem",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <span
        style={{
          fontSize: "0.7rem",
          fontWeight: 600,
          color: "#9a7080",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: "1.65rem",
          fontWeight: 800,
          color: accent ?? "#2a1a0e",
          letterSpacing: "-0.03em",
          lineHeight: 1,
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {value}
      </span>
      {sub && (
        <span
          style={{
            fontSize: "0.72rem",
            color: "#9a7080",
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          {sub}
        </span>
      )}
    </div>
  );
}

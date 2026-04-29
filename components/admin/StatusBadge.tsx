import type { InventoryStatus, ReviewStatus } from "@/lib/admin/types";

const STATUS_CONFIG: Record<
  InventoryStatus,
  { label: string; bg: string; color: string }
> = {
  in_stock: { label: "In Stock",  bg: "rgba(34,197,94,0.12)",  color: "#16a34a" },
  low:      { label: "Low",       bg: "rgba(234,179,8,0.14)",  color: "#a16207" },
  sold_out: { label: "Sold Out",  bg: "rgba(239,68,68,0.12)",  color: "#dc2626" },
};

const REVIEW_CONFIG: Record<
  ReviewStatus,
  { label: string; bg: string; color: string }
> = {
  approved:     { label: "Approved",      bg: "rgba(34,197,94,0.12)", color: "#16a34a" },
  under_review: { label: "Under Review",  bg: "rgba(99,73,171,0.12)", color: "#3949ab" },
  rejected:     { label: "Rejected",      bg: "rgba(239,68,68,0.12)", color: "#dc2626" },
};

export function InventoryBadge({ status }: { status: InventoryStatus }) {
  const c = STATUS_CONFIG[status];
  return <Badge bg={c.bg} color={c.color} label={c.label} dot />;
}

export function ReviewBadge({ status }: { status: ReviewStatus }) {
  const c = REVIEW_CONFIG[status];
  return <Badge bg={c.bg} color={c.color} label={c.label} />;
}

export function IncomingBadge({ qty }: { qty: number }) {
  if (qty <= 0) return null;
  return (
    <Badge
      bg="rgba(29,111,184,0.12)"
      color="#1d6fb8"
      label={`+${qty} incoming`}
    />
  );
}

function Badge({
  bg,
  color,
  label,
  dot,
}: {
  bg: string;
  color: string;
  label: string;
  dot?: boolean;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: bg,
        color,
        borderRadius: 6,
        padding: "2px 8px",
        fontSize: "0.72rem",
        fontWeight: 600,
        fontFamily: "Inter, system-ui, sans-serif",
        whiteSpace: "nowrap",
      }}
    >
      {dot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: color,
            flexShrink: 0,
          }}
        />
      )}
      {label}
    </span>
  );
}

import { ArticleStatus } from "@prisma/client";
import { STATUS_META } from "@/lib/workflow";

// ──────────────────────────────────────────────────────────────────────────────
// StatusChip — renders an article status with shape + label + tint
//
// Status is NEVER communicated by colour alone. Each status has:
//   • A unique shape (hollow circle, filled circle, check, etc.)
//   • An uppercase label
//   • A 10%-opacity tint background
//   • The brand accent (--accent) is NEVER a status colour
// ──────────────────────────────────────────────────────────────────────────────

interface StatusChipProps {
  status: ArticleStatus;
  className?: string;
}

const SHAPE_SVG: Record<string, React.ReactNode> = {
  "hollow-circle": (
    <svg width="6" height="6" viewBox="0 0 6 6" aria-hidden="true">
      <circle cx="3" cy="3" r="2.5" fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>
  ),
  "filled-circle": (
    <svg width="6" height="6" viewBox="0 0 6 6" aria-hidden="true">
      <circle cx="3" cy="3" r="3" fill="currentColor" />
    </svg>
  ),
  "half-circle": (
    <svg width="6" height="6" viewBox="0 0 6 6" aria-hidden="true">
      <path d="M3 0A3 3 0 0 0 3 6V0z" fill="currentColor" />
      <circle cx="3" cy="3" r="2.5" fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>
  ),
  "check": (
    <svg width="6" height="6" viewBox="0 0 6 6" aria-hidden="true">
      <path d="M1 3l1.5 1.5L5 1.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  "clock": (
    <svg width="6" height="6" viewBox="0 0 6 6" aria-hidden="true">
      <circle cx="3" cy="3" r="2.5" fill="none" stroke="currentColor" strokeWidth="0.8" />
      <path d="M3 1.5V3l1.2 0.8" fill="none" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
    </svg>
  ),
  "filled-square": (
    <svg width="6" height="6" viewBox="0 0 6 6" aria-hidden="true">
      <rect x="0.5" y="0.5" width="5" height="5" rx="0.5" fill="currentColor" />
    </svg>
  ),
  "cross": (
    <svg width="6" height="6" viewBox="0 0 6 6" aria-hidden="true">
      <path d="M1 1l4 4M5 1l-4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  ),
  "hollow-square": (
    <svg width="6" height="6" viewBox="0 0 6 6" aria-hidden="true">
      <rect x="0.5" y="0.5" width="5" height="5" rx="0.5" fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>
  ),
};

export default function StatusChip({ status, className }: StatusChipProps) {
  const meta = STATUS_META[status] || STATUS_META.DRAFT;

  return (
    <span
      className={`status-chip ${className || ""}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "2px 8px",
        borderRadius: "4px",
        fontSize: "11px",
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase" as const,
        lineHeight: "18px",
        color: `var(${meta.token})`,
        backgroundColor: `color-mix(in srgb, var(${meta.token}) 10%, transparent)`,
        whiteSpace: "nowrap" as const,
      }}
    >
      {SHAPE_SVG[meta.shape]}
      {meta.label}
    </span>
  );
}

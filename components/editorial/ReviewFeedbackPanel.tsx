import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";

// ──────────────────────────────────────────────────────────────────────────────
// ReviewFeedbackPanel
//
// A reviewer must write at least 20 characters to request changes or reject an
// article, and that reason is stored on ArticleReview. Until now nothing
// rendered it, so the author was told "changes requested" and had to go and ask
// what the changes were. This panel is where that answer lives.
//
// Only shown for the two statuses where the author is expected to act. An
// approved or published article does not need a standing banner about a
// decision that is already resolved -- the full history stays in the revisions
// panel.
// ──────────────────────────────────────────────────────────────────────────────

export type ReviewFeedback = {
  id: string;
  decision: string;
  reason: string | null;
  reasonCode: string | null;
  createdAt: Date | string;
  passNumber: number;
  reviewer: { name: string | null } | null;
};

interface Props {
  status: string;
  latestReview: ReviewFeedback | null;
}

const DECISION_PRESENTATION: Record<
  string,
  { label: string; tone: "warn" | "bad" | "ok"; Icon: typeof AlertCircle }
> = {
  CHANGES_REQUESTED: { label: "Changes requested", tone: "warn", Icon: AlertCircle },
  REJECTED: { label: "Rejected", tone: "bad", Icon: XCircle },
  APPROVED: { label: "Approved", tone: "ok", Icon: CheckCircle2 },
};

// Tone classes are written out rather than interpolated, because Tailwind scans
// source text for complete class names and would not emit a constructed one.
const TONE_CLASSES = {
  warn: { wrap: "border-warn/40 bg-warn/5", accent: "text-warn" },
  bad: { wrap: "border-bad/40 bg-bad/5", accent: "text-bad" },
  ok: { wrap: "border-ok/40 bg-ok/5", accent: "text-ok" },
} as const;

export default function ReviewFeedbackPanel({ status, latestReview }: Props) {
  if (status !== "REVISION_REQUESTED" && status !== "REJECTED") return null;
  if (!latestReview?.reason) return null;

  const presentation =
    DECISION_PRESENTATION[latestReview.decision] ?? DECISION_PRESENTATION.CHANGES_REQUESTED;
  const tone = TONE_CLASSES[presentation.tone];
  const { Icon } = presentation;

  const when = new Date(latestReview.createdAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <section
      aria-labelledby="review-feedback-heading"
      className={`border rounded-xl p-4 sm:p-5 mb-5 ${tone.wrap}`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${tone.accent}`} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <h2
              id="review-feedback-heading"
              className={`text-sm font-bold ${tone.accent}`}
            >
              {presentation.label}
            </h2>
            <span className="text-xs text-muted">
              by {latestReview.reviewer?.name || "a reviewer"} · {when}
              {latestReview.passNumber > 1 && ` · pass ${latestReview.passNumber}`}
            </span>
          </div>

          {latestReview.reasonCode && (
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mt-2">
              {latestReview.reasonCode.replace(/_/g, " ")}
            </p>
          )}

          {/* whitespace-pre-wrap: reviewers write lists and paragraphs, and
              collapsing them turns structured feedback into one run-on line. */}
          <p className="text-sm text-ink leading-relaxed mt-2 whitespace-pre-wrap">
            {latestReview.reason}
          </p>
        </div>
      </div>
    </section>
  );
}

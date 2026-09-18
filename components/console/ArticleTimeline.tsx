import { FileEdit, CheckCircle2, XCircle, RotateCcw } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// ArticleTimeline — one chronological history for an article.
//
// Revisions and review decisions are two separate tables, and reading them as
// two separate lists makes it hard to answer the question people actually ask:
// "what happened to this piece, in order?" A rejection means little without the
// revision that followed it. So both are merged into a single descending
// sequence here.
//
// Rejection reasons matter most and are rendered in full rather than truncated:
// the whole point of storing them was so an author could read them later.
// ─────────────────────────────────────────────────────────────────────────────

export interface TimelineRevision {
  id: string;
  notes: string | null;
  statusChange: string | null;
  createdAt: string;
  title: string | null;
  actor: string;
}

export interface TimelineReview {
  id: string;
  decision: string;
  reason: string | null;
  reasonCode: string | null;
  fromStatus: string;
  toStatus: string;
  passNumber: number;
  createdAt: string;
  actor: string;
}

interface ArticleTimelineProps {
  revisions: TimelineRevision[];
  reviews: TimelineReview[];
}

type Entry =
  | { kind: "revision"; at: number; data: TimelineRevision }
  | { kind: "review"; at: number; data: TimelineReview };

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// The decision string is written by the workflow actions. Anything unrecognised
// still renders -- with a neutral icon -- rather than disappearing, because a
// silently dropped review entry is worse than an oddly-labelled one.
function decisionPresentation(decision: string) {
  const d = decision.toUpperCase();
  if (d.includes("APPROVE")) {
    return { icon: CheckCircle2, tone: "text-[var(--ok)]", label: "Approved" };
  }
  if (d.includes("REJECT")) {
    return { icon: XCircle, tone: "text-[var(--bad)]", label: "Rejected" };
  }
  if (d.includes("CHANGE") || d.includes("REVISION")) {
    return { icon: RotateCcw, tone: "text-[var(--warn)]", label: "Changes requested" };
  }
  return { icon: FileEdit, tone: "text-muted", label: decision };
}

export default function ArticleTimeline({ revisions, reviews }: ArticleTimelineProps) {
  const entries: Entry[] = [
    ...revisions.map<Entry>((r) => ({
      kind: "revision",
      at: new Date(r.createdAt).getTime(),
      data: r,
    })),
    ...reviews.map<Entry>((r) => ({
      kind: "review",
      at: new Date(r.createdAt).getTime(),
      data: r,
    })),
  ].sort((a, b) => b.at - a.at);

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted font-[var(--f-ui)] py-2">
        No revisions or review decisions recorded yet. History starts
        accumulating the first time this article is saved or submitted.
      </p>
    );
  }

  return (
    <ol className="space-y-0">
      {entries.map((entry, i) => {
        const isLast = i === entries.length - 1;

        if (entry.kind === "review") {
          const r = entry.data;
          const { icon: Icon, tone, label } = decisionPresentation(r.decision);
          return (
            <li key={`review-${r.id}`} className="flex gap-4">
              {/* Rail: icon plus a connecting line, so the sequence reads as one
                  thread rather than a stack of boxes. */}
              <div className="flex flex-col items-center shrink-0">
                <Icon className={`w-4 h-4 mt-1 ${tone}`} aria-hidden="true" />
                {!isLast && <div className="w-px flex-1 bg-[var(--line)] mt-1.5" />}
              </div>

              <div className={`min-w-0 flex-1 ${isLast ? "pb-0" : "pb-6"}`}>
                <p className="text-sm text-ink font-[var(--f-ui)]">
                  <span className="font-semibold">{label}</span>
                  {" by "}
                  <span className="font-semibold">{r.actor}</span>
                  {r.passNumber > 1 && (
                    <span className="text-muted"> · pass {r.passNumber}</span>
                  )}
                </p>
                <p className="text-xs text-muted mt-0.5 font-[var(--f-ui)]">
                  {formatWhen(r.createdAt)} · {r.fromStatus} → {r.toStatus}
                  {r.reasonCode && ` · ${r.reasonCode}`}
                </p>
                {r.reason && (
                  <p className="text-sm text-ink mt-2 leading-relaxed border-l-2 border-line pl-3 font-[var(--f-body)]">
                    {r.reason}
                  </p>
                )}
              </div>
            </li>
          );
        }

        const r = entry.data;
        return (
          <li key={`rev-${r.id}`} className="flex gap-4">
            <div className="flex flex-col items-center shrink-0">
              <FileEdit className="w-4 h-4 mt-1 text-muted" aria-hidden="true" />
              {!isLast && <div className="w-px flex-1 bg-[var(--line)] mt-1.5" />}
            </div>

            <div className={`min-w-0 flex-1 ${isLast ? "pb-0" : "pb-6"}`}>
              <p className="text-sm text-ink font-[var(--f-ui)]">
                <span className="font-semibold">Revision saved</span>
                {" by "}
                <span className="font-semibold">{r.actor}</span>
              </p>
              <p className="text-xs text-muted mt-0.5 font-[var(--f-ui)]">
                {formatWhen(r.createdAt)}
                {r.statusChange && ` · ${r.statusChange}`}
              </p>
              {r.notes && (
                <p className="text-sm text-muted mt-2 leading-relaxed font-[var(--f-body)]">
                  {r.notes}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

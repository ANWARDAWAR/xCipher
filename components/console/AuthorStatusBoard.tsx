import Link from "next/link";
import { FileEdit, Clock, AlertCircle, CheckCircle2, Plus } from "lucide-react";

// ──────────────────────────────────────────────────────────────────────────────
// Author status board
// ──────────────────────────────────────────────────────────────────────────────
//
// An author's dashboard question is not "how is the publication doing" -- they
// cannot act on that -- it is "where are my pieces, and which one is waiting on
// me". This lays their work out as four columns matching the states an author
// can actually be in, ordered by who owes the next move:
//
//   Changes Requested -> the author owes work, and it is blocking
//   Drafts            -> the author owes work, not blocking
//   In Review         -> someone else owes a decision
//   Published         -> done
//
// Changes Requested comes first for that reason, even though it is usually the
// smallest column: it is the only one with a deadline attached to it.
// ──────────────────────────────────────────────────────────────────────────────

export interface BoardArticle {
  id: string;
  title: string;
  status: string;
  updatedAt: Date | string;
  publishedAt?: Date | string | null;
  views?: number | null;
  category?: { name: string } | null;
}

interface ColumnSpec {
  key: string;
  status: string;
  label: string;
  /** Border colour for the column rule. Each state also has its own icon, so
   *  the board survives greyscale and colour-blindness. */
  accent: string;
  icon: typeof FileEdit;
  empty: string;
}

const COLUMNS: ColumnSpec[] = [
  {
    key: "revision",
    status: "REVISION_REQUESTED",
    label: "Changes Requested",
    accent: "border-l-[var(--bad)]",
    icon: AlertCircle,
    empty: "Nothing sent back to you.",
  },
  {
    key: "draft",
    status: "DRAFT",
    label: "Drafts",
    accent: "border-l-[var(--muted)]",
    icon: FileEdit,
    empty: "No drafts in progress.",
  },
  {
    key: "submitted",
    status: "SUBMITTED",
    label: "In Review",
    accent: "border-l-[var(--warn)]",
    icon: Clock,
    empty: "Nothing awaiting a decision.",
  },
  {
    key: "published",
    status: "PUBLISHED",
    label: "Published",
    accent: "border-l-[var(--ok)]",
    icon: CheckCircle2,
    empty: "Nothing published yet.",
  },
];

function relativeDate(value: Date | string | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  const diff = Date.now() - d.getTime();
  const day = 86_400_000;

  if (diff < 3_600_000) return "just now";
  if (diff < day) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function AuthorStatusBoard({
  articles,
  counts,
}: {
  articles: BoardArticle[];
  counts: Record<string, number>;
}) {
  const hasAnything = Object.values(counts).some((n) => n > 0);

  // First run: a four-column board of empty states tells a new author nothing
  // except that the product looks broken. One clear invitation is better.
  if (!hasAnything) {
    return (
      <section className="py-14 text-center border-t border-line">
        <h2 className="text-lg font-bold text-ink font-[var(--f-ui)]">
          Your desk is empty
        </h2>
        <p className="text-sm text-muted mt-1.5 max-w-md mx-auto">
          Anything you write will appear here, grouped by where it is in the
          editorial process.
        </p>
        <Link
          href="/admin/editor"
          className="inline-flex items-center gap-2 mt-5 px-4 py-2 bg-accent hover:bg-accent-deep active:bg-accent-press text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Start your first story
        </Link>
      </section>
    );
  }

  return (
    <section aria-label="Your stories by status">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-x-6 gap-y-8">
        {COLUMNS.map((col) => {
          // Capped: a column is a summary, not the article list. Anything
          // beyond this is reachable through the footer link.
          const items = articles.filter((a) => a.status === col.status).slice(0, 5);
          const total = counts[col.status] || 0;
          const Icon = col.icon;

          return (
            <div key={col.key} className={`border-l-2 ${col.accent} pl-4`}>
              <div className="flex items-baseline justify-between gap-2 mb-3">
                <h3 className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted font-[var(--f-ui)]">
                  <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                  {col.label}
                </h3>
                <span className="text-sm font-bold text-ink tabular-nums">{total}</span>
              </div>

              {items.length === 0 ? (
                <p className="text-xs text-faint leading-relaxed">{col.empty}</p>
              ) : (
                <ul className="space-y-3">
                  {items.map((a) => (
                    <li key={a.id}>
                      <Link
                        href={`/admin/articles/${a.id}`}
                        className="group block focus-visible:outline-2 focus-visible:outline-accent rounded-sm"
                      >
                        <span className="block text-sm font-semibold text-ink leading-snug line-clamp-2 group-hover:text-accent transition-colors">
                          {a.title || "Untitled"}
                        </span>
                        <span className="block text-[11px] text-muted mt-1">
                          {a.category?.name ? `${a.category.name} · ` : ""}
                          {relativeDate(
                            col.status === "PUBLISHED" ? a.publishedAt || a.updatedAt : a.updatedAt
                          )}
                          {col.status === "PUBLISHED" && typeof a.views === "number"
                            ? ` · ${a.views.toLocaleString()} reads`
                            : ""}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              {total > items.length && (
                <Link
                  href={`/admin/articles?status=${col.status}`}
                  className="inline-block mt-3 text-[11px] font-semibold text-accent hover:underline"
                >
                  View all {total}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

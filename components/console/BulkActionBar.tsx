"use client";

import { Fragment, useState, useTransition } from "react";
import type { ArticleStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { Archive, Send, Globe, RotateCcw, X, Loader2, Trash2 } from "lucide-react";
import {
  bulkArchive,
  bulkRestore,
  bulkPublish,
  bulkSubmit,
  bulkDelete,
  type BulkResponse,
} from "@/app/actions/workflow";
import { showToast } from "@/lib/utils";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

// ─────────────────────────────────────────────────────────────────────────────
// Bulk action bar — appears only when rows are selected.
//
// The bar is positioned at the bottom of the viewport rather than above the
// table, so it stays reachable while scrolling a long list. It is the one place
// in the console where a floating surface is justified: it is transient, it is
// about the selection rather than the page, and putting it inline would push
// the table down every time a checkbox changed.
//
// Partial success is reported honestly. The server validates each article
// separately and can legitimately archive 37 of 40, so the toast says so and
// the rejected ones are listed rather than collapsed into a generic failure.
// ─────────────────────────────────────────────────────────────────────────────

type BulkKind = "archive" | "restore" | "publish" | "submit" | "delete";

interface BulkActionBarProps {
  selectedIds: string[];
  onClear: () => void;
  canArchive: boolean;
  canPublish: boolean;
  canSubmit: boolean;
  /** Permanent deletion. Separate from the others because it is the only
   *  irreversible verb here, and only OWNER/ADMIN hold the capability. */
  canDelete?: boolean;
  /** Remove rows from the table before the server answers. Delete has no
   *  target status to paint -- the row goes away entirely. */
  onOptimisticRemove?: (ids: string[]) => void;
  /** Paint the new status on the affected rows before the server answers.
   *  Must be invoked inside a transition, which is why the call lives in
   *  handleRun rather than in the click handler. */
  onOptimisticStatus?: (patch: Record<string, ArticleStatus>) => void;
}

/** The status each bulk verb moves an article to, for the optimistic paint.
 *  Mirrors the `to` each server action passes to runBulkTransition. */
const OPTIMISTIC_TARGET: Partial<Record<BulkKind, ArticleStatus>> = {
  archive: "ARCHIVED",
  restore: "DRAFT",
  publish: "PUBLISHED",
  submit: "SUBMITTED",
  // No entry for "delete": the row is removed rather than restyled, so it is
  // handled by onOptimisticRemove instead.
};

const ACTIONS: Record<
  BulkKind,
  {
    label: string;
    icon: typeof Archive;
    run: (ids: string[]) => Promise<BulkResponse>;
    confirmTitle: (n: number) => string;
    confirmBody: (n: number) => string;
    destructive?: boolean;
  }
> = {
  archive: {
    label: "Archive",
    icon: Archive,
    run: bulkArchive,
    confirmTitle: (n) => `Archive ${n} article${n === 1 ? "" : "s"}?`,
    confirmBody: (n) =>
      `${n} article${n === 1 ? "" : "s"} will be moved to the archive and removed from the public site if published. Archived articles can be restored to draft later.`,
    destructive: true,
  },
  delete: {
    label: "Delete",
    icon: Trash2,
    run: bulkDelete,
    confirmTitle: (n) => `Permanently delete ${n} article${n === 1 ? "" : "s"}?`,
    // Names what else goes, because "delete the article" reads as reversible to
    // most people and this is not. The server refuses anything that is not a
    // draft or archived, which is said here so the count is not a surprise.
    confirmBody: (n) =>
      `This cannot be undone. ${n === 1 ? "The article" : `Up to ${n} articles`} will be erased along with ${n === 1 ? "its" : "their"} revision history, review history and reader comments. Only drafts and archived articles are eligible — anything published or in review will be skipped and reported.`,
    destructive: true,
  },
  restore: {
    label: "Restore to draft",
    icon: RotateCcw,
    run: bulkRestore,
    confirmTitle: (n) => `Restore ${n} article${n === 1 ? "" : "s"} to draft?`,
    confirmBody: (n) =>
      `${n} archived article${n === 1 ? "" : "s"} will return to draft, where they can be edited and resubmitted.`,
  },
  publish: {
    label: "Publish",
    icon: Globe,
    run: bulkPublish,
    confirmTitle: (n) => `Publish ${n} article${n === 1 ? "" : "s"}?`,
    confirmBody: (n) =>
      `${n} article${n === 1 ? "" : "s"} will go live immediately and be visible to readers. Anything not in a publishable state will be skipped and reported.`,
    destructive: true,
  },
  submit: {
    label: "Submit for review",
    icon: Send,
    run: bulkSubmit,
    confirmTitle: (n) => `Submit ${n} article${n === 1 ? "" : "s"} for review?`,
    confirmBody: (n) =>
      `${n} article${n === 1 ? "" : "s"} will enter the review queue.`,
  },
};

export default function BulkActionBar({
  selectedIds,
  onClear,
  canArchive,
  canPublish,
  canSubmit,
  canDelete,
  onOptimisticStatus,
  onOptimisticRemove,
}: BulkActionBarProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [pending, setPending] = useState<BulkKind | null>(null);
  const [running, setRunning] = useState(false);

  if (selectedIds.length === 0) return null;

  const n = selectedIds.length;

  // Delete is last, and visually separated below, so it is never adjacent to
  // the verb an editor reaches for most.
  const available: BulkKind[] = [
    ...(canSubmit ? (["submit"] as BulkKind[]) : []),
    ...(canPublish ? (["publish"] as BulkKind[]) : []),
    ...(canArchive ? (["archive", "restore"] as BulkKind[]) : []),
    ...(canDelete ? (["delete"] as BulkKind[]) : []),
  ];

  const handleRun = async () => {
    if (!pending) return;
    const action = ACTIONS[pending];
    const target = OPTIMISTIC_TARGET[pending];
    const ids = [...selectedIds];
    setRunning(true);

    // Everything below runs inside one transition so the optimistic overlay
    // stays alive for exactly as long as the action does. React discards it
    // when the transition settles -- by which point router.refresh() has
    // replaced the rows with server truth -- so there is no manual rollback and
    // no window where a stale overlay can outlive its action.
    startTransition(async () => {
      // Paint first. If the action throws, nothing was written and this is
      // dropped against unchanged data, which is the revert.
      if (pending === "delete") {
        // Rows leave the table rather than change status.
        onOptimisticRemove?.(ids);
      } else if (target) {
        onOptimisticStatus?.(Object.fromEntries(ids.map((id) => [id, target])));
      }

      try {
        const res = await action.run(ids);

        if (!res.ok) {
          showToast(`Error: ${res.message}`);
          return;
        }

        const { succeeded, failed, outcomes } = res.data!;

        if (failed === 0) {
          showToast(`${succeeded} article${succeeded === 1 ? "" : "s"} updated.`, "success", "premium");
        } else if (succeeded === 0) {
          // Every one was rejected -- show why for the first, since they usually
          // share a cause, rather than a bare "nothing happened".
          const first = outcomes.find((o) => !o.ok);
          showToast(`No articles were changed. ${first?.message || ""}`.trim());
        } else {
          const skipped = outcomes
            .filter((o) => !o.ok)
            .map((o) => o.title)
            .slice(0, 3)
            .join(", ");
          const more = failed > 3 ? ` and ${failed - 3} more` : "";
          showToast(
            `${succeeded} updated, ${failed} skipped: ${skipped}${more}.`,
            "success",
            "premium"
          );
        }

        // Partial success is the interesting case: the paint above moved every
        // selected row, but the server may have rejected some. Re-apply the
        // overlay to the accepted ids only, so a rejected article visibly stays
        // where it was instead of flickering to the new status and back when
        // the refresh lands.
        if (failed > 0) {
          const accepted = outcomes.filter((o) => o.ok).map((o) => o.id);
          if (pending === "delete") {
            // Narrow the removal to what actually went, so a skipped article
            // reappears immediately instead of vanishing and returning when
            // the refresh lands.
            onOptimisticRemove?.(accepted);
          } else if (target) {
            onOptimisticStatus?.(
              Object.fromEntries(accepted.map((id) => [id, target]))
            );
          }
        }

        onClear();
        router.refresh();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Bulk action failed";
        showToast(`Error: ${msg}`);
      } finally {
        setRunning(false);
        setPending(null);
      }
    });
  };

  return (
    <>
      <div
        className="fixed bottom-0 left-0 w-full sm:bottom-6 sm:left-1/2 sm:-translate-x-1/2 z-50 sm:w-max sm:max-w-[calc(100%-2rem)] bg-[var(--surface)] sm:bg-transparent rounded-t-2xl sm:rounded-none p-3 sm:p-0 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] sm:shadow-none border-t border-line sm:border-0"
        role="region"
        aria-label="Bulk actions for selected articles"
      >
        <div className="flex items-center justify-between gap-4 px-2 sm:px-5 py-2 sm:py-2.5 sm:bg-ink text-ink sm:text-surface sm:rounded-full sm:shadow-2xl max-w-full sm:max-w-fit mx-auto overflow-x-auto no-scrollbar">
          <span
            className="text-sm font-bold whitespace-nowrap"
            aria-live="polite"
          >
            {n} selected
          </span>

          <div className="w-px h-5 bg-surface/20" aria-hidden="true" />

          <div className="flex items-center gap-1 flex-wrap flex-1 justify-center">
            {available.map((kind) => {
              const { label, icon: Icon } = ACTIONS[kind];
              const isDelete = kind === "delete";
              return (
                <Fragment key={kind}>
                  {isDelete && (
                    <span
                      className="mx-1 h-5 w-px bg-surface/20 self-center"
                      aria-hidden="true"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => setPending(kind)}
                    disabled={running}
                    className={
                      isDelete
                        ? "flex shrink-0 items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full text-bad sm:text-[#ff9ea6] hover:bg-bad hover:text-white transition-colors disabled:opacity-50"
                        : "flex shrink-0 items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full bg-surface-2 sm:bg-transparent hover:bg-surface-3 sm:hover:bg-white/10 transition-colors disabled:opacity-50"
                    }
                  >
                    {running && pending === kind ? (
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Icon className="w-4 h-4" aria-hidden="true" />
                    )}
                    {label}
                  </button>
                </Fragment>
              );
            })}
          </div>

          <button
            type="button"
            onClick={onClear}
            disabled={running}
            className="p-1.5 rounded-full hover:bg-white/10 transition-colors disabled:opacity-50 ml-1"
            aria-label="Clear selection"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={pending !== null}
        title={pending ? ACTIONS[pending].confirmTitle(n) : ""}
        description={pending ? ACTIONS[pending].confirmBody(n) : ""}
        confirmText={running ? "Working…" : pending ? ACTIONS[pending].label : ""}
        cancelText="Cancel"
        isDestructive={pending ? !!ACTIONS[pending].destructive : false}
        // Typing the word is reserved for the one action that cannot be undone.
        // Archiving is destructive-looking but reversible, so making it equally
        // laborious would train people to type through the prompt without
        // reading it -- which is exactly when the real one gets missed.
        requireTypedConfirmation={pending === "delete" ? "DELETE" : undefined}
        onConfirm={handleRun}
        onCancel={() => setPending(null)}
      />
    </>
  );
}

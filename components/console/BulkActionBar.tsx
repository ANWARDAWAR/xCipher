"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, Send, Globe, RotateCcw, X, Loader2 } from "lucide-react";
import {
  bulkArchive,
  bulkRestore,
  bulkPublish,
  bulkSubmit,
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

type BulkKind = "archive" | "restore" | "publish" | "submit";

interface BulkActionBarProps {
  selectedIds: string[];
  onClear: () => void;
  canArchive: boolean;
  canPublish: boolean;
  canSubmit: boolean;
}

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
}: BulkActionBarProps) {
  const router = useRouter();
  const [pending, setPending] = useState<BulkKind | null>(null);
  const [running, setRunning] = useState(false);

  if (selectedIds.length === 0) return null;

  const n = selectedIds.length;

  const available: BulkKind[] = [
    ...(canSubmit ? (["submit"] as BulkKind[]) : []),
    ...(canPublish ? (["publish"] as BulkKind[]) : []),
    ...(canArchive ? (["archive", "restore"] as BulkKind[]) : []),
  ];

  const handleRun = async () => {
    if (!pending) return;
    const action = ACTIONS[pending];
    setRunning(true);
    try {
      const res = await action.run(selectedIds);

      if (!res.ok) {
        showToast(`Error: ${res.message}`);
        return;
      }

      const { succeeded, failed, outcomes } = res.data!;

      if (failed === 0) {
        showToast(`${succeeded} article${succeeded === 1 ? "" : "s"} updated.`);
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
          `${succeeded} updated, ${failed} skipped: ${skipped}${more}.`
        );
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
  };

  return (
    <>
      <div
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-2xl"
        role="region"
        aria-label="Bulk actions for selected articles"
      >
        <div className="flex items-center gap-3 flex-wrap px-4 py-3 bg-ink text-surface rounded-lg shadow-lg">
          <span
            className="text-sm font-semibold whitespace-nowrap"
            aria-live="polite"
          >
            {n} selected
          </span>

          <div className="h-4 w-px bg-current opacity-25" aria-hidden="true" />

          <div className="flex items-center gap-1 flex-wrap flex-1">
            {available.map((kind) => {
              const { label, icon: Icon } = ACTIONS[kind];
              return (
                <button
                  key={kind}
                  type="button"
                  onClick={() => setPending(kind)}
                  disabled={running}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-md hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  {running && pending === kind ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                  {label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={onClear}
            disabled={running}
            className="p-1.5 rounded-md hover:bg-white/10 transition-colors disabled:opacity-50"
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
        onConfirm={handleRun}
        onCancel={() => setPending(null)}
      />
    </>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { restoreRevision } from "@/app/actions/article";
import { showToast } from "@/lib/utils";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

// ─────────────────────────────────────────────────────────────────────────────
// Restore control for a single revision in the article timeline.
//
// Confirmation is required because restoring silently replaces the live draft
// body. The dialog says what will happen rather than asking a bare "are you
// sure": specifically that the current version is kept, because a user who
// believes restore is destructive will not use it.
// ─────────────────────────────────────────────────────────────────────────────

interface RestoreRevisionButtonProps {
  revisionId: string;
  savedAt: string;
  actorName: string;
}

export default function RestoreRevisionButton({
  revisionId,
  savedAt,
  actorName,
}: RestoreRevisionButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      const res = await restoreRevision(revisionId);
      if (res.success) {
        showToast("Version restored. The current draft now matches this revision.");
        setIsOpen(false);
        // Refresh rather than optimistically patching: the restore appends a
        // new timeline entry, and the server is the only thing that knows its id
        // and timestamp.
        router.refresh();
      } else {
        showToast(`Error: ${res.error || "Failed to restore revision"}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to restore revision";
      showToast(`Error: ${msg}`);
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-muted hover:text-ink transition-colors"
        aria-label={`Restore the version saved on ${savedAt} by ${actorName}`}
      >
        <RotateCcw className="w-3 h-3" aria-hidden="true" />
        Restore this version
      </button>

      <ConfirmDialog
        isOpen={isOpen}
        title="Restore this version?"
        description={`The draft will be replaced with the version ${actorName} saved on ${savedAt}. The current version is kept in the history, so you can undo this by restoring it in turn.`}
        confirmText={isRestoring ? "Restoring…" : "Restore version"}
        cancelText="Cancel"
        onConfirm={handleRestore}
        onCancel={() => setIsOpen(false)}
      />
    </>
  );
}

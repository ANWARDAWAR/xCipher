"use client";

import { useState, useTransition } from "react";
import { archiveArticle, deleteArticlePermanently, deleteOwnDraft } from "@/app/actions/workflow";
import { showToast } from "@/lib/utils";
import { useRouter } from "next/navigation";
import ConfirmDialog from "../ui/ConfirmDialog";

interface Props {
  id: string;
  title: string;
  status: string;
  canArchive: boolean;
  canDeletePermanently: boolean;
  canDeleteOwnDraft: boolean;
}

export default function ArticleActionMenu({ id, title, status, canArchive, canDeletePermanently, canDeleteOwnDraft }: Props) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirm, setShowConfirm] = useState<"archive" | "delete" | "draftDelete" | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  // Keeps the row disabled until the refreshed server tree commits, rather than
  // re-enabling as soon as the action resolves and briefly offering actions
  // against a status that has already changed.
  const [isRefreshing, startRefresh] = useTransition();
  const busy = isProcessing || isRefreshing;

  const handleAction = async (action: "archive" | "delete" | "draftDelete") => {
    // The dialog stays open through the pending state (its isPending disables
    // both buttons) and closes only once the result is known: for a permanent
    // delete the user must never watch the row vanish before the database
    // confirmed it, and must never be able to fire the mutation twice.
    setIsProcessing(true);
    try {
      let result;
      if (action === "archive") result = await archiveArticle(id);
      else if (action === "delete") result = await deleteArticlePermanently(id);
      else if (action === "draftDelete") result = await deleteOwnDraft(id);
      
      if (result?.ok) {
        // Action-specific copy, not a generic "done": an author who archived
        // should hear where the article went, not that something succeeded.
        if (action === "archive") showToast("Article archived. It no longer appears publicly.");
        else if (action === "delete") showToast("Article permanently deleted.");
        else showToast("Draft deleted.");
        startRefresh(() => router.refresh());
      } else {
        showToast("Error: " + (result?.message || "The action did not complete — nothing was changed."));
      }
    } catch (err: any) {
      showToast("Error: The action did not complete — nothing was changed.");
      console.error(err);
    } finally {
      setIsProcessing(false);
      setShowConfirm(null);
      setMenuOpen(false);
    }
  };

  const showArchive = canArchive && status !== "ARCHIVED";
  const showDeletePerm = canDeletePermanently && status === "ARCHIVED";
  const showDeleteDraft = canDeleteOwnDraft && status === "DRAFT";

  if (!showArchive && !showDeletePerm && !showDeleteDraft) return null;

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setMenuOpen(!menuOpen)}
        disabled={busy}
        className="act"
        title="More actions"
      >
        {busy ? "..." : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="1" />
            <circle cx="12" cy="5" r="1" />
            <circle cx="12" cy="19" r="1" />
          </svg>
        )}
      </button>

      {menuOpen && (
        <>
          <div 
            style={{ position: "fixed", inset: 0, zIndex: 90 }} 
            onClick={() => setMenuOpen(false)}
          />
          <div style={{
            position: "absolute",
            right: 0,
            top: "100%",
            marginTop: "4px",
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "var(--r-md)",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            zIndex: 100,
            minWidth: "150px",
            padding: "4px",
            display: "flex",
            flexDirection: "column",
            gap: "2px"
          }}>
            {showArchive && (
              <button 
                onClick={() => setShowConfirm("archive")}
                style={{ textAlign: "left", padding: "8px 12px", background: "none", border: "none", fontSize: "13px", cursor: "pointer", borderRadius: "4px" }}
                className="hover-bg-surface-2"
              >
                Archive
              </button>
            )}
            {showDeleteDraft && (
              <button 
                onClick={() => setShowConfirm("draftDelete")}
                style={{ textAlign: "left", padding: "8px 12px", background: "none", border: "none", fontSize: "13px", cursor: "pointer", color: "var(--error)", borderRadius: "4px" }}
                className="hover-bg-surface-2"
              >
                Delete Draft
              </button>
            )}
            {showDeletePerm && (
              <button 
                onClick={() => setShowConfirm("delete")}
                style={{ textAlign: "left", padding: "8px 12px", background: "none", border: "none", fontSize: "13px", cursor: "pointer", color: "var(--error)", borderRadius: "4px" }}
                className="hover-bg-surface-2"
              >
                Delete Permanently
              </button>
            )}
          </div>
        </>
      )}

      <ConfirmDialog
        isOpen={showConfirm === "archive"}
        title="Archive Article"
        description={`Are you sure you want to archive "${title}"? It will no longer be visible to the public.`}
        confirmText="Archive"
        isDestructive={true}
        isPending={busy}
        pendingText="Archiving…"
        onConfirm={() => handleAction("archive")}
        onCancel={() => setShowConfirm(null)}
      />

      <ConfirmDialog
        isOpen={showConfirm === "delete"}
        title="Delete Permanently"
        description={`Are you sure you want to permanently delete "${title}"? This action cannot be undone.`}
        confirmText="Delete"
        isDestructive={true}
        requireTypedConfirmation="DELETE"
        isPending={busy}
        pendingText="Deleting…"
        onConfirm={() => handleAction("delete")}
        onCancel={() => setShowConfirm(null)}
      />

      <ConfirmDialog
        isOpen={showConfirm === "draftDelete"}
        title="Delete Draft"
        description={`Are you sure you want to delete your draft "${title}"?`}
        confirmText="Delete Draft"
        isDestructive={true}
        isPending={busy}
        pendingText="Deleting…"
        onConfirm={() => handleAction("draftDelete")}
        onCancel={() => setShowConfirm(null)}
      />
    </div>
  );
}

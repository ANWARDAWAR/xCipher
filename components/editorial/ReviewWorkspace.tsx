"use client";

import React, { useState } from "react";
import { Role } from "@prisma/client";

import { claimReview, releaseReview, takeOverReview } from "@/app/actions/workflow";
import { showToast } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface Revision {
  id: string;
  notes: string | null;
  statusChange: string | null;
  createdAt: string | Date;
  user?: { name: string | null; email: string | null };
}

interface ReviewWorkspaceProps {
  userRole: string;
  userId: string;
  reviewerId: string | null;
  articleId: string;
  currentStatus: string;
  revisions?: Revision[];
  onDecision: (status: string, notes: string) => Promise<void>;
}

export default function ReviewWorkspace({ userRole, userId, reviewerId, articleId, currentStatus, revisions = [], onDecision }: ReviewWorkspaceProps) {
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const canReview = ["OWNER", "ADMIN", "EDITOR", "REVIEWER"].includes(userRole);

  const handleAction = async (status: string) => {
    if ((status === "REVISION_REQUESTED" || status === "REJECTED") && notes.trim().length < 20) {
      alert("Please provide at least 20 characters of notes explaining the decision.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onDecision(status, notes);
      setNotes("");
    } catch (e) {
      console.error(e);
      alert("Failed to submit decision.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWorkflowAction = async (actionFn: (id: string) => Promise<any>, successMsg: string) => {
    setIsSubmitting(true);
    try {
      const res = await actionFn(articleId);
      if (res.ok) {
        showToast(successMsg);
        router.refresh();
      } else {
        alert(res.message || "Action failed.");
      }
    } catch (e) {
      console.error(e);
      alert("An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isClaimedByMe = reviewerId === userId;
  const isClaimedByOther = reviewerId && reviewerId !== userId;
  const canTakeOver = ["OWNER", "ADMIN"].includes(userRole);
  
  const disableDecisions = Boolean(isSubmitting || (isClaimedByOther && !canTakeOver));

  return (
    <div className="cs-card" style={{ padding: "16px", marginBottom: "20px" }}>
      <h3 style={{ marginTop: 0, marginBottom: "16px", fontSize: "16px" }}>Review Workspace</h3>
      
      {/* Activity Timeline */}
      <div style={{ marginBottom: "20px", maxHeight: "250px", overflowY: "auto", paddingRight: "8px" }}>
        <h4 style={{ fontSize: "12px", textTransform: "uppercase", color: "var(--muted)", letterSpacing: "0.5px" }}>Activity Timeline</h4>
        {revisions.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "12px" }}>
            {revisions.map((rev) => (
              <div key={rev.id} style={{ fontSize: "13px", paddingLeft: "12px", borderLeft: "2px solid var(--line)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--ink-muted)", marginBottom: "4px" }}>
                  <strong>{rev.user?.name || rev.user?.email || "Unknown User"}</strong>
                  <span style={{ fontSize: "11px" }}>{new Date(rev.createdAt).toLocaleString()}</span>
                </div>
                {rev.statusChange && (
                  <div style={{ 
                    display: "inline-block", 
                    padding: "2px 6px", 
                    borderRadius: "4px", 
                    background: "var(--surface-2)", 
                    fontSize: "11px",
                    fontWeight: 600,
                    marginBottom: "4px" 
                  }}>
                    &rarr; {rev.statusChange.replace("_", " ")}
                  </div>
                )}
                {rev.notes && (
                  <div style={{ background: "var(--surface-1)", padding: "8px", borderRadius: "6px", fontStyle: "italic" }}>
                    {rev.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: "13px", color: "var(--ink-muted)", fontStyle: "italic", marginTop: "12px" }}>No revision history.</p>
        )}
      </div>

      {canReview && currentStatus === "SUBMITTED" && !reviewerId && (
        <div style={{ borderTop: "1px solid var(--line)", paddingTop: "16px", marginBottom: "16px" }}>
          <div style={{ padding: "12px", background: "var(--surface-1)", borderRadius: "6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px" }}>This article is waiting for review.</span>
            <button className="btn-cs primary" onClick={() => handleWorkflowAction(claimReview, "Review claimed")} disabled={isSubmitting}>
              Claim Review
            </button>
          </div>
        </div>
      )}

      {canReview && isClaimedByMe && currentStatus !== "PUBLISHED" && (
        <div style={{ borderTop: "1px solid var(--line)", paddingTop: "16px", marginBottom: "16px" }}>
          <div style={{ padding: "12px", background: "rgba(16, 185, 129, 0.1)", color: "var(--success)", borderRadius: "6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", fontWeight: 600 }}>You have claimed this review.</span>
            <button className="btn-cs" onClick={() => handleWorkflowAction(releaseReview, "Review released")} disabled={isSubmitting}>
              Release Review
            </button>
          </div>
        </div>
      )}

      {canReview && isClaimedByOther && currentStatus !== "PUBLISHED" && (
        <div style={{ borderTop: "1px solid var(--line)", paddingTop: "16px", marginBottom: "16px" }}>
          <div style={{ padding: "12px", background: "var(--surface-1)", borderRadius: "6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "var(--ink-muted)" }}>This review is claimed by another user.</span>
            {canTakeOver && (
              <button className="btn-cs danger" onClick={() => handleWorkflowAction(takeOverReview, "Review taken over")} disabled={isSubmitting}>
                Take Over Review
              </button>
            )}
          </div>
        </div>
      )}

      {canReview && currentStatus !== "PUBLISHED" && (
        <div style={{ borderTop: "1px solid var(--line)", paddingTop: "16px" }}>
          <h4 style={{ fontSize: "12px", textTransform: "uppercase", color: "var(--muted)", letterSpacing: "0.5px", marginBottom: "8px" }}>Editorial Decision</h4>
          <textarea
            className="ed-input"
            rows={3}
            placeholder="Add review notes (min 20 chars for revision/rejection)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ width: "100%", resize: "vertical", marginBottom: "4px" }}
          />
          <div style={{ fontSize: "11px", color: notes.length < 20 ? "var(--warning)" : "var(--success)", marginBottom: "12px", textAlign: "right" }}>
            {notes.length} / 20 min chars
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button 
              className="btn-cs" 
              onClick={() => handleAction("PUBLISHED")} 
              disabled={disableDecisions}
              style={{ background: disableDecisions ? "var(--surface-2)" : "var(--success)", color: disableDecisions ? "var(--muted)" : "white", borderColor: disableDecisions ? "var(--line)" : "var(--success)" }}
            >
              Approve & Publish
            </button>
            <button 
              className="btn-cs" 
              onClick={() => handleAction("REVISION_REQUESTED")} 
              disabled={disableDecisions}
            >
              Request Revision
            </button>
            <button 
              className="btn-cs" 
              onClick={() => handleAction("REJECTED")} 
              disabled={disableDecisions}
              style={{ color: disableDecisions ? "var(--muted)" : "var(--error)" }}
            >
              Reject
            </button>
          </div>
        </div>
      )}
      
      {!canReview && (currentStatus === "REVISION_REQUESTED" || currentStatus === "REJECTED") && (
        <div style={{ borderTop: "1px solid var(--line)", paddingTop: "16px" }}>
          <div style={{ padding: "12px", background: currentStatus === "REJECTED" ? "rgba(239, 68, 68, 0.1)" : "rgba(245, 158, 11, 0.1)", color: currentStatus === "REJECTED" ? "var(--error)" : "var(--warning)", borderRadius: "6px", fontSize: "13px" }}>
            <strong>{currentStatus === "REJECTED" ? "Article Rejected:" : "Action Required:"}</strong> {currentStatus === "REJECTED" ? "This article has been rejected and cannot be published." : "Please address the editorial notes above and resubmit your draft."}
          </div>
        </div>
      )}
    </div>
  );
}

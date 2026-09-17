"use client";

import React, { useState } from "react";
import { Role } from "@prisma/client";

interface Revision {
  id: string;
  notes: string | null;
  statusChange: string | null;
  createdAt: string | Date;
  user?: { name: string | null; email: string };
}

interface ReviewWorkspaceProps {
  userRole: string;
  articleId: string;
  currentStatus: string;
  revisions?: Revision[];
  onDecision: (status: string, notes: string) => Promise<void>;
}

export default function ReviewWorkspace({ userRole, articleId, currentStatus, revisions = [], onDecision }: ReviewWorkspaceProps) {
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canReview = ["OWNER", "ADMIN", "EDITOR", "REVIEWER"].includes(userRole);

  const handleAction = async (status: string) => {
    if (!notes.trim() && status === "REVISION_REQUESTED") {
      alert("Please provide notes when requesting a revision.");
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

      {canReview && currentStatus !== "PUBLISHED" && (
        <div style={{ borderTop: "1px solid var(--line)", paddingTop: "16px" }}>
          <h4 style={{ fontSize: "12px", textTransform: "uppercase", color: "var(--muted)", letterSpacing: "0.5px", marginBottom: "8px" }}>Editorial Decision</h4>
          <textarea
            className="ed-input"
            rows={3}
            placeholder="Add review notes (required for requesting revisions)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ width: "100%", resize: "vertical", marginBottom: "12px" }}
          />
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button 
              className="btn-cs" 
              onClick={() => handleAction("PUBLISHED")} 
              disabled={isSubmitting}
              style={{ background: "var(--success)", color: "white", borderColor: "var(--success)" }}
            >
              Approve & Publish
            </button>
            <button 
              className="btn-cs" 
              onClick={() => handleAction("REVISION_REQUESTED")} 
              disabled={isSubmitting}
            >
              Request Revision
            </button>
            <button 
              className="btn-cs" 
              onClick={() => handleAction("REJECTED")} 
              disabled={isSubmitting}
              style={{ color: "var(--error)" }}
            >
              Reject
            </button>
          </div>
        </div>
      )}
      
      {!canReview && currentStatus === "REVISION_REQUESTED" && (
        <div style={{ borderTop: "1px solid var(--line)", paddingTop: "16px" }}>
          <div style={{ padding: "12px", background: "rgba(245, 158, 11, 0.1)", color: "var(--warning)", borderRadius: "6px", fontSize: "13px" }}>
            <strong>Action Required:</strong> Please address the editorial notes above and resubmit your draft.
          </div>
        </div>
      )}
    </div>
  );
}

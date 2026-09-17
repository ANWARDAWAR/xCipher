"use client";

import { useState, useTransition } from "react";
import { moderateComment } from "@/app/actions/comments";
import { showToast } from "@/lib/utils";

interface Comment {
  id: string;
  articleSlug: string;
  displayName: string;
  body: string;
  status: string;
  ipHash: string | null;
  createdAt: string;
  moderatorNote: string | null;
  moderator: { name: string | null } | null;
}

export default function CommentModerationRow({ comment, onUpdate }: { comment: Comment; onUpdate: (id: string, newStatus: string) => void }) {
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);

  const act = (action: "APPROVED" | "REJECTED" | "SPAM") => {
    startTransition(async () => {
      const res = await moderateComment(comment.id, action, note);
      if (res.success) {
        onUpdate(comment.id, action);
        showToast(`Comment ${action.toLowerCase()}.`);
      } else {
        showToast(res.error || "Failed to update comment.");
      }
    });
  };

  const actionColor = {
    PENDING: "var(--ink-muted)",
    APPROVED: "var(--success, #22c55e)",
    REJECTED: "var(--error, #e53e3e)",
    SPAM: "#f97316",
  }[comment.status] || "var(--ink-muted)";

  return (
    <div style={{
      padding: "16px",
      background: "var(--paper)",
      border: "1px solid var(--line)",
      borderRadius: "var(--r-md)",
      marginBottom: "12px",
    }}>
      <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", flexWrap: "wrap" }}>
        {/* Meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "6px", flexWrap: "wrap" }}>
            <strong style={{ fontSize: "14px" }}>{comment.displayName}</strong>
            <span style={{ fontSize: "12px", color: "var(--ink-muted)" }}>
              on <a href={`/article/${comment.articleSlug}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>/{comment.articleSlug}</a>
            </span>
            <span style={{ fontSize: "11px", color: "var(--ink-muted)", marginLeft: "auto" }}>
              {new Date(comment.createdAt).toLocaleString()}
            </span>
            <span style={{ fontSize: "11px", fontWeight: 700, color: actionColor, textTransform: "uppercase" }}>
              {comment.status}
            </span>
          </div>
          <p style={{ fontSize: "14px", lineHeight: 1.6, margin: 0, wordBreak: "break-word" }}>
            {expanded || comment.body.length <= 200 ? comment.body : `${comment.body.slice(0, 200)}…`}
            {comment.body.length > 200 && (
              <button onClick={() => setExpanded(!expanded)} style={{ marginLeft: "8px", color: "var(--accent)", fontSize: "12px", background: "none", border: "none", cursor: "pointer" }}>
                {expanded ? "Show less" : "Read more"}
              </button>
            )}
          </p>
          {comment.moderatorNote && (
            <p style={{ fontSize: "12px", color: "var(--ink-muted)", marginTop: "6px", fontStyle: "italic" }}>
              Moderator note: {comment.moderatorNote}
            </p>
          )}
        </div>

        {/* Actions */}
        {comment.status === "PENDING" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", flexShrink: 0 }}>
            <input
              type="text"
              placeholder="Optional note…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              disabled={isPending}
              style={{ padding: "5px 8px", fontSize: "12px", borderRadius: "4px", border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)", width: "180px" }}
            />
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                onClick={() => act("APPROVED")}
                disabled={isPending}
                style={{ flex: 1, padding: "6px 10px", fontSize: "12px", fontWeight: 600, borderRadius: "4px", border: "none", cursor: "pointer", background: "var(--success, #22c55e)", color: "#fff" }}
                aria-label="Approve comment"
              >Approve</button>
              <button
                onClick={() => act("REJECTED")}
                disabled={isPending}
                style={{ flex: 1, padding: "6px 10px", fontSize: "12px", fontWeight: 600, borderRadius: "4px", border: "none", cursor: "pointer", background: "var(--error, #e53e3e)", color: "#fff" }}
                aria-label="Reject comment"
              >Reject</button>
              <button
                onClick={() => act("SPAM")}
                disabled={isPending}
                style={{ padding: "6px 10px", fontSize: "12px", fontWeight: 600, borderRadius: "4px", border: "1px solid #f97316", cursor: "pointer", background: "transparent", color: "#f97316" }}
                aria-label="Mark as spam"
              >Spam</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

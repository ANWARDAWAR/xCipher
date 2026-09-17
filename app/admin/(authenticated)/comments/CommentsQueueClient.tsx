"use client";

import { useState } from "react";
import CommentModerationRow from "./CommentModerationRow";

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

export default function CommentsQueueClient({ initialComments }: { initialComments: Comment[] }) {
  const [comments, setComments] = useState(initialComments);

  const handleUpdate = (id: string, newStatus: string) => {
    setComments((prev) => prev.map((c) => c.id === id ? { ...c, status: newStatus } : c));
  };

  const pending = comments.filter((c) => c.status === "PENDING");
  const others = comments.filter((c) => c.status !== "PENDING");

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "12px" }}>
          Pending ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p style={{ color: "var(--ink-muted)", fontSize: "14px", padding: "24px 0" }}>
            🎉 Moderation queue is clear — no pending comments.
          </p>
        ) : (
          pending.map((c) => (
            <CommentModerationRow key={c.id} comment={c} onUpdate={handleUpdate} />
          ))
        )}
      </div>

      {others.length > 0 && (
        <div>
          <h2 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "12px" }}>
            Spam / Rejected ({others.length})
          </h2>
          {others.map((c) => (
            <CommentModerationRow key={c.id} comment={c} onUpdate={handleUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { moderateComment } from "@/app/actions/comments";
import { showToast } from "@/lib/utils";
import { Check, AlertOctagon, Trash2, ChevronDown, ChevronUp } from "lucide-react";

interface Comment {
  id: string;
  articleSlug: string;
  displayName: string;
  email: string | null;
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Approved</span>;
      case "PENDING":
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">Pending</span>;
      case "SPAM":
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted/10 text-muted border border-muted/25">Spam</span>;
      case "REJECTED":
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-bad/10 text-bad border border-bad/20">Trash</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-surface-2 text-muted border border-line">Unknown</span>;
    }
  };

  return (
    <tr className="hover:bg-paper/80 dark:hover:bg-surface/5 transition-colors group">
      {/* Commenter (20%) */}
      <td className="py-4 px-4 align-top w-[20%]">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-ink truncate">{comment.displayName}</span>
          <span className="text-xs text-muted truncate mt-0.5">{comment.email || "No email"}</span>
          <span className="inline-block mt-1">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-surface-2 text-ink-2">
              IP: {comment.ipHash ? comment.ipHash.slice(0, 8) : "Unknown"}
            </span>
          </span>
        </div>
      </td>

      {/* Content (45%) */}
      <td className="py-4 px-4 align-top w-[45%]">
        <div className="text-sm text-ink-2 break-words mb-1 leading-relaxed">
          {expanded || comment.body.length <= 150 ? comment.body : `${comment.body.slice(0, 150)}...`}
          {comment.body.length > 150 && (
            <button 
              onClick={() => setExpanded(!expanded)} 
              className="ml-2 inline-flex items-center gap-0.5 text-xs font-medium text-accent hover:underline focus:outline-none"
            >
              {expanded ? <>Show less <ChevronUp className="w-3 h-3" /></> : <>Read more <ChevronDown className="w-3 h-3" /></>}
            </button>
          )}
        </div>
        <div className="text-xs text-muted">
          on <a href={`/article/${comment.articleSlug}`} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline font-medium">/{comment.articleSlug}</a>
        </div>
        {comment.moderatorNote && (
          <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-500/20 rounded-md">
            <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1">
              Note from {comment.moderator?.name || "Moderator"}:
            </p>
            <p className="text-xs text-amber-900 dark:text-amber-200 mt-0.5">{comment.moderatorNote}</p>
          </div>
        )}
      </td>

      {/* Date & Time (15%) */}
      <td className="py-4 px-4 align-top w-[15%]">
        <div className="text-sm text-ink">
          {new Date(comment.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </div>
        <div className="text-xs text-muted mt-0.5">
          {new Date(comment.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
        </div>
      </td>

      {/* Status (10%) */}
      <td className="py-4 px-4 align-top w-[10%]">
        {getStatusBadge(comment.status)}
      </td>

      {/* Actions (10%) */}
      <td className="py-4 px-4 align-top text-right w-[10%]">
        <div className="flex items-center justify-end gap-1 relative">
          {comment.status === "PENDING" ? (
            <div className="flex flex-col items-end gap-2 relative group/actions">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => act("APPROVED")}
                  disabled={isPending}
                  className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10 disabled:opacity-50 transition-colors"
                  aria-label="Approve"
                  title="Approve"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => act("SPAM")}
                  disabled={isPending}
                  className="p-1.5 rounded-md text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-500/10 disabled:opacity-50 transition-colors"
                  aria-label="Mark as Spam"
                  title="Mark as Spam"
                >
                  <AlertOctagon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => act("REJECTED")}
                  disabled={isPending}
                  className="p-1.5 rounded-md text-bad hover:bg-bad/10 disabled:opacity-50 transition-colors"
                  aria-label="Delete"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <input
                type="text"
                placeholder="Add note..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={200}
                className="opacity-0 group-hover/actions:opacity-100 focus:opacity-100 absolute top-full right-0 mt-1 w-32 p-1.5 text-xs bg-surface border border-line rounded shadow-sm z-10 transition-opacity focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent text-ink"
              />
            </div>
          ) : (
            <div className="flex items-center gap-1">
              {/* Allow changing status back if needed, or just delete if not already rejected */}
              {comment.status !== "REJECTED" && (
                <button
                  onClick={() => act("REJECTED")}
                  disabled={isPending}
                  className="p-1.5 rounded-md text-faint hover:text-bad hover:bg-bad/10 disabled:opacity-50 transition-colors"
                  aria-label="Move to Trash"
                  title="Move to Trash"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

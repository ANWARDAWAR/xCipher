"use client";

import { useState, useEffect, useTransition } from "react";
import { getComments, postComment, type PublicComment } from "@/app/actions/comments";

interface CommentsSectionProps {
  articleSlug: string;
}

export default function CommentsSection({ articleSlug }: CommentsSectionProps) {
  const [comments, setComments] = useState<PublicComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [text, setText] = useState("");
  const [submitResult, setSubmitResult] = useState<{ success?: boolean; error?: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getComments(articleSlug).then((data) => {
      setComments(data);
      setIsLoading(false);
    });
  }, [articleSlug]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitResult(null);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("comment", text);

    startTransition(async () => {
      const res = await postComment(articleSlug, formData);
      setSubmitResult(res);
      if (res.success) {
        setName("");
        setEmail("");
        setText("");
      }
    });
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  };

  return (
    <section id="comments" className="comments scroll-mt-28" aria-labelledby="cmtH">
      <h2 id="cmtH">Discussion ({isLoading ? "…" : comments.length})</h2>

      <div id="cmtList" role="list" aria-live="polite" aria-busy={isLoading}>
        {isLoading ? (
          <p style={{ color: "var(--ink-muted)", fontSize: "14px" }}>Loading discussion…</p>
        ) : comments.length === 0 ? (
          <p style={{ color: "var(--ink-muted)", fontSize: "14px" }}>
            No comments yet — be the first to join the discussion.
          </p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="cmt" role="listitem">
              {/* Gravatar via email hash */}
              <img
                src={`https://www.gravatar.com/avatar/${c.emailHash}?d=mp&s=48`}
                alt=""
                className="ava lg"
                style={{ fontSize: "16px", borderRadius: "50%" }}
                aria-hidden="true"
              />
              <div className="cmt-body">
                <div className="cmt-head">
                  <b>{c.displayName}</b>
                  <time dateTime={c.createdAt}>{formatDate(c.createdAt)}</time>
                </div>
                <p>{c.body}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pending state notification */}
      {submitResult?.success && (
        <div
          role="status"
          aria-live="polite"
          style={{
            padding: "12px 16px",
            marginBottom: "20px",
            background: "var(--surface-2)",
            borderRadius: "var(--r-md)",
            border: "1px solid var(--line)",
            fontSize: "14px",
            color: "var(--ink)",
          }}
        >
          <strong>Your comment is awaiting moderation.</strong> It will appear here once approved.
        </div>
      )}

      <form className="cmt-form" id="cmtForm" onSubmit={handleSubmit} noValidate>
        <div className="cf-row">
          <div>
            <label className="f-label" htmlFor="cmtName">Name <span aria-hidden="true">*</span></label>
            <input
              className="f-input"
              id="cmtName"
              required
              maxLength={60}
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
              autoComplete="name"
            />
          </div>
          <div>
            <label className="f-label" htmlFor="cmtEmail">
              Email <span style={{ textTransform: "none", letterSpacing: 0 }}>(not published)</span>
              <span aria-hidden="true"> *</span>
            </label>
            <input
              className="f-input"
              id="cmtEmail"
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isPending}
              autoComplete="email"
            />
          </div>
        </div>
        <div>
          <label className="f-label" htmlFor="cmtText">Comment <span aria-hidden="true">*</span></label>
          <textarea
            className="f-input"
            id="cmtText"
            required
            minLength={10}
            maxLength={1200}
            placeholder="Join the discussion — be specific, be kind."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isPending}
          />
          <span style={{ fontSize: "11px", color: "var(--ink-muted)" }}>{text.length}/1200</span>
        </div>

        {submitResult?.error && (
          <div
            role="alert"
            aria-live="assertive"
            style={{
              color: "var(--error, #e53e3e)",
              fontSize: "13px",
              padding: "8px 12px",
              background: "rgba(229,62,62,0.08)",
              borderRadius: "var(--r-sm)",
            }}
          >
            {submitResult.error}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
          <button className="btn btn-solid" type="submit" disabled={isPending}>
            {isPending ? "Posting…" : "Post Comment"}
          </button>
          <span style={{ fontSize: "12px", color: "var(--ink-muted)" }}>
            All comments are moderated before publication.
          </span>
        </div>
      </form>
    </section>
  );
}

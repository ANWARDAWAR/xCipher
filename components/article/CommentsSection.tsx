"use client";

import { useState, useEffect, useTransition } from "react";
import { getComments, postComment } from "@/app/actions/comments";

export default function CommentsSection({ articleSlug = "default-slug" }: { articleSlug?: string }) {
  const [comments, setComments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getComments(articleSlug).then(data => {
      setComments(data);
      setIsLoading(false);
    });
  }, [articleSlug]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !text.trim()) return;

    const formData = new FormData();
    formData.append("comment", text);

    startTransition(async () => {
      const res = await postComment(articleSlug, formData);
      if (res.success && res.comment) {
        // Map backend returned comment to the frontend format for now
        const formattedComment = {
          id: res.comment.id,
          n: res.comment.author || name.trim(),
          t: res.comment.date,
          x: res.comment.content,
          pending: true,
          likes: 0
        };
        setComments([formattedComment, ...comments]);
        setName("");
        setEmail("");
        setText("");
      }
    });
  };

  return (
    <section className="comments" aria-labelledby="cmtH">
      <h2 id="cmtH">Discussion ({comments.length})</h2>
      
      <div id="cmtList">
        {isLoading ? (
          <p>Loading comments...</p>
        ) : comments.map((c) => (
          <div key={c.id} className="cmt">
            <div className="ava lg" style={{ fontSize: "16px" }}>{(c.n || c.author || "U").charAt(0)}</div>
            <div className="cmt-body">
              <div className="cmt-head">
                <b>{c.n || c.author}</b>
                {c.pending && <span className="badge ghost">Pending review</span>}
                <time>{c.t || c.date}</time>
              </div>
              <p>{c.x || c.content}</p>
              <div className="cmt-acts">
                <button data-like>
                  <svg className="ic-s" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M7 10v11M7 10l4-7a2.4 2.4 0 0 1 2.3 3l-.8 3H19a2 2 0 0 1 2 2.4l-1.4 7A2 2 0 0 1 17.6 21H7" />
                  </svg>
                  <span>{c.likes || 0}</span> Helpful
                </button>
                <button data-reply>Reply</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <form className="cmt-form" id="cmtForm" onSubmit={handleSubmit}>
        <div className="cf-row">
          <div>
            <label className="f-label" htmlFor="cmtName">Name</label>
            <input 
              className="f-input" 
              id="cmtName" 
              required 
              maxLength={60} 
              placeholder="Your name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
            />
          </div>
          <div>
            <label className="f-label" htmlFor="cmtEmail">
              Email <span style={{ textTransform: "none", letterSpacing: 0 }}>(not published)</span>
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
            />
          </div>
        </div>
        <div>
          <label className="f-label" htmlFor="cmtText">Comment</label>
          <textarea 
            className="f-input" 
            id="cmtText" 
            required 
            maxLength={1200} 
            placeholder="Join the discussion — be specific, be kind."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isPending}
          ></textarea>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
          <button className="btn btn-solid" type="submit" disabled={isPending}>
            {isPending ? "Posting..." : "Post Comment"}
          </button>
          <span className="muted" style={{ fontSize: "12px" }}>Demo interface — comments are now submitted via Server Actions.</span>
        </div>
      </form>
    </section>
  );
}

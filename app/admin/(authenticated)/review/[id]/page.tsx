import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { canViewReviewQueue } from "@/lib/permissions";
import { Role } from "@prisma/client";
import ReviewWorkspace from "@/components/editorial/ReviewWorkspace";
import Link from "next/link";
import Image from "next/image";
import ArticleBody from "@/components/article/ArticleBody";

interface ReviewScreenProps {
  params: Promise<{ id: string }>;
}

export default async function ReviewScreen({ params }: ReviewScreenProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  const userRole = (dbUser?.role || user.role || "AUTHOR").toUpperCase() as Role;

  if (!canViewReviewQueue(userRole)) {
    redirect("/admin");
  }

  const article = await db.article.findUnique({
    where: { id },
    include: {
      category: true,
      authorModel: true,
      tags: true,
      revisions: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, email: true } } }
      }
    }
  });

  if (!article) notFound();

  // Server-computed pre-flight checklist
  const hasTitle = Boolean(article.title?.trim());
  const hasDeck = Boolean(article.deck?.trim());
  const hasContent = Boolean(article.contentHtml?.trim());
  const wordCount = article.contentHtml ? article.contentHtml.replace(/<[^>]*>?/gm, '').split(/\s+/).length : 0;
  const hasImage = Boolean(article.img);
  const isSufficientLength = wordCount >= 300; // arbitrary checklist criteria
  
  const authorName = article.authorModel?.name || article.author || "Unknown";

  return (
    <div style={{ height: "calc(100vh - 64px)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--line)", background: "var(--surface)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: "12px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
            <Link href="/admin/review" style={{ color: "var(--accent)", textDecoration: "none" }}>← Review Queue</Link>
            <span style={{ margin: "0 8px" }}>/</span>
            {article.status.replace("_", " ")}
          </div>
          <h1 style={{ fontSize: "20px", fontWeight: 700, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "600px" }}>
            {article.title || "Untitled"}
          </h1>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <span style={{ fontSize: "13px", color: "var(--ink-muted)" }}>
            By <strong>{authorName}</strong>
          </span>
          <span style={{ padding: "2px 8px", background: "var(--surface-2)", borderRadius: "12px", fontSize: "12px", fontWeight: 600 }}>
            ~{wordCount} words
          </span>
        </div>
      </div>

      {/* Two Pane Layout */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", flexDirection: "row" }} className="review-two-pane">
        <style dangerouslySetInnerHTML={{__html: `
          @media (max-width: 1024px) {
            .review-two-pane { flex-direction: column !important; overflow-y: auto !important; }
            .review-preview-pane { height: auto !important; overflow: visible !important; border-right: none !important; border-bottom: 1px solid var(--line); }
            .review-decision-pane { width: 100% !important; min-width: 100% !important; height: auto !important; overflow: visible !important; }
          }
        `}} />
        
        {/* Left Pane: Preview (60%) */}
        <div className="review-preview-pane" style={{ flex: 6, borderRight: "1px solid var(--line)", overflowY: "auto", padding: "24px", background: "var(--bg)" }}>
          <div style={{ maxWidth: "720px", margin: "0 auto", background: "var(--surface)", borderRadius: "var(--r-md)", padding: "32px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
            {/* Minimal Article Render */}
            <h1 style={{ fontSize: "32px", fontWeight: 800, marginBottom: "16px", lineHeight: 1.2 }}>
              {article.title}
            </h1>
            {article.deck && (
              <p style={{ fontSize: "20px", color: "var(--ink-muted)", marginBottom: "24px", lineHeight: 1.4 }}>
                {article.deck}
              </p>
            )}
            
            {article.img && (
              <div style={{ width: "100%", position: "relative", height: "400px", marginBottom: "32px", borderRadius: "8px", overflow: "hidden" }}>
                <Image src={article.img} alt={article.title} fill style={{ objectFit: "cover" }} />
              </div>
            )}
            
            <div className="story-content" style={{ fontSize: "18px", lineHeight: 1.6, color: "var(--ink)" }}>
              <ArticleBody html={article.contentHtml || "<p>No content provided.</p>"} />
            </div>
          </div>
        </div>

        {/* Right Pane: Decision (40%) */}
        <div className="review-decision-pane" style={{ flex: 4, minWidth: "350px", maxWidth: "450px", overflowY: "auto", background: "var(--surface)", padding: "24px" }}>
          
          <ReviewWorkspace 
            userRole={userRole}
            userId={user.id}
            reviewerId={article.reviewedById}
            articleId={article.id}
            currentStatus={article.status}
            revisions={article.revisions}
            onDecision={async (status, notes) => {
              "use server";
              // The ReviewWorkspace now calls workflow actions directly using handleWorkflowAction
              // but we kept onDecision for legacy compatibility. We'll just do nothing here
              // because we updated ReviewWorkspace to call claimReview etc directly.
              // Wait, ReviewWorkspace still uses onDecision for REVISION_REQUESTED and REJECTED!
              // Let's implement those here.
              const { rejectArticle, requestChanges, publishArticle } = await import("@/app/actions/workflow");
              
              if (status === "REJECTED") {
                const res = await rejectArticle(article.id, "EDITORIAL", notes);
                if (!res.ok) throw new Error(res.message);
              } else if (status === "REVISION_REQUESTED") {
                const res = await requestChanges(article.id, notes);
                if (!res.ok) throw new Error(res.message);
              } else if (status === "PUBLISHED") {
                const res = await publishArticle(article.id);
                if (!res.ok) throw new Error(res.message);
              }
            }}
          />

          <div className="cs-card" style={{ padding: "16px", marginTop: "20px" }}>
            <h3 style={{ marginTop: 0, marginBottom: "16px", fontSize: "16px" }}>Pre-flight Checklist</h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <li style={{ display: "flex", alignItems: "center", gap: "8px", color: hasTitle ? "var(--success)" : "var(--error)" }}>
                {hasTitle ? "✓" : "✗"} Title provided
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "8px", color: hasDeck ? "var(--success)" : "var(--error)" }}>
                {hasDeck ? "✓" : "✗"} Deck / description provided
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "8px", color: hasContent ? "var(--success)" : "var(--error)" }}>
                {hasContent ? "✓" : "✗"} Content provided
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "8px", color: isSufficientLength ? "var(--success)" : "var(--warning)" }}>
                {isSufficientLength ? "✓" : "!"} Word count {">="} 300 (Current: {wordCount})
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "8px", color: hasImage ? "var(--success)" : "var(--warning)" }}>
                {hasImage ? "✓" : "!"} Featured image provided
              </li>
            </ul>
          </div>
          
        </div>
      </div>
    </div>
  );
}

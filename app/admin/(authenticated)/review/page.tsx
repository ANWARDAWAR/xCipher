import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Role, Prisma } from "@prisma/client";
import { canViewReviewQueue } from "@/lib/permissions";
import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Review Queue · xCipher",
};

interface SearchParams {
  category?: string;
  author?: string;
  claim?: "me" | "unclaimed" | "other";
  resubmissions?: "true";
  sort?: "oldest" | "newest" | "author";
}

function formatAge(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export default async function ReviewQueuePage(props: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;
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

  const { category, author, claim, resubmissions, sort = "oldest" } = searchParams;

  // Build filters
  const filterConditions: Prisma.ArticleWhereInput[] = [
    { status: "SUBMITTED" }
  ];

  if (category) {
    filterConditions.push({ category: { slug: category } });
  }

  if (author) {
    filterConditions.push({ authorModel: { slug: author } });
  }

  if (claim === "me") {
    filterConditions.push({ reviewedById: user.id });
  } else if (claim === "unclaimed") {
    filterConditions.push({ reviewedById: null });
  } else if (claim === "other") {
    filterConditions.push({
      reviewedById: { not: null, notIn: [user.id] }
    });
  }

  if (resubmissions === "true") {
    // Requires revisions count > 0.
    filterConditions.push({
      revisions: { some: {} }
    });
  }

  // Build sort
  const orderBy: Prisma.ArticleOrderByWithRelationInput[] = [];
  if (sort === "newest") {
    orderBy.push({ submittedAt: "desc" });
  } else if (sort === "author") {
    orderBy.push({ authorModel: { name: "asc" } });
  } else {
    // Default to oldest
    orderBy.push({ submittedAt: "asc" });
  }

  const articles = await db.article.findMany({
    where: { AND: filterConditions },
    orderBy,
    include: {
      category: { select: { name: true } },
      authorModel: { select: { name: true, slug: true } },
      reviewer: { select: { name: true, email: true } },
      _count: { select: { revisions: true } }
    },
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 4px 0" }}>Review Queue</h1>
          <p style={{ color: "var(--muted)", margin: 0, fontSize: "14px" }}>
            Articles awaiting editorial decision.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap", fontSize: "13px" }}>
        {/* Filters */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={{ color: "var(--muted)" }}>Claim:</span>
          <Link href={`/admin/review?claim=me&sort=${sort}`} className={`btn-cs ${claim === "me" ? "primary" : ""}`}>My Claims</Link>
          <Link href={`/admin/review?claim=unclaimed&sort=${sort}`} className={`btn-cs ${claim === "unclaimed" ? "primary" : ""}`}>Unclaimed</Link>
          <Link href={`/admin/review?sort=${sort}`} className={`btn-cs ${!claim ? "primary" : ""}`}>All</Link>
        </div>
        
        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginLeft: "auto" }}>
          <span style={{ color: "var(--muted)" }}>Sort:</span>
          <Link href={`/admin/review?sort=oldest&claim=${claim || ""}`} className={`btn-cs ${sort === "oldest" ? "primary" : ""}`}>Oldest</Link>
          <Link href={`/admin/review?sort=newest&claim=${claim || ""}`} className={`btn-cs ${sort === "newest" ? "primary" : ""}`}>Newest</Link>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {articles.length === 0 ? (
          <div style={{ padding: "48px 16px", textAlign: "center", background: "var(--surface)", borderRadius: "var(--r-md)" }}>
            <p style={{ color: "var(--muted)", margin: 0 }}>Queue is empty. Great job!</p>
          </div>
        ) : (
          articles.map((article) => {
            const ageMs = Date.now() - new Date(article.submittedAt || article.updatedAt).getTime();
            const ageDays = ageMs / (1000 * 60 * 60 * 24);
            let ageColor = "var(--ink-muted)";
            if (ageDays >= 3) ageColor = "var(--error)";
            else if (ageDays >= 1) ageColor = "var(--warning)";

            const isClaimedByMe = article.reviewedById === user.id;
            const wordCount = article.contentHtml ? article.contentHtml.replace(/<[^>]*>?/gm, '').split(/\s+/).length : 0;

            return (
              <div key={article.id} style={{ 
                display: "flex", 
                padding: "16px", 
                borderBottom: "1px solid var(--line)",
                gap: "16px",
                alignItems: "center"
              }}>
                {article.img ? (
                  <div style={{ width: "80px", height: "60px", position: "relative", borderRadius: "4px", overflow: "hidden", flexShrink: 0 }}>
                    <Image src={article.img} alt={article.title} fill style={{ objectFit: "cover" }} />
                  </div>
                ) : (
                  <div style={{ width: "80px", height: "60px", background: "var(--surface-2)", borderRadius: "4px", flexShrink: 0 }} />
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link href={`/admin/review/${article.id}`} style={{ fontWeight: 600, fontSize: "15px", color: "var(--ink)", textDecoration: "none", display: "block", marginBottom: "4px" }}>
                    {article.title}
                  </Link>
                  <div style={{ fontSize: "12px", color: "var(--ink-muted)", display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    <span>By <strong>{article.authorModel?.name || article.author || "Unknown"}</strong></span>
                    <span>{article.category?.name || "Uncategorized"}</span>
                    <span>~{wordCount} words</span>
                    {article._count.revisions > 0 && (
                      <span style={{ color: "var(--accent)" }}>Pass {article._count.revisions + 1}</span>
                    )}
                  </div>
                </div>

                <div style={{ textAlign: "right", fontSize: "12px", display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end", flexShrink: 0 }}>
                  <div style={{ color: ageColor, fontWeight: ageDays >= 1 ? 600 : 400 }}>
                    {article.submittedAt ? formatAge(new Date(article.submittedAt)) : "Unknown age"}
                  </div>
                  {article.reviewedById ? (
                    <span style={{ 
                      padding: "2px 6px", 
                      borderRadius: "4px", 
                      background: isClaimedByMe ? "rgba(16, 185, 129, 0.1)" : "var(--surface-2)", 
                      color: isClaimedByMe ? "var(--success)" : "var(--ink-muted)",
                      fontWeight: 600
                    }}>
                      {isClaimedByMe ? "Claimed by you" : `Claimed by ${article.reviewer?.name || "Another"}`}
                    </span>
                  ) : (
                    <span style={{ padding: "2px 6px", borderRadius: "4px", background: "var(--surface-2)", color: "var(--muted)" }}>
                      Unclaimed
                    </span>
                  )}
                  <Link href={`/admin/review/${article.id}`} className="btn-cs" style={{ marginTop: "4px", padding: "4px 12px", height: "auto" }}>
                    {isClaimedByMe ? "Continue Review" : "Open"}
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

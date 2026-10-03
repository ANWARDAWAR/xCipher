import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { eq, inArray, and, not, sql } from "drizzle-orm";
import { user as userTable, article as articleTable, category as categoryTable } from "@/lib/db/schema";
import { canViewReviewQueue } from "@/lib/permissions";
import { REVIEW_QUEUE_LIMIT } from "@/lib/queries";
import Link from "next/link";
import Image from "next/image";
import { Role } from "@/lib/types";
import StatusChip from "@/components/console/StatusChip";

export const metadata = {
  title: "Review Queue · xSypher",
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

  const [dbUser] = await db.query.user.findMany({
    where: eq(userTable.id, user.id),
    columns: { role: true },
    limit: 1,
  });
  
  const userRole = (dbUser?.role || user.role || "AUTHOR").toUpperCase() as Role;
  
  if (!canViewReviewQueue(userRole)) {
    redirect("/admin");
  }

  const { category, author, claim, resubmissions, sort = "oldest" } = searchParams;

  // Build filters
  const filterConditions: any[] = [
    eq(articleTable.status, "SUBMITTED")
  ];

  if (category) {
    filterConditions.push(
      sql`${articleTable.categoryId} IN (SELECT id FROM "Category" WHERE "slug" = ${category})`
    );
  }

  if (author) {
    filterConditions.push(
      sql`${articleTable.authorId} IN (SELECT id FROM "Author" WHERE "slug" = ${author})`
    );
  }

  if (claim === "me") {
    filterConditions.push(eq(articleTable.reviewedById, user.id));
  } else if (claim === "unclaimed") {
    filterConditions.push(sql`${articleTable.reviewedById} IS NULL`);
  } else if (claim === "other") {
    filterConditions.push(and(
      sql`${articleTable.reviewedById} IS NOT NULL`,
      not(eq(articleTable.reviewedById, user.id))
    ));
  }

  if (resubmissions === "true") {
    filterConditions.push(
      sql`EXISTS (SELECT 1 FROM "ArticleRevision" WHERE "articleId" = ${articleTable.id})`
    );
  }

  // Build sort
  let orderByFn = (a: any, { asc, desc }: any) => [asc(a.submittedAt)];
  if (sort === "newest") {
    orderByFn = (a: any, { desc }: any) => [desc(a.submittedAt)];
  } else if (sort === "author") {
    // Note: sorting by author name in Drizzle when the author is a relation can be tricky
    // so we sort by author ID as a fallback, or we can use a subquery/join.
    // For simplicity, we just use a subquery for sorting by author name
    orderByFn = (a: any, { asc }: any) => [
      asc(sql`(SELECT "name" FROM "Author" WHERE id = ${a.authorId})`)
    ];
  }

  const articles = await db.query.article.findMany({
    where: and(...filterConditions),
    orderBy: orderByFn as any,
    limit: REVIEW_QUEUE_LIMIT,
    columns: {
      id: true,
      title: true,
      img: true,
      submittedAt: true,
      updatedAt: true,
      reviewedById: true,
      author: true,
      contentUrl: true,
    },
    with: {
      category: { columns: { name: true } },
      authorModel: { columns: { name: true, slug: true } },
      reviewer: { columns: { name: true, email: true } },
      revisions: { columns: { id: true } }
    }
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
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
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

            return (
              <div key={article.id} className="console-review-card" style={{ 
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
                    <StatusChip status="SUBMITTED" />
                    {article.revisions && article.revisions.length > 0 && (
                      <span style={{ color: "var(--accent)" }}>Pass {article.revisions.length + 1}</span>
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

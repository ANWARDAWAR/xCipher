import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { buildArticleScope, authorize, ARTICLE_LIST_COLUMNS, ARTICLE_LIST_WITH, Actor } from "@/lib/capabilities";
import { eq, inArray, notInArray, and, or, ilike, sql, desc, asc, gte, lte } from "drizzle-orm";
import { user as userTable, article as articleTable, category as categoryTable } from "@/lib/db/schema";
import ArticleIndex from "@/components/console/ArticleIndex";
import FilterBar from "@/components/console/FilterBar";
import Pagination from "@/components/console/Pagination";
import { Plus } from "lucide-react";
import { Role, ArticleStatus, ARTICLE_STATUSES } from "@/lib/types";

export const dynamic = "force-dynamic";

// ──────────────────────────────────────────────────────────────────────────────
// Unified Article Index — /admin/articles
//
// One route replaces /admin/articles, /admin/drafts, /admin/submissions.
// All state lives in the URL. Scoping is derived from buildArticleScope(actor).
// Bodies (contentHtml, contentJson) are NEVER selected.
// ──────────────────────────────────────────────────────────────────────────────

// Valid sort fields
const SORT_FIELDS: Record<string, string> = {
  updated: "updatedAt",
  created: "createdAt",
  published: "publishedAt",
  title: "title",
  status: "status",
  views: "views",
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminArticles({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const user = await getCurrentUser();
  if (!user) {
    redirect("/admin/login");
  }

  const [dbUser] = await db.query.user.findMany({
    where: eq(userTable.id, user.id),
    with: { authorProfile: true },
    limit: 1,
  });

  if (!dbUser) {
    redirect("/admin/login");
  }

  const actor: Actor = {
    id: dbUser.id,
    role: dbUser.role as any,
    authorId: dbUser.authorProfile?.id || null,
  };

  // Check console access
  if (!authorize(actor.role, "console.access")) {
    redirect("/");
  }

  // ── Parse URL parameters ──────────────────────────────────────────────────
  const query = typeof resolvedParams.q === "string" ? resolvedParams.q.trim() : "";
  const statusParam = typeof resolvedParams.status === "string" ? resolvedParams.status : "";
  const authorParam = typeof resolvedParams.author === "string" ? resolvedParams.author : "";
  const categoryParam = typeof resolvedParams.category === "string" ? resolvedParams.category : "";
  const fromParam = typeof resolvedParams.from === "string" ? resolvedParams.from : "";
  const toParam = typeof resolvedParams.to === "string" ? resolvedParams.to : "";
  const sortParam = typeof resolvedParams.sort === "string" ? resolvedParams.sort : "updated";
  const dirParam = typeof resolvedParams.dir === "string" && resolvedParams.dir === "asc" ? "asc" : "desc";
  const pageParam = typeof resolvedParams.page === "string" ? Math.max(1, parseInt(resolvedParams.page, 10) || 1) : 1;
  const perParam = typeof resolvedParams.per === "string" ? parseInt(resolvedParams.per, 10) : 25;
  const perPage = [25, 50, 100].includes(perParam) ? perParam : 25;

  // ── Build the query ───────────────────────────────────────────────────────
  // Start with the actor's scope (the ONLY source of article visibility)
  const scopeWhere = buildArticleScope(actor);

  // Layer on user-selected filters
  const filterConditions: any[] = [];

  // Status filter
  if (statusParam) {
    const statuses = statusParam.split(",").filter((s) =>
      ARTICLE_STATUSES.includes(s as ArticleStatus)
    ) as ArticleStatus[];
    if (statuses.length > 0) {
      filterConditions.push(inArray(articleTable.status, statuses));
    }
  } else {
    // If no explicit status filter is applied, hide terminal statuses from the "All" view
    filterConditions.push(notInArray(articleTable.status, ["ARCHIVED", "REJECTED"]));
  }

  // Author filter
  if (authorParam) {
    filterConditions.push(eq(articleTable.authorId, authorParam));
  }

  // Category filter
  if (categoryParam) {
    filterConditions.push(eq(articleTable.categoryId, categoryParam));
  }

  const dateFilter: { gte?: Date; lte?: Date } = {};
  if (fromParam) {
    const from = new Date(`${fromParam}T00:00:00.000Z`);
    if (!Number.isNaN(from.getTime())) dateFilter.gte = from;
  }
  if (toParam) {
    const to = new Date(`${toParam}T23:59:59.999Z`);
    if (!Number.isNaN(to.getTime())) dateFilter.lte = to;
  }
  if (dateFilter.gte || dateFilter.lte) {
    if (!dateFilter.gte || !dateFilter.lte || dateFilter.gte <= dateFilter.lte) {
      if (dateFilter.gte) filterConditions.push(gte(articleTable.updatedAt, dateFilter.gte));
      if (dateFilter.lte) filterConditions.push(lte(articleTable.updatedAt, dateFilter.lte));
    }
  }

  // Search — case-insensitive across title, deck, slug, author name
  if (query) {
    filterConditions.push(
      or(
        ilike(articleTable.title, `%${query}%`),
        ilike(articleTable.deck, `%${query}%`),
        ilike(articleTable.slug, `%${query}%`),
        ilike(articleTable.author, `%${query}%`),
        sql`${articleTable.authorId} IN (SELECT id FROM "User" WHERE "name" ILIKE ${`%${query}%`})`,
        sql`${articleTable.categoryId} IN (SELECT id FROM "Category" WHERE "name" ILIKE ${`%${query}%`})`
      )
    );
  }

  // Combine scope + filters
  const where = and(scopeWhere, ...filterConditions);

  // Sort
  const sortField = SORT_FIELDS[sortParam] || "updatedAt";
  const orderByFn = (a: any) => dirParam === "asc" ? [asc(a[sortField]), asc(a.id)] : [desc(a[sortField]), asc(a.id)];

  // ── Execute parallel queries ──────────────────────────────────────────────
  const [articles, totalCount, statusCounts, authorOptions, categoryOptions] =
    await Promise.all([
      // Page of articles (NO body fields)
      db.query.article.findMany({
        where,
        orderBy: (a) => orderByFn(a),
        offset: (pageParam - 1) * perPage,
        limit: perPage,
        columns: ARTICLE_LIST_COLUMNS,
        with: ARTICLE_LIST_WITH,
      }),

      // Total count for pagination
      db.select({ count: sql`count(*)`.mapWith(Number) }).from(articleTable).where(where).then(res => res[0]?.count || 0),

      // Status counts within scope (for filter bar badges)
      db.select({ status: articleTable.status, _count: sql`count(*)`.mapWith(Number) })
        .from(articleTable)
        .where(scopeWhere)
        .groupBy(articleTable.status)
        .then((groups) => {
          const counts: Record<string, number> = {};
          for (const g of groups) {
            counts[g.status as string] = Number(g._count);
          }
          return counts;
        }),

      // Author options (those who actually have articles in scope)
      db.selectDistinct({ authorId: articleTable.authorId }).from(articleTable).where(scopeWhere)
        .then(async (rows) => {
          const ids = rows.map(r => r.authorId).filter(Boolean) as string[];
          if (!ids.length) return [];
          const users = await db.select({ id: userTable.id, name: userTable.name }).from(userTable).where(inArray(userTable.id, ids));
          return users.map(u => ({ value: u.id, label: u.name || "Unknown" })).sort((a, b) => a.label.localeCompare(b.label));
        }),

      // Category options
      db.select({
        id: categoryTable.id,
        name: categoryTable.name,
        _count: sql`(SELECT count(*) FROM "Article" WHERE "categoryId" = ${categoryTable.id})`.mapWith(Number)
      }).from(categoryTable)
        .orderBy(categoryTable.name)
        .then((cats) =>
          cats.map((c) => ({
            value: c.id,
            label: c.name,
            count: Number(c._count),
          }))
        ),
    ]);

  const isFiltered = !!(query || statusParam || authorParam || categoryParam || fromParam || toParam);
  const isAuthorOnly = actor.role === "AUTHOR";
  const pageTitle = isAuthorOnly ? "My Articles" : "Articles";

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-ink font-[var(--f-ui)]">
              {pageTitle}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-surface-2 border border-line text-xs font-semibold text-muted">
              {totalCount.toLocaleString()} {totalCount === 1 ? "story" : "stories"}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted mt-1 font-[var(--f-ui)]">
            Manage, review, and organize editorial stories across all publications.
          </p>
        </div>
        {authorize(actor.role, "article.create") && (
          <Link 
            href="/admin/editor" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-deep active:bg-accent-press text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs hover:shadow transition-all duration-150 active:scale-[0.99] self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>New article</span>
          </Link>
        )}
      </div>

      <Suspense fallback={<div style={{ padding: "16px", color: "var(--muted)" }}>Loading filters…</div>}>
        <FilterBar
          statusCounts={statusCounts}
          authors={authorOptions}
          categories={categoryOptions}
          totalCount={totalCount}
        />
      </Suspense>

      <ArticleIndex
        articles={articles as any}
        actor={actor}
        isFiltered={isFiltered}
        emptyMessage={isAuthorOnly ? "You haven't written any articles yet." : "No articles yet."}
        emptyAction={{ label: "+ Write your first article", href: "/admin/editor" }}
      />

      <Suspense fallback={null}>
        <Pagination
          totalCount={totalCount}
          page={pageParam}
          perPage={perPage}
          itemName="articles"
        />
      </Suspense>
    </div>
  );
}

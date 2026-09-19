import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Role, ArticleStatus, Prisma } from "@prisma/client";
import { buildArticleScope, authorize, ARTICLE_LIST_SELECT, Actor } from "@/lib/capabilities";
import ArticleIndex from "@/components/console/ArticleIndex";
import FilterBar from "@/components/console/FilterBar";
import Pagination from "@/components/console/Pagination";
import { Plus } from "lucide-react";

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

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    include: { authorProfile: true },
  });

  if (!dbUser) {
    redirect("/admin/login");
  }

  const actor: Actor = {
    id: dbUser.id,
    role: dbUser.role as Role,
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
  const filterConditions: Prisma.ArticleWhereInput[] = [];

  // Status filter
  if (statusParam) {
    const statuses = statusParam.split(",").filter((s) =>
      Object.values(ArticleStatus).includes(s as ArticleStatus)
    ) as ArticleStatus[];
    if (statuses.length > 0) {
      filterConditions.push({ status: { in: statuses } });
    }
  }

  // Author filter
  if (authorParam) {
    filterConditions.push({ authorId: authorParam });
  }

  // Category filter
  if (categoryParam) {
    filterConditions.push({ categoryId: categoryParam });
  }

  // Date range, applied to the field currently being sorted on where that field
  // is a date, otherwise to updatedAt. Parsed defensively: an unparseable date
  // is ignored rather than throwing, because it arrives from the URL and a user
  // can type anything there.
  //
  // `to` is widened to the end of that day. A range of 2026-01-05 to 2026-01-05
  // should mean "that whole day", not "the single instant at midnight", which
  // would match nothing.
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
    // Guard against an inverted range: the inputs are bound to each other in the
    // UI, but the URL can still be edited by hand, and gte > lte silently
    // returns nothing, which reads as a bug rather than as empty input.
    if (!dateFilter.gte || !dateFilter.lte || dateFilter.gte <= dateFilter.lte) {
      filterConditions.push({ updatedAt: dateFilter });
    }
  }

  // Search — case-insensitive across title, deck, slug, author name
  if (query) {
    filterConditions.push({
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { deck: { contains: query, mode: "insensitive" } },
        { slug: { contains: query, mode: "insensitive" } },
        { author: { contains: query, mode: "insensitive" } },
        { authorModel: { name: { contains: query, mode: "insensitive" } } },
        { category: { name: { contains: query, mode: "insensitive" } } },
      ],
    });
  }

  // Combine scope + filters
  const where: Prisma.ArticleWhereInput = {
    AND: [scopeWhere as Prisma.ArticleWhereInput, ...filterConditions],
  };

  // Sort
  const sortField = SORT_FIELDS[sortParam] || "updatedAt";
  const orderBy: Prisma.ArticleOrderByWithRelationInput[] = [
    { [sortField]: dirParam },
    { id: "asc" }, // stable secondary sort
  ];

  // ── Execute parallel queries ──────────────────────────────────────────────
  const [articles, totalCount, statusCounts, authorOptions, categoryOptions] =
    await Promise.all([
      // Page of articles (NO body fields)
      db.article.findMany({
        where,
        orderBy,
        skip: (pageParam - 1) * perPage,
        take: perPage,
        select: ARTICLE_LIST_SELECT,
      }),

      // Total count for pagination
      db.article.count({ where }),

      // Status counts within scope (for filter bar badges)
      db.article.groupBy({
        by: ["status"],
        where: scopeWhere as Prisma.ArticleWhereInput,
        _count: true,
      }).then((groups) => {
        const counts: Record<string, number> = {};
        for (const g of groups) {
          counts[g.status] = g._count;
        }
        return counts;
      }),

      // Author options (those who actually have articles in scope)
      db.article.findMany({
        where: scopeWhere as Prisma.ArticleWhereInput,
        select: {
          authorModel: { select: { id: true, name: true } },
        },
        distinct: ["authorId"],
      }).then((rows) =>
        rows
          .filter((r) => r.authorModel)
          .map((r) => ({
            value: r.authorModel!.id,
            label: r.authorModel!.name,
          }))
          .sort((a, b) => a.label.localeCompare(b.label))
      ),

      // Category options
      db.category.findMany({
        select: { id: true, name: true, _count: { select: { articles: true } } },
        orderBy: { name: "asc" },
      }).then((cats) =>
        cats.map((c) => ({
          value: c.id,
          label: c.name,
          count: c._count.articles,
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
        articles={articles}
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

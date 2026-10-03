import { notFound, redirect } from "next/navigation";
import ArticleEditor from "@/components/editorial/ArticleEditorClient";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { canEditArticle } from "@/lib/permissions";
import { buildArticleScope } from "@/lib/capabilities";
import type { Role } from "@/lib/types";
import { and, eq } from "drizzle-orm";
import { author as authorTable, article as articleTable } from "@/lib/db/schema";
import ReviewFeedbackPanel from "@/components/editorial/ReviewFeedbackPanel";
import { fetchFromR2 } from "@/lib/storage";

interface EditDraftPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditDraftPage({ params }: EditDraftPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  const actor = { id: user.id, role: user.role as Role, authorId: user.authorId };

  const draft = await db.query.article.findFirst({
    where: and(eq(articleTable.id, id), buildArticleScope(actor)),
    // The editable body comes from R2. Do not also fetch/serialize the full
    // search index text from Postgres in this server-rendered response.
    columns: { textContent: false },
    with: {
      // Include parent category to support the CategorySelector component
      category: { with: { parent: true } },
      tags: {
        with: {
          tag: {
            columns: { id: true, name: true, slug: true },
          },
        },
      },
      revisions: {
        columns: { id: true, notes: true, statusChange: true, createdAt: true },
        orderBy: (r, { desc }) => [desc(r.createdAt)],
        with: { user: { columns: { name: true, email: true } } }
      },
      // Only the most recent decision: the author needs to know what to fix
      // now, not the whole argument. The full history stays in revisions.
      reviews: {
        orderBy: (r, { desc }) => [desc(r.createdAt)],
        limit: 1,
        columns: {
          id: true,
          decision: true,
          reason: true,
          reasonCode: true,
          createdAt: true,
          passNumber: true,
        },
        with: { reviewer: { columns: { name: true } } },
      },
    }
  });

  if (!draft) {
    notFound();
  }

  const editPolicy = canEditArticle(
    actor,
    draft
  );

  if (!editPolicy.success) {
    redirect('/admin/drafts');
  }

  const [r2Content, authorProfile, allAuthors] = await Promise.all([
    fetchFromR2(draft.contentUrl),
    user.authorId
      ? db.query.author.findFirst({
        where: eq(authorTable.id, user.authorId),
        columns: { id: true, name: true, role: true },
      })
      : Promise.resolve(null),
    db.query.author.findMany({ columns: { id: true, name: true, slug: true }, orderBy: (a, { asc }) => [asc(a.name)] }),
  ]);
  const articleHtml = typeof r2Content === "object" ? r2Content?.html : r2Content || "";
  const articleJson = typeof r2Content === "object" ? r2Content?.json : null;

  const { revisions, reviews, ...metadata } = draft;
  const initialData = {
    ...metadata,
    cat: draft.category?.slug || "ai",
    status: draft.status,
    bodyHtml: articleHtml,
    contentJson: articleJson,
  };

  return (
    <div>
      <h1>Edit story</h1>
      <p className="cs-sub">Write, save drafts and publish.</p>
      <ReviewFeedbackPanel status={draft.status} latestReview={reviews[0] ?? null} />
      <ArticleEditor
        initialData={initialData}
        initialRevisions={revisions}
        userRole={user.role}
        authorName={authorProfile?.name || user.name}
        authorRole={authorProfile?.role || user.role}
        authorId={authorProfile?.id}
        availableAuthors={allAuthors}
      />
    </div>
  );
}

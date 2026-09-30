import { notFound, redirect } from "next/navigation";
import ArticleEditor from "@/components/editorial/ArticleEditorClient";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { canEditArticle } from "@/lib/permissions";
import { getCategories, getTags } from "@/app/actions/taxonomy";
import { eq } from "drizzle-orm";
import { user as userTable, article as articleTable } from "@/lib/db/schema";
import ReviewFeedbackPanel from "@/components/editorial/ReviewFeedbackPanel";
import { fetchFromR2 } from "@/lib/storage";

interface EditDraftPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditDraftPage({ params }: EditDraftPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();

  const dbUser = user?.id
    ? await db.query.user.findFirst({
      where: eq(userTable.id, user.id),
      with: { authorProfile: true },
    })
    : null;

  const draft = await db.query.article.findFirst({
    where: eq(articleTable.id, id),
    with: {
      // Include parent category to support the CategorySelector component
      category: { with: { parent: true } },
      revisions: {
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
    { id: user?.id || "", role: user?.role || "", authorId: dbUser?.authorProfile?.id },
    draft
  );

  if (!editPolicy.success) {
    redirect('/admin/drafts');
  }

  const r2Content = await fetchFromR2(draft.contentUrl);
  const articleHtml = typeof r2Content === "object" ? r2Content?.html : r2Content || "";
  const articleJson = typeof r2Content === "object" ? r2Content?.json : null;

  const initialData = {
    ...draft,
    cat: draft.category?.slug || "ai",
    status: draft.status,
    bodyHtml: articleHtml,
    body: articleHtml,
    contentJson: articleJson,
  };

  const [categories, tags] = await Promise.all([
    getCategories(),
    getTags()
  ]);

  return (
    <div>
      <h1>Edit story</h1>
      <p className="cs-sub">Write, save drafts and publish.</p>
      <ReviewFeedbackPanel status={draft.status} latestReview={draft.reviews[0] ?? null} />
      <ArticleEditor
        initialData={initialData}
        initialRevisions={draft.revisions}
        userRole={user?.role}
        authorName={dbUser?.authorProfile?.name || dbUser?.name}
        authorRole={dbUser?.authorProfile?.role || dbUser?.role}
        authorId={dbUser?.authorProfile?.id}
        availableCategories={categories}
        availableTags={tags}
      />
    </div>
  );
}

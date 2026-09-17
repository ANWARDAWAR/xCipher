import { notFound, redirect } from "next/navigation";
import ArticleEditor from "@/components/editorial/ArticleEditor";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { canEditArticle } from "@/lib/permissions";
import { Role } from "@prisma/client";
import { getCategories, getTags } from "@/app/actions/taxonomy";

interface EditDraftPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditDraftPage({ params }: EditDraftPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  
  const dbUser = user?.id
    ? await db.user.findUnique({
        where: { id: user.id },
        include: { authorProfile: true },
      })
    : null;

  const draft = await db.article.findUnique({
    where: { id },
    include: { 
      category: true,
      revisions: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, email: true } } }
      }
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

  const initialData = {
    ...draft,
    cat: draft.category?.slug || "ai",
    status: draft.status,
    bodyHtml: draft.contentHtml || "",
    body: draft.contentHtml || "",
  };

  const [categories, tags] = await Promise.all([
    getCategories(),
    getTags()
  ]);

  return (
    <div>
      <h1>Edit story</h1>
      <p className="cs-sub">Write, save drafts and publish.</p>
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

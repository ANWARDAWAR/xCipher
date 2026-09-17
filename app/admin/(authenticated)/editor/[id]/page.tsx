import { notFound, redirect } from "next/navigation";
import ArticleEditor from "@/components/editorial/ArticleEditor";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

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
    include: { category: true }
  });

  if (!draft) {
    notFound();
  }

  if (user?.role === "AUTHOR" && draft.authorId !== dbUser?.authorProfile?.id && draft.authorId !== user?.id) {
    redirect('/admin/drafts');
  }

  const initialData = {
    ...draft,
    cat: draft.category?.slug || "ai",
    status: draft.status,
    bodyHtml: draft.contentHtml || "",
    body: draft.contentHtml || "",
  };

  return (
    <div>
      <h1>Edit story</h1>
      <p className="cs-sub">Write, save drafts and publish.</p>
      <ArticleEditor
        initialData={initialData}
        userRole={user?.role}
        authorName={dbUser?.authorProfile?.name || dbUser?.name}
        authorRole={dbUser?.authorProfile?.role || dbUser?.role}
        authorId={dbUser?.authorProfile?.id}
      />
    </div>
  );
}

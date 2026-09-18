import { redirect } from "next/navigation";
import ArticleEditor from "@/components/editorial/ArticleEditor";
import { getCurrentUser } from "@/lib/auth";
import { authorize } from "@/lib/capabilities";
import { db } from "@/lib/db";
import { getCategories, getTags } from "@/app/actions/taxonomy";
import { Role } from "@prisma/client";

export default async function NewStoryPage() {
  const user = await getCurrentUser();

  // Every other console route guards itself, but this one never did: any
  // signed-in role could open the new-story editor, including MODERATOR and
  // REVIEWER, neither of which has `article.create`. The editor's own actions
  // would have rejected the eventual save, so the real cost was a user being
  // walked all the way through writing an article before being told no.
  if (!user || !authorize(user.role as Role, "article.create")) {
    redirect("/admin");
  }

  const dbUser = user?.id
    ? await db.user.findUnique({
        where: { id: user.id },
        include: { authorProfile: true },
      })
    : null;

  const [categories, tags] = await Promise.all([
    getCategories(),
    getTags()
  ]);

  return (
    <div>
      <h1>New story</h1>
      <p className="cs-sub">Write, save drafts and publish.</p>
      <ArticleEditor
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

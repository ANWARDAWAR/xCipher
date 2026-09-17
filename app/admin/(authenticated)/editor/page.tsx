import ArticleEditor from "@/components/editorial/ArticleEditor";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function NewStoryPage() {
  const user = await getCurrentUser();
  const dbUser = user?.id
    ? await db.user.findUnique({
        where: { id: user.id },
        include: { authorProfile: true },
      })
    : null;

  return (
    <div>
      <h1>New story</h1>
      <p className="cs-sub">Write, save drafts and publish.</p>
      <ArticleEditor
        userRole={user?.role}
        authorName={dbUser?.authorProfile?.name || dbUser?.name}
        authorRole={dbUser?.authorProfile?.role || dbUser?.role}
        authorId={dbUser?.authorProfile?.id}
      />
    </div>
  );
}

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import ArticleEditor from "@/components/editorial/ArticleEditorClient";
import { authorize } from "@/lib/capabilities";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { author as authorTable } from "@/lib/db/schema";
import type { Role } from "@/lib/types";

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

  const [authorProfile, allAuthors] = await Promise.all([
    user.authorId
      ? db.query.author.findFirst({
        where: eq(authorTable.id, user.authorId),
        columns: { id: true, name: true, role: true },
      })
      : Promise.resolve(null),
    db.query.author.findMany({ columns: { id: true, name: true, slug: true }, orderBy: (a, { asc }) => [asc(a.name)] }),
  ]);

  return (
    <div>
      <h1>New story</h1>
      <p className="cs-sub">Write, save drafts and publish.</p>
      <ArticleEditor
        userRole={user.role}
        authorName={authorProfile?.name || user.name}
        authorRole={authorProfile?.role || user.role}
        authorId={authorProfile?.id}
        availableAuthors={allAuthors}
      />
    </div>
  );
}

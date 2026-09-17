import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import ProfileForm from "./ProfileForm";
import Link from "next/link";
import { redirect } from "next/navigation";
import AuthorProfileView from "@/components/author/AuthorProfileView";

export const dynamic = "force-dynamic";

export default async function SettingsPage(props: { searchParams: Promise<{ edit?: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/admin/login");
  }

  const searchParams = await props.searchParams;

  const dbUser = await db.user.findUnique({ where: { id: user.id } });
  const author = dbUser?.authorId 
    ? await db.author.findUnique({ where: { id: dbUser.authorId } }) 
    : null;

  const isEditing = searchParams.edit === "true" || !author;

  if (isEditing) {
    return (
      <>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h1>Edit Profile</h1>
            <p className="cs-sub">Update your public author profile information.</p>
          </div>
          {author && (
            <Link href="/admin/settings" className="btn btn-ghost" style={{ padding: "8px 16px", borderRadius: "6px" }}>
              Cancel
            </Link>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          <ProfileForm user={dbUser || user} author={author} />
        </div>
      </>
    );
  }

  // Preview Mode
  // Stats
  const articles = await db.article.findMany({
    where: {
      status: "PUBLISHED",
      OR: [{ authorId: author.id }, { author: author.name }]
    },
    orderBy: { createdAt: "desc" },
    include: { category: true }
  });

  const totalViews = articles.reduce((sum, a) => sum + (a.views || 0), 0);

  // Parse socials
  let socials: { platform: string; url: string }[] = [];
  try {
    const raw = author?.socialLinks;
    const parsed = typeof raw === "string" ? JSON.parse(raw) : (raw || []);
    if (Array.isArray(parsed)) socials = parsed.filter(s => s.url?.trim());
  } catch { socials = []; }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1>Profile Settings</h1>
          <p className="cs-sub">This is exactly how your public profile looks to readers.</p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          {author?.slug && (
            <Link href={`/author/${author.slug}`} target="_blank" className="btn btn-ghost" style={{ padding: "8px 16px", borderRadius: "6px" }}>
              View Public
            </Link>
          )}
          <Link href="/admin/settings?edit=true" className="btn btn-primary" style={{ padding: "8px 16px", borderRadius: "6px" }}>
            Edit Profile
          </Link>
        </div>
      </div>
      
      <div style={{
        background: "var(--paper)",
        border: "1px solid var(--line)",
        borderRadius: "var(--r-lg)",
        overflow: "hidden",
        boxShadow: "var(--shadow-1)",
      }}>
        <div style={{ pointerEvents: "none", color: "var(--ink)" }}>
          <AuthorProfileView 
            author={author} 
            articles={articles} 
            socials={socials} 
            totalViews={totalViews} 
          />
        </div>
      </div>
    </>
  );
}

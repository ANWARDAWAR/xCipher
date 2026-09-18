import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ARTICLE_CARD_SELECT, LISTING_ARTICLE_LIMIT } from "@/lib/queries";
import ProfileForm from "./ProfileForm";
import AccountForm from "./AccountForm";
import Link from "next/link";
import { redirect } from "next/navigation";
import AuthorProfileView from "@/components/author/AuthorProfileView";
import PublicationForm from "./PublicationForm";
import { getPublicationSettings, SETTINGS_ID } from "@/lib/settings";
import { authorize } from "@/lib/capabilities";
import type { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function SettingsPage(props: { searchParams: Promise<{ tab?: string, edit?: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/admin/login");
  }

  const searchParams = await props.searchParams;
  const currentTab = searchParams.tab || "profile";
  const isEditing = searchParams.edit === "true";

  const dbUser = await db.user.findUnique({ where: { id: user.id } });

  // Publication settings are OWNER/ADMIN only. Resolved here so the tab is not
  // even rendered for an editor; the action re-checks independently.
  const canEditPublication = authorize(user.role as Role, "settings.publication");
  const publicationSettings = canEditPublication ? await getPublicationSettings() : null;
  const storedPublication = canEditPublication
    ? await db.publicationSettings
        .findUnique({ where: { id: SETTINGS_ID } })
        // The table is created empty by the migration and the row may genuinely
        // not exist yet, so a miss is normal rather than an error.
        .catch(() => null)
    : null;
  const author = dbUser?.authorId 
    ? await db.author.findUnique({ where: { id: dbUser.authorId } }) 
    : null;

  // Stats for preview
  let articles: any[] = [];
  let totalViews = 0;
  if (author) {
    // This renders the same AuthorProfileView as the public author page, so it
    // takes the same shape: a bounded page of body-free rows, and an exact view
    // total from Postgres rather than a sum of whatever happened to be fetched.
    const authorWhere = {
      status: "PUBLISHED" as const,
      OR: [{ authorId: author.id }, { author: author.name }]
    };
    const [rows, viewsAggregate] = await Promise.all([
      db.article.findMany({
        where: authorWhere,
        orderBy: { createdAt: "desc" },
        take: LISTING_ARTICLE_LIMIT,
        select: ARTICLE_CARD_SELECT,
      }),
      db.article.aggregate({ where: authorWhere, _sum: { views: true } }),
    ]);
    articles = rows;
    totalViews = viewsAggregate._sum.views || 0;
  }

  let socials: { platform: string; url: string }[] = [];
  try {
    const raw = author?.socialLinks;
    const parsed = typeof raw === "string" ? JSON.parse(raw) : (raw || []);
    if (Array.isArray(parsed)) socials = parsed.filter(s => s.url?.trim());
  } catch { socials = []; }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", borderBottom: "1px solid var(--line)", paddingBottom: "16px" }}>
        <div>
          <h1>Settings</h1>
          <p className="cs-sub">Manage your public identity and account security.</p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <Link href="/admin/settings?tab=profile" className={`btn-cs ${currentTab === "profile" ? "primary" : ""}`} style={{ borderRadius: "6px" }}>
            Public Profile
          </Link>
          <Link href="/admin/settings?tab=account" className={`btn-cs ${currentTab === "account" ? "primary" : ""}`} style={{ borderRadius: "6px" }}>
            Account Security
          </Link>
          {canEditPublication && (
            <Link href="/admin/settings?tab=publication" className={`btn-cs ${currentTab === "publication" ? "primary" : ""}`} style={{ borderRadius: "6px" }}>
              Publication
            </Link>
          )}
        </div>
      </div>

      {currentTab === "profile" && (
        <>
          {!isEditing && author ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h2 style={{ fontSize: "16px" }}>Profile Preview</h2>
                <div style={{ display: "flex", gap: "12px" }}>
                  {author.slug && (
                    <Link href={`/author/${author.slug}`} target="_blank" className="btn btn-ghost" style={{ padding: "6px 12px", borderRadius: "6px" }}>
                      View Live
                    </Link>
                  )}
                  <Link href="/admin/settings?tab=profile&edit=true" className="btn btn-primary" style={{ padding: "6px 12px", borderRadius: "6px" }}>
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
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h2 style={{ fontSize: "16px" }}>Edit Profile</h2>
                {author && (
                  <Link href="/admin/settings?tab=profile" className="btn btn-ghost" style={{ padding: "6px 12px", borderRadius: "6px" }}>
                    Cancel
                  </Link>
                )}
              </div>
              <ProfileForm user={dbUser || user} author={author} />
            </>
          )}
        </>
      )}

      {currentTab === "account" && (
        <>
          <h2 style={{ fontSize: "16px", marginBottom: "16px" }}>Account Security</h2>
          <AccountForm user={dbUser || user} />
        </>
      )}

      {currentTab === "publication" && canEditPublication && publicationSettings && (
        <PublicationForm
          settings={publicationSettings}
          stored={storedPublication ?? {}}
        />
      )}
    </>
  );
}

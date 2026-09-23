import re

# Update layout.tsx
with open('app/admin/(authenticated)/layout.tsx', 'r') as f:
    layout = f.read()

# Add pendingCommentsCount logic
count_logic = """  let pendingCommentsCount = 0;
  if (canModerateComments(userRole as Role)) {
    pendingCommentsCount = await db.comment.count({
      where: { status: "PENDING" }
    });
  }"""
layout = layout.replace("""  const { items: notifications, unreadCount } = await getNotifications();""", f"{count_logic}\n\n  const {{ items: notifications, unreadCount }} = await getNotifications();")

# Pass it to AdminNavLinks
layout = layout.replace("""            reviewCount={reviewCount}
          />""", """            reviewCount={reviewCount}
            pendingCommentsCount={pendingCommentsCount}
          />""")

with open('app/admin/(authenticated)/layout.tsx', 'w') as f:
    f.write(layout)

# Update AdminNavLinks.tsx
with open('components/editorial/AdminNavLinks.tsx', 'r') as f:
    nav = f.read()

# Add prop interface
nav = nav.replace("""  reviewCount?: number;
}""", """  reviewCount?: number;
  pendingCommentsCount?: number;
}""")

# Add to destructuring
nav = nav.replace("""  reviewCount = 0,
}: AdminNavLinksProps)""", """  reviewCount = 0,
  pendingCommentsCount = 0,
}: AdminNavLinksProps)""")

# Add badge UI
old_comments_link = """      {canModerateComments && (
        <Link href="/admin/comments" {...navProps(isActive("/admin/comments"))}>
          <svg className="ic-s" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          Comments
        </Link>
      )}"""

new_comments_link = """      {canModerateComments && (
        <Link 
          href="/admin/comments" 
          {...navProps(isActive("/admin/comments"))}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <svg className="ic-s" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Comments
          </span>
          {pendingCommentsCount > 0 && (
            <span style={{
              background: "var(--accent)",
              color: "white",
              fontSize: "11px",
              fontWeight: 600,
              padding: "2px 6px",
              borderRadius: "10px",
              minWidth: "20px",
              textAlign: "center"
            }}>
              {pendingCommentsCount}
            </span>
          )}
        </Link>
      )}"""

nav = nav.replace(old_comments_link, new_comments_link)

with open('components/editorial/AdminNavLinks.tsx', 'w') as f:
    f.write(nav)

print("Sidebar updated.")

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminNavLinks() {
  const pathname = usePathname();

  return (
    <>
      <Link href="/admin" className={pathname === "/admin" ? "on" : ""}>
        <svg className="ic-s" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
        Dashboard
      </Link>
      <Link href="/admin/articles" className={pathname === "/admin/articles" ? "on" : ""}>
        <svg className="ic-s" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2V4z" />
          <path d="M18 8h2a1 1 0 0 1 1 1v11a2 2 0 0 1-2 2H7" />
          <path d="M8.5 8h6M8.5 12h6M8.5 16h4" />
        </svg>
        Articles
      </Link>
      <Link href="/admin/drafts" className={pathname === "/admin/drafts" ? "on" : ""}>
        <svg className="ic-s" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
        </svg>
        Drafts
      </Link>
      <Link href="/admin/submissions" className={pathname === "/admin/submissions" ? "on" : ""}>
        <svg className="ic-s" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
        Review Queue
      </Link>
      <Link href="/admin/editor" className={pathname === "/admin/editor" ? "on" : ""}>
        <svg className="ic-s" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        New Story
      </Link>
      <Link href="/admin/settings" className={pathname === "/admin/settings" ? "on" : ""}>
        <svg className="ic-s" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14 3h-4l-.4 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2L10 21h4l.4-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.2-1.2z" />
        </svg>
        Settings
      </Link>
      <Link href="/admin/users" className={pathname === "/admin/users" ? "on" : ""}>
        <svg className="ic-s" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        Users
      </Link>
      <Link href="/admin/audit-logs" className={pathname === "/admin/audit-logs" ? "on" : ""}>
        <svg className="ic-s" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        Audit Logs
      </Link>
    </>
  );
}

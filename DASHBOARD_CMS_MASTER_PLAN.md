# xCipher — Dashboard & CMS Master Plan

**Repository:** `ANWARDAWAR/xCipher`
**Branch audited:** `arena/01a0b084-xcipher` (from `main` @ `580926a`)
**Audit date:** 2026-09-17
**Document type:** Audit + Architecture + Product Specification
**Source code changed during this audit:** **NO** (documentation only)

> **Reading rule for this document.**
> Every section is explicitly split into **CURRENT** (verified against real source, with file/line evidence) and **RECOMMENDED** (proposal).
> Any statement in a CURRENT section is backed by a file path. If something is not stated as existing, it does not exist in the codebase.

## Contents

1. Executive Summary
2. Audit Scope
3. Current Architecture
4. Current Dashboard
5. Current Routes — consolidated table
6. Current Roles
7. Current Permissions — verified matrix
8. Current Article Workflow
9. Current Article Management
10. Current Review / Approval System
11. Current CSS / Design System
12. Current Responsive Behavior
13. Current Problems — prioritised register
14. Recommended Dashboard Architecture
15. Recommended Role System
16. Recommended Permission Matrix
17. Recommended Dashboard Overview by Role
18. Recommended Sidebar / Navigation
19. Recommended Article Section
20. Recommended Article List Design
21. Recommended Search / Filter / Sort System
22. Recommended Review Queue
23. Recommended Approval Workflow
24. Recommended Rejection / Change-Request Workflow
25. Recommended Ownership Rules
26. Recommended Article State Machine
27. Recommended Dashboard UX
28. Recommended CSS / Design System
29. Recommended Responsive System
30. Recommended Accessibility
31. Recommended Security
32. Recommended Performance
33. Missing Features
34. Critical Tasks
35. High Priority Tasks
36. Medium Priority Tasks
37. Low Priority Tasks
38. Implementation Tasks
39. Master Role Matrix
40. Master Article State Machine
41. Master Article List Specification
42. Master Dashboard Design System
43. Final Verification Checklist
44. Phased Execution Roadmap
45. Phase 2 Plan Review — gaps to close before "done"
46. Next After Phase 2 — Phase 3 hand-off brief
47. TASK-10 Resumption Brief (when Phase 2 stops short of the review queue)
48. Phase 2 Sign-off and Phase 3 Go/No-Go

---

# 1. Executive Summary

xCipher is a Next.js 16 (App Router) + Prisma/PostgreSQL technology publication with a reader-facing site under `app/(public)/` and an editorial console under `app/admin/(authenticated)/`. The console is real and functional for the basic "write → save → publish" path, but it is **not** a production-grade editorial CMS. It is a thin set of five list pages plus a large TipTap editor, wired to a two-and-a-half-step workflow.

**The ten findings that matter most (all verified):**

| # | Finding | Severity | Evidence |
|---|---|---|---|
| 1 | **Submitted and rejected articles are invisible to their own authors.** `/admin/articles` queries `status: "PUBLISHED"` only; `/admin/drafts` queries `DRAFT` + `REVISION_REQUESTED` only. An article in `SUBMITTED`, `REVIEW` or `REJECTED` appears in **no author-accessible list**. | CRITICAL | `app/admin/(authenticated)/articles/page.tsx:17-21`, `app/admin/(authenticated)/drafts/page.tsx:17-24` |
| 2 | **`REJECTED` articles are invisible to editors too.** The review queue filters `status in [SUBMITTED, REVIEW, REVISION_REQUESTED]`. Rejecting an article removes it from every list in the product. It is only reachable by direct URL. | CRITICAL | `app/admin/(authenticated)/submissions/page.tsx:53` |
| 3 | **Scheduling is a dead feature.** `Article.scheduledFor` is persisted, the editor exposes a `datetime-local` input, but there is no cron, no API route, no `SCHEDULED` status and no job that ever flips a scheduled article to `PUBLISHED`. Public queries only read `status: "PUBLISHED"`. | CRITICAL | `prisma/schema.prisma` (`scheduledFor`), `components/editorial/ArticleEditor.tsx:553`, `app/api/` contains only `auth/[...nextauth]` |
| 4 | **The REVIEWER role cannot perform reviews.** `ReviewWorkspace` renders Approve/Request-Revision/Reject for `REVIEWER`, but every button calls `handleSave` → `upsertArticle` → `canEditArticle`, which returns failure for `REVIEWER`. The action silently fails with a toast. | CRITICAL | `components/editorial/ReviewWorkspace.tsx:25`, `lib/permissions.ts` `canEditArticle` |
| 5 | **Full article bodies are shipped to the browser on every list page.** `findMany` with no `select` returns `contentHtml` + `contentJson` for every row, and the array is passed into the `"use client"` component `StoryDataTable`, so all HTML/JSON bodies are serialised into the RSC payload. | CRITICAL (perf/security) | `app/admin/(authenticated)/articles/page.tsx:17-21` → `StoryDataTable` (`"use client"`) |
| 6 | **All filtering and search is client-side over a fully-loaded, unbounded dataset.** No pagination anywhere in the console. | HIGH | `components/editorial/StoryDataTable.tsx:35-42` |
| 7 | **Seven undefined CSS custom properties are referenced 60+ times** (`--bg`, `--bg-elevated`, `--ink-muted`, `--success`, `--error`, `--warning`, `--surface-1`). They are never declared in `:root` or `[data-theme="dark"]`, so those rules resolve to nothing — the console shell, stat tiles, cards and table text fall back to transparent/inherited values. | HIGH | `app/globals.css` (`:root` block lines 3-49); `grep -c` → `--bg-elevated` used 15× in CSS + 5× in TSX, defined 0× |
| 8 | **`deleteArticle` trusts the JWT role and performs no ownership check.** It reads `user.role` from the NextAuth JWT (never refreshed after a role change) instead of re-reading the DB as `upsertArticle` does, and authors can never delete even their own drafts. | HIGH | `app/actions/article.ts` `deleteArticle`, `app/api/auth/[...nextauth]/route.ts` (jwt callback) |
| 9 | **There is no `APPROVED` state.** "Approve" in the review workspace publishes immediately. There is no editorial separation between "content approved" and "content live". | HIGH | `components/editorial/ReviewWorkspace.tsx:104-110` |
| 10 | **No database indexes exist on any Article query column** (`status`, `authorId`, `categoryId`, `publishedAt`, `updatedAt`). `prisma/schema.prisma` contains zero `@@index` directives. | HIGH | `prisma/schema.prisma` |

**Strategic recommendation.** Do not rewrite. The data model is broadly sound (`Article`, `Author`, `Category`, `Tag`, `ArticleRevision`, `AuditLog`, `Notification` already exist). The work is:
1. Close the **state-machine holes** (`APPROVED`, `SCHEDULED`, `ARCHIVED`; first-class review metadata instead of prose in `ArticleRevision.notes`).
2. Move **scoping, filtering, sorting and pagination to the server**, with a single `getArticles()` query contract.
3. Replace `role ===` string checks scattered across 12 files with a **single capability model** (`lib/capabilities.ts`).
4. Rebuild the console UI as a **role-aware, low-chrome editorial surface** — typographic hierarchy and dividers instead of the current `cs-card` boxes — and fix the broken design tokens.

---

# 2. Audit Scope

## 2.1 What was inspected

| Area | Files read |
|---|---|
| Database schema | `prisma/schema.prisma` (complete) |
| Auth | `lib/auth.ts`, `app/api/auth/[...nextauth]/route.ts`, `middleware.ts`, `app/admin/login/page.tsx`, `app/admin/setup/page.tsx`, `app/actions/setup.ts` |
| Authorization | `lib/permissions.ts` (complete), every call site |
| Server actions | `app/actions/article.ts`, `users.ts`, `invitations.ts`, `taxonomy.ts`, `profile.ts`, `comments.ts`, `newsletter.ts`, `setup.ts` |
| Console routes | all 13 files under `app/admin/(authenticated)/` |
| Console layout/nav | `app/admin/(authenticated)/layout.tsx`, `components/editorial/AdminNavLinks.tsx` |
| Editorial components | `ArticleEditor.tsx` (707 lines), `StoryDataTable.tsx`, `ReviewWorkspace.tsx`, `EditorToolbar.tsx`, `DeleteArticleButton.tsx`, `SeoPreview.tsx`, `SlashCommandList.tsx`, TipTap extensions |
| Public routes (for state coupling) | `app/(public)/**`, `app/preview/[id]/page.tsx`, `app/sitemap.ts` |
| Styling | `app/globals.css` (4,110 lines), `postcss.config.mjs`, `next.config.ts` (no `tailwind.config.*` exists — Tailwind v4 `@theme inline`) |
| Config/docs | `package.json`, `tsconfig.json`, `AGENTS.md`, `AGENT_SKILL.md`, `README.md`, `.env.example` |
| Supplementary | `htm_2.html` (277 KB static design prototype), `lib/mockData.ts` |

## 2.2 Supplementary artefacts and conflicts

- **`AGENT_SKILL.md`** describes the project as "**GridX**", claims React 19.0.0/Prisma 6.4.1, and lists a component tree (`AdminHeader`, `QuickNav`, `ArticleReactions`, `components/reading/`, `components/theme/`, `components/ui/AdSlot`, `ShareButton`, `Toast`) that **does not exist in the repository**. It also states `prisma/migrations` exists — it does not (`prisma/` contains only `schema.prisma`).
  **Resolution per instruction: real source code wins.** `AGENT_SKILL.md` is treated as stale and is *not* used as evidence anywhere in this document.
- **`htm_2.html`** is a 277 KB single-file HTML design prototype. Large parts of `app/globals.css` (including the `.console`/`.cs-*` block at lines 2755-3460, still carrying the prototype's 8-space indentation) were pasted from it. This is the origin of the undefined `--bg`/`--bg-elevated` tokens: the prototype used a different variable naming scheme than `globals.css`'s `:root`. It is **evidence of origin**, not of current behaviour.
- **`CLAUDE.md`** contains the single word `AGENTS.md`.
- **No test files exist** (`find . -name "*.test.*"` → empty). No CI config, no `docs/` directory. Therefore `DASHBOARD_CMS_MASTER_PLAN.md` is placed at the repository root.

## 2.3 What could not be verified at runtime

The sandbox has no database credentials (`.env.example` only). All findings are from static source analysis; no query was executed against a live Postgres instance. Query-plan claims (index absence) are read from `schema.prisma`, which is authoritative for what Prisma would create.

---

# 3. Current Architecture

## 3.1 Stack (verified from `package.json`)

- Next.js **16.3.5** App Router, React **19.2.8**, TypeScript strict.
- Prisma **6.19.3** + PostgreSQL (`datasource db` with `url` + `directUrl` → pooled Supabase-style setup).
- NextAuth **4.24.15** with `@next-auth/prisma-adapter`, **Credentials provider only**, **JWT session strategy**.
- TipTap **3.31.3** (StarterKit, Underline, Link, Table suite, CharacterCount, Suggestion) + custom `Figure`, `Callout`, `SlashMenu` extensions.
- `react-hook-form` + `zod` + `@hookform/resolvers`.
- Tailwind CSS **v4** via `@tailwindcss/postcss`. **No `tailwind.config.js/ts` file exists**; tokens are declared with `@theme inline` inside `app/globals.css:71-105`.
- `isomorphic-dompurify` (sanitisation), `resend` (email), `bcryptjs`, `next-themes`, `lucide-react`, `tippy.js`.

## 3.2 Route map (verified — complete)

**Public** (`app/(public)/layout.tsx`)
`/`, `/latest`, `/search`, `/article/[slug]`, `/category/[slug]`, `/tag/[slug]`, `/author/[slug]`, `/page/[slug]`
**Standalone:** `/preview/[id]`, `/invite/[token]`, `/unsubscribe/[token]`, `/robots.txt`, `/sitemap.xml`

**Console** (`app/admin/(authenticated)/layout.tsx`)

| Route | File | Purpose |
|---|---|---|
| `/admin` | `page.tsx` (104 ln) | Overview: 4 stat tiles + top stories + recent drafts |
| `/admin/articles` | `articles/page.tsx` (33 ln) | **Published only** list |
| `/admin/drafts` | `drafts/page.tsx` (40 ln) | `DRAFT` + `REVISION_REQUESTED` list |
| `/admin/submissions` | `submissions/page.tsx` (69 ln) | Review queue |
| `/admin/editor` | `editor/page.tsx` (34 ln) | New story |
| `/admin/editor/[id]` | `editor/[id]/page.tsx` | Edit story |
| `/admin/taxonomy` | `taxonomy/page.tsx` (116 ln) | Categories + tags (create only) |
| `/admin/users` | `users/page.tsx` (146 ln) | Users + pending invitations |
| `/admin/users/invite` | `users/invite/page.tsx` | Invite form |
| `/admin/comments` | `comments/page.tsx` (41 ln) | Comment moderation |
| `/admin/subscribers` | `subscribers/page.tsx` (97 ln) | Newsletter list |
| `/admin/audit-logs` | `audit-logs/page.tsx` (104 ln) | Last 100 audit events |
| `/admin/settings` | `settings/page.tsx` (123 ln) | Public profile + account security tabs |

**Unauthenticated console:** `/admin/login`, `/admin/setup`.

**API routes:** exactly one — `app/api/auth/[...nextauth]/route.ts`. There is **no REST/RPC surface**; every mutation is a server action.

## 3.3 Data flow

Server Components query Prisma directly (`lib/db.ts` singleton). Mutations run as server actions in `app/actions/*`, which call `revalidatePath` on a hardcoded list of paths (`app/actions/article.ts`, end of `upsertArticle`). All console list pages set `export const dynamic = "force-dynamic"` — except `app/admin/(authenticated)/users/page.tsx`, `taxonomy/page.tsx`, `audit-logs/page.tsx`, `comments/page.tsx`, which rely on `revalidatePath` alone.

## 3.4 Data model (verified from `prisma/schema.prisma`)

```
Role          = OWNER | ADMIN | EDITOR | AUTHOR | REVIEWER | MODERATOR | STAFF
ArticleStatus = DRAFT | SUBMITTED | REVIEW | REVISION_REQUESTED | REJECTED | PUBLISHED
```

`Article` fields: `id, slug, previousSlugs[], title, deck, contentHtml, contentJson, author (legacy string), role (legacy string), authorId→Author, categoryId→Category, status, views, legacyTags[], tags[]→Tag, featured, homepagePlacement, img, seoTitle, seoDesc, createdAt, updatedAt, publishedAt, scheduledFor`, relations `revisions[]`, `comments[]`.

`ArticleRevision`: `articleId, userId, title, deck, contentHtml, contentJson, notes, statusChange (free-text "A -> B"), createdAt`.

`AuditLog`: `userId?, action (string), entityType, entityId?, details (Json), createdAt`.

`Notification`: `userId, message, link, isRead, createdAt` — **model exists, zero code references**. `grep -rn "db.notification"` → no matches.

`User.notificationPrefs Json?` — written nowhere; `settings/AccountForm.tsx:45` contains the literal comment `// Add real notification prefs update API call here later`.

**Zero `@@index` directives exist in the entire schema.** The only indexes are the implicit ones from `@id` and `@unique`.

---

# 4. Current Dashboard

Section-by-section audit in the required format.

## 4.1 Console shell / layout

**CURRENT STATUS:** Implemented — `app/admin/(authenticated)/layout.tsx` (102 lines).
**CURRENT BEHAVIOR:** Server component. Redirects to `/admin/login` if `getCurrentUser()` is null. Re-reads the user from the DB with `authorProfile` included. Renders a fixed full-viewport shell:
```tsx
<div className="console open" role="dialog" aria-modal="true"
     style={{ position:'fixed', inset:0, zIndex:9999 }}>
```
Inside: `.cs-top` (logo, "xCipher Editorial Console" tag, SignOut, View site), then `.cs-body` (grid `240px 1fr` ≥900px, single column below), containing `.cs-nav` and `.cs-main`.
**CURRENT ACCESS:** Any authenticated user of **any** role, including `STAFF`. The layout performs **no role check at all** — only `canView*` booleans passed down to the nav for link visibility.
**CURRENT PROBLEMS:**
- `role="dialog" aria-modal="true"` on the entire application shell: assistive technology treats the whole console as a modal dialog with no close affordance and no focus owner. `aria-label="xCipher editorial console"` is applied to a non-dialog.
- `position: fixed; inset: 0` as an inline style defeats the stylesheet, prevents normal document scroll, and `z-index: 9999` sits above every other layer including toasts.
- `.console { background: var(--bg) }` (`globals.css:2759`) — **`--bg` is never defined**. The shell has no background of its own and shows `body { background: var(--paper) }` through.
- `.cs-nav { background: var(--bg-elevated) }` (`globals.css:2817`) — **undefined**, so the sidebar is transparent and only the `border-right` distinguishes it.
- No skip-link, no landmark `<main>` (it is a `<div className="cs-main">`), no breadcrumb, no page-level `<header>` pattern.
**CURRENT MISSING FEATURES:** global search, notifications bell (the `Notification` model exists and is unused), quick-create menu, keyboard shortcuts, breadcrumbs, mobile drawer (see 12.2), theme toggle inside the console (`ThemeToggle` exists but is only mounted in `components/layout/SiteHeader.tsx`).

## 4.2 Sidebar / navigation

**CURRENT STATUS:** Implemented — `components/editorial/AdminNavLinks.tsx` (113 lines, `"use client"`).
**CURRENT BEHAVIOR:** A flat, ungrouped list of up to 10 links, active state by `usePathname()` equality. Order: Dashboard, Articles (label switches to `"My Stories"` when `userRole === "AUTHOR"`, else `"All Stories"`), Drafts, Review Queue*, New Story, Settings, Taxonomy*, Users*, Comments*, Subscribers*, Audit Logs*. Starred items are gated by booleans computed in the layout from `lib/permissions.ts`.
Above the links, `.cs-profile-card` links to `/admin/settings` showing avatar, name, headline and an uppercase role badge.
**CURRENT ACCESS:** Visibility booleans: `canViewReviewQueue` (OWNER/ADMIN/EDITOR/REVIEWER) gates **both** Review Queue **and** Taxonomy; `canViewUsersList` (≥ADMIN); `canModerateComments` (≥MODERATOR — note the hierarchy makes this OWNER/ADMIN/EDITOR/MODERATOR, **not** REVIEWER/AUTHOR); `canViewSubscribers` (≥ADMIN); `canViewAuditLogs` (≥ADMIN).
**CURRENT PROBLEMS:**
- **Taxonomy link is gated by `canViewReviewQueue`** (`AdminNavLinks.tsx`, the `{canReview && ...}` block wrapping `/admin/taxonomy`), so a `REVIEWER` is shown the Taxonomy link, but `app/admin/(authenticated)/taxonomy/page.tsx:11` redirects anyone not in `[OWNER, ADMIN, EDITOR]` back to `/admin`. **UI and server disagree — a guaranteed dead link for REVIEWER.**
- `STAFF` sees Dashboard, Articles, Drafts, **New Story** and Settings, but `canEditArticle` rejects `STAFF`, so "New Story" leads to an editor whose every save fails.
- Flat list, no grouping; every item has equal visual weight.
- Active detection uses `pathname === "/admin/articles"` (exact), so `/admin/editor/[id]` highlights nothing and the user loses their place.
- Icons are hand-inlined SVG duplicated per link (~60 lines of markup) despite `lucide-react` being a dependency.
- No counts/badges (pending reviews, changes requested) — the nav carries no operational signal.
- On <900px `.cs-nav` becomes a horizontally scrolling strip (`globals.css:2815-2832`) and `.cs-profile-card { display:none }` below 900px (`globals.css:2834+`, unhidden at `@media(min-width:900px)`).
**CURRENT MISSING FEATURES:** grouping, counts, collapsed/icon mode, mobile drawer, "My work" vs "Publication" separation, keyboard navigation beyond native tab order.

## 4.3 Dashboard overview (`/admin`)

**CURRENT STATUS:** Implemented — `app/admin/(authenticated)/page.tsx` (104 lines).
**CURRENT BEHAVIOR:** Computes `isAuthorOnly = user?.role === "AUTHOR"`. Builds `wherePublished`/`whereDraft`, scoping to `authorId` **only for `AUTHOR`**. Then:
- `publishedCount` = count(PUBLISHED), `draftsCount` = count(DRAFT)
- `totalArticles = publishedCount + draftsCount` — **arithmetic that silently omits `SUBMITTED`, `REVIEW`, `REVISION_REQUESTED`, `REJECTED`**. The headline "Total articles" number is wrong for any publication with work in review.
- `totalViews` = `aggregate _sum.views` over published
- `topStories` = top 5 published by `views` (`include: { category: true }`)
- `latestDrafts` = 5 most recent drafts by `updatedAt`
Renders `.cs-stats` (4 `.stat` tiles) then `.cs-split` with two `.cs-card`s.
**CURRENT ACCESS:** Every authenticated role. `OWNER`, `ADMIN`, `EDITOR`, `REVIEWER`, `MODERATOR`, `STAFF` all receive **byte-identical** output.
**CURRENT PROBLEMS:**
- Only two variants exist (AUTHOR vs everyone-else). An editor's home page shows "Top stories by reads" — a vanity metric — and **no review queue count**, which is the one number an editor needs.
- `.cs-split` is referenced in JSX but **`.cs-split` is not defined anywhere in `globals.css`** (the defined grid class is `.cs-grid2`, `globals.css:3063-3073`). The two cards therefore stack as plain block elements at all widths instead of forming the intended 1.2fr/1fr grid.
- `.cs-stats` is `grid-template-columns: repeat(2,1fr)` and `repeat(5,1fr)` ≥1100px (`globals.css:3019-3029`) but only **4** tiles are rendered → a permanent empty fifth column on desktop.
- `.stat { background: var(--bg-elevated) }` — undefined token, tiles have no surface.
- `.stat .s-d { color: #5f9e7c }` — a hardcoded green hex, not a token, used for neutral descriptive text ("Drafts queued") that is not a positive delta.
- Errors are swallowed: `catch (error) { console.error(...) }` leaves all counters at `0`, so a database outage renders as a legitimate-looking empty publication. No error state.
- Nothing on this page is actionable for a reviewer/editor: no pending count, no changes-requested count, no scheduled list, no recently-published list, no stale-draft detection.
**CURRENT MISSING FEATURES:** role-specific widgets, review SLA/ageing, scheduled queue, editorial activity feed, system alerts, empty/loading/error states.

## 4.4 Articles section (`/admin/articles`)

**CURRENT STATUS:** Implemented — 33 lines.
**CURRENT BEHAVIOR:**
```ts
articles = await db.article.findMany({
  where: isAuthorOnly ? { status: "PUBLISHED", authorId: authorId || "none" }
                      : { status: "PUBLISHED" },
  orderBy: { createdAt: "desc" },
  include: { category: true, authorModel: true },
});
```
Heading `"All Published Stories"` / `"My Published Stories"`, a count line, then `<StoryDataTable showStatusBadge={false} />`.
**CURRENT ACCESS:** Every authenticated role; `AUTHOR` is scoped to own articles via `authorId`. `REVIEWER`, `MODERATOR`, `STAFF` see **all** published articles.
**CURRENT PROBLEMS:**
- **This page is not "Articles". It is "Published".** There is no unified article index. Combined with §4.5, the console can display `PUBLISHED`, `DRAFT` and `REVISION_REQUESTED` — and nothing else. `SUBMITTED`, `REVIEW` and `REJECTED` articles are unreachable except through the review queue (which excludes `REJECTED`).
- No `select` → every row carries `contentHtml` and `contentJson` (potentially 50 KB each, `CharacterCount.configure({ limit: 50000 })`) into a client component payload.
- No `take`/`skip` → the whole published archive is fetched on every navigation.
- `authorId || "none"` is a sentinel string: an author who has no `Author` profile row silently matches nothing. New users created via `setupOwner` or `updateUserRole` have `authorId = null` until they save a profile (`app/actions/profile.ts`), so **a brand-new author's own articles can be invisible to them**.
- Ordered by `createdAt`, while the table column shows `updatedAt` — sort and displayed date disagree.
- No image, no excerpt, no publication date column.
**CURRENT MISSING FEATURES:** unified index, server filtering/sorting/pagination, thumbnails, publication date, bulk actions, saved views.

## 4.5 Drafts (`/admin/drafts`)

**CURRENT STATUS:** Implemented — 40 lines.
**CURRENT BEHAVIOR:** `status in [DRAFT, REVISION_REQUESTED]`, `orderBy updatedAt desc`, author-scoped for `AUTHOR`. Renders a `+ New story` button and `<StoryDataTable showStatusBadge />`.
**CURRENT ACCESS:** All roles. Non-authors see **everyone's** drafts, including `REVIEWER`, `MODERATOR` and `STAFF`, who cannot edit them.
**CURRENT PROBLEMS:** Conflates two semantically distinct states — "I haven't finished this" (`DRAFT`) and "an editor sent this back to me" (`REVISION_REQUESTED`) — in one undifferentiated list with no reason text, no reviewer name and no requested-change surface. An author cannot tell *why* an item is in the list without opening it and scrolling to the Review Workspace timeline.
**CURRENT MISSING FEATURES:** separate "Changes requested" view with the reviewer's note inline; "last submitted" timestamp; stale-draft indicator.

## 4.6 Review queue (`/admin/submissions`)

**CURRENT STATUS:** Implemented — 69 lines, 45 of which are an inline permission-denied card.
**CURRENT BEHAVIOR:** Guards with `canViewReviewQueue(user.role)`; on failure renders a large centred card (inline-styled, ~40 lines) offering "Return to Dashboard" / "Switch Account". On success: `status in [SUBMITTED, REVIEW, REVISION_REQUESTED]`, `orderBy updatedAt desc`, **no author scoping**, into `StoryDataTable`.
**CURRENT ACCESS:** OWNER, ADMIN, EDITOR, REVIEWER.
**CURRENT PROBLEMS:**
- `REJECTED` is excluded → rejected work vanishes from the product (Finding #2).
- `REVISION_REQUESTED` is included → items the editor has already actioned and bounced back to the author stay in the editor's inbox, so the queue never reaches zero and stops functioning as an inbox.
- No submission timestamp. `Article` has no `submittedAt` column; `updatedAt` is used as a proxy and is mutated by every autosave, so **queue ordering is by last keystroke, not by submission time**. Ageing/SLA is impossible.
- No indication of who reviewed an item previously, no claim/assignment, no priority.
- Reviewing requires leaving the queue and opening the full editor.
- The permission-denied UI is duplicated near-verbatim in `users/page.tsx` and `audit-logs/page.tsx` (three copies of ~40 lines of inline-styled JSX).
**CURRENT MISSING FEATURES:** `submittedAt`, reviewer assignment, inline preview, decision from the queue, filters, ageing, empty-state guidance.

## 4.7 Article list component (`StoryDataTable`)

**CURRENT STATUS:** Implemented — `components/editorial/StoryDataTable.tsx`, 127 lines, `"use client"`.
**CURRENT BEHAVIOR:** `type Article = any`. Derives category and status option lists from the loaded rows with `useMemo`. Client-filters on: title **or** legacy `author` string contains search; exact status match; exact `category.name` match. Renders a `<table>` inside `<div className="cs-card" style={{overflowX:"auto"}}>` with columns **Title · Category · Author · [Status] · Updated · Reads · Actions**. Actions: `View` (published only, new tab), `Edit`/`Open` → `/admin/editor/{id}`, and `<DeleteArticleButton>` when `userRole !== "AUTHOR"`.
**CURRENT PROBLEMS:**
- **No image column.** The design brief requires thumbnails; `Article.img` is never rendered in any list.
- **No excerpt** (`deck` is never shown in lists).
- **Filters are derived from loaded data**, so "All Categories" only lists categories that happen to appear on the current page of results; a category with zero matching articles cannot be selected, and the filter set changes as the data changes.
- **Search misses the relational author.** It matches `a.author` (the legacy denormalised string) but not `a.authorModel.name`, and not `slug`, `deck` or tags.
- Status filter offers raw enum values (`REVISION_REQUESTED`) as user-facing labels.
- Status badge colours are a ternary chain with **hardcoded rgba** and references to undefined `--success`/`--warning`/`--muted`-as-colour; everything that is not `PUBLISHED` or `DRAFT` renders amber, so `REJECTED` looks identical to `SUBMITTED`.
- Badge conveys state by **colour + uppercase enum only** — no icon, no accessible text alternative.
- `<td style={{ display: "flex" }}>` on the actions cell — a flex table cell, which breaks row/cell alignment semantics and is invalid layout for `<td>`.
- Every cell is inline-styled; there is no `.cs-table` class in `globals.css` (only an unrelated `.admin-table` used by `taxonomy/page.tsx`).
- `overflowX: auto` on mobile gives a 7-column table in a horizontal scroller — the brief explicitly rejects this.
- Delete button hidden for `AUTHOR` in UI **and** blocked server-side — consistent, but it means an author can never remove their own abandoned draft.
- No sorting controls, no pagination, no selection, no bulk operations, no row link on the title (the title is plain text; only the small `Open` chip navigates).
**CURRENT MISSING FEATURES:** everything in §20.

## 4.8 Article editor (`/admin/editor`, `/admin/editor/[id]`)

**CURRENT STATUS:** Implemented — `components/editorial/ArticleEditor.tsx`, 707 lines, `"use client"`.
**CURRENT BEHAVIOR:**
- TipTap with StarterKit, Underline, `Figure`, `Callout`, Link, Table/Row/Cell/Header, CharacterCount (50 000 limit) and a `/` SlashMenu rendered through `tippy.js`.
- `react-hook-form` + `zodResolver(articleSchema)`. `articleSchema` enumerates all six statuses and validates `img` against `ALLOWED_MEDIA_DOMAINS`.
- **Autosave:** a `watch()` subscription resets a 5 s `setTimeout` on *any* field change and then calls `handleSave(status, true)`.
- **Pre-flight checks** (manual saves to `SUBMITTED`/`PUBLISHED` only): title non-empty, `deck` ≥ 10 chars, body ≥ 50 words.
- `beforeunload` guard when autosave is pending or errored.
- Fields: title (auto-slug until slug touched), slug, category `<select>` from DB, **author and author role are `readOnly`** and sourced from the profile, `scheduledFor` (only if `canPublish`), `featured` checkbox, `homepagePlacement` select (only if `canPublish`), deck textarea, featured-image URL + preview `<img>`, tags as a checkbox grid, SEO title/description + `<SeoPreview>`, body editor with word count and `~n min read`.
- Footer actions are state-driven: `DRAFT`/`REVISION_REQUESTED` → **Save Draft** + **Submit for Review**; `PUBLISHED` && `canPublish` → **Unpublish** (saves as `DRAFT` with note "Unpublished by editor") + **Update Live**. `canPublish = ["OWNER","ADMIN","EDITOR"].includes(userRole)`.
- `<ReviewWorkspace>` is rendered only when `initialData?.id` exists.
- A **"Apply Template…" `<select>`** and a `fillTestData()` function that injects lorem content, a hardcoded Pexels URL and the author name "Elena Rostova".
**CURRENT ACCESS:** `/admin/editor/[id]` calls `canEditArticle` and redirects to `/admin/drafts` on failure. `/admin/editor` (new) has **no role gate** — a `STAFF`/`REVIEWER`/`MODERATOR` user can open it and compose, and only discovers on save that `canEditArticle` rejects them.
**CURRENT PROBLEMS:**
- **`SUBMITTED`, `REVIEW` and `REJECTED` render no footer actions at all.** The `DRAFT|REVISION_REQUESTED` branch and the `PUBLISHED && canPublish` branch are the only two. An author who has submitted sees a Preview button and nothing else; an editor viewing a `SUBMITTED` article must use the Review Workspace embedded halfway down the form. There is **no visible "Save" for an editor editing a submitted piece**.
- **Dead constant:** `EDITOR_CATEGORIES` (lines 32-40) is declared and never referenced; categories come from the DB.
- **`fillTestData` and the template `<select>` ship to production** in the main editor toolbar.
- **Tags are broken by double registration.** `{...register("tags")}` is applied both to each checkbox (`value={tag.slug}`) and to a `<input type="hidden" {...register("tags")} />` immediately after (lines ~630-640). RHF cannot reconcile a checkbox group and a hidden text input on the same name; `handleSave` then does `rawTags.split(",")` assuming a string. Initial values are built with `initialData.tags.join(", ")` — but `initialData.tags` from `editor/[id]/page.tsx` is **not included** in the Prisma query (`include: { category: true, revisions: {...} }`), so it is `undefined` and tags never pre-populate on edit.
- **Autosave fires on programmatic `setValue`.** `handleTitleChange` calls `setValue("slug", ...)` which retriggers `watch`, and `reset()` from the template/test-data path triggers a save cascade.
- **Autosave silently discards write conflicts.** `upsertArticle` returns a conflict error; the client branch for `isAutosave` takes `result.serverUpdatedAt`, resets the baseline and displays **"✓ Saved"** — a false success on a rejected write (`ArticleEditor.tsx`, autosave error branch). This is a data-loss-adjacent UX lie.
- Author/role inputs are made read-only with `style={{ cursor:"not-allowed" }}` rather than the `disabled` attribute or `aria-readonly` messaging.
- The whole 707-line component is one client bundle: TipTap + tippy + all extensions load for anyone who opens `/admin/editor`.
**CURRENT MISSING FEATURES:** editor-facing save on submitted items, autosave correctness, media library (URL-only input), revision diff/restore (revisions are written but only `notes`/`statusChange` are ever read), co-editing/locking, word-count targets, internal notes separate from review notes.

## 4.9 Review workspace

**CURRENT STATUS:** Implemented — `components/editorial/ReviewWorkspace.tsx`, 135 lines, `"use client"`, embedded inside the editor form.
**CURRENT BEHAVIOR:** `canReview = ["OWNER","ADMIN","EDITOR","REVIEWER"].includes(userRole)`. Renders an activity timeline from `initialRevisions` (user, timestamp, `statusChange` chip, `notes` blockquote) and, if `canReview && status !== "PUBLISHED"`, a notes `<textarea>` plus three buttons: **Approve & Publish** → `PUBLISHED`, **Request Revision** → `REVISION_REQUESTED` (client-side `alert()` if notes are empty), **Reject** → `REJECTED` (no reason required). Each calls `onDecision(status, notes)` → `handleSave(status, false, notes)` → `upsertArticle`.
**CURRENT PROBLEMS:**
- **REVIEWER cannot actually action anything** (Finding #4): `canEditArticle` has no `REVIEWER` branch and falls through to `"Role is not permitted to edit articles."`. The UI offers three buttons that always fail.
- **Approve == Publish.** No `APPROVED` state, so approval and publication cannot be separated, cannot be done by different people, and cannot be scheduled.
- **Reject requires no reason.** Only `REVISION_REQUESTED` is guarded, and that guard is a client-side `alert()` with **no server-side equivalent** — `upsertArticle` accepts `status: "REVISION_REQUESTED"` with `notes: null`.
- **Review metadata is not modelled.** Reviewer, decision, reason and previous status exist only as `ArticleRevision.notes` (free text) and `statusChange` (the string `"DRAFT -> SUBMITTED"`). There is no `reviewedById`, `reviewedAt`, `rejectionReason` or `decision` column, so none of it is queryable, filterable or displayable in a list.
- `alert()` is used for validation; the rest of the app uses `showToast`.
- `articleId` is accepted as a prop and never used.
- The panel is buried inside the long edit form — an editor must scroll past SEO and the body to make a decision.

## 4.10 Users (`/admin/users`)

**CURRENT STATUS:** Implemented — 146 lines.
**CURRENT BEHAVIOR:** `canViewUsersList` guard (≥ADMIN) else the inline denied card. Lists all users (`orderBy email asc`, no pagination) as `.cs-row`s with name, email, role, and — when `canManageUser(actor, target).success && user.id !== currentUser.id` — an inline `<form>` with a role `<select>` + Save, and a second form with a **"Revoke"** button that calls `deleteUser`.
**CURRENT ACCESS:** OWNER, ADMIN.
**CURRENT PROBLEMS:**
- The role `<select>` offers only AUTHOR, REVIEWER, EDITOR, ADMIN (+OWNER for owners). **`MODERATOR` and `STAFF` can be granted by invitation (`InviteForm.tsx:83-84`) but can never be set or changed here** — a moderator's role cannot be edited without a direct DB write.
- **"Revoke" performs `db.user.delete`** (`app/actions/users.ts`), a hard delete, with **no confirmation dialog** — a single click destroys the user row. `ConfirmDialog` exists in the codebase and is not used here. `User → Author` is a nullable relation so the author profile survives, but `ArticleRevision.userId` is a required non-cascading relation — deleting a user who has ever saved an article will throw a foreign-key error, so the button both is too destructive *and* fails unpredictably.
- No search, no filter, no pagination, no last-login, no invitation resend, no user detail page.
- Role changes take effect only on the user's **next sign-in**: the session role lives in the JWT (`jwt` callback copies `user.role` once at login) and is never re-read. A demoted admin keeps admin UI and any JWT-trusting server action until the token expires.

## 4.11 Authors

**CURRENT STATUS:** **Does not exist as a console section.** There is no `/admin/authors` route.
**CURRENT BEHAVIOR:** `Author` rows are created/updated **only** as a side effect of a user editing their own profile at `/admin/settings` (`app/actions/profile.ts` `updateProfile`, which derives the slug from the name and maintains `previousSlugs`). The public `/author/[slug]` page reads them.
**CURRENT ACCESS:** A user can edit only their own author profile. `role` and `verifiedTitle` are restricted to OWNER/ADMIN inside `updateProfile` (`isEditorialAdmin` check).
**CURRENT PROBLEMS:** No admin can list, create, merge, deactivate or reassign authors. Guest/freelance bylines with no login account are impossible. `Article.author` (string) and `Article.authorId` can diverge — `upsertArticle` writes `author: data.author?.trim() || user.name` and `authorId` separately, and for non-AUTHOR roles `authorId` is taken **from the client payload** with no validation that the id exists.

## 4.12 Categories & tags (`/admin/taxonomy`)

**CURRENT STATUS:** Partially implemented — 116 lines.
**CURRENT BEHAVIOR:** Hard redirect to `/admin` unless role ∈ `[OWNER, ADMIN, EDITOR]`. Two side-by-side `<section className="admin-card">` blocks in an inline `grid-template-columns: 1fr 1fr`. Each has a create form (name + optional description) and a read-only table of name + slug.
**CURRENT PROBLEMS:** **Create only** — `app/actions/taxonomy.ts` exports `getCategories`, `getTags`, `createCategory`, `createTag` and nothing else. No rename, no delete, no merge, no description editing, no article counts, no reordering. A typo in a category name is permanent through the UI. The inline `1fr 1fr` grid has no media query → two cramped columns on mobile. `.admin-page`, `.admin-header`, `.admin-card`, `.admin-table` are used here and **nowhere else in the console — and none of them are defined in `app/globals.css`** (verified: `grep -c "\.admin-card" app/globals.css` → 0). The entire Taxonomy page is therefore **completely unstyled** apart from `.ed-input`, `.btn-cs` and inline styles.

## 4.13 Media

**CURRENT STATUS:** **Does not exist.** No upload, no storage integration, no library.
**CURRENT BEHAVIOR:** Images are **remote URLs pasted into a text input**, validated against `ALLOWED_MEDIA_DOMAINS` (`lib/sanitize.ts`) and mirrored in `next.config.ts` `images.remotePatterns` (pexels, unsplash, plus.unsplash, avatars.githubusercontent, lh3.googleusercontent, upload.wikimedia).
**CURRENT PROBLEMS:** The publication has no owned media. Every image is a hotlink to a third party that can rotate or remove it. No alt-text field exists on `Article.img`. No focal point, no variants, no reuse.

## 4.14 Comments (`/admin/comments`)

**CURRENT STATUS:** Implemented and, of all console sections, the most complete — `page.tsx` (41) + `CommentsQueueClient.tsx` (57) + `CommentModerationRow.tsx` (118) + `app/actions/comments.ts` (196).
**CURRENT BEHAVIOR:** Status tabs, per-row Approve/Reject/Spam with moderator notes, `hasRequiredRole(role, "MODERATOR")` enforced **server-side inside the action** (`comments.ts:130`, `:168`), raw email never returned to public clients (`emailHash` for Gravatar), IP hashed, rate limiting via `lib/rateLimit.ts`.
**CURRENT PROBLEMS:** Uses `var(--error, #e53e3e)` — correctly supplying a fallback, unlike the rest of the console, which proves the token gap was known. Otherwise sound; this module should be the **pattern to copy** for article moderation.

## 4.15 Subscribers, audit log, settings

- **Subscribers** (`/admin/subscribers`, 97 lines): 4 counts + 50 most recent active. `canViewSubscribers` (≥ADMIN) with a `redirect("/admin")`. Read-only; no export, no search, no manual unsubscribe.
- **Audit log** (`/admin/audit-logs`, 104 lines): last 100 events, no filter/search/pagination/date range. Actions written today: `CREATE_ARTICLE_*`, `UPDATE_ARTICLE_*`, `DELETE_ARTICLE` (`app/actions/article.ts`), `UPDATE_USER_ROLE`, `DELETE_USER` (`app/actions/users.ts`), and invitation events (`app/actions/invitations.ts`). **Nothing is logged for taxonomy, profile, comments or subscribers.** `logAudit` is duplicated verbatim in `article.ts` and `invitations.ts`.
- **Settings** (`/admin/settings`, 123 lines + `ProfileForm` 319 + `AccountForm` 113): tabs via `?tab=`; public author profile (name, headline, overview, bio, avatar, location, website, socials, expertise, disclosure) and account security. **Personal only — there are no publication-level settings anywhere in the product** (site title, default category, review policy, schedule policy, roles config).

## 4.16 Analytics / SEO / Editorial activity

- **Analytics:** does not exist. The only metric is `Article.views` (incremented nowhere in the console; see `app/(public)/article/[slug]/page.tsx` for read usage).
- **SEO:** per-article only — `seoTitle`, `seoDesc` and `SeoPreview` inside the editor, plus `app/robots.ts`, `app/sitemap.ts` and `lib/seo.ts`. No site-level SEO screen, no redirect manager (`previousSlugs` handles redirects silently in `article/[slug]/page.tsx:32`).
- **Editorial activity:** no feed. `ArticleRevision` rows exist per article but are only rendered inside that article's Review Workspace.

## 4.17 Publishing controls

**CURRENT STATUS:** Partial.
**CURRENT BEHAVIOR:** `upsertArticle` sets `publishedAt = new Date()` the first time `status === "PUBLISHED"` and `publishedAt` is null; clears `scheduledFor` whenever status becomes `PUBLISHED` or `DRAFT`; downgrades a `PUBLISHED` request to `SUBMITTED` when `canPublishArticle` fails. `featured` and `homepagePlacement` are editable by publishers.
**CURRENT PROBLEMS:** `homepagePlacement` is written and **never read** — `app/(public)/page.tsx:30` selects the lead story with `mappedArticles.find(a => a.featured)`. The Hero/Featured/Editor's Picks control in the editor does nothing. Unpublish is implemented as "save as `DRAFT`", which destroys the distinction between "never published" and "withdrawn", while leaving `publishedAt` populated.

---

# 5. Current Routes — consolidated table

| Route | Guard (server) | Effective access | Scoping | Notes |
|---|---|---|---|---|
| `/admin/*` | `middleware.ts` `withAuth`, matcher `"/admin/((?!login\|setup).*)"` | authenticated | — | Authentication only, **no role check in middleware** |
| `/admin` (layout) | `getCurrentUser()` + redirect | any role incl. STAFF | — | No role gate |
| `/admin` | none beyond layout | all roles | AUTHOR → own | Identical output for 6 of 7 roles |
| `/admin/articles` | none | all roles | AUTHOR → own | `PUBLISHED` only |
| `/admin/drafts` | none | all roles | AUTHOR → own | `DRAFT`+`REVISION_REQUESTED` |
| `/admin/submissions` | `canViewReviewQueue` inline | OWNER/ADMIN/EDITOR/REVIEWER | none | `REJECTED` excluded |
| `/admin/editor` | **none** | all roles | — | STAFF/REVIEWER/MODERATOR can open, cannot save |
| `/admin/editor/[id]` | `canEditArticle` + redirect | OWNER/ADMIN/EDITOR + owning AUTHOR | ownership | Redirects to `/admin/drafts` |
| `/admin/taxonomy` | inline `["OWNER","ADMIN","EDITOR"]` + redirect | OWNER/ADMIN/EDITOR | — | **Nav shows it to REVIEWER → dead link** |
| `/admin/users` | `canViewUsersList` inline | OWNER/ADMIN | — | |
| `/admin/users/invite` | `canAssignRole` in action | OWNER/ADMIN | — | |
| `/admin/comments` | `canModerateComments` + per-action `hasRequiredRole` | OWNER/ADMIN/EDITOR/MODERATOR | — | Best-practice example |
| `/admin/subscribers` | `canViewSubscribers` + redirect | OWNER/ADMIN | — | |
| `/admin/audit-logs` | `canViewAuditLogs` inline | OWNER/ADMIN | — | |
| `/admin/settings` | auth only | all roles | self | |
| `/preview/[id]` | `canEditArticle \|\| canViewReviewQueue` | editors/reviewers/owning author | — | Not under `/admin`, **not covered by `middleware.ts`** — it performs its own check, which is correct, but the matcher gap is worth noting |

---

# 6. Current Roles

Seven roles exist (`prisma/schema.prisma` `enum Role`) with a numeric hierarchy in `lib/permissions.ts`:

| Role | Weight | Where it is actually honoured |
|---|---|---|
| `OWNER` | 100 | everywhere |
| `ADMIN` | 90 | everywhere except `canManageUser`/`canAssignRole` on OWNER targets |
| `EDITOR` | 80 | edit/publish/delete any article, taxonomy, review queue, comments (via ≥MODERATOR) |
| `MODERATOR` | 70 | comments only; **has no article capability**, yet outranks REVIEWER in the hierarchy |
| `REVIEWER` | 60 | review queue **visibility only** — cannot edit, cannot publish, cannot delete, and its review buttons fail |
| `AUTHOR` | 50 | default role (`User.role @default(AUTHOR)`); own-article edit |
| `STAFF` | 10 | `canViewAdminPanel` threshold; no capability, but full console shell + drafts/articles read |

**Key structural problems.**
1. **The hierarchy is wrong for the product.** `MODERATOR` (70) > `REVIEWER` (60) means `hasRequiredRole(role, "MODERATOR")` grants comment moderation to EDITOR/ADMIN/OWNER (intended) while `REVIEWER`, a senior editorial role, ranks below a community moderator.
2. **A linear hierarchy cannot express the real matrix.** Comment moderation and article review are orthogonal axes, forced onto one number.
3. **There is no CONTRIBUTOR role**, despite the product brief. `AUTHOR` is currently the lowest content role and it *can* be published-by-others but cannot self-publish — which is the contributor semantic. There is no role for "trusted staff writer who can publish own work".
4. **`STAFF` is a trap role**: full shell access, "New Story" in the nav, zero capability.
5. **Role strings are compared inline in at least 12 places** outside `lib/permissions.ts`: `taxonomy/page.tsx:11`, `app/actions/taxonomy.ts:9`, `app/actions/profile.ts` (`isEditorialAdmin`), `ReviewWorkspace.tsx:25`, `ArticleEditor.tsx:478`, `admin/page.tsx:21`, `articles/page.tsx:14`, `drafts/page.tsx:14`, `StoryDataTable` (`userRole !== "AUTHOR"`), `AdminNavLinks` (`userRole === "AUTHOR"`), `app/actions/article.ts` (`dbUser.role === "AUTHOR"`), `users/page.tsx` (`currentUser.role === "OWNER"`).

---

# 7. Current Permissions — verified matrix

Legend: ✅ allowed · ❌ denied · ⚠️ UI shows it but the server denies it (broken) · 👤 own only · — not applicable

| Capability | OWNER | ADMIN | EDITOR | MODERATOR | REVIEWER | AUTHOR | STAFF | Evidence |
|---|---|---|---|---|---|---|---|---|
| Open console | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | `layout.tsx` (auth only) |
| See dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ 👤 | ✅ | `admin/page.tsx:21` |
| See all published | ✅ | ✅ | ✅ | ✅ | ✅ | 👤 | ✅ | `articles/page.tsx:17` |
| See all drafts | ✅ | ✅ | ✅ | ✅ | ✅ | 👤 | ✅ | `drafts/page.tsx:17` |
| See submitted/rejected | ✅* | ✅* | ✅* | ❌ | ✅* | ❌ | ❌ | *review queue; `REJECTED` nowhere |
| Open new editor | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | ✅ | ⚠️ | `editor/page.tsx` ungated |
| Create article | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | `canEditArticle` |
| Edit any article | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | `canEditArticle` |
| Edit own article | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | `canEditArticle` AUTHOR branch |
| Submit for review | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ 👤 | ❌ | editor footer |
| Approve (=publish) | ✅ | ✅ | ✅ | ❌ | ⚠️ | ❌ | ❌ | `ReviewWorkspace:25` vs `canEditArticle` |
| Request changes | ✅ | ✅ | ✅ | ❌ | ⚠️ | ❌ | ❌ | same |
| Reject | ✅ | ✅ | ✅ | ❌ | ⚠️ | ❌ | ❌ | same |
| Publish | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | `canPublishArticle` |
| Schedule | ⚠️ | ⚠️ | ⚠️ | ❌ | ❌ | ❌ | ❌ | field saved, **never executed** |
| Unpublish | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | "save as DRAFT" |
| Delete article | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | `canDeleteArticle`, **no ownership check** |
| Delete own draft | ✅ | ✅ | ✅ | — | — | **❌** | — | authors cannot |
| Manage users | ✅ | ✅ (not OWNER) | ❌ | ❌ | ❌ | ❌ | ❌ | `canManageUser` |
| Assign roles | ✅ all | ✅ not OWNER | ❌ | ❌ | ❌ | ❌ | ❌ | `canAssignRole`; UI omits MODERATOR/STAFF |
| Invite users | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | `inviteUser` |
| Manage taxonomy | ✅ create | ✅ create | ✅ create | ❌ | ⚠️ nav | ❌ | ❌ | `canManageTaxonomy` |
| Moderate comments | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | `hasRequiredRole(…, "MODERATOR")` |
| View subscribers | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | `canViewSubscribers` |
| View audit logs | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | `canViewAuditLogs` |
| Edit own profile | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | `updateProfile` |
| Edit `role`/`verifiedTitle` on profile | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | `isEditorialAdmin` |
| Publication settings | — | — | — | — | — | — | — | **feature does not exist** |

**Server-side enforcement quality:**

| Action | Re-reads role from DB | Ownership checked | Verdict |
|---|---|---|---|
| `upsertArticle` | ✅ `db.user.findUnique` | ✅ via `canEditArticle` | Sound |
| `deleteArticle` | ❌ **uses JWT `user.role`** | ❌ none | **Weak** |
| `updateUserRole` | ❌ JWT | ✅ target compared | Weak (stale role) |
| `deleteUser` | ❌ JWT | ✅ self-guard | Weak + hard delete |
| `createCategory`/`createTag` | ❌ JWT | — | Weak |
| `updateProfile` | ❌ JWT for `isEditorialAdmin` | ✅ self | Weak |
| comment moderation | ❌ JWT | — | Acceptable (also re-checked per action) |

Because the session is JWT-based and the `jwt` callback only copies `role` at sign-in, **every action that reads `user.role` from the session is operating on a potentially stale role**.

---

# 8. Current Article Workflow

## 8.1 States actually reachable

| State | How it is entered | Where it is visible |
|---|---|---|
| `DRAFT` | default; "Save Draft"; **Unpublish** | `/admin/drafts` |
| `SUBMITTED` | "Submit for Review"; **also** a silent downgrade when a non-publisher tries to publish (`article.ts`: `if (statusVal === "PUBLISHED" && !publishPolicy.success) statusVal = "SUBMITTED"`) | `/admin/submissions` only |
| `REVIEW` | **unreachable** — no code path ever writes it | `/admin/submissions` (would show) |
| `REVISION_REQUESTED` | "Request Revision" | `/admin/drafts` **and** `/admin/submissions` |
| `REJECTED` | "Reject" | **nowhere** |
| `PUBLISHED` | "Approve & Publish" / "Update Live" / direct publish | `/admin/articles` + public site |

## 8.2 Actual transition graph

```
                 (any non-publisher saving as PUBLISHED)
                          ┌──────────────────────┐
                          ▼                      │
  [new] ──create──▶ DRAFT ──Submit──▶ SUBMITTED ─┤
                     ▲  ▲                 │
       Unpublish ────┘  │                 ├── Approve & Publish ──▶ PUBLISHED ──Update Live──▶ PUBLISHED
                        │                 ├── Request Revision ───▶ REVISION_REQUESTED ──Submit──▶ SUBMITTED
                        │                 └── Reject ─────────────▶ REJECTED  ✖ (terminal, invisible)
                        └────────────── Unpublish (PUBLISHED ▶ DRAFT)

  REVIEW : declared in the enum, never written
  SCHEDULED : does not exist; scheduledFor is stored and never acted on
```

## 8.3 What is persisted on a transition

Every transition goes through the **same** `upsertArticle` call, so it writes the *entire article payload* — there is no dedicated transition action. Persisted:
- `Article.status`
- `Article.publishedAt` (only on first publish)
- `Article.scheduledFor` (nulled on `PUBLISHED`/`DRAFT`)
- `Article.updatedAt` (Prisma `@updatedAt`)
- one `ArticleRevision` **on every save including autosave** — with `title`, `deck`, `contentHtml`, `contentJson`, `notes`, and `statusChange` as the string `"OLD -> NEW"` when the status changed
- one `AuditLog` row with `action = "UPDATE_ARTICLE_<STATUS>"` or `"CREATE_ARTICLE_<STATUS>"`

**Not persisted anywhere:** who reviewed it, when it was submitted, when it was reviewed, the rejection reason as a first-class field, the previous status as a column, whether the change request has been addressed, assignment.

**Revision spam:** because `upsertArticle` creates an `ArticleRevision` unconditionally and autosave fires every 5 s of activity, a one-hour writing session produces on the order of hundreds of full-body revision rows. `ArticleRevision` stores `contentHtml` **and** `contentJson` each time. This is the single largest unmanaged growth vector in the database.

## 8.4 Notifications

`Notification` model exists; **no code writes or reads it**. Authors are never told their article was rejected or that changes were requested. `lib/email.ts` + Resend are wired for invitations only (`sendInvitationEmail`).

---

# 9. Current Article Management

Covered in §4.4, §4.5, §4.7, §4.8. Summary of the data actually available per row versus what is displayed:

| Field | In DB | Fetched by list pages | Displayed |
|---|---|---|---|
| `img` (featured image) | ✅ | ✅ (whole row) | ❌ |
| `title` | ✅ | ✅ | ✅ plain text |
| `deck` (excerpt) | ✅ | ✅ | ❌ |
| `authorModel.name` | ✅ | ✅ (`include`) | ✅ |
| `author` (legacy) | ✅ | ✅ | ✅ fallback |
| `category.name` | ✅ | ✅ (`include`) | ✅ |
| `status` | ✅ | ✅ | ✅ badge (colour-only) |
| `updatedAt` | ✅ | ✅ | ✅ |
| `publishedAt` | ✅ | ✅ | ❌ |
| `scheduledFor` | ✅ | ✅ | ❌ |
| `featured` | ✅ | ✅ | ❌ |
| `views` | ✅ | ✅ | ✅ |
| `tags` | ✅ | ❌ (not `include`d) | ❌ |
| reading time | derivable | ❌ | ❌ (editor only) |
| reviewer | **not modelled** | — | — |

So the list is **fetching the most expensive fields it does not display** (`contentHtml`, `contentJson`) while **not displaying the cheap ones it already has** (`img`, `deck`, `publishedAt`, `featured`).

---

# 10. Current Review / Approval System

See §4.6 and §4.9. Consolidated verdict:

| Requirement | Status |
|---|---|
| Distinct review queue | ✅ exists (`/admin/submissions`) |
| Server-enforced access to queue | ✅ `canViewReviewQueue` |
| Approve action | ⚠️ exists but == publish |
| Separate "approved, awaiting publication" state | ❌ |
| Request-changes action | ⚠️ exists, reason enforced client-side only |
| Reject action | ⚠️ exists, no reason at all, result invisible |
| Reviewer identity persisted | ❌ (only `ArticleRevision.userId` of whoever saved) |
| Submitted timestamp | ❌ |
| Reviewed timestamp | ❌ |
| Reason as a queryable field | ❌ |
| Author notified | ❌ |
| Author can see the reason | ⚠️ only by opening the editor and reading the timeline |
| REVIEWER role can act | ❌ **broken** |
| Decisions audited distinctly | ⚠️ as `UPDATE_ARTICLE_REJECTED` etc. |
| Bulk review | ❌ |
| Preview before decision | ⚠️ `/preview/[id]` exists, not linked from the queue |

---

# 11. Current CSS / Design System

`app/globals.css` — **4,110 lines, single file**, `@import "tailwindcss"` at line 1.

## 11.1 Tokens that exist

`:root` (lines 3-49) defines a genuinely well-considered editorial palette: `--paper`, `--surface`, `--surface-2`, `--surface-3`, `--ink`, `--ink-2`, `--muted`, `--faint`, `--line`, `--line-2`, `--accent` (`#d92332`), `--accent-deep`, `--accent-soft`, `--ok`, `--warn`, `--bad`, `--ink-panel*`, `--grid-line`; radii `--r-sm/md/lg` (3/6/10px); `--shadow-1/2`; a spacing scale `--sp-1..--sp-8` (4, 8, 12, 16, 24, 32, 48, 72); widths `--w`, `--w-prose`; three font families (`--f-display` Fraunces, `--f-ui` Space Grotesk, `--f-body` Newsreader).
`[data-theme="dark"]` (lines 51-69) overrides the colour set. Tailwind v4 `@theme inline` (71-105) republishes them as utility tokens.

**This is a good foundation. The console does not use it.**

## 11.2 The undefined-token defect (verified by grep)

| Token | Declarations in `globals.css` | Uses in `globals.css` | Uses in `.tsx` |
|---|---|---|---|
| `--bg` | **0** | 5 | 0 |
| `--bg-elevated` | **0** | 15 | 5 |
| `--ink-muted` | **0** | 0 | **43** |
| `--success` | **0** | 0 | 9 |
| `--error` | **0** | 0 | 11 |
| `--warning` | **0** | 0 | 5 |
| `--surface-1` | **0** | 0 | 2 |

Every one of those ~90 references resolves to an invalid value. Consequences observed in the source:
- `.console`, `.cs-nav`, `.cs-top`, `.stat`, `.cs-card`, `.cs-profile-*`, `.cs-settings-*` all specify `background: var(--bg-elevated)` or `var(--bg)` and therefore render **transparent**.
- `.cs-row { border-top: 1px solid var(--bg-elevated) }` — an invalid border colour; the row separator falls back to `currentColor`, i.e. full-strength ink, producing heavy black rules instead of hairlines.
- 43 `color: var(--ink-muted)` in TSX (every metadata cell in `StoryDataTable`, every `.cs-sub`-adjacent label) inherit `--ink` instead — **there is no visual hierarchy between primary and secondary text in the console**, which is precisely the "everything looks the same weight" symptom.
- Status badge colours (`var(--success)`, `var(--warning)`) are invalid, so the badge text falls back to inherited ink on a hardcoded rgba tint.

The correct tokens already exist: `--surface`, `--surface-2`, `--paper`, `--muted`, `--ok`, `--warn`, `--bad`. This is a rename, not a redesign.

## 11.3 Other design-system findings

- **Three competing style vocabularies.** (a) `cs-*` console classes from `htm_2.html`; (b) `admin-*` classes used only by `taxonomy/page.tsx`, **none of which are defined in CSS**; (c) ad-hoc inline `style={{}}` objects — the dominant mode. `StoryDataTable` styles **every single cell inline**; `submissions/page.tsx` contains ~40 lines of inline-styled denial UI; `ArticleEditor` has dozens.
- **Tailwind is installed and effectively unused in the console.** A handful of classes (`text-sm`, `muted`) appear; the rest is hand-CSS + inline styles. The `@theme inline` block generates utilities nobody calls.
- **Arbitrary spacing.** Despite `--sp-*` existing, the console uses literal `12px`, `14px`, `16px`, `18px`, `20px`, `24px`, `32px`, `2.5rem 1.5rem`, `1.25rem`, `0.875rem`, `11.5px`, `10.5px`, `9.5px`, `13px`. `--sp-*` is referenced **zero times** inside the `.cs-*` block.
- **Font-size chaos:** `9.5px`, `10px`, `10.5px`, `11px`, `11.5px`, `12px`, `12.5px`, `13px`, `14px`, `15px`, `16px`, `19px`, `20px`, `30px` — 14 distinct sizes in the console alone, several differing by 0.5px.
- **Radius inconsistency:** tokens are 3/6/10px, but the console also uses `4px`, `6px`, `12px` (badge pill), `50%`, `99px`.
- **Buttons:** `.btn-cs` / `.btn-cs.primary` exist; `.btn-cs.danger` is used in `ArticleEditor` but **is not defined in `globals.css`** → the Unpublish button is styled identically to a neutral button. `.act` / `.act.danger` are a second button family scoped under `.cs-row .act`, so the same `.act` class inside `StoryDataTable`'s `<td>` (not a `.cs-row`) **receives no styling at all**.
- **`.btn-cs.primary { background: var(--accent); color: var(--ink) }`** — in light mode that is near-black text on red (contrast ≈ 4.0:1, borderline) and in dark mode it is **light ink on light-red**, likely failing AA.
- **Red overuse:** `--accent` red is simultaneously the brand colour, the primary-button colour, the nav active colour (`--accent-soft` background + `--accent` text), the logo mark and the error colour. The brief explicitly calls this out.
- **Classes referenced by JSX that do not exist in `globals.css`** (all verified with `grep -c`, all return 0): `.cs-split` (`admin/page.tsx`), `.btn-cs.danger` (`ArticleEditor.tsx`), `.cs-header` / `.cs-title` / `.cs-deck` (`audit-logs/page.tsx`, `users/invite/page.tsx`), `.admin-page` / `.admin-card` / `.admin-table` (`taxonomy/page.tsx`). Eight undefined class names across five files.
- **No skeletons, no `loading.tsx`, no `error.tsx`, no `not-found.tsx` anywhere under `app/admin/`.** Every page is `force-dynamic` with a blocking DB query and no Suspense boundary → navigation shows the previous page frozen until the query resolves.
- **Empty states** are single grey sentences: `"No drafts in progress."`, `"Queue is empty."`, `"No published stories found."` — no explanation, no next action.
- **No focus-visible styling** for `.act`, `.btn-cs`, nav links, or the profile card beyond browser defaults; `.cs-nav a.on` is distinguished by colour alone.

---

# 12. Current Responsive Behavior

## 12.1 Breakpoints in use
`globals.css` contains **~40 media queries** at 390, 400, 560, 600, 640, 700, 760, 768, 800, 860, 900, 960, 1000, 1023, 1024, 1099, 1100, 1180px — mixing `max-width` and `min-width` with no system. The console block specifically uses only **900px** and **1100px** and **1000px**.

## 12.2 Console behaviour by viewport

| Viewport | Behaviour | Problem |
|---|---|---|
| ≥1100px | `.cs-stats` 5 columns, 4 tiles | permanent empty column |
| ≥1000px | `.cs-grid2` two columns | **dashboard uses `.cs-split`, which does not exist** → always single column |
| ≥900px | `.cs-body` `240px 1fr`; `.cs-nav` vertical; profile card visible | fixed 240px, not resizable/collapsible |
| <900px | `.cs-body` single column; `.cs-nav` becomes a **horizontally scrolling row of 10 text+icon links**; profile card `display:none` | No drawer. Links are ~120px wide each → ~1200px of horizontal scroll above the content on every page. Role badge and identity disappear entirely. |
| any | `StoryDataTable` 7-column table in `overflowX:auto` | horizontal scroll inside horizontal scroll on mobile |
| any | `taxonomy/page.tsx` inline `gridTemplateColumns:'1fr 1fr'` with **no media query** | two ~180px columns on a 375px phone |
| any | `ArticleEditor` `.ed-grid` is 2-col ≥900px | acceptable |
| any | `settings/page.tsx` header `display:flex justifyContent:space-between` with no wrap | tab buttons overflow on narrow screens |

`components/layout/MobileDrawer.tsx` exists but is imported **only** by `components/layout/SiteHeader.tsx` (public site). The console has no mobile navigation pattern.

---

# 13. Current Problems — prioritised register

### CRITICAL
1. Submitted/rejected articles invisible to authors (§4.4/4.5).
2. `REJECTED` invisible to everyone (§4.6).
3. Scheduling non-functional; `scheduledFor` never publishes (§4.17).
4. `REVIEWER` review actions always fail (§4.9).
5. Full article bodies (`contentHtml`+`contentJson`) serialised to the client on every list page (§4.4).
6. `deleteArticle` uses stale JWT role and performs no ownership check (§7).
7. Hard `db.user.delete` behind an unconfirmed "Revoke" button that will FK-error for any user with revisions (§4.10).

### HIGH
8. No `APPROVED` state — approve and publish are inseparable (§4.9).
9. Rejection/change-request reasons are unmodelled free text inside `ArticleRevision.notes` (§8.3).
10. No `submittedAt`/`reviewedAt`/`reviewedById` — no SLA, no ageing, no "who handled this" (§4.6).
11. Client-side filtering/search over an unbounded, unpaginated dataset (§4.7).
12. Zero database indexes on Article query columns (§3.4).
13. Seven undefined CSS tokens used ~90 times, killing all console text hierarchy and surfaces (§11.2).
14. Autosave reports "✓ Saved" on a rejected conflicting write (§4.8).
15. Autosave writes a full-body `ArticleRevision` every 5 s — unbounded table growth (§8.3).
16. Taxonomy nav link shown to REVIEWER, server redirects — UI/server disagreement (§4.2).
17. `/admin/editor` (new) has no role gate; STAFF/MODERATOR/REVIEWER get a non-functional editor (§4.8).
18. Tag field double-registered and never hydrated on edit — tags silently lost (§4.8).
19. Dashboard "Total articles" excludes four of six statuses (§4.3).
20. Role changes require re-login to take effect; all JWT-role actions are stale (§7).
21. No mobile navigation for the console; horizontal link strip (§12.2).
22. `MODERATOR` and `STAFF` cannot be assigned in the user UI although they can be invited (§4.10).

### MEDIUM
23. `homepagePlacement` written, never read (§4.17).
24. Taxonomy is create-only; no edit/delete/merge (§4.12).
25. No Authors admin section; guest bylines impossible (§4.11).
26. No media library; all images are third-party hotlinks with no alt text (§4.13).
27. `.cs-split`, `.btn-cs.danger`, `.cs-header/.cs-title/.cs-deck` referenced but undefined (§11.3).
28. Permission-denied UI duplicated three times as inline-styled JSX (§4.6).
29. No `loading.tsx`/`error.tsx` anywhere under `app/admin` (§11.3).
30. Empty states carry no guidance (§11.3).
31. Console shell mis-uses `role="dialog" aria-modal="true"` (§4.1).
32. `.cs-stats` 5-column grid with 4 tiles (§4.3).
33. `EDITOR_CATEGORIES` dead constant; `fillTestData`/template picker shipped to production (§4.8).
34. `logAudit` duplicated in two action files; taxonomy/profile/comment changes unaudited (§4.15).
35. `Notification` model and `notificationPrefs` entirely unused (§8.4).
36. Audit log has no filtering/pagination (§4.15).
37. No publication-level settings screen (§4.15).
38. `REVIEW` enum value unreachable (§8.1).
39. Sort field (`createdAt`) disagrees with displayed date (`updatedAt`) on `/admin/articles` (§4.4).
40. `authorId || "none"` sentinel silently hides a new author's own work (§4.4).

### LOW / OPTIONAL
41. 14 distinct font sizes; `--sp-*` unused in the console (§11.3).
42. Inline SVG icons duplicated despite `lucide-react` (§4.2).
43. `lib/mockData.ts` retained in the bundle graph.
44. `htm_2.html` (277 KB) committed at the repo root.
45. `README.md` is the unmodified `create-next-app` template.
46. No tests, no CI.

---

# 14. Recommended Dashboard Architecture

## 14.1 Design principles

1. **Capability-driven, not role-driven.** One module (`lib/capabilities.ts`) answers every "can X do Y to Z". Pages, nav, row actions and server actions all call the same function. No inline `role === "..."` anywhere else.
2. **Server is the boundary.** Scope, filter, sort and paginate in the database. The client never receives a record it is not allowed to see, and never receives a field it does not render.
3. **The console is a workspace, not a report.** `/admin` answers "what needs me right now", not "how many articles exist".
4. **One article index, many saved views.** Replace `/admin/articles` + `/admin/drafts` + `/admin/submissions` with `/admin/articles?view=…`, so filters, search, sorting and pagination are implemented once.
5. **Low chrome.** Hierarchy from typography, whitespace and hairline rules. Surfaces only where a surface means something (modal, drawer, sticky bar, selected row).
6. **Nothing in the UI that the server will refuse.** If an action is not permitted, it is not rendered — and it is still re-checked on the server.

## 14.2 Recommended section inventory

Evaluating every section named in the brief against this codebase:

| Section | Verdict | Rationale |
|---|---|---|
| Dashboard | **Keep, rebuild per role** | exists, generic |
| Articles (single index) | **Build** | replaces 3 pages |
| My Articles | **View, not a route** — `?view=mine` | avoid nav bloat; default for authors |
| Drafts | **View** `?status=DRAFT` | |
| Pending Review | **Route** `/admin/review` | distinct workflow surface, needs its own UI |
| Changes Requested | **View** `?status=CHANGES_REQUESTED` + a dashboard block | authors need it prominent, not a nav item |
| Approved | **View** `?status=APPROVED` | new state |
| Scheduled | **View** `?status=SCHEDULED` + dashboard block | |
| Published | **View** `?status=PUBLISHED` | |
| Rejected | **View** `?status=REJECTED` | fixes the invisibility bug |
| Authors | **Build** `/admin/authors` | `Author` model exists, has no admin surface |
| Users | **Keep, harden** | |
| Categories | **Merge into** `/admin/taxonomy`, add edit/delete/merge | |
| Tags | **Merge into** `/admin/taxonomy` | |
| Media | **Defer (OPTIONAL)** | no storage provider; URL allowlist works today. Only build when object storage is chosen. |
| Analytics | **Minimal only** | `views` is the only metric; a dedicated section would be theatre. Surface reads inside Articles + dashboard. |
| SEO | **No separate section** | per-article SEO already in the editor; add a redirect list later if `previousSlugs` becomes unmanageable |
| Editorial Activity | **Build as a dashboard panel**, not a route | derived from `ArticleRevision` + `AuditLog` |
| Audit Log | **Keep, add filters** | |
| Comments | **Keep** | already good |
| Subscribers | **Keep** | |
| Settings → Profile | **Keep** | |
| Settings → Publication | **Build** | site-level config has no home today |

**Rejected as overengineering for this codebase:** multi-site/workspace switching, content-model builder, workflow designer, localisation, A/B testing, custom dashboards, a second search engine (Postgres `ILIKE` + an index is sufficient at this scale), a state-management library (server components + URL state are enough), any microservice.

## 14.3 Recommended route map

```
/admin                        Dashboard (role-specific)
/admin/articles               Unified index (view/status/author/category/date/q/sort/page)
/admin/articles/[id]          Article detail hub  ← NEW default click target
/admin/editor/[id]            Editing surface (role-gated, capability-checked)
/admin/editor                 New article (capability-gated)
/admin/review                 Review queue (canReviewArticles)
/admin/review/[id]            Focused review screen: preview + decision
/admin/authors                Authors (canManageAuthors)          ← NEW
/admin/users                  Users + invitations (canManageUsers)
/admin/taxonomy               Categories + tags (canManageTaxonomy)
/admin/comments               Comment moderation (canModerateComments)
/admin/subscribers            Audience (canViewSubscribers)
/admin/activity               Editorial activity + audit log (canViewAuditLog)
/admin/settings               Profile / Account
/admin/settings/publication   Publication settings (canManageSettings)  ← NEW
```

---

# 15. Recommended Role System

## 15.1 Role set

Keep the enum values that exist (a Prisma enum change is a migration; renaming `Role` values would break every existing row). **Add `CONTRIBUTOR`. Retire `STAFF` and `MODERATOR` from assignment without deleting the enum members.**

| Role | Recommended definition | Change from today |
|---|---|---|
| `OWNER` | Super Admin. Everything, including owner-on-owner management and publication settings. | unchanged |
| `ADMIN` | Everything except managing OWNERs and transferring ownership. | unchanged |
| `EDITOR` | Full editorial authority: edit any article, review, approve, schedule, publish, unpublish, archive, manage taxonomy and authors, moderate comments. **No user management, no publication settings, no audit log.** | narrow: loses nothing today; gains authors |
| `REVIEWER` | Read any article in the pipeline, request changes, reject, **approve**. **Cannot publish, cannot schedule, cannot delete.** May edit an article only while it is in `IN_REVIEW` and only if claimed. | **FIX: give it working capabilities** |
| `AUTHOR` | Staff writer. Create; edit own in `DRAFT`/`CHANGES_REQUESTED`; submit; **publish own approved work if `publishOwnApproved` is enabled** (publication setting, default off); delete own `DRAFT` only; propose edits to own published work (creates a new revision requiring review). | gains: delete own draft, see own submitted/rejected |
| `CONTRIBUTOR` | **New.** External/freelance. Create and edit own `DRAFT`/`CHANGES_REQUESTED`; submit; **never** publish, schedule, approve, delete, or see other people's content, the author list, users, taxonomy management, subscribers or audit logs. | new |
| `MODERATOR` | Community only: comments. No article capability. Remove from the invite dropdown's editorial section; keep the enum value for existing rows. | clarified |
| `STAFF` | **Deprecated.** Do not offer in invite or role selects. Existing `STAFF` users are treated as `CONTRIBUTOR`-minus-authoring (read-only own view). | retired |

**Why CONTRIBUTOR and not "just use AUTHOR":** the brief distinguishes them, and the difference is real — a contributor must not browse the publication's unpublished pipeline. Today every non-AUTHOR role can read every draft in the system.

## 15.2 Capability model

Replace the numeric hierarchy with an explicit capability map. Hierarchy is retained **only** as a tie-breaker for "can A manage B".

```ts
// lib/capabilities.ts  (NEW — single source of truth)
export type Capability =
  | "article.create" | "article.editOwn" | "article.editAny"
  | "article.submit" | "article.review" | "article.approve"
  | "article.requestChanges" | "article.reject"
  | "article.schedule" | "article.publish" | "article.publishOwnApproved"
  | "article.unpublish" | "article.archive"
  | "article.deleteOwnDraft" | "article.deleteAny"
  | "article.reassignAuthor" | "article.feature"
  | "article.viewAny" | "article.viewPipeline"
  | "author.manage" | "user.manage" | "user.assignRole"
  | "taxonomy.manage" | "comment.moderate"
  | "subscriber.view" | "audit.view" | "settings.manage";

export const ROLE_CAPABILITIES: Record<Role, readonly Capability[]> = { /* … */ };

export function can(role: Role, cap: Capability): boolean;

/** Resource-aware check. The ONLY function pages/actions should call. */
export function authorize(
  actor: { id: string; role: Role; authorId: string | null },
  cap: Capability,
  resource?: { authorId?: string | null; status?: ArticleStatus }
): { ok: true } | { ok: false; reason: string };
```

`authorize` folds ownership and state into the decision, e.g. `article.editOwn` on a `PUBLISHED` article returns `{ ok:false }` for AUTHOR unless `settings.allowAuthorEditPublished`.

**Migration path (non-breaking):** keep `lib/permissions.ts` exporting its current function names as thin wrappers over `can()`/`authorize()` so nothing breaks in one commit, then remove call sites incrementally.

---

# 16. Recommended Permission Matrix

`✅` allow · `👤` own only · `❌` deny · `⚙️` governed by a publication setting

| Capability | OWNER | ADMIN | EDITOR | REVIEWER | AUTHOR | CONTRIBUTOR | MODERATOR |
|---|---|---|---|---|---|---|---|
| **Dashboard** | ✅ system | ✅ content | ✅ editorial | ✅ review | ✅ own | ✅ own | ✅ comments |
| View any article | ✅ | ✅ | ✅ | ✅ | 👤 | 👤 | ❌ |
| View pipeline (others' unpublished) | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create article | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| Edit own (DRAFT / CHANGES_REQUESTED) | ✅ | ✅ | ✅ | — | ✅ | ✅ | ❌ |
| Edit own after submit | ✅ | ✅ | ✅ | — | ❌ | ❌ | ❌ |
| Edit own published | ✅ | ✅ | ✅ | ❌ | ⚙️ | ❌ | ❌ |
| Edit any article | ✅ | ✅ | ✅ | 👁 in-review only | ❌ | ❌ | ❌ |
| Submit for review | ✅ | ✅ | ✅ | ❌ | 👤 | 👤 | ❌ |
| Claim review | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Approve | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Request changes (reason required) | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Reject (reason required) | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Schedule | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Publish any | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Publish own approved | ✅ | ✅ | ✅ | ❌ | ⚙️ | ❌ | ❌ |
| Unpublish | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Archive | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Delete own draft | ✅ | ✅ | ✅ | — | ✅ | ✅ | ❌ |
| Delete any (soft → ARCHIVED) | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Hard delete | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Reassign author | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Feature / homepage placement | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage authors | ✅ | ✅ | ✅ | ❌ | 👤 profile | 👤 profile | ❌ |
| Manage users | ✅ | ✅ (not OWNER) | ❌ | ❌ | ❌ | ❌ | ❌ |
| Assign roles | ✅ all | ✅ not OWNER | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manage taxonomy | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Moderate comments | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Article SEO fields | ✅ | ✅ | ✅ | ❌ | 👤 | 👤 | ❌ |
| View subscribers | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View audit log | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Publication settings | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Deltas from today (the actionable list)
1. AUTHOR gains: see own `SUBMITTED`/`IN_REVIEW`/`APPROVED`/`REJECTED`; delete own `DRAFT`.
2. AUTHOR loses: nothing.
3. REVIEWER gains: working approve / request-changes / reject; scoped edit while claimed.
4. REVIEWER loses: Taxonomy nav link (it never worked).
5. CONTRIBUTOR added; cannot see others' content.
6. STAFF/MODERATOR removed from editorial role pickers.
7. EDITOR gains author management; explicitly does **not** gain users/settings/audit.
8. Hard delete restricted to OWNER/ADMIN; everyone else archives.

---

# 17. Recommended Dashboard Overview by Role

Universal rules: max **five** blocks; every block is a link into a filtered view; every number is a live count from a scoped `count()`; no block without an action.

### OWNER (Super Admin)
1. **Needs attention** — `IN_REVIEW` count + oldest-waiting age; `CHANGES_REQUESTED` older than 7 days; articles `SCHEDULED` in the next 24 h; scheduler failures.
2. **Pipeline strip** — Draft · In review · Approved · Scheduled · Published (30 d), as a single horizontal figure row (no tiles).
3. **Publishing this week** — next 7 days of scheduled content, chronological.
4. **Team & system** — active users by role, pending invitations, users with no author profile, last 5 role changes.
5. **Recent editorial activity** — last 10 workflow transitions with actor, article, decision.

### ADMIN
Blocks 1–3 and 5 identical. Block 4 becomes **Content health**: articles without a featured image, without SEO description, uncategorised, published >12 months and never updated.

### EDITOR
1. **Review queue** — count, oldest item, items I have claimed. Primary CTA → `/admin/review`.
2. **Awaiting publication** — `APPROVED` and not yet scheduled (the state that stalls a newsroom).
3. **Scheduled** — next 7 days, with an "unschedule/publish now" affordance.
4. **Recently published** — last 7 days, for post-publication corrections.
5. **Stalled** — `CHANGES_REQUESTED` with no author activity in 7+ days.

### REVIEWER
1. **Unclaimed submissions** — with age; primary CTA "Claim next".
2. **My open reviews** — claimed, undecided.
3. **My recent decisions** — last 10, with the outcome (so a reviewer can revisit a call).
4. **Returned to me** — items I requested changes on that have been resubmitted.
No publishing, scheduling, user or system data.

### AUTHOR
1. **Action required** — `CHANGES_REQUESTED`, each row showing the reviewer's reason inline. Highest position; this is the only truly urgent thing for an author.
2. **My drafts** — with last-edited relative time; "continue writing" CTA.
3. **In review** — what I submitted, when, and who is reviewing it.
4. **Recently published** — last 5 with read counts.
5. **Profile completeness** — only rendered when the author profile is missing avatar/bio/headline, or when `User.authorId` is null (which today silently breaks their article scoping).

### CONTRIBUTOR
Blocks 1–3 above, plus **Published contributions**. No read counts for other people, no pipeline view, no team data.

### MODERATOR
Single purpose: pending comments count, flagged/spam count, recent decisions. No article data.

---

# 18. Recommended Sidebar / Navigation

## 18.1 Structure

Grouped, with group labels rendered as 10px/0.18em uppercase muted text and **no boxes**. Groups appear only if they contain at least one permitted item.

```
[identity block — avatar, name, role chip, link to profile]

CONTENT
  Dashboard
  Articles            ← default view differs by role
  Review              ● 7          (canReviewArticles; badge = unclaimed count)
  Editor              (quick "New article", capability-gated)

PEOPLE
  Authors             (author.manage)
  Users               (user.manage)

STRUCTURE
  Taxonomy            (taxonomy.manage)

AUDIENCE
  Comments            ● 3          (comment.moderate; badge = pending)
  Subscribers         (subscriber.view)

SYSTEM
  Activity            (audit.view)
  Settings            (always)
```

## 18.2 Per-role rendering

| Role | Groups shown | Items |
|---|---|---|
| OWNER / ADMIN | all 5 | all |
| EDITOR | CONTENT, PEOPLE(Authors), STRUCTURE, AUDIENCE(Comments), SYSTEM(Settings) | no Users, no Subscribers, no Activity |
| REVIEWER | CONTENT(Dashboard, Articles, Review), SYSTEM(Settings) | no Editor, no Taxonomy |
| AUTHOR | CONTENT(Dashboard, Articles→`?view=mine`, New article), SYSTEM(Settings) | |
| CONTRIBUTOR | same as AUTHOR | Articles is hard-scoped to own |
| MODERATOR | AUDIENCE(Comments), SYSTEM(Settings) | |

## 18.3 Behaviour requirements
- Active state via `pathname.startsWith(href)` with an explicit exact-match exception for `/admin`, so `/admin/editor/[id]` keeps "Articles" (or "Editor") lit.
- Badge counts fetched in the layout server component in **one** `Promise.all` of `count()` calls, passed as props — never a client fetch.
- **Every gated nav item must have a matching server guard on its route, and the guard and the nav must read the same capability.** This is the specific fix for the Taxonomy/REVIEWER mismatch.
- Replace hand-inlined SVGs with `lucide-react` (already a dependency) at a fixed 18px.
- `<nav aria-label="Console">`, `aria-current="page"` on the active link, visible focus ring using `--accent` at 2px offset.
- **Mobile (<900px):** the strip is replaced by a **sheet drawer** — a `<button aria-expanded aria-controls>` in `.cs-top`, a `<dialog>`-semantics panel sliding from the left, focus trapped, `Esc` to close, closing on route change. Reuse the interaction pattern already proven in `components/layout/MobileDrawer.tsx`.

---

# 19. Recommended Article Section

## 19.1 One route, many views

`/admin/articles` with URL-driven state (shareable, bookmarkable, back-button correct, server-rendered):

```
?view=mine|all|review|scheduled|published   (preset)
&status=DRAFT,IN_REVIEW                     (multi, CSV)
&author=<authorId>
&category=<categoryId>
&tag=<tagId>
&q=<search>
&from=<ISO>&to=<ISO>&dateField=updated|published|created
&sort=updated|created|published|title|status
&dir=asc|desc
&page=1&perPage=25
```

**Default view by role** (applied server-side, then intersected with the user's explicit filters — a CONTRIBUTOR who hand-edits `?view=all` still only gets their own rows):

| Role | Default | Hard scope |
|---|---|---|
| OWNER/ADMIN | `view=all`, `sort=updated` | none |
| EDITOR | `view=all`, `status=IN_REVIEW,APPROVED,SCHEDULED` | none |
| REVIEWER | `view=review` | pipeline read-only |
| AUTHOR | `view=mine` | `authorId = own` |
| CONTRIBUTOR | `view=mine` | `authorId = own`, enforced, non-overridable |

## 19.2 Article detail hub — `/admin/articles/[id]`

Clicking a row title should **not** always open the 707-line editor. Route by capability and state:

| Actor / state | Click target |
|---|---|
| Author, own `DRAFT` or `CHANGES_REQUESTED` | `/admin/editor/[id]` directly — zero friction on the primary task |
| Author, own submitted/approved/published | `/admin/articles/[id]` (read-only hub with status, timeline, reviewer note) |
| Reviewer, any pipeline item | `/admin/review/[id]` (preview + decision panel) |
| Editor/Admin/Owner | `/admin/articles/[id]` hub, with a prominent **Edit** button |

The hub shows: hero (image, title, deck), status + workflow timeline, metadata (author, category, tags, dates, reading time, reads), SEO preview, revision history with restore, and a capability-filtered action bar. It is cheap to build and removes the "everything opens a giant form" problem.

---

# 20. Recommended Article List Design

## 20.1 Desktop row anatomy (≥1024px)

A CSS Grid **list**, not a `<table>` of boxes. One row = one 12px-padded grid line separated by a 1px `--line` rule. No card, no shadow, no per-row border box.

```
grid-template-columns: 24px 96px minmax(0,1fr) 150px 130px 120px 110px 40px;
                        │     │        │          │      │      │      │
                     select  image   title +    author  cat  status  updated  ⋯
                                     deck
```

- **Select** (24px): checkbox, only rendered when the actor has any bulk capability.
- **Image** (96×54, 16:9): `next/image` with `width=192 height=108`, `sizes="96px"`, `loading="lazy"`, `decoding="async"`, `object-fit: cover`, `border-radius: var(--r-sm)`. Fixed box → zero CLS. Fallback: a `--surface-2` block with a 1px `--line` border and a centred 14px muted glyph. **No shadow, no ring.**
- **Title block**: title at 15px/600 `--f-ui`, `--ink`, max 2 lines (`-webkit-line-clamp: 2`), the whole cell is the link target. Below it, the deck at 12.5px `--muted`, 1 line clamped — rendered **only** when row density is "comfortable". A small inline chip row for `featured` ★ and `scheduledFor` 🕐 when set.
- **Author**: 13px `--ink-2`, `authorModel.name` with `author` string fallback, plus a 20px avatar only at ≥1280px.
- **Category**: 12px uppercase 0.06em `--muted`.
- **Status**: badge (see §20.4).
- **Updated**: relative ("3h ago") with `title` attribute carrying the absolute ISO timestamp. For `PUBLISHED` rows the column shows `publishedAt` with a "Pub" prefix; for `SCHEDULED` it shows `scheduledFor` with a 🕐 prefix. One column, state-aware — this avoids a fourth date column.
- **Actions**: a single `⋯` menu button (36×36 hit area) opening a capability-filtered menu. Exactly one action may be promoted to an inline button per row, chosen by state: `CHANGES_REQUESTED`→Edit, `IN_REVIEW`→Review, `APPROVED`→Schedule, else none.

Row height: 72px comfortable / 52px compact (a density toggle persisted in `localStorage`). Hover: background shifts to `--surface-2` at 40% — **no lift, no shadow, no border change**.

## 20.2 Tablet (768–1023px)
Drop Category and Author columns into a metadata line under the title: `Author · Category · Updated`. Keep image, title, status, actions. Grid becomes `72px minmax(0,1fr) 110px 40px`.

## 20.3 Mobile (<768px)
Stacked rows, no horizontal scroll, ever.
```
┌ 64×36 img ┐  Title (2 lines, 15px/600)
└───────────┘  Author · Category
               [status badge]   Updated 3h ago            ⋯
```
Full-width tap target on the row; the `⋯` menu opens a **bottom sheet** with large touch targets. Filters move behind a single "Filters (2)" button that opens a bottom sheet containing the same controls.

## 20.4 Status badges

Text + icon + restrained tint. Never colour alone. All colours from tokens; no hardcoded rgba.

| Status | Label | Icon | Text colour | Background |
|---|---|---|---|---|
| `DRAFT` | Draft | pencil | `--muted` | `--surface-2` |
| `IN_REVIEW` | In review | eye | `--ink-2` | `--surface-3` |
| `CHANGES_REQUESTED` | Changes requested | arrow-left-circle | `--warn` | `color-mix(in srgb, var(--warn) 12%, transparent)` |
| `APPROVED` | Approved | check | `--ok` | `color-mix(in srgb, var(--ok) 12%, transparent)` |
| `SCHEDULED` | Scheduled | clock | `--ink-2` | `--surface-3`, 1px dashed `--line-2` |
| `PUBLISHED` | Published | globe | `--ok` | transparent, 1px `--line` |
| `REJECTED` | Rejected | x-circle | `--bad` | `color-mix(in srgb, var(--bad) 10%, transparent)` |
| `ARCHIVED` | Archived | archive | `--faint` | transparent |

Badge: 11px/600, 0.04em, `padding: 3px 8px`, `border-radius: var(--r-sm)` (3px — not a pill; pills read as consumer UI). `PUBLISHED` deliberately gets the *quietest* treatment: it is the default healthy state and should not shout. **`--accent` red is reserved for brand and primary actions and is never a status colour** — `REJECTED` uses `--bad`, which is a distinct, desaturated red.

## 20.5 Bulk actions
Selecting ≥1 row reveals a **sticky bottom bar** (the one place a surface is justified): "3 selected · Change category · Add tag · Submit · Approve · Schedule · Archive · Clear". Every action is capability-filtered and re-validated per article server-side; the result reports partial success ("2 of 3 archived; 1 was already published").

---

# 21. Recommended Search / Filter / Sort System

## 21.1 Single server query contract

```ts
// lib/queries/articles.ts (NEW)
export type ArticleListParams = {
  actor: { id: string; role: Role; authorId: string | null };
  view?: "mine" | "all" | "review" | "scheduled" | "published";
  status?: ArticleStatus[];
  authorId?: string;
  categoryId?: string;
  tagId?: string;
  q?: string;
  dateField?: "createdAt" | "updatedAt" | "publishedAt";
  from?: Date; to?: Date;
  sort?: "updated" | "created" | "published" | "title" | "status";
  dir?: "asc" | "desc";
  page?: number; perPage?: 25 | 50 | 100;
};

export async function listArticles(p: ArticleListParams): Promise<{
  rows: ArticleListRow[];   // exactly the 13 fields the row renders
  total: number; page: number; perPage: number; pageCount: number;
  facets: { statusCounts: Record<ArticleStatus, number> };
}>;
```

**Scope is applied first and is not overridable:**
```ts
const scope: Prisma.ArticleWhereInput =
  can(actor.role, "article.viewPipeline")
    ? {}
    : { authorId: actor.authorId ?? "__none__" };
```
…with the additional guarantee that if `actor.authorId` is null and the actor lacks `viewPipeline`, the function returns an **empty result plus a `needsAuthorProfile: true` flag** so the UI can explain the situation instead of silently showing nothing (the current `|| "none"` bug).

**Projection — exactly these fields, never the body:**
```ts
select: {
  id: true, slug: true, title: true, deck: true, img: true, status: true,
  featured: true, views: true,
  createdAt: true, updatedAt: true, publishedAt: true, scheduledFor: true,
  submittedAt: true, reviewedAt: true,
  authorModel: { select: { id: true, name: true, slug: true, avatar: true } },
  author: true,
  category: { select: { id: true, name: true, slug: true } },
  reviewedBy: { select: { id: true, name: true } },
}
```

## 21.2 Search — what it searches and why

| Field | Searched | Reason |
|---|---|---|
| `title` | ✅ | the primary identifier |
| `deck` | ✅ | editors remember the standfirst |
| `slug` | ✅ | pasted from a URL |
| `authorModel.name` | ✅ | fixes the current gap (only legacy `author` is matched today) |
| `author` (legacy string) | ✅ | historical rows |
| `category.name` | ❌ | there is a dedicated filter; searching it produces confusing over-matching |
| `tags.name` | ❌ initially | add a dedicated tag filter instead |
| `contentHtml` | **❌ never** | requires full-text infrastructure; would force loading bodies; not worth it at this scale |
| `seoTitle`/`seoDesc` | ❌ | derived fields |

Implementation: `OR` of `contains … mode: "insensitive"` across the five fields, with the term trimmed and capped at 100 chars, debounced 300 ms client-side, pushed to the URL with `router.replace(…, {scroll:false})`. **Search AND filters compose** — they are separate keys on the same `where` object, so `q=AI agents & author=John & category=AI` intersects correctly. This is the explicit requirement in the brief and is satisfied by construction.

## 21.3 Filters — data-model-backed only

| Filter | Backing column | Control |
|---|---|---|
| Status | `Article.status` | multi-select chips with live counts from `facets` |
| Author | `Article.authorId` → `Author` | searchable combobox, options from `db.author.findMany({ select:{id,name} })`, **not** derived from loaded rows |
| Category | `Article.categoryId` → `Category` | select, full list from DB |
| Tag | `Article.tags` (m-n) | combobox (phase 2) |
| Date | `createdAt` \| `updatedAt` \| `publishedAt` | Today / 7 d / 30 d / 90 d / Custom |
| Featured | `Article.featured` | toggle |

Filters explicitly **not** offered because nothing backs them: reading time (not stored), word count (not stored), "last editor" (only inferable from `ArticleRevision`; offer only after `reviewedById` lands), language, series.

**Filter UX**
- Desktop: a single horizontal toolbar — search input (flex-grow), then Status / Author / Category / Date, then a right-aligned result count and Sort. **No card, no border box around the toolbar**; separated from the list by one `--line` hairline and 16px of space.
- Active filters render as removable chips below the toolbar with a "Clear all" text button, shown only when ≥1 filter is active.
- Mobile: `[🔍 search] [Filters (2)]` → bottom sheet, with "Apply" and "Clear all" pinned at the bottom.
- Keyboard: `/` focuses search, `Esc` clears it, every control reachable by Tab, comboboxes implement the ARIA combobox pattern with arrow-key navigation.
- Changing any filter resets `page` to 1.
- Result count is always visible: "**42** articles · filtered from 318".

## 21.4 Sorting
Server-side `orderBy` only. Whitelist-mapped (never interpolate user input):
`updated→updatedAt` (default) · `created→createdAt` · `published→publishedAt` (nulls last via `{ sort:"desc", nulls:"last" }`) · `title→title` · `status→status`.
Desktop exposes sort via clickable column headers with `aria-sort`; mobile via the sort control in the filter sheet.

## 21.5 Pagination
**Offset pagination with numbered pages.** Justification: a CMS needs "page 4 of 13" to be a stable, shareable, re-findable location; editors navigate back and forth between a list and an item constantly. Infinite scroll loses position on back-navigation and makes bulk selection incoherent. Cursor pagination is unnecessary below ~100k rows and breaks page-number navigation. Reassess only if `Article` exceeds ~100k rows.
Controls: `‹ Prev  1 2 3 … 13  Next ›`, a per-page selector (25/50/100), and "Showing 26–50 of 318". `page`/`perPage` live in the URL. `page` is clamped server-side to `[1, pageCount]`.

---

# 22. Recommended Review Queue

## 22.1 `/admin/review` — the queue

Scope: `status = IN_REVIEW` **only**. `CHANGES_REQUESTED` leaves the queue (it is the author's ball) and `REJECTED` leaves it (it is closed) — both remain findable in `/admin/articles`. This makes the queue a true inbox that can reach zero.

Row (denser than the article list, ageing-first):
```
[80×45 img]  Title                                  Submitted 2d ago  ⚠
             Author · Category · 1,240 words           Claimed by Sara
             Resubmitted after changes (2nd pass)   [Preview] [Review →]
```
- **Ageing** drives the visual: >24 h shows a `--warn` dot, >72 h a `--bad` dot, plus the relative age in text (never colour alone).
- **Claim**: "Review →" claims the article (`reviewedById = me`, atomic `updateMany` with `where: { reviewedById: null }` to avoid two reviewers double-claiming) and navigates to `/admin/review/[id]`. An already-claimed item shows "Claimed by Sara" and requires an explicit "Take over" (logged).
- **Pass count**: derived from `ArticleReview` rows for the article — "2nd pass" tells a reviewer this is a resubmission.
- Sort: oldest `submittedAt` first (default), newest, or author.
- Filters: category, author, claimed-by-me / unclaimed, resubmissions only.
- Empty state: "**Queue clear.** Nothing is waiting for review. — [Browse all articles]" with a restrained check glyph, no illustration, no card.

## 22.2 `/admin/review/[id]` — the decision screen

Two-pane on ≥1024px, tabs below:
- **Left (60%)**: rendered article preview using the *public* `ArticleBody` component so the reviewer sees what readers will see, sanitised identically.
- **Right (40%, sticky)**: metadata summary (author, category, tags, image presence, SEO description presence, word count, reading time); the **pre-flight checklist** (title ✓, deck ≥10 chars ✓, ≥50 words ✓, featured image ✓, category ✓, SEO description ⚠) mirroring the client-side checks in `ArticleEditor` but computed server-side; the **decision panel**; and the **history timeline** from `ArticleReview` + `ArticleRevision`.

**Decision panel** — three actions, each with explicit requirements:

| Action | Reason | Confirmation | Result |
|---|---|---|---|
| **Approve** | optional note | none | `APPROVED`; if the actor also has `article.publish`, offer "Approve & publish" / "Approve & schedule…" as secondary buttons |
| **Request changes** | **required, ≥20 chars** | none | `CHANGES_REQUESTED`; notifies author |
| **Reject** | **required, ≥20 chars** + a reason category (Off-topic / Quality / Duplicate / Factual concerns / Editorial direction / Other) | modal, states "the author will be notified and this will close the submission" | `REJECTED`; notifies author |

All three requirements are enforced **server-side in the action**, not only in the form.

---

# 23. Recommended Approval Workflow

## 23.1 Schema additions

```prisma
enum ArticleStatus {
  DRAFT
  SUBMITTED            // retained for backward compatibility; mapped to IN_REVIEW on read
  REVIEW               // retained (legacy)
  REVISION_REQUESTED   // retained (legacy)
  REJECTED
  PUBLISHED
  // NEW
  IN_REVIEW
  CHANGES_REQUESTED
  APPROVED
  SCHEDULED
  ARCHIVED
}
```
> **Backward compatibility is mandatory.** Prisma enums cannot have values removed without a data migration, and existing rows use `SUBMITTED`/`REVISION_REQUESTED`. Plan: add the new values, run a data migration `SUBMITTED|REVIEW → IN_REVIEW` and `REVISION_REQUESTED → CHANGES_REQUESTED`, keep the old members in the enum as deprecated-but-valid, and add a `normalizeStatus()` helper so any straggler row renders correctly. Do **not** drop enum members in the same release.

```prisma
model Article {
  // … existing …
  submittedAt   DateTime?
  submittedById String?
  reviewedAt    DateTime?
  reviewedById  String?
  reviewedBy    User?     @relation("ArticleReviewer", fields:[reviewedById], references:[id], onDelete: SetNull)
  approvedAt    DateTime?
  approvedById  String?
  unpublishedAt DateTime?
  archivedAt    DateTime?
  reviewPass    Int       @default(0)

  reviews       ArticleReview[]

  @@index([status, updatedAt])
  @@index([status, submittedAt])
  @@index([authorId, status, updatedAt])
  @@index([categoryId, status])
  @@index([status, publishedAt])
  @@index([status, scheduledFor])
  @@index([reviewedById, status])
}

model ArticleReview {
  id           String   @id @default(uuid())
  articleId    String
  article      Article  @relation(fields:[articleId], references:[id], onDelete: Cascade)
  reviewerId   String
  reviewer     User     @relation(fields:[reviewerId], references:[id])
  decision     ReviewDecision
  reason       String?  @db.Text
  reasonCode   String?
  fromStatus   ArticleStatus
  toStatus     ArticleStatus
  pass         Int      @default(1)
  createdAt    DateTime @default(now())

  @@index([articleId, createdAt])
  @@index([reviewerId, createdAt])
}

enum ReviewDecision { CLAIMED APPROVED CHANGES_REQUESTED REJECTED REOPENED TAKEN_OVER }
```

**Index justification (not blind):** every one maps to a query this document specifies — `(status, updatedAt)` the default article list; `(status, submittedAt)` the review queue ordering; `(authorId, status, updatedAt)` the author-scoped list, the single hottest query for the largest role; `(categoryId, status)` category filtering; `(status, publishedAt)` the public site's `/latest`, category and tag pages, which all filter `status:"PUBLISHED"` and order by date and today have **no index at all**; `(status, scheduledFor)` the scheduler's only query; `(reviewedById, status)` "my open reviews". No index is proposed for `featured`, `views` or `slug` (already unique).

## 23.2 Dedicated transition actions

Stop routing workflow through `upsertArticle`. Add `app/actions/workflow.ts`, each function: authenticate → **re-read role and authorId from the DB** → `authorize()` → validate the transition against the state machine → validate required data → single transaction writing `Article` + `ArticleReview` + `AuditLog` + `Notification` → targeted `revalidatePath`.

```
submitArticle(id)                         → IN_REVIEW
claimReview(id)  /  releaseReview(id)  /  takeOverReview(id)
approveArticle(id, note?)                 → APPROVED
requestChanges(id, reason)                → CHANGES_REQUESTED   (reason ≥20 chars, server-enforced)
rejectArticle(id, reason, reasonCode)     → REJECTED            (reason ≥20 chars, server-enforced)
scheduleArticle(id, when)                 → SCHEDULED           (when must be in the future)
unscheduleArticle(id)                     → APPROVED
publishArticle(id)                        → PUBLISHED
unpublishArticle(id, reason?)             → APPROVED (not DRAFT)
archiveArticle(id)                        → ARCHIVED
reopenArticle(id)                         → DRAFT               (from REJECTED/ARCHIVED)
```

`upsertArticle` keeps content saving **only** and must reject any attempt to change `status` (it currently accepts `data.status` from the client, which is how a client could request `PUBLISHED`; the server downgrades to `SUBMITTED`, but the status field should simply not be writable there).

## 23.3 Scheduled publishing — making it real

The single simplest thing that works, using what is already installed:
1. `app/api/cron/publish/route.ts` — `export const dynamic = "force-dynamic"`, `runtime = "nodejs"`. Guard: `Authorization: Bearer ${process.env.CRON_SECRET}`, compared with `crypto.timingSafeEqual`. Reject otherwise with 401.
2. Query `status: "SCHEDULED", scheduledFor: { lte: new Date() }`, `take: 50`, ordered by `scheduledFor`.
3. For each, in a transaction: set `status: "PUBLISHED"`, `publishedAt = scheduledFor ?? now`, `scheduledFor = null`; write `AuditLog` (`PUBLISH_SCHEDULED`) and a `Notification` to the author. Use `updateMany` with `where: { id, status: "SCHEDULED" }` so a concurrent manual publish cannot double-fire.
4. `revalidatePath("/", "layout")`, the category path, `/latest`, `/sitemap.xml`.
5. Register in `vercel.json` (`{"crons":[{"path":"/api/cron/publish","schedule":"*/5 * * * *"}]}`) or any external scheduler. Document the fallback for self-hosting.
6. Failures increment a counter surfaced in the OWNER/ADMIN "Needs attention" block, and are written to `AuditLog` with `action: "PUBLISH_SCHEDULED_FAILED"`.

## 23.4 Notifications
Start writing to the `Notification` model that already exists, on: submitted (→ all reviewers), claimed (→ author), approved (→ author + publishers), changes requested (→ author), rejected (→ author), scheduled (→ author), published (→ author). Surface as a bell with an unread count in `.cs-top` and a dropdown list; mark-read on click. Email is **optional/phase 2** — `lib/email.ts` + Resend already exist, so gate it behind `User.notificationPrefs` (a field that exists and is currently never written).

---

# 24. Recommended Rejection / Change-Request Workflow

Every negative decision must persist: **who, when, what changed, why, and from what state.** `ArticleReview` (§23.1) captures all five.

### Change requested
- Trigger: reviewer, on `IN_REVIEW`.
- Required: `reason`, ≥20 chars, validated in the server action.
- Writes: `status = CHANGES_REQUESTED`, `reviewedAt`, `reviewedById`, `reviewPass += 1`; `ArticleReview{decision:CHANGES_REQUESTED, reason, fromStatus, toStatus, pass}`; `AuditLog`; `Notification` to the author linking to the editor.
- Author experience: the item appears **first** on their dashboard under "Action required"; the reason is shown inline in the list row and as a persistent, dismissible banner at the top of the editor: *"Changes requested by Sara Lin · 12 Sep · <reason>"*. Editing is re-enabled. Resubmitting increments `pass` and returns it to the queue flagged "2nd pass".
- The item **leaves** the reviewer's queue.

### Rejected
- Trigger: reviewer/editor, on `IN_REVIEW`.
- Required: `reason` ≥20 chars **and** `reasonCode` from a fixed list.
- Confirmation modal stating the consequence.
- Writes: `status = REJECTED`, `reviewedAt`, `reviewedById`; `ArticleReview{decision:REJECTED,…}`; `AuditLog`; `Notification`.
- **The article remains fully visible** to its author in `/admin/articles?status=REJECTED` and to editors — this is the fix for Finding #2.
- A rejected article is **not** a dead end: an author may "Duplicate as new draft"; an editor/owner may "Reopen" it to `DRAFT` (logged as `REOPENED`).

### Display requirements
Wherever a `CHANGES_REQUESTED` or `REJECTED` article appears, the most recent reason must be reachable without opening the editor: inline in the row's expanded state, in the detail hub header, and in the dashboard block.

---

# 25. Recommended Ownership Rules

Answering each question in the brief explicitly, with the rule to implement:

| Question | Rule |
|---|---|
| Can authors edit only their own articles? | **Yes.** `article.editOwn` + `resource.authorId === actor.authorId`. Unchanged from today, but must also be true for CONTRIBUTOR. |
| Can editors edit other people's articles? | **Yes**, any state. Unchanged. |
| Can admins edit everything? | **Yes.** Unchanged. |
| Can authors delete submitted articles? | **No.** Delete is permitted only on own `DRAFT`. From `IN_REVIEW` the author may **withdraw** (→ `DRAFT`), which is logged. |
| Can authors edit after submission? | **No** while `IN_REVIEW` — the reviewer needs a stable target. They may withdraw, edit, resubmit. This is a product decision; it is enforced in `authorize()` and can be flipped by one publication setting (`allowEditWhileInReview`). |
| Can authors edit published content? | **Governed by a setting**, default **off**. When on, an author edit to a `PUBLISHED` article creates a pending revision and moves it to `IN_REVIEW` with the live version untouched (phase 2), or — simpler phase 1 — the author may only propose changes via a note. Editors edit published content directly. |
| Can editors reassign authors? | **Yes** (`article.reassignAuthor`). Must write both `authorId` **and** the denormalised `author` string so they cannot diverge, and log the change. |
| Can admins transfer ownership? | **Yes**, same capability, plus a bulk "reassign all articles from author A to author B" used when someone leaves. |
| Can a reviewer edit? | Only while the article is `IN_REVIEW` **and** claimed by them; typo-level fixes. Every such save writes an `ArticleRevision` attributed to them. |

**Two integrity rules to enforce in `upsertArticle`:**
1. `authorId` must never be taken from the client for an actor lacking `article.reassignAuthor`. Today the code does `authorId: dbUser.role === "AUTHOR" ? userWithAuth.authorId : (data.authorId || …)` — an EDITOR-or-above can therefore set an arbitrary, unvalidated `authorId` from the payload. Validate that the id exists.
2. `author` (string) and `authorModel.name` must be kept in sync on every write.

---

# 26. Recommended Article State Machine

```
                       withdraw
              ┌──────────────────────────┐
              │                          ▼
  ┌───────┐ submit  ┌───────────┐  approve   ┌──────────┐ schedule ┌───────────┐
  │ DRAFT │────────▶│ IN_REVIEW │───────────▶│ APPROVED │─────────▶│ SCHEDULED │
  └───┬───┘         └─────┬─────┘            └────┬─────┘          └─────┬─────┘
      ▲                   │                       │  publish             │ cron / publish now
      │ resubmit          │ requestChanges        ▼                      ▼
      │             ┌─────┴──────────────┐   ┌───────────┐  unpublish ┌───────────┐
      │             │ CHANGES_REQUESTED  │   │ PUBLISHED │◀───────────┤ PUBLISHED │
      │             └─────┬──────────────┘   └─────┬─────┘            └───────────┘
      │                   │ submit                 │ unpublish → APPROVED
      │                   └────────────▶ IN_REVIEW │
      │                                            │
      │             ┌──────────┐  reject           │  archive
      └─── reopen ──┤ REJECTED │◀──────────────────┘     ▼
                    └────┬─────┘                    ┌──────────┐
                         └────── reopen ───────────▶│ ARCHIVED │
                                                    └────┬─────┘
                                                         └── reopen → DRAFT
```

| State | Purpose | Visible to | Editable by | Transitions out | Actors | Required data |
|---|---|---|---|---|---|---|
| `DRAFT` | private workspace | owner; pipeline-viewers | owner, EDITOR+ | submit, delete, archive | owner, EDITOR+ | title |
| `IN_REVIEW` | awaiting a decision | owner (read), reviewers, EDITOR+ | claimed reviewer, EDITOR+ | approve, requestChanges, reject, withdraw | reviewer, EDITOR+; owner may withdraw | title, deck ≥10, ≥50 words, category |
| `CHANGES_REQUESTED` | returned to author | owner, reviewers, EDITOR+ | owner, EDITOR+ | submit, archive | owner, EDITOR+ | latest reason |
| `APPROVED` | cleared, not live | owner (read), EDITOR+ | EDITOR+ | schedule, publish, requestChanges, archive | EDITOR+ (AUTHOR if `publishOwnApproved`) | approvedAt, approvedById |
| `SCHEDULED` | queued for a future time | owner (read), EDITOR+ | EDITOR+ | publish now, unschedule, requestChanges | EDITOR+ | `scheduledFor` in the future |
| `PUBLISHED` | live | everyone | EDITOR+ (AUTHOR via setting) | update, unpublish, archive | EDITOR+ | `publishedAt`, slug, category |
| `REJECTED` | closed negatively | owner, EDITOR+ | EDITOR+ | reopen, archive, duplicate | EDITOR+; owner may duplicate | reason, reasonCode, reviewer |
| `ARCHIVED` | soft-deleted | EDITOR+ | OWNER/ADMIN | reopen, hard delete | OWNER/ADMIN | archivedAt |

**Every transition writes:** `Article` status + the relevant timestamp/actor column, one `ArticleReview` (for review decisions) or one `AuditLog` row (for all others), and a `Notification` where a human other than the actor is affected. Transitions not drawn above are rejected server-side with a 4xx-equivalent result — the state machine is a whitelist, not a suggestion.

---

# 27. Recommended Dashboard UX

## 27.1 Page shell
Every console page follows one template — **no wrapper card**:
```
 ── page header ───────────────────────────────────────
   Eyebrow (11px, 0.18em, --muted)        e.g. CONTENT
   H1 (24px/700, --f-ui, -0.01em)         e.g. Articles
   Sub (13px, --muted)                    e.g. 318 articles · 7 awaiting review
                                          [ Primary action ]  (right-aligned)
 ── 1px --line, 20px above / 24px below ──────────────
   Toolbar (filters / tabs)               — no border box
 ── 1px --line ───────────────────────────────────────
   Content
```

## 27.2 Empty states
Text-first, left-aligned within the content column, **no card, no illustration**: a 20px muted glyph, a 15px/600 headline, a 13px `--muted` explanation of *what* and *why*, and one primary action.

| Context | Headline | Explanation | Action |
|---|---|---|---|
| No drafts | Nothing in progress | Drafts you start appear here until you submit them. | Start an article |
| Review queue clear | Queue clear | No submissions are waiting. Resubmissions will appear here automatically. | Browse all articles |
| No scheduled | Nothing scheduled | Approved articles can be scheduled to publish at a set time. | View approved |
| No results (filtered) | No articles match | 3 filters are active. Try widening the date range or clearing the author filter. | Clear filters |
| No search results | No matches for "quantum" | Search covers titles, decks, slugs and author names. | Clear search |
| Author with no profile | Finish your profile | Your articles are linked to an author profile. Create yours so your work appears here and on the site. | Complete profile |
| Rejected list empty | No rejected articles | — | — |

## 27.3 Loading states
- `app/admin/loading.tsx` + per-route `loading.tsx` for `/admin`, `/admin/articles`, `/admin/review`.
- Skeletons mirror the real layout: for the list, 8 rows of `96×54` image block + two text bars at 60%/35% width; `animation: pulse 1.6s ease-in-out infinite` on `--surface-2`; `prefers-reduced-motion` disables the animation and shows a static tint.
- Filter changes use `useTransition`; the list dims to 60% opacity with `aria-busy="true"` rather than unmounting — **the page never goes blank**.
- Buttons performing a mutation show an inline spinner and are `disabled` + `aria-disabled`.
- **No optimistic UI for any workflow transition.** Optimism is acceptable only for the density toggle and mark-notification-read.

## 27.4 Error states
- `app/admin/error.tsx` (client boundary) + `app/admin/articles/error.tsx`: heading, plain-language cause, **Retry** (calls `reset()`), and a secondary link back to `/admin`. Never a raw stack trace.
- `not-found.tsx` for `/admin/articles/[id]` and `/admin/editor/[id]`.
- Server actions return a discriminated union `{ ok:true, data } | { ok:false, code, message }` where `code ∈ UNAUTHENTICATED | FORBIDDEN | NOT_FOUND | CONFLICT | VALIDATION | RATE_LIMITED | SERVER`. The UI maps each code to a specific recovery: `CONFLICT` → "Someone else edited this. [Compare] [Overwrite] [Reload]"; `FORBIDDEN` → explain which capability is missing; `VALIDATION` → focus the offending field.
- **Autosave must never claim success on a failed write** — replace the current false "✓ Saved" with "Not saved — conflict detected" plus a Compare/Reload affordance (Finding #14).
- Image load failure falls back to the placeholder block, never `display:none` (which collapses the grid cell).

## 27.5 Confirmation policy
Confirm (modal) for: **Reject** (with reason), **Unpublish**, **Delete/Archive**, **Publish now** when the article has never been published, **Take over** a claimed review, **Change role**, **Remove user**, and any bulk action over 5 items.
Do **not** confirm: save, submit, approve, request changes (the reason textarea is already deliberate friction), schedule, claim, filter/sort/paginate.
Destructive modals state the consequence in one sentence and label the confirm button with the verb ("Archive article"), never "OK".

---

# 28. Recommended CSS / Design System

## 28.1 Fix the tokens first (blocking everything else)

Add to `:root` in `app/globals.css` — these are aliases onto the palette that already exists, so nothing else changes:
```css
:root{
  /* aliases that resolve the ~90 broken references */
  --bg: var(--paper);
  --bg-elevated: var(--surface);
  --ink-muted: var(--muted);
  --surface-1: var(--surface);
  --success: var(--ok);
  --warning: var(--warn);
  --error: var(--bad);
}
```
Then add console-scoped semantics:
```css
:root{
  --console-bg: var(--paper);
  --console-surface: var(--surface);
  --console-rule: var(--line);
  --console-rule-strong: var(--line-2);
  --focus-ring: 0 0 0 2px var(--paper), 0 0 0 4px var(--accent);

  --cs-h1: 24px; --cs-h2: 16px; --cs-title: 15px;
  --cs-body: 13px; --cs-meta: 12px; --cs-micro: 11px;

  --cs-row-h: 72px; --cs-row-h-compact: 52px;
  --cs-page-x: clamp(16px, 3vw, 32px);
  --cs-sidebar-w: 248px;
}
[data-theme="dark"]{
  --focus-ring: 0 0 0 2px var(--paper), 0 0 0 4px var(--accent);
}
```
**Then delete the alias layer progressively** by renaming the ~90 call sites to the canonical tokens, so the codebase ends with one vocabulary. The aliases exist to make the fix landable in one safe commit.

## 28.2 Typography scale (six steps, three weights)

| Role | Size/line | Weight | Family | Colour |
|---|---|---|---|---|
| Page title | 24/1.2, -0.01em | 700 | `--f-ui` | `--ink` |
| Section heading | 16/1.3 | 600 | `--f-ui` | `--ink` |
| Group label (nav, section eyebrow) | 11/1, 0.18em, uppercase | 600 | `--f-ui` | `--muted` |
| Article title in list | 15/1.35 | 600 | `--f-ui` | `--ink` |
| Body / cell | 13/1.5 | 400 | `--f-ui` | `--ink-2` |
| Metadata | 12/1.4 | 400 | `--f-ui` | `--muted` |
| Micro (badges, counts) | 11/1, 0.04em | 600 | `--f-ui` | contextual |

Three weights only: 400, 600, 700. `--f-display` (Fraunces) is reserved for **big numbers** in dashboard figures and nothing else in the console; `--f-body` (Newsreader) is reserved for article preview content. This kills the current 14-size / mixed-weight sprawl.

## 28.3 Spacing
Use the existing `--sp-*` scale exclusively: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 72.
| Relationship | Value |
|---|---|
| Page padding X | `--cs-page-x` (16→32 fluid) |
| Page padding top | `--sp-6` (32) |
| Header → first content | `--sp-5` (24) |
| Between major sections | `--sp-6` (32) |
| Section heading → content | `--sp-4` (16) |
| Between filter controls | `--sp-3` (12) |
| List row padding Y | `--sp-3` (12) |
| Inside a form group | `--sp-2` (8) |
| Between form groups | `--sp-4` (16) |
| Button padding | `10px 16px` (md), `6px 10px` (sm) |
No arbitrary pixel values in new code. Lint rule (see §34, TASK-30) to catch regressions.

## 28.4 Surfaces, borders, dividers — the no-box rules

1. **Default background is `--paper`.** A raised surface (`--surface`) is used **only** for: modals, drawers/sheets, dropdown menus, the sticky bulk-action bar, and the sidebar. That is the complete list.
2. **No `.cs-card` around lists, tables, filters, stats or page sections.** Group with a heading + whitespace + one hairline.
3. **One divider weight:** `1px solid var(--line)`. `--line-2` only for a deliberate section break.
4. **Shadows:** `--shadow-1` for dropdowns/popovers, `--shadow-2` for modals/drawers. **Nowhere else.** No hover lift, no card shadow, no button shadow.
5. **Radius:** `--r-sm` (3px) for badges, inputs, buttons and thumbnails; `--r-md` (6px) for modals and sheets. Nothing else. No pills, no `50%` except avatars.
6. **Never place two bordered containers adjacent.** If two things need separating, use 32px of space or one hairline — not two borders.
7. **Dashboard figures are typography, not tiles:** a horizontal row of `label / big number / delta` separated by vertical hairlines, on the page background.

```
 DRAFTS        IN REVIEW       APPROVED      SCHEDULED      PUBLISHED 30D
 12            7 ⚠             3             5              41
 3 stale       oldest 2d       ready         next: 6pm      +12%
 ────────────┼─────────────┼─────────────┼─────────────┼──────────────
```

## 28.5 Colour discipline
- `--accent` (red) is used for: the logo mark, the primary button, the active-nav indicator, and focus rings. **Nothing else.** It is never a status colour, never a border colour, never a background tint on a row.
- Status semantics use `--ok` / `--warn` / `--bad` / `--muted` at ≤12% tint.
- Destructive buttons: `--bad` text on transparent with a `--bad` border; solid `--bad` fill **only** inside a confirmation modal on the confirming button.
- **Fix `.btn-cs.primary`**: `background: var(--accent); color: #fff;` in both themes (currently `color: var(--ink)`), and darken the dark-mode accent for button fills so contrast ≥4.5:1.
- **Define `.btn-cs.danger`** (currently referenced and missing).

## 28.6 Component primitives to build (`components/console/`)

| Primitive | Replaces |
|---|---|
| `PageHeader` | ad-hoc `<h1>` + `.cs-sub` + inline flex headers in 8 files |
| `SectionHeading` | inline `<h2 style={{marginTop:'2rem'}}>` |
| `DataList` / `DataRow` / `DataCell` | the inline-styled `<table>` in `StoryDataTable` |
| `ArticleRow` | the article-specific row |
| `StatusBadge` | the ternary colour chain |
| `FilterBar` / `FilterChip` / `FilterSheet` | `StoryDataTable`'s three raw `<select>`s |
| `SearchInput` | raw `.ed-input` |
| `Pagination` | does not exist |
| `Button` (variants: primary / default / ghost / danger; sizes sm/md) | `.btn-cs`, `.act`, and raw `<button>` |
| `Menu` (dropdown, keyboard-navigable) | inline action links |
| `Modal` | extend the existing `components/ui/ConfirmDialog.tsx` |
| `Sheet` (mobile drawer) | does not exist in the console |
| `EmptyState` | 5 one-line strings |
| `Skeleton` | does not exist |
| `Figure` (dashboard metric) | `.stat` |
| `PermissionDenied` | 3 duplicated 40-line inline blocks |
| `Timeline` | the inline timeline in `ReviewWorkspace` |

**Styling approach:** because Tailwind v4 is installed and `@theme inline` already exposes the tokens, new primitives should use **Tailwind utility classes referencing the tokens** (`bg-surface`, `text-muted`, `border-line`) rather than adding to the 4,110-line `globals.css`. Keep the existing `.cs-*` classes working during migration; retire them per-component as each primitive lands. **Do not introduce a CSS-in-JS library or a component library** — both would be new dependencies for no gain.

---

# 29. Recommended Responsive System

Standardise on four breakpoints and delete the ad-hoc ones from new code:
`sm 640` · `md 768` · `lg 1024` · `xl 1280`.

| Region | <768 | 768–1023 | ≥1024 |
|---|---|---|---|
| Sidebar | hidden; hamburger → left sheet, focus-trapped, `Esc` closes, closes on navigation | hidden; sheet | fixed 248px |
| Top bar | logo + hamburger + notifications + avatar | + "View site" | full |
| Page padding | 16px | 24px | 32px |
| Dashboard figures | 2-col grid | 3-col | single hairline-separated row |
| Dashboard blocks | stacked | stacked | 2-col `minmax(0,1.3fr) minmax(0,1fr)` |
| Filters | search + "Filters (n)" → bottom sheet | search + 2 inline + overflow | full toolbar |
| Article list | stacked rows | reduced grid | full grid |
| Row actions | bottom sheet | menu | menu |
| Review screen | tabs: Preview / Decide / History | tabs | 60/40 split |
| Editor | single column, sticky bottom action bar | single column | 2-col `.ed-grid` |
| Modals | full-screen sheet | centred, max 560px | centred |

**Hard rules:** `overflow-x: hidden` must never be needed to fix a layout — no element may exceed the viewport. No table is allowed to horizontally scroll. All tap targets ≥44×44px. Test at 320, 375, 768, 1024, 1440.

---

# 30. Recommended Accessibility

1. **Remove `role="dialog" aria-modal="true"` from the console shell.** Use `<div class="console">` with a real `<header>`, `<nav aria-label="Console">` and `<main id="console-main">`.
2. Add a skip link: "Skip to content" → `#console-main`, visible on focus.
3. `aria-current="page"` on the active nav item; never rely on colour for active state — add a 2px `--accent` left bar.
4. Status must never be colour-only: every badge carries text and an icon with `aria-hidden` on the icon.
5. Focus visible everywhere: `outline: none` is banned without a replacement `box-shadow: var(--focus-ring)`.
6. Contrast: verify `--muted` on `--paper` (light) and on `--surface` (dark) reach 4.5:1 for 12–13px text; darken `--muted` in light mode if not. Fix `.btn-cs.primary` per §28.5.
7. Tables: if a semantic `<table>` is used, provide `<caption class="sr-only">`, `scope="col"`, and `aria-sort` on sortable headers. If a grid list is used instead, apply `role="table"/"row"/"cell"` or use a plain list with headings — do **not** leave `<td style="display:flex">` as it is today.
8. Modals and sheets: focus trap, restore focus on close, `Esc` closes, `aria-labelledby`/`aria-describedby`, background `inert`.
9. Forms: every input has a `<label for>` (the editor mostly does); errors linked with `aria-describedby` and `aria-invalid`; the first invalid field receives focus on submit.
10. Live regions: the toast container already has `role="status" aria-live="polite"` (`lib/utils.ts`) — reuse it for save/decision feedback rather than `alert()` (which `ReviewWorkspace` currently uses).
11. Respect `prefers-reduced-motion` (already honoured at `globals.css:3609`) for skeletons, sheets and transitions.
12. Keyboard shortcuts must be discoverable and non-conflicting: `/` search, `g a` articles, `g r` review, `?` shortcut help.

---

# 31. Recommended Security

1. **Every server action re-reads the actor from the database** (`db.user.findUnique({ select:{ id, role, authorId } })`) before authorising. This closes the stale-JWT hole affecting `deleteArticle`, `updateUserRole`, `deleteUser`, `createCategory`, `createTag` and `updateProfile`. A small request-scoped `React.cache()` wrapper avoids duplicate reads.
2. **Central `authorize()` in every mutation**, resource-aware. No inline role strings.
3. **Status is not client-writable.** `upsertArticle` must strip `status`; only `app/actions/workflow.ts` changes it, and only along whitelisted edges.
4. **Ownership verified server-side on every article mutation**, including `deleteArticle` (today it has none).
5. **Soft delete by default.** Hard delete restricted to OWNER/ADMIN, behind confirmation, and blocked when dependent `ArticleRevision`/`Comment` rows exist unless explicitly cascaded.
6. **User removal should deactivate, not `db.user.delete`.** Add `User.deactivatedAt`; block sign-in when set. Hard delete only after reassigning or anonymising `ArticleRevision.userId`. This prevents both the accidental-destruction and the FK-crash problems.
7. **Role changes must invalidate the session.** Either bump a `User.sessionVersion` compared in the NextAuth `jwt` callback, or shorten the JWT lifetime and re-read the role in the `session` callback. Without this, a demotion is not enforced until the token expires.
8. **Middleware should enforce a coarse role gate** in addition to authentication: deny `/admin/users`, `/admin/subscribers`, `/admin/audit-logs` at the edge for roles that cannot use them, as defence in depth (the page-level guards stay).
9. **Zod-validate every server action input**, including ids (`z.string().uuid()`), enum transitions, and reason length. `upsertArticle` currently takes `data: any`.
10. **Rate-limit** the workflow actions and search using the existing `lib/rateLimit.ts` (already used for comments).
11. **Keep sanitising** with `sanitizeArticleHtml` (already correct) and keep the media-domain allowlist aligned between `lib/sanitize.ts` and `next.config.ts`.
12. **Never serialise fields the actor may not see** into RSC payloads — the field projection in §21.1 is a security control as well as a performance one.
13. **Audit every privileged action**, including the ones currently unaudited (taxonomy, profile, comments, subscriber access, settings).
14. **Cron endpoint** protected with a constant-time bearer comparison; never exposed without a secret.
15. **Verification method:** for each capability, call the server action directly (e.g. via `curl` against the action endpoint or a Node script importing it) as each role, with the UI bypassed, and assert a `FORBIDDEN` result. UI visibility is never the test.

---

# 32. Recommended Performance

| Problem (verified) | Fix | Expected effect |
|---|---|---|
| Full `contentHtml`+`contentJson` in every list row, serialised to a client component | Field projection (§21.1) | Row payload from potentially ~50 KB to ~1 KB |
| Whole table fetched, no `take` | Server pagination, `perPage` 25 | Bounded query and payload |
| No indexes on any Article filter column | Seven indexes (§23.1) | Sequential scans → index scans on every list, queue and public page |
| `count()` + `findMany` as two round trips | `db.$transaction([findMany, count])` | One round trip |
| Status facet counts | one `groupBy({ by:['status'], _count:true })` with the same scope | 1 query instead of 8 |
| Dashboard issues 6 sequential awaits | `Promise.all` of scoped `count()`s | ~6× lower latency |
| `layout.tsx` re-reads the user on every navigation, and pages re-read it again | `React.cache()`-wrapped `getActor()` | 1 query per request instead of 2–3 |
| Client-side filter/search over the full set | Server filtering | No large client arrays |
| Entire TipTap bundle loads with the editor route | `next/dynamic` with `ssr:false` for the editor body; keep the metadata form static | Faster editor TTI |
| `StoryDataTable` is a client component receiving all rows | Make the list a **server** component; only the filter bar, row menu and bulk bar are client islands | Large RSC payload reduction |
| Images are raw `<img>` with remote URLs | `next/image` with fixed `width`/`height` and `sizes` | Optimised, no CLS |
| `ArticleRevision` written on every 5 s autosave, storing both HTML and JSON | Only snapshot on **manual save and status transition**; autosave updates the article without a revision. Optionally retain the last N per article. | Orders of magnitude less write volume and storage |
| `revalidatePath("/", "layout")` on every save including autosave | Revalidate only on transitions that change public output | Far less cache churn |
| No `loading.tsx`, `force-dynamic` everywhere | Streaming with Suspense + skeletons | Perceived latency |

**Explicitly not recommended:** a Redis cache, a search service, an analytics pipeline, a job queue service (a cron route suffices), a GraphQL layer, or a state-management library. None is justified by the current data volume or team size.

---

# 33. Missing Features

Features that do not exist in the codebase at all (verified by absence, not assumption):

| # | Missing feature | Evidence of absence | Priority |
|---|---|---|---|
| M1 | Unified article index (all statuses in one place) | only `PUBLISHED` and `DRAFT+REVISION_REQUESTED` lists exist | CRITICAL |
| M2 | Visibility of `SUBMITTED` / `REVIEW` / `REJECTED` to authors | no query anywhere selects them for an author | CRITICAL |
| M3 | Scheduled publishing execution | `app/api/` contains only `auth/[...nextauth]`; no cron config | CRITICAL |
| M4 | `APPROVED` state | not in `enum ArticleStatus` | HIGH |
| M5 | Review metadata (`submittedAt`, `reviewedAt`, `reviewedById`, reason, reason code) | not in `model Article`; no `ArticleReview` model | HIGH |
| M6 | Server-side filtering / sorting / pagination | `StoryDataTable` filters in `useMemo`; no `take`/`skip` anywhere | HIGH |
| M7 | Database indexes | zero `@@index` in `schema.prisma` | HIGH |
| M8 | Working REVIEWER capabilities | `canEditArticle` has no REVIEWER branch | HIGH |
| M9 | Article thumbnails in lists | `img` never rendered outside the editor preview | HIGH |
| M10 | Notifications | `model Notification` exists; `grep "db.notification"` → 0 matches | HIGH |
| M11 | Capability layer | `lib/permissions.ts` is role-string based; 12 inline `role ===` sites | HIGH |
| M12 | Mobile console navigation | `.cs-nav` is a horizontal scroll strip <900px; `MobileDrawer` is public-only | HIGH |
| M13 | Loading / error / not-found boundaries in the console | no `loading.tsx`, `error.tsx`, `not-found.tsx` under `app/admin` | MEDIUM |
| M14 | Authors admin section | no `/admin/authors` route | MEDIUM |
| M15 | Taxonomy edit / delete / merge | `app/actions/taxonomy.ts` exports only get/create | MEDIUM |
| M16 | Publication-level settings | no route, no model, no action | MEDIUM |
| M17 | Bulk article actions | no selection UI, no bulk action | MEDIUM |
| M18 | Article detail hub | clicking always goes to the editor | MEDIUM |
| M19 | Revision diff / restore | revisions are written; only `notes` and `statusChange` are read | MEDIUM |
| M20 | Media library / uploads / alt text | URL input only; no `alt` field on `Article` | MEDIUM (OPTIONAL until storage chosen) |
| M21 | `homepagePlacement` actually driving the homepage | `app/(public)/page.tsx:30` uses `featured` only | MEDIUM |
| M22 | Audit-log filtering, search, pagination, export | `take: 100`, nothing else | LOW |
| M23 | Editorial activity feed | no aggregate view of `ArticleRevision`/`AuditLog` | LOW |
| M24 | Subscriber export / manual unsubscribe | read-only page | LOW |
| M25 | Tests and CI | `find . -name "*.test.*"` → empty; no workflow file | MEDIUM |
| M26 | Withdraw-submission action for authors | no path out of `SUBMITTED` for an author | MEDIUM |
| M27 | Author delete-own-draft | `canDeleteArticle` excludes AUTHOR | MEDIUM |
| M28 | Reading time stored/displayed in lists | computed in the editor only, never persisted | LOW |
| M29 | Session invalidation on role change | JWT role set once at sign-in | HIGH (security) |
| M30 | Redirect/slug-history management UI | `previousSlugs` maintained silently, no admin view | LOW |

---

# 34. Critical Tasks

| ID | Title |
|---|---|
| TASK-01 | Make every article visible to the people responsible for it (unified server-side index) |
| TASK-02 | Introduce the capability layer and route every check through it |
| TASK-03 | Model the review workflow (schema: states, timestamps, `ArticleReview`, indexes) |
| TASK-04 | Build dedicated, server-authorised workflow transition actions |
| TASK-05 | Fix `deleteArticle` authorisation and convert deletion to archive-by-default |
| TASK-06 | Implement scheduled publishing execution |
| TASK-07 | Stop shipping article bodies to the client; project only list fields |

# 35. High Priority Tasks

| ID | Title |
|---|---|
| TASK-08 | Server-side filtering, search, sorting and pagination |
| TASK-09 | Rebuild the article list as an image-aware editorial row |
| TASK-10 | Build the review queue and the focused review screen |
| TASK-11 | Rejection and change-request workflow with persisted, visible reasons |
| TASK-12 | Role-specific dashboard overview |
| TASK-13 | Role-aware grouped navigation with a mobile drawer |
| TASK-14 | Fix the design tokens and establish the console design system |
| TASK-15 | Fix the editor: state-aware actions, honest autosave, working tags |
| TASK-16 | Invalidate sessions on role change; re-read the actor from the DB in every action |
| TASK-17 | Notifications for workflow events |

# 36. Medium Priority Tasks

| ID | Title |
|---|---|
| TASK-18 | Article detail hub with role-aware click routing |
| TASK-19 | Authors admin section |
| TASK-20 | Taxonomy edit / delete / merge |
| TASK-21 | Loading, error, empty and not-found states across the console |
| TASK-22 | Responsive console: breakpoints, stacked rows, filter sheet |
| TASK-23 | Bulk article actions |
| TASK-24 | Publication settings |
| TASK-25 | Revision retention policy and diff/restore |
| TASK-26 | Accessibility remediation |
| TASK-27 | Audit-log completeness, filtering and pagination |
| TASK-28 | Test suite and CI |

# 37. Low Priority Tasks

| ID | Title |
|---|---|
| TASK-29 | Remove development scaffolding from the editor (`fillTestData`, template picker, `EDITOR_CATEGORIES`) |
| TASK-30 | CSS consolidation: retire `.cs-*`/`.admin-*` duplication, add a design-token lint rule |
| TASK-31 | Make `homepagePlacement` functional (or remove the control) |
| TASK-32 | Repository hygiene: real README, move `htm_2.html` out of the root, reconcile or delete `AGENT_SKILL.md` |
| TASK-33 | Media library (OPTIONAL — only once an object-storage provider is chosen) |

---

# 38. Implementation Tasks

Each task is independently actionable. Evidence cited is from this audit.

---

## TASK-01 — Unified, server-scoped article index

**PRIORITY:** CRITICAL

**CURRENT STATE.** Three separate list routes with hardcoded status filters and no pagination.

**EVIDENCE.**
- `app/admin/(authenticated)/articles/page.tsx:17-21` — `where: { status: "PUBLISHED" }` (+ `authorId` for AUTHOR).
- `app/admin/(authenticated)/drafts/page.tsx:17-24` — `status: { in: ["DRAFT","REVISION_REQUESTED"] }`.
- `app/admin/(authenticated)/submissions/page.tsx:53` — `status: { in: ["SUBMITTED","REVIEW","REVISION_REQUESTED"] }`.
- `components/editorial/StoryDataTable.tsx:35-42` — all filtering is `useMemo` over the loaded array.

**PROBLEM.** An article in `SUBMITTED`, `REVIEW` or `REJECTED` appears in no list an author can reach, and `REJECTED` appears in no list at all. Editors cannot see the whole pipeline in one place. Filters cannot express anything the three hardcoded queries do not already encode.

**ROOT CAUSE.** Status scoping is expressed as three route-level constants rather than as a parameter of one query, and no query layer exists between pages and Prisma.

**DESIRED BEHAVIOUR.** One route, `/admin/articles`, URL-driven (§19.1), server-scoped by capability (§21.1), covering every status, with role-appropriate defaults, and with `/admin/drafts` and `/admin/submissions` redirecting to the equivalent filtered URL.

**IMPLEMENTATION PLAN.**
1. Create `lib/queries/articles.ts` with `listArticles(params)` implementing scope → filters → search → sort → paginate, returning `{rows,total,page,perPage,pageCount,facets,needsAuthorProfile}`.
2. Create `lib/console/searchParams.ts` to parse/validate/serialise the URL contract with Zod, clamping `page` and whitelisting `sort`/`dir`.
3. Rewrite `app/admin/(authenticated)/articles/page.tsx` as a server component reading `searchParams` and rendering `<FilterBar>` (client island) + `<ArticleList>` (server) + `<Pagination>`.
4. Convert `/admin/drafts` to `redirect("/admin/articles?status=DRAFT")` (permanent within the app; keep the route file so existing bookmarks work).
5. Leave `/admin/submissions` in place as a redirect to `/admin/review` (TASK-10).

**FILES.** new `lib/queries/articles.ts`, `lib/console/searchParams.ts`; rewrite `app/admin/(authenticated)/articles/page.tsx`; replace `drafts/page.tsx`, `submissions/page.tsx`; `components/editorial/StoryDataTable.tsx` superseded by TASK-09.

**ROLE & PERMISSIONS.** Scope is applied before any user-supplied filter and cannot be widened by URL manipulation. Actors without `article.viewPipeline` are restricted to `authorId = actor.authorId`; if `authorId` is null, return an empty set plus `needsAuthorProfile:true` (never the `"none"` sentinel).

**DATA.** No schema change required for this task (indexes land in TASK-03). Query uses the projection in §21.1.

**UI/UX.** Page header, filter toolbar, list, pagination — no wrapper card. Status tabs with facet counts.

**CSS/DESIGN.** Per §28; requires TASK-14 tokens to look correct, but is functionally independent.

**RESPONSIVE.** Filters collapse to a sheet <768px (TASK-22 supplies the primitive; ship a simple stacked fallback if TASK-22 has not landed).

**ACCESSIBILITY.** Filter controls labelled; result count in an `aria-live="polite"` region; pagination is a `<nav aria-label="Pagination">`.

**SECURITY.** Scope enforced in the query function, not the page. Add a unit test asserting a CONTRIBUTOR passing `?view=all&author=<other>` still receives only their own rows.

**PERFORMANCE.** `take`/`skip`, projection, `$transaction([findMany,count])`, one `groupBy` for facets.

**STATES.** Loading skeleton; distinct empty states for "no articles" vs "no results for these filters"; error boundary with Retry.

**BACKWARD COMPATIBILITY.** `/admin/drafts` and `/admin/submissions` must not 404. The `SUBMITTED`/`REVISION_REQUESTED` enum values must still be listable before TASK-03 migrates them.

**TESTING.** Unit: scope for each role; filter composition (search AND author AND category); page clamping; sort whitelist. Integration: each role's default view. E2E: author sees their rejected article.

**ACCEPTANCE CRITERIA.**
- Every article, in every status, is reachable by its author and by editors.
- `?q=AI&author=X&category=Y` returns the intersection.
- Page size is respected; total and page count are correct.
- A CONTRIBUTOR cannot see another person's article by any URL.
- No response contains `contentHtml` or `contentJson`.

**VERIFICATION.** Create one article per status via seed; sign in as each role; confirm the matrix in §16. Inspect the RSC payload in DevTools for body fields. Check `$queryRaw` / Prisma logs for `LIMIT`.

**ROLLBACK / RISK.** Additive; the old routes become redirects. Risk: a role scoped too tightly and unable to see their work — mitigate with the `needsAuthorProfile` flag and an explicit empty-state message.

### CODING AGENT PROMPT

ROLE:
You are a senior full-stack engineer working inside an existing technology publishing platform.

TASK:
Replace the three hardcoded article list routes with a single, server-scoped, URL-driven article index at `/admin/articles`.

FIRST:
Inspect the existing implementation before modifying anything. Read `app/admin/(authenticated)/articles/page.tsx`, `drafts/page.tsx`, `submissions/page.tsx`, `components/editorial/StoryDataTable.tsx`, `lib/permissions.ts`, and `prisma/schema.prisma`.

CURRENT IMPLEMENTATION:
Three server components each run a `db.article.findMany` with a hardcoded `status` filter, no `select`, no `take`, and `include: { category: true, authorModel: true }`. They pass the full array into `StoryDataTable`, a client component that filters with `useMemo`. `/admin/articles` shows only `PUBLISHED`; `/admin/drafts` shows `DRAFT` and `REVISION_REQUESTED`; `/admin/submissions` shows `SUBMITTED`, `REVIEW` and `REVISION_REQUESTED`. Author scoping is `isAuthorOnly ? { authorId: authorId || "none" } : {}`.

PROBLEM:
Articles in `SUBMITTED`, `REVIEW` or `REJECTED` are invisible to their authors, and `REJECTED` articles are invisible to everyone. There is no pagination, filtering happens on already-loaded data, and full article bodies are serialised to the browser.

ROOT CAUSE:
Status scoping is encoded as route-level constants instead of query parameters, and there is no query layer between pages and Prisma.

GOAL:
One `/admin/articles` route whose view, status, author, category, date range, search, sort and page all live in the URL, are validated server-side, are applied in the database, and are intersected with a non-overridable capability-based scope.

FUNCTIONAL REQUIREMENTS:
- Accept `view, status (CSV), author, category, q, from, to, dateField, sort, dir, page, perPage`.
- Defaults by role: OWNER/ADMIN `view=all`; EDITOR `view=all&status=IN_REVIEW,APPROVED,SCHEDULED`; REVIEWER `view=review`; AUTHOR/CONTRIBUTOR `view=mine`.
- Search matches `title`, `deck`, `slug`, `authorModel.name` and the legacy `author` string, case-insensitively. Never search `contentHtml`.
- Search and filters compose with AND.
- Return status facet counts for the current scope using one `groupBy`.
- `/admin/drafts` and `/admin/submissions` must redirect, not 404.

ROLE & PERMISSIONS:
Apply the scope before user filters. Actors lacking `article.viewPipeline` are restricted to `authorId = actor.authorId`. If `actor.authorId` is null, return zero rows and a `needsAuthorProfile: true` flag; never use a `"none"` sentinel string. URL manipulation must not widen scope.

DATA REQUIREMENTS:
Use a `select` projection containing only: `id, slug, title, deck, img, status, featured, views, createdAt, updatedAt, publishedAt, scheduledFor`, plus `authorModel {id,name,slug,avatar}`, `author`, `category {id,name,slug}`. Never select `contentHtml` or `contentJson`. Use `db.$transaction([findMany, count])`.

ARTICLE WORKFLOW:
No workflow changes in this task. The query must handle every current enum value including `SUBMITTED`, `REVIEW`, `REVISION_REQUESTED` and `REJECTED`.

UI/UX REQUIREMENTS:
Page header (eyebrow, H1, count sub-line, primary action), a filter toolbar with search, status tabs showing facet counts, author select, category select and date range, then the list, then pagination. No wrapper card around any of these; separate them with 1px `var(--line)` rules and whitespace.

DESIGN SYSTEM:
Use existing tokens: `--ink`, `--muted`, `--line`, `--surface-2`, `--sp-*`, `--r-sm`. Do not introduce new colours. Do not add shadows.

RESPONSIVE REQUIREMENTS:
Desktop full toolbar; tablet search plus two controls and an overflow; mobile search plus a "Filters (n)" button. No horizontal page overflow at 320px.

ACCESSIBILITY:
Labelled controls, `aria-live="polite"` result count, `<nav aria-label="Pagination">`, visible focus rings.

SECURITY:
Validate all search params with Zod. Whitelist sort fields; never interpolate user input into `orderBy`. Clamp `page` and `perPage`. Enforce scope in the query function so every caller inherits it.

PERFORMANCE:
Server-side pagination with `take`/`skip`, the projection above, a single transaction for rows plus count, and one `groupBy` for facets.

ERROR STATES:
Add `app/admin/(authenticated)/articles/error.tsx` with a plain-language message and a Retry button that calls `reset()`.

EMPTY STATES:
Distinguish "no articles yet" (offer Create) from "no results for these filters" (offer Clear filters) from "complete your author profile" when `needsAuthorProfile` is true.

LOADING STATES:
Add `loading.tsx` with a row skeleton matching the final layout. Use `useTransition` for filter changes so the current list dims rather than unmounting.

BACKWARD COMPATIBILITY:
Keep `/admin/drafts` and `/admin/submissions` working as redirects. Do not change the `ArticleStatus` enum in this task. Do not break `/admin/editor/[id]` links.

TESTING:
Unit tests for scope per role, filter composition, page clamping and the sort whitelist. An integration test asserting a CONTRIBUTOR cannot widen scope via the URL.

ACCEPTANCE CRITERIA:
Every article is reachable by its author and by editors; combined search and filters intersect correctly; pagination totals are accurate; no response contains article bodies; no role can widen its scope via the URL.

VERIFICATION:
Seed one article per status per author. Sign in as each role and verify against the permission matrix. Inspect the RSC payload for `contentHtml`. Confirm `LIMIT` appears in the Prisma query log.

CONSTRAINTS:
* Do not rewrite unrelated code.
* Do not remove existing functionality unnecessarily.
* Reuse existing architecture where practical.
* Reuse existing dependencies when possible.
* Do not add unnecessary packages.
* Enforce sensitive permissions server-side.
* Preserve existing data.
* Maintain responsive behavior.
* Maintain accessibility.
* Review the diff before completion.

---

## TASK-02 — Capability layer

**PRIORITY:** CRITICAL

**CURRENT STATE.** `lib/permissions.ts` exposes role-name functions plus a numeric hierarchy; role strings are also compared inline in at least 12 other files.

**EVIDENCE.** `lib/permissions.ts` (`ROLE_HIERARCHY`, `canEditArticle`, `canPublishArticle`, `canDeleteArticle`, `canView*`); inline comparisons in `taxonomy/page.tsx:11`, `app/actions/taxonomy.ts:9`, `app/actions/profile.ts` (`isEditorialAdmin`), `ReviewWorkspace.tsx:25`, `ArticleEditor.tsx:478`, `admin/page.tsx:21`, `articles/page.tsx:14`, `drafts/page.tsx:14`, `StoryDataTable.tsx` (`userRole !== "AUTHOR"`), `AdminNavLinks.tsx` (`userRole === "AUTHOR"`), `app/actions/article.ts` (`dbUser.role === "AUTHOR"`), `users/page.tsx` (`currentUser.role === "OWNER"`).

**PROBLEM.** UI and server disagree (REVIEWER sees Taxonomy and is redirected; REVIEWER sees review buttons that always fail; STAFF sees "New Story" and cannot save). A linear hierarchy cannot express orthogonal axes — `MODERATOR` (70) outranks `REVIEWER` (60) despite being a non-editorial role.

**ROOT CAUSE.** No single source of truth. Each surface re-derives permission from role names.

**DESIRED BEHAVIOUR.** `lib/capabilities.ts` exports `Capability`, `ROLE_CAPABILITIES`, `can()` and resource-aware `authorize()`. Every page guard, nav item, row action and server action calls it. `lib/permissions.ts` is retained as a compatibility shim delegating to the new module.

**IMPLEMENTATION PLAN.**
1. Write `lib/capabilities.ts` per §15.2, including the `CONTRIBUTOR` mapping and deprecation of `STAFF`.
2. Add `lib/console/actor.ts` exporting a `React.cache()`-wrapped `getActor()` that reads `{id, role, authorId}` from the DB once per request.
3. Rewrite `lib/permissions.ts` functions as wrappers so no call site breaks.
4. Replace the 12 inline comparisons, file by file.
5. Add `requireCapability(cap, resource?)` for page guards that throws a typed error rendered by a shared `PermissionDenied` component.

**FILES.** new `lib/capabilities.ts`, `lib/console/actor.ts`, `components/console/PermissionDenied.tsx`; modified `lib/permissions.ts` + the 12 call sites.

**ROLE & PERMISSIONS.** Encodes §16 exactly. `CONTRIBUTOR` must be added to `enum Role` (migration) before it can be assigned; the capability map can ship first.

**DATA.** Prisma migration adding `CONTRIBUTOR` to `enum Role`. Purely additive.

**UI/UX.** One `PermissionDenied` component replaces three duplicated 40-line inline blocks.

**SECURITY.** `getActor()` reads the role from the database, not the JWT — this alone fixes the stale-role class of bug.

**TESTING.** A table-driven test asserting the full §16 matrix: for every (role, capability, resource) triple, the expected result. This test is the executable specification.

**ACCEPTANCE CRITERIA.** No `role === "…"` string comparison remains outside `lib/capabilities.ts`; the matrix test passes; every nav item's visibility condition is the same capability its route guard uses.

**VERIFICATION.** `grep -rn 'role === "' app components lib | grep -v lib/capabilities.ts` returns nothing.

**ROLLBACK / RISK.** Shim keeps old behaviour available. Risk: a capability mapped too narrowly locks someone out — mitigate by diffing the matrix test against the §7 current-state matrix and reviewing every intentional change.

### CODING AGENT PROMPT

ROLE:
You are a senior full-stack engineer working inside an existing technology publishing platform.

TASK:
Introduce a centralised capability model and route every authorization decision, in the UI and on the server, through it.

FIRST:
Inspect the existing implementation before modifying anything. Read `lib/permissions.ts` in full and find every inline role comparison with `grep -rn 'role ===\|role !==\|includes(role\|includes(user.role' app components lib`.

CURRENT IMPLEMENTATION:
`lib/permissions.ts` defines `ROLE_HIERARCHY` (OWNER 100, ADMIN 90, EDITOR 80, MODERATOR 70, REVIEWER 60, AUTHOR 50, STAFF 10) and role-name functions `canEditArticle`, `canPublishArticle`, `canDeleteArticle`, `canManageUser`, `canAssignRole`, `canViewUsersList`, `canViewAuditLogs`, `canViewReviewQueue`, `canModerateComments`, `canViewSubscribers`. At least twelve other files compare role strings inline.

PROBLEM:
UI and server disagree. `AdminNavLinks` shows Taxonomy to REVIEWER while `app/admin/(authenticated)/taxonomy/page.tsx` redirects that role away. `ReviewWorkspace` renders Approve/Request-Revision/Reject for REVIEWER, but every one routes through `canEditArticle`, which denies REVIEWER, so the action silently fails. `/admin/editor` has no role gate at all, so STAFF, MODERATOR and REVIEWER can compose an article they can never save. A single numeric hierarchy also cannot express that comment moderation and article review are independent axes.

ROOT CAUSE:
There is no single source of truth for authorization; each surface re-derives it from role names.

GOAL:
A `lib/capabilities.ts` module exporting a `Capability` union, a `ROLE_CAPABILITIES` map, `can(role, cap)` and a resource-aware `authorize(actor, cap, resource?)`. Every guard, nav item, row action and server action calls it, and `lib/permissions.ts` remains as a thin compatibility shim.

FUNCTIONAL REQUIREMENTS:
- Implement the capabilities listed in the master plan section 15.2.
- Implement the permission matrix in master plan section 16 exactly.
- Add a `CONTRIBUTOR` role to the Prisma `Role` enum via an additive migration.
- Treat `STAFF` as deprecated: keep the enum value, remove it from role pickers, grant it no capability.
- Add `lib/console/actor.ts` exporting a `React.cache()`-wrapped `getActor()` returning `{ id, role, authorId }` read from the database.
- Add `requireCapability(cap, resource?)` for page guards.
- Replace the three duplicated inline permission-denied blocks with one `components/console/PermissionDenied.tsx`.

ROLE & PERMISSIONS:
`authorize` must consider ownership and article status, for example `article.editOwn` denies an AUTHOR editing their own article while it is in review, and denies editing a published article unless a publication setting allows it.

DATA REQUIREMENTS:
One additive Prisma migration adding `CONTRIBUTOR` to `enum Role`. No data backfill. No enum values removed.

ARTICLE WORKFLOW:
No workflow changes in this task, but the capability names must match the transitions that TASK-04 will implement.

UI/UX REQUIREMENTS:
Nav items, row actions and page guards must all read the same capability, so a visible control is never one the server will refuse.

DESIGN SYSTEM:
`PermissionDenied` uses the standard page header pattern, no card, existing tokens, and offers a link back to the dashboard.

RESPONSIVE REQUIREMENTS:
`PermissionDenied` must read well at 320px.

ACCESSIBILITY:
`PermissionDenied` uses a real heading and an `role="status"` region; do not rely on colour to convey the denial.

SECURITY:
`getActor()` must read the role from the database rather than the NextAuth JWT, because the JWT role is set once at sign-in and never refreshed. Every server action must call `getActor()` then `authorize()` before mutating.

PERFORMANCE:
Wrap `getActor()` in `React.cache()` so the layout and the page share one query per request.

ERROR STATES:
`authorize` returns `{ ok: false, reason }`; server actions convert that to `{ ok:false, code:"FORBIDDEN", message }`. Never throw raw strings to the client.

EMPTY STATES:
Not applicable.

LOADING STATES:
Not applicable.

BACKWARD COMPATIBILITY:
Keep every currently exported function name in `lib/permissions.ts` working as a wrapper. Do not change behaviour for OWNER, ADMIN, EDITOR or AUTHOR except where the master plan explicitly lists a delta.

TESTING:
Write a table-driven test enumerating every (role, capability, resource-state) combination from master plan section 16 and asserting the expected result.

ACCEPTANCE CRITERIA:
`grep -rn 'role === "' app components lib` returns matches only inside `lib/capabilities.ts`; the matrix test passes; no nav item leads to a route that redirects the same role away.

VERIFICATION:
Sign in as each role and walk every nav item; nothing visible may be refused, nothing refused may be visible.

CONSTRAINTS:
* Do not rewrite unrelated code.
* Do not remove existing functionality unnecessarily.
* Reuse existing architecture where practical.
* Reuse existing dependencies when possible.
* Do not add unnecessary packages.
* Enforce sensitive permissions server-side.
* Preserve existing data.
* Maintain responsive behavior.
* Maintain accessibility.
* Review the diff before completion.

---

## TASK-03 — Model the review workflow

**PRIORITY:** CRITICAL

**CURRENT STATE.** `ArticleStatus` has six values; review metadata lives in `ArticleRevision.notes` (free text) and `statusChange` (the string `"DRAFT -> SUBMITTED"`); there are no indexes.

**EVIDENCE.** `prisma/schema.prisma` — `enum ArticleStatus`, `model ArticleRevision`, and zero `@@index` directives. `app/actions/article.ts` writes `statusChange: existingArticleStatus !== statusVal ? \`${existingArticleStatus} -> ${statusVal}\` : null`.

**PROBLEM.** No `APPROVED`, `SCHEDULED` or `ARCHIVED` state; no queryable reviewer, decision, reason, submitted-at or reviewed-at; no ageing or SLA; every list and public query performs a sequential scan.

**ROOT CAUSE.** The workflow was modelled as a status string plus prose, not as data.

**DESIRED BEHAVIOUR.** The schema in §23.1: new enum values, new `Article` columns, an `ArticleReview` model, a `ReviewDecision` enum, and seven justified indexes.

**IMPLEMENTATION PLAN.**
1. Migration A (additive): new enum values, new `Article` columns, `ArticleReview`, `ReviewDecision`, indexes.
2. Data migration B: `SUBMITTED`/`REVIEW` → `IN_REVIEW`; `REVISION_REQUESTED` → `CHANGES_REQUESTED`; backfill `submittedAt` from the earliest `ArticleRevision` whose `statusChange` ends in `SUBMITTED`; backfill `ArticleReview` rows from revisions whose `statusChange` contains `REVISION_REQUESTED` or `REJECTED`, using `ArticleRevision.userId` as the reviewer and `notes` as the reason.
3. Add `lib/workflow/status.ts` with `normalizeStatus()` and display labels so any un-migrated row still renders.
4. Keep the deprecated enum members; do not drop them in this release.

**FILES.** `prisma/schema.prisma`, two migration files, new `lib/workflow/status.ts`, `lib/workflow/machine.ts` (the transition whitelist).

**DATA.** As above. All additive; backfill is idempotent and re-runnable.

**SECURITY.** No direct impact, but it enables the server-side reason enforcement in TASK-11.

**PERFORMANCE.** The seven indexes are each justified against a named query in §23.1. Measure with `EXPLAIN ANALYZE` before and after on a seeded dataset.

**BACKWARD COMPATIBILITY.** Critical. The public site filters `status: "PUBLISHED"` in eight places (`app/(public)/**`, `app/sitemap.ts`) — none of those change. Anything reading `SUBMITTED`/`REVISION_REQUESTED` must go through `normalizeStatus()`.

**TESTING.** Migration test on a copy with rows in all six current statuses; assert counts before and after; assert no article is left in a status the new UI cannot display.

**ACCEPTANCE CRITERIA.** Every article has a valid new-model status; `ArticleReview` contains one row per historical review decision that can be reconstructed; `EXPLAIN` shows index usage for the article list, review queue and `/latest` queries.

**VERIFICATION.** Run the migration on a database snapshot; compare `groupBy status` counts; run the public site and confirm nothing changed for readers.

**ROLLBACK / RISK.** HIGH risk — this is the only task that rewrites existing rows. Take a database snapshot first. Migration B must be reversible via a recorded mapping. Deploy Migration A and B separately, with the application tolerating both old and new values in between.

### CODING AGENT PROMPT

ROLE:
You are a senior full-stack engineer working inside an existing technology publishing platform.

TASK:
Extend the Prisma schema so the editorial review workflow is real data: new states, review timestamps, a reviewer relation, an `ArticleReview` audit model, and the indexes the console and public site need.

FIRST:
Inspect the existing implementation before modifying anything. Read `prisma/schema.prisma` in full, `app/actions/article.ts`, and every public query that filters on status (`app/(public)/**`, `app/sitemap.ts`).

CURRENT IMPLEMENTATION:
`enum ArticleStatus` is `DRAFT | SUBMITTED | REVIEW | REVISION_REQUESTED | REJECTED | PUBLISHED`. Review context is stored only as `ArticleRevision.notes` free text and `ArticleRevision.statusChange`, a string like `"DRAFT -> SUBMITTED"`. `Article` has `scheduledFor` and `publishedAt` but no `submittedAt`, `reviewedAt` or `reviewedById`. The schema contains zero `@@index` directives. `REVIEW` is declared but never written by any code path.

PROBLEM:
There is no `APPROVED`, `SCHEDULED` or `ARCHIVED` state, so approval cannot be separated from publication and scheduling cannot be represented. Reviewer identity, decision, reason and submission time are not queryable, so the review queue cannot age, sort by submission, show who handled an item, or display a rejection reason in a list. Every article list and every public status query runs a sequential scan.

ROOT CAUSE:
The workflow was modelled as a single status string plus prose notes rather than as first-class data.

GOAL:
An additive schema migration implementing master plan section 23.1, plus a data migration mapping existing rows onto the new states, plus a `normalizeStatus()` helper so stragglers still render.

FUNCTIONAL REQUIREMENTS:
- Add enum values `IN_REVIEW`, `CHANGES_REQUESTED`, `APPROVED`, `SCHEDULED`, `ARCHIVED`. Keep `SUBMITTED`, `REVIEW` and `REVISION_REQUESTED` as deprecated members; do not remove them in this release.
- Add to `Article`: `submittedAt`, `submittedById`, `reviewedAt`, `reviewedById` with a `reviewedBy` relation to `User` using `onDelete: SetNull`, `approvedAt`, `approvedById`, `unpublishedAt`, `archivedAt`, `reviewPass Int @default(0)`.
- Add `model ArticleReview` and `enum ReviewDecision` as specified.
- Add exactly these indexes: `[status, updatedAt]`, `[status, submittedAt]`, `[authorId, status, updatedAt]`, `[categoryId, status]`, `[status, publishedAt]`, `[status, scheduledFor]`, `[reviewedById, status]`, plus `[articleId, createdAt]` and `[reviewerId, createdAt]` on `ArticleReview`.
- Add `lib/workflow/status.ts` with `normalizeStatus()` and human labels, and `lib/workflow/machine.ts` with the allowed-transition whitelist from master plan section 26.

ROLE & PERMISSIONS:
No permission changes in this task. The new columns must be writable only by the workflow actions built in the next task.

DATA REQUIREMENTS:
Two migrations. Migration A is purely additive DDL. Migration B maps `SUBMITTED` and `REVIEW` to `IN_REVIEW` and `REVISION_REQUESTED` to `CHANGES_REQUESTED`, backfills `submittedAt` from the earliest `ArticleRevision` whose `statusChange` ends in `SUBMITTED`, and reconstructs `ArticleReview` rows from revisions whose `statusChange` mentions `REVISION_REQUESTED` or `REJECTED`, using `ArticleRevision.userId` as the reviewer and `notes` as the reason. Migration B must be idempotent.

ARTICLE WORKFLOW:
This task only models the workflow. Do not change any transition behaviour yet.

UI/UX REQUIREMENTS:
None, beyond making sure existing screens still render by routing all status display through `normalizeStatus()`.

DESIGN SYSTEM:
Not applicable.

RESPONSIVE REQUIREMENTS:
Not applicable.

ACCESSIBILITY:
Not applicable.

SECURITY:
`reviewedById` and `approvedById` must reference `User`, not `Author`, so accountability is tied to a login.

PERFORMANCE:
Each index must correspond to a named query. Run `EXPLAIN ANALYZE` on the article list, review queue and `/latest` queries before and after, and record the results in the pull request.

ERROR STATES:
Migration B must fail loudly and roll back on any row it cannot map.

EMPTY STATES:
Not applicable.

LOADING STATES:
Not applicable.

BACKWARD COMPATIBILITY:
Absolutely required. Eight public queries filter `status: "PUBLISHED"` and must be unaffected. Any code reading `SUBMITTED` or `REVISION_REQUESTED` must go through `normalizeStatus()`. Deploy Migration A and Migration B separately and ensure the application tolerates both old and new values in between.

TESTING:
Run the migration against a snapshot containing rows in all six current statuses. Assert per-status counts before and after. Assert that no article is left in a status the new UI cannot display.

ACCEPTANCE CRITERIA:
All rows carry a valid new-model status; historical review decisions appear in `ArticleReview`; index usage is visible in `EXPLAIN` output; the public site is byte-identical for readers.

VERIFICATION:
Take a database snapshot, run both migrations, compare `groupBy status` counts, and browse the public site.

CONSTRAINTS:
* Do not rewrite unrelated code.
* Do not remove existing functionality unnecessarily.
* Reuse existing architecture where practical.
* Reuse existing dependencies when possible.
* Do not add unnecessary packages.
* Enforce sensitive permissions server-side.
* Preserve existing data.
* Maintain responsive behavior.
* Maintain accessibility.
* Review the diff before completion.

---

## TASK-04 — Dedicated workflow transition actions

**PRIORITY:** CRITICAL

**CURRENT STATE.** Every transition is a full `upsertArticle` call carrying the entire article payload, including a client-supplied `status`.

**EVIDENCE.** `app/actions/article.ts` — `upsertArticle(data: any)` reads `data.status`, downgrades `PUBLISHED` to `SUBMITTED` when `canPublishArticle` fails, sets `publishedAt`, clears `scheduledFor`, writes a revision and an audit row. `ReviewWorkspace.onDecision` → `handleSave(status, false, notes)` → `upsertArticle`.

**PROBLEM.** Status is client-controlled; there is no transition whitelist, so any state can be written from any state; review reasons are not enforced server-side; a decision rewrites the whole article, so a stale editor tab can clobber content while approving.

**ROOT CAUSE.** Content saving and workflow transition are the same function.

**DESIRED BEHAVIOUR.** `app/actions/workflow.ts` with the eleven functions in §23.2. `upsertArticle` no longer accepts `status`.

**IMPLEMENTATION PLAN.** For each function: `getActor()` → `authorize()` → load the article's `{id, status, authorId, reviewedById, title, slug, categoryId}` → assert the edge is in `lib/workflow/machine.ts` → validate required data (reason length, future `scheduledFor`, pre-flight for submit) → `db.$transaction` writing `Article`, `ArticleReview`/`AuditLog`, `Notification` → targeted `revalidatePath`. Use `updateMany` with a status precondition in the `where` clause for `claimReview` and `publishArticle` to make them race-safe.

**FILES.** new `app/actions/workflow.ts`; modified `app/actions/article.ts` (strip status), `components/editorial/ArticleEditor.tsx`, `components/editorial/ReviewWorkspace.tsx`.

**ROLE & PERMISSIONS.** Each function maps to one capability from TASK-02.

**SECURITY.** Pre-flight validation (title, deck ≥10, ≥50 words, category) must run **server-side** on submit — today it exists only in the client (`ArticleEditor.handleSave`).

**TESTING.** For each function: happy path, wrong-role, wrong-state, missing-reason, concurrent-claim.

**ACCEPTANCE CRITERIA.** `upsertArticle` cannot change status; every illegal edge is rejected; a reason under 20 characters is rejected server-side even when the client is bypassed.

**VERIFICATION.** Call each action directly as each role with crafted payloads and assert `FORBIDDEN`/`VALIDATION`.

**ROLLBACK / RISK.** Medium. Ship behind the existing UI first (the editor calls the new actions), keeping `upsertArticle` functional for content only.

### CODING AGENT PROMPT

ROLE:
You are a senior full-stack engineer working inside an existing technology publishing platform.

TASK:
Extract editorial workflow transitions out of the generic article save action into dedicated, individually authorized server actions backed by an explicit state machine.

FIRST:
Inspect the existing implementation before modifying anything. Read `app/actions/article.ts` in full, `components/editorial/ReviewWorkspace.tsx`, and the footer action block of `components/editorial/ArticleEditor.tsx`.

CURRENT IMPLEMENTATION:
`upsertArticle(data: any)` handles everything. It reads `data.status` from the client, silently downgrades a `PUBLISHED` request to `SUBMITTED` when `canPublishArticle` fails, sets `publishedAt` on first publish, nulls `scheduledFor` on `PUBLISHED` or `DRAFT`, writes an `ArticleRevision` on every call including autosave, and writes one `AuditLog` row. `ReviewWorkspace` calls `onDecision(status, notes)`, which calls `handleSave(status, false, notes)`, which calls `upsertArticle` with the entire form payload.

PROBLEM:
Status is client-controlled and there is no transition whitelist, so any state can be written from any state. Review reasons are validated only by a client-side `alert()`. Approving an article rewrites its entire content from whatever the reviewer's browser holds, so a stale tab can clobber the author's latest text while approving it.

ROOT CAUSE:
Content saving and workflow transition are the same function.

GOAL:
A new `app/actions/workflow.ts` exporting `submitArticle`, `claimReview`, `releaseReview`, `takeOverReview`, `approveArticle`, `requestChanges`, `rejectArticle`, `scheduleArticle`, `unscheduleArticle`, `publishArticle`, `unpublishArticle`, `archiveArticle` and `reopenArticle`, each taking an article id plus only the data that transition needs, and `upsertArticle` reduced to content-only.

FUNCTIONAL REQUIREMENTS:
Each action must: resolve the actor from the database, authorize the capability, load the article's current status and owner, assert the edge exists in the state machine from master plan section 26, validate required data, write `Article`, an `ArticleReview` or `AuditLog` row and a `Notification` inside one transaction, and revalidate only the paths whose output actually changed. `claimReview` and `publishArticle` must be race-safe, using `updateMany` with the expected current status in the `where` clause and treating a zero-row result as a conflict.

ROLE & PERMISSIONS:
Map each action to the capability of the same name from the capability module. Reviewers may approve, request changes and reject but may not schedule, publish, archive or delete. Authors may submit and withdraw their own articles and nothing else.

DATA REQUIREMENTS:
Write `submittedAt`/`submittedById` on submit, `reviewedAt`/`reviewedById` on any decision, `approvedAt`/`approvedById` on approve, `publishedAt` on first publish only, `unpublishedAt` on unpublish, `archivedAt` on archive, and increment `reviewPass` on each change request. Every decision writes one `ArticleReview` row recording decision, reason, reason code, from-status, to-status and pass number.

ARTICLE WORKFLOW:
Implement exactly the transition graph in master plan section 26. Unpublishing moves an article to `APPROVED`, not `DRAFT`. Any edge not in the graph must be rejected.

UI/UX REQUIREMENTS:
Update `ReviewWorkspace` and the editor footer to call the new actions. Replace `alert()` with the existing `showToast` utility. Actions that fail must surface the server's message.

DESIGN SYSTEM:
No visual change required in this task beyond replacing `alert()`.

RESPONSIVE REQUIREMENTS:
Unchanged.

ACCESSIBILITY:
Feedback must go through the existing `role="status" aria-live="polite"` toast container rather than `alert()`.

SECURITY:
`upsertArticle` must strip and ignore any `status` field from its payload. Run the submit pre-flight checks (non-empty title, deck of at least 10 characters, at least 50 words, a category) on the server; they currently exist only in the client. Enforce a minimum reason length of 20 characters for change requests and rejections on the server. Validate every input with Zod, including that the id is a UUID and that `scheduledFor` is in the future.

PERFORMANCE:
One transaction per transition. Do not write an `ArticleRevision` for autosaves; only for manual saves and transitions. Replace the blanket `revalidatePath("/", "layout")` with targeted revalidation.

ERROR STATES:
Return a discriminated union `{ ok:true, data } | { ok:false, code, message }` with codes `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `VALIDATION`, `RATE_LIMITED`, `SERVER`. A race lost on claim or publish returns `CONFLICT` with an actionable message.

EMPTY STATES:
Not applicable.

LOADING STATES:
Buttons disable and show an inline spinner while the action is in flight.

BACKWARD COMPATIBILITY:
Keep `upsertArticle` working for content saves so the editor keeps functioning throughout the change. Do not break existing drafts or published articles.

TESTING:
For every action, test the happy path, a wrong-role attempt, a wrong-state attempt, a missing or too-short reason, and a concurrent claim or publish.

ACCEPTANCE CRITERIA:
`upsertArticle` can no longer change status; every illegal transition is rejected; a 5-character rejection reason is refused by the server even when the client is bypassed; two reviewers cannot claim the same article.

VERIFICATION:
Invoke each action directly as each role with crafted payloads and confirm the expected `FORBIDDEN`, `VALIDATION` or `CONFLICT` result.

CONSTRAINTS:
* Do not rewrite unrelated code.
* Do not remove existing functionality unnecessarily.
* Reuse existing architecture where practical.
* Reuse existing dependencies when possible.
* Do not add unnecessary packages.
* Enforce sensitive permissions server-side.
* Preserve existing data.
* Maintain responsive behavior.
* Maintain accessibility.
* Review the diff before completion.

---

## TASK-05 — Fix delete authorization; archive by default

**PRIORITY:** CRITICAL

**CURRENT STATE.**
```ts
export async function deleteArticle(id: string) {
  const user = await getCurrentUser();
  const deletePolicy = canDeleteArticle(user.role as Role);   // JWT role
  ...
  const article = await db.article.delete({ where: { id } }); // hard delete
}
```
**EVIDENCE.** `app/actions/article.ts` `deleteArticle`; `lib/permissions.ts` `canDeleteArticle`; `app/api/auth/[...nextauth]/route.ts` jwt callback (role copied once at sign-in).

**PROBLEM.** (a) The role comes from a JWT that is never refreshed, so a demoted editor can still delete until their token expires. (b) There is no ownership check — any editor can delete any article with no additional constraint. (c) It is a hard delete of a row that cascades to `ArticleRevision` and `Comment`, with no recovery. (d) Authors cannot delete even their own draft.

**ROOT CAUSE.** Role read from the session instead of the database; no soft-delete concept.

**DESIRED BEHAVIOUR.** `archiveArticle` is the default for everyone with `article.archive`; `deleteArticlePermanently` exists for OWNER/ADMIN only, refuses when the article is or has been published unless explicitly forced, and requires typed confirmation. Authors gain `article.deleteOwnDraft`, restricted to their own `DRAFT`.

**IMPLEMENTATION PLAN.** Move both into `app/actions/workflow.ts`; use `getActor()`; call `authorize(actor, cap, { authorId, status })`; archive sets `status: ARCHIVED, archivedAt`; hard delete wrapped in a transaction that first removes dependent rows explicitly. Update `DeleteArticleButton` to `ArticleActionsMenu` semantics, showing Archive or Delete based on capability.

**FILES.** `app/actions/article.ts`, `app/actions/workflow.ts`, `components/editorial/DeleteArticleButton.tsx`, `components/ui/ConfirmDialog.tsx` (add typed-confirmation variant).

**ACCEPTANCE CRITERIA.** A demoted user's next delete attempt fails; an author can archive/delete their own draft and nothing else; archived articles are excluded from the public site and from default console views but findable under `?status=ARCHIVED`.

**VERIFICATION.** Change a user's role in the DB without signing them out; attempt a delete; expect `FORBIDDEN`.

**ROLLBACK / RISK.** Low, and strictly safer than today.

### CODING AGENT PROMPT

ROLE:
You are a senior full-stack engineer working inside an existing technology publishing platform.

TASK:
Fix article deletion: authorize from the database rather than the session, enforce ownership, and make archiving the default with permanent deletion tightly restricted.

FIRST:
Inspect the existing implementation before modifying anything. Read `deleteArticle` in `app/actions/article.ts`, `canDeleteArticle` in `lib/permissions.ts`, `components/editorial/DeleteArticleButton.tsx`, and the `jwt` and `session` callbacks in `app/api/auth/[...nextauth]/route.ts`.

CURRENT IMPLEMENTATION:
`deleteArticle` calls `getCurrentUser()`, passes `user.role` straight to `canDeleteArticle`, and on success calls `db.article.delete({ where: { id } })`. The role in that session object comes from the NextAuth JWT, which is populated once in the `jwt` callback at sign-in and never refreshed. There is no ownership check of any kind. `DeleteArticleButton` is hidden in the UI when `userRole === "AUTHOR"`.

PROBLEM:
A user demoted from EDITOR keeps the ability to delete articles until their token expires. Any editor can hard-delete any article with no additional constraint and no recovery path, cascading to its revisions and comments. Meanwhile an author cannot remove even their own abandoned draft.

ROOT CAUSE:
Authorization reads a stale role from the session, and the product has no soft-delete concept.

GOAL:
`archiveArticle` becomes the default removal path for anyone with the archive capability; `deleteArticlePermanently` is restricted to OWNER and ADMIN, refuses articles that are or have been published unless explicitly forced, and requires a typed confirmation. Authors and contributors gain the ability to delete their own drafts only.

FUNCTIONAL REQUIREMENTS:
- Resolve the actor with a database read, never from the JWT.
- `archiveArticle(id)` sets `status` to `ARCHIVED` and `archivedAt`, and writes an audit row.
- `deleteArticlePermanently(id)` is a transaction that removes dependent rows explicitly and then the article, and writes an audit row capturing the title and slug before deletion.
- `deleteOwnDraft(id)` permits an author or contributor to remove their own article only while it is in `DRAFT`.
- Archived articles are excluded from the public site and from default console views, but are findable with an explicit status filter.

ROLE & PERMISSIONS:
Archive requires `article.archive` (EDITOR and above). Permanent deletion requires `article.deleteAny` (OWNER, ADMIN). Draft deletion requires `article.deleteOwnDraft` plus matching ownership plus `status === "DRAFT"`.

DATA REQUIREMENTS:
Uses the `ARCHIVED` status and `archivedAt` column added by the schema task. No further schema change.

ARTICLE WORKFLOW:
`ARCHIVED` is reachable from `DRAFT`, `CHANGES_REQUESTED`, `APPROVED`, `REJECTED` and `PUBLISHED`, and can be reopened to `DRAFT` by OWNER or ADMIN.

UI/UX REQUIREMENTS:
Replace the standalone delete button with an action in the row menu whose label reflects what will happen: "Archive" or "Delete permanently". The confirmation modal must state the consequence in one sentence and label the confirm button with the verb.

DESIGN SYSTEM:
Destructive actions use `--bad` text on a transparent background with a `--bad` border; a solid `--bad` fill is used only on the confirming button inside the modal. Do not use `--accent` red for destructive actions.

RESPONSIVE REQUIREMENTS:
The confirmation modal becomes a full-screen sheet below 768px.

ACCESSIBILITY:
The modal traps focus, restores focus on close, closes on Escape, and is labelled by its heading.

SECURITY:
Re-read the role and author id from the database in every one of these actions. Verify ownership server-side. Never rely on the button being hidden.

PERFORMANCE:
Single transaction per operation.

ERROR STATES:
Return `FORBIDDEN` with the specific missing capability, `NOT_FOUND` for a missing article, and `CONFLICT` when the article's state changed between load and confirm.

EMPTY STATES:
Not applicable.

LOADING STATES:
The confirm button disables and shows a spinner while the action runs.

BACKWARD COMPATIBILITY:
Keep the exported `deleteArticle` name working, delegating to archive or permanent deletion according to capability, so existing call sites do not break.

TESTING:
Test a demoted user attempting deletion with a stale token, an author deleting their own draft, an author attempting to delete someone else's draft, an editor archiving a published article, and permanent deletion of an article that has revisions and comments.

ACCEPTANCE CRITERIA:
A demoted user's delete attempt fails immediately; an author can remove their own draft and nothing else; archiving is reversible; permanent deletion is available only to OWNER and ADMIN and only behind typed confirmation.

VERIFICATION:
Change a user's role directly in the database without signing them out, then attempt a delete, and confirm the server refuses.

CONSTRAINTS:
* Do not rewrite unrelated code.
* Do not remove existing functionality unnecessarily.
* Reuse existing architecture where practical.
* Reuse existing dependencies when possible.
* Do not add unnecessary packages.
* Enforce sensitive permissions server-side.
* Preserve existing data.
* Maintain responsive behavior.
* Maintain accessibility.
* Review the diff before completion.

---

## TASK-06 — Scheduled publishing execution

**PRIORITY:** CRITICAL

**CURRENT STATE.** `Article.scheduledFor` is persisted; a `datetime-local` input exists for publishers; nothing ever publishes a scheduled article.

**EVIDENCE.** `prisma/schema.prisma` `scheduledFor DateTime?`; `components/editorial/ArticleEditor.tsx:553`; `app/actions/article.ts` (`scheduledFor` set, and nulled on `PUBLISHED`/`DRAFT`); `app/api/` contains only `auth/[...nextauth]/route.ts`; no `vercel.json`; no cron.

**PROBLEM.** An editor can set a publication time and reasonably believe the article will go live. It never will. This is a silent, trust-destroying failure.

**ROOT CAUSE.** The field was added without an executor.

**DESIRED BEHAVIOUR.** §23.3.

**IMPLEMENTATION PLAN.** Create `app/api/cron/publish/route.ts` with a `CRON_SECRET` bearer guard using `timingSafeEqual`; batch of 50; race-safe `updateMany`; audit + notification per article; targeted revalidation; JSON summary response. Add `vercel.json` with a 5-minute schedule and document a self-hosted alternative. Add `CRON_SECRET` to `.env.example`. Surface failures in the OWNER/ADMIN dashboard.

**FILES.** new `app/api/cron/publish/route.ts`, `vercel.json`, `.env.example`.

**SECURITY.** Constant-time secret comparison; never log the secret; the endpoint must not be reachable without it; rate-limit.

**ACCEPTANCE CRITERIA.** An article scheduled for T is live within 5 minutes of T, has `publishedAt` set and `scheduledFor` cleared, has an audit row, and its author has a notification. An unauthenticated call returns 401.

**VERIFICATION.** Schedule for now+1 min; invoke the endpoint manually with the secret; confirm state, audit, notification and public visibility.

**ROLLBACK / RISK.** Low, additive. Risk: double publication — mitigated by the status precondition in `updateMany`.

### CODING AGENT PROMPT

ROLE:
You are a senior full-stack engineer working inside an existing technology publishing platform.

TASK:
Make scheduled publishing actually publish.

FIRST:
Inspect the existing implementation before modifying anything. Read `prisma/schema.prisma` for `scheduledFor`, the scheduling input at `components/editorial/ArticleEditor.tsx` around line 553, the `scheduledFor` handling inside `upsertArticle`, and confirm that `app/api/` contains only the NextAuth route.

CURRENT IMPLEMENTATION:
`Article.scheduledFor` is persisted. Publishers see a `datetime-local` input. `upsertArticle` stores the value and clears it whenever the status becomes `PUBLISHED` or `DRAFT`. There is no cron job, no API route, no `SCHEDULED` status, and no code anywhere that reads `scheduledFor` to publish anything. Every public query filters `status: "PUBLISHED"`.

PROBLEM:
An editor can set a publication time and believe the article will go live at that time. It never does. The feature silently does nothing.

ROOT CAUSE:
The field was added without an executor.

GOAL:
A secured cron endpoint that promotes due `SCHEDULED` articles to `PUBLISHED`, writes audit trails and notifications, revalidates the affected public paths, and surfaces failures to administrators.

FUNCTIONAL REQUIREMENTS:
- Add `app/api/cron/publish/route.ts` with `runtime = "nodejs"` and `dynamic = "force-dynamic"`.
- Require an `Authorization: Bearer <CRON_SECRET>` header, compared with `crypto.timingSafeEqual`; return 401 otherwise.
- Select articles where `status` is `SCHEDULED` and `scheduledFor` is less than or equal to now, ordered by `scheduledFor`, limited to 50 per run.
- For each, in a transaction, set `status` to `PUBLISHED`, `publishedAt` to `scheduledFor` or now, and `scheduledFor` to null, using an `updateMany` whose `where` also requires the status to still be `SCHEDULED` so a concurrent manual publish cannot double-fire.
- Write an `AuditLog` row and a `Notification` for the author per article.
- Revalidate the home layout, the article path, the category path, `/latest` and the sitemap.
- Return a JSON summary of processed, published and failed counts.
- Record failures as audit rows and surface a count in the owner and admin dashboard.

ROLE & PERMISSIONS:
The endpoint is machine-only. It must not accept a user session as authorization.

DATA REQUIREMENTS:
Uses the `SCHEDULED` status added by the schema task. Add `CRON_SECRET` to `.env.example`.

ARTICLE WORKFLOW:
Only `SCHEDULED` to `PUBLISHED`. Never promote from any other state.

UI/UX REQUIREMENTS:
The scheduling control must show the resolved local time and an explicit note about the timezone used. Scheduled articles display a clock icon and the scheduled time in list views.

DESIGN SYSTEM:
The scheduled badge uses `--surface-3` with a dashed `--line-2` border, per the status table.

RESPONSIVE REQUIREMENTS:
Not applicable to the endpoint.

ACCESSIBILITY:
The scheduled time must be readable as text, not conveyed by icon alone.

SECURITY:
Constant-time secret comparison. Never log the secret. Rate-limit the endpoint. Do not expose it in `robots.txt` or the sitemap.

PERFORMANCE:
Batch of 50 per run with a 5-minute schedule. The query must use the `[status, scheduledFor]` index.

ERROR STATES:
A failure on one article must not abort the batch; log it, continue, and include it in the failed count.

EMPTY STATES:
Zero due articles returns a 200 with a zero summary.

LOADING STATES:
Not applicable.

BACKWARD COMPATIBILITY:
Existing articles with a non-null `scheduledFor` but a status of `DRAFT` or `SUBMITTED` must not be published by this job. Migrate them deliberately or leave them untouched.

TESTING:
Test the unauthenticated call, the wrong-secret call, one due article, an article due in the future, a concurrent manual publish, and a batch containing one failing article.

ACCEPTANCE CRITERIA:
An article scheduled for time T is live within five minutes of T with `publishedAt` set and `scheduledFor` cleared, has an audit row and an author notification, and an unauthenticated request returns 401.

VERIFICATION:
Schedule an article for one minute in the future, invoke the endpoint with the secret, and confirm the database state, the audit row, the notification and public visibility.

CONSTRAINTS:
* Do not rewrite unrelated code.
* Do not remove existing functionality unnecessarily.
* Reuse existing architecture where practical.
* Reuse existing dependencies when possible.
* Do not add unnecessary packages.
* Enforce sensitive permissions server-side.
* Preserve existing data.
* Maintain responsive behavior.
* Maintain accessibility.
* Review the diff before completion.

---

## TASK-07 — Stop shipping article bodies to the client

**PRIORITY:** CRITICAL

**CURRENT STATE.** Every list page runs `findMany` with `include` and no `select`, then passes the result into a client component.

**EVIDENCE.** `articles/page.tsx:17-21`, `drafts/page.tsx:17-24`, `submissions/page.tsx:52-56`, `admin/page.tsx:36-37`; `StoryDataTable.tsx` line 1 is `"use client"`.

**PROBLEM.** `contentHtml` and `contentJson` (up to 50,000 characters each by the editor's own `CharacterCount` limit) are serialised into the RSC payload for every row. With 200 published articles this is tens of megabytes over the wire, and it exposes unpublished draft bodies to any client that can reach a list page.

**ROOT CAUSE.** No field projection, and the list is a client component.

**DESIRED BEHAVIOUR.** The §21.1 projection everywhere; the list body becomes a server component; only the filter bar, row menu and bulk bar are client islands.

**IMPLEMENTATION PLAN.** Add an `ArticleListRow` type; apply the `select` in `listArticles`; convert `StoryDataTable` into a server `ArticleList` + client `ArticleRowMenu`; fix the dashboard's `findMany` calls the same way.

**ACCEPTANCE CRITERIA.** No RSC payload from any console list contains `contentHtml` or `contentJson`; the payload for a 25-row page is under ~60 KB.

**VERIFICATION.** DevTools → Network → the RSC response for `/admin/articles`; search for a known body string. Measure transfer size before and after.

### CODING AGENT PROMPT

ROLE:
You are a senior full-stack engineer working inside an existing technology publishing platform.

TASK:
Eliminate article body payloads from every console list by projecting only the fields the list renders and by making the list a server component.

FIRST:
Inspect the existing implementation before modifying anything. Read the `findMany` calls in `app/admin/(authenticated)/articles/page.tsx`, `drafts/page.tsx`, `submissions/page.tsx` and `page.tsx`, and note that `components/editorial/StoryDataTable.tsx` begins with `"use client"`.

CURRENT IMPLEMENTATION:
Each list page calls `db.article.findMany` with `include: { category: true, authorModel: true }` and no `select`, so every column of `Article` is returned, including `contentHtml` and `contentJson`. The resulting array is passed as a prop into `StoryDataTable`, a client component, so every field is serialised into the React Server Components payload delivered to the browser.

PROBLEM:
Article bodies of up to fifty thousand characters each are sent to the browser for rows that display only a title, category, author, status, date and view count. This is a large, unnecessary transfer, and it exposes the full text of unpublished drafts to any client that can load a list page.

ROOT CAUSE:
There is no field projection, and the list rendering lives in a client component.

GOAL:
Every console list query selects exactly the fields it renders, and the list markup is produced on the server, with interactivity isolated to small client islands.

FUNCTIONAL REQUIREMENTS:
- Define an `ArticleListRow` type containing only `id`, `slug`, `title`, `deck`, `img`, `status`, `featured`, `views`, `createdAt`, `updatedAt`, `publishedAt`, `scheduledFor`, a narrow `authorModel` of id, name, slug and avatar, the legacy `author` string, and a narrow `category` of id, name and slug.
- Apply this projection in every console query that feeds a list, including the dashboard's top-stories and recent-drafts queries.
- Split the list component: a server component renders the rows; a client component provides the row action menu; a separate client component provides the filter bar.

ROLE & PERMISSIONS:
The projection is a security control as well as a performance one. Never select a field the actor is not entitled to see.

DATA REQUIREMENTS:
No schema change.

ARTICLE WORKFLOW:
No workflow change.

UI/UX REQUIREMENTS:
Visual output must be unchanged by this task alone, apart from any fields that are added deliberately in the list redesign task.

DESIGN SYSTEM:
No change.

RESPONSIVE REQUIREMENTS:
No change.

ACCESSIBILITY:
No change.

SECURITY:
Verify that no draft body reaches a browser that is not entitled to it.

PERFORMANCE:
Measure and record the RSC payload size for `/admin/articles` before and after.

ERROR STATES:
Unchanged.

EMPTY STATES:
Unchanged.

LOADING STATES:
Unchanged.

BACKWARD COMPATIBILITY:
Any code reading a field that is no longer selected must be updated. Search for property access on the list arrays before narrowing the projection.

TESTING:
Add a test asserting that the object returned by the list query has no `contentHtml` or `contentJson` key.

ACCEPTANCE CRITERIA:
No console list payload contains an article body, and a twenty-five-row page transfers well under one hundred kilobytes.

VERIFICATION:
Open DevTools, load `/admin/articles`, inspect the RSC response, and search for a known body string. Compare transfer sizes before and after.

CONSTRAINTS:
* Do not rewrite unrelated code.
* Do not remove existing functionality unnecessarily.
* Reuse existing architecture where practical.
* Reuse existing dependencies when possible.
* Do not add unnecessary packages.
* Enforce sensitive permissions server-side.
* Preserve existing data.
* Maintain responsive behavior.
* Maintain accessibility.
* Review the diff before completion.

---

## TASK-08 — Server-side filtering, search, sorting, pagination

**PRIORITY:** HIGH · **Depends on:** TASK-01, TASK-03

**CURRENT STATE.** `StoryDataTable` filters in the browser over the full loaded array; option lists are derived from loaded rows; there is no pagination or sorting.

**EVIDENCE.** `components/editorial/StoryDataTable.tsx:19-42` (`useMemo` category/status derivation and `filteredArticles`); no `take`/`skip` in any console query; search matches `a.title` and `a.author` only.

**PROBLEM.** Filters lie (a category with no loaded article cannot be chosen), search misses relational authors, there is no date filter, and the approach collapses as the archive grows.

**ROOT CAUSE.** Filtering was implemented as a view concern rather than a query concern.

**DESIRED BEHAVIOUR.** §21 in full.

**IMPLEMENTATION PLAN.** Extend `listArticles` with search/date/sort/pagination; load author and category options from their own tables; build `FilterBar`, `FilterSheet`, `SearchInput`, `Pagination` and `ActiveFilterChips`; wire them to the URL with `router.replace(..., {scroll:false})` inside `useTransition`.

**FILES.** `lib/queries/articles.ts`, `lib/console/searchParams.ts`, new `components/console/filters/*`, `components/console/Pagination.tsx`, `app/admin/(authenticated)/articles/page.tsx`.

**UI/UX.** §21.3 toolbar; active chips; result count; `/` focuses search; changing a filter resets to page 1.

**PERFORMANCE.** Indexed queries; one `groupBy` for facets; 300 ms debounce; `perPage` capped at 100.

**ACCEPTANCE CRITERIA.** Filter options come from the full taxonomy; search finds an article by its relational author's name; 10,000 rows paginate without client slowdown; every filter state is a shareable URL.

**VERIFICATION.** Seed 10,000 articles; confirm the query log shows `LIMIT 25` and index usage.

### CODING AGENT PROMPT

ROLE:
You are a senior full-stack engineer working inside an existing technology publishing platform.

TASK:
Move article filtering, search, sorting and pagination from the browser into the database, with all state in the URL.

FIRST:
Inspect the existing implementation before modifying anything. Read `components/editorial/StoryDataTable.tsx` lines 19 to 42, and every console query that feeds it.

CURRENT IMPLEMENTATION:
`StoryDataTable` is a client component that receives the entire result set. It derives its category and status dropdown options with a memo over the loaded rows, and filters with a memo that matches the search term against the title and the legacy author string, the status by exact equality, and the category by category name. There is no pagination, no sorting control and no date filter anywhere in the console.

PROBLEM:
Filter options only contain values present in the currently loaded rows, so a category with no loaded article cannot be selected and the option list shifts as data changes. Search cannot find an article by its relational author's name because only the denormalised legacy string is matched. There is no way to narrow by date. The whole approach requires loading every article on every page view.

ROOT CAUSE:
Filtering was implemented as a view concern rather than a query concern.

GOAL:
A single server query that applies scope, filters, search, sorting and pagination in the database, driven entirely by validated URL search parameters.

FUNCTIONAL REQUIREMENTS:
Support status as a multi-value filter with live counts, plus author, category, an optional tag, a date range over a selectable date field, free-text search, a sort field and direction, and page plus page size. Load author and category options from their own tables rather than from loaded rows. Search must match title, deck, slug, the relational author name and the legacy author string, case-insensitively, and must never touch the article body. Search and filters compose with AND. Show an always-visible result count, removable chips for each active filter, and a clear-all control. Changing any filter resets the page to one.

ROLE & PERMISSIONS:
Scope is applied before user filters and cannot be widened through the URL.

DATA REQUIREMENTS:
Rely on the indexes added by the schema task. Cap page size at one hundred and clamp the page number server-side.

ARTICLE WORKFLOW:
No workflow change.

UI/UX REQUIREMENTS:
A horizontal toolbar on desktop with search, status tabs, author, category and date, plus a right-aligned result count and sort control. No card or border box around the toolbar; separate it from the list with a single hairline and generous whitespace. Active filters appear as removable chips below.

DESIGN SYSTEM:
Use existing tokens only. Inputs use the small radius, a one-pixel line border and the surface background. No shadows.

RESPONSIVE REQUIREMENTS:
Below 768 pixels show only the search field and a Filters button with a count, opening a bottom sheet containing every control plus Apply and Clear all.

ACCESSIBILITY:
Every control has a label. The result count sits in a polite live region. Comboboxes follow the ARIA combobox pattern with arrow-key navigation. The slash key focuses search and Escape clears it. Pagination is a labelled navigation landmark.

SECURITY:
Validate all parameters with Zod. Whitelist sort fields and never interpolate user input into an order-by clause. Trim and cap the search term at one hundred characters.

PERFORMANCE:
Debounce search by three hundred milliseconds. Use one grouped query for status facet counts and a single transaction for rows plus total. Wrap navigation in a transition so the list dims rather than unmounting.

ERROR STATES:
An invalid parameter falls back to its default rather than throwing.

EMPTY STATES:
Distinguish an empty collection from an empty filtered result, offering Clear filters in the latter case.

LOADING STATES:
Dim the list to sixty percent opacity with a busy attribute during a transition. Never blank the page.

BACKWARD COMPATIBILITY:
Existing links to the articles route with no parameters must still work and show the role-appropriate default view.

TESTING:
Test filter composition, page clamping, the sort whitelist, search across all five fields, and a ten-thousand-row dataset.

ACCEPTANCE CRITERIA:
Filter options come from the full taxonomy; searching an author's name finds their articles; ten thousand rows paginate without client slowdown; every filter state is shareable as a URL.

VERIFICATION:
Seed ten thousand articles, load the page, and confirm from the query log that a limit clause and the expected indexes are used.

CONSTRAINTS:
* Do not rewrite unrelated code.
* Do not remove existing functionality unnecessarily.
* Reuse existing architecture where practical.
* Reuse existing dependencies when possible.
* Do not add unnecessary packages.
* Enforce sensitive permissions server-side.
* Preserve existing data.
* Maintain responsive behavior.
* Maintain accessibility.
* Review the diff before completion.

---

## TASK-09 — Image-aware editorial article row

**PRIORITY:** HIGH · **Depends on:** TASK-07, TASK-14

**CURRENT STATE.** A seven-column `<table>` inside a `.cs-card`, every cell inline-styled, no image, no excerpt, horizontal scroll on mobile.

**EVIDENCE.** `components/editorial/StoryDataTable.tsx` (entire render); `Article.img` never rendered in a list; `<td style={{display:"flex"}}>` on the actions cell.

**PROBLEM.** The list is visually generic, hides the most identifying attribute of an article, wraps itself in a box the brief rejects, and is unusable on a phone.

**ROOT CAUSE.** A table was chosen for a content-browsing task, and styling was done ad hoc per cell.

**DESIRED BEHAVIOUR.** §20 in full.

**IMPLEMENTATION PLAN.** Build `components/console/ArticleRow.tsx` (server) with the §20.1 grid, `ArticleRowMenu.tsx` (client), `StatusBadge.tsx`, and `ArticleThumb.tsx` wrapping `next/image` in a fixed 16:9 box with a token-styled fallback. Add a density toggle persisted to `localStorage`.

**ACCESSIBILITY.** Title is the link and the accessible name; thumbnails are decorative (`alt=""`); badges carry text; the menu button's name includes the article title.

**PERFORMANCE.** `next/image` with explicit dimensions, `sizes="96px"` and lazy loading; the fixed box prevents CLS.

**ACCEPTANCE CRITERIA.** Rows show image, title, deck, author, category, status, a state-aware date and actions; zero layout shift; no horizontal scroll at 320px; no card or shadow.

**VERIFICATION.** Lighthouse CLS of 0; visual check in both themes; keyboard-only traversal of a row's actions.

### CODING AGENT PROMPT

ROLE:
You are a senior full-stack engineer working inside an existing technology publishing platform.

TASK:
Replace the console's article table with an image-aware editorial row list.

FIRST:
Inspect the existing implementation before modifying anything. Read `components/editorial/StoryDataTable.tsx` in full, the card and row rules in `app/globals.css`, and `next.config.ts` for the configured remote image hosts.

CURRENT IMPLEMENTATION:
Articles render as a seven-column HTML table with columns for title, category, author, an optional status, updated date, reads and actions. The table sits inside a div carrying the card class and an inline horizontal-scroll style. Every cell is styled with an inline style object. The status badge is a ternary chain with hardcoded translucent colours and references to undefined custom properties. The actions cell is a table cell with a flex display. The article image and the deck are never rendered.

PROBLEM:
The list hides the most identifying attribute of an article, wraps itself in a card the design direction explicitly rejects, has no typographic hierarchy because its secondary text colour resolves to an undefined variable, and requires horizontal scrolling on a phone.

ROOT CAUSE:
A data table was chosen for a content-browsing task, and styling was applied ad hoc per cell instead of through reusable primitives.

GOAL:
A CSS grid row list showing a thumbnail, a strong title, an optional deck, author, category, a status badge, a state-aware date and a capability-filtered action menu, separated by hairlines with no card and no shadow, stacking cleanly on mobile.

FUNCTIONAL REQUIREMENTS:
Desktop grid columns are selection checkbox, ninety-six pixel image, flexible title block, author, category, status, date and actions. The date column is state-aware: published rows show the publication date, scheduled rows show the scheduled time with a clock indicator, and everything else shows a relative updated time carrying an absolute title attribute. Promote exactly one inline action per row based on state, with all other actions in an overflow menu. Provide comfortable and compact densities persisted in local storage. Show a star indicator for featured articles.

ROLE & PERMISSIONS:
Every action in the menu is filtered by capability and article state, and every one is re-checked on the server.

DATA REQUIREMENTS:
Consume only the projected list row type. Do not fetch additional data per row and do not introduce any per-row query.

ARTICLE WORKFLOW:
The promoted action and the badge must cover every status including approved, scheduled, changes-requested, rejected and archived.

UI/UX REQUIREMENTS:
Follow master plan section 20 exactly for anatomy, density, hover behaviour and the status badge table. The badge must convey state through text and an icon, never colour alone.

DESIGN SYSTEM:
No card, no shadow, no per-row border box. Rows are separated by a single one-pixel line rule. Hover shifts the background to a faint secondary surface tint with no lift. Thumbnails use the small radius token. Reserve the accent red for brand and primary actions; never use it for a status.

RESPONSIVE REQUIREMENTS:
At tablet widths fold author and category into a metadata line beneath the title. Below 768 pixels stack the row with a smaller thumbnail and open row actions in a bottom sheet. There must be no horizontal scrolling at 320 pixels.

ACCESSIBILITY:
The title is the link and provides the accessible name. Thumbnails are decorative with an empty alt attribute. The overflow menu button's accessible name includes the article title. The menu is keyboard navigable and closes on Escape.

SECURITY:
Hiding an action is a convenience, not a control; the server must reject it independently.

PERFORMANCE:
Use the Next.js image component with explicit width and height and a sizes hint, with lazy loading. The fixed aspect-ratio box must prevent any layout shift. Provide a token-styled placeholder block when the image is missing or fails, never a collapsed element.

ERROR STATES:
A failed image swaps to the placeholder and does not collapse the grid cell.

EMPTY STATES:
Defer to the list page's empty state; the row component renders nothing when there are no rows.

LOADING STATES:
Provide a skeleton row matching the final grid so the layout does not move.

BACKWARD COMPATIBILITY:
Keep supporting articles with no image, no deck, no category, or only the legacy author string.

TESTING:
Snapshot the row in every status, with and without an image, in light and dark themes, at 320, 768 and 1440 pixels.

ACCEPTANCE CRITERIA:
Rows display image, title, deck, author, category, status, a state-aware date and actions; cumulative layout shift is zero; there is no horizontal scroll at 320 pixels; no card or shadow surrounds the list.

VERIFICATION:
Run Lighthouse on the articles page and confirm a zero layout-shift score, check both themes visually, and traverse a row's actions with the keyboard only.

CONSTRAINTS:
* Do not rewrite unrelated code.
* Do not remove existing functionality unnecessarily.
* Reuse existing architecture where practical.
* Reuse existing dependencies when possible.
* Do not add unnecessary packages.
* Enforce sensitive permissions server-side.
* Preserve existing data.
* Maintain responsive behavior.
* Maintain accessibility.
* Review the diff before completion.

---

## TASK-10 — Review queue and focused review screen

**PRIORITY:** HIGH · **Depends on:** TASK-03, TASK-04

**CURRENT STATE.** `/admin/submissions` is the same generic table over three statuses; decisions happen inside the 707-line editor.

**EVIDENCE.** `submissions/page.tsx:52-56`; `ReviewWorkspace` rendered from `ArticleEditor` only when `initialData?.id` exists.

**PROBLEM.** The queue cannot reach zero (it includes `REVISION_REQUESTED`), cannot order by submission time (no `submittedAt`), shows no ageing, supports no claiming, and forces a reviewer to scroll a long form to decide.

**DESIRED BEHAVIOUR.** §22.

**IMPLEMENTATION PLAN.** `/admin/review` (only `IN_REVIEW`, oldest-first, ageing, claiming, filters) and `/admin/review/[id]` (preview + sticky decision panel + server-computed pre-flight + history). `/admin/submissions` redirects.

**ACCEPTANCE CRITERIA.** The queue reaches zero when all submissions are decided; ordering is by `submittedAt`; two reviewers cannot claim the same item; a decision is two clicks from the queue.

### CODING AGENT PROMPT

ROLE:
You are a senior full-stack engineer working inside an existing technology publishing platform.

TASK:
Build a dedicated review queue and a focused review screen.

FIRST:
Inspect the existing implementation before modifying anything. Read `app/admin/(authenticated)/submissions/page.tsx`, `components/editorial/ReviewWorkspace.tsx`, `app/preview/[id]/page.tsx`, and the review capabilities and workflow actions.

CURRENT IMPLEMENTATION:
The submissions route guards with the review-queue permission, queries articles whose status is submitted, review or revision-requested, orders them by the updated timestamp, and renders them in the same generic table used everywhere else. Review decisions are made in a panel embedded partway down the seven-hundred-line article editor, offering Approve and Publish, Request Revision and Reject.

PROBLEM:
Because revision-requested articles stay in the queue, it never reaches zero and cannot function as an inbox. Ordering by the updated timestamp sorts the queue by the author's last keystroke rather than by submission time, so ageing and service levels are impossible. There is no claiming, so two reviewers can duplicate work. Deciding requires scrolling past the entire editing form.

ROOT CAUSE:
Review was treated as an editing activity rather than a distinct workflow with its own surface.

GOAL:
A queue containing only articles awaiting a decision, ordered by submission time with visible ageing and claiming, and a focused decision screen with a rendered preview beside a sticky decision panel.

FUNCTIONAL REQUIREMENTS:
The queue contains only in-review articles; changes-requested and rejected articles leave it and remain findable in the article index. Rows show a thumbnail, title, author, category, word count, submission age, claim state and pass number. Ageing over one day and over three days is indicated with both a colour and a text label. Claiming is atomic, using a conditional update that only succeeds when the article is unclaimed, with an explicit and logged take-over otherwise. Provide filters for category, author, claimed by me, unclaimed and resubmissions only, and sorting by oldest, newest or author. The decision screen shows the article rendered with the same component the public site uses, a metadata summary, a server-computed pre-flight checklist, the decision panel and the full review history. Approve offers secondary approve-and-publish and approve-and-schedule actions when the actor also holds the publish capability.

ROLE & PERMISSIONS:
Access requires the review capability. Reviewers may approve, request changes and reject. Only actors with publish or schedule capabilities see those secondary actions.

DATA REQUIREMENTS:
Order by the submitted-at column, read the claim from the reviewer relation, derive the pass number from the review history, and use the status-with-submitted-at index.

ARTICLE WORKFLOW:
Every decision calls the corresponding workflow action; the review screen must never write the article directly.

UI/UX REQUIREMENTS:
Follow master plan section 22. Two panes above 1024 pixels at sixty and forty percent with the decision panel sticky; tabs for Preview, Decide and History below that.

DESIGN SYSTEM:
No cards around queue rows. The decision panel is one of the few justified raised surfaces and uses the surface token with a single hairline border.

RESPONSIVE REQUIREMENTS:
Tabs below 1024 pixels. All decision controls reachable without horizontal scrolling at 320 pixels.

ACCESSIBILITY:
Tabs follow the ARIA tabs pattern. Ageing is never conveyed by colour alone. The reason textarea is labelled and its character requirement is announced.

SECURITY:
Reason length and decision legality are enforced in the server action, not the form.

PERFORMANCE:
The queue uses the projected list fields plus the claim and submission columns. The article body loads only on the decision screen, never in the queue.

ERROR STATES:
A lost claim race returns a conflict and the interface refreshes the row to show the actual claimant.

EMPTY STATES:
A queue-clear message explaining that resubmissions appear automatically, with a link to the article index.

LOADING STATES:
Skeleton rows for the queue and a skeleton preview pane on the decision screen.

BACKWARD COMPATIBILITY:
The submissions route must redirect rather than return a not-found. The embedded review panel in the editor may remain during migration but must call the same workflow actions.

TESTING:
Test claiming races, ageing thresholds, filters, each decision path, and the pre-flight checklist against an article missing a deck.

ACCEPTANCE CRITERIA:
The queue reaches zero when all submissions are decided; ordering is by submission time; two reviewers cannot claim the same article; a decision is two clicks from the queue.

VERIFICATION:
Submit three articles as an author, review them as a reviewer, and confirm the queue empties, the author is notified, and the history records each decision with its reason.

CONSTRAINTS:
* Do not rewrite unrelated code.
* Do not remove existing functionality unnecessarily.
* Reuse existing architecture where practical.
* Reuse existing dependencies when possible.
* Do not add unnecessary packages.
* Enforce sensitive permissions server-side.
* Preserve existing data.
* Maintain responsive behavior.
* Maintain accessibility.
* Review the diff before completion.

---

## TASK-11 — Rejection and change-request workflow with visible reasons

**PRIORITY:** HIGH · **Depends on:** TASK-03, TASK-04

**CURRENT STATE / EVIDENCE.** `ReviewWorkspace.handleAction` guards only `REVISION_REQUESTED` with a client `alert()`; `upsertArticle` accepts either status with `notes: null`; `submissions/page.tsx:53` excludes `REJECTED`, and no other list includes it.

**PROBLEM.** Authors cannot learn why their work was refused, and in the rejected case cannot find the article at all.

**DESIRED BEHAVIOUR.** §24.

**ACCEPTANCE CRITERIA.** A rejection without an adequate reason is refused server-side; the author sees the reason in at least three places without opening the editor; rejected articles are listable.

### CODING AGENT PROMPT

ROLE:
You are a senior full-stack engineer working inside an existing technology publishing platform.

TASK:
Make rejections and change requests accountable and visible.

FIRST:
Inspect the existing implementation before modifying anything. Read `components/editorial/ReviewWorkspace.tsx`, the revision-writing block of the article save action, and the query in the submissions route.

CURRENT IMPLEMENTATION:
Rejection is a button that calls the generic save with a rejected status and whatever text happens to be in a notes textarea, including nothing at all. Requesting a revision is guarded only by a browser alert when the notes are empty; the server accepts either transition with null notes. Both outcomes are recorded only as a free-text note and a status-change string on a revision row. Rejected articles are excluded from the review queue query and appear in no other list, so they become unreachable.

PROBLEM:
An author cannot discover why their work was refused, and in the rejected case cannot find the article at all. Editorial decisions leave no queryable record of who decided what and why.

ROOT CAUSE:
Review outcomes were modelled as prose attached to a content snapshot rather than as structured decision data.

GOAL:
Every negative decision persists the reviewer, the timestamp, the previous and new status, a required reason and, for rejections, a reason code; and that reason is visible to the author wherever the article appears.

FUNCTIONAL REQUIREMENTS:
Requesting changes requires a reason of at least twenty characters, enforced in the server action. Rejecting requires the same minimum plus a reason code chosen from off-topic, quality, duplicate, factual concerns, editorial direction and other, both enforced server-side, behind a confirmation modal that states the consequence. Each decision writes a review record and increments the pass counter for change requests. The most recent reason is surfaced in the article row's expanded state, in the article detail header, as a persistent banner at the top of the editor, and in the author's dashboard action-required block. Rejected articles remain listable, can be reopened to draft by an editor, and can be duplicated as a new draft by the author.

ROLE & PERMISSIONS:
Only actors with the review capability may request changes or reject. Only the author or an editor may duplicate. Only an editor or above may reopen.

DATA REQUIREMENTS:
Persist reviewer, timestamp, decision, reason, reason code, from-status, to-status and pass number in the review model. Do not store the reason only in a revision note.

ARTICLE WORKFLOW:
A change request moves the article to changes-requested and out of the queue. A rejection moves it to rejected and closes the submission. Both are reversible by resubmission or reopening.

UI/UX REQUIREMENTS:
The reason must be readable without opening the editor. The editor banner is dismissible per session but reappears until the article is resubmitted. The reason textarea shows a live character count against the minimum.

DESIGN SYSTEM:
Changes-requested uses the warning token at a low tint; rejected uses the bad token at a low tint. Neither uses the brand accent red.

RESPONSIVE REQUIREMENTS:
The confirmation modal becomes a full-screen sheet below 768 pixels. The banner wraps rather than truncating the reason.

ACCESSIBILITY:
The banner is a labelled region announced politely. The reason field is associated with its validation message.

SECURITY:
Validate the reason length and reason code on the server and refuse any attempt made with the client bypassed.

PERFORMANCE:
Fetch only the latest review record for list and banner display, not the whole history.

ERROR STATES:
A too-short reason returns a validation error that focuses the field.

EMPTY STATES:
An article with no review history shows nothing rather than an empty panel.

LOADING STATES:
Decision buttons disable with a spinner while the action runs.

BACKWARD COMPATIBILITY:
Historical reasons living in revision notes must still be displayed; read from the review model first and fall back to the reconstructed history.

TESTING:
Test a rejection with a five-character reason, a rejection with no reason code, an author viewing their rejected article, and a resubmission after a change request.

ACCEPTANCE CRITERIA:
A rejection without an adequate reason is refused by the server; the author sees the reason in at least three places without opening the editor; rejected articles appear in the article index.

VERIFICATION:
As a reviewer, reject an article; as its author, confirm the article is findable and the reason is visible on the dashboard, in the list and in the editor.

CONSTRAINTS:
* Do not rewrite unrelated code.
* Do not remove existing functionality unnecessarily.
* Reuse existing architecture where practical.
* Reuse existing dependencies when possible.
* Do not add unnecessary packages.
* Enforce sensitive permissions server-side.
* Preserve existing data.
* Maintain responsive behavior.
* Maintain accessibility.
* Review the diff before completion.

---

## TASK-12 — Role-specific dashboard overview

**PRIORITY:** HIGH · **Depends on:** TASK-02, TASK-03

**CURRENT STATE / EVIDENCE.** `app/admin/(authenticated)/page.tsx` — `isAuthorOnly` is the only branch; `totalArticles = publishedCount + draftsCount`; six sequential awaits; `.cs-split` undefined; a five-column grid holding four tiles; errors swallowed into zeros.

**PROBLEM.** Six of seven roles see an identical page answering no operational question; the headline count is wrong; a DB outage looks like an empty publication.

**DESIRED BEHAVIOUR.** §17.

**ACCEPTANCE CRITERIA.** Each role sees an appropriate block set; every block links to a filtered view; counts include every status; one parallel query round; a failed query shows an error, not a zero.

### CODING AGENT PROMPT

ROLE:
You are a senior full-stack engineer working inside an existing technology publishing platform.

TASK:
Replace the single generic dashboard with role-specific, operational overviews.

FIRST:
Inspect the existing implementation before modifying anything. Read the dashboard page in full and the statistics, tile, card and grid rules in the stylesheet.

CURRENT IMPLEMENTATION:
The dashboard branches on a single boolean derived from whether the role is author. It runs six sequential database calls, renders four statistic tiles in a grid declared for five columns, and then two cards using a split class that is not defined anywhere in the stylesheet. Total articles is computed as published plus drafts, silently omitting submitted, review, revision-requested and rejected articles. Errors are swallowed and leave every counter at zero.

PROBLEM:
Six of the seven roles receive byte-identical output. An editor's home page shows top stories by read count and no review queue count, which is the one number an editor needs. The headline total is arithmetically wrong for any publication with work in progress, and a database outage renders as a legitimate-looking empty publication.

ROOT CAUSE:
The dashboard was written as a single report rather than as a role-specific work surface.

GOAL:
A dashboard composed from a per-role block configuration where every block answers what the user needs to do now, links into a filtered article view, and is backed by a correctly scoped count.

FUNCTIONAL REQUIREMENTS:
Implement the per-role block sets in master plan section 17 for owner, admin, editor, reviewer, author, contributor and moderator. Limit any role to five blocks. Every block must link somewhere actionable. Pipeline figures must count every status, not a subset.

ROLE & PERMISSIONS:
Block visibility is determined by capability, not by role name. A block whose underlying data the actor may not see must be neither rendered nor queried.

DATA REQUIREMENTS:
Use scoped count queries executed in a single parallel batch, and the grouped status query for pipeline figures. Do not fetch article bodies for any block.

ARTICLE WORKFLOW:
Surface the states that stall a newsroom: in-review with an oldest-waiting age, approved but unscheduled, scheduled within seven days, and changes-requested with no author activity for seven days.

UI/UX REQUIREMENTS:
Render figures as a horizontal row of label, large number and short descriptor, separated by vertical hairlines on the page background. Do not use tiles, cards or boxes. Separate blocks with whitespace and a single hairline, each introduced by a small uppercase section label.

DESIGN SYSTEM:
Large numbers use the display font; everything else uses the interface font. Use only the spacing scale. No shadows.

RESPONSIVE REQUIREMENTS:
Figures form a two-column grid below 768 pixels, three columns at tablet, and a single hairline-separated row at desktop. Blocks stack below 1024 pixels.

ACCESSIBILITY:
Each block has a real heading. Numbers are always accompanied by text labels. Warning indicators carry text.

SECURITY:
Every count query applies the same scope as the article index so an author's dashboard can never reveal another author's volumes.

PERFORMANCE:
One parallel batch of count queries per request, reusing the cached actor lookup rather than re-reading the user.

ERROR STATES:
A failed query renders an explicit error affordance for that block with a retry, never a silent zero.

EMPTY STATES:
Each block has its own empty message explaining what would appear there and offering the relevant next action.

LOADING STATES:
Stream blocks with Suspense and per-block skeletons so one slow query does not block the page.

BACKWARD COMPATIBILITY:
The route stays where it is and existing links continue to work.

TESTING:
Test the block set for each role, the correctness of each count against seeded data covering every status, and the error path when a query throws.

ACCEPTANCE CRITERIA:
Each role sees a different, appropriate set of blocks; every block links to a filtered view; counts include every status; the page issues one parallel round of queries; a failed query shows an error rather than a zero.

VERIFICATION:
Seed articles across all statuses and authors, sign in as each role, and compare the rendered blocks against master plan section 17.

CONSTRAINTS:
* Do not rewrite unrelated code.
* Do not remove existing functionality unnecessarily.
* Reuse existing architecture where practical.
* Reuse existing dependencies when possible.
* Do not add unnecessary packages.
* Enforce sensitive permissions server-side.
* Preserve existing data.
* Maintain responsive behavior.
* Maintain accessibility.
* Review the diff before completion.

---

## TASK-13 — Role-aware grouped navigation with a mobile drawer

**PRIORITY:** HIGH · **Depends on:** TASK-02

**CURRENT STATE / EVIDENCE.** `components/editorial/AdminNavLinks.tsx` — a flat list of up to ten links, duplicated inline SVGs, exact-match active state, Taxonomy rendered inside the `canReview` condition while `taxonomy/page.tsx:11` redirects REVIEWER away. `globals.css:2815-2832` makes `.cs-nav` a horizontal scroll strip below 900px; `.cs-profile-card` is hidden below 900px.

**PROBLEM.** No hierarchy, no operational signal, a guaranteed dead link for REVIEWER, lost active state on `/admin/editor/[id]`, and no usable mobile navigation.

**DESIRED BEHAVIOUR.** §18.

**ACCEPTANCE CRITERIA.** Groups render only when non-empty; every item's visibility condition equals its route guard's capability; badges are server-computed; a focus-trapped drawer replaces the strip below 900px; nested routes keep the parent item active.

### CODING AGENT PROMPT

ROLE:
You are a senior full-stack engineer working inside an existing technology publishing platform.

TASK:
Rebuild the console navigation as a grouped, capability-driven sidebar with a real mobile drawer.

FIRST:
Inspect the existing implementation before modifying anything. Read the admin navigation component, the layout that supplies its props, the console navigation rules in the stylesheet, and the public mobile drawer component as a pattern reference.

CURRENT IMPLEMENTATION:
The navigation is a flat list of up to ten links whose visibility is controlled by five booleans computed in the layout. Each link carries its own hand-inlined vector icon. Active state is exact path equality. The taxonomy link is rendered inside the review-capability condition, but the taxonomy page redirects away any role that is not owner, admin or editor, so reviewers see a link that bounces them. Below nine hundred pixels the sidebar becomes a horizontally scrolling strip and the profile card is hidden entirely.

PROBLEM:
Every item has equal visual weight, the navigation carries no operational signal such as pending counts, one link is guaranteed to fail for a role that can see it, editing an article highlights nothing so users lose their place, and there is no usable navigation on a phone.

ROOT CAUSE:
Navigation visibility was derived from ad hoc booleans rather than from the same capability the route guards enforce, and no mobile pattern was implemented for the console.

GOAL:
A grouped sidebar whose items are driven by capabilities, carry live counts where useful, highlight correctly on nested routes, and collapse into a focus-trapped drawer on small screens.

FUNCTIONAL REQUIREMENTS:
Group items under Content, People, Structure, Audience and System, rendering a group only when it contains at least one permitted item. Show a count badge on Review and Comments, computed on the server in the layout within a single parallel batch and passed as props. Determine active state with a prefix match, with an exact-match exception for the dashboard root. Replace hand-inlined icons with the icon library already in the dependencies at one fixed size. Below nine hundred pixels replace the strip with a button that opens a left drawer containing the same navigation plus the identity block.

ROLE & PERMISSIONS:
Each item's visibility condition must be the exact capability its route guard enforces. Add a test asserting for every item and every role that visible implies permitted and permitted implies visible.

DATA REQUIREMENTS:
Badge counts come from scoped count queries in the layout and are never fetched from the client.

ARTICLE WORKFLOW:
The review badge counts only articles awaiting a decision.

UI/UX REQUIREMENTS:
Group labels are small uppercase muted text with generous spacing and no boxes. The active item is marked with a two-pixel accent bar and a weight change, not colour alone.

DESIGN SYSTEM:
The sidebar is one of the few justified raised surfaces; use the surface token and a single hairline right border. No shadows.

RESPONSIVE REQUIREMENTS:
Fixed sidebar at and above 1024 pixels, drawer below. The drawer traps focus, closes on Escape, closes on navigation, and restores focus to the trigger.

ACCESSIBILITY:
The navigation is a labelled landmark. The active item carries the current-page attribute. The drawer trigger exposes its expanded state and the identifier of the panel it controls. A skip link jumps to the main content.

SECURITY:
Hiding a link is not a control; every route keeps its server guard.

PERFORMANCE:
One parallel batch of count queries per request, reusing the cached actor lookup.

ERROR STATES:
A failed count renders the item without a badge rather than failing the layout.

EMPTY STATES:
A zero count hides the badge.

LOADING STATES:
Badges may stream in; the navigation itself must render immediately.

BACKWARD COMPATIBILITY:
All existing routes remain reachable. Do not remove the profile card; move it into the drawer on small screens instead of hiding it.

TESTING:
Test the item set per role, the visible-implies-permitted property, active state on nested routes, and drawer focus behaviour.

ACCEPTANCE CRITERIA:
Groups render only when non-empty; no visible item leads to a redirect for that role; badges reflect real counts; the drawer works below nine hundred pixels; editing an article keeps the correct item active.

VERIFICATION:
Sign in as each role and click every visible item, confirming none redirects away; resize to 375 pixels and confirm the drawer opens, traps focus and closes on navigation.

CONSTRAINTS:
* Do not rewrite unrelated code.
* Do not remove existing functionality unnecessarily.
* Reuse existing architecture where practical.
* Reuse existing dependencies when possible.
* Do not add unnecessary packages.
* Enforce sensitive permissions server-side.
* Preserve existing data.
* Maintain responsive behavior.
* Maintain accessibility.
* Review the diff before completion.

---

## TASK-14 — Fix design tokens and build the console design system

**PRIORITY:** HIGH · **Blocks the visual quality of TASK-09, TASK-12, TASK-13**

**CURRENT STATE / EVIDENCE.** Seven custom properties referenced ~90 times and declared nowhere (§11.2 counts). Eight class names referenced and defined nowhere (§11.3). Three styling vocabularies. Fourteen font sizes. `--sp-*` unused in the console.

**PROBLEM.** No working text hierarchy (43 `--ink-muted` references), no surfaces (15 `--bg-elevated`), invalid border colours on row separators, unstyled buttons, and a completely unstyled Taxonomy page.

**ROOT CAUSE.** Console CSS pasted from `htm_2.html`, which used a different token vocabulary.

**DESIRED BEHAVIOUR.** §28.

**ACCEPTANCE CRITERIA.** Zero undefined custom properties; zero undefined class names; both themes review cleanly; no card around any list, filter bar or page section.

### CODING AGENT PROMPT

ROLE:
You are a senior full-stack engineer working inside an existing technology publishing platform.

TASK:
Repair the console's broken design tokens and establish a small, reusable design system.

FIRST:
Inspect the existing implementation before modifying anything. Read the root and dark-theme variable blocks and the Tailwind theme block at the top of the global stylesheet, then the console block that begins around line 2755. Verify the defect yourself by searching for each of the background, elevated background, muted ink, success, error, warning and surface-one custom properties and confirming none is declared.

CURRENT IMPLEMENTATION:
The stylesheet defines a coherent editorial palette, a spacing scale, radii, shadows and three font families, and republishes them as Tailwind theme tokens. The console block, pasted from a standalone HTML prototype, uses a different vocabulary and references seven custom properties that do not exist, roughly twenty times in the stylesheet and seventy times in components. Eight class names are referenced by components but defined nowhere: the dashboard split grid, the danger button variant, three console header classes and three admin page classes used by the taxonomy page. Three styling vocabularies coexist, of which inline style objects are the most common.

PROBLEM:
Because the muted text colour resolves to nothing, forty-three references inherit the primary ink colour, so the console has no distinction between primary and secondary text. Because the elevated background resolves to nothing, the sidebar, statistic tiles and cards have no surface. A row separator declared with an undefined colour falls back to full-strength ink, producing heavy black rules where hairlines were intended. The taxonomy page is entirely unstyled. There are fourteen distinct font sizes, several differing by half a pixel, and the spacing scale is referenced zero times inside the console.

ROOT CAUSE:
Console CSS was copied from a prototype using a different token naming scheme, and the two were never reconciled.

GOAL:
Every referenced token and class resolves, the console has one typographic scale, one spacing scale and one surface policy, and reusable primitives replace the inline styling.

FUNCTIONAL REQUIREMENTS:
Add alias declarations mapping the seven missing tokens onto the existing palette so all references resolve in one safe commit. Add console semantic tokens for backgrounds, rules, focus ring, the six-step type scale, row heights, page padding and sidebar width. Define or remove every referenced-but-undefined class name. Build the primitives listed in master plan section 28.6 using Tailwind utilities over the existing theme tokens rather than growing the stylesheet. Migrate components one at a time, deleting the corresponding legacy rules as each primitive lands. Add a lint rule forbidding raw hex colours and arbitrary pixel values inside the new console component directory.

ROLE & PERMISSIONS:
Not applicable.

DATA REQUIREMENTS:
Not applicable.

ARTICLE WORKFLOW:
Not applicable.

UI/UX REQUIREMENTS:
Apply the surface policy strictly: raised surfaces are permitted only for modals, drawers, dropdown menus, the sticky bulk-action bar and the sidebar. Lists, filter bars, statistics and page sections must not be wrapped in cards. Use one divider weight. Never place two bordered containers adjacent.

DESIGN SYSTEM:
Six typographic steps and three weights. The display serif is reserved for large dashboard numbers and the body serif for article preview content. Radii are limited to the small and medium tokens. Shadows appear only on dropdowns and modals. The brand accent red is reserved for the logo, primary buttons, the active navigation indicator and focus rings, and is never a status colour.

RESPONSIVE REQUIREMENTS:
Standardise on four breakpoints and use them consistently in all new code.

ACCESSIBILITY:
Fix the primary button, which currently sets ink-coloured text on the accent background and is likely to fail contrast in dark mode; use white text and verify at least four and a half to one in both themes. Verify muted text against both backgrounds. Every interactive element gets a visible focus ring using the focus token.

SECURITY:
Not applicable.

PERFORMANCE:
Removing inline style objects and consolidating rules should reduce both markup and stylesheet size; record the before and after stylesheet size.

ERROR STATES:
Not applicable.

EMPTY STATES:
Provide the empty-state primitive described in master plan section 27.2.

LOADING STATES:
Provide the skeleton primitive.

BACKWARD COMPATIBILITY:
Keep the legacy console classes working until each consuming component has migrated. Do not change the public site's appearance; the public styles share the same root variables, so verify the home, article and category pages are unaffected.

TESTING:
Add a script that extracts every custom property reference from both stylesheet and components and asserts each has a declaration, and a second script asserting every class name is either a Tailwind utility or defined in the stylesheet. Run both in continuous integration.

ACCEPTANCE CRITERIA:
No undefined custom property remains; no referenced class name is undefined; every console page reviews cleanly in both themes; no list, filter bar or page section is wrapped in a card.

VERIFICATION:
Run both scripts, then walk every console route in light and dark mode at 375, 768 and 1440 pixels, and confirm the public site is visually unchanged.

CONSTRAINTS:
* Do not rewrite unrelated code.
* Do not remove existing functionality unnecessarily.
* Reuse existing architecture where practical.
* Reuse existing dependencies when possible.
* Do not add unnecessary packages.
* Enforce sensitive permissions server-side.
* Preserve existing data.
* Maintain responsive behavior.
* Maintain accessibility.
* Review the diff before completion.

---

## TASK-15 — Fix the editor: state-aware actions, honest autosave, working tags

**PRIORITY:** HIGH

**CURRENT STATE / EVIDENCE.**
- The footer renders actions only for `DRAFT`/`REVISION_REQUESTED` and for `PUBLISHED && canPublish`; `SUBMITTED`, `REVIEW` and `REJECTED` render **no actions at all** (`ArticleEditor.tsx` footer block).
- The autosave error branch sets the state to `"saved"` and shows "✓ Saved" when the server returned a conflict carrying `serverUpdatedAt`.
- `{...register("tags")}` is applied to both a checkbox group and a hidden input; `handleSave` splits it as a comma string; `editor/[id]/page.tsx` does not include the tag relation, so tags never hydrate.
- The `watch()` subscription triggers autosave on programmatic `setValue`/`reset`.
- `EDITOR_CATEGORIES` is dead; `fillTestData` and the template select ship to production.

**PROBLEM.** Editors cannot save a submitted article; authors are told a failed save succeeded; tags are silently lost; test scaffolding is shipped.

**ACCEPTANCE CRITERIA.** Every status shows the legal actions for the actor; a conflicted autosave never reports success; tags round-trip; no test-data UI in production.

### CODING AGENT PROMPT

ROLE:
You are a senior full-stack engineer working inside an existing technology publishing platform.

TASK:
Fix three correctness defects in the article editor: missing actions for mid-workflow states, dishonest autosave feedback, and a broken tag field.

FIRST:
Inspect the existing implementation before modifying anything. Read the article editor component in full, paying attention to the default values, the watch subscription that drives autosave, the save handler's autosave error branch, the tag field markup, and the footer action block. Also read the edit page to see which relations are included.

CURRENT IMPLEMENTATION:
The footer renders a save-draft and submit pair only when the status is draft or revision-requested, and an unpublish and update pair only when the status is published and the actor can publish. Autosave is driven by a watch subscription that restarts a five-second timer on any field change, including programmatic changes made by the title handler and by form resets. When the server rejects an autosave because another user modified the article, the client reads the returned server timestamp, resets its baseline, sets the autosave state to saved and displays a success indicator. The tag field registers the same form name on both a group of checkboxes and a hidden text input, while the save handler treats the value as a comma-separated string, and the edit page does not include the tag relation, so tags never populate. A development template picker and a test-data generator are rendered in the editor toolbar, and a category constant is declared but never used.

PROBLEM:
An editor opening a submitted article sees no way to save it. An author whose save was rejected is told it succeeded, which is a data-loss-adjacent falsehood. Tags are silently lost on every edit. Test scaffolding ships to production.

ROOT CAUSE:
The footer enumerates two hardcoded cases instead of deriving from a state machine; the autosave error branch conflates recovering the baseline with succeeding; and the tag field mixes two incompatible form-control patterns.

GOAL:
Actions derived from the workflow state machine intersected with the actor's capabilities, autosave that reports failure honestly with a recovery path, and one controlled tag control that round-trips.

FUNCTIONAL REQUIREMENTS:
Compute the footer actions from the allowed transitions for the current status and the actor's capabilities, covering every status including in-review, approved, scheduled, rejected and archived. On an autosave conflict show an explicit not-saved state with compare, overwrite and reload options, and never show a success indicator for a rejected write. Suppress autosave for programmatic value changes so only user input schedules a save. Replace the tag field with one controlled multi-select bound to an array of tag identifiers, and include the tag relation in the edit query so existing tags hydrate. Remove the template picker, the test-data generator and the unused category constant. Move the review decision panel out of the middle of the form into a sticky bar or side panel so a decision does not require scrolling past the body.

ROLE & PERMISSIONS:
The footer must never offer a transition the server will refuse. Publishing and scheduling controls appear only for actors holding those capabilities.

DATA REQUIREMENTS:
Include the tag relation on the edit query, send tag identifiers rather than a comma-separated string, and do not write a revision for autosaves.

ARTICLE WORKFLOW:
All transitions go through the dedicated workflow actions rather than the generic save.

UI/UX REQUIREMENTS:
The save status indicator must have three distinct states: saving, saved with a timestamp, and not saved with a reason and a recovery action. A persistent banner shows the latest change-request reason when the article is in changes-requested.

DESIGN SYSTEM:
Use the console tokens. The not-saved state uses the warning token, not the brand accent.

RESPONSIVE REQUIREMENTS:
The action bar becomes sticky at the bottom of the viewport below 1024 pixels so actions remain reachable without scrolling.

ACCESSIBILITY:
Announce save-state changes through the existing polite live region rather than a browser alert. Associate every input with a label and every error with its field.

SECURITY:
The client must not decide the transition; it requests one and the server validates it.

PERFORMANCE:
Load the rich-text editor bundle dynamically so the metadata form renders first.

ERROR STATES:
A conflict offers compare, overwrite and reload. A validation failure focuses the offending field. A permission failure explains which capability is missing.

EMPTY STATES:
A new article shows an empty body placeholder rather than injected sample content.

LOADING STATES:
The editor shows a skeleton while the rich-text bundle loads.

BACKWARD COMPATIBILITY:
Existing drafts, including those whose tags were stored in the legacy string array, must continue to open and save; keep the legacy array readable.

TESTING:
Test the footer for every status and role combination, an autosave conflict, tag round-tripping on create and on edit, and that a programmatic title-to-slug update does not schedule a save.

ACCEPTANCE CRITERIA:
Every status shows the legal actions for the actor; a conflicted autosave never reports success; tags survive a create, edit and reload cycle; no test-data user interface exists in production.

VERIFICATION:
Open an article in each status as each role and confirm the available actions; force a conflict by editing the same article in two tabs; create an article with three tags, reload, and confirm all three are selected.

CONSTRAINTS:
* Do not rewrite unrelated code.
* Do not remove existing functionality unnecessarily.
* Reuse existing architecture where practical.
* Reuse existing dependencies when possible.
* Do not add unnecessary packages.
* Enforce sensitive permissions server-side.
* Preserve existing data.
* Maintain responsive behavior.
* Maintain accessibility.
* Review the diff before completion.

---

## TASK-16 — Invalidate sessions on role change and read the actor from the database

**PRIORITY:** HIGH (security)

**CURRENT STATE / EVIDENCE.** `app/api/auth/[...nextauth]/route.ts` — the `jwt` callback copies `id` and `role` onto the token only when `user` is present, i.e. only at sign-in. `deleteArticle` in `app/actions/article.ts` reads `user.role` straight from that token. `upsertArticle` re-reads `db.user.findUnique`, so the two paths disagree.

**PROBLEM.** A demoted user keeps their old role for the 30-day lifetime of the JWT. A user demoted from EDITOR to AUTHOR can still delete any article until they sign out.

**ROOT CAUSE.** The JWT is a cache with no invalidation signal.

**DESIRED BEHAVIOUR.** §30.2 — a `sessionVersion` integer on `User`, incremented on every role change, deactivation or password change; the `jwt` callback compares the token's version with the database's on every request and invalidates on mismatch; every server action resolves the actor from the database through one cached helper.

**ACCEPTANCE CRITERIA.** A role change takes effect on the demoted user's next request without requiring sign-out; no server action reads a capability input from the token.

### CODING AGENT PROMPT

ROLE:
You are a senior full-stack engineer working inside an existing technology publishing platform.

TASK:
Make role changes take effect immediately and stop trusting the session token for authorization.

FIRST:
Inspect the existing implementation before modifying anything. Read the authentication route's callbacks, the session helpers, the article delete action and the article save action, and note that the save action re-reads the user from the database while the delete action does not.

CURRENT IMPLEMENTATION:
The token callback copies the user identifier and role onto the token only when a user object is present, which happens only at sign-in. The session callback copies those values onto the session. The token lifetime is thirty days. The delete action reads the role from the session and passes it to the delete capability check. The save action instead re-reads the user record from the database, so the two paths can disagree about the same actor.

PROBLEM:
A user demoted from editor to author keeps editor privileges for up to thirty days because nothing revokes or refreshes the token. During that window they can delete any article. Deactivating an account does not end its sessions either.

ROOT CAUSE:
The token is used as an authorization cache with no invalidation mechanism.

GOAL:
Role and account-status changes take effect on the next request, and every authorization decision is made from current database state.

FUNCTIONAL REQUIREMENTS:
Add an integer session-version column to the user model, defaulting to one. Increment it whenever a role changes, an account is deactivated or a password changes. Include the version in the token at sign-in and, on every subsequent token callback, re-read the user's current version, role and active flag; if the user is missing, inactive or the versions differ, invalidate the token so the request is treated as unauthenticated. Introduce one cached per-request helper that loads the actor from the database, and route every server action and page guard through it. Remove all reads of the role from the session object in authorization paths.

ROLE & PERMISSIONS:
Only actors permitted to manage users may cause an increment through a role change or deactivation; a user changing their own password increments their own version.

DATA REQUIREMENTS:
One additive nullable-then-defaulted column plus a migration backfilling existing rows to one. No destructive changes.

ARTICLE WORKFLOW:
Not applicable.

UI/UX REQUIREMENTS:
A user whose session is invalidated mid-visit is redirected to sign-in with a short explanation that their permissions changed.

DESIGN SYSTEM:
Not applicable.

RESPONSIVE REQUIREMENTS:
Not applicable.

ACCESSIBILITY:
The sign-in explanation is rendered as text, not only as a toast.

SECURITY:
This is the point of the task: the token is a claim of identity, never a source of privilege.

PERFORMANCE:
The token callback adds one indexed primary-key read per request; keep the query to the identifier, role, version and active flag only, and memoise the actor helper per request so a page does not read the same user repeatedly.

ERROR STATES:
If the version lookup fails, fail closed by invalidating the token rather than allowing the previous role.

EMPTY STATES:
Not applicable.

LOADING STATES:
Not applicable.

BACKWARD COMPATIBILITY:
Existing tokens lack the version claim; treat a missing claim as stale and require one re-authentication, and state this in the release note.

TESTING:
Test that demoting a signed-in user removes their elevated capability on the next request, that deactivation ends the session, that a password change invalidates other sessions, and that the delete action refuses a stale role.

ACCEPTANCE CRITERIA:
A role change takes effect on the demoted user's next request without sign-out; no server action derives a capability from the token.

VERIFICATION:
Sign in as an editor in one browser, demote them to author from another, then attempt a delete in the first browser and confirm it is refused and the session is ended.

CONSTRAINTS:
* Do not rewrite unrelated code.
* Do not remove existing functionality unnecessarily.
* Reuse existing architecture where practical.
* Reuse existing dependencies when possible.
* Do not add unnecessary packages.
* Enforce sensitive permissions server-side.
* Preserve existing data.
* Maintain responsive behavior.
* Maintain accessibility.
* Review the diff before completion.

---

## TASK-17 — Notifications for workflow events

**PRIORITY:** MEDIUM · **Depends on:** TASK-04

**CURRENT STATE / EVIDENCE.** `prisma/schema.prisma` declares a `Notification` model and `User.notificationPrefs Json?`; a repository-wide search finds **zero** reads or writes of either outside the schema. `settings/AccountForm.tsx` carries a TODO where preference persistence belongs. `lib/email.ts` and `resend` exist and are used only for invitations.

**PROBLEM.** Authors learn a decision was made only by re-opening the article. The workflow has no push signal, so the queue depends on people remembering to look.

**ACCEPTANCE CRITERIA.** Each of the six workflow transitions creates a notification for the right recipients; the bell shows an accurate unread count; preferences are persisted and respected; notification failure never rolls back the workflow transition.

### CODING AGENT PROMPT

ROLE:
You are a senior full-stack engineer working inside an existing technology publishing platform.

TASK:
Wire the unused notification model to the editorial workflow.

FIRST:
Inspect the existing implementation before modifying anything. Read the notification model and the user preferences column in the schema, confirm by searching the repository that neither is read or written anywhere, read the email helper and the invitation action that uses it, and read the account settings form with its unfinished preferences section.

CURRENT IMPLEMENTATION:
A notification model exists with a recipient, type, title, body, link and read flag, and users have a preferences column. Nothing in the application writes or reads either. Transactional email is configured and used only for invitations. The account settings form contains a comment marking where preference persistence should go.

PROBLEM:
Authors discover a decision only by reopening their article; reviewers discover new submissions only by visiting the queue. The workflow has no push signal, so turnaround time depends on habit.

ROOT CAUSE:
The data model was designed ahead of the workflow actions and never connected once they existed.

GOAL:
Every meaningful workflow transition notifies the right people in the product, honours per-user preferences, and optionally sends email.

FUNCTIONAL REQUIREMENTS:
Emit notifications on submission to every actor holding the review capability, on approval, change request, rejection, publication and scheduled publication to the author, and on a comment awaiting moderation to moderators. Each notification stores a type, a short title, a body containing the decision reason where one exists, and a deep link to the article. Add a bell control in the console header showing the unread count, a panel listing recent notifications, mark-as-read on open, and a mark-all-as-read action. Persist the preference structure as a typed object with a per-type in-product and email toggle, validated on the server, and complete the unfinished settings form. Batch email as an immediate send for decisions and a daily digest for queue activity.

ROLE & PERMISSIONS:
A user may read and mark only their own notifications; enforce this in the query, not the interface.

DATA REQUIREMENTS:
Add an index on recipient, read flag and creation time. Prune notifications older than ninety days with the same scheduled job that handles scheduled publishing.

ARTICLE WORKFLOW:
Notification writes happen inside the same transaction as the transition for consistency, but an email failure must be caught and logged without rolling the transition back.

UI/UX REQUIREMENTS:
The bell shows a count up to nine plus. Entries are a single line of text with a relative timestamp and no cards. Unread entries are marked with an accent dot and heavier weight.

DESIGN SYSTEM:
The panel is a dropdown, which is one of the permitted raised surfaces.

RESPONSIVE REQUIREMENTS:
The panel becomes a full-screen sheet below 768 pixels.

ACCESSIBILITY:
The bell exposes its unread count in its accessible name. The panel follows the menu pattern, closes on Escape and restores focus.

SECURITY:
Never include article body content in an email; link instead.

PERFORMANCE:
The unread count is a single indexed count query in the layout. Do not poll; refresh on navigation.

ERROR STATES:
An email send failure is logged and surfaced only in the audit log, never to the actor performing the transition.

EMPTY STATES:
A short message stating there is nothing new.

LOADING STATES:
A skeleton list inside the panel.

BACKWARD COMPATIBILITY:
Users with a null preferences column default to all in-product notifications on and email on for decisions only.

TESTING:
Test one notification per transition, recipient correctness, preference suppression, and that a thrown email error does not roll back a publish.

ACCEPTANCE CRITERIA:
All six transitions notify correctly; the unread count is accurate; preferences persist and are respected; notification failures never block a transition.

VERIFICATION:
Submit, request changes, resubmit, approve and publish one article while watching a second session signed in as the author, confirming four notifications arrive with working links.

CONSTRAINTS:
* Do not rewrite unrelated code.
* Do not remove existing functionality unnecessarily.
* Reuse existing architecture where practical.
* Reuse existing dependencies when possible.
* Do not add unnecessary packages.
* Enforce sensitive permissions server-side.
* Preserve existing data.
* Maintain responsive behavior.
* Maintain accessibility.
* Review the diff before completion.

---

## TASK-18 — Article detail hub with role-aware click routing

**PRIORITY:** MEDIUM · **Depends on:** TASK-03, TASK-09

**CURRENT STATE / EVIDENCE.** There is no article detail route in the console. `StoryDataTable` links the title to `/admin/editor/{id}` for everyone; `editor/[id]/page.tsx` then redirects anyone failing `canEditArticle` to `/admin/drafts`. `app/preview/[id]/page.tsx` exists but is outside the middleware matcher and is not linked from the list.

**PROBLEM.** For a reviewer or moderator the primary click in the console is a redirect. There is nowhere to see an article's history, reviews, revisions and metrics together.

**DESIRED BEHAVIOUR.** §25 — `/admin/articles/[id]` as the canonical destination, with tabs for Overview, Content, Review history, Revisions, SEO and Activity, and per-role click routing: edit for those who can edit, the detail hub otherwise.

**ACCEPTANCE CRITERIA.** No role's primary click results in a redirect; the detail hub renders for every role that can view the article; history, reviews and revisions are visible in one place.

### CODING AGENT PROMPT

ROLE:
You are a senior full-stack engineer working inside an existing technology publishing platform.

TASK:
Add a console article detail hub and make the list's primary click role-aware.

FIRST:
Inspect the existing implementation before modifying anything. Confirm that no article detail route exists under the console, read how the list component links titles, read the edit page's redirect guard, and read the standalone preview route and note that it is not covered by the middleware matcher.

CURRENT IMPLEMENTATION:
Every article title in every console list links to the editor. The editor page redirects any actor failing the edit capability to the drafts route. A separate preview route exists, admits actors with either the edit or review capability, and is not linked from anywhere in the console; because it sits outside the middleware matcher it relies entirely on its own guard.

PROBLEM:
For reviewers and moderators the main click target in the console is a redirect to an unrelated page. There is no single place showing an article's status, history, review decisions, revisions, search metadata and performance.

ROOT CAUSE:
The interface assumed the only reason to open an article is to edit it.

GOAL:
A canonical article detail route that any actor permitted to see the article can open, with the list routing each actor to the most useful destination.

FUNCTIONAL REQUIREMENTS:
Create an article detail route with tabs for Overview, Content, Review history, Revisions, Search metadata and Activity. Overview shows the hero image, title, deck, status, author, category, tags, timestamps for creation, submission, review, publication and scheduling, word count and reading time, plus the current action set. Content renders the article with the same component the public site uses. Review history lists every decision with reviewer, timestamp, decision, reason and pass number. Revisions lists snapshots with author, timestamp and a restore action for permitted actors. Search metadata shows the title and description with length indicators and a search-result preview. Activity shows the audit entries for this article. Route the list click to the editor for actors who can edit the article and to the detail hub otherwise, and always expose the other destination as a secondary action. Bring the preview route under the middleware matcher or fold it into the Content tab.

ROLE & PERMISSIONS:
Viewing requires the same scope the article index applies. Restore requires the edit capability. Search metadata is read-only for actors without edit rights.

DATA REQUIREMENTS:
One query with the author, category, tag, review and revision relations, limiting revisions to the twenty most recent.

ARTICLE WORKFLOW:
Action buttons call the workflow actions and reflect the legal transitions for the current status and actor.

UI/UX REQUIREMENTS:
A page header with title, status and actions, then tabs. No cards. Timestamps are grouped in a definition list with hairline separators.

DESIGN SYSTEM:
Console tokens only. Tabs use a single underline indicator rather than a boxed segment control.

RESPONSIVE REQUIREMENTS:
Tabs scroll horizontally below 768 pixels with the active tab scrolled into view. The action set collapses into an overflow menu.

ACCESSIBILITY:
Tabs follow the ARIA tabs pattern with arrow-key navigation, and the active tab is reflected in the URL so it can be linked and restored.

SECURITY:
The scope check happens in the route's data loader; a direct identifier for an out-of-scope article returns not-found rather than forbidden.

PERFORMANCE:
Load only the active tab's heavy data; stream the revisions and activity tabs.

ERROR STATES:
A missing or out-of-scope article renders the console not-found state with a link back to the index.

EMPTY STATES:
Each tab has its own empty message.

LOADING STATES:
A header skeleton plus a tab-panel skeleton.

BACKWARD COMPATIBILITY:
Existing links to the editor keep working. The preview route keeps working or redirects into the Content tab.

TESTING:
Test click routing per role, out-of-scope access, tab deep-linking and restore permissions.

ACCEPTANCE CRITERIA:
No role's primary click results in a redirect; the hub renders for every role permitted to view the article; history, reviews and revisions are visible in one place.

VERIFICATION:
Sign in as each role, click the first row of the article index, and confirm the destination renders content rather than bouncing.

CONSTRAINTS:
* Do not rewrite unrelated code.
* Do not remove existing functionality unnecessarily.
* Reuse existing architecture where practical.
* Reuse existing dependencies when possible.
* Do not add unnecessary packages.
* Enforce sensitive permissions server-side.
* Preserve existing data.
* Maintain responsive behavior.
* Maintain accessibility.
* Review the diff before completion.

---

## TASK-19 — Authors admin section

**PRIORITY:** MEDIUM

**CURRENT STATE / EVIDENCE.** `Author` is a first-class model (`prisma/schema.prisma`) with `name`, `slug`, `bio`, `avatar`, `role`, `articles[]` and a one-to-one link from `User.authorId`; `app/(public)/author/[slug]/page.tsx` renders author pages from it. There is **no** console route for authors — `find app/admin -iname "*author*"` returns nothing. Author records can only come into existence implicitly through the article save path or the setup script.

**PROBLEM.** Public author pages are unmanageable from the console: a bio typo, a missing avatar or a wrong byline has no administrative surface. The dual identity (`User` account versus `Author` byline) is invisible, so nobody can tell which staff accounts have a public byline.

**ROOT CAUSE.** The author model was added for the public site and never given a management surface.

**DESIRED BEHAVIOUR.** `/admin/authors` listing every author with avatar, name, slug, linked user account, article count by status and last published date; `/admin/authors/[id]` for editing name, slug, bio, avatar, social links and the user link; a merge action for duplicate authors that reassigns articles; and the ability to create an author independent of a user account for guest contributors.

**FILES/MODULES AFFECTED.** New `app/admin/(authenticated)/authors/`, new `app/actions/authors.ts`, navigation entry under People, `lib/permissions.ts` (`canManageAuthors`).

**ROLE & PERMISSION REQUIREMENTS.** OWNER/ADMIN/EDITOR manage all authors; AUTHOR may edit only the author record linked to their own user; everyone else has no access.

**DATA/DATABASE REQUIREMENTS.** Add `@@index([slug])` and social fields only if actually rendered; a merge writes `Article.authorId` reassignment plus `previousSlugs` preservation on the surviving author and an audit entry.

**ACCEPTANCE CRITERIA.** Every author reachable from the console; slug changes preserve public URLs; merging two authors moves all articles and leaves an audit trail; an author without a user account can be created and published under.

**RISK.** Slug changes break public URLs unless previous slugs are retained — mirror the article `previousSlugs` pattern.

### CODING AGENT PROMPT

ROLE:
You are a senior full-stack engineer working inside an existing technology publishing platform.

TASK:
Build an authors management section in the console.

FIRST:
Inspect the existing implementation before modifying anything. Read the author model and its relations in the schema, the public author page that consumes it, the article save action where author records are resolved, and the users section as a structural pattern.

CURRENT IMPLEMENTATION:
Authors are a first-class model with a name, slug, biography, avatar, role label and a collection of articles, linked one-to-one from the user account. The public site renders an author page per slug. The console has no author route at all; author records only appear as a side effect of saving an article or running the setup script.

PROBLEM:
Public author biographies, avatars and bylines cannot be corrected from the console. Nobody can see which staff accounts have a public byline, and duplicate author records created by the implicit path cannot be merged.

ROOT CAUSE:
The model was introduced for the public site without a corresponding management surface.

GOAL:
A complete authors section supporting listing, editing, merging and guest authors who have no user account.

FUNCTIONAL REQUIREMENTS:
List every author with avatar, name, slug, linked account, per-status article counts and last published date, with search and sorting. Provide a detail page editing name, slug, biography, avatar and the user link, showing the author's articles. Provide a merge action that reassigns all articles from a duplicate to a surviving record, preserves the duplicate's slug as a previous slug, and writes an audit entry. Allow creating an author with no linked user for guest contributions.

ROLE & PERMISSIONS:
Owners, administrators and editors manage all authors. An author may edit only their own linked record. No other role has access.

DATA REQUIREMENTS:
Index the slug. Keep previous slugs so public links survive a rename. Merges must run in a transaction.

ARTICLE WORKFLOW:
Not applicable, except that reassignment must not change article status.

UI/UX REQUIREMENTS:
Hairline-separated rows with a small circular avatar. No cards. Merge is behind a typed confirmation naming the surviving author and the number of articles to move.

DESIGN SYSTEM:
Console tokens only.

RESPONSIVE REQUIREMENTS:
Rows stack into a two-line layout below 768 pixels.

ACCESSIBILITY:
Avatars have meaningful alternative text or are marked decorative when the name is adjacent.

SECURITY:
Enforce ownership server-side; an author editing another author's record must be refused by the action, not only hidden.

PERFORMANCE:
Use grouped counts rather than per-row queries.

ERROR STATES:
A slug collision returns a field-level error with a suggested alternative.

EMPTY STATES:
An invitation to create the first author.

LOADING STATES:
Skeleton rows.

BACKWARD COMPATIBILITY:
Articles carrying only the legacy author string must still list; show them grouped under an unlinked bucket with an action to attach them to an author record.

TESTING:
Test merging, slug renaming with public link preservation, ownership enforcement and guest author creation.

ACCEPTANCE CRITERIA:
Every author is reachable from the console; renaming a slug keeps old public URLs working; merging moves all articles and leaves an audit entry; a guest author can be created and published under.

VERIFICATION:
Create two authors, publish an article under each, merge them, and confirm both articles appear under the survivor and both old public URLs still resolve.

CONSTRAINTS:
* Do not rewrite unrelated code.
* Do not remove existing functionality unnecessarily.
* Reuse existing architecture where practical.
* Reuse existing dependencies when possible.
* Do not add unnecessary packages.
* Enforce sensitive permissions server-side.
* Preserve existing data.
* Maintain responsive behavior.
* Maintain accessibility.
* Review the diff before completion.

---

## TASK-20 — Taxonomy edit, delete and merge

**PRIORITY:** MEDIUM

**CURRENT STATE / EVIDENCE.** `app/actions/taxonomy.ts` exposes creation only; `app/admin/(authenticated)/taxonomy/page.tsx` renders two create forms and two read-only lists, styled with the undefined `admin-page`, `admin-card` and `admin-table` classes (zero definitions in `app/globals.css`).

**PROBLEM.** A category created with a typo is permanent. Tags accumulate duplicates with no way to merge them, which degrades the public tag pages and the future tag filter.

**DESIRED BEHAVIOUR.** Inline rename with slug preservation, delete guarded by a usage count with a required reassignment target when articles exist, merge for both categories and tags, and article counts per term.

**FILES/MODULES AFFECTED.** `app/actions/taxonomy.ts`, `app/admin/(authenticated)/taxonomy/`, `lib/permissions.ts`, `app/globals.css` (remove the `admin-*` dependency — see TASK-14).

**ROLE & PERMISSION REQUIREMENTS.** OWNER/ADMIN/EDITOR may create and rename; delete and merge are OWNER/ADMIN only. The navigation gate must be corrected to match (currently gated by the review capability, which admits REVIEWER, whom the page then redirects).

**DATA/DATABASE REQUIREMENTS.** `Category.slug` and `Tag.slug` unique; add `previousSlugs` to `Category` if public category URLs must survive renames; deletion is blocked by the `Article.categoryId` foreign key, so reassignment must precede it inside a transaction.

**ACCEPTANCE CRITERIA.** Terms can be renamed, merged and deleted; deleting a term in use is impossible without reassignment; every mutation is audited; the page uses defined styles.

### CODING AGENT PROMPT

ROLE:
You are a senior full-stack engineer working inside an existing technology publishing platform.

TASK:
Complete the taxonomy section with rename, delete and merge.

FIRST:
Inspect the existing implementation before modifying anything. Read the taxonomy actions file and confirm it exposes only creation, read the taxonomy page, and verify that the three admin class names it uses are not defined anywhere in the stylesheet.

CURRENT IMPLEMENTATION:
The taxonomy actions file exports only create operations for categories and tags. The page renders two creation forms and two read-only lists, and is styled with three class names that have no definitions, so it renders unstyled.

PROBLEM:
A mistyped category is permanent. Duplicate tags accumulate and cannot be consolidated, degrading public term pages and any future tag filter. The page also looks broken.

ROOT CAUSE:
Only the creation path was implemented, and the page was styled against a class vocabulary that was never written.

GOAL:
Full lifecycle management for categories and tags with safe deletion and merging, using defined styles.

FUNCTIONAL REQUIREMENTS:
Add inline rename that updates the name and optionally the slug while preserving the old slug for public links. Add deletion that first counts usage and, when the term is in use, requires choosing a reassignment target before proceeding inside a transaction. Add merge for both categories and tags. Show an article count beside every term and allow sorting by it. Restyle the page with the console primitives.

ROLE & PERMISSIONS:
Owners, administrators and editors may create and rename. Only owners and administrators may delete or merge. Correct the navigation gate so the item is shown exactly to the roles the page admits.

DATA REQUIREMENTS:
Slugs remain unique. Preserve previous slugs for categories if public category URLs must survive renames. Reassignment must complete before deletion in the same transaction.

ARTICLE WORKFLOW:
Reassignment must not alter article status or timestamps other than the updated timestamp.

UI/UX REQUIREMENTS:
Hairline-separated rows with the term, slug, count and row actions. Destructive actions require typed confirmation naming the term and the number of affected articles.

DESIGN SYSTEM:
Console tokens and primitives only; remove all references to the undefined admin classes.

RESPONSIVE REQUIREMENTS:
Two-line stacked rows below 768 pixels.

ACCESSIBILITY:
Inline rename is a real labelled form field, saved on Enter and cancelled on Escape, with the result announced politely.

SECURITY:
Enforce the elevated capability for delete and merge in the action.

PERFORMANCE:
Use grouped counts rather than per-term queries.

ERROR STATES:
A slug collision, an attempt to delete a term still in use, and a failed transaction each return a clear message.

EMPTY STATES:
Separate messages for no categories and no tags.

LOADING STATES:
Skeleton rows and disabled controls during mutation.

BACKWARD COMPATIBILITY:
Legacy tag strings stored on articles must continue to render; offer an action converting them to relational tags.

TESTING:
Test renaming with public link preservation, deleting an unused term, blocking deletion of a used term, reassign-then-delete, and merging.

ACCEPTANCE CRITERIA:
Terms can be renamed, merged and deleted; a term in use cannot be deleted without reassignment; every mutation is audited; the page renders with defined styles.

VERIFICATION:
Create a category, assign an article to it, attempt deletion and confirm it is blocked, reassign and delete, then confirm the article kept its new category and the audit log recorded both steps.

CONSTRAINTS:
* Do not rewrite unrelated code.
* Do not remove existing functionality unnecessarily.
* Reuse existing architecture where practical.
* Reuse existing dependencies when possible.
* Do not add unnecessary packages.
* Enforce sensitive permissions server-side.
* Preserve existing data.
* Maintain responsive behavior.
* Maintain accessibility.
* Review the diff before completion.

---

## TASK-21 — Loading, error, empty and not-found states across the console

**PRIORITY:** MEDIUM

**CURRENT STATE / EVIDENCE.** `find app/admin -name "loading.tsx" -o -name "error.tsx" -o -name "not-found.tsx"` returns nothing. The dashboard wraps its queries in `try/catch` and falls back to zeros. Every list renders a bare sentence when empty. `ReviewWorkspace` and several forms report outcomes with `alert()`.

**PROBLEM.** A slow query shows a blank console; a failed query shows fabricated zeros or an unstyled crash; an empty list gives no next action; blocking `alert()` dialogs are inaccessible and cannot be styled.

**DESIRED BEHAVIOUR.** §27 — route-level `loading.tsx` skeletons matching final layout, `error.tsx` boundaries with retry, `not-found.tsx`, typed empty states distinguishing "no content yet" from "no results for these filters", and toasts replacing every `alert()`.

**ACCEPTANCE CRITERIA.** Every console route has all three special files; no query failure renders as a zero; every empty state offers a next action; no `alert()` or `confirm()` remains in the console.

### CODING AGENT PROMPT

ROLE:
You are a senior full-stack engineer working inside an existing technology publishing platform.

TASK:
Give every console route real loading, error, empty and not-found states.

FIRST:
Inspect the existing implementation before modifying anything. Search the console directory for loading, error and not-found files and confirm none exist. Read the dashboard's error handling, the empty branches of each list, and every call to the browser alert and confirm functions.

CURRENT IMPLEMENTATION:
No route segment defines a loading, error or not-found file, so a slow page shows nothing and a thrown query surfaces the framework default. The dashboard catches its errors and renders zeros. Lists render a single sentence when empty. Several components report results and ask for confirmation with blocking browser dialogs.

PROBLEM:
A database outage is indistinguishable from an empty publication. Users see a blank console during slow queries. Empty lists offer no next step, and filtered-to-nothing looks identical to nothing-exists. Browser dialogs cannot be styled, are inaccessible and block the main thread.

ROOT CAUSE:
The application-state matrix was never enumerated; only the success path was designed.

GOAL:
Every route handles loading, error, empty, filtered-empty, permission-denied and not-found explicitly and consistently.

FUNCTIONAL REQUIREMENTS:
Add a loading file to every console segment whose skeleton matches the final layout's geometry so nothing shifts. Add an error boundary with a short explanation, a retry action and a reference identifier for the logs. Add a not-found file. Replace the dashboard's zero fallback with per-block error affordances. Distinguish no-content-yet, which offers a create action, from no-results-for-filters, which offers a clear-filters action and echoes the active filters. Add a permission-denied state as one shared component replacing the duplicated inline markup in the review, users and audit-log routes. Replace every browser alert with the existing toast helper and every browser confirm with the existing confirmation dialog component.

ROLE & PERMISSIONS:
The permission-denied state must state which capability is missing and who can grant it, without leaking data.

DATA REQUIREMENTS:
None beyond avoiding fabricated counts.

ARTICLE WORKFLOW:
Not applicable.

UI/UX REQUIREMENTS:
Follow master plan section 27. Empty states are centred text with one primary action, no illustration boxes and no card.

DESIGN SYSTEM:
Skeletons use the surface tokens at low contrast with a subtle pulse, disabled by the reduced-motion preference.

RESPONSIVE REQUIREMENTS:
Skeletons must match the responsive layout at each breakpoint, including the stacked row layout on small screens.

ACCESSIBILITY:
Loading regions expose a busy state. Errors are announced assertively, toasts politely. The confirmation dialog traps focus and returns it on close.

SECURITY:
Error messages never expose stack traces, query text or identifiers of records the actor cannot see.

PERFORMANCE:
Prefer streaming with Suspense over blocking route-level loading where a page has one slow section.

ERROR STATES:
This task defines them.

EMPTY STATES:
This task defines them.

LOADING STATES:
This task defines them.

BACKWARD COMPATIBILITY:
Purely additive; no route changes.

TESTING:
Test each state by forcing a query failure, an empty result, a filtered-empty result and an out-of-scope identifier.

ACCEPTANCE CRITERIA:
Every console route has loading, error and not-found handling; no query failure renders as a zero; every empty state offers a next action; no blocking browser dialog remains in the console.

VERIFICATION:
Stop the database and load each console route, confirming an error affordance rather than an empty page; then apply a filter matching nothing and confirm the clear-filters state.

CONSTRAINTS:
* Do not rewrite unrelated code.
* Do not remove existing functionality unnecessarily.
* Reuse existing architecture where practical.
* Reuse existing dependencies when possible.
* Do not add unnecessary packages.
* Enforce sensitive permissions server-side.
* Preserve existing data.
* Maintain responsive behavior.
* Maintain accessibility.
* Review the diff before completion.

---

## TASK-22 — Responsive console: breakpoints, stacked rows, filter sheet

**PRIORITY:** MEDIUM · **Pairs with:** TASK-09, TASK-13, TASK-14

**CURRENT STATE / EVIDENCE.** `globals.css:2815-2832` turns `.cs-nav` into a horizontally scrolling strip below 900px and hides `.cs-profile-card`. Admin tables are plain `<table>` elements inside `overflow-x: auto`. `StoryDataTable` uses `<td style={{ display: "flex" }}>`, which removes the cell from the table layout algorithm. The layout is `position: fixed; inset: 0`, so mobile browser chrome overlays content. Breakpoints in use are inconsistent (640, 768, 900, 1024, 1100, 1200).

**PROBLEM.** The console is unusable on a phone: the primary article list requires horizontal scrolling, filters are cramped, and the fixed shell fights mobile viewport units.

**DESIRED BEHAVIOUR.** §26 — four standard breakpoints; stacked two-line rows below 768px; a filter sheet; 44-pixel minimum touch targets; dynamic viewport units.

**ACCEPTANCE CRITERIA.** No horizontal scrolling at 320px on any console route; every action reachable on a phone; all touch targets at least 44 by 44 pixels.

### CODING AGENT PROMPT

ROLE:
You are a senior full-stack engineer working inside an existing technology publishing platform.

TASK:
Make the console genuinely usable on phones and tablets.

FIRST:
Inspect the existing implementation before modifying anything. Read the console media queries in the stylesheet, the table markup in the article list component, the fixed full-viewport shell in the console layout, and catalogue every breakpoint value currently used.

CURRENT IMPLEMENTATION:
Below nine hundred pixels the sidebar becomes a horizontally scrolling strip and the profile block is hidden. Lists are plain tables inside horizontally scrolling wrappers. One table cell is given a flex display, which removes it from the table layout algorithm. The shell is fixed to the full viewport using static viewport units, and six different breakpoint values appear across the stylesheet.

PROBLEM:
On a phone the primary article list must be scrolled sideways to reach the actions, filters are cramped, hidden identity means users cannot tell which account they are using, and mobile browser chrome overlays the bottom of the fixed shell.

ROOT CAUSE:
The console was designed desktop-first with mobile handled by scroll containers rather than by layout changes.

GOAL:
A console that works at 320 pixels with no horizontal scrolling, using one consistent breakpoint set.

FUNCTIONAL REQUIREMENTS:
Standardise on four breakpoints at 640, 768, 1024 and 1280 pixels and replace all other values. Below 768 pixels render list rows as a stacked two-line layout with a thumbnail, title, and a metadata line, with actions in an overflow menu. Between 768 and 1024 pixels show a reduced column set. Move filters into a bottom sheet below 768 pixels with a trigger showing the active filter count, applying only on confirm. Replace the fixed full-viewport shell with dynamic viewport units and ensure sticky bars respect the safe-area inset. Remove the flex display from the table cell. Ensure every interactive target is at least 44 by 44 pixels.

ROLE & PERMISSIONS:
Not applicable.

DATA REQUIREMENTS:
Not applicable.

ARTICLE WORKFLOW:
Not applicable.

UI/UX REQUIREMENTS:
Follow master plan section 26. Never hide functionality on small screens; relocate it.

DESIGN SYSTEM:
Use the console spacing scale; page padding reduces by one step per breakpoint down.

RESPONSIVE REQUIREMENTS:
This task defines them.

ACCESSIBILITY:
The filter sheet traps focus, closes on Escape and returns focus to its trigger. Overflow menus follow the menu pattern.

SECURITY:
Not applicable.

PERFORMANCE:
Prefer container-driven layout changes over duplicate markup so both layouts do not ship.

ERROR STATES:
Unchanged, but must be legible at 320 pixels.

EMPTY STATES:
Unchanged, but must not overflow.

LOADING STATES:
Skeletons must match the stacked layout below 768 pixels.

BACKWARD COMPATIBILITY:
Desktop layouts must not regress; capture before-and-after screenshots at 1440 pixels.

TESTING:
Test every console route at 320, 375, 768, 1024 and 1440 pixels and assert no horizontal overflow.

ACCEPTANCE CRITERIA:
No console route scrolls horizontally at 320 pixels; every action is reachable on a phone; all touch targets meet the minimum size.

VERIFICATION:
Walk every console route on a 375-pixel viewport and complete a full create, submit, review and publish cycle without rotating the device.

CONSTRAINTS:
* Do not rewrite unrelated code.
* Do not remove existing functionality unnecessarily.
* Reuse existing architecture where practical.
* Reuse existing dependencies when possible.
* Do not add unnecessary packages.
* Enforce sensitive permissions server-side.
* Preserve existing data.
* Maintain responsive behavior.
* Maintain accessibility.
* Review the diff before completion.

---

## TASK-23 — Bulk article actions

**PRIORITY:** MEDIUM · **Depends on:** TASK-03, TASK-04, TASK-09

**CURRENT STATE / EVIDENCE.** No selection mechanism exists in any console list; every action is per-row and each triggers its own request.

**PROBLEM.** Re-categorising or archiving dozens of articles is one-at-a-time work, which is the point at which a CMS stops scaling.

**DESIRED BEHAVIOUR.** §21.3 — checkbox selection with select-all-on-page and select-all-matching-filter, a sticky action bar showing the count, and bulk publish, unpublish, archive, delete, change category, add or remove tags, and change author; every item individually authorised, with a partial-success report.

**ACCEPTANCE CRITERIA.** Bulk operations are transactional per item with a partial-success report; unauthorised items are skipped and reported, never silently dropped; one audit entry per affected article.

### CODING AGENT PROMPT

ROLE:
You are a senior full-stack engineer working inside an existing technology publishing platform.

TASK:
Add safe bulk actions to the article index.

FIRST:
Inspect the existing implementation before modifying anything. Confirm that no list has a selection mechanism, read the workflow actions and the audit helper, and read the confirmation dialog component already in the repository.

CURRENT IMPLEMENTATION:
Every list action is per row and issues its own request. There is no selection state anywhere.

PROBLEM:
Bulk editorial work such as re-categorising a section or archiving a year of coverage must be done one article at a time.

ROOT CAUSE:
The list was built as a display surface rather than a work surface.

GOAL:
Multi-select with a clear, reversible, individually authorised bulk operation set.

FUNCTIONAL REQUIREMENTS:
Add a checkbox column with select-all-on-page and an explicit select-all-matching-filter option that states the total. Show a sticky action bar with the selected count, the available actions and a clear-selection control. Support publish, unpublish, archive, delete, change category, add tags, remove tags and change author. Authorise every item individually on the server, skip those the actor may not touch, and return a structured report of succeeded, skipped and failed items with reasons. Require typed confirmation for delete and for any operation affecting more than twenty-five items. Cap a single operation at five hundred items and process in chunks.

ROLE & PERMISSIONS:
Bulk publish requires the publish capability, bulk delete the delete capability, bulk author change the edit capability on every affected article. Authors may bulk-act only on their own drafts.

DATA REQUIREMENTS:
Process in chunks inside transactions and write one audit entry per affected article with a shared batch identifier.

ARTICLE WORKFLOW:
Bulk transitions use the same workflow actions as single transitions, including their legality checks.

UI/UX REQUIREMENTS:
The sticky bar is one of the permitted raised surfaces. The partial-success report lists skipped items with the reason and offers to reselect the failures.

DESIGN SYSTEM:
Destructive actions use the bad token, never the brand accent.

RESPONSIVE REQUIREMENTS:
The sticky bar becomes a bottom bar with an overflow menu below 768 pixels.

ACCESSIBILITY:
The select-all checkbox exposes an indeterminate state. The selection count is announced politely on change. Shift-click range selection is supported alongside keyboard selection.

SECURITY:
Never trust a client-supplied identifier list as authorised; re-check every item.

PERFORMANCE:
Chunk writes, avoid loading article bodies, and revalidate affected paths once at the end rather than per item.

ERROR STATES:
A chunk failure reports which items were affected and leaves the rest applied.

EMPTY STATES:
The action bar is hidden when nothing is selected.

LOADING STATES:
The bar shows progress as items processed out of total.

BACKWARD COMPATIBILITY:
Per-row actions remain.

TESTING:
Test a mixed selection where some items are out of scope, a bulk delete confirmation, a chunked five-hundred-item operation and the audit trail.

ACCEPTANCE CRITERIA:
Bulk operations report partial success accurately; unauthorised items are skipped and reported rather than silently dropped; one audit entry exists per affected article.

VERIFICATION:
As an editor, select ten articles including two owned by another author with a status that forbids the action, apply a bulk archive, and confirm the report matches the resulting database state.

CONSTRAINTS:
* Do not rewrite unrelated code.
* Do not remove existing functionality unnecessarily.
* Reuse existing architecture where practical.
* Reuse existing dependencies when possible.
* Do not add unnecessary packages.
* Enforce sensitive permissions server-side.
* Preserve existing data.
* Maintain responsive behavior.
* Maintain accessibility.
* Review the diff before completion.

---

## TASK-24 — Publication settings

**PRIORITY:** MEDIUM

**CURRENT STATE / EVIDENCE.** `app/admin/(authenticated)/settings/page.tsx` contains only personal profile and account forms. There is no `Settings` model in `prisma/schema.prisma`. Site name, description, social links and defaults are hardcoded in `lib/seo.ts` and in page components; `next.config.ts` hardcodes the image domain allowlist; `lib/sanitize.ts` hardcodes the allowed media domains.

**PROBLEM.** Changing the publication name, default share image, timezone or social handles requires a code change and a deployment. The settings route promises publication settings and delivers user preferences.

**DESIRED BEHAVIOUR.** A tabbed settings area separating Profile, Account, Publication, Workflow, Media and Integrations; publication values stored in a single-row settings model, read through a cached accessor and consumed by the SEO helpers.

**ROLE & PERMISSION REQUIREMENTS.** Profile and Account for everyone; Publication, Workflow, Media and Integrations for OWNER and ADMIN only, enforced in both the tab list and the actions.

**DATA/DATABASE REQUIREMENTS.** A `Settings` model with a fixed single row, typed columns for scalar values and a validated JSON column for extensible groups; a cached read helper invalidated on write.

**ACCEPTANCE CRITERIA.** Publication identity is editable without deploying; the public site reflects changes after revalidation; non-administrators cannot see or write publication settings.

**RISK.** Values consumed at build time (image domains) cannot move to the database without a request-time indirection — keep those in configuration and document why.

### CODING AGENT PROMPT

ROLE:
You are a senior full-stack engineer working inside an existing technology publishing platform.

TASK:
Add publication settings distinct from personal settings.

FIRST:
Inspect the existing implementation before modifying anything. Read the settings page and its two forms, search the schema for a settings model and confirm none exists, and read the search-metadata helper, the sanitiser's domain allowlist and the image configuration to catalogue every hardcoded publication value.

CURRENT IMPLEMENTATION:
The settings route contains only a personal profile form and an account form. Publication identity, default share imagery, social handles and content defaults are hardcoded across helper modules and configuration.

PROBLEM:
Renaming the publication or changing its default share image requires a code change and a deployment, which excludes the editorial team from decisions that belong to them.

ROOT CAUSE:
Configuration was treated as code because no settings model was introduced.

GOAL:
Editable publication configuration with a clear boundary between personal and publication scope.

FUNCTIONAL REQUIREMENTS:
Split settings into Profile, Account, Publication, Workflow, Media and Integrations tabs. Publication covers name, tagline, description, logo, default share image, base URL, timezone and social handles. Workflow covers whether review is required before publishing, the minimum reason length, the auto-archive window and the revision retention count. Media covers allowed image domains and maximum dimensions where these can be enforced at request time. Integrations covers analytics and email sender identity. Store values in a single-row settings model read through a cached accessor, and make the search-metadata helper read from it.

ROLE & PERMISSIONS:
Everyone sees Profile and Account. Only owners and administrators see or may write the remaining tabs, enforced in the action as well as the interface.

DATA REQUIREMENTS:
One settings row with typed columns for scalars and a validated structured column for groups; invalidate the cache on write and revalidate the public layout.

ARTICLE WORKFLOW:
Workflow settings must be read by the workflow actions rather than duplicated as constants.

UI/UX REQUIREMENTS:
Vertical tabs at desktop, a select control below 768 pixels. Fields are grouped under hairline-separated section headings with no cards. Each field has help text explaining where the value appears publicly.

DESIGN SYSTEM:
Console tokens only.

RESPONSIVE REQUIREMENTS:
Single column below 768 pixels with a sticky save bar.

ACCESSIBILITY:
Tabs follow the ARIA tabs pattern; unsaved-change warnings are announced.

SECURITY:
Validate URLs and domains strictly on the server; never allow a user-supplied value to widen the sanitiser allowlist without validation.

PERFORMANCE:
Cache the settings read per request and across requests, invalidating on write.

ERROR STATES:
Field-level validation errors with a summary at the top of the form.

EMPTY STATES:
Uninitialised settings fall back to documented defaults rather than blanks.

LOADING STATES:
Skeleton form fields.

BACKWARD COMPATIBILITY:
Hardcoded defaults remain as fallbacks when a setting is unset. Build-time image domains must stay in configuration; document this limitation in the Media tab.

TESTING:
Test permission enforcement per tab, that the public metadata reflects a changed publication name after revalidation, and that workflow settings actually alter the workflow.

ACCEPTANCE CRITERIA:
Publication identity is editable without a deployment; the public site reflects changes; non-administrators can neither see nor write publication settings.

VERIFICATION:
Change the publication name as an administrator, reload a public article, and confirm the page title reflects it; then sign in as an editor and confirm the tab is absent and the action refuses a direct call.

CONSTRAINTS:
* Do not rewrite unrelated code.
* Do not remove existing functionality unnecessarily.
* Reuse existing architecture where practical.
* Reuse existing dependencies when possible.
* Do not add unnecessary packages.
* Enforce sensitive permissions server-side.
* Preserve existing data.
* Maintain responsive behavior.
* Maintain accessibility.
* Review the diff before completion.

---

## TASK-25 — Revision retention policy with diff and restore

**PRIORITY:** MEDIUM

**CURRENT STATE / EVIDENCE.** `upsertArticle` writes an `ArticleRevision` on every update, storing the full `contentHtml`, `contentJson`, `title`, `deck`, `notes` and `statusChange`. Autosave fires every five seconds while typing, so a single editing session can produce hundreds of full-body snapshots. Nothing in the console reads `ArticleRevision`: there is no revision list, no diff and no restore.

**PROBLEM.** The revision table grows without bound and will dominate database size, while delivering none of the value of version history because it cannot be viewed or restored.

**ROOT CAUSE.** Snapshot writing was implemented without a reading surface or a retention policy.

**DESIRED BEHAVIOUR.** Do not snapshot on autosave — only on explicit save, submit and every workflow transition. Retain the last twenty revisions per article plus every transition revision permanently. Add a revisions tab listing snapshots with author, timestamp and change summary, a side-by-side or inline diff, and restore-as-draft for permitted actors.

**FILES/MODULES AFFECTED.** `app/actions/article.ts`, the new workflow actions, the article detail hub (TASK-18), `prisma/schema.prisma` (index on `articleId, createdAt`), a pruning routine in the scheduled job.

**ROLE & PERMISSION REQUIREMENTS.** Viewing revisions requires the same scope as viewing the article; restoring requires the edit capability on that article.

**ACCEPTANCE CRITERIA.** Autosave writes no revision; revisions are viewable and diffable; restore creates a new revision rather than deleting history; retention pruning runs and is audited.

### CODING AGENT PROMPT

ROLE:
You are a senior full-stack engineer working inside an existing technology publishing platform.

TASK:
Give version history a retention policy and a user interface.

FIRST:
Inspect the existing implementation before modifying anything. Read the revision model, the block of the article save action that writes a snapshot, and the autosave timer in the editor. Confirm by searching the repository that nothing reads the revision model.

CURRENT IMPLEMENTATION:
Every article update writes a full snapshot containing the complete body in two representations. Autosave triggers a save every five seconds during editing. Nothing anywhere reads these snapshots.

PROBLEM:
The revision table grows without limit and will become the largest table in the database, while providing none of the benefits of version history because there is no way to view, compare or restore a snapshot.

ROOT CAUSE:
Snapshot writing was implemented without a corresponding reading surface or retention rule.

GOAL:
Meaningful snapshots only, bounded retention, and a usable history with diff and restore.

FUNCTIONAL REQUIREMENTS:
Stop writing snapshots on autosave; write on explicit save, on submit and on every workflow transition. Retain the twenty most recent ordinary snapshots per article and keep all transition snapshots permanently. Add a revisions view listing each snapshot with its author, timestamp, type and a short change summary such as words added and removed. Provide an inline or side-by-side diff between any snapshot and the current version. Provide restore, which creates a new snapshot of the current state before applying the old content, so history is never destroyed. Prune surplus snapshots in the scheduled job.

ROLE & PERMISSIONS:
Viewing requires the same scope as viewing the article. Restoring requires the edit capability on that article.

DATA REQUIREMENTS:
Index the revision table on article and creation time. Consider storing only the structured representation and deriving the rendered output, halving the storage per snapshot; measure before deciding.

ARTICLE WORKFLOW:
Every transition snapshot records the from-status and to-status so history and review history reconcile.

UI/UX REQUIREMENTS:
Hairline-separated list rows. The diff uses additive and subtractive tints derived from the success and bad tokens, with markers so the difference is not conveyed by colour alone.

DESIGN SYSTEM:
Console tokens only; monospace for the diff.

RESPONSIVE REQUIREMENTS:
The diff collapses from side-by-side to inline below 1024 pixels.

ACCESSIBILITY:
Diff additions and deletions are announced as insertions and deletions using appropriate semantic elements.

SECURITY:
Restoring an out-of-scope article must be refused by the action.

PERFORMANCE:
Never load snapshot bodies in the list; fetch a body only when a snapshot is opened.

ERROR STATES:
A restore conflict, where the article changed since the diff was rendered, prompts a re-diff rather than overwriting blindly.

EMPTY STATES:
A message stating that history begins at the first explicit save.

LOADING STATES:
Skeleton list and a skeleton diff pane.

BACKWARD COMPATIBILITY:
Existing snapshots, including the autosave noise already recorded, remain readable; prune them under the new policy in a one-off migration that reports how many rows it removed.

TESTING:
Test that autosave writes no snapshot, that retention keeps exactly twenty plus transitions, that restore preserves history, and that diff output is correct for an edit that both adds and removes text.

ACCEPTANCE CRITERIA:
Autosave writes no revision; revisions are viewable and diffable; restore creates a new revision rather than deleting history; pruning runs and is audited.

VERIFICATION:
Edit an article for five minutes with autosave active and confirm no new snapshots; make three explicit saves and confirm exactly three; restore the first and confirm four snapshots exist and the content matches.

CONSTRAINTS:
* Do not rewrite unrelated code.
* Do not remove existing functionality unnecessarily.
* Reuse existing architecture where practical.
* Reuse existing dependencies when possible.
* Do not add unnecessary packages.
* Enforce sensitive permissions server-side.
* Preserve existing data.
* Maintain responsive behavior.
* Maintain accessibility.
* Review the diff before completion.

---

## TASK-26 — Accessibility remediation

**PRIORITY:** MEDIUM

**CURRENT STATE / EVIDENCE.** The console layout div carries `role="dialog"` and `aria-modal="true"` on a non-modal application shell. There is no skip link and no `<main>` landmark distinct from the shell. Status is conveyed by coloured text alone in `StoryDataTable`. `ReviewWorkspace` and several forms use `alert()`. Icon-only controls lack accessible names in several places. `.btn-cs.primary` sets `color: var(--ink)` on `background: var(--accent)`. Focus styles are inconsistent across the three styling vocabularies.

**PROBLEM.** Screen-reader users are told the entire console is a modal dialog, trapping their expectations; colour-blind users cannot distinguish statuses; keyboard users cannot skip navigation; several controls are unnamed.

**DESIRED BEHAVIOUR.** §29 — correct landmarks, a skip link, status conveyed by shape and text as well as colour, named controls, a visible focus ring everywhere, verified contrast in both themes, and reduced-motion support.

**ACCEPTANCE CRITERIA.** No axe violations at the serious or critical level on any console route; full keyboard operability; contrast verified in both themes; the modal semantics removed from the shell.

### CODING AGENT PROMPT

ROLE:
You are a senior full-stack engineer working inside an existing technology publishing platform.

TASK:
Remediate accessibility defects across the console.

FIRST:
Inspect the existing implementation before modifying anything. Read the console layout and note the dialog role and modal attribute applied to the application shell; audit the list component's status rendering, the icon-only controls, every use of the browser alert, and the primary button's colour declarations.

CURRENT IMPLEMENTATION:
The console shell is a fixed full-viewport element marked as a modal dialog. There is no skip link and no main landmark separate from the shell. Statuses are rendered as coloured text with no secondary indicator. Several controls are icon-only with no accessible name. The primary button places ink-coloured text on the accent background. Focus treatment differs between the stylesheet, utility classes and inline styles.

PROBLEM:
Screen-reader users are told the whole console is a modal dialog, which breaks navigation expectations. Colour-blind users cannot distinguish statuses. Keyboard users cannot bypass the navigation. Unnamed controls are unusable non-visually. The primary button is likely to fail contrast.

ROOT CAUSE:
Accessibility semantics were applied decoratively rather than deliberately, and the shell markup was inherited from a prototype.

GOAL:
Conformance with the AA level of the current accessibility guidelines across every console route.

FUNCTIONAL REQUIREMENTS:
Remove the dialog role and modal attribute from the shell and use the correct landmarks: a banner, a labelled navigation, a main region and, where relevant, a complementary region. Add a skip link as the first focusable element. Give every status a text label plus a non-colour indicator such as a shape or icon. Give every icon-only control an accessible name. Apply one visible focus ring using the focus token across all three styling vocabularies. Replace every browser alert with the polite live-region toast helper and every browser confirm with the focus-trapping confirmation dialog. Add reduced-motion handling that disables skeleton pulses and transitions. Verify and fix contrast for the primary button, muted text and every status treatment in both themes.

ROLE & PERMISSIONS:
Not applicable.

DATA REQUIREMENTS:
Not applicable.

ARTICLE WORKFLOW:
Not applicable.

UI/UX REQUIREMENTS:
No visual redesign beyond what the fixes require; contrast corrections may alter colour values and must be reflected in the token definitions rather than patched locally.

DESIGN SYSTEM:
Fixes land in tokens and primitives so they cannot regress per component.

RESPONSIVE REQUIREMENTS:
Touch targets meet the minimum size at every breakpoint.

ACCESSIBILITY:
This task defines it.

SECURITY:
Not applicable.

PERFORMANCE:
Not applicable.

ERROR STATES:
Errors are announced assertively and associated with their fields.

EMPTY STATES:
Empty states are real headings and text, not decorative graphics alone.

LOADING STATES:
Loading regions expose a busy state and honour reduced motion.

BACKWARD COMPATIBILITY:
No behavioural change beyond the removal of blocking dialogs.

TESTING:
Add automated accessibility assertions to the route tests and run a keyboard-only pass over the full create, submit, review and publish cycle.

ACCEPTANCE CRITERIA:
No serious or critical automated violations on any console route; every flow is completable by keyboard alone; contrast passes in both themes; the shell no longer claims to be a modal dialog.

VERIFICATION:
Run the automated checker on every console route in both themes and complete the full editorial cycle using only the keyboard and a screen reader.

CONSTRAINTS:
* Do not rewrite unrelated code.
* Do not remove existing functionality unnecessarily.
* Reuse existing architecture where practical.
* Reuse existing dependencies when possible.
* Do not add unnecessary packages.
* Enforce sensitive permissions server-side.
* Preserve existing data.
* Maintain responsive behavior.
* Maintain accessibility.
* Review the diff before completion.

---

## TASK-27 — Audit-log completeness, filtering and pagination

**PRIORITY:** MEDIUM

**CURRENT STATE / EVIDENCE.** `logAudit` is called for article create, update and delete and for user role change and delete. It is **not** called for taxonomy mutations, invitations, comment moderation, profile changes, login events or settings. `app/admin/(authenticated)/audit-logs/page.tsx` takes the most recent 100 entries with no filter, no search, no pagination and no export. `logAudit` is duplicated in `app/actions/invitations.ts`.

**PROBLEM.** The audit log cannot answer "who changed this and when" for most of the system, and beyond a hundred entries the history is simply inaccessible.

**DESIRED BEHAVIOUR.** §31 — one shared audit helper covering every privileged mutation with a consistent entity, action, before/after diff and actor; a filterable, paginated log with export; retention documented.

**ACCEPTANCE CRITERIA.** Every privileged mutation writes exactly one audit entry; the log supports filtering by actor, entity, action and date range with pagination; a failed audit write never rolls back the underlying mutation.

### CODING AGENT PROMPT

ROLE:
You are a senior full-stack engineer working inside an existing technology publishing platform.

TASK:
Make the audit log complete and usable.

FIRST:
Inspect the existing implementation before modifying anything. Find every call site of the audit helper, note the duplicated copy of that helper in the invitations action, list every privileged mutation in the actions directory, and read the audit-log page's query.

CURRENT IMPLEMENTATION:
The audit helper is called for article creation, update and deletion and for user role changes and deletions. Taxonomy mutations, invitations, comment moderation, profile changes, authentication events and settings changes write nothing. A second copy of the helper lives in the invitations action. The audit page fetches the hundred most recent entries with no filtering, searching, pagination or export.

PROBLEM:
For most of the system there is no answer to who changed what and when, which undermines both operational debugging and any accountability requirement. Beyond a hundred entries the history is unreachable.

ROOT CAUSE:
Auditing was added opportunistically per feature rather than as a cross-cutting concern.

GOAL:
Exactly one audit entry for every privileged mutation, written through a single helper, and a log that can be searched, filtered, paginated and exported.

FUNCTIONAL REQUIREMENTS:
Consolidate on one helper and delete the duplicate. Record actor, actor role at the time, action, entity type, entity identifier, a human-readable summary, a structured before-and-after diff limited to changed fields, and a timestamp. Cover article workflow transitions, taxonomy mutations, user and invitation lifecycle, comment moderation, settings changes, bulk operations with a shared batch identifier, and authentication events including failures. Add filtering by actor, entity type, action and date range, free-text search over the summary, cursor pagination and a comma-separated export for administrators. Document a retention period and prune beyond it in the scheduled job.

ROLE & PERMISSIONS:
Viewing the audit log requires the existing audit capability. Export is restricted to owners and administrators.

DATA REQUIREMENTS:
Index the audit table on creation time, on actor with creation time, and on entity type with entity identifier. Store the diff in a structured column, truncating large bodies to a summary rather than storing the whole article.

ARTICLE WORKFLOW:
Every transition writes an entry naming the from-status and to-status and, where present, the decision reason.

UI/UX REQUIREMENTS:
Dense hairline-separated rows with a relative timestamp, actor, action sentence and an expandable diff. No cards.

DESIGN SYSTEM:
Console tokens; monospace for the diff.

RESPONSIVE REQUIREMENTS:
Two-line stacked rows below 768 pixels with the diff in a sheet.

ACCESSIBILITY:
Expandable rows expose their expanded state and control relationship; absolute timestamps are available to assistive technology.

SECURITY:
The audit log is append-only; expose no update or delete path. Never store credentials or full article bodies in a diff.

PERFORMANCE:
Cursor pagination with a page size of fifty; audit writes must not block the user's response path where they can be deferred safely.

ERROR STATES:
A failed audit write is logged to the server console and never rolls back the underlying mutation.

EMPTY STATES:
Separate messages for an empty log and for filters matching nothing.

LOADING STATES:
Skeleton rows.

BACKWARD COMPATIBILITY:
Existing entries lacking the diff field must still render.

TESTING:
For each privileged action, assert exactly one entry with the correct entity and actor; test filters, pagination and that a thrown audit error does not roll back a publish.

ACCEPTANCE CRITERIA:
Every privileged mutation writes exactly one entry; filtering by actor, entity, action and date works with pagination; a failed audit write never rolls back the mutation.

VERIFICATION:
Perform one of every privileged action in a session, then filter the log by that actor and confirm one entry per action with accurate diffs.

CONSTRAINTS:
* Do not rewrite unrelated code.
* Do not remove existing functionality unnecessarily.
* Reuse existing architecture where practical.
* Reuse existing dependencies when possible.
* Do not add unnecessary packages.
* Enforce sensitive permissions server-side.
* Preserve existing data.
* Maintain responsive behavior.
* Maintain accessibility.
* Review the diff before completion.

---

## TASK-28 — Test suite and continuous integration

**PRIORITY:** MEDIUM

**CURRENT STATE / EVIDENCE.** `find . -name "*.test.*" -o -name "*.spec.*"` (excluding `node_modules`) returns nothing. `package.json` scripts are `dev`, `build`, `start`, `lint`, and Prisma helpers only — there is no test runner in `devDependencies`. There is no `.github/workflows` directory. The repository has a single commit.

**PROBLEM.** Every task in this plan changes authorization, workflow legality or data scoping — precisely the logic where a silent regression is a security incident. There is currently no mechanism that would detect one.

**ROOT CAUSE.** The project went from prototype to feature work without a testing foundation.

**DESIRED BEHAVIOUR.** A unit layer over `lib/permissions.ts`, the capability map and the state machine; an integration layer over the server actions against a disposable database; a small end-to-end layer over the editorial cycle; plus the two static checks defined in TASK-14; all run in continuous integration on every push.

**ROLE & PERMISSION REQUIREMENTS.** The permission matrix test is the highest-value asset: for every role, every capability and every article-ownership combination, assert the expected outcome in a table-driven test.

**ACCEPTANCE CRITERIA.** The permission matrix, the state machine and every workflow action are covered; continuous integration runs type-check, lint, the token and class scripts, unit and integration tests on every push; a pull request that widens a permission fails without an accompanying matrix update.

### CODING AGENT PROMPT

ROLE:
You are a senior full-stack engineer working inside an existing technology publishing platform.

TASK:
Establish a test suite and continuous integration.

FIRST:
Inspect the existing implementation before modifying anything. Confirm there are no test files and no test runner in the manifest, read the permissions module, the workflow actions and the capability map, and read the existing scripts in the manifest.

CURRENT IMPLEMENTATION:
The repository contains no tests, no test runner and no continuous integration configuration. Authorization is spread across a permissions module, ad hoc page guards and server actions.

PROBLEM:
Almost every change in this plan touches authorization, workflow legality or data scoping, where a silent regression is a security incident rather than a cosmetic bug. Nothing would currently detect one.

ROOT CAUSE:
The project moved from prototype to feature work without a testing foundation.

GOAL:
Fast, meaningful coverage of the rules that matter, enforced automatically on every push.

FUNCTIONAL REQUIREMENTS:
Add a fast unit runner and write table-driven tests over the permission matrix covering every role against every capability and every ownership and status combination, and over the state machine covering every transition including illegal ones. Add integration tests exercising each server action against a disposable database with seeded users and articles, asserting both success paths and refusal paths for out-of-scope actors. Add a small end-to-end suite covering one full cycle: create, submit, request changes, resubmit, approve, publish, unpublish, archive. Add the token and class static checks from the design-system task. Wire type-checking, linting, both static checks, unit and integration tests into a continuous-integration workflow triggered on push and pull request, with the end-to-end suite running on the main branch.

ROLE & PERMISSIONS:
The permission matrix test is the single highest-value asset; treat any change to it as a reviewable security change.

DATA REQUIREMENTS:
Integration tests run against a disposable database created and migrated per run, with a deterministic seed covering every role, every status and both owned and unowned articles.

ARTICLE WORKFLOW:
Every transition in the state machine must have at least one allowed and one refused test case.

UI/UX REQUIREMENTS:
Not applicable.

DESIGN SYSTEM:
Not applicable beyond the static checks.

RESPONSIVE REQUIREMENTS:
The end-to-end suite runs at both a mobile and a desktop viewport.

ACCESSIBILITY:
Include automated accessibility assertions on the main console routes in the end-to-end suite.

SECURITY:
Add explicit tests for the defects this plan identifies: a stale token role, an author reading another author's article, a reviewer deleting an article, and a silent downgrade of a publish request.

PERFORMANCE:
Keep the unit suite under ten seconds so it can run on save.

ERROR STATES:
Test that failures surface as errors rather than as zeros or silent success.

EMPTY STATES:
Not applicable.

LOADING STATES:
Not applicable.

BACKWARD COMPATIBILITY:
Adding tests must not change application code; if a test cannot be written without a change, note it and make the change as a separate reviewable commit.

TESTING:
This task is testing.

ACCEPTANCE CRITERIA:
The permission matrix, the state machine and every workflow action are covered; continuous integration runs type-check, lint, both static checks and the unit and integration suites on every push; widening a permission without updating the matrix fails the build.

VERIFICATION:
Deliberately widen one capability, push, and confirm the build fails on the matrix test.

CONSTRAINTS:
* Do not rewrite unrelated code.
* Do not remove existing functionality unnecessarily.
* Reuse existing architecture where practical.
* Reuse existing dependencies when possible.
* Do not add unnecessary packages.
* Enforce sensitive permissions server-side.
* Preserve existing data.
* Maintain responsive behavior.
* Maintain accessibility.
* Review the diff before completion.

---

## TASK-29 — Remove development scaffolding from the editor

**PRIORITY:** LOW

**CURRENT STATE / EVIDENCE.** `components/editorial/ArticleEditor.tsx` ships a `fillTestData` handler and a template `<select>` that injects sample content into a production editor, plus a dead `EDITOR_CATEGORIES` constant superseded by `getCategories()`.

**PROBLEM.** Test-data controls sit beside real editorial controls; one mis-click injects placeholder prose into a real article. The dead constant misleads future maintainers into thinking categories are hardcoded.

**IMPLEMENTATION PLAN.** Delete `fillTestData`, its button, the template select and its data; delete `EDITOR_CATEGORIES`. If templates are genuinely wanted, model them as a first-class feature with stored templates and an explicit "start from template" step on article creation — not as a mid-edit injector.

**FILES/MODULES AFFECTED.** `components/editorial/ArticleEditor.tsx` only.

**ACCEPTANCE CRITERIA.** No test-data or template-injection control exists in the production editor; no dead category constant remains; the editor still creates and edits articles unchanged.

**ROLLBACK.** Single-file revert; no data or schema impact.

*This task is small and self-contained; it is folded into the TASK-15 coding-agent prompt rather than duplicated here.*

---

## TASK-30 — CSS consolidation and a design-token lint rule

**PRIORITY:** LOW · **Follows:** TASK-14

**CURRENT STATE / EVIDENCE.** `app/globals.css` is 4,110 lines with a console block of roughly 750 lines duplicating patterns the public styles already express; three styling vocabularies coexist; hardcoded colours such as `rgba(16,185,129,.15)`, `#5f9e7c`, `#d07070`, `#ff7d87` and `#b01726` bypass the token layer.

**PROBLEM.** Two parallel systems must be changed together for any visual fix, and hardcoded colours silently break dark mode.

**IMPLEMENTATION PLAN.** After TASK-14 lands the primitives, delete each superseded `.cs-*` and `.admin-*` rule as its last consumer migrates; replace every hardcoded colour with a token; add lint rules forbidding raw hex values and arbitrary pixel values inside the console component directory; record the stylesheet line count before and after.

**ACCEPTANCE CRITERIA.** The console block shrinks measurably; no hardcoded colour remains in console code; the lint rule fails the build on a raw hex value; the public site is visually unchanged.

**RISK.** Deleting a rule whose last consumer was missed causes a silent visual regression — delete only after grepping for the class name across `.tsx`, and verify each console route in both themes.

---

## TASK-31 — Make `homepagePlacement` functional, or remove it

**PRIORITY:** LOW

**CURRENT STATE / EVIDENCE.** `Article.homepagePlacement` exists in the schema and is editable in the editor; `app/(public)/page.tsx:30` selects the lead story from `featured` instead, and a repository-wide search finds no read of `homepagePlacement` in any public route.

**PROBLEM.** An editor can set a homepage placement and nothing happens — a control that lies about its effect is worse than no control.

**IMPLEMENTATION PLAN.** Decide one of two paths and execute it fully. Either implement placement — read `homepagePlacement` in the home page query, define the slots (lead, secondary, list), enforce one lead at a time, and give editors a homepage curation view showing current placements — or delete the field from the editor and deprecate it in the schema. Do not leave it half-wired.

**ROLE & PERMISSION REQUIREMENTS.** If implemented, homepage curation is an EDITOR-and-above capability, distinct from publishing.

**ACCEPTANCE CRITERIA.** Either setting a placement visibly changes the homepage, or the control no longer exists.

---

## TASK-32 — Repository hygiene

**PRIORITY:** LOW

**CURRENT STATE / EVIDENCE.** `AGENT_SKILL.md` describes a "GridX" design system and components that do not exist in this repository — it is stale and actively misleading. `CLAUDE.md` is a stub. `htm_2.html` is a 277 KB standalone prototype at the repository root and is the origin of the console CSS and of the undefined tokens catalogued in §11.2. `README.md` does not describe the roles, the workflow or the local setup path. There is one commit, so there is no history to consult.

**PROBLEM.** A new contributor or coding agent reading the repository is given a false description of the design system, which is exactly how the undefined-token defect propagated.

**IMPLEMENTATION PLAN.** Rewrite `README.md` with the real stack, setup steps, environment variables, role model and editorial workflow. Either rewrite `AGENT_SKILL.md` to describe the actual system or delete it. Move `htm_2.html` to a `prototypes/` directory with a note stating it is historical and must not be treated as specification. Fill in or remove `CLAUDE.md`. Add a short architecture note pointing at this plan.

**ACCEPTANCE CRITERIA.** No document in the repository describes a system that does not exist; a new contributor can set up and run the project from the README alone.

---

## TASK-33 — Media library

**PRIORITY:** OPTIONAL

**CURRENT STATE / EVIDENCE.** `Article.img` is a plain URL string; there is no upload path anywhere in the repository; `next.config.ts` allowlists six external image hosts and `lib/sanitize.ts` maintains its own `ALLOWED_MEDIA_DOMAINS`. Images therefore come from third-party hosts pasted by hand.

**PROBLEM.** Editorial imagery depends on external hosts that can change or disappear, there is no alt-text discipline, no cropping, no reuse and no rights record.

**WHY OPTIONAL.** This requires an object-storage provider and a processing pipeline. It is real work with real cost, and it is not on the critical path for any of the CRITICAL or HIGH tasks. Do not start it until storage is chosen.

**IMPLEMENTATION PLAN (when undertaken).** A `Media` model with storage key, dimensions, mime type, size, alt text, credit, licence and uploader; a signed direct-to-storage upload route; a picker component replacing the URL field; derivative generation for list thumbnails, cards and hero images; usage tracking so a media item in use cannot be deleted silently.

**ACCEPTANCE CRITERIA.** An editor can upload, reuse and credit an image without leaving the console; alt text is required before an image can be attached to a published article; existing external URLs continue to work.

**BACKWARD COMPATIBILITY.** Keep the string URL field and treat media records as the preferred source; never migrate away from external URLs destructively.

---

# 39. Master Role Matrix

## 39.1 Current implementation

Source of truth: `prisma/schema.prisma` (`enum Role`), `lib/permissions.ts`, and the per-page guards.

Seven roles exist, ranked by the numeric `ROLE_HIERARCHY`: OWNER 100, ADMIN 90, EDITOR 80, MODERATOR 70, REVIEWER 60, AUTHOR 50, STAFF 10. There is **no SUPER_ADMIN** (OWNER is the equivalent) and **no CONTRIBUTOR**.

| Capability (current function) | OWNER | ADMIN | EDITOR | MODERATOR | REVIEWER | AUTHOR | STAFF |
|---|---|---|---|---|---|---|---|
| `canViewAdminPanel` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `canViewUsersList` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `canManageUser` (target below actor) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `canAssignRole` (below own rank) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `canEditArticle` (own) | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| `canEditArticle` (others') | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `canPublishArticle` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `canDeleteArticle` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `canViewReviewQueue` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| `canModerateComments` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `canViewAuditLogs` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `canViewSettings` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `canViewSubscribers` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Taxonomy page (hardcoded list in `taxonomy/page.tsx:11`) | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Taxonomy **nav link** (gated by `canReview`) | ✅ | ✅ | ✅ | ❌ | ⚠️ shown, page redirects | ❌ | ❌ |
| Article list scope | all | all | all | **all** | **all** | own only | all |

Defects the matrix exposes:

1. **REVIEWER and MODERATOR see every article, including other authors' drafts.** Scoping is `user?.role === "AUTHOR"` only (dashboard, articles, drafts pages) — a role-name check, not a capability check.
2. **REVIEWER is offered a Taxonomy link that redirects them away** — the nav condition (`canReview`) and the page guard (`["OWNER","ADMIN","EDITOR"]`) disagree.
3. **STAFF has `canViewAdminPanel` false but middleware only checks authentication**, so a STAFF user reaching `/admin/articles` directly is not redirected by middleware; they are stopped, if at all, only by whatever the page happens to check.
4. **MODERATOR (rank 70) outranks REVIEWER (rank 60) but cannot review**, while REVIEWER can. The numeric hierarchy and the capability set contradict each other.
5. **REVIEWER cannot edit an article but the review decision path runs through `upsertArticle`**, which requires `canEditArticle` — so the role designed for review may be unable to complete a review.
6. **Delete is granted globally to EDITOR with no ownership or status guard**, while the UI hides the button only from AUTHOR — MODERATOR, REVIEWER and STAFF see a Delete button that fails server-side.
7. **`InviteForm` offers MODERATOR and STAFF**, but the users page's role selector cannot set them, so those roles can be created and then never changed.

## 39.2 Recommended implementation

Keep the seven roles — renaming or removing enum values is a destructive migration with no editorial benefit. Fix the model instead:

**Replace the numeric hierarchy with an explicit capability map.** Rank comparison is the right tool for "can this actor manage that user" and the wrong tool for everything else; it is why MODERATOR outranks REVIEWER yet cannot review.

**Add CONTRIBUTOR as the eighth role** — this is the one genuinely justified addition. AUTHOR currently means "may write and submit". A publication taking external pitches needs a strictly weaker role that cannot publish under any circumstance and whose drafts are invisible to other contributors. Without it, every guest writer must be given AUTHOR.

**Do not add SUPER_ADMIN.** OWNER already is it.

| Capability | OWNER | ADMIN | EDITOR | MODERATOR | REVIEWER | AUTHOR | CONTRIBUTOR | STAFF |
|---|---|---|---|---|---|---|---|---|
| `article.view.all` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| `article.view.own` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `article.view.published` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `article.create` | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| `article.edit.own` (draft/changes-requested) | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| `article.edit.any` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `article.submit` | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| `article.review` (approve / request changes / reject) | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| `article.publish` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `article.schedule` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `article.unpublish` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `article.archive` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `article.delete` (archived only) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `article.delete.own.draft` | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| `article.feature` / homepage curation | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `taxonomy.create` / `taxonomy.rename` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `taxonomy.delete` / `taxonomy.merge` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `author.manage.all` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `author.manage.own` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `comment.moderate` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `user.view` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `user.manage` (rank-gated) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `user.invite` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `subscriber.view` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `audit.view` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `audit.export` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `settings.publication` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `settings.personal` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `console.access` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |

**Article list scope, recommended:**

| Role | Sees |
|---|---|
| OWNER, ADMIN, EDITOR | every article in every status |
| REVIEWER | every article in review, plus all published, plus own |
| MODERATOR | published only, plus own |
| AUTHOR | own in every status, plus all published |
| CONTRIBUTOR | own only |
| STAFF | no console access |

**Rules that must hold, and be tested (TASK-28):**

1. Every navigation item's visibility condition is the identical capability its route guard enforces. Visible implies permitted; permitted implies visible.
2. Scope is derived from a single `buildArticleScope(actor)` function used by every article query — list, detail, count and export.
3. Rank comparison survives only inside `user.manage` and `role.assign`.
4. Delete is restricted to archived articles for ADMIN and OWNER, plus own drafts for authors and contributors. Nothing else is deletable; everything else is archived.
5. No capability is ever inferred from the JWT (TASK-16).

---

# 40. Master Article State Machine

## 40.1 Current implementation

`ArticleStatus` declares six values: `DRAFT`, `SUBMITTED`, `REVIEW`, `REVISION_REQUESTED`, `REJECTED`, `PUBLISHED`. There is **no transition table anywhere in the codebase** — the status is a free field written by `upsertArticle` from the client's `status` payload.

Observed behaviour:

```
DRAFT ──submit──────────► SUBMITTED
DRAFT ──save as published (if canPublishArticle) ──► PUBLISHED
DRAFT ──save as published (if NOT canPublishArticle) ──► SUBMITTED   ← silent downgrade
SUBMITTED ──Approve & Publish──► PUBLISHED
SUBMITTED ──Request Revision──► REVISION_REQUESTED
SUBMITTED ──Reject──► REJECTED
REVISION_REQUESTED ──resubmit──► SUBMITTED
PUBLISHED ──unpublish──► DRAFT
REVIEW ── (never written by any code path)
REJECTED ── (terminal and unreachable: excluded from every list)
```

Defects:

1. **`REVIEW` is dead.** No code path sets it. The queue query includes it, so it exists only to be filtered on.
2. **`REJECTED` is a black hole.** `submissions/page.tsx:53` excludes it and no other list includes any non-published, non-draft status, so a rejected article cannot be found in the console at all.
3. **No `SCHEDULED`.** `scheduledFor` is persisted and editable, but no job publishes it and no public query gates on it, so a scheduled article is either already public or never becomes public.
4. **No `ARCHIVED`.** The only way to remove an article from circulation is deletion, which is irreversible.
5. **Any status can be written to any other**, because there is no transition validation — a client can post `status: "PUBLISHED"` on a rejected article.
6. **The silent downgrade** (PUBLISHED → SUBMITTED when the actor lacks publish rights) is a security anti-pattern: an unauthorised action should be refused, not quietly reinterpreted.
7. **No timestamps mark the transitions.** There is no `submittedAt`, `reviewedAt` or `archivedAt`, so nothing can be ordered or aged by workflow event.
8. **Transitions are not audited as transitions** — only as generic article updates.

## 40.2 Recommended implementation

Eight states. Add `SCHEDULED` and `ARCHIVED`; retire `SUBMITTED` in favour of a single in-review state, or keep both and give `REVIEW` a meaning — the plan below keeps `SUBMITTED` as the enum value and treats it as "in review", with `REVIEW` deprecated and back-filled, because renaming an enum value in use is a destructive migration.

```
                 ┌──────────────────────────────────────────────┐
                 │                                              │
  ┌─────────┐ submit  ┌───────────┐ approve  ┌──────────┐ publish ┌───────────┐
  │  DRAFT  ├────────►│ SUBMITTED ├─────────►│ APPROVED ├────────►│ PUBLISHED │
  └────┬────┘         └─────┬─────┘          └────┬─────┘         └─────┬─────┘
       │                    │                     │ schedule            │ unpublish
       │                    │ request changes     ▼                     ▼
       │              ┌─────▼──────────────┐ ┌───────────┐         ┌─────────┐
       │              │ REVISION_REQUESTED │ │ SCHEDULED ├────────►│  DRAFT  │
       │              └─────┬──────────────┘ └─────┬─────┘  cancel └─────────┘
       │   resubmit ◄───────┘                      │ due
       │                    │ reject               ▼
       │              ┌─────▼────┐            ┌───────────┐
       │              │ REJECTED │            │ PUBLISHED │
       │              └─────┬────┘            └─────┬─────┘
       │                    │ reopen                │ archive
       └────────────────────┘                       ▼
                                              ┌──────────┐  delete (ADMIN+, archived only)
                                              │ ARCHIVED ├──────────────────► (gone)
                                              └────┬─────┘
                                                   │ restore
                                                   ▼
                                                 DRAFT
```

**Transition table — the single source of truth to implement in `lib/workflow.ts`:**

| From | To | Action | Required capability | Server-enforced preconditions |
|---|---|---|---|---|
| DRAFT | SUBMITTED | `submitArticle` | `article.submit` + owns or `article.edit.any` | title, deck, body, category present |
| DRAFT | PUBLISHED | `publishArticle` | `article.publish` | pre-flight passes |
| DRAFT | ARCHIVED | `archiveArticle` | `article.archive` | — |
| SUBMITTED | APPROVED | `approveArticle` | `article.review` | reviewer ≠ author unless sole editor |
| SUBMITTED | REVISION_REQUESTED | `requestChanges` | `article.review` | reason ≥ 20 chars |
| SUBMITTED | REJECTED | `rejectArticle` | `article.review` | reason ≥ 20 chars + reason code |
| SUBMITTED | DRAFT | `withdrawArticle` | owns article | — |
| REVISION_REQUESTED | SUBMITTED | `submitArticle` (resubmit) | `article.submit` + owns | increments pass number |
| REVISION_REQUESTED | ARCHIVED | `archiveArticle` | `article.archive` | — |
| APPROVED | PUBLISHED | `publishArticle` | `article.publish` | pre-flight passes |
| APPROVED | SCHEDULED | `scheduleArticle` | `article.schedule` | `scheduledFor` in the future |
| APPROVED | REVISION_REQUESTED | `requestChanges` | `article.review` | reason ≥ 20 chars |
| SCHEDULED | PUBLISHED | scheduled job | system | `scheduledFor` ≤ now |
| SCHEDULED | APPROVED | `cancelSchedule` | `article.schedule` | — |
| PUBLISHED | DRAFT | `unpublishArticle` | `article.unpublish` | — |
| PUBLISHED | ARCHIVED | `archiveArticle` | `article.archive` | — |
| REJECTED | DRAFT | `reopenArticle` | `article.edit.any` | — |
| REJECTED | (new DRAFT) | `duplicateArticle` | owns or `article.create` | creates a new record |
| ARCHIVED | DRAFT | `restoreArticle` | `article.archive` | — |
| ARCHIVED | (deleted) | `deleteArticle` | `article.delete` | typed confirmation |

**Every transition must:**

1. Be its own server action; never a `status` field on a generic save.
2. Validate legality against this table and refuse — with an error, never a downgrade — when the transition or the capability is absent.
3. Write the corresponding timestamp: `submittedAt`, `reviewedAt`, `publishedAt`, `scheduledFor`, `archivedAt`.
4. Write an `ArticleReview` row for review decisions, with reviewer, reason, reason code, from-status, to-status and pass number.
5. Write one audit entry naming both statuses.
6. Emit the corresponding notification.
7. Revalidate the affected public paths.

**Terminal states:** none. Every state is reachable from every other through a legal path; `ARCHIVED` is the only near-terminal state and `restoreArticle` exits it. Deletion is the sole irreversible operation and is reachable only from `ARCHIVED`.

---

# 41. Master Article List Specification

This is the single specification that `/admin/articles` must satisfy. Every other article surface (review queue, drafts, author workspace) is this list with a preset scope and a preset filter.

## 41.1 Route and URL contract

`/admin/articles` is the only article index. `/admin/drafts` and `/admin/submissions` become permanent redirects to it with a preset `status` parameter.

All list state lives in the URL, making every view shareable, bookmarkable and back-button correct:

```
/admin/articles
  ?q=<search>
  &status=DRAFT,SUBMITTED
  &author=<authorId>
  &category=<categoryId>
  &tag=<tagId>
  &from=<YYYY-MM-DD>&to=<YYYY-MM-DD>
  &dateField=created|updated|published
  &sort=updated|created|published|title|author|status|views
  &dir=asc|desc
  &page=<n>
  &per=25|50|100
```

Defaults: `sort=updated`, `dir=desc`, `page=1`, `per=25`, no status filter (all statuses within scope).

## 41.2 Data contract

One server query, shaped by `buildArticleScope(actor)` (§39.2), executed as a parallel pair: the page of rows and the total count.

Selected fields — never the article body:

```
id, slug, title, deck, img, status, featured, views,
createdAt, updatedAt, publishedAt, scheduledFor, submittedAt,
author: { id, name, slug, avatar },  legacy author string fallback,
category: { id, name, slug },
tags: { id, name } (first 3 + overflow count),
_count: { revisions, reviews },
latestReview: { decision, reason, reviewerName, createdAt }
```

Required indexes (`prisma/schema.prisma` currently declares **zero**):

```
@@index([status, updatedAt])
@@index([status, submittedAt])
@@index([authorId, status, updatedAt])
@@index([categoryId, status, publishedAt])
@@index([publishedAt])
@@index([scheduledFor])
```

## 41.3 Row anatomy (desktop, ≥1024px)

A single row, 72px tall, separated from its neighbours by one hairline. **No card, no border, no shadow, no radius on the row itself.**

| Zone | Width | Content |
|---|---|---|
| Select | 40px | Checkbox (TASK-23) |
| Thumbnail | 96×54 (16:9) | `img` with `next/image`, `sizes="96px"`, rounded to `--r-sm`; monogram placeholder when absent |
| Primary | flexible | Line 1: title, 15px, weight 600, two-line clamp. Line 2: author · category · relative timestamp · tags, 13px, muted |
| Status | 120px | Status treatment per §41.5 |
| Metrics | 100px | Views for published; word count otherwise; muted, tabular numerals |
| Actions | 44px | Overflow menu, revealed on hover and always present for keyboard focus |

The whole row is a link to the actor's correct destination (TASK-18); the action menu stops propagation.

**Expanded state** (chevron or keyboard Enter on the row's disclosure): reveals the deck, the latest review reason, the full tag list, the slug, and the timestamps that the collapsed row omits — no modal, no navigation.

## 41.4 Column set by breakpoint

| Breakpoint | Layout |
|---|---|
| ≥1280px | All zones above |
| 1024–1279px | Drop Metrics |
| 768–1023px | Thumbnail 64×36; drop Metrics and tags |
| <768px | Stacked two-line row: thumbnail left, title and metadata right, status as a text chip on line two, actions in the overflow menu. **No horizontal scrolling.** |

## 41.5 Status treatment

Never colour alone. Each status is a small uppercase label at 11px with letter-spacing, preceded by a 6px shape, on a 10%-opacity tint of its token.

| Status | Token | Shape | Label |
|---|---|---|---|
| DRAFT | `--muted` | hollow circle | DRAFT |
| SUBMITTED | `--warn` | filled circle | IN REVIEW |
| REVISION_REQUESTED | `--warn` | half circle | CHANGES REQUESTED |
| APPROVED | `--ok` | check | APPROVED |
| SCHEDULED | `--ok` | clock | SCHEDULED |
| PUBLISHED | `--ok` | filled square | PUBLISHED |
| REJECTED | `--bad` | cross | REJECTED |
| ARCHIVED | `--faint` | hollow square | ARCHIVED |

The brand accent `--accent` (#d92332) is **never** a status colour. It is reserved for the wordmark, primary buttons, the active navigation indicator and focus rings.

## 41.6 Filter bar

A single horizontal row above the list, separated by one hairline, **not** a card.

- Search input (flexible width), debounced 300ms, submits to the URL, searches title, deck, slug, author name and category name — server-side, case-insensitive.
- Status multi-select, showing counts per status within the current scope.
- Author select, populated from authors who actually have articles within scope, searchable.
- Category select, from `Category` with article counts.
- Date range with a field selector (created / updated / published) and presets for today, 7 days, 30 days, this year.
- Active filters render as removable chips below the bar with a "Clear all" control.
- Result count: "Showing 1–25 of 312" — always visible, never hidden behind a hover.

Below 768px the whole bar collapses to a single "Filters (3)" button opening a bottom sheet that applies on confirm.

## 41.7 Sorting

Column headers are buttons with `aria-sort`. Sortable: title, author, status, created, updated, published, views. Sorting is server-side and reflected in the URL. The default is `updatedAt desc`. A secondary sort on `id` guarantees a stable order across pages.

## 41.8 Pagination

Numbered pagination, not infinite scroll: page size selector (25 / 50 / 100), first / previous / next / last, current range and total. Page size persists per user in local storage while remaining URL-overridable. An out-of-range page clamps to the last page rather than rendering empty.

## 41.9 Actions

Row-level (overflow menu), filtered to legal transitions for the actor and the row's status: Edit, View detail, Preview, Open public page, Submit, Approve, Request changes, Reject, Publish, Schedule, Unpublish, Feature, Duplicate, Archive, Restore, Delete. Destructive actions sit below a separator and use the `--bad` token.

Bulk (TASK-23): the sticky bar appears only when a selection exists.

## 41.10 States

| State | Treatment |
|---|---|
| Loading | Skeleton rows matching the real geometry, count equal to the page size |
| Empty (no content) | "No articles yet" + "Write your first article" primary action |
| Empty (filtered) | "No articles match these filters", the active filters echoed, "Clear filters" |
| Error | Explanation, a reference identifier and a Retry action — never zeros |
| Permission denied | The shared denied component naming the missing capability |
| Partial failure (bulk) | The per-item report from TASK-23 |

## 41.11 Performance budget

- Query time under 100ms at 10,000 articles, guaranteed by the indexes in §41.2.
- Payload under 50KB per page of 25 rows — enforced by never selecting `contentHtml` or `contentJson`.
- Thumbnails served through `next/image` at a fixed 96px width.
- Filter option lists cached for 60 seconds and revalidated on taxonomy mutation.
- The row component is a server component; only the filter bar, selection state and action menus are client components.

## 41.12 Accessibility requirements

A real `<table>` with `<caption>`, `<thead>`, scoped headers and `aria-sort`; or a list with explicit roles — not a `<div>` grid. Row links have accessible names including the title and status. The selection count and the result count are announced politely. The overflow menu follows the ARIA menu pattern. Every target is at least 44×44px on touch.

---

# 42. Master Dashboard Design System

The complete specification for the console's visual language. This section is the reference TASK-14 implements.

## 42.1 Principles

1. **Whitespace over containers.** Structure comes from spacing and alignment; a border is the last resort, not the first.
2. **Never box within a box.** A bordered element may not contain or directly abut another bordered element. This rule alone eliminates most of the current console's visual noise.
3. **One divider weight.** A 1px hairline in `--line`. Never two adjacent dividers, never a divider beside a border.
4. **Red is the brand, not the vocabulary.** `--accent` marks identity and primary intent. It never encodes status, never fills a large area, never appears twice in one row.
5. **Type carries hierarchy.** Size, weight and colour do the work that borders are currently doing.
6. **Both themes are first-class.** Every token resolves in light and dark; nothing is verified in only one.
7. **Density with air.** A CMS list is dense; the page around it is not.

## 42.2 Tokens

Console tokens layer on the existing palette in `app/globals.css`. The seven aliases below are the immediate fix for the undefined references catalogued in §11.2 and must land first.

```css
:root {
  /* --- compatibility aliases (fix undefined references) --- */
  --bg:            var(--paper);
  --bg-elevated:   var(--surface);
  --surface-1:     var(--surface);
  --ink-muted:     var(--muted);
  --success:       var(--ok);
  --warning:       var(--warn);
  --error:         var(--bad);

  /* --- console surfaces --- */
  --cs-bg:         var(--paper);
  --cs-raised:     var(--surface);
  --cs-line:       var(--line);
  --cs-line-soft:  var(--line-2);
  --cs-focus:      var(--accent);

  /* --- console type scale (6 steps) --- */
  --cs-t-display:  28px;   /* dashboard figures only */
  --cs-t-h1:       20px;
  --cs-t-h2:       16px;
  --cs-t-body:     14px;
  --cs-t-meta:     13px;
  --cs-t-label:    11px;   /* uppercase, 0.08em tracking */

  /* --- console metrics --- */
  --cs-row-h:      72px;
  --cs-row-h-sm:   56px;
  --cs-page-x:     32px;
  --cs-sidebar-w:  248px;
  --cs-tap:        44px;
}
```

Dark mode inherits automatically because every alias points at a token that already has a dark override (`app/globals.css:51-69`).

## 42.3 Colour

| Purpose | Light | Dark | Token |
|---|---|---|---|
| Page background | near-white paper | near-black | `--paper` |
| Raised surface (sidebar, modal, menu, sticky bar) | white | elevated charcoal | `--surface` |
| Primary text | near-black ink | near-white | `--ink` |
| Secondary text | grey | light grey | `--muted` |
| Tertiary / disabled | light grey | mid grey | `--faint` |
| Hairline | very light grey | dark grey | `--line` |
| Brand / primary action | #d92332 | #d92332 | `--accent` |
| Positive state | green | green | `--ok` |
| Caution state | amber | amber | `--warn` |
| Negative state | red-brown | red-brown | `--bad` |

`--bad` must be visibly distinct from `--accent` in both themes; if it is not, shift `--bad` toward orange-red. Verify every pairing at 4.5:1 for text and 3:1 for non-text indicators.

## 42.4 Typography

| Step | Size / weight | Font | Use |
|---|---|---|---|
| Display | 28px / 500 | `--f-display` | Dashboard figures only |
| H1 | 20px / 600 | `--f-ui` | Page title |
| H2 | 16px / 600 | `--f-ui` | Section heading |
| Body | 14px / 400 | `--f-ui` | Default, form inputs, row titles at 600 |
| Meta | 13px / 400 | `--f-ui` | Row metadata, help text, timestamps |
| Label | 11px / 600, 0.08em, uppercase | `--f-ui` | Section labels, status chips, column headers |

Three weights only: 400, 500, 600. No 300, no 700 — the current fourteen sizes collapse to these six steps. `--f-body` (serif) appears only inside rendered article preview content, never in the interface chrome. Tabular numerals for every number in a table or figure.

## 42.5 Spacing

An 8px base, using only the existing `--sp-1` … `--sp-8` scale. No arbitrary pixel values in console code — the lint rule in TASK-30 enforces this.

| Relationship | Space |
|---|---|
| Within a control (icon to label) | 8px |
| Between related fields | 16px |
| Between a label and its content | 8px |
| Between sections within a page | 32px |
| Between major page blocks | 48px |
| Page padding (desktop / tablet / mobile) | 32 / 24 / 16px |
| Row vertical padding | 16px |

## 42.6 Surfaces and borders

Raised surfaces are permitted in exactly five places: modals, drawers, dropdown menus, the sticky bulk-action bar, and the sidebar. Everywhere else sits directly on `--paper`.

Explicitly forbidden: a card around a list; a card around the filter bar; a card around a statistic; a card around a page section; nested cards; a bordered element adjacent to another bordered element; shadows on anything that is not a modal, drawer or menu.

Radii: `--r-sm` (6px) for inputs, buttons, chips and thumbnails; `--r-md` (10px) for modals and menus. Nothing larger.

## 42.7 Component primitives (`components/console/`)

| Primitive | Contract |
|---|---|
| `PageHeader` | Title, optional deck, breadcrumb, action slot. Bottom hairline. No card. |
| `SectionLabel` | 11px uppercase muted label with 32px top margin. |
| `DataList` / `DataRow` | Hairline-separated rows, hover tint, focus ring, expandable slot. |
| `StatusChip` | Shape plus label plus tint, driven by the §41.5 map. |
| `FilterBar` | Search, selects, date range, chips, count, mobile sheet. |
| `Pagination` | Range text, page size, first/prev/next/last. |
| `EmptyState` | Heading, sentence, one action. Text only. |
| `ErrorState` | Heading, sentence, reference id, retry. |
| `Skeleton` | Geometry-matched placeholder honouring reduced motion. |
| `ConfirmDialog` | Already exists in `components/ui/` — adopt it everywhere, add typed confirmation for destructive actions. |
| `Toast` | Already exists in `lib/utils.ts` — replaces every `alert()`. |
| `OverflowMenu` | ARIA menu pattern, Escape to close, focus restore. |
| `Figure` | Label, large number, descriptor. No box. |
| `Sheet` | Bottom sheet for mobile filters and menus. |

## 42.8 Interaction

Row hover: a 4% ink tint, no border change, no lift. Focus: a 2px `--cs-focus` ring at a 2px offset, on every interactive element, identical in both themes. Transitions: 120ms ease-out, limited to opacity and background-color; disabled entirely under `prefers-reduced-motion`. Disabled controls: 50% opacity with `cursor: not-allowed` and an explanatory title. Loading buttons: a spinner replacing the label, width preserved so nothing shifts.

## 42.9 Breakpoints

640 / 768 / 1024 / 1280. Four values, used everywhere, replacing the six inconsistent values currently in `app/globals.css`.

## 42.10 What to delete

The `.cs-card`, `.stat` tile and `.admin-card` patterns; every inline style object in an admin page or editorial component; the five hardcoded colours (`rgba(16,185,129,.15)`, `#5f9e7c`, `#d07070`, `#ff7d87`, `#b01726`); the duplicated "Permission Required" markup in three pages; and the eight undefined class names once their consumers have migrated.

---

# 43. Final Verification Checklist

Run this list after each phase. Every item is objectively checkable; none is a matter of opinion.

## 43.1 Security

- [ ] Middleware enforces role authorization per route prefix, not authentication alone.
- [ ] Every server action resolves the actor from the database, never from the JWT.
- [ ] A role change takes effect on the demoted user's next request, without sign-out.
- [ ] `buildArticleScope(actor)` is the only source of article scoping, used by list, detail, count and export.
- [ ] An author requesting another author's article by identifier receives not-found.
- [ ] An unauthorised publish attempt is refused with an error — never silently downgraded.
- [ ] Delete is reachable only for archived articles (ADMIN+) and own drafts.
- [ ] Every navigation item's visibility condition equals its route guard's capability, verified by test.
- [ ] Rejection and change-request reason minimums are enforced server-side.
- [ ] No console error message exposes a stack trace, query or out-of-scope identifier.

## 43.2 Workflow

- [ ] Each transition is its own server action; no `status` field is written by a generic save.
- [ ] Illegal transitions are refused with a clear error.
- [ ] `submittedAt`, `reviewedAt`, `publishedAt`, `archivedAt` are written on the matching transitions.
- [ ] The review queue contains only articles awaiting a decision and can reach zero.
- [ ] Rejected articles remain findable and can be reopened or duplicated.
- [ ] Scheduled articles publish automatically, and are not publicly visible before their time.
- [ ] Every transition writes an audit entry and emits a notification.
- [ ] Two reviewers cannot claim the same article.

## 43.3 Article list

- [ ] One unified index shows every status within the actor's scope.
- [ ] Filtering, search, sorting and pagination are all server-side and URL-driven.
- [ ] Author, category, status, tag and date-range filters work against the real data model.
- [ ] Every row shows a thumbnail with a graceful placeholder.
- [ ] The result count and active-filter chips are always visible.
- [ ] Pagination is numbered; there is no infinite scroll.
- [ ] `/admin/drafts` and `/admin/submissions` redirect to the index with presets.
- [ ] No list query selects an article body.

## 43.4 Roles and dashboard

- [ ] Each of the eight roles sees a distinct, appropriate dashboard block set.
- [ ] Every dashboard figure links to a filtered view.
- [ ] Pipeline counts include every status.
- [ ] No role sees a navigation item that redirects them away.
- [ ] Capability checks are centralised; no `role === "X"` comparison remains outside the capability map.

## 43.5 Design system

- [ ] Zero undefined custom properties, verified by the static check.
- [ ] Zero undefined class names, verified by the static check.
- [ ] No list, filter bar, statistic or page section is wrapped in a card.
- [ ] No bordered element directly abuts another bordered element.
- [ ] Six type steps and three weights only.
- [ ] Only the `--sp-*` scale is used; no arbitrary pixel values in console code.
- [ ] The brand accent never encodes a status.
- [ ] Every status is distinguishable without colour.
- [ ] Both themes reviewed on every console route.

## 43.6 Responsive

- [ ] No console route scrolls horizontally at 320px.
- [ ] Lists stack into two-line rows below 768px.
- [ ] Filters open in a bottom sheet below 768px.
- [ ] The sidebar becomes a focus-trapped drawer below 900px, identity included.
- [ ] Every touch target is at least 44×44px.
- [ ] The full create → submit → review → publish cycle is completable at 375px.

## 43.7 States

- [ ] Every console segment has loading, error and not-found handling.
- [ ] No query failure renders as a zero.
- [ ] Empty-because-nothing-exists is distinguished from empty-because-filtered.
- [ ] Every empty state offers a next action.
- [ ] No `alert()` or `confirm()` remains anywhere in the console.
- [ ] Destructive actions require typed confirmation.

## 43.8 Accessibility

- [ ] The console shell no longer declares itself a modal dialog.
- [ ] Correct landmarks plus a working skip link.
- [ ] No serious or critical automated violations on any console route.
- [ ] The whole editorial cycle is completable by keyboard alone.
- [ ] Contrast verified at 4.5:1 for text and 3:1 for indicators, in both themes.
- [ ] Reduced-motion preference disables pulses and transitions.

## 43.9 Performance

- [ ] Indexes exist on every filtered and sorted column.
- [ ] The article list query stays under 100ms at 10,000 rows.
- [ ] No unbounded `findMany` remains in the console.
- [ ] Dashboard queries run as one parallel batch.
- [ ] Autosave writes no revision; revision retention is bounded and pruned.
- [ ] The rich-text editor bundle loads dynamically.

## 43.10 Process

- [ ] The permission matrix and state machine are covered by table-driven tests.
- [ ] Continuous integration runs type-check, lint, both static checks and the test suites on every push.
- [ ] Widening a capability without updating the matrix fails the build.
- [ ] No document in the repository describes a system that does not exist.

---

*End of DASHBOARD_CMS_MASTER_PLAN.md*

# 44. Phased Execution Roadmap

The task list in §34–§38 is ordered by priority. This section orders it by **dependency**, so a coding agent can be handed one phase at a time without ever hitting a missing prerequisite.

**Rule for every phase:** hand the agent this document plus the phase's task IDs. Do not start a phase until the previous phase's acceptance criteria pass.

## Phase 1 — Critical foundation (in this exact order)

`TASK-02 → TASK-03 → TASK-07 → TASK-01`

| Step | Task | Why it must come here |
|---|---|---|
| 1 | **TASK-02** Capability layer | Every later task consumes `can(actor, capability, resource)` and `buildArticleScope(actor)`. Landing it first prevents 30 more `role === "X"` call sites. |
| 2 | **TASK-03** Schema: `APPROVED`/`SCHEDULED`/`ARCHIVED`, `submittedAt`/`reviewedAt`/`archivedAt`, `ArticleReview`, indexes | TASK-01 queries against these columns and indexes. Doing it after would force the index to be rewritten. |
| 3 | **TASK-07** Field projection (stop selecting `contentHtml`/`contentJson` in lists) | A one-file fix that must land before TASK-01 codifies the query contract, otherwise the new contract inherits the payload bug. |
| 4 | **TASK-01** Unified server-scoped article index | Consumes all three above: scope from TASK-02, statuses and indexes from TASK-03, projection from TASK-07. |

**What Phase 1 actually delivers**

- Authors can finally see their own `SUBMITTED`, `REVIEW` and `REJECTED` articles — the CRITICAL finding #1 and #2 of §1 are closed.
- One route, `/admin/articles`, lists every status within the actor's scope; `/admin/drafts` and `/admin/submissions` become redirects.
- Scoping is decided in exactly one function, so a scope bug can no longer exist in one page and not another.
- List payload drops from full article bodies to projected fields — typically a 10–50× reduction per page.
- Queries are index-backed, so the list stays fast past 10,000 articles.
- The workflow schema exists (states, timestamps, `ArticleReview`) even though nothing writes to it yet — that is Phase 2.

**What Phase 1 deliberately does NOT deliver**

Filtering, sorting and pagination (TASK-08), thumbnails (TASK-09), review decisions (TASK-04/10/11), scheduling execution (TASK-06), any visual change (TASK-14). Expect the list to look unchanged and still be unpaginated at the end of Phase 1. That is correct.

**Ship with Phase 1:** the permission-matrix test from TASK-28. Writing it alongside TASK-02, while the matrix is fresh, costs an hour and protects every later phase.

**Phase 1 exit criteria**

- [ ] No `role === "..."` comparison remains outside `lib/capabilities.ts`.
- [ ] Every article query in the console goes through `buildArticleScope(actor)`.
- [ ] An author sees their submitted and rejected articles; a contributor sees only their own.
- [ ] No console query selects `contentHtml` or `contentJson`.
- [ ] `prisma migrate` applied; the new indexes exist; no existing row lost a value.
- [ ] The permission-matrix test passes for every role × capability × ownership combination.

## Phase 2 — Make the workflow real and safe

`TASK-04 → TASK-05 → TASK-16 → TASK-11 → TASK-10`

Phase 1 created the workflow *schema*; Phase 2 makes it *behave*.

| Task | Outcome |
|---|---|
| **TASK-04** Dedicated transition actions | `submit`, `approve`, `requestChanges`, `reject`, `publish`, `schedule`, `unpublish`, `archive`, `restore` as discrete server-authorised actions. Ends the silent publish→submit downgrade. Fixes the REVIEWER-cannot-review defect. |
| **TASK-05** Delete → archive | Deletion restricted to archived articles (ADMIN+) and own drafts; ownership and status enforced server-side. |
| **TASK-16** Session invalidation + DB-sourced actor | Closes the stale-JWT privilege window. Small, security-critical, and it must land before more actions rely on the actor. |
| **TASK-11** Rejection / change-request with enforced reasons | Reasons ≥20 chars + reason code persisted to `ArticleReview` and shown to the author. |
| **TASK-10** Review queue + focused review screen | The queue that can actually reach zero. Depends on `submittedAt` (Phase 1) and the transition actions (TASK-04). |

**Phase 2 exit criteria:** every status change goes through a transition action; an illegal transition is refused with an error, never reinterpreted; a rejected article is findable with its reason; the review queue empties.

## Phase 3 — Make the list usable at scale

`TASK-08 → TASK-09 → TASK-06`

| Task | Outcome |
|---|---|
| **TASK-08** Server-side filter / search / sort / pagination | URL-driven state, author/category/status/tag/date filters, numbered pagination, result count. This is where the list becomes a real CMS surface. |
| **TASK-09** Image-aware editorial row | Thumbnails, two-line rows, expandable detail, status treatment per §41.5. |
| **TASK-06** Scheduled publishing execution | The cron route that flips `SCHEDULED → PUBLISHED`, plus public-route gating. Independent of 08/09 — run it in parallel if you have capacity. |

## Phase 4 — Fix the surface

`TASK-14 → TASK-13 → TASK-12 → TASK-15`

TASK-14 must lead: it defines the tokens and primitives that 13, 12 and 15 consume. Running the dashboard or navigation rebuild before the token repair means building on top of seven undefined custom properties and repainting twice.

## Phase 5 — Polish and hardening

`TASK-21 (states) → TASK-22 (responsive) → TASK-26 (accessibility) → TASK-17 (notifications) → TASK-18 (article detail hub) → TASK-27 (audit completeness) → TASK-28 (full CI)`

## Phase 6 — Remaining scope

`TASK-19 authors · TASK-20 taxonomy · TASK-23 bulk actions · TASK-24 settings · TASK-25 revisions · TASK-29/30/31/32 cleanup · TASK-33 media (only after object storage is chosen)`

## Dependency quick reference

| Task | Hard prerequisites |
|---|---|
| TASK-01 | 02, 03, 07 |
| TASK-04 | 02, 03 |
| TASK-05 | 02, 04 |
| TASK-06 | 03, 04 |
| TASK-08 | 01, 03 |
| TASK-09 | 01, 08 |
| TASK-10 | 03, 04 |
| TASK-11 | 03, 04 |
| TASK-12 | 02, 03 |
| TASK-13 | 02 |
| TASK-15 | 04, 14 |
| TASK-17 | 04 |
| TASK-18 | 01, 03, 09 |
| TASK-23 | 01, 04, 09 |
| TASK-25 | 03, 18 |

---

# 45. Phase 2 Plan Review — gaps to close before "done"

The Phase 2 execution plan (TASK-16 → TASK-04 → TASK-05 → TASK-11 → TASK-10) matches the dependency order in §44 and is correct. The following items are in the task specifications of §38 but are **not** stated in the execution plan. Each is small, and each is the difference between "the feature exists" and "the acceptance criteria pass".

## 45.1 TASK-16 — session invalidation

| Gap | Required |
|---|---|
| Increment triggers listed as "role change" only | Also increment on **deactivation** and on **password change** (§38 TASK-16 functional requirements). A deactivated account must lose its sessions. |
| No fail-closed rule | If the version lookup throws, **invalidate** the token. Never fall back to the previous role. |
| Per-request DB read cost | The `jwt` callback must select only `id, role, sessionVersion, isActive` — not the whole user row — and `getActor()` must be memoised per request (`React.cache`) so one page render does not read the same user five times. |
| Existing tokens | Current tokens carry no `sessionVersion` claim. Treat a **missing claim as stale** → one forced re-authentication for everyone at deploy. Put this in the release note. |
| No user-facing path | A session invalidated mid-visit must redirect to sign-in with a short "your permissions changed" message, not a blank 401. |

## 45.2 TASK-04 — transition actions

| Gap | Required |
|---|---|
| "Strip `status` from `upsertArticle`" | Also remove the **silent downgrade**: today an unauthorised `PUBLISHED` request is rewritten to `SUBMITTED`. After this task an unauthorised transition must **return an error**. |
| Autosave | Autosave must keep calling `upsertArticle` and must **never** call a workflow action. Confirm the 5s timer cannot fire a transition. |
| Revalidation | Revalidate only on transitions that change public output (publish, unpublish, archive, restore, scheduled-publish). Do not revalidate `/` on `requestChanges`. |
| Notification hook | TASK-17 is Phase 5, but leave a single call site per transition (a no-op emitter) so Phase 5 is a wiring job, not a re-open of every action. |
| `REVIEW` enum value | It is dead (no code path writes it). Decide now: either back-fill any `REVIEW` rows to `SUBMITTED` and stop referencing it, or give it a meaning. Do not leave it ambiguous once the state machine is enforced. |
| Enum migration note | Postgres `ALTER TYPE ... ADD VALUE` cannot run inside a transaction on older versions. Verify the generated migration applies cleanly against a copy of production before running it live. |

## 45.3 TASK-05 — delete and archive

| Gap | Required |
|---|---|
| "hard deletes dependencies first" | Must run inside one `$transaction`, and the **audit entry must be written before the delete**, capturing title, slug, author and status — otherwise the record of what was deleted dies with it. |
| Status guard | `deleteArticlePermanently` must additionally assert the article is **ARCHIVED**. Capability alone is not the guard (§40.2 transition table). |
| Published articles | Archiving a published article must remove it from public routes and leave the slug in `previousSlugs` handling intact so the URL 410s or redirects rather than 500s. |

## 45.4 TASK-11 — rejection and change requests

| Gap | Required |
|---|---|
| Reason shown in one place | The acceptance criterion is **three** places without opening the editor: the article row's expanded state, the article detail header, and the author's dashboard action-required block. The editor banner is the fourth, not the first. |
| Rejected articles reachable | Confirm the Phase 1 unified index actually lists `REJECTED` for its author. If it does not, this task is not done. |
| Recovery paths | `reopenArticle` (editor → DRAFT) and `duplicateArticle` (author → new DRAFT) must exist, otherwise rejection is still a dead end. |
| Legacy reasons | Reasons already stored in `ArticleRevision.notes` must still display: read `ArticleReview` first, fall back to the revision note. |

## 45.5 TASK-10 — review queue

| Gap | Required |
|---|---|
| Claiming | `claimReview` must be a **conditional update** (`updateMany` with `where: { id, reviewerId: null }`) and treat `count === 0` as a lost race returning a conflict. A read-then-write check is a race, not a claim. |
| `/admin/submissions` | Must **redirect** to `/admin/review`, not 404. Same for any bookmarked links. |
| Ageing | Two thresholds (>24h, >72h) each with a **text label**, never colour alone. |
| Take-over | Must be explicit, confirmed and audited — not a silent overwrite of another reviewer's claim. |
| Self-review | Block a reviewer from approving their own article unless they are the only editor; enforce in the action. |

## 45.6 Verification additions

Add to the stated plan (`tsc --noEmit`, `npm run build`, manual tests):

- [ ] Update the **permission-matrix test** from Phase 1 with the new capabilities (`article.review`, `article.archive`, `article.delete`) — a widened capability must fail the build.
- [ ] A **state-machine test**: every transition in the §40.2 table has one allowed case and one refused case, including refusal for an illegal from-state.
- [ ] A **race test** for `claimReview`: two concurrent claims, exactly one succeeds.
- [ ] A **stale-role test**: sign in, change the role in the database, next request reflects it.
- [ ] Confirm **no console query** selects `contentHtml`/`contentJson` — the review decision screen is the only place allowed to load a body.

## 45.7 Phase 2 exit criteria (restated)

- [ ] Every status change goes through a transition action; `upsertArticle` no longer writes `status`.
- [ ] An illegal transition returns an error; nothing is silently reinterpreted.
- [ ] A REVIEWER can complete a full review without holding `article.edit`.
- [ ] A rejected article is findable by its author with its reason, and can be reopened or duplicated.
- [ ] The review queue contains only articles awaiting a decision and reaches zero.
- [ ] Two reviewers cannot hold the same claim.
- [ ] Deleting is possible only from ARCHIVED (ADMIN+) or an own draft.
- [ ] A role change takes effect on the next request without sign-out.

---

# 46. Next After Phase 2 — Phase 3 hand-off brief

`TASK-08 → TASK-09 → TASK-06`

Phase 1 made articles **visible**. Phase 2 made the workflow **real**. Phase 3 makes the list **usable at scale** and closes the last CRITICAL finding (dead scheduling).

## 46.1 Order and rationale

| Step | Task | Why here |
|---|---|---|
| 1 | **TASK-08** Server-side filtering, search, sorting, pagination | The list is still unbounded and client-filtered after Phase 2. This is the single largest remaining correctness and performance gap, and TASK-09 renders into whatever row contract this task establishes. |
| 2 | **TASK-09** Image-aware editorial row | Thumbnails, two-line rows, expandable detail, the §41.5 status treatment. Purely presentational over TASK-08's contract. |
| 3 | **TASK-06** Scheduled publishing execution | Independent of 08 and 09 — run it in parallel if you have a second agent. Closes CRITICAL finding #3. |

## 46.2 What Phase 3 delivers

- `/admin/articles` becomes URL-driven: `?q=&status=&author=&category=&tag=&from=&to=&sort=&dir=&page=&per=` (§41.1), so every view is shareable and back-button correct.
- Filters backed by the real data model — author from `authorId`, category from `categoryId`, status from the enum — with counts, removable chips and a result count.
- Numbered pagination, 25/50/100. **No infinite scroll.**
- Every row shows a 96×54 thumbnail from `Article.img` with a monogram placeholder, plus status by shape **and** label.
- `SCHEDULED → PUBLISHED` actually happens, and scheduled articles are not publicly readable before their time.

## 46.3 What Phase 3 does NOT deliver

No visual system fix. The seven undefined CSS custom properties are still undefined at the end of Phase 3, so the list will be correct and still look wrong. That is Phase 4 (`TASK-14` first, then 13 → 12 → 15). Do not reorder — repainting on top of broken tokens means painting twice.

## 46.4 Phase 3 exit criteria

- [ ] All filtering, search, sorting and pagination happen in the database, not in `useMemo`.
- [ ] List state lives entirely in the URL; reload and back-button preserve it.
- [ ] The article list query stays under 100ms at 10,000 rows (indexes from Phase 1).
- [ ] No unbounded `findMany` remains anywhere in the console.
- [ ] Every row has a thumbnail or a deliberate placeholder.
- [ ] Status is distinguishable with colour disabled.
- [ ] A scheduled article publishes automatically and is invisible publicly beforehand.
- [ ] `/admin/drafts` and `/admin/submissions` still redirect correctly with presets.

---

# 47. TASK-10 Resumption Brief (when Phase 2 stops short of the review queue)

TASK-10 is the last item on the Phase 2 checklist and the largest: two new routes, a claim mechanism, ageing, a two-pane decision screen and a server-computed pre-flight. It is the item most likely to be skipped or silently deferred. Before re-running it, confirm its prerequisites actually exist — TASK-10 **cannot** be built without them, and an agent that finds them missing will usually move on rather than fail loudly.

## 47.1 Prerequisite audit — run these first

| # | Check | Command / location | Why TASK-10 needs it |
|---|---|---|---|
| 1 | `submittedAt` column exists on `Article` | `grep -n "submittedAt" prisma/schema.prisma` | The queue is ordered by submission time and ageing is computed from it. Without it there is nothing to order by. |
| 2 | Claim fields exist (`reviewerId`, `claimedAt`) | `grep -n "reviewerId\|claimedAt" prisma/schema.prisma` | Claiming is a conditional update on `reviewerId`. No column, no claim. |
| 3 | `ArticleReview` model exists | `grep -n "model ArticleReview" prisma/schema.prisma` | The decision screen renders review history and the pass number. |
| 4 | **Migration actually applied**, not just generated | `npx prisma migrate status` | `prisma generate` only rebuilds the client. If no migration ran, the database has none of the above columns and every queue query throws at runtime. |
| 5 | Workflow actions exist and are callable | `ls app/actions/workflow.ts` | The decision panel must call `approveArticle` / `requestChanges` / `rejectArticle`, never write the article directly. |
| 6 | Capability layer exposes `article.review` | `grep -n "article.review" lib/capabilities.ts` | Both routes are gated on it. |
| 7 | `SUBMITTED`-only scope is reachable | the unified index from TASK-01 | The queue is that scope with a preset filter. |

If check 4 fails, **stop**. Apply the migration first. Everything else in Phase 2 that appears to work is working only against the Prisma client's type definitions, not the real database.

## 47.2 Why TASK-10 commonly gets skipped

1. **Budget exhaustion.** It is the fifth and biggest task in a five-task run. Agents frequently complete four and summarise the fifth as "pending".
2. **Missing columns.** If `submittedAt` or the claim fields never landed (see 47.1), the ordering and claiming requirements are unimplementable, so the agent defers rather than inventing schema mid-task.
3. **Migration skipped.** A checklist note such as "migration skipped, generate used" means the database and the schema file disagree. Any new route querying new columns fails immediately, so the agent avoids creating it.
4. **Ambiguity about `/admin/submissions`.** The task requires the old route to become a redirect. An agent unwilling to delete a working page may stall rather than replace it.

## 47.3 Resumption prompt — hand this alone, with this document

ROLE:
You are a senior full-stack engineer working inside an existing technology publishing platform.

TASK:
Implement TASK-10 only — the dedicated review queue and focused review screen. Phase 2 tasks 16, 04, 05 and 11 are already done; do not redo them.

FIRST:
Before writing any code, verify the prerequisites and report the result of each: that `Article` has `submittedAt`, `reviewerId` and `claimedAt`; that the `ArticleReview` model exists; that `npx prisma migrate status` reports no pending migration; that `app/actions/workflow.ts` exports the approve, request-changes and reject actions; and that the capability layer exposes the review capability. If any check fails, stop and report it rather than working around it.

CURRENT IMPLEMENTATION:
Review decisions are reachable only through the existing submissions route, which lists submitted, review and revision-requested articles ordered by the updated timestamp in the generic table, and through a decision panel embedded in the article editor.

PROBLEM:
The queue never empties because revision-requested articles remain in it, ordering by the updated timestamp sorts by the author's last keystroke rather than by submission time, nothing prevents two reviewers duplicating work, and deciding requires scrolling through the whole editing form.

GOAL:
A queue containing only articles awaiting a decision, ordered oldest-first by submission time with visible ageing and atomic claiming, plus a focused decision screen with a rendered preview beside a sticky decision panel.

FUNCTIONAL REQUIREMENTS:
Build the queue at the review route and the decision screen at the review detail route exactly as specified in section 22 and the TASK-10 entry of section 38 of the master plan. Claiming must be a conditional update that matches only an unclaimed row and treats a zero-row result as a lost race returning a conflict; a read-then-write check is not acceptable. Take-over of another reviewer's claim must be explicit, confirmed and audited. Ageing thresholds at twenty-four and seventy-two hours must each carry a text label, never colour alone. Block a reviewer from approving their own article unless they are the only editor, enforced in the action. Make the old submissions route a permanent redirect to the new queue, preserving any bookmarked links.

ROLE & PERMISSIONS:
Both routes require the review capability, enforced server-side. Approve-and-publish and approve-and-schedule appear only for actors who also hold the publish or schedule capability.

DATA REQUIREMENTS:
Order by the submitted-at column using the status-with-submitted-at index. The queue must not select the article body; only the decision screen loads it.

ARTICLE WORKFLOW:
Every decision calls the existing workflow action. The review screen must never write the article record directly.

UI/UX REQUIREMENTS:
Two panes above 1024 pixels at sixty and forty percent with the decision panel sticky; tabs for Preview, Decide and History below that. No cards around queue rows.

DESIGN SYSTEM:
The design tokens are not yet repaired — that is Phase 4, TASK-14. Use only tokens that currently resolve, and do not introduce new references to the undefined properties listed in section 11.2.

RESPONSIVE REQUIREMENTS:
All decision controls reachable without horizontal scrolling at 320 pixels.

ACCESSIBILITY:
Tabs follow the ARIA tabs pattern. The reason textarea is labelled and its character requirement is announced.

SECURITY:
Reason length, reason code and transition legality are enforced in the server action, not the form.

PERFORMANCE:
The queue uses projected list fields plus the claim and submission columns only.

ERROR STATES:
A lost claim race returns a conflict and the row refreshes to show the actual claimant.

EMPTY STATES:
A queue-clear message explaining that resubmissions appear automatically, with a link to the article index.

LOADING STATES:
Skeleton rows for the queue and a skeleton preview pane on the decision screen.

BACKWARD COMPATIBILITY:
The submissions route must redirect, not return not-found. The editor's embedded review panel may remain but must call the same workflow actions.

TESTING:
Test two concurrent claims where exactly one succeeds, both ageing thresholds, each decision path, self-review refusal, and the pre-flight checklist against an article missing a deck.

ACCEPTANCE CRITERIA:
The queue reaches zero when all submissions are decided; ordering is by submission time; two reviewers cannot claim the same article; a decision is two clicks from the queue.

VERIFICATION:
Submit three articles as an author, decide them as a reviewer, and confirm the queue empties, the author is notified of each outcome, and the history records every decision with its reason.

CONSTRAINTS:
* Do not rewrite unrelated code.
* Do not remove existing functionality unnecessarily.
* Reuse existing architecture where practical.
* Reuse existing dependencies when possible.
* Do not add unnecessary packages.
* Enforce sensitive permissions server-side.
* Preserve existing data.
* Maintain responsive behavior.
* Maintain accessibility.
* Review the diff before completion.

## 47.4 Do not move to Phase 3 until

- [ ] `npx prisma migrate status` reports no pending migration.
- [ ] The queue lists only articles awaiting a decision and can reach zero.
- [ ] Two concurrent claims result in exactly one winner.
- [ ] `/admin/submissions` redirects rather than 404s.
- [ ] A reviewer can complete approve, request-changes and reject without holding the edit capability.
- [ ] Every remaining box in the Phase 2 exit criteria of section 45.7 is ticked.

---

# 48. Phase 2 Sign-off and Phase 3 Go/No-Go

Phase 2's five tasks are reported complete. Before starting Phase 3, two things must happen: close the one item the checklist itself flags as unfinished, and correct a task-numbering error in the checklist.

## 48.1 The blocking item: the migration was never applied

The checklist records, in TASK-16:

> Create Prisma migration for `sessionVersion` (skipped, generate used)

`prisma generate` rebuilds the TypeScript client from `schema.prisma`. It does **not** alter the database. If no migration ran, then every column and model Phase 1 and Phase 2 introduced — `sessionVersion`, `submittedAt`, `reviewedAt`, `archivedAt`, `reviewerId`, `claimedAt`, the `ArticleReview` model, the new `ArticleStatus` values and every `@@index` — exists in the schema file and in the generated types, but **not in Postgres**.

The consequence is that the code type-checks and builds, and fails at runtime on first query. This is precisely the failure mode that makes a phase look finished when it is not.

**Run this before anything else:**

```
npx prisma migrate status
```

| Result | Meaning | Action |
|---|---|---|
| "Database schema is up to date" | Migrations were applied after all; the checklist note is stale | Correct the note, proceed to 48.2 |
| "Following migrations have not yet been applied" | Schema file and database disagree | `npx prisma migrate dev --name phase1_phase2_workflow` on development, then deploy with `npx prisma migrate deploy` |
| "No migration found in prisma/migrations" | No migration was ever generated | Generate one now from the current schema, review the SQL by hand, then apply |

**Two things to check in the generated SQL before applying it:**

1. **Enum additions.** Postgres cannot run `ALTER TYPE ... ADD VALUE` inside a transaction block on versions before 12, and Prisma wraps migrations in transactions. If `APPROVED`, `SCHEDULED` or `ARCHIVED` are added to `ArticleStatus`, confirm the migration applies against a copy of production, not only against an empty development database.
2. **Backfill.** `sessionVersion` needs a default of 1 on existing rows. `submittedAt` is null for articles already sitting in `SUBMITTED` — backfill it from `updatedAt` in the same migration, or the review queue will order those rows unpredictably and their ageing will be wrong.

**Nothing in Phase 2 can be considered verified until the database and the schema agree.**

## 48.2 Checklist correction: "TASK-14: Audit Logs" is mislabelled

TASK-14 in this plan is **"Fix design tokens and build the console design system"** (§38), a Phase 4 task. Audit logging is **TASK-27, "Audit-log completeness, filtering and pagination"**, a Phase 5 task.

Neither belongs in Phase 2. If audit-log work was started under that heading, it was out of sequence:

- **TASK-27 has a hard prerequisite that Phase 2 just created.** Every workflow transition must write exactly one audit entry naming the from-status and to-status. If the transition actions in `app/actions/workflow.ts` already call the audit helper, that part of TASK-27 is done and the rest — the shared helper, filtering, pagination, export, the missing call sites in taxonomy, invitations, comments and profile — is still Phase 5 work.
- **TASK-14 must not start before Phase 3 finishes**, and when it does it leads Phase 4, because TASK-13, TASK-12 and TASK-15 all render into the tokens and primitives it defines.

Recommendation: verify that each workflow transition writes one audit entry (that is a Phase 2 acceptance criterion, §45.7), then stop. Defer the rest of TASK-27 to Phase 5.

## 48.3 Phase 2 verification — run before declaring it done

Checked boxes are claims; these are tests. Run them in order and stop at the first failure.

**Database**

- [ ] `npx prisma migrate status` reports no pending migration.
- [ ] `sessionVersion` exists on `User` with a default of 1 and no null rows.
- [ ] `Article` has `submittedAt`, `reviewedAt`, `archivedAt`, `reviewerId` and `claimedAt`.
- [ ] `ArticleReview` rows are actually being written — submit and reject one article, then query the table directly.
- [ ] Articles already in `SUBMITTED` have a non-null `submittedAt`.

**Security (TASK-16)**

- [ ] Sign in as an editor in one browser; change their role to AUTHOR directly in the database; reload in the first browser. The elevated capability is gone on the **next request**, without sign-out.
- [ ] Deactivating a user ends their session.
- [ ] A password change invalidates other sessions.
- [ ] A failed version lookup invalidates the token rather than falling back to the previous role.
- [ ] No server action reads `role` from the session object; `grep -rn "session.user.role" app/ lib/` returns only display-layer uses.

**Workflow (TASK-04, TASK-05)**

- [ ] `grep -n "status" app/actions/article.ts` confirms `upsertArticle` no longer writes a status.
- [ ] An unauthorised publish request returns an **error**, not a downgrade to `SUBMITTED`. This is the specific regression to look for — the old behaviour was a silent rewrite.
- [ ] Autosave never fires a workflow action; leave the editor idle with unsaved changes for thirty seconds and confirm no transition is recorded.
- [ ] Every illegal transition in the §40.2 table is refused.
- [ ] `deleteArticlePermanently` refuses an article that is not `ARCHIVED`, even for an OWNER.
- [ ] The audit entry for a permanent delete is written **before** the row is removed and captures title, slug, author and status.
- [ ] A REVIEWER completes approve, request-changes and reject **without** holding `article.edit`. This was the original CRITICAL defect; verify it directly.

**Reasons (TASK-11)**

- [ ] A 5-character rejection reason is refused by the server, not just by the form.
- [ ] A rejection without a reason code is refused.
- [ ] The reason is visible in **three** places outside the editor: the article row's expanded state, the article detail header, and the author's dashboard action-required block. The editor banner is the fourth.
- [ ] A rejected article is listed for its author in the unified index.
- [ ] `reopenArticle` and `duplicateArticle` both work.
- [ ] Reasons stored in legacy `ArticleRevision.notes` still display.

**Review queue (TASK-10)**

- [ ] The queue contains only articles awaiting a decision and reaches zero when all are decided.
- [ ] Ordering is by `submittedAt`, oldest first.
- [ ] Two concurrent claims produce exactly one winner — the claim is an `updateMany` matching `reviewerId: null`, and a zero-row result returns a conflict.
- [ ] Take-over is explicit, confirmed and audited.
- [ ] Ageing at 24h and 72h carries a text label, not colour alone.
- [ ] A reviewer cannot approve their own article unless they are the only editor.
- [ ] `/admin/submissions` redirects to `/admin/review` rather than 404ing.
- [ ] The queue query does not select `contentHtml` or `contentJson`; only the decision screen loads a body.

**Build**

- [ ] `npx tsc --noEmit` clean.
- [ ] `npm run build` clean.
- [ ] The permission-matrix test covers `article.review`, `article.archive` and `article.delete`.
- [ ] A state-machine test exists with one allowed and one refused case per transition.

## 48.4 Go / No-Go

**No-Go** while any of these is true:

- `prisma migrate status` reports a pending or missing migration.
- An unauthorised publish is still silently downgraded.
- A REVIEWER still cannot complete a review.
- Two reviewers can hold the same claim.
- Rejected articles are not listed for their authors.

**Go** to Phase 3 when §45.7 and §48.3 are fully ticked.

## 48.5 Phase 3 — start here

`TASK-08 → TASK-09 → TASK-06`

The full brief is §46. In short:

| Step | Task | Note |
|---|---|---|
| 1 | **TASK-08** Server-side filtering, search, sorting, pagination | The largest remaining correctness and performance gap. The list is still unbounded and filtered in `useMemo`. Establishes the row contract TASK-09 renders into. Full spec: §41 and the TASK-08 entry in §38. |
| 2 | **TASK-09** Image-aware editorial row | Thumbnails, two-line rows, expandable detail, §41.5 status treatment. Purely presentational over TASK-08's contract. |
| 3 | **TASK-06** Scheduled publishing execution | Independent of 08 and 09 — run in parallel if capacity allows. Closes the last CRITICAL finding. Note it depends on `SCHEDULED` existing in the database, so it is also blocked by §48.1. |

Hand the agent this document plus **TASK-08 only**. Do not hand all three at once — TASK-09 renders into a contract that does not exist until TASK-08 lands.

**Expect the list to still look wrong at the end of Phase 3.** The seven undefined custom properties from §11.2 are not repaired until TASK-14, which leads Phase 4. Correct behaviour first, appearance second.

---

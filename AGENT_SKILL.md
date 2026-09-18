# GridX — Agent Skill & System Architecture Specification

## 1. System Overview
- **Project Name:** GridX
- **Description:** A modern, high-performance technology publication and editorial management platform featuring a fast reader-facing web portal and a full-featured editorial CMS console for content creation, drafting, publishing, and categorization.
- **Tech Stack:**
  - **Framework:** Next.js 16.3.5 (App Router, Server Actions, React Server Components)
  - **Runtime & React:** Node.js (Linux), React 19.0.0, React DOM 19.0.0
  - **Database & ORM:** PostgreSQL (Supabase cloud pooler) with Prisma ORM 6.4.1
  - **Rich Text Editor:** TipTap (StarterKit, Underline, Image, Link)
  - **Forms & Validation:** React Hook Form, Zod, @hookform/resolvers
  - **Styling:** Tailwind CSS v4 (@tailwindcss/postcss) with custom CSS variables & theme tokens in `globals.css`
  - **Theming & Icons:** next-themes (dark/light/sepia/oled modes), Lucide React & custom SVG icons
  - **Text-to-Speech:** Web Speech API synthesis utility (`lib/speech.ts`)

---

## 2. Architecture & Design Patterns
- **Directory Structure (Next.js App Router):**
  - `app/(public)/`: Reader-facing routes grouped under a common public layout (Header, Ticker, Navigation, Footer). Includes `/` (Homepage), `/article/[slug]` (Article detail), `/category/[slug]` (Category index), `/latest` (Chronological feed), `/search` (Query search), and `/page/[slug]` (Static policy/about pages).
  - `app/admin/`: Editorial console routes wrapped in `AdminLayout` console modal. Includes `/admin` (Metrics & overview), `/admin/articles` (Published index), `/admin/drafts` (Drafts queue), `/admin/editor` (New story), `/admin/editor/[id]` (Story editing), `/admin/login` (Admin authentication), and `/admin/settings` (Console preferences).
  - `app/actions/`: Next.js Server Actions (`"use server"`) providing direct, mutation-safe backend operations like `upsertArticle` and `deleteArticle`.
  - `components/`: Modular component layers divided into `article/` (StoryCard, StoryRow, ArticleBody, ArticleReactions), `editorial/` (ArticleEditor, AdminHeader, QuickNav), `layout/` (Header, Nav, Footer, Ticker, Sidebar), `newsletter/`, `reading/` (SpeechPlayer, FontSizeControls), `theme/` (ThemeToggle), and `ui/` (AdSlot, ShareButton, Toast).
  - `lib/`: Shared utilities (`db.ts` for Prisma client singleton, `utils.ts` for date/string formatting & toasts, `speech.ts` for TTS, `mockData.ts` for fallback/legacy mock data).
  - `prisma/`: Schema definition (`schema.prisma`) and migrations.
- **Data Flow:**
  - Server components directly query PostgreSQL via `db` (`lib/db.ts`) with Prisma ORM.
  - Mutations execute via Server Actions (`app/actions/article.ts`), invoking `revalidatePath` to purge Next.js server caches across public and admin routes.
  - Rich text is created via TipTap, serialized to both HTML string (`contentHtml`) and JSON structure (`contentJson`), and saved along with metadata into the `Article` table.

---

## 3. Code Standards & Conventions
- **Naming Conventions:**
  - PascalCase for React components (`StoryCard.tsx`, `ArticleEditor.tsx`).
  - camelCase for helper functions, server action functions, and utilities (`upsertArticle`, `timeAgo`, `fmtViews`).
  - UPPER_SNAKE_CASE for system constants and static configuration (`EDITOR_CATEGORIES`, `NAV_ITEMS`).
- **Styling Conventions:**
  - Vanilla CSS variables and utility classes defined in `app/globals.css`.
  - Tailwind CSS v4 `@theme` directive used for custom design tokens; standard Tailwind utility classes combined with semantic class names (`wrap`, `cs-card`, `btn-cs`, `story-row`).
  - Clean semantic HTML tags (`<article>`, `<aside>`, `<section>`, `<nav>`, `<header>`, `<footer>`).
- **Type Safety:**
  - Strict TypeScript configuration (`strict: true`).
  - Always type database entities using `@prisma/client` types (`Article`, `Category`, `ArticleStatus`).
  - Component props must support Prisma types with relational extensions (e.g. `Article & { category?: Category | null }`).

---

## 4. Known Issues, Quirks & Gotchas
- **Tailwind CSS v4 `@theme` Directive:**
  - The `@theme` rule in `app/globals.css` triggers an IDE linter warning ("Unknown at rule @theme"). This is benign and expected in Tailwind v4 syntax; do not alter or remove it.
- **Next.js 16 Route Params Resolution:**
  - In Next.js 16, `params` and `searchParams` on server page components are `Promise` objects that MUST be awaited before property access (e.g. `const { slug } = await params;`).
- **Article & Mock Data Incompatibilities:**
  - Legacy mock data in `lib/mockData.ts` had a divergent schema (lacked `contentHtml`, `contentJson`, `categoryId`, etc.). Public pages must query Prisma `db` instead of importing mock arrays.
- **TipTap Server vs Client Rendering:**
  - TipTap is strictly client-side. The editor component must have `"use client"` and initialize with appropriate hydration checks.
- **React 19 & `next-themes` Inline Script Warning:**
  - `next-themes` renders an inline script tag during SSR for instant theme evaluation to prevent FOUC. React 19 dev mode flags client-rendered script tags with a console error ("Encountered a script tag while rendering React component"). This is safely filtered on the client in `components/layout/ThemeProvider.tsx`.


---

## 5. File Structure Map
```
GRID-X html/
├── AGENT_SKILL.md               # Persistent agent knowledge & change log (this file)
├── AGENTS.md                    # Next.js 16 system agent instructions
├── app/
│   ├── (public)/                # Public reader layout & pages
│   │   ├── layout.tsx           # Public header, ticker, nav, footer
│   │   ├── page.tsx             # Homepage (Hero, Trending, Grid, Sections)
│   │   ├── article/[slug]/      # Article reading page
│   │   ├── category/[slug]/     # Category filter page
│   │   ├── latest/              # Chronological story feed
│   │   ├── search/              # Full-text / keyword search page
│   │   └── page/[slug]/         # Static informational pages
│   ├── actions/
│   │   └── article.ts           # Server actions: upsertArticle, deleteArticle
│   ├── admin/                   # Editorial console
│   │   ├── layout.tsx           # Admin console layout wrapper
│   │   ├── page.tsx             # Admin dashboard & stats
│   │   ├── articles/            # Published articles management
│   │   ├── drafts/              # Drafts management & queue
│   │   ├── editor/              # Article creation editor
│   │   │   └── [id]/            # Article update editor
│   │   └── settings/            # Admin settings
│   ├── globals.css              # Global styles, variables, typography & theme
│   └── layout.tsx               # Root layout & ThemeProvider
├── components/
│   ├── article/                 # StoryCard, StoryRow, ArticleBody, ArticleReactions
│   ├── editorial/               # ArticleEditor, AdminHeader, QuickNav
│   ├── layout/                  # Header, Nav, Footer, Ticker, Sidebar
│   ├── newsletter/              # Newsletter signup components
│   ├── reading/                 # SpeechPlayer, FontSizeControls
│   ├── theme/                   # ThemeToggle
│   └── ui/                      # AdSlot, ShareButton, Toast
├── lib/
│   ├── db.ts                    # Prisma Client singleton
│   ├── mockData.ts              # Static fallback data & static page contents
│   ├── speech.ts                # Web Speech API text-to-speech engine
│   └── utils.ts                 # Formatter utilities & toast notification
├── prisma/
│   ├── schema.prisma            # PostgreSQL models: Category, Article, ArticleStatus
│   └── seed.ts                  # Database seeding script
└── package.json                 # Project dependencies & scripts
```

---

## 6. Critical Business Logic & Workflows
- **Article Lifecycle:**
  - `DRAFT`: Saved in progress, only visible in `/admin/drafts` and `/admin/editor/[id]`. Not indexed on public pages.
  - `REVIEW`: In editorial review queue.
  - `PUBLISHED`: Publicly accessible at `/article/[slug]`, featured on homepage, searchable, categorized.
- **Slug Generation & Uniqueness:**
  - Editor auto-generates slug from title if slug is empty or matches title slugification.
  - Server action checks for slug conflicts before creating or updating to prevent PostgreSQL unique constraint violations (`P2002`).
- **Category Association:**
  - Articles belong to a `Category` via foreign key `categoryId`.
  - When saving, if a category does not exist, `upsertArticle` auto-creates the category by slug and title to maintain referential integrity.
- **Admin Console Access:**
  - Admin editorial console routes (`/admin/*`) are directly accessible without authentication barriers per user design specification.

---

## 7. Testing & Verification Guide
- **TypeScript & Build Verification:**
  - Run `npx next build` to test both compilation and strict TypeScript type-checking across all routes.
- **Functional Checks:**
  - Create, edit, and publish an article in `/admin/editor`.
  - Verify that the article immediately shows up in `/admin/articles`, `/`, `/category/[slug]`, `/latest`, and `/search`.
  - Delete an article from `/admin/drafts` or `/admin/articles` and confirm cache revalidation and removal.
  - Test `/admin` route redirection when logged out and successful login using admin credentials.

---

## 8. Deployment Notes
- **Environment Variables Required:**
  - `DATABASE_URL`: PostgreSQL connection string with pooling (Supabase transaction pooler).
  - `DIRECT_URL`: Direct database connection for migrations (if applicable).
  - `ADMIN_SECRET`: Password or secret phrase for editorial console access.
- **Build Step:**
  - `prisma generate` followed by `next build`.

---

## 9. Change Log
| Date | Author | Target File | Description |
|------|--------|-------------|-------------|
| 2026-09-17 | Antigravity | `AGENT_SKILL.md` | Initialized comprehensive agent skill file, architecture specifications, and documentation. |
| 2026-09-17 | Antigravity | `app/actions/article.ts` | Added automated slug collision resolution, support for `role` and `featured` fields, and implemented `deleteArticle` server action with cache revalidation. |
| 2026-09-17 | Antigravity | `components/article/StoryRow.tsx` | Refactored `StoryArticle` type definition to be fully compatible with both Prisma `Article` models and legacy mock shapes. |
| 2026-09-17 | Antigravity | `components/article/StoryCard.tsx` | Refactored `StoryCardArticle` type definition to be fully compatible with both Prisma `Article` models and legacy mock shapes. |
| 2026-09-17 | Antigravity | `app/(public)/category/[slug]/page.tsx` | Migrated from static mock data to Prisma database query with graceful fallback. |
| 2026-09-17 | Antigravity | `app/(public)/latest/page.tsx` | Migrated from static mock data to Prisma database query with chronological grouping. |
| 2026-09-17 | Antigravity | `app/(public)/search/page.tsx` | Migrated from mock filter to Prisma database query with case-insensitive search and resolved TypeScript compile error. |
| 2026-09-17 | Antigravity | `components/layout/Sidebar.tsx` | Migrated top-read articles from static mock data to Prisma database query. |
| 2026-09-17 | Antigravity | `components/editorial/ArticleEditor.tsx` | Added automated slug generation, author role input, featured toggle, preview action, fixed useEffect dependency loop, and added support for Prisma `contentHtml`. |
| 2026-09-17 | Antigravity | `components/editorial/DeleteArticleButton.tsx` | Created reusable deletion button with user confirmation and toast feedback. |
| 2026-09-17 | Antigravity | `app/admin/drafts/page.tsx` | Wired up delete action via `DeleteArticleButton` and added preview story links. |
| 2026-09-17 | Antigravity | `app/admin/articles/page.tsx` | Added delete action via `DeleteArticleButton` and opened story links in new tab. |
| 2026-09-17 | Antigravity | `lib/auth-constants.ts` | Created shared session hashing and validation utilities for Edge runtime and server actions. |
| 2026-09-17 | Antigravity | `app/actions/auth.ts` | Implemented `loginAdminAction` and `logoutAdminAction` server actions with HTTP-only cookies. |
| 2026-09-17 | Antigravity | `middleware.ts` | Created Next.js route protection middleware guarding `/admin/*` routes. |
| 2026-09-17 | Antigravity | `app/admin/login/page.tsx` | Built editorial console login page with Suspense wrapper and error feedback. |
| 2026-09-17 | Antigravity | `components/article/ArticleBody.tsx` | Added sanitization filter to strip embedded script tags. |
| 2026-09-17 | Antigravity | `middleware.ts`, `app/admin/login`, `app/actions/auth.ts`, `lib/auth-constants.ts` | Removed admin authentication and middleware per user instruction (keeping admin panel directly accessible). |
| 2026-09-17 | Antigravity | `components/layout/ThemeProvider.tsx` | Suppressed React 19 development console.error for next-themes SSR inline script tag to eliminate dev overlay errors while preserving full theme toggle functionality. |
| 2026-09-17 | Antigravity | `components/editorial/ArticleEditor.tsx` | Overhauled editor save flow with direct `handleSave` for drafts and publishing, auto-saved drafts prior to preview to eliminate 404s, and updated test-data populator. |
| 2026-09-17 | Antigravity | `app/(public)/article/[slug]/page.tsx` | Added story preview mode banner for unpublished drafts and enabled dynamic rendering. |
| 2026-09-17 | Antigravity | `app/(public)/page.tsx`, `latest`, `category`, `search` | Added `export const dynamic = "force-dynamic"` to ensure newly published articles appear immediately across all feeds without stale cache. |
| 2026-09-17 | Antigravity | Entire codebase (`app/`, `components/`, `lib/`, `package.json`) | Executed comprehensive brand migration from "GridX" to "xSypher" (masthead, logos, metadata, local storage migration keys, mock data, and editorial console). |

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# xSypher - AI Agent Instructions

Welcome to the **xSypher** codebase. You are an autonomous AI coding assistant pair-programming with the lead developer. This document outlines the critical project constraints, architectural guidelines, and styling preferences that you **must strictly adhere to** when generating, modifying, or auditing code in this repository.

## 1. Tech Stack & Environment
- **Framework:** Next.js (App Router)
- **Deployment Target:** Cloudflare Pages (Edge Workers)
- **Database:** Supabase (PostgreSQL)
- **ORM:** Drizzle ORM (Specifically configured for Edge compatibility)
- **Authentication:** NextAuth (v5 / Auth.js) with `@auth/drizzle-adapter`
- **Styling:** Tailwind CSS + Vanilla CSS Variables (Dark mode, modern glassmorphism, dynamic animations)
- **Language:** TypeScript (Strict mode)

## 2. Architectural Constraints (CRITICAL)

### A. Cloudflare Edge Compatibility
This application is strictly built for **Cloudflare Edge**. 
- **NO Node.js Built-ins:** Do not use `fs`, `path`, `child_process`, `crypto` (use Web Crypto API instead), or any other Node-specific APIs in API routes or Server Actions.
- **NO Rust Binaries:** Prisma has been completely removed in favor of Drizzle ORM. Do not reintroduce Prisma dependencies or syntax.
- Ensure all packages and database drivers used are Edge-compatible (e.g., using HTTP/WebSocket drivers for Postgres).

### B. Drizzle ORM Guidelines
We have fully migrated from Prisma to Drizzle ORM. When writing database queries:
- **Relational Queries:** Prefer Drizzle's relational query API (`db.query.[table].findMany({ with: { ... } })`) for fetching nested relations.
- **Single Records:** Drizzle's `.findFirst` is supported in the query API, but when destructing arrays, use `limit: 1` (`const [record] = await db.query.table.findMany({ limit: 1 })`).
- **Mutations:** Use explicit `db.insert()`, `db.update()`, and `db.delete()` syntax. Use `.returning()` when the mutated record is needed.
- **Aggregations:** Use explicit SQL for aggregations: `db.select({ count: sql\`count(*)\`.mapWith(Number) }).from(...)`.
- **Transactions:** Use `db.transaction(async (tx) => { ... })`. Do not use Prisma's `$transaction`.
- **Null Checks (CRITICAL):** Never use `eq(table.field, null)` or `eq(table.field, null as any)`. This generates invalid `field = NULL` SQL which silently fails. Always import and use the explicit `isNull(table.field)` or `isNotNull(table.field)` operators from `drizzle-orm` to generate correct `IS NULL` clauses.

### C. Authorization & Capabilities (The Capability Layer)
Do NOT manually compare role strings (e.g., `if (user.role === 'ADMIN')`) when evaluating permissions. 
- **Capabilities:** Always use the `authorize(role, capability)` function from `@/lib/capabilities`.
- **Scoping:** When querying articles for the admin dashboard, you **must** use `buildArticleScope(actor)` to generate the correct Drizzle `where` clause fragment based on the user's role.

### D. Current Migration Phase Constraints
- **1:1 Functional Migration:** We are currently stabilizing the Drizzle/Edge migration. Do not implement new features like Gemini AI integrations, multi-language translation, or Cloudflare R2 JSON generation unless explicitly instructed.
- **Metadata:** Comments, Authors, and Metadata stay in Supabase PostgreSQL.

### E. Local Development & Build Workflow
- **`app/global-error.tsx` Workaround:** This file has a known bug where `@cloudflare/next-on-pages` ignores its `runtime = 'edge'` export. The file MUST exist (with `runtime = 'edge'`), but its compiled `.func` directory must be removed between `vercel build` and `next-on-pages --skip-build`. The `pages:build` npm script handles this automatically — never delete or recreate this file.
- **Dynamic Routes:** Any route using `export const dynamic = 'force-dynamic'` or runtime data fetching (e.g., `sitemap.ts`, `feed.xml/route.ts`) MUST also export `export const runtime = 'edge'` alongside it, or `@cloudflare/next-on-pages` will reject the build.
- **Server Actions on Edge:** Never call Server Actions with FormData from client components on dynamic routes. Use dedicated `/api/*` routes with `fetch()` instead. Server Actions with multipart payloads fail silently on the Edge runtime.
- **Wrangler Dev Command:** When testing locally, always instruct the user to run `npm run dev:edge` instead of chaining manual build and wrangler commands (`npm run build && npx @cloudflare/next-on-pages && npx wrangler ...` will fail). This script guarantees the Edge worker `_worker.js` is compiled correctly before starting the server. If Wrangler logs `No Functions. Shimming...`, the build failed and dynamic routes will 404.
- **Port Conflicts:** If wrangler fails with `Address already in use (os error 98)`, kill stale workerd processes with `pkill -9 -f workerd` before retrying.

## 3. Code Quality & TypeScript
- **No Regex Replacements:** Never use Python scripts or blind Regex to refactor code. Use native AST transformations or manually edit code safely to prevent broken syntax and dangling imports.
- **Strict Typing:** Resolve all TypeScript errors properly. Do not use implicit `any`. Define proper interfaces for Drizzle query results when passing them to components.
- **Clean Imports:** Ensure all Drizzle operators (`eq`, `and`, `or`, `inArray`, `sql`) and schema tables are correctly imported before executing queries.

## 4. UI / UX & Aesthetics
xSypher is a premium editorial newsroom CMS and publication.
- **Vibrant & Dynamic:** The UI must feel state-of-the-art. Utilize curated color palettes via CSS variables (`var(--ink)`, `var(--surface)`, `var(--accent)`).
- **Micro-interactions:** Add subtle hover effects, active states, and transitions to buttons, cards, and navigation items.
- **Tailwind:** Utilize Tailwind CSS for rapid layout construction, but respect the existing CSS variable design system. Do not use generic, unstyled components.

## 5. Workflow Execution
1. **Analyze First:** Read the entire file to understand the current logic (especially Prisma logic) before making any modifications.
2. **Execute Safely:** Make surgical, precise edits. Do not blindly overwrite entire files if only a few lines need changing.
3. **Verify:** Check for TypeScript errors after making changes (e.g., suggesting `npx tsc --noEmit`).

By following these rules, you ensure xSypher remains highly performant, globally distributed on Cloudflare, and maintainable.

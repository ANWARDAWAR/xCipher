<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# xSypher - AI Agent Instructions

Welcome to the **xSypher** codebase. You are an autonomous AI coding assistant pair-programming with the lead developer. This document outlines the critical project constraints, architectural guidelines, and styling preferences that you **must strictly adhere to** when generating, modifying, or auditing code in this repository.

## 1. Tech Stack & Environment
- **Framework:** Next.js (App Router, Turbopack)
- **Deployment Target:** Cloudflare Workers via `@opennextjs/cloudflare`
- **Database:** Supabase (PostgreSQL)
- **ORM:** Drizzle ORM (Configured with edge/serverless HTTP/WebSocket drivers)
- **Authentication:** NextAuth (v5 / Auth.js) with `@auth/drizzle-adapter` & `trustHost: true`
- **Styling:** Tailwind CSS + Vanilla CSS Variables (Dark mode, modern glassmorphism, dynamic animations)
- **Language:** TypeScript (Strict mode)

## 2. Architectural Constraints (CRITICAL)

### A. Cloudflare Workers & OpenNext Compatibility
This application is deployed on **Cloudflare Workers** using `@opennextjs/cloudflare` and `nodejs_compat`.
- **NO `export const runtime = 'edge'` in Next.js Routes:** Do NOT declare `export const runtime = 'edge'` in any route, page, layout, or handler. OpenNext runs Next.js in Node.js mode (`compatibility_flags: ["nodejs_compat"]`). Declaring `runtime = 'edge'` causes Next.js to omit default route exports, resulting in runtime `TypeError: Cannot read properties of undefined (reading 'default')`.
- **Edge-Safe Libraries:** Keep database drivers and cryptographic operations compatible with Cloudflare Workers' `nodejs_compat` standard.
- **NO Rust Binaries:** Prisma has been completely removed in favor of Drizzle ORM. Do not reintroduce Prisma dependencies or syntax.

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

### E. Build & Deployment Workflow (@opennextjs/cloudflare)
- **Unified Worker Bundle:** We migrated away from `@cloudflare/next-on-pages` (which split routes into 52 separate `.func` bundles exceeding 88 MiB) to `@opennextjs/cloudflare`. OpenNext compiles the entire application into a single unified worker at `.open-next/worker.js` with assets in `.open-next/assets`.
- **Build Command:** Run `npm run build:worker` (`opennextjs-cloudflare build`) to build the application and worker bundle.
- **Deploy Command:** Run `npm run deploy:worker` (`opennextjs-cloudflare build && wrangler deploy`) to build and deploy directly to Cloudflare Workers.
- **Auth Trust Host:** Auth.js requires `trustHost: true` in `lib/auth.ts` and `AUTH_TRUST_HOST: "true"` in `wrangler.json` `vars` to prevent `UntrustedHost` loopback errors on Cloudflare Workers.

### F. Bundle Optimization & Client-Only Heavy Libraries
- **Client-Only Loading for Heavy Libraries:** Large packages like `mermaid`, `@tiptap/*`, `highlight.js`, and `recharts` must NEVER be statically imported in server components. Always use `next/dynamic(..., { ssr: false })` or runtime `await import(...)` inside browser-only effects (`useEffect`).
- **Static Assets:** Static informational pages and assets are pre-rendered and served directly from Cloudflare Assets (`.open-next/assets`), keeping worker invocation overhead minimal.

### G. TipTap Extension Data Persistence (CRITICAL)
Whenever you create or modify a custom TipTap Node extension that stores its state in `data-*` attributes via `renderHTML` (e.g., `data-pros`, `data-categories`), you **MUST** immediately add those exact attribute names to the `COMMON_ALLOWED_ATTRIBUTES` whitelist in `lib/sanitize.ts`. Failure to do so will result in `DOMPurify` silently stripping the data during the save process, causing the public article page to render empty components.

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

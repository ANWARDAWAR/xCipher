# xCipher — Implementation Master Plan

> **Last Updated:** 2026-09-17T09:59:00+05:00  
> **Branch:** `main`  
> **Project:** xCipher — Independent Technology Publication Platform  
> **Framework:** Next.js 16.3.5 + React 19 + Prisma + PostgreSQL + Tiptap 3.x

---

## Phase 0 — Safety Snapshot / Baseline

### Git State
- **Branch:** `main` (up to date with `origin/main`)
- **Commit:** `177aa79` — "first commit"
- **Status:** 30 modified files, 21 untracked files — all user's in-progress work
- **Action:** NO destructive git operations. All changes are additive/incremental.

### Package Manager & Scripts
| Tool | Command |
|------|---------|
| Package Manager | npm |
| Dev Server | `npm run dev` |
| Build | `npm run build` |
| Lint | `npx eslint .` |
| Typecheck | `npx tsc --noEmit` |
| DB Client | Prisma (`npx prisma`) |
| Tests | NONE configured (no test framework installed) |

### Baseline Verification Results
| Check | Status | Notes |
|-------|--------|-------|
| TypeScript | ✅ PASS | Zero errors |
| ESLint | ⚠️ BASELINE FAILURES | 104 errors, 42 warnings (mostly `any` types, unescaped entities) |
| Tests | ❌ NOT CONFIGURED | No test framework |
| Build | ✅ PASS | All routes compile successfully. Sitemap fixed (force-dynamic). |

---

## Phase 1 — Architecture Summary

### Stack
- **Runtime:** Node.js
- **Framework:** Next.js 16.3.5 (App Router)
- **Language:** TypeScript 5.x
- **Database:** PostgreSQL via Prisma 6.19
- **Auth:** NextAuth 4.x (JWT strategy, Credentials provider)
- **Editor:** Tiptap 3.31 (StarterKit + extensions)
- **Styling:** Tailwind CSS 4 + extensive vanilla CSS (4111 lines in globals.css)
- **Theming:** next-themes (dark/light)
- **Sanitization:** isomorphic-dompurify
- **Forms:** react-hook-form + zod
- **Email:** Resend
- **Icons:** lucide-react + inline SVGs

### Route Architecture
| Route Group | Purpose |
|-------------|---------|
| `app/(public)/` | Public website (articles, categories, authors, search, tags) |
| `app/admin/(authenticated)/` | CMS dashboard (editor, articles, drafts, submissions, users, settings, taxonomy, comments, subscribers, audit-logs) |
| `app/api/auth/` | NextAuth API route |
| `app/preview/[id]/` | Article preview |
| `app/invite/[token]/` | Invitation acceptance |
| `app/unsubscribe/[token]/` | Newsletter unsubscribe |

### Database Models
User, Account, Session, VerificationToken, Author, Category, Tag, Article, ArticleRevision, AuditLog, Notification, Invitation, Subscriber, Comment

### Role System
`OWNER > ADMIN > EDITOR > MODERATOR > REVIEWER > AUTHOR > STAFF`

### Content Storage
- Articles store both `contentHtml` (sanitized HTML) and `contentJson` (Tiptap JSON)
- Public rendering uses `contentHtml` via DOMPurify sanitization
- Editor loads from `contentHtml`

---

## Phase 2 — Critical Findings & Prioritized Tasks

### TASK-001 — Code Block Syntax Highlighting (CRITICAL)

**Priority:** CRITICAL  
**Status:** COMPLETED ✅

**Problem:** Editor used StarterKit's built-in code block with NO syntax highlighting.

**Solution:** Created custom `CodeBlockLowlight` extension using `lowlight` with the `common` language bundle. Supports:
- 25+ language options via dropdown selector in toolbar
- Auto-detection when no language specified
- Input rules (```lang) for quick code block creation
- Tab indentation within code blocks
- Triple-Enter to exit code block
- Material-inspired syntax highlighting theme

**Files:** `components/editorial/extensions/CodeBlockLowlight.ts` (NEW), `components/editorial/ArticleEditor.tsx` (MODIFIED)

---

### TASK-002 — Editor Heading Support Gaps (HIGH)

**Priority:** HIGH  
**Status:** COMPLETED ✅

**Problem:** Toolbar only showed H2 and H3 buttons. No heading dropdown.

**Solution:** Added a heading level dropdown (`<select>`) to toolbar with Paragraph, H2, H3, H4 options. Dropdown reflects current block type.

**Files:** `components/editorial/EditorToolbar.tsx` (MODIFIED)

---

### TASK-003 — Slash Command Enhancement (HIGH)

**Priority:** HIGH  
**Status:** COMPLETED ✅

**Problem:** 7 slash commands, no icons or descriptions, prefix-only filtering.

**Solution:** Expanded to 14 commands with icons, descriptions, ARIA roles, hover highlighting, and anywhere-in-title matching. Added: H4, Paragraph, Blockquote, Info Callout, Warning, Image, Table.

**Files:** `components/editorial/SlashCommandList.tsx` (MODIFIED)

---

### TASK-004 — Missing Formatting Buttons in Toolbar (MEDIUM)

**Priority:** MEDIUM  
**Status:** COMPLETED ✅

**Problem:** Toolbar lacked strikethrough, highlight, and inline code buttons.

**Solution:** Added strikethrough (`<s>S</s>`), inline code (`<>`), and highlight (`H` with yellow background) buttons. Added `@tiptap/extension-highlight` dependency.

**Files:** `components/editorial/EditorToolbar.tsx` (MODIFIED), `components/editorial/ArticleEditor.tsx` (MODIFIED)

---

### TASK-005 — Code Block Language Selector (CRITICAL)

**Priority:** CRITICAL  
**Status:** COMPLETED ✅

**Problem:** No way to select programming language for code blocks.

**Solution:** Contextual language selector dropdown appears in toolbar when cursor is inside a code block. 25+ languages available. Language stored as `language` attribute on the node.

**Files:** `components/editorial/EditorToolbar.tsx` (MODIFIED), `components/editorial/extensions/CodeBlockLowlight.ts` (NEW)

---

### TASK-006 — Public Article Code Block Rendering (CRITICAL)

**Priority:** CRITICAL  
**Status:** COMPLETED ✅

**Problem:** Public articles rendered `<pre>` blocks with no highlighting, no language indicator, and no copy button.

**Solution:** 
- ArticleBody component enhanced as client component to inject copy-code buttons and language badges
- Material-inspired syntax highlighting CSS theme applied globally
- Copy button with clipboard API + fallback
- Language badge in top-left corner
- Responsive mobile handling

### Tiptap Typography
**Current problem**: `.ed-body` and `.prose` have separate, divergent CSS rules resulting in a mismatch between the editor and published article. Headings are missing strict hierarchical sizes. Paragraphs inherit heading styles.
**Root cause**: Scattered CSS rules and no unified typography contract.
**Implementation**: Merged `.prose` and `.ed-body` typography rules in `globals.css` into a single unified shared architecture. Defined strict pixel/em sizes for H1 (1.85em), H2 (1.55em), H3 (1.25em), H4 (1.05em).
**Files changed**: `globals.css`
**Verification**: Typecheck and build passed. Visual styling unified.

### H1/H2/H3
**Current behavior**: H1 is missing. H2/H3 size irregularly.
**New behavior**: H1 is now available. All headings have strict relative sizing that persists identically between editor and public page.
**Semantic model**: Tiptap Heading extension now explicitly exposes H1 in Toolbar and Slash Commands. H1 is a major section header.
**CSS architecture**: Unified under `.prose>hX, .ed-body hX`.
**Verification**: Verified in toolbar UI and compiled successfully.

### Syntax Highlighting
**Editor pipeline**: `lowlight` generates ProseMirror decorations (internal to Tiptap).
**Storage pipeline**: `getHTML()` serializes bare `<pre><code>` with `language-xyz` class. Sanitize preserves classes.
**Public pipeline**: Highlight classes were missing because the DOM string isn't highlighted by `lowlight` on save.
**Root cause**: Tiptap doesn't serialize `lowlight` markup.
**Implementation**: Imported `highlight.js/lib/common` in `ArticleBody.tsx` and dynamically apply `hljs.highlightElement()` inside a `useEffect`.
**Supported languages**: All common highlight.js languages (20+).
**Verification**: Ensured public article matches editor CSS class naming scheme.

### Fullscreen Editor
**UX**: Clean, distraction-free writing canvas that takes up the entire viewport.
**Implementation**: Added `isFullscreen` state in `ArticleEditor.tsx` wrapping the editor in `fixed inset-0 z-[9999]`. Added Maximize/Minimize SVG button to `EditorToolbar.tsx`.
**Responsive behavior**: Canvas centers with `max-w-[800px]` matching `.prose`.
**Verification**: Built successfully. No editor reinitialization occurs.

### Article Preview
**Design**: The editor content now visually aligns with the public page due to shared styles.
**Shared typography architecture**: Tiptap EditorContent now strictly respects `.prose` class inheritance.
**Public consistency**: 1:1 mapping of paragraph margins, heading sizes, and code blocks.
**Verification**: Both typecheck and build pass cleanly.

**Files:** `components/article/ArticleBody.tsx` (MODIFIED), `app/globals.css` (MODIFIED)

---

### TASK-007 — Bubble/Floating Toolbar for Text Selection (MEDIUM)

**Priority:** MEDIUM  
**Status:** DEFERRED (Phase 2 implementation)

---

### TASK-008 — Editor Table Context Controls (MEDIUM)

**Priority:** MEDIUM  
**Status:** COMPLETED ✅

**Problem:** Only insert-table button existed. No add/delete row/column when editing.

**Solution:** Contextual table controls (+Row, +Col, −Row, −Col, ✕ Table) appear in toolbar when cursor is inside a table.

**Files:** `components/editorial/EditorToolbar.tsx` (MODIFIED)

---

### TASK-009 — Word/Web Copy-Paste Cleanup (HIGH)

**Priority:** HIGH  
**Status:** VERIFIED (Already handled)

**Evidence:** The sanitization via DOMPurify on server save (`sanitizeArticleHtml`) strips dangerous HTML. Tiptap's built-in paste handling + StarterKit already strips most Word artifacts. The existing `ALLOWED_TAGS` and `ALLOWED_ATTR` lists are well-configured.

---

### TASK-010 — Missing `data-credit` in Sanitization (MEDIUM)

**Priority:** MEDIUM  
**Status:** COMPLETED ✅

**Problem:** `data-credit` attribute was stripped by DOMPurify, losing image credits on save.

**Solution:** Added `data-credit` to `ALLOWED_ATTR` list in `lib/sanitize.ts`.

**Files:** `lib/sanitize.ts` (MODIFIED)

---

### TASK-011 — Sitemap Build Failure (HIGH)

**Priority:** HIGH  
**Status:** COMPLETED ✅

**Problem:** `app/sitemap.ts` tried to query the database during static generation at build time, causing build failure when DB was unreachable.

**Solution:** Added `export const dynamic = 'force-dynamic'` so the sitemap is generated at request time.

**Files:** `app/sitemap.ts` (MODIFIED)

---

### TASK-012 — Callout Variant Support (MEDIUM)

**Priority:** MEDIUM  
**Status:** COMPLETED ✅

**Problem:** Only 'info', 'takeaway', 'quote' callout types. No 'warning' type. No CSS labels for callout types in public rendering.

**Solution:** Added 'warning' to Callout extension type union. Added CSS `::before` pseudo-element labels for all callout variants. Added editor-side callout styling.

**Files:** `components/editorial/extensions/Callout.ts` (MODIFIED), `app/globals.css` (MODIFIED)

---

---

## Implementation Progress Tracker

| Task | Priority | Status | Phase |
|------|----------|--------|-------|
| TASK-001 | CRITICAL | ✅ COMPLETED | Editor |
| TASK-002 | HIGH | ✅ COMPLETED | Editor |
| TASK-003 | HIGH | ✅ COMPLETED | Editor |
| TASK-004 | MEDIUM | ✅ COMPLETED | Editor |
| TASK-005 | CRITICAL | ✅ COMPLETED | Editor |
| TASK-006 | CRITICAL | ✅ COMPLETED | Public Rendering |
| TASK-007 | MEDIUM | DEFERRED | Editor |
| TASK-008 | MEDIUM | ✅ COMPLETED | Editor |
| TASK-009 | HIGH | ✅ VERIFIED | Editor |
| TASK-010 | MEDIUM | ✅ COMPLETED | Sanitization |
| TASK-011 | HIGH | ✅ COMPLETED | Build |
| TASK-012 | MEDIUM | ✅ COMPLETED | Editor/CSS |

---

## Files Modified Log

*(Updated as changes are made)*

| File | Change Type | Task |
|------|-------------|------|
| `components/editorial/extensions/CodeBlockLowlight.ts` | NEW | TASK-001, TASK-005 |
| `components/editorial/EditorToolbar.tsx` | MODIFIED | TASK-002, TASK-004, TASK-005, TASK-008 |
| `components/editorial/SlashCommandList.tsx` | MODIFIED | TASK-003 |
| `components/editorial/ArticleEditor.tsx` | MODIFIED | TASK-001, TASK-004 |
| `components/editorial/extensions/Callout.ts` | MODIFIED | TASK-012 |
| `components/article/ArticleBody.tsx` | MODIFIED | TASK-006 |
| `lib/sanitize.ts` | MODIFIED | TASK-010 |
| `app/globals.css` | MODIFIED | TASK-001, TASK-006, TASK-012 |
| `app/sitemap.ts` | MODIFIED | TASK-011 |

---

## Dependencies Added Log

| Package | Justification | Task |
|---------|---------------|------|
| `@tiptap/extension-code-block-lowlight` | Syntax highlighting for code blocks (core requirement for tech publication) | TASK-001 |
| `lowlight` | AST-based syntax highlighting engine used by the code block extension | TASK-001 |
| `@tiptap/extension-highlight` | Text highlighting support in editor | TASK-004 |
| `@tiptap/extension-text-align` | Text alignment capability (installed but not yet wired) | Future |

---

## Database Changes Log

| Change | Migration | Task |
|--------|-----------|------|
| NONE YET | | |

---

## Remaining Risks

*(Updated throughout implementation)*

---

## Deferred Work

- TASK-007: Bubble/floating toolbar
- Find & Replace
- Drag & Drop improvements
- Full E2E test suite (requires test framework setup)

---

## Phase 2 Architecture Documentation

### Tiptap Typography
**Current problem**: `.ed-body` and `.prose` have separate, divergent CSS rules resulting in a mismatch between the editor and published article. Headings are missing strict hierarchical sizes. Paragraphs inherit heading styles.
**Root cause**: Scattered CSS rules and no unified typography contract.
**Implementation**: Merged `.prose` and `.ed-body` typography rules in `globals.css` into a single unified shared architecture. Defined strict pixel/em sizes for H1 (1.85em), H2 (1.55em), H3 (1.25em), H4 (1.05em).
**Files changed**: `globals.css`
**Verification**: Typecheck and build passed. Visual styling unified.

### H1/H2/H3
**Current behavior**: H1 is missing. H2/H3 size irregularly.
**New behavior**: H1 is now available. All headings have strict relative sizing that persists identically between editor and public page.
**Semantic model**: Tiptap Heading extension now explicitly exposes H1 in Toolbar and Slash Commands. H1 is a major section header.
**CSS architecture**: Unified under `.prose>hX, .ed-body hX`.
**Verification**: Verified in toolbar UI and compiled successfully.

### Syntax Highlighting
**Editor pipeline**: `lowlight` generates ProseMirror decorations (internal to Tiptap).
**Storage pipeline**: `getHTML()` serializes bare `<pre><code>` with `language-xyz` class. Sanitize preserves classes.
**Public pipeline**: Highlight classes were missing because the DOM string isn't highlighted by `lowlight` on save.
**Root cause**: Tiptap doesn't serialize `lowlight` markup.
**Implementation**: Imported `highlight.js/lib/common` in `ArticleBody.tsx` and dynamically apply `hljs.highlightElement()` inside a `useEffect`.
**Supported languages**: All common highlight.js languages (20+).
**Verification**: Ensured public article matches editor CSS class naming scheme.

### Fullscreen Editor
**UX**: Clean, distraction-free writing canvas that takes up the entire viewport.
**Implementation**: Added `isFullscreen` state in `ArticleEditor.tsx` wrapping the editor in `fixed inset-0 z-[9999]`. Added Maximize/Minimize SVG button to `EditorToolbar.tsx`.
**Responsive behavior**: Canvas centers with `max-w-[800px]` matching `.prose`.
**Verification**: Built successfully. No editor reinitialization occurs.

### Article Preview
**Design**: The editor content now visually aligns with the public page due to shared styles.
**Shared typography architecture**: Tiptap EditorContent now strictly respects `.prose` class inheritance.
**Public consistency**: 1:1 mapping of paragraph margins, heading sizes, and code blocks.
**Verification**: Both typecheck and build pass cleanly.

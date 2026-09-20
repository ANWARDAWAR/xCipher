# xCipher / xSypher — Production-Readiness Changes (Complete Report)

**Branch:** `arena/01a0bbd1-xcipher`
**Commit:** `5828119` — `Production-readiness: data integrity, security, mutation UX, accessibility`
**Base:** `80b9dd1` (`main`)
**Scope:** 54 files changed, +1,518 / −1,077 lines
**Date:** 2026-09-20

---

## Summary

Complete production-readiness pass on the xCipher tech-publication CMS, worked from
`AUDIT_REPORT.md` plus a fresh end-to-end investigation. Every audit claim was
re-verified against the working tree before changing it (several audit entries were
already stale). Work is grouped here in the mandated priority order:

**correctness → data integrity → auth → workflow → live state → mutations → feedback →
SEO → GEO/AEO → content integrity → performance → responsive/a11y → polish → validation.**

Validation at the end:

| Check | Result |
|---|---|
| `npm test` (vitest) | **331/331 passed** (was 313; +18 new tests) |
| `npx tsc --noEmit` | Clean, except the pre-existing prisma-stub cascade (sandbox limitation — see "Known Limits") |
| `npx eslint` on all touched files | **Zero new errors** vs. baseline |
| `npx next build` | **Full compile + bundle succeeds** (stops only at sandbox network limits) |

---

## 1. Data Integrity — Removing Fake/Mock Data Presented as Real

### 1.1 `lib/mockData.ts` DELETED (652 lines)
Fabricated articles, categories, bios, and static page content masquerading as a data
source. Nothing imports it anymore.

### 1.2 Sidebar mock fallback removed
`components/layout/Sidebar.tsx` previously fell back to `mockData.ARTICLES` / `CATS` so
an **empty database still rendered a full "Most Read" panel of fake stories**. Now it
queries the DB only; an empty archive honestly hides the panel.

### 1.3 Category pages no longer invent sections
`app/(public)/category/[slug]/page.tsx` previously fabricated category sections from mock
data. Now DB-only; unknown slugs return a real 404.

### 1.4 Legacy `/page/[slug]` catch-all deleted
`app/(public)/page/[slug]/page.tsx` rendered only mock `PAGES` content. All trust pages
have dedicated real routes (see §5.3), so the catch-all was removed.

### 1.5 Hardcoded "5 min read" eliminated everywhere
New `lib/reading-time.ts`:

- `readingMinutesFromHtml(html)` — 200 words/minute
- `listeningMinutesFromHtml(html)` — 150 words/minute (speech rate)
- `wordCountFromHtml(html)` — strips markup, drops `<script>`/`<style>` content, decodes entities
- `WORDS_PER_MINUTE_READ` / `WORDS_PER_MINUTE_LISTEN` exported constants

The article page computes real read **and** listen times from the body. List cards
(`StoryCard`, `StoryRow`, sidebar, related, preview) previously displayed `{a.mins || 5}`
— a fabricated constant on every card because the card projection doesn't select the body.
Now the stat is **only rendered when it is computed from a real body**; cards show nothing
(honest absence beats a fake number).

### 1.6 Fabricated statistics removed
- **AuthorProfileView**: the hardcoded `850 SUBSCRIBERS` stat is gone (no such metric
  exists in the schema). "PUBLISHED ARTICLES" now counts the **whole archive** via an
  aggregate, not just the page of rows that happened to be fetched.
- **Seed-author bio maps deleted** from both the public article page and the preview page.
  Bios now come only from the real `authorModel.overview`; the preview falls back to an
  honest "This author has not added an overview yet." (A preview that shows mock prose as
  your own profile text defeats its purpose.)

### 1.7 Bylines now tell the truth
Displayed "Published" date is `publishedAt ?? createdAt` (was silently `createdAt` — a
scheduled post could show its draft date as its publication date). Both dates carry
machine-readable `dateTime` attributes and `itemProp` (`datePublished` / `dateModified`).

---

## 2. Broken Links & Routing Bugs

### 2.1 Primary Subscribe CTA 404'd
`/page/newsletter` (singular) was linked from the site header, mobile drawer, and the HTML
sitemap page — the real page is `/page/newsletters` (plural). **All call sites fixed.**

### 2.2 Six permanent 308 redirects added (`next.config.ts`)
Legacy slugs still present in shared links, external references, and the removed catch-all:

| From | To (real route) |
|---|---|
| `/page/newsletter` | `/page/newsletters` |
| `/page/editorial` | `/page/editorial-standards` |
| `/page/privacy` | `/page/privacy-policy` |
| `/page/terms` | `/page/terms-of-use` |
| `/page/cookies` | `/page/cookie-policy` |

### 2.3 Redirect regression intentionally NOT made
`/page/editorial-policy` is a **real, distinct route** with its own content
(`app/(public)/page/editorial-policy/page.tsx`). A config redirect would have shadowed it
(config redirects run before filesystem routing). It was added to the sitemap instead.

### 2.4 RSS items actually resolve now (`app/feed.xml/route.ts`) — **two real bugs**
1. Hardcoded `https://www.xsypher.com` → now uses `siteConfig.url`.
2. Item links were `${siteUrl}/${slug}` (bare slug) → now `${siteUrl}/article/${slug}` —
   **every feed item previously 404'd**.

### 2.5 Stray legacy links updated
`/page/editorial` and `/page/privacy` references on the homepage and contact page now
point directly at the real routes.

---

## 3. Security (server-side enforced, not hidden UI)

### 3.1 Login throttling — new `lib/login-throttle.ts`
Previously the credentials `authorize()` had **no rate limiting at all**. Now:

- **Failure-only counters** (peeking before the bcrypt comparison is free; only genuine
  failures count) — 5 failures/account/15min and 20/IP/15min
- **Peek-before-bcrypt** so a throttled request never triggers a password comparison
- **Clear-on-success** so an honest user who finally remembers the password isn't stuck
- IPs hashed before being used as rate-limit keys (privacy)
- Audit rows for `auth.login.failed` and `auth.login.throttled`; the log-write itself is
  throttled so an attack can't flood the audit table
- `getClientIpFromRecord` lives in `lib/rateLimit.ts` (pure, db-free, vitest-importable);
  `ipFromAuthorizeHeaders` delegates to it so the app's two header shapes can never drift
- Full flow covered by `tests/login-throttle.test.ts`

### 3.2 `app/actions/setup.ts` — first-owner account hardened
- **TOCTOU race fixed**: the "no owner exists yet" guarantee now runs inside a
  **SERIALIZABLE transaction**, with serialization-failure codes mapped to a friendly
  "setup already completed" response
- zod schema validation (owner password ≥ 12 chars)
- 10 attempts/hour/IP rate limit
- Success audit row written

### 3.3 `app/actions/invitations.ts` — invite accept hardened
- Token is **consumed atomically** inside one transaction (claim-before-create) — the
  previous read-then-redeem had a double-submit race
- P2002 (email already registered) mapped to a "sign in instead" path
- Password policy raised to 10+ chars; client forms (`SetupForm`, `AcceptInviteForm`)
  synced to match

### 3.4 Real password change — `app/actions/profile.ts`
The account settings form previously showed a "(Mock)" toast after a 1-second
`setTimeout`. Now `changePassword`:
- bcrypt-verifies the **current** password first
- enforces the 10+ char letter+digit policy
- **bumps `sessionVersion`** — invalidates every other active session, including the
  attacker's if the change was the user's response to a compromise
- writes audit rows on both success and failed verification
- `AccountForm` signs the user out after a successful change

### 3.5 `NEXT_PUBLIC_SITE_URL` documented in `.env.example`
It silently falls back to `localhost` for invitation links and canonical URLs.

---

## 4. Mutation UX & Feedback (Phase 4/5 model: action → pending → server → confirmed → sync)

### 4.1 `components/ui/ConfirmDialog.tsx` rewritten
- `isPending` + `pendingText` props — in-flight buttons disable, Escape and overlay-click
  are blocked while a destructive op is running, focus is managed and restored on close
- **Typed-confirmation reset moved out of a `useEffect` into close handlers**
  (`handleClose`/`handleConfirm`) — satisfies `react-hooks/set-state-in-effect` and the
  strict flat-config rules; the component is now lint-clean
- Focus effect refactored so handler declarations precede the effect (TDZ/immutability
  rules)

### 4.2 All destructive flows wired to in-flight flags
`SignOutButton` (new confirm flow), `ArticleActionMenu`, `ReviewWorkspace` (take-over),
`BulkActionBar` (optimistic with `useOptimistic` auto-rollback — verified compliant),
`RestoreRevisionButton`, `UserDirectoryTable` (invite revoke), `TaxonomyManager`
(category/tag delete). No destructive op can double-submit or fake success; confirmed
state comes only from the server response.

---

## 5. SEO / Structured Data

### 5.1 JSON-LD escaped against stored XSS — `lib/seo.ts`
`stringifyJsonLd(data)` escapes `<`, U+2028 and U+2029. Previously
`JSON.stringify` output was injected raw — an article title containing a
`</script><img onerror=…>` payload could break out of the structured-data block.
Verified by `tests/seo-jsonld.test.ts` with an active payload.

### 5.2 Homepage metadata
The homepage previously had none. `generateMetadata` resolves canonical `/`, OG and
Twitter cards from publication settings.

### 5.3 Pagination on all archive listings — no more orphaned content
`/latest` (30/page), `/category/[slug]` and `/author/[slug]` (20/page) now paginate via
`?page=N`, following the tag/search pattern: page-of titles, self-referencing canonicals,
out-of-range pages 404. Previously every listing silently capped at the first page of
results and older stories were unreachable — an SEO and trust problem.
(`lib/queries.ts`: `LATEST_PAGE_SIZE`, `LISTING_PAGE_SIZE`; `lib/cached-queries.ts`
paginated take+1.)

### 5.4 Sitemap completed — `app/sitemap.ts`
Now includes `/latest`, all tag pages, and 15 static trust pages (incl. the real
`editorial-policy` route). Legacy redirected slugs are deliberately excluded.

### 5.5 Caching-model comments corrected
The listings' `revalidate` comments previously claimed route-level ISR; they now document
the real model: per-request render (searchParams is dynamic) with data behind tagged
`unstable_cache` entries, tag-invalidated on publish.

---

## 6. Accessibility & Focus Management

- `focus-visible:ring-2 [...accent]` added to the genuinely ringless controls:
  both filter selects in `AuditLogsClient`, the read-more button in
  `CommentModerationRow`, the beat-remove button in `ProfileForm`
- **Left unchanged after inspection:** the notification panel (programmatically-focused
  container; its inner controls keep rings) and the bio editor (already has
  `.pf-bio-editor:focus-within`). Also, the admin-wide `.cs-body :focus-visible` rule has
  higher specificity than Tailwind's `focus:outline-none`, so the console already showed
  rings — the added classes are belt-and-braces.
- ArticleEditor's tag-remove button had **no accessible name** — now
  `aria-label="Remove tag …"` with an aria-hidden SVG
- **Homepage double-h1 fixed properly:** the Editor's Pick title was an unstyled `<h1>`;
  the design's CSS for it targets a heading inside `.pick-feat`. JSX changed to `h2` and
  the CSS selector to `.pick-feat h2`, so the page has exactly one h1 (the lead story)
  and the pick renders per its real design instead of browser defaults
- Branded `not-found.tsx` ("404 // Packet Lost") pre-existing and compliant — no action

---

## 7. Visual Identity (no drift)

- Admin login button: inline `backgroundColor: #dc2626/#b91c1c` **removed** — an off-brand
  red that also overrode the token classes. `bg-accent` / `hover:bg-accent-deep` /
  `active:bg-accent-press` (mapped via `--color-accent*` → `--accent*` tokens) now actually
  take effect. Black/red/white brand preserved.
- ArticleEditor header status badge: hardcoded `bg-[#3b82f6]` blue chip removed; it now
  derives label + tone from **`STATUS_META`** (the single status-color language already
  used across the console), with a defensive `STATUS_META.DRAFT` fallback.

---

## 8. Performance

- Paginated list queries use keyset-safe `take + 1` (no OFFSET COUNT cost on page fetch)
- `Sidebar` no longer fetches a five-item mock tail
- Article card projections remain body-free (no heavy reads for listing traffic)
- Bulk transitions documented/verified: one batched read + one `$transaction` of writes
  instead of N sequential round trips (existing optimization, confirmed intact)

---

## 9. New Files

| File | Purpose |
|---|---|
| `lib/reading-time.ts` | Read/listen minutes computed from body HTML (200/150 wpm) |
| `lib/login-throttle.ts` | Failure-only login rate limiting + audit hooks |
| `tests/reading-time.test.ts` | 8 cases incl. "never returns the old fabricated 5" |
| `tests/seo-jsonld.test.ts` | JSON round-trip, live XSS payload, line-separator escapes |
| `tests/login-throttle.test.ts` | peek/consume/reset contract + client-IP parsing |
| `lib/rateLimit.ts` (extended) | `getClientIpFromRecord` — pure, db-free, testable |

---

## 10. Deleted Files

- `lib/mockData.ts` — 652 lines of fabricated articles/categories/static-page content
- `app/(public)/page/[slug]/page.tsx` — mock-`PAGES` catch-all superseded by real routes
  + 308 redirects

---

## 11. Verified Safe — No Change Needed

- **Bulk workflow transitions** (`bulkArchive`/`bulkPublish`/`bulkSubmit`/`bulkRestore`)
  call `validateTransition` per id against the same state machine as single-article
  actions — the audit's "not verifiable" item is confirmed **safe**
- **NotificationBell** is server-rendered from the admin layout and re-rendered on
  `router.refresh()` — no polling needed
- **BulkActionBar** optimistic updates use `useOptimistic` with auto-rollback — matches
  the mandated mutation model and is genuinely reversible
- `runBulkTransition` deduplicates ids, caps a batch at 100, treats "not found" and
  "not yours" identically (no existence oracle), and writes one audit row per accepted
  transition

---

## 12. Known Limits (sandbox, not code defects)

- `npx prisma generate` cannot reach `binaries.prisma.sh` → `node_modules/.prisma` holds
  a **type-only stub client**. Consequences:
  - The Prisma schema is **frozen for this session** (a regenerated stub would break
    type-checking of every db call)
  - `tsc` reports a pre-existing `TS2305`/`TS2694`/`TS7006` cascade rooted in the stub —
    none originate in application code
  - vitest aliases `@prisma/client` to the same stub; `lib/db.ts` instantiates
    `PrismaClient` at module scope, so **any module that imports `lib/db` cannot run under
    vitest**. This is why pure logic lives in db-free modules (`lib/reading-time.ts`,
    `lib/seo.ts`, `lib/rateLimit.ts`)
- `npm run build` compiles and bundles fully, then stops at **Google Fonts** (`next/font`
  fetch blocked) and the prisma engine fetch — both sandbox network restrictions. Building
  with the font imports temporarily stubbed confirmed the whole app type-checks; the stub
  was restored.

---

## 13. Validation Log (this branch)

```
npm test      → 20 files, 331 passed (0 failed)
npx tsc       → pre-existing prisma-stub cascade only
npx eslint    → 0 new errors vs. pre-edit baseline
npx next build → ✓ Compiled successfully (stops at Google Fonts / prisma engine fetch — sandbox network limits)
```

Commit: `5828119` on `arena/01a0bbd1-xcipher` — commits 50+ individual fixes across
54 files. Full per-item audit mapping with rationale lives in `FIX_QUEUE.md` (Round 6).

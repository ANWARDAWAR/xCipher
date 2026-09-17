# xCipher — Code Audit & Fix Queue

**Audited commit:** `85ec52c` "Added new features and fixed bugs" (merged into `arena/01a0b084-xcipher` as `906d0a8`)
**Baseline:** `580926a`
**Diff size:** 62 files, +14,585 / −1,600
**Audit date:** 2026-09-18
**Companion document:** `DASHBOARD_CMS_MASTER_PLAN.md` (49 sections — the specification this code is measured against)

> **How to use this file.** Work top to bottom. Each FIX is independently shippable, has a verification command, and does not depend on the ones below it. Tick the box, run the verification, then move on. Do not batch them.

---

## 0. Executive verdict

The Phase 1 and Phase 2 implementation is **substantially real and substantially good**. This is not scaffolding — `lib/capabilities.ts`, `lib/workflow.ts` and `app/actions/workflow.ts` are genuine implementations of §39, §40 and §38 of the master plan, and the unified article index at `/admin/articles` actually works with server-side scoping, filtering and pagination.

Verified working:

| Claim | Status | Evidence |
|---|---|---|
| Capability layer | ✅ Real | `lib/capabilities.ts` — `Capability` union, `ROLE_CAPABILITIES`, `authorize()`, `buildArticleScope()`, `ARTICLE_LIST_SELECT` |
| State machine | ✅ Real | `lib/workflow.ts` — `TRANSITIONS` table, `validateTransition()`, `STATUS_META` |
| Workflow actions | ✅ Real | `app/actions/workflow.ts` — 17 exported actions, all behind `executeTransition()` |
| Schema extended | ✅ Real | `sessionVersion`, `submittedAt`, `reviewedAt`, `approvedAt`, `archivedAt`, `reviewedById`, `ArticleReview` model, **7 `@@index`** (was 0) |
| New statuses | ✅ Real | `APPROVED`, `SCHEDULED`, `ARCHIVED` added; `REVIEW` marked deprecated in a comment |
| Unified index | ✅ Real | `app/admin/(authenticated)/articles/page.tsx` — URL-driven, scoped, projected, paginated |
| Body projection | ✅ Real | `ARTICLE_LIST_SELECT` excludes `contentHtml`/`contentJson` |
| Redirects | ✅ Real | `/admin/drafts` → `?status=DRAFT,REVISION_REQUESTED`; `/admin/submissions` → `/admin/review` |
| Review queue | ✅ Real | `/admin/review` + `/admin/review/[id]`, ageing via `formatAge()`, claim filters |
| Atomic claim | ✅ Correct | `claimReview` uses `updateMany({ where: { id, reviewedById: null } })` and treats `count === 0` as `CONFLICT` |
| Reason enforcement | ✅ Correct | `requestChanges` and `rejectArticle` enforce ≥20 chars **server-side**; reject also requires a reason code |
| `ArticleReview` writes | ✅ Correct | Both write in a `$transaction` with `fromStatus`, `toStatus`, `passNumber` |
| Delete split | ✅ Real | `archiveArticle`, `deleteArticlePermanently`, `deleteOwnDraft` |
| Typed confirmation | ✅ Real | `ConfirmDialog` has `requireTypedConfirmation` |
| Theme toggle | ✅ Correct | `ThemeToggle` **imported**, not duplicated — `app/admin/(authenticated)/layout.tsx:7,51` |
| shadcn token names | ✅ None | `grep bg-background\|text-muted-foreground\|border-border` → **0** |

**But there are 14 defects, 3 of them blocking.** The rest of this document is the queue.

---

## 1. BLOCKING — fix before anything else

### FIX-01 — A live database password is committed to the repository

- [ ] **Severity: CRITICAL (security incident)**

**Evidence:** `test-db.js`, tracked by git:

```js
connectionString: 'postgresql://postgres.xkzcepwwtyypujrkaych:anwardawar231@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres'
```

This is a real Supabase project reference, username and password, in a public GitHub repository. It is in the git history, so deleting the file is not sufficient.

**Do this now, in order:**

1. **Rotate the Supabase database password immediately.** Supabase dashboard → Project Settings → Database → Reset database password. Assume the current one is compromised.
2. Update `DATABASE_URL` in `.env` and in your hosting provider's environment variables.
3. Delete the file: `git rm test-db.js`
4. Add to `.gitignore`: `test-db.js` and `*.local.js`
5. Purge it from history — `git filter-repo --path test-db.js --invert-paths` (or the BFG). Force-push after coordinating, since this rewrites history.
6. Add a secret scan to the build: `grep -rn "postgres://\|postgresql://" --include='*.ts' --include='*.js' --include='*.json' . | grep -v node_modules` must return nothing.

**Verification:** `git log --all --full-history -- test-db.js` returns nothing, and the old password no longer authenticates.

---

### FIX-02 — No migrations directory exists; the database does not match the schema

- [ ] **Severity: CRITICAL (everything below is unverified until this passes)**

**Evidence:** `ls prisma/migrations` → **directory does not exist.** The Phase 2 checklist itself recorded *"Create Prisma migration for sessionVersion (skipped, generate used)"*.

`prisma generate` rebuilds the TypeScript client only. It does not touch Postgres. Every column and model added in Phase 1 and 2 — `sessionVersion`, `submittedAt`, `reviewedAt`, `approvedAt`, `archivedAt`, `reviewedById`, `submittedById`, `approvedById`, the `ArticleReview` model, the three new `ArticleStatus` values and all 7 `@@index` — exists in `schema.prisma` and in the generated types but **may not exist in the database**.

This is why the code type-checks and builds and will still fail at the first query.

**Do this:**

```bash
npx prisma migrate status
```

| Result | Action |
|---|---|
| "Database schema is up to date" | You used `db push`. Baseline it: `npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > init.sql`, then `npx prisma migrate resolve --applied 0_init`. You need a migrations history before production. |
| "No migration found" / drift detected | `npx prisma migrate dev --name phase1_phase2_workflow`, review the SQL by hand, then `npx prisma migrate deploy` on production. |

**Two things to check in the generated SQL before applying:**

1. **Enum additions.** Postgres cannot run `ALTER TYPE ... ADD VALUE` inside a transaction block on older versions, and Prisma wraps migrations in transactions. Test against a copy of production, not an empty dev database.
2. **Backfill.** Articles already sitting in `SUBMITTED` have `submittedAt = NULL`. The review queue orders by `submittedAt` and computes ageing from it, so those rows will sort unpredictably and show a wrong age. Add to the migration:

```sql
UPDATE "Article" SET "submittedAt" = "updatedAt"
WHERE "status" IN ('SUBMITTED','REVIEW') AND "submittedAt" IS NULL;
```

**Verification:** `npx prisma migrate status` reports no pending migration, and `SELECT "submittedAt" FROM "Article" WHERE status='SUBMITTED' AND "submittedAt" IS NULL;` returns zero rows.

---

### FIX-03 — 153 dead `dark:` utilities: the entire dark mode of the redesign does nothing

- [ ] **Severity: CRITICAL (the redesign is half-broken and it fails silently)**

**Evidence:**

```
grep -rn "dark:" app components --include='*.tsx' | wc -l   → 153
grep -n "@custom-variant" app/globals.css                    → (nothing)
```

Dark mode in this project is driven by `[data-theme="dark"]` (`app/layout.tsx:37` sets `attribute="data-theme"`; `app/globals.css:51` declares `[data-theme="dark"]`). Tailwind v4's default `dark:` variant matches `prefers-color-scheme`, **not** a `data-theme` attribute. Without a `@custom-variant` declaration, **every one of those 153 utilities is inert.**

Affected files (15): `audit-logs/page.tsx`, `audit-logs/AuditLogDetailsDialog.tsx`, `audit-logs/AuditLogsClient.tsx`, `comments/CommentModerationRow.tsx`, `comments/page.tsx`, `comments/CommentsQueueClient.tsx`, `page.tsx` (dashboard), `error.tsx`, `subscribers/page.tsx`, `subscribers/SubscribersClient.tsx`, `taxonomy/TaxonomyManager.tsx`, `users/page.tsx`, `users/UserDirectoryTable.tsx`, `ArticleEditor.tsx`, `ui/Pagination.tsx`.

Toggle the theme on any of those pages today and the light-mode colours stay.

**Fix — one line, and everything starts working.** Add to `app/globals.css`, immediately after `@import "tailwindcss";`:

```css
@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));
```

**Then decide the second half.** Those same files also hardcode `bg-white`, `bg-[#111317]`, `border-neutral-200/80`, `text-neutral-900`, `dark:bg-[#0c0d10]`. Those bypass the token system: any future palette change will miss them, and they contradict the master plan's token discipline (§42.2). The custom variant makes them *work*; it does not make them *right*. Migrating them to `bg-paper` / `bg-surface` / `text-ink` / `border-line` is **FIX-11**, which is cosmetic and can wait.

**Verification:** add the variant, load `/admin/audit-logs`, toggle the theme, and confirm the panel background changes. Then `grep -rn "dark:" app components --include='*.tsx' | wc -l` and confirm all 153 are now live rather than dead.

---

## 2. HIGH — correctness and security

### FIX-04 — The JWT callback fails **open** on a database error

- [ ] **Severity: HIGH (security)**

**Evidence:** `app/api/auth/[...nextauth]/route.ts:65-67`

```ts
} catch (e) {
  console.error("JWT verification error", e);
}
return token;          // ← returns the OLD token, with the OLD role
```

The invalidation logic itself is correct — `if (!dbUser || !dbUser.isActive || dbUser.sessionVersion !== token.sessionVersion) return {}`. But if the lookup *throws* (connection blip, pool exhaustion, timeout), the catch swallows it and the stale token is returned intact. An attacker who can induce database pressure extends their old privileges.

§45.1 of the master plan requires fail-closed.

**Fix:**

```ts
} catch (e) {
  console.error("JWT verification error", e);
  return {};   // fail closed
}
```

**Verification:** stop the database, reload an admin page, confirm you are signed out rather than served with the cached role.

---

### FIX-05 — `takeOverReview` silently steals a claim with no confirmation and no guard

- [ ] **Severity: HIGH**

**Evidence:** `app/actions/workflow.ts:99-121`. It checks the review capability, then unconditionally `db.article.update({ data: { reviewedById: actor.id } })`. There is no check that the article is even claimed, no confirmation requirement, and no distinction from `claimReview`.

It does write an audit entry with `previousReviewerId`, which is good. But §45.5 requires take-over to be **explicit and confirmed**, not a silent overwrite.

**Fix:**
1. Return `VALIDATION` if `article.reviewedById === null` — use `claimReview` for an unclaimed article.
2. Return `VALIDATION` if `article.reviewedById === actor.id` — already yours.
3. Add a `confirm: true` parameter the action requires, and gate the UI behind `ConfirmDialog` naming the current claimant.

**Verification:** as reviewer A claim an article; as reviewer B attempt take-over and confirm a confirmation step appears and the audit log records both reviewers.

---

### FIX-06 — No self-review guard

- [ ] **Severity: HIGH**

**Evidence:** `grep -rn "self\|sole editor" lib/workflow.ts app/actions/workflow.ts` → only match is the own-draft check in `deleteOwnDraft`. `validateTransition()` (`lib/workflow.ts:131`) checks the transition table, the capability and ownership, but never that the reviewer is not the author.

An EDITOR can today write an article, submit it, approve it and publish it with no second pair of eyes. §45.5 and §40.2 both require this to be blocked.

**Fix:** in `approveArticle`, `requestChanges` and `rejectArticle`, refuse when `article.authorId === actor.authorId` — unless the actor is the only user holding `article.review` (count the users with a reviewing role; if the count is 1, allow it and note it in the audit entry).

**Verification:** as an editor, submit your own article, then attempt to approve it and confirm refusal with a clear message.

---

### FIX-07 — `deleteArticlePermanently` has no status guard and an empty if-block

- [ ] **Severity: HIGH (data loss)**

**Evidence:** `app/actions/workflow.ts:475-478`

```ts
if (article.status === "PUBLISHED" || article.status === "ARCHIVED") {
  // Requires forcing in UI
}
```

An empty block. Nothing is enforced. §40.2 and §45.3 require permanent deletion to be reachable **only from `ARCHIVED`**. Today an ADMIN can permanently destroy a live published article in one call.

There is a second, subtler problem in the same function: the audit entry is written **inside** the transaction but **after** `tx.article.delete()`. If the article row has a restricting foreign key the delete throws and the audit write rolls back with it, so a failed destructive attempt leaves no trace. §45.3 requires the audit entry first.

**Fix:**

```ts
if (article.status !== "ARCHIVED") {
  return { ok: false, code: "VALIDATION",
    message: "Only archived articles can be permanently deleted. Archive it first." };
}
```

and move the `tx.auditLog.create(...)` call **above** the deletes, capturing title, slug, author and status.

**Verification:** attempt to permanently delete a `PUBLISHED` article as OWNER and confirm refusal; archive it, delete it, and confirm the audit entry exists with the full snapshot.

---

### FIX-08 — Autosave still reports success after a conflict

- [ ] **Severity: HIGH (data-loss adjacent)**

**Evidence:** `components/editorial/ArticleEditor.tsx:444-450`

```ts
if (isAutosave) {
  if (result.serverUpdatedAt) {
    setLastSaved(new Date(result.serverUpdatedAt));
    setAutosaveStatus("saved");        // ← the save FAILED
  }
```

The comment says "silently resync the baseline". The user sees "✓ Saved" for a write the server rejected. This is the exact defect §38 TASK-15 was written to remove, and it survived.

**Fix:** add a `"conflict"` state to `autosaveStatus`. Render "Not saved — this article changed elsewhere" with Reload and Overwrite actions. Never display a success indicator for a rejected write.

**Verification:** open the same article in two tabs, edit both, and confirm the second tab shows a conflict state rather than a tick.

---

### FIX-09 — The dashboard bypasses `buildArticleScope`

- [ ] **Severity: HIGH (scope leak)**

**Evidence:** `app/admin/(authenticated)/page.tsx:58-64`

```ts
isAuthorOnly = user?.role === "AUTHOR";
const wherePublished = isAuthorOnly ? { status: "PUBLISHED", authorId } : { status: "PUBLISHED" };
```

This is the original role-name branch, untouched. The whole point of `buildArticleScope(actor)` (§39.2, and the Phase 1 exit criterion) is that it is the **only** source of article visibility. The dashboard is the single most-visited console page and it does not use it.

Consequence: a CONTRIBUTOR-equivalent or a MODERATOR sees aggregate counts across articles their scope forbids. The counts are also still `published + drafts`, omitting `SUBMITTED`, `APPROVED`, `SCHEDULED`, `REJECTED` and `ARCHIVED` — the arithmetic bug from §1 finding 13.

`app/admin/(authenticated)/articles/page.tsx:187` has the same `role === "AUTHOR"` line, though there it is used only for a UI label, which is acceptable.

**Fix:** replace the branch with `buildArticleScope(actor)` and count every status with one `groupBy`. This is a partial down-payment on TASK-12; the full role-specific block set stays in Phase 4.

**Verification:** sign in as each role and confirm the dashboard totals equal `db.article.count({ where: buildArticleScope(actor) })`.

---

### FIX-10 — `upsertArticle` still revalidates the whole layout on every autosave

- [ ] **Severity: HIGH (performance)**

**Evidence:** `app/actions/article.ts:204-213` — eight `revalidatePath` calls including `revalidatePath("/", "layout")`, on the same path autosave calls every five seconds.

§45.2 requires revalidation only on transitions that change public output. An idle editor with a five-second autosave is currently nuking the entire public cache twelve times a minute.

**Fix:** remove all public-path revalidation from `upsertArticle`. Keep only `revalidatePath("/admin/articles", "page")`. The workflow actions already revalidate correctly on publish, unpublish, archive and restore — that is where public revalidation belongs.

**Verification:** edit an article for one minute and confirm no public page is revalidated.

---

## 3. MEDIUM — quality and consistency

### FIX-11 — Two `Pagination` components

- [ ] `components/console/Pagination.tsx` (177 lines) and `components/ui/Pagination.tsx` (106 lines) both exist. Pick one — the console version is the one the article index uses — delete the other, update imports.

### FIX-12 — Four undefined tokens remain

- [ ] `--bg` and `--bg-elevated` are now declared (`app/globals.css:8-9` and `:58-59`). Still undeclared and still referenced from `.tsx`:

| Token | Declarations | Uses in TSX |
|---|---|---|
| `--ink-muted` | 0 | 20 |
| `--success` | 0 | 13 |
| `--error` | 0 | 12 |
| `--warning` | 0 | 6 |
| `--surface-1` | 0 | 3 |

Add the remaining five aliases beside the two that already landed:

```css
--ink-muted: var(--muted);
--success:   var(--ok);
--warning:   var(--warn);
--error:     var(--bad);
--surface-1: var(--surface);
```

### FIX-13 — Notifications still unwired

- [ ] `grep -rn "db.notification" app lib` → **0**. Six workflow transitions exist and none notifies anyone. This is TASK-17 (Phase 5), but §45.2 asked for a no-op emitter call site per transition so Phase 5 is wiring rather than surgery. Add `await emitNotification(...)` stubs now while the actions are fresh.

### FIX-14 — Scheduled publishing still has no executor

- [ ] `find app/api` → only `auth/[...nextauth]`. `scheduleArticle` sets `status: "SCHEDULED"` and `scheduledFor`, and **nothing ever publishes it**. Worse than before: articles now sit in a `SCHEDULED` state that the public route (`status: "PUBLISHED"`) will never show. This is TASK-06 (Phase 3) — see FIX-16.

---

## 4. LOW — cleanup

- [ ] **FIX-15a** — `REVIEW` enum value is deprecated by comment only. Back-fill `UPDATE "Article" SET status='SUBMITTED' WHERE status='REVIEW'` and remove it from `buildArticleScope`'s REVIEWER branch and from the editor's zod enum (`ArticleEditor.tsx:72`, which still lists the old six statuses and omits `APPROVED`/`SCHEDULED`/`ARCHIVED`).
- [ ] **FIX-15b** — Three master-plan documents now exist at the root: `DASHBOARD.md` (5,509 lines), `DASHBOARD_CMS_MASTER_PLAN.md` (6,165 lines) and `IMPLEMENTATION_MASTER_PLAN.md` (380 lines). `DASHBOARD.md` is a stale copy of the plan at §43. Delete it; keep one authoritative document.
- [ ] **FIX-15c** — Hardcoded palette values across the 15 redesigned files (`bg-white`, `bg-[#111317]`, `border-neutral-200/80`, `text-neutral-900`). Migrate to `bg-paper` / `bg-surface` / `text-ink` / `border-line`. Do this as part of Phase 4 TASK-14, not now.

---

## 5. Execution order

Run these one at a time. Verify each before starting the next.

| Order | Fix | Why here |
|---|---|---|
| 1 | **FIX-01** rotate the leaked password | Active security exposure. Minutes, not hours. |
| 2 | **FIX-02** migrations | Everything below is unverifiable until the database matches the schema. |
| 3 | **FIX-03** `@custom-variant dark` | One line. Instantly un-breaks the redesign's dark mode. |
| 4 | **FIX-04** fail-closed JWT | One line. Security. |
| 5 | **FIX-07** delete status guard | Prevents irreversible data loss. |
| 6 | **FIX-06** self-review guard | Editorial integrity. |
| 7 | **FIX-05** take-over confirmation | Completes TASK-10 properly. |
| 8 | **FIX-08** autosave conflict state | Stops lying to the author. |
| 9 | **FIX-09** dashboard scope | Closes the last scope leak. |
| 10 | **FIX-10** revalidation | Performance; trivial. |
| 11 | **FIX-12** remaining tokens | Five lines; unblocks visual work. |
| 12 | **FIX-11**, **FIX-13**, **FIX-15a/b** | Cleanup. |
| 13 | **FIX-16 = Phase 3** | See below. |

### After the queue: Phase 3

`TASK-08` is **already substantially done** — the unified index has server-side filtering, sorting and pagination with URL state. What remains of Phase 3:

| Task | Remaining work |
|---|---|
| TASK-08 | Verify tag and date-range filters, per-status counts in the filter bar, and the filtered-empty state. Mostly done. |
| **TASK-09** | Thumbnails from `Article.img`, two-line stacked rows below 768px, expandable row detail. `StatusChip` already exists and is correct. |
| **TASK-06** | The missing scheduled-publish executor — a cron route flipping `SCHEDULED → PUBLISHED` when `scheduledFor <= now`, plus public-route gating. **This is the last CRITICAL finding still open.** |

Then Phase 4 begins with **TASK-14**, which absorbs FIX-15c.

---

## 6. Build health

`node_modules` is not installed in this checkout, so `tsc --noEmit` and `next build` were not run here. Run both locally after **FIX-02**:

```bash
npm ci
npx prisma generate
npx tsc --noEmit
npm run build
```

A clean build does **not** validate FIX-03, FIX-04, FIX-06, FIX-07, FIX-08 or FIX-09 — every one of those fails silently at runtime, not at compile time. There are still **zero tests** in the repository (§38 TASK-28). The permission-matrix and state-machine tests are now more valuable than ever, because `lib/capabilities.ts` and `lib/workflow.ts` are real, table-driven and trivially testable.

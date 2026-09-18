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

- [x] **File removed** — `4d2e56a`, and `.gitignore` updated in `39ae88c`.
- [ ] **STILL OPEN: the password is in git history.** `git log --all --oneline -- test-db.js` returns `4d2e56a` *and* `85ec52c`. Anyone can run `git show 85ec52c:test-db.js` on the public repository and read the credential. Deleting a file does not remove it from history. Either rotate the Supabase password (simplest, and sufficient) or purge with `git filter-repo --path test-db.js --invert-paths` followed by a coordinated force-push. **Confirm which you did.**
- [ ] ~~**Severity: CRITICAL (security incident)**~~

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

- [x] **DONE** — closed by FIX-02b. `prisma/migrations/0_init/` is committed and baselined.
- [~] ~~**PARTIALLY DONE — still open.** `prisma/schema.prisma` was reformatted by an introspection or `db push` round-trip on `main` @ `055999b`, which indicates the database was synchronised. **But `prisma/migrations/` still does not exist** (`git ls-tree origin/main prisma/` → only `schema.prisma`). See FIX-02b below.
- [ ] ~~**Severity: CRITICAL (everything below is unverified until this passes)**

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

- [x] **DONE** — `app/globals.css:2` now declares `@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));`. Verified on `main` @ `055999b`. One line, exactly as scoped.
- [ ] ~~**Severity: CRITICAL (the redesign is half-broken and it fails silently)**

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

### FIX-02b — Schema round-trip side effects (NEW, found 2026-09-18)

- [x] **DONE** — verified on `main` @ `c0a8b67`. All 7 `@db.Text` annotations restored (`refresh_token`, `access_token`, `id_token`, `Author.disclosure`, `ArticleRevision.notes`, `ArticleReview.reason`, `Notification.body`); the `REVIEW` deprecation note is back at `schema.prisma:261`; `prisma/migrations/0_init/migration.sql` exists and is committed (24 tables/indexes, all 9 `ArticleStatus` values). `migration_lock.toml` was missing and has been added.
- [ ] ~~**Severity: HIGH**~~

The `055999b` diff reformats `prisma/schema.prisma` wholesale (+375/−375 style churn). Model fields, all 7 indexes, `ArticleReview` and the three new enum values survived intact — verified field-by-field against `85ec52c` for `User`, `Article`, `ArticleReview`, `Author`, `Category`, `Notification`, `Invitation` and `Comment`, all identical. Two real regressions did slip in:

1. **All 7 `@db.Text` annotations were dropped.** `85ec52c` had 7; `055999b` has 0. Affected: `Account.refresh_token`, `Account.access_token`, `Account.id_token`, `ArticleRevision.notes`, `ArticleReview.reason`, and the other long-text columns. Without `@db.Text` Prisma maps these to `VARCHAR(191)`-equivalent on some providers. On Postgres the practical effect is limited, but a rejection reason or an OAuth token longer than the default will now be at risk, and the schema no longer documents the intent. **Restore all 7 annotations.**

2. **Comment banners were stripped.** The `// User & Auth Models (NextAuth)` and `// CMS Operational Models` section headers are gone, and the `REVIEW` enum value lost its `// Deprecated: kept to avoid destructive migration` note — which was the only record of that decision. **Restore the deprecation comment at minimum.**

Also note the enum order changed (`DRAFT, REVIEW, PUBLISHED, SUBMITTED, ...` instead of the logical workflow order). Harmless in Postgres — enum ordering only affects `ORDER BY` on the enum type itself, which nothing does — but if you ever sort by status, sort by an explicit map instead.

**Verification:** `grep -c "@db.Text" prisma/schema.prisma` returns 7; `npx prisma migrate status` reports no pending migration; `prisma/migrations/` exists and is committed.

---

## 2. HIGH — correctness and security

### FIX-06b — The self-review reviewer count includes roles that cannot review

- [ ] **Severity: MEDIUM** (follow-up to FIX-06, `cdda564`)

`checkSelfReviewGuard` counts active users with `role: { in: ["OWNER","ADMIN","EDITOR","REVIEWER","MODERATOR"] }`. But `MODERATOR_CAPS` in `lib/capabilities.ts:112` does **not** contain `article.review` — a moderator cannot review anything.

Consequence: a solo editor who happens to have one moderator on the team sees a count of 2, so the sole-reviewer exception never fires and they are locked out of approving their own work with no way to proceed. This is exactly the single-operator lockout the exception existed to prevent.

The hardcoded role list also duplicates the capability map, so the two will drift.

**Fix:** derive the list from the capability map instead of hardcoding it:

```ts
const reviewerRoles = (Object.keys(ROLE_CAPABILITIES) as Role[])
  .filter((r) => authorize(r, "article.review"));
const activeReviewersCount = await db.user.count({
  where: { isActive: true, role: { in: reviewerRoles } },
});
```

Export `ROLE_CAPABILITIES` from `lib/capabilities.ts` if it is not already exported.

**Verification:** with one editor and one moderator in the system, the editor can approve their own article. With two editors, they cannot.

---

### FIX-08b — The conflict banner hardcodes hex colours and is not announced

- [ ] **Severity: LOW** (follow-up to FIX-08, `56a5d54`)

The banner uses `bg-[#fffbeb] text-[#d97706] border-[#f59e0b]/30`, and the buttons `bg-[#d97706]`, `text-[#92400e]`. Five hardcoded values that will not respond to the theme — in dark mode this is a pale-yellow slab. The project has `--warn`, exposed as `bg-warn` / `text-warn`.

The prompt also asked for the state change to be announced through a polite live region. The agent searched for `aria-live`, found nothing in the editor, and settled for `showToast`. That is acceptable if the toast helper carries `role="status"` — `lib/utils.ts` does — but the banner itself should still be a labelled region so a screen-reader user who scrolls past the toast can still find it.

**Fix:** replace the five hex values with the warn token, and add `role="status"` to the banner container.

**Verification:** toggle to dark mode with a conflict active and confirm the banner is legible.

---

### FIX-09b — Dashboard: leftover role branch and a non-existent default role

- [ ] **Severity: MEDIUM** (follow-up to FIX-09, `eb570f2`)

Two issues remain in `app/admin/(authenticated)/page.tsx`:

1. **`isAuthorOnly = user?.role === "AUTHOR"` survived.** It no longer affects any query — good — but it still switches the section headings ("Your Stories" versus "Total Articles"). A reviewer or moderator now sees scoped counts under a heading that says "Total Articles", which is misleading. Derive the heading from whether the actor holds `article.view.all` instead.

2. **The actor falls back to `role: "CONTRIBUTOR"`** when no user is resolved. There is no `CONTRIBUTOR` value in the `Role` enum — the master plan proposes adding it, but it does not exist. `buildArticleScope` will fall through every branch and return the deny-all filter, which is the safe outcome, so this is not exploitable. But it is a silent type lie. Use `"STAFF"` (the real least-privileged role) or, better, redirect when there is no user rather than constructing a fake actor.

**Verification:** sign in as a reviewer and confirm the dashboard headings match the scope shown.

---

### FIX-04 — The JWT callback fails **open** on a database error

- [x] **DONE** — the `catch` clause in `app/api/auth/[...nextauth]/route.ts` now returns `{}` after logging. Verified on `main` @ `055999b`. One line, log retained, fail-closed.
- [ ] ~~**Severity: HIGH (security)**~~

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

- [x] **DONE** — `e9ae662`. Signature now `takeOverReview(id, confirm)`. Refuses unclaimed articles, refuses self, refuses without explicit confirmation. `ReviewWorkspace` routes through `ConfirmDialog` naming the current claimant. Audit records both reviewer ids.
- [ ] ~~**Severity: HIGH**~~

**Evidence:** `app/actions/workflow.ts:99-121`. It checks the review capability, then unconditionally `db.article.update({ data: { reviewedById: actor.id } })`. There is no check that the article is even claimed, no confirmation requirement, and no distinction from `claimReview`.

It does write an audit entry with `previousReviewerId`, which is good. But §45.5 requires take-over to be **explicit and confirmed**, not a silent overwrite.

**Fix:**
1. Return `VALIDATION` if `article.reviewedById === null` — use `claimReview` for an unclaimed article.
2. Return `VALIDATION` if `article.reviewedById === actor.id` — already yours.
3. Add a `confirm: true` parameter the action requires, and gate the UI behind `ConfirmDialog` naming the current claimant.

**Verification:** as reviewer A claim an article; as reviewer B attempt take-over and confirm a confirmation step appears and the audit log records both reviewers.

---

### FIX-06 — No self-review guard

- [x] **DONE** — `cdda564`. `checkSelfReviewGuard()` at `app/actions/workflow.ts:35`, applied in all three decision actions (lines 228, 277, 327). Sole-reviewer exception works. **One follow-up below (FIX-06b).**
- [ ] ~~**Severity: HIGH**~~

**Evidence:** `grep -rn "self\|sole editor" lib/workflow.ts app/actions/workflow.ts` → only match is the own-draft check in `deleteOwnDraft`. `validateTransition()` (`lib/workflow.ts:131`) checks the transition table, the capability and ownership, but never that the reviewer is not the author.

An EDITOR can today write an article, submit it, approve it and publish it with no second pair of eyes. §45.5 and §40.2 both require this to be blocked.

**Fix:** in `approveArticle`, `requestChanges` and `rejectArticle`, refuse when `article.authorId === actor.authorId` — unless the actor is the only user holding `article.review` (count the users with a reviewing role; if the count is 1, allow it and note it in the audit entry).

**Verification:** as an editor, submit your own article, then attempt to approve it and confirm refusal with a clear message.

---

### FIX-07 — `deleteArticlePermanently` has no status guard and an empty if-block

- [x] **DONE** — verified on `main` @ `c0a8b67`. The empty block is now a real guard returning `FORBIDDEN` unless the status is `ARCHIVED`; the audit write moved to the top of the transaction and captures title, slug, authorId and status. Bonus: `ArticleActionMenu.tsx:49` now also hides the permanent-delete item for non-archived articles.
- [ ] ~~**Severity: HIGH (data loss)**~~

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

- [x] **DONE** — `56a5d54`. `autosaveStatus` gains a `"conflict"` member; the timer is suspended while unresolved (`ArticleEditor.tsx:301`); a banner offers Reload and Overwrite; the false success tick is gone. **One follow-up below (FIX-08b).**
- [ ] ~~**Severity: HIGH (data-loss adjacent)**~~

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

- [x] **DONE** — `eb570f2`. `buildArticleScope(actor)` now drives every dashboard query, and a single `groupBy` counts every status so the total is no longer published-plus-drafts. **Two follow-ups below (FIX-09b).**
- [ ] ~~**Severity: HIGH (scope leak)**~~

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
| 1 | ~~**FIX-01** rotate the leaked password~~ ✅ | Active security exposure. Minutes, not hours. |
| 2 | ~~**FIX-02** migrations~~ ✅ `c0a8b67` | Everything below is unverifiable until the database matches the schema. |
| 3 | ~~**FIX-03** `@custom-variant dark`~~ ✅ `055999b` | One line. Instantly un-breaks the redesign's dark mode. |
| 4 | ~~**FIX-04** fail-closed JWT~~ ✅ `055999b` | One line. Security. |
| 5 | ~~**FIX-07** delete status guard~~ ✅ done `c0a8b67` | Prevents irreversible data loss. |
| 6 | **FIX-06** self-review guard | Editorial integrity. **← NEXT** |
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


---

## 7. Progress log

| Fix | Status | Landed |
|---|---|---|
| FIX-01 leaked DB password | ✅ done | user-reported |
| FIX-02 migrations | ✅ done | `c0a8b67` |
| FIX-02b schema round-trip | ✅ done | `c0a8b67` |
| FIX-03 `@custom-variant dark` | ✅ done | `055999b` |
| FIX-04 fail-closed JWT | ✅ done | `055999b` |
| FIX-05 take-over confirmation | ✅ done | `e9ae662` |
| FIX-06 self-review guard | ✅ done | `cdda564` |
| FIX-06b reviewer-count derivation | ✅ done | `54d4b0c` |
| FIX-08b conflict banner tokens | ✅ done | `1175dd9` |
| FIX-08c status token contrast + dark overrides | ✅ done | `5b58cfc` |
| FIX-09b dashboard heading + fake role | ✅ done | `6e7e33c` |
| FIX-09c redirect inside try/catch | ✅ done | `922b9dd` |
| FIX-07 delete status guard | ✅ done | `c0a8b67` |
| FIX-08 autosave conflict state | ✅ done | `56a5d54` |
| FIX-09 dashboard scope | ✅ done | `eb570f2` |
| FIX-10 revalidation | ✅ done | `d146c1c` |
| FIX-10b delete revalidation regression | ✅ done | `24917f4` |
| FIX-11 duplicate Pagination | ✅ done | `c27d05a` |
| FIX-12 five remaining tokens | ✅ done | `37833ce` |
| FIX-13 notifications | ✅ done | `0d7fd0f` |
| FIX-14 scheduled executor | deferred → Phase 3 TASK-06 | **last CRITICAL open** |
| FIX-15a `REVIEW` backfill | ✅ done | `05b8c7f` |
| FIX-15b duplicate plan docs | ✅ done | housekeeping |
| FIX-15c hardcoded palette | deferred → Phase 4 TASK-14 | |

### Housekeeping done alongside

- `DASHBOARD.md` (stale 5,509-line copy of the plan) deleted on `main`.
- `fixed_queue.md` and `IMPLEMENTATION_MASTER_PLAN.md` were both duplicates — `IMPLEMENTATION_MASTER_PLAN.md` had grown into a byte-identical copy of the 6,164-line master plan. Both removed. **`FIX_QUEUE.md` and `DASHBOARD_CMS_MASTER_PLAN.md` are the only two authoritative documents.**
- `prisma/migrations/migration_lock.toml` was missing from the baseline commit and has been added. Without it Prisma cannot verify the provider and will warn on every migrate command.

### FIX-03 step 4 — contrast audit (delivered, `afea738`)

Two real dark-mode defects, both fixed:

| Location | Was | Now |
|---|---|---|
| `CommentModerationRow.tsx:49` | `bg-neutral-100 text-neutral-600 border-neutral-200` | `bg-surface-2 text-muted border-line` |
| `SubscribersClient.tsx:71` | same | same |

False positives, deliberately left alone:

- `app/admin/login/page.tsx`, `app/admin/setup/SetupForm.tsx` — `bg-white/5` and `text-neutral-400` on a permanently dark, theme-independent page.
- audit-log / comments / subscribers screens — every remaining `neutral-*` occurrence already carries an explicit `dark:` variant.

Migrating those files wholesale onto the token scale remains FIX-15c / Phase 4 TASK-14.

### Follow-ups found while verifying round 5

- **FIX-08c** — `--warn` was `#b07818`: 3.79:1 on white, failing AA in the default theme. Now `#845a12` (6.08:1). `--ok`, `--warn` and `--bad` had **no** `[data-theme="dark"]` override at all, so light mid-tones were reused on dark surfaces at 3.0–3.6:1. Dark values added. New `--on-status` token for text on a solid status fill, because `text-white` on the new dark `--warn` would have been 1.6:1.
- **FIX-09c** — FIX-09b put `redirect("/admin/login")` inside a `try` whose `catch` swallows everything. `redirect()` signals by throwing `NEXT_REDIRECT`, so the redirect never happened; the page rendered with zeroed counts. Masked today by the layout guard. `canViewAll` was also inside the `try`, so a DB error relabelled an owner's dashboard "Your Stories".
- **FIX-10b** — FIX-10 stripped the public revalidations from `deleteArticle` along with the autosave ones. Deleting a *published* article left its page cached and still listed. Restored, gated on `status === "PUBLISHED"`.

### Build health note

`node_modules` installed in the sandbox for the first time this round. `npx tsc --noEmit` reports **no errors originating in application logic**; the 48 remaining errors are all `has no exported member` against `@prisma/client`, caused by `prisma generate` producing a stub — the sandbox cannot reach `binaries.prisma.sh`. `next build` cannot complete here either: `next/font` cannot reach `fonts.googleapis.com`. **Both are sandbox network restrictions, not code defects.** Full typecheck and build must be run locally.

### Phase 3 — complete

| Task | Status | Commit |
|---|---|---|
| **TASK-06** scheduled-publish executor | ✅ done | `ab44ea5` |
| **TASK-08** date-range filter | ✅ done | `fa577a1` |
| **TASK-09** mobile rows, thumbnails, scheduled dates | ✅ done | `23d7008` |
| TASK-17 phase 1 — notification UI | ✅ done | `1cfbe73` |

### Additional work this round

| Item | Commit | Note |
|---|---|---|
| Reviewer reason shown to the author | `240a9a4` | requestChanges/rejectArticle demanded 20+ chars and nothing ever rendered them |
| Console loading skeletons | `ed11f26` | there was no `loading.tsx` anywhere; also repaired three bugs in the error boundary |
| Four hardcoded role gates → capability map | `f1eb050` | taxonomy page, taxonomy actions, invite page, profile action |
| Hydration: no clock reads during client render | `4cd2fd2` | AuditLogsClient + NotificationBell |

### Bugs found and fixed while implementing

- **Broken public links.** `ArticleIndex` and the dashboard linked to `/${slug}`; the public route is `/article/[slug]`. Every "View on site" link 404'd. The other 20 article links in the codebase were already correct.
- **`bg-accent-hover` is declared nowhere** — the error boundary's "Try again" button had no hover state.
- **"Return to Dashboard" linked to `/admin/drafts`.**
- **`deleteArticle` lost its public revalidation** in FIX-10 (fixed as FIX-10b).

### Build health

Verified in-sandbox as far as the network allows:

- `npx tsc --noEmit` — **0 errors originating in application code**. The remainder are `@prisma/client has no exported member`, caused by `prisma generate` emitting a stub: the sandbox cannot reach `binaries.prisma.sh`.
- `npx eslint` on every file touched this round — **clean**.
- `npx next build` — **`✓ Compiled successfully`**. The whole app bundles. The build then stops at page-data collection with `@prisma/client did not initialize yet`, which is the same missing engine binary.
- `next/font` cannot reach `fonts.googleapis.com` either; confirmed by building with the font imports stubbed.

**Both blockers are sandbox network restrictions, not code defects.** Run `npx prisma generate && npm run build` locally for the real verification.

### Still open

| Item | Status |
|---|---|
| FIX-15c → Phase 4 TASK-14 | palette migration off `neutral-*` onto the token scale |
| TASK-17 phase 2 | email delivery behind the existing `lib/notifications.ts` interface |
| 144 pre-existing ESLint errors | mostly `no-explicit-any` (94) and `react-hooks/static-components` (25); none introduced this round |

# xCipher — Local Testing Guide

Manual test procedure for the work in `arena/01a0b084-xcipher`.

There is no automated test suite in this repository (TASK-28 was never built),
so everything below is manual. That is also why this matters: nothing in the
recent phases has ever been executed at runtime. It has only passed `tsc` and
`eslint`.

---

## Part 0 — Which branch you are testing

The work is **not on `main`**. It is on `arena/01a0b084-xcipher`.

Three commits sit on top of the last state you saw:

| Commit | What it changed |
|---|---|
| `7e8537f` | Console palette → design tokens (visual only) |
| `ef22c5b` | Query selects + list caps (performance) |
| `a140c65` | Page caching + revalidation helper (**highest risk**) |

---

## Part 1 — Get the code

### If you do not have the repo locally yet

```bash
git clone https://github.com/ANWARDAWAR/xCipher.git
cd xCipher
git checkout arena/01a0b084-xcipher
```

### If you already have it

```bash
cd xCipher
git fetch origin
git checkout arena/01a0b084-xcipher
git pull origin arena/01a0b084-xcipher
```

### Confirm you are in the right place

```bash
git log --oneline -3
```

You must see `a140c65` at the top. If you do not, stop — the rest will not
match.

---

## Part 2 — Install and configure

```bash
npm install
```

Create `.env` from the template:

```bash
cp .env.example .env
```

Now fill in `.env`. The required values:

| Variable | Notes |
|---|---|
| `DATABASE_URL` | Postgres connection string (pooled) |
| `DIRECT_URL` | Direct connection — Prisma migrations need this, not the pooler |
| `NEXTAUTH_URL` | `http://localhost:3000` for local |
| `NEXTAUTH_SECRET` | Generate: `openssl rand -base64 32` |
| `CRON_SECRET` | Generate: `openssl rand -hex 32` |
| `RESEND_API_KEY` | Can be left as the placeholder — email is not wired up yet |
| `NEXT_PUBLIC_SUPABASE_*` | Only needed if you use Supabase storage for uploads |

> **Use a scratch database, not production.** Part 7 asks you to delete and
> unpublish real articles.

### About the leaked credential

`test-db.js` is gone from git history. But if the **Supabase password itself**
was never rotated, anyone who cloned the repo before the purge still has a
working credential. Rotating it is a two-minute job in the Supabase dashboard
and it closes the issue for good. Do that before testing against anything real.

---

## Part 3 — Database

```bash
npx prisma generate
npx prisma migrate deploy
```

`migrate deploy` applies the two committed migrations (`0_init` and the
`REVIEW` → `SUBMITTED` backfill). It does not create or drop anything beyond
them.

Sanity check the schema actually landed:

```bash
npx prisma studio
```

Look for the `Article` table and confirm it has `submittedAt`, `reviewedById`,
`approvedAt` and `archivedAt`. If those columns are missing, the migration did
not run and **nothing below is meaningful** — every recent phase depends on
them.

---

## Part 4 — Build check

Run this before `npm run dev`. It is the one gate that has never passed in my
sandbox, because the environment blocked both the Prisma engine download and
Google Fonts:

```bash
npm run build
```

This is the highest-value single command you can run. If it fails, send me the
output — it will be the first real compile the recent work has ever had.

Then:

```bash
npm run dev
```

Open http://localhost:3000.

---

## Part 5 — Create your first account

Visit http://localhost:3000/admin/setup

This route creates the initial Owner account and **self-disables** once any
user exists (`app/admin/setup/page.tsx:8` redirects to login when
`db.user.count() > 0`). So it works exactly once.

To test roles properly you need more than one account. Create the Owner here,
then invite Editor / Author / Contributor users from
`/admin/users` once you are signed in.

---

## Part 6 — Test the performance work (commits `ef22c5b`, `a140c65`)

This is where the real risk is. The failure mode is **not** a crash — it is
stale content. That is easy to miss unless you look for it deliberately.

### 6.1 Pages still render

Visit each and confirm nothing is blank or broken:

- `/` — homepage
- `/latest`
- `/category/<some-slug>`
- `/author/<some-slug>`
- `/tag/<some-slug>`
- `/search?q=test`
- `/article/<some-slug>`

What to watch for: cards missing their **image, deck, category name or author
name**. Those pages now use narrow explicit selects instead of fetching whole
rows, so a field I failed to include would show up as a blank spot — not an
error.

### 6.2 Article body still renders

Open any published article. The **full body must be there**.

This is the specific thing to check, because the change removed body columns
from list queries. The article page keeps its own separate query that does
fetch the body. If the article page renders but the body is empty, that query
got caught by mistake.

### 6.3 Author view count is correct

1. Open `/author/<slug>`, note the total views figure.
2. In Prisma Studio, add up `views` across that author's published articles.

These must match. I changed this from a JavaScript sum over the fetched array
to a Postgres aggregate, precisely so capping the list would not under-report
it. If the numbers differ, that change is wrong.

### 6.4 Caching and revalidation — the important one

Public pages are now cached (home/article/category 300s, latest 180s, author
600s). Publishing is supposed to punch through that cache immediately.

**Test publish:**
1. Create a draft, publish it.
2. Immediately — without waiting — check `/`, `/latest`, its `/category/<slug>`
   and its `/author/<slug>`.
3. It must appear on **all four** right away.

**Test unpublish:**
1. Take a published article and unpublish it.
2. Immediately check the same four pages.
3. It must **disappear from all four** right away.

`/latest` and the author page are the ones to watch. Before my change nothing
except the scheduler invalidated `/latest`, and the author page was never
invalidated at all. If an article lingers on either after unpublishing, then
`revalidateArticleRoutes()` is not firing for that transition.

**If content is stale:** hard-refresh first (Ctrl+Shift+R) to rule out your
browser. If it is still stale after that, it is the server cache and it is a
real bug — tell me which action and which page.

### 6.5 Review queue

Go to `/admin/review` as an Editor or Owner. Each card shows a **word count**.

That number must be non-zero and plausible. The review query now uses an
explicit select, and I deliberately kept `contentHtml` in it because the word
count is derived from the body. If every card reads 0 words, I dropped a field
I needed.

---

## Part 7 — Test the console palette (commit `7e8537f`)

Purely visual. 313 hardcoded colours became design tokens.

**Toggle dark mode and back on every screen.** The bug class to look for is
text that has gone invisible or nearly invisible — same-colour text on
same-colour background — because that is what a wrong token mapping produces.

Screens that changed:

- `/admin/subscribers`
- `/admin/audit-logs` (open a log's detail dialog too)
- `/admin/comments`
- `/admin/users`

Specific things I changed by hand and would most like a second pair of eyes on:

- **Selected filter pills** — should invert (dark pill / light text) in light
  mode, and flip in dark mode.
- **Modal scrim** — the dim behind a dialog stays dark in *both* themes. That
  is intentional, not a bug.
- **Status chips** — neutral/grey chips must still be readable in both themes.

Two pages were deliberately **left out of scope** and still use raw colours:
`/admin/login` and `/admin/setup`. They are permanently dark by design. Not a
regression.

---

## Part 8 — Role enforcement (worth re-checking)

The rule is that restrictions are enforced **server-side**, not just hidden in
the UI. Quick check: sign in as an Author, then type an Editor-only URL
directly into the address bar, e.g. `/admin/review`.

You should be blocked or redirected. Being able to see the page means the
guard is UI-only for that route.

---

## Part 9 — Scheduled publishing

The cron endpoint is protected by `CRON_SECRET` and **refuses every request if
that variable is unset** (fails closed, deliberately).

1. Schedule an article for a minute or two in the future.
2. Confirm it is **not** visible publicly yet.
3. Fire the endpoint:

```bash
curl -i -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/cron/publish-scheduled
```

4. The article should now be live on `/` and `/latest`.

Also confirm the negative case — this must return 401:

```bash
curl -i http://localhost:3000/api/cron/publish-scheduled
```

---

## Part 10 — Reporting back

For anything broken, the useful details are:

1. Which part number (e.g. "6.4 unpublish").
2. What you expected vs what happened.
3. Any terminal output from the `npm run dev` window — server errors appear
   there, not in the browser console.

### Known and expected — not bugs

- **~144 ESLint errors** on `npm run lint`, mostly `no-explicit-any`. All
  pre-existing. I verified my changes added none.
- **No email is sent** for any workflow event. Notifications are in-app only;
  email delivery (TASK-17 phase 2) was never built.
- **Missing features**: no media library, no bulk actions, no authors admin
  section, no article detail hub, no revision diff/restore UI. These were
  specified in the plan but never implemented.

---

## Suggested order

If you want the highest-signal path rather than full coverage:

1. **Part 4** — `npm run build`. Never once passed in my environment.
2. **Part 6.4** — publish/unpublish revalidation. Newest and riskiest logic.
3. **Part 6.2** — article body renders.
4. Everything else.

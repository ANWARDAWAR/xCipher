# xSypher — Step-by-Step Testing Guide

How to pull this branch into VS Code and verify every feature, in order, from a
clean machine.

## Read this first

Everything on this branch has **only ever been verified against stubbed data**
by the agent that wrote it — a fake `lib/db.ts` returning hand-written objects,
with a running dev server rendering real HTML. No code here has ever touched a
real PostgreSQL database.

That means this guide is not a formality. It is the first time any of this runs
for real. Two things in particular have never executed at all:

- **The `PublicationSettings` migration** (Part 4). The sandbox could not reach
  `binaries.prisma.sh`, so `prisma validate` and `prisma migrate` both failed.
  The SQL is hand-written. Read it before you run it.
- **The taxonomy merge transaction** and the **bulk action loop** — both do
  multi-row writes that a stub cannot meaningfully exercise.

Work in the order given. Later parts assume data created in earlier ones.

---

## Part 0 — What you are testing

Branch: **`arena/01a0b084-xcipher`** (not `main`).

Ten commits, newest first:

| Commit | Task | What it adds |
|---|---|---|
| `7a964eb` | T33 | Media library (catalog) |
| `b4e3473` | T24 | Publication settings — **has a migration** |
| `f5aa4bc` | T17p2 | Email delivery for notifications |
| `c9ec477` | T23 | Bulk archive / restore / publish / submit |
| `bf9650d` | T25 | Restore an earlier revision |
| `649c29d` | T18 | Article detail hub |
| `6c58248` | T20 | Taxonomy merge |
| `b6f32c8` | T28 | Test suite + CI |
| `b289f26` | T31 | `homepagePlacement` drives the homepage |
| `7463ed9` | T22 | Mobile navigation drawer |

---

## Part 1 — Get the code into VS Code

### Requirements

- **Node 20.x** (the project pins `@types/node@^20`; Node 22+ may work but is
  untested here)
- A PostgreSQL database — Supabase is what this project is configured for
- Git

### Clone (first time)

```bash
git clone https://github.com/ANWARDAWAR/xSypher.git
cd xSypher
git checkout arena/01a0b084-xcipher
code .
```

### Or update an existing checkout

```bash
cd xSypher
git fetch origin
git checkout arena/01a0b084-xcipher
git pull origin arena/01a0b084-xcipher
code .
```

### Confirm you are in the right place

```bash
git log --oneline -1
```

**Expected:** `7a964eb feat(console): add the media library (TASK-33, catalog phase)`

If you see anything else, stop — nothing below will match.

---

## Part 2 — Install

```bash
npm install
```

**Expected:** completes without `ERESOLVE`. It will print some peer-dependency
warnings; those are normal.

> If you hit `ERESOLVE` mentioning `@types/node`, you are on the wrong Node
> major. Use Node 20.

---

## Part 3 — Environment

```bash
cp .env.example .env
```

Open `.env` and fill in:

| Variable | Required? | Notes |
|---|---|---|
| `DATABASE_URL` | **Yes** | Pooled Supabase connection string |
| `DIRECT_URL` | **Yes** | Direct connection — migrations use this |
| `NEXTAUTH_SECRET` | **Yes** | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | **Yes** | `http://localhost:3000` |
| `RESEND_API_KEY` | No | Leave empty for now — Part 13 covers it |
| `CRON_SECRET` | No | Only needed for scheduled publishing |

**Leave `RESEND_API_KEY` empty at this stage on purpose.** Part 13 tests that
the app works correctly without it, which is a real bug that was fixed on this
branch.

---

## Part 4 — Database migration ⚠️

**This is the riskiest step on the branch. Read before running.**

### 4.1 Read the migration first

Open `prisma/migrations/20260918010000_add_publication_settings/migration.sql`.

It creates one table, `PublicationSettings`, with all-nullable columns and
inserts nothing. It does not alter or drop anything else.

This SQL was **hand-written** — `prisma validate` could not run in the
environment where it was authored. Satisfy yourself it is correct before
applying it to a database you care about.

### 4.2 Back up (if this database has real data)

Take a Supabase snapshot, or:

```bash
pg_dump "$DIRECT_URL" > backup-before-migration.sql
```

### 4.3 Generate the client and check migration status

```bash
npx prisma generate
npx prisma migrate status
```

**Expected:** it reports `20260918010000_add_publication_settings` as pending.

### 4.4 Apply

```bash
npx prisma migrate deploy
```

**Expected:** `1 migration applied`.

### 4.5 Verify the table exists and is empty

```bash
npx prisma studio
```

Open `PublicationSettings` in the browser. **Expected: the table exists with
zero rows.** Empty is correct — every field falls back to a built-in default
until someone saves settings. Close Studio (Ctrl+C) when done.

### Rollback

If anything goes wrong:

```sql
DROP TABLE "PublicationSettings";
```

Nothing else references it.

---

## Part 5 — Automated tests (fast confidence check)

Before touching the UI, run the suite. This is new on this branch.

```bash
npm test
```

**Expected:**

```
 ✓ tests/workflow.test.ts       (32 tests)
 ✓ tests/capabilities.test.ts   (30 tests)
 ✓ tests/email-prefs.test.ts    (10 tests)
 ✓ tests/email.test.ts          (3 tests)
 ✓ tests/settings.test.ts       (5 tests)
      Tests  80 passed (80)
```

These need no database and no network. **If any fail, stop and report it** —
they cover the permission matrix and the article state machine, so a failure
here means something is wrong with authorization itself.

### Prove the tests actually bite

Worth doing once so you trust them. Temporarily break a permission:

1. Open `lib/capabilities.ts`
2. Find `AUTHOR_CAPS` and add `"article.publish",` to the set
3. Run `npm test`

**Expected: 3 tests fail** across `capabilities.test.ts` and `workflow.test.ts`.

Undo the change (`git checkout lib/capabilities.ts`) and confirm 80 pass again.

---

## Part 6 — Build and start

```bash
npm run build
```

**Expected:** completes. Warnings about Google Fonts are fine.

```bash
npm run dev
```

Open http://localhost:3000.

---

## Part 7 — Create accounts

Visit http://localhost:3000/admin/setup

Create the **OWNER** account. (This page redirects to login once any user
exists, so it only works once.)

Then, so you can test role restrictions properly, create these via
**Admin → Users → Invite** or directly in Prisma Studio:

| Role | Why you need it |
|---|---|
| OWNER | You already have it |
| EDITOR | Tests the merge and settings restrictions |
| AUTHOR | Tests scoping — the most important role to check |

If creating users through Studio, also create an `Author` profile row and set
the user's `authorId` to it, otherwise the AUTHOR will have no byline and
ownership checks will behave oddly.

### Seed some content

There is no seed script. Create by hand, as OWNER:

- 2 categories, e.g. **AI** and **A.I.** (deliberate near-duplicates for Part 9)
- 2 tags
- **4–5 articles** in different statuses: at least one DRAFT, one SUBMITTED, one
  PUBLISHED, one ARCHIVED
- Assign a **lead image** to at least 3 of them, and **use the same image URL on
  two different articles** (for Part 14)
- Assign at least two articles to the AUTHOR account, and leave the rest owned
  by OWNER

Use Unsplash or Pexels URLs — other hosts are rejected by the allowlist.

---

## Part 8 — T18: Article detail hub

**Commit `649c29d`**

### 8.1 The headline now opens a detail page, not the editor

1. Go to **Admin → Articles**
2. Click an article **headline**

**Expected:** you land on `/admin/articles/<id>` — a read-only page with the
status, byline, milestones and history. **Not** the editor.

The **pencil icon** on the row still goes straight to the editor.

### 8.2 The page shows real history

On the detail page, check the **History** section.

**Expected:** revisions and review decisions interleaved in one list, newest
first. If you have requested changes on an article, the **full rejection reason
text** appears — not truncated.

### 8.3 Milestones only list dates that happened

**Expected:** a fresh draft shows only *Created* and *Last updated*. It does not
show eight rows of "—".

### 8.4 Scoping — the security check ⚠️

1. Copy the URL of an article owned by **OWNER** that is in **DRAFT**
2. Sign out, sign in as **AUTHOR**
3. Paste that URL

**Expected: a 404 page.**

**Now the important part.** Look at the **browser tab title**.

**Expected:** `Article | xSypher`

**A failure looks like:** the real article headline in the tab, e.g.
`Quantum chips reach viability | xSypher`.

> This was a genuine bug found while building this feature. `generateMetadata`
> runs separately from the page, so the page 404'd correctly while the title
> still leaked. If you see the real headline here, the fix regressed — report it.

---

## Part 9 — T20: Taxonomy merge

**Commit `6c58248`**

### 9.1 As OWNER

1. **Admin → Taxonomy**
2. Find your duplicate categories (**AI** and **A.I.**)
3. Click the **merge icon** (arrows joining) on **A.I.**
4. A dialog opens. **Expected:** the confirm button is **disabled** until you
   pick a destination
5. Choose **AI**, confirm

**Expected:**
- Toast: `Merged "A.I." into "AI". N articles reassigned.`
- **A.I.** disappears from the list
- **AI**'s article count has grown by N

### 9.2 Verify in the database

```bash
npx prisma studio
```

**Expected:** no `Category` row for A.I.; every article that had it now has the
AI `categoryId`. **No article should have a null `categoryId`** as a result of
the merge — that would mean articles were orphaned instead of moved.

### 9.3 Tag merge handles the overlap case

This is the tricky one. Set up deliberately:

1. Create tags **LLM** and **llms**
2. Put **both tags on the same article**
3. Put **only `llms`** on a second article
4. Merge `llms` → `LLM`

**Expected:**
- Toast reports **1** article reassigned, not 2 — the article that already had
  both is not counted twice
- In Studio: the first article has **one** `LLM` tag, not a duplicate
- No unique-constraint error

### 9.4 As EDITOR — the permission check

Sign in as EDITOR, go to **Taxonomy**.

**Expected:** **no merge icons.** Edit and delete icons are still there.

`taxonomy.merge` is OWNER/ADMIN only — an editor runs content but does not get
to collapse the site's taxonomy.

---

## Part 10 — T25: Restore an earlier revision

**Commit `bf9650d`**

### 10.1 Build some history

Take a DRAFT article. Edit and save it **three times**, changing the headline
each time so you can tell versions apart.

### 10.2 Restore

1. Open the article's **detail hub** (`/admin/articles/<id>`)
2. In **History**, find the second-oldest revision
3. **Expected:** it has a **"Restore this version"** link. The **newest**
   revision does **not** — restoring what you already have would be a no-op
4. Click it, read the dialog, confirm

**Expected:**
- Toast: `Version restored.`
- The headline reverts to that older version
- **A new entry appears at the top of the history** saying
  `Restored the version saved on <date>`

### 10.3 The key property — restore is not destructive

**Expected:** the version you just replaced is **still in the history** and can
itself be restored. Restore copies forward; it does not roll back and erase.

Verify by restoring the version you started from. You should be able to move
back and forth indefinitely.

### 10.4 Published articles refuse

1. Publish an article
2. Open its detail hub

**Expected: no restore links at all**, though the history still displays.

Swapping a live article's body from history is a content change readers see
immediately, so it asks you to unpublish first.

### 10.5 Ownership

As **AUTHOR**, open one of **your own** drafts with history.

**Expected:** restore links present.

Now open an article owned by someone else that you can see.

**Expected:** no restore links.

---

## Part 11 — T23: Bulk actions

**Commit `c9ec477`**

### 11.1 Selection

1. **Admin → Articles** as OWNER
2. **Expected:** a checkbox column on the left, plus a **select-all** checkbox
   in the header
3. Tick two articles

**Expected:** a dark **action bar appears at the bottom** of the screen reading
`2 selected`, with Submit / Publish / Archive / Restore to draft.

### 11.2 A clean bulk operation

Select two **DRAFT** articles → **Archive** → confirm.

**Expected:** toast `2 articles updated.` Both now show ARCHIVED.

### 11.3 Partial success — the important behaviour ⚠️

Deliberately mix states. Select **one DRAFT and one already-ARCHIVED** article,
then click **Archive**.

**Expected:** a toast like
`1 updated, 1 skipped: <title of the archived one>.`

**A failure looks like:** everything rolls back and nothing is archived, or a
generic "failed" with no detail.

Each article is validated separately and on purpose — one bad row must not undo
thirty-nine good ones, and you should be told exactly which was skipped.

### 11.4 Select-all is page-only

If you have more articles than fit one page, go to page 1, tick select-all,
then go to page 2.

**Expected:** page 2's rows are **not** selected. "Select all" means this page,
never "all 4,000 matching" — that is a much more dangerous operation and is
deliberately not offered.

### 11.5 Role gating

| Sign in as | Expected bar contents |
|---|---|
| OWNER | Submit, Publish, Archive, Restore |
| AUTHOR | **Submit only** |
| EDITOR | Submit, Publish, Archive, Restore |

As AUTHOR, **Publish and Archive must not appear.**

### 11.6 Server-side enforcement ⚠️

UI hiding is not security. To check the server actually enforces this:

1. Sign in as **AUTHOR**
2. Open DevTools → Console
3. Select some articles, then try to invoke publish directly:

Simplest safe version — select an article owned by **someone else** and use the
**Submit** button (the one AUTHOR does have).

**Expected:** the toast reports it as **skipped**, with an ownership message.
The article's status must be unchanged in Studio.

---

## Part 12 — T24: Publication settings

**Commit `b4e3473`** — depends on the Part 4 migration.

### 12.1 Nothing changed by default ⚠️

**Before opening the settings page at all**, load the public homepage and check
the browser tab / page source `<title>`.

**Expected, exactly:**

```
xSypher — Independent Technology News, Analysis and Reviews
```

This must be **byte-for-byte what it was before this branch**. The migration
creates an empty table, and every field falls back to the old hardcoded value.
If your site silently renamed itself on deploy, that is a serious regression.

### 12.2 The Publication tab

As OWNER: **Admin → Settings**.

**Expected:** a third tab, **Publication**, next to Public Profile and Account
Security.

Open it. **Expected:** all fields are **empty**, with the current effective
values shown as **grey placeholders** (`xSypher`, `@xSypherTech`, and so on).

Empty means "use the default" — that is why they are placeholders and not
pre-filled values. It is also how you clear a field back to the default later.

### 12.3 Save and verify it takes effect

Set **Publication name** to `The Cipher Post` and **Tagline** to
`Technology, examined`. Save.

**Expected:** toast confirms, then reload the **public homepage**.

The `<title>` should now read:

```
The Cipher Post — Technology, examined
```

### 12.4 Clearing restores the default

Go back, **clear both fields**, save, reload the homepage.

**Expected:** the title returns to the original `xSypher — Independent
Technology News...`.

### 12.5 Bad image URLs are rejected

In **Logo URL**, enter `https://evil-cdn.example.com/logo.png`. Save.

**Expected:** an error — `Logo URL is invalid or from an unapproved domain.`
Nothing saved.

### 12.6 EDITOR cannot reach it

Sign in as EDITOR → **Settings**.

**Expected:** **no Publication tab.**

Now type `/admin/settings?tab=publication` directly into the address bar.

**Expected:** the page loads but **the form does not render**. Other tabs still
work.

---

## Part 13 — T17 phase 2: Email

**Commit `f5aa4bc`**

### 13.1 Without a key — the regression check ⚠️

Do this **first**, with `RESEND_API_KEY` still empty in `.env`.

1. As AUTHOR, **submit an article for review**

**Expected:**
- The transition **succeeds**
- An **in-app notification** appears for reviewers (bell icon in the console
  header)
- **No crash**, and no error in the terminal about a missing API key

> This is the real bug that was fixed here. `new Resend(undefined)` throws at
> construction, and the client used to be built at module load — so importing
> the email module without a key crashed. Harmless while only invitations used
> it; fatal once every workflow transition did. **If submitting an article
> throws a "Missing API key" error, the fix regressed.**

### 13.2 With a key

1. Get a key from [resend.com](https://resend.com) (free tier is fine)
2. Add `RESEND_API_KEY="re_..."` to `.env`
3. Restart the dev server
4. Make sure your reviewer account has a **real email address** you can check
5. As AUTHOR, submit another article

**Expected:** the reviewer gets an email with the article title as the subject
and an **"Open in the newsroom"** button linking back to the review page.

> Resend's test mode will only deliver to the address that owns the API key.
> Set your reviewer's email to that address.

### 13.3 Opt-out actually works

1. As the reviewer, go to **Settings → Account Security**
2. Turn **email alerts off**, save

**Expected:** toast says `Notification preferences saved.` — **not**
`(Mock)`.

> The old form was a `setTimeout` that showed "(Mock)" and threw the change
> away. If you see the word "Mock", you are running old code.

3. Verify in Prisma Studio: the user's `notificationPrefs` is now
   `{"emailAlerts": false, ...}`
4. Submit another article

**Expected:** in-app notification still appears; **no email**.

### 13.4 A title with an apostrophe

Create an article titled `The AI "boom" & what's next`, submit it.

**Expected:** the email renders the title correctly — no broken markup, no raw
`&amp;` visible in the body.

---

## Part 14 — T33: Media library

**Commit `7a964eb`**

### 14.1 The page

**Admin → Media** (in the sidebar under Content).

**Expected:** a grid of every lead image on articles you can see.

### 14.2 Reuse is grouped

You put the same image URL on two articles in Part 7.

**Expected:** it appears **once**, labelled `Used on 2 articles`, with both
titles listed as links.

**A failure looks like:** the same picture appearing as two separate tiles.

### 14.3 The counts add up

**Expected:** the header count equals the number of **distinct** image URLs, not
the number of articles. The filter buttons show `all (N)`, `unapproved (N)`,
`reused (N)`.

### 14.4 Unapproved hosts are flagged

Edit an article's image URL directly in Prisma Studio to
`https://evil-cdn.example.com/x.jpg`, then reload Media.

**Expected:**
- A warning line at the top: `1 image points at a host that is not on the
  approved list`
- That tile carries a **"Not approved"** badge
- The `unapproved` filter finds it

### 14.5 A broken URL does not break the page

In Studio, set an article's image to `/uploads/old.jpg` (a relative path).

**Expected:** the tile shows **"Invalid URL"** and, once the image fails to
load, a **"Failed to load"** placeholder. The page keeps working.

### 14.6 Scoping ⚠️

Sign in as **AUTHOR**.

**Expected:** the Media page shows only images from **published articles plus
the author's own**. Images belonging to other people's DRAFT or SUBMITTED
articles must **not** appear, and neither must their titles.

A lead image can give away an unannounced story as easily as its headline.

---

## Part 15 — Regression checks on earlier work

These shipped earlier on the branch but should be re-checked now that later
commits have touched the same screens.

### 15.1 T22 — Mobile drawer

Resize the browser to **under 900px wide**, or use a real phone.

**Expected:** the sidebar collapses to a **hamburger**. Tapping it slides a
drawer in with a dark scrim behind. Tapping the scrim, pressing Escape, or
choosing a link closes it.

> This genuinely needs a narrow viewport. CSS transitions and touch scrolling
> cannot be checked any other way.

### 15.2 T31 — Homepage placement

1. Edit an article → set **Homepage placement** to `hero` → publish
2. Load the public homepage

**Expected:** that article is the **lead story**.

Now set another to `featured`.

**Expected:** it heads the **breaking ticker**.

Finally, clear placement on everything.

**Expected:** the homepage still works — the lead falls back to the newest
article and **the ticker still renders**. It must not vanish.

### 15.3 Role enforcement generally

As **AUTHOR**, type these into the address bar directly:

| URL | Expected |
|---|---|
| `/admin/users` | Redirect away |
| `/admin/audit-logs` | Redirect away |
| `/admin/authors` | Redirect away |
| `/admin/taxonomy` | Redirect away |
| `/admin/articles` | **Works** — but only their own + published |
| `/admin/media` | **Works** — scoped the same way |

---

## Part 16 — Lint and CI

```bash
npx tsc --noEmit
```

**Expected:** clean, now that `prisma generate` has run in Part 4.

```bash
npm run lint
```

**Expected:** **192 problems (146 errors, 46 warnings)**.

**This is pre-existing debt, not new breakage** — almost entirely
`@typescript-eslint/no-explicit-any` in files that predate this work. CI
(`.github/workflows/ci.yml`) reports lint but deliberately does **not** fail on
it, because gating every PR on that backlog would help nobody. CI *does* fail on
typecheck and tests.

---

## Part 17 — What to report back

For anything that fails, please include:

1. **Which part and step** (e.g. "Part 11.3")
2. **What you expected** vs **what happened**
3. The **terminal output** if the server errored
4. A **screenshot** for anything visual
5. Your **role** at the time — most of these behave differently per role

### Highest-value things to check

If you only have time for a few, do these — they are the ones with real
consequences:

| Priority | Check | Why |
|---|---|---|
| 1 | **Part 4** — migration applies cleanly | Never executed anywhere |
| 2 | **Part 8.4** — no title leak on 404 | Information disclosure |
| 3 | **Part 12.1** — site title unchanged by default | Silent rename on deploy |
| 4 | **Part 13.1** — submit works with no API key | Would break every transition |
| 5 | **Part 11.3** — partial bulk success | Transaction semantics, never really run |
| 6 | **Part 9.3** — tag merge overlap | Unique-constraint risk |
| 7 | **Part 14.6 / 8.4** — AUTHOR scoping | Unpublished content leaking |

### Known and expected — not bugs

- **Google Fonts warnings** in the terminal — the sandbox could not reach
  `fonts.googleapis.com`; harmless locally too if you are offline
- **~146 ESLint errors** — pre-existing, documented above
- **`middleware` deprecation warning** from Next 16 — unrelated to this work
- **An empty `PublicationSettings` table** — correct; defaults apply
- **Prisma Studio showing zero rows** in a table simply means empty, not broken

---

## Quick reference

```bash
# Setup
git checkout arena/01a0b084-xcipher && npm install
cp .env.example .env            # then fill it in
npx prisma generate
npx prisma migrate deploy       # read the SQL first
npm test                        # 80 tests, no DB needed
npm run dev

# Verification
npx prisma studio               # inspect data directly
npx tsc --noEmit                # typecheck
npm run lint                    # ~190 pre-existing problems
```

### Suggested order if you are short on time

Parts **1 → 4 → 5 → 6 → 7**, then **8.4**, **12.1**, **13.1**, **11.3** — the
four checks most likely to surface something real.

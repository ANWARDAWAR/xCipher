# Local Setup & Test — xSypher

Branch: `arena/01a0b084-xcipher`

Is guide ka maqsad: repo ko VS Code mein chala kar khud test karna.
Har command copy-paste ke liye ready hai.

---

## 0. Zaroori cheezein

| Cheez | Version | Check karne ka command |
|---|---|---|
| Node.js | 20+ (yahan 22.22.3 test hua) | `node -v` |
| npm | 10+ | `npm -v` |
| PostgreSQL | koi bhi chalta hua instance (local ya Supabase/Neon) | — |
| Git | koi bhi | `git --version` |

Database zaroori hai. Iske bagair console nahi chalega — app har page pe
Postgres se baat karta hai.

---

## 1. Code laao (fetch)

Agar repo pehle se cloned hai:

```bash
cd path/to/xSypher
git fetch origin
git checkout arena/01a0b084-xcipher
git pull origin arena/01a0b084-xcipher
```

Agar bilkul naya clone karna hai:

```bash
git clone https://github.com/ANWARDAWAR/xSypher.git
cd xSypher
git checkout arena/01a0b084-xcipher
```

Confirm karein ke sahi commit pe hain:

```bash
git log --oneline -3
```

Sab se upar ye hona chahiye:

```
9761161 Make editor autosave network-resilient; add sync status indicator
fd5803f Fix draft duplication; add editor crash recovery and button loading states
05fe18e Unify console colour on theme tokens; fix toast type and mobile placement
```

---

## 2. Dependencies install karein

```bash
npm install
```

---

## 3. Environment file banayein

```bash
cp .env.example .env
```

Ab `.env` khol kar asli values daalein:

```bash
code .env
```

Kam se kam ye teen **zaroori** hain:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/xsypher"
DIRECT_URL="postgresql://user:password@localhost:5432/xsypher"
NEXTAUTH_SECRET="yahan-random-secret"
NEXTAUTH_URL="http://localhost:3000"
```

`NEXTAUTH_SECRET` banane ke liye:

```bash
openssl rand -base64 32
```

Baaki **optional** hain:

- `RESEND_API_KEY` — na ho to email nahi jayegi, lekin console theek chalega
  aur in-app notifications phir bhi save hongi.
- `CRON_SECRET` — sirf scheduled publishing endpoint ke liye.
  Na ho to `/api/cron/publish-scheduled` har request reject karega.
- `NEXT_PUBLIC_SUPABASE_*` — sirf tab jab Supabase use kar rahe hon.

---

## 4. Prisma client generate karein

```bash
npx prisma generate
```

> Ye step zaroori hai. Is ke bagair `tsc` aur editor dono
> `Module '@prisma/client' has no exported member 'Role'` jaisi errors dikhayenge.

---

## 5. Database migrate karein

Khali/nayi database pe:

```bash
npx prisma migrate deploy
```

Development mein (schema change karte waqt):

```bash
npx prisma migrate dev
```

Teen migrations apply honi chahiyein:

```
0_init
20260918000000_backfill_review_to_submitted
20260918010000_add_publication_settings
```

> **Note:** `20260918010000_add_publication_settings` ki SQL haath se likhi gayi
> thi, kyunke jis sandbox mein kaam hua wahan Prisma engine download nahi ho
> sakta tha. Ye additive hai (sirf `CREATE TABLE "PublicationSettings"`, koi row
> insert nahi karti) — lekin **asli database pe pehli dafa chalane se pehle ek
> nazar zaroor daal lein**:
>
> ```bash
> cat prisma/migrations/20260918010000_add_publication_settings/migration.sql
> ```

Database theek se juda hai ya nahi, dekhne ke liye:

```bash
npx prisma studio
```

---

## 6. App chalayein

```bash
npm run dev
```

Khol ein: <http://localhost:3000>

Pehli dafa admin account banane ke liye: <http://localhost:3000/admin/setup>

Console: <http://localhost:3000/admin>

---

## 7. Checks chalayein

```bash
# TypeScript — 0 errors aani chahiyein
npx tsc --noEmit

# Tests — 100 pass hone chahiyein (7 files)
npm test

# Production build
npm run build

# Lint
npm run lint
```

### In natijon ki tawaqqu rakhein

| Command | Expected |
|---|---|
| `npx tsc --noEmit` | **0 errors** (step 4 ke baad) |
| `npm test` | **100 passed (7 files)** |
| `npm run build` | Success |
| `npm run lint` | **191 problems (146 errors, 45 warnings)** |

> Lint ke 191 problems **pehle se maujood** hain — ye is branch ke kaam se nahi
> aaye. Zyada tar `no-explicit-any` aur `no-unused-vars` hain. Maine jo files
> chhui unka count pehle se barabar ya kam hai. Inhe alag se saaf karna ek
> mustaqil task hai.

---

## 8. Jo cheezein is branch mein banayi/theek ki gayin — unhe test karein

### A. Draft duplication bug (sab se ahem)

Ye asal masla tha. Test:

1. `/admin/editor` kholein (naya article).
2. Title likhein, phir body mein kuch likhein.
3. **3 second rukein** (autosave debounce).
4. Ab aur likhein, phir rukein. 3–4 dafa ye dohrayein.
5. Browser ka URL dekhein — pehle save ke baad `/admin/editor/<id>` ban jana chahiye.
6. `/admin/articles` kholein.

**Expected:** sirf **EK** draft. Pehle har autosave nayi row banata tha.

### B. Sync status indicator

Top bar mein, word count ke barabar mein:

| Aap kya karein | Kya dikhna chahiye |
|---|---|
| Likhna shuru karein | `Edited` |
| 2.5s rukein | `Saving…` (spinner ke sath) |
| Save kamyab | `Saved to cloud` (hara) |
| Network band karein, phir likhein | `Offline — saved locally` (amber) |

### C. Offline recovery (crash resilience)

1. Editor mein kuch likhein.
2. DevTools → Network → **Offline** kar dein.
3. Aur likhein. Status `Offline — saved locally` ho jayega.
4. **Tab band kar dein** bina save kiye.
5. Network wapas on karein, wahi editor URL dobara kholein.

**Expected:** upar ek amber banner — *"You have unsaved offline changes from …"*
— jis mein **Restore** aur **Discard** buttons hon.

- **Restore** → aapka likha hua wapas aa jayega.
- **Discard** → local copy mit jayegi, server wali rahegi.

> Jaan bujh kar automatic restore nahi kiya gaya. Server wali copy nayi ho sakti
> hai (dusra device, ya co-author) — usay chupke se purani local copy se badalna
> asal masle se bhi bura hota.

### D. Loading spinners / double-click

1. DevTools → Network → **Slow 3G**.
2. "Save Draft" ya "Submit for Review" dabayein.

**Expected:** button turant disabled ho, andar ghoomta hua spinner aaye, aur
text badal jaye ("Publishing…", "Submitting…"). Dobara click kaam na kare.

### E. Discard button

Editor ke top bar mein "Discard":

- **Naya** article → form khali ho jaye, cache saaf.
- **Save shuda** article → server wali copy dobara load ho.
  Ye kabhi server se article delete nahi karta.

### F. Toast icons (pichle commit se)

Koi bhi aisa kaam karein jo fail ho (jaise khali title ke sath publish).

**Expected:** toast pe **laal cross** aaye. Pehle har toast — errors samet —
hara tick dikhata tha, kyunke 91 mein se kisi call site ne type pass hi nahi kiya tha.

### G. Dark / light mode

Console mein theme toggle chalayein.

**Expected:** laal rang dono modes mein theek lage. Pehle hardcoded
`red-600` wagera theme ke sath badalte nahi the, is liye dark mode mein
light-mode wala laal dikhta tha.

---

## 9. Kuch masle aur unka hal

**`Module '@prisma/client' has no exported member 'Role'`**
→ `npx prisma generate` chalayein (step 4).

**`Can't reach database server`**
→ `.env` mein `DATABASE_URL` check karein; Postgres chal raha hai ya nahi dekhein.

**`next dev` foran band ho jaye**
→ `.env` file maujood honi chahiye. Bagair iske boot nahi hoga.

**Build pe Google Fonts ki error**
→ Internet chahiye. Sandbox mein isi wajah se build fail hoti thi — code ki
galti nahi thi.

**Port 3000 already in use**
→ `npm run dev -- -p 3001`

---

## 10. Jo abhi baqi hai

Ye is branch mein **nahi** hua — aap ne khud sequence kiya tha ke pehle editor:

- **Phase 1 — RBAC:** `OWNER` se `article.delete` hatana, `EDITOR` se
  `article.review` hatana (dono aap ne confirm kiye the).
- **Phase 4 — Dashboard:** author ke liye alag status board
  (Drafts / Pending / Changes Requested / Published), aur avatars pe
  `aspect-square object-cover rounded-full`.

Tafseeli manual test cases ke liye `TESTING_GUIDE.md` dekhein.

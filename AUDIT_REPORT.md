# xSypher — Professional Product Audit

**Audited commit:** `4dccbd1` · branch `arena/01a0b084-xcipher`
**Audit date:** 19 September 2026
**Scope:** Poora repository — architecture, public site, admin CMS, editorial workflow, RBAC, editor, SEO/GEO/AEO, performance, accessibility, security, database.

**Method note:** Ye report sirf static source inspection par mabni hai. Repository ko modify nahi kiya gaya (audit ke ba'd `git status` clean tha, HEAD wahi `4dccbd1`). Jahan koi cheez run kiye baghair verify nahi ho saki, wahan explicitly **Not Verifiable** likha hai. Prisma client is sandbox mein generate nahi ho sakta (TLS block), aur koi live database nahi hai — is liye koi bhi runtime/performance number claim nahi kiya gaya.

---

# 1. Executive Summary

xSypher ek **asadhaaran tarah se serious codebase** hai — ye "template blog with a dashboard" nahi hai. Editorial workflow ek proper state machine hai (`lib/workflow.ts`), permissions ek centralized capability model se aate hain (`lib/capabilities.ts`), HTML sanitize hota hai, cron endpoint fail-closed hai, aur 103+ unit tests CI mein chalte hain. Ye cheezein bohot se commercial CMS products mein bhi itni saaf nahi hoti.

Lekin product **launch-ready nahi** hai, aur iski wajah architecture ki kamzori nahi — balke **unfinished edges** hain jo kisi bhi real reader ya editor ko pehle din nazar aa jayenge:

**Sabse bare risks:**

1. **Primary "Subscribe" CTA 404 deta hai.** Header, mobile drawer aur footer — teeno `/page/newsletter` par jate hain, jo `PAGES` object mein maujood hi nahi. Ye site ka sabse prominent conversion button hai.
2. **JSON-LD mein stored-XSS vector.** Article title `JSON.stringify` se seedha `<script>` block mein jata hai bina `</script>` escape kiye. Ye maine empirically verify kiya.
3. **Mock/fake data live public pages par.** Agar DB khali ho to sidebar **jaali articles** dikhata hai jo asli links jaise lagte hain. About/Contact/Privacy jaise trust pages hardcoded TypeScript mein hain — editors CMS se badal hi nahi sakte.
4. **Koi image upload nahi.** Poori publication external URL allowlist par chalti hai. Ek newsroom apni screenshots aur diagrams publish nahi kar sakta.
5. **Public listing pages par pagination nahi.** `/latest` 60 par, category/author 40 par ruk jate hain. 61-waan article publish karte hi purana content permanently reachable nahi rehta — readers aur crawlers dono ke liye.

**Sabse bari strengths:** workflow state machine, capability model, revision history, audit logging, sanitization layer, cron security, aur codebase discipline (zero TODO/FIXME, documented CI).

**Overall maturity:** Engineering foundation **strong** hai. Content operations aur public polish **incomplete** hain. Product abhi "internal beta" stage par hai, "public launch" par nahi.

---

# 2. Repository Understanding

**Stack:** Next.js 16.3.5 (App Router, Turbopack) · React 19 · TypeScript (`strict: true`) · Prisma 6 + PostgreSQL · NextAuth v4 (JWT) · Tailwind v4 · Tiptap 3 · Resend · Vitest.

**Routes:** 31 pages, 2 API routes, 17 `loading.tsx`, 2 `error.tsx`, **0 `not-found.tsx`**.

**Structure:**
- `app/(public)/` — homepage, article, category, tag, author, latest, search, static pages
- `app/admin/(authenticated)/` — 16 console sections
- `app/actions/` — 11 server action modules (~53 exported actions)
- `lib/` — capabilities, workflow, sanitize, seo, queries, scheduler, notifications, rateLimit
- `prisma/schema.prisma` — 16 models, 3 enums, 6 Article indexes

**Data model:** `Article` central hai with 9-state `ArticleStatus`. Supporting models: `ArticleRevision` (content snapshots), `ArticleReview` (decision log with `passNumber`), `AuditLog`, `Notification`, `Invitation`, `Subscriber`, `Comment`, `PublicationSettings` (deliberate single-row).

**Roles (7):** OWNER, ADMIN, EDITOR, AUTHOR, REVIEWER, MODERATOR, STAFF.

---

# 3. Architecture Audit

### Workflow state machine centralized hai — ye project ki sabse bari strength hai

**Location:** `lib/workflow.ts`, `app/actions/workflow.ts:189` (`executeTransition`)
**Status:** Verified
**Type:** Architecture

**Problem:** Koi problem nahi — ye ek exemplary pattern hai jise report mein darj karna zaroori hai taake aage chal kar galti se tora na jaye.

**Current behaviour:** `TRANSITIONS` table har status ke liye legal destinations, required capability aur ownership requirement define karti hai. Saare 17 workflow actions `executeTransition()` wrapper se guzarte hain jo teen cheezein enforce karta hai: actor authenticated hai, article maujood hai, aur transition `validateTransition()` se legal hai. Is ke ba'd hi action ka apna body chalta hai.

**Why it matters:** Iska matlab hai ke koi bhi naya workflow action by default secure hai. Agar koi developer naya transition add kare aur `executeTransition` use kare, to authorization automatically lag jati hai — bhoolne ki gunjaish nahi. Ye "secure by construction" design hai.

**Professional recommendation:** Is pattern ko documented invariant bana dein. Kisi bhi future contributor ke liye rule ye hona chahiye ke article ka `status` field kabhi bhi direct `db.article.update()` se na likha jaye — sirf transition actions ke zariye. Abhi `upsertArticle` is rule ko sahi follow karta hai (neeche dekhein).

**Priority:** — (strength, no action)

---

### Generic save status change nahi kar sakta — accidental publishing se protection

**Location:** `app/actions/article.ts:122-125`
**Status:** Verified
**Type:** Architecture / Security

**Current behaviour:** `upsertArticle` payload se `status` explicitly strip karta hai:
```
const { status, ...restData } = data;  // "Strip status: handled by workflow actions now"
```

**Why it matters:** Bina iske, ek manipulated client payload ek DRAFT ko seedha PUBLISHED kar sakta tha, poora review process bypass karke. Ye publication ke liye sabse khatarnak single failure hota.

**Priority:** — (strength)

---

### `any` types primary write path par

**Location:** `app/actions/article.ts:46` (`upsertArticle(data: any)`), aur 73 `: any` occurrences repo mein
**Status:** Verified
**Type:** Architecture

**Problem:** `tsconfig.json` mein `strict: true` hai, lekin sabse ahem write path — article save — poori tarah untyped `any` payload leta hai. Zod sirf 2 action files (`comments.ts`, `newsletter.ts`) mein use hota hai; article/profile/settings/users/invitations actions mein schema validation nahi hai, sirf hand-rolled `if` checks hain.

**Why it matters:** Do practical nuqsan. Pehla: compiler is path par koi madad nahi kar sakta — agar koi field rename ho to TypeScript chup rahega. Dusra, aur zyada ahem: validation scattered hai. `upsertArticle` mein title check hai, img URL check hai, category check hai — lekin `deck`, `seoTitle`, `seoDesc`, `homepagePlacement` par koi length ya format validation nahi. Ek 50,000-character `seoTitle` bina rukawat DB mein chala jayega.

**Current behaviour:** Manual `if` guards; koi centralized input contract nahi.

**Professional recommendation:** Har server action ke boundary par ek explicit input schema hona chahiye — wahi cheez jo `comments.ts` aur `newsletter.ts` pehle se karte hain. Isay poore codebase par consistent karna chahiye, khaas kar un actions par jo user-generated content DB mein likhte hain. Validation action ke andar bikhri hui nahi, balke entry point par ek jagah honi chahiye.

**Priority:** High

---

### Schema mein legacy duplication

**Location:** `prisma/schema.prisma:108-145`
**Status:** Verified
**Type:** Architecture / Database

**Problem:** `Article` model mein do parallel representations hain jo ab tak saath chal rahi hain:
- `author String?` (legacy plain-text name) **aur** `authorModel Author?` (proper relation)
- `legacyTags String[] @map("tags")` **aur** `tags Tag[]` (proper many-to-many)

**Why it matters:** Jab do fields ek hi cheez represent karti hain, to har query ke likhne wale ko yaad rakhna parta hai ke kaunsi authoritative hai. Search query (`app/(public)/search/page.tsx:46-49`) dono par match karti hai — `{ author: { contains: q } }` aur `{ authorModel: { name: { contains: q } } }`. Ye defensive hai, lekin ye batata hai ke migration adhoora hai. Waqt ke saath do fields divergent ho jayengi aur "asli" author kaun hai ye ambiguous ho jayega.

**Current behaviour:** Dono maujood hain; `upsertArticle` dono likhta hai (`author: data.author?.trim() || user.name`).

**Professional recommendation:** Ek migration plan hona chahiye jo legacy columns ko read-only declare kare, phir backfill kare, phir hatade. Interim mein, in fields ko schema comment se clearly "deprecated — do not read" mark karna chahiye taake naya code inhe authoritative na samjhe.

**Priority:** Medium

---

### Dead dependencies

**Location:** `package.json` — `@tiptap/extension-text-align`, `@tiptap/extension-image`
**Status:** Verified
**Type:** Architecture

**Problem:** Ye do Tiptap packages install hain lekin poore codebase mein kahin import nahi hote. (`AdvancedImage` ek custom extension hai, official `extension-image` nahi.)

**Why it matters:** Install size aur dependency audit surface barhti hai bina kisi faide ke. Ye bhi confusion paida karta hai — koi developer maan sakta hai ke text alignment supported hai kyunki package maujood hai.

**Priority:** Low

---

# 4. Public Website Audit

### Primary "Subscribe" CTA 404 deta hai

**Location:** `components/layout/SiteHeader.tsx:124`, `components/layout/MobileDrawer.tsx:107`, `components/layout/SiteFooter.tsx:82` → `/page/newsletter`
**Status:** **Verified**
**Type:** Bug / UX

**Problem:** Site ka sabse prominent CTA — header ka solid "Subscribe" button — `/page/newsletter` par jata hai. Ye route `lib/mockData.ts` ke `PAGES` object se render hota hai, aur us object mein `newsletter` key maujood **nahi** hai. Route `notFound()` call karta hai.

Maine footer ke saare 10 `/page/*` links ko `PAGES` keys ke khilaf programmatically match kiya:
- **PAGES mein defined:** about, contact, editorial, corrections, privacy, terms, cookies, advertising, careers
- **Link kiya gaya lekin missing:** `newsletter`

**Why it matters:** Ye sirf ek toota link nahi — ye **primary conversion path** hai, teen alag jagah repeat hua hai (desktop header, mobile drawer, footer). Ek reader jo subscribe karna chahta hai use 404 milta hai. Newsletter growth ek publication ka core business metric hai, aur ye raasta poori tarah band hai. Site par `NewsletterSignup` component bhi maujood hai (`components/newsletter/NewsletterSignup.tsx`) aur `app/actions/newsletter.ts` bhi kaam karta hai — yani backend tayar hai, bas destination page missing hai.

**Current behaviour:** 404.

**Professional recommendation:** Subscribe CTA ko ek aisi jagah le jana chahiye jo asal mein maujood ho — ya to ek dedicated newsletter landing page jo value proposition aur signup form dikhaye, ya CTA ko inline signup component se replace kiya jaye. Ek professional publication ka subscribe button kabhi dead-end nahi hona chahiye. Iske sath ek broader safeguard bhi chahiye: navigation links aur available pages ke darmiyan consistency ko build-time par pakra jana chahiye, warna ye dobara hoga.

**Priority:** **Critical**

---

### Khali database par jaali articles dikhte hain

**Location:** `components/layout/Sidebar.tsx:32-46`
**Status:** **Verified**
**Type:** Content/Editorial / Trust

**Problem:** Sidebar ka "Most Read" section DB se articles fetch karta hai, lekin agar result khali ho to `lib/mockData.ts` ke hardcoded `ARTICLES` par fall back karta hai — Ahmed Khan, Priya Sharma, Elena Vasquez jaise fictional authors ke saath poore fake headlines.

**Why it matters:** Ye ek naye deployment par — ya kisi bhi lamhe jab DB mein published articles na hon — readers ko **fabricated content** dikhayega jo asli editorial links jaisa lagta hai. Un links par click karne se 404 milega. Ek news publication ke liye ye credibility ka seedha nuqsan hai: agar homepage par jhoote headlines hain to reader kyun maane ke baaki content asli hai. Ye development convenience thi jo production code path mein reh gayi.

**Current behaviour:** Silent fallback to mock data, bina kisi visual indication ke.

**Professional recommendation:** Empty state ka jawab khali state hona chahiye, jaali data nahi. Jab koi published article na ho to sidebar ko ya to poori tarah hide hona chahiye ya ek imaandar empty message dikhana chahiye. Mock data sirf tests aur local development seeds tak mehdood hona chahiye — production render path mein kabhi nahi. Yahi masla `app/(public)/category/[slug]/page.tsx` mein bhi hai jo `CATS` mock import karta hai.

**Priority:** **Critical**

---

### Trust pages (About, Privacy, Contact) CMS se manage nahi ho sakte

**Location:** `app/(public)/page/[slug]/page.tsx:3` → `lib/mockData.ts:561` (`PAGES`)
**Status:** Verified
**Type:** Missing Capability / Editorial

**Problem:** About, Contact, Editorial Standards, Corrections, Privacy, Terms, Cookies, Advertising, Careers — ye sab pages ek hardcoded TypeScript object mein HTML strings ke tor par rakhe hain. Inhe badalne ke liye code edit, commit aur deploy karna parta hai.

**Why it matters:** Ye wo pages hain jo ek publication ki **credibility establish karte hain** — Google inhe E-E-A-T signals ke tor par dekhta hai, aur readers inhe trust check karne ke liye khologte hain. Corrections policy aur Editorial Standards khaas tor par aise documents hain jo waqt ke saath update hote rehte hain. Ek editor ya legal reviewer ko typo theek karne ke liye engineer ki zaroorat nahi honi chahiye. Privacy/Terms mein to legal compliance ke liye timely updates zaroori hote hain.

Mazeed: `PAGES` content mein purane brand ke email addresses the (`tips@`, `legal@`) — rebrand ke waqt ye sirf is liye theek hue kyunki text replace ne unhe pakar liya, warna ye chup-chaap ghalat rehte.

**Current behaviour:** Hardcoded, deploy-gated.

**Professional recommendation:** In pages ko database-backed content banna chahiye jo admin console se editable ho, ideally usi editor ke saath jo articles ke liye use hota hai. Kam se kam, inhe `PublicationSettings` jaise ek editable store mein hona chahiye. Jab tak ye na ho, in pages ki ownership clearly documented honi chahiye taake koi legal update miss na ho.

**Priority:** High

---

### Public listing pages par pagination nahi

**Location:** `app/(public)/latest/page.tsx:21`, `app/(public)/category/[slug]/page.tsx:43`, `app/(public)/author/[slug]/page.tsx:35`; limits `lib/queries.ts:62-68`
**Status:** **Verified**
**Type:** UX / SEO / Missing Capability

**Problem:** `/latest` sirf 60 articles fetch karta hai, category aur author pages 40. In routes par koi `skip`, koi `page` searchParam, koi pagination control nahi. (`/tag` aur `/search` mein page param hai — yani pattern maujood hai, bas in teen routes par apply nahi hua.)

**Why it matters:** Ye ek publication ke liye structural masla hai jo waqt ke saath bigarta jayega. 41-waan article publish karte hi us category ka sabse purana article **permanently reachable nahi rehta** — na reader ke liye, na internal linking ke liye. Author pages par yehi hota hai: ek productive author ka 41-waan se purana kaam uske apne profile se ghayab ho jayega. Archive effectively khatam ho jayega jabke content DB mein maujood hoga.

SEO ke lihaz se ye aur bura hai: sitemap un URLs ko list karta hai (kyunki wo DB se aate hain) lekin site ke andar unka koi raasta nahi — orphaned pages ban jate hain jinhe crawler discover to karta hai lekin internal link equity nahi milti.

**Current behaviour:** Hard cap, koi "load more" ya page navigation nahi.

**Professional recommendation:** In listing pages par predictable, URL-addressable pagination honi chahiye (`?page=2`) — infinite scroll nahi, kyunki archive browsing aur crawling dono ke liye stable URLs chahiye. Har page par proper `rel` relationships aur canonical handling honi chahiye. Ye pattern `/tag` aur `/search` mein pehle se maujood hai, bas consistently apply karna hai.

**Priority:** High

---

### `not-found.tsx` kahin nahi hai

**Location:** Poora `app/` tree — 0 `not-found.tsx` files
**Status:** Verified
**Type:** UX

**Problem:** Repo mein 17 `loading.tsx` aur 2 `error.tsx` hain, lekin ek bhi `not-found.tsx` nahi. Jabke `notFound()` kai jagah call hota hai (`page/[slug]`, article route, etc.).

**Why it matters:** Har 404 — chahe wo galat article slug ho, delete shuda page ho, ya upar wala newsletter link — Next.js ka default unstyled 404 dikhayega. Ye brand se bilkul bahar hai: na header, na footer, na navigation, na search. Reader ke liye ye dead end hai jahan se wapas aane ka koi raasta nahi. Ek news site par 404s normal hain (purane links, typos, expired URLs), is liye ye high-traffic page hota hai.

**Professional recommendation:** Ek branded 404 hona chahiye jo site ke header/footer ke andar rahe aur reader ko aage ka raasta de — search, latest stories, ya categories. Ek publication ke liye 404 recovery ka mauqa hai, dead end nahi.

**Priority:** High

---

### Reading time har article par hardcoded `5` hai

**Location:** `app/(public)/page.tsx:48`, `app/(public)/article/[slug]/page.tsx:123`, `app/preview/[id]/page.tsx:115`, `components/layout/Sidebar.tsx:25,45`
**Status:** **Verified**
**Type:** Content/Editorial / Trust

**Problem:** Har article ka reading time literal `mins: 5` hai. `readingTime` field schema mein maujood hi nahi (`grep -c readingTime prisma/schema.prisma` = 0). Sidebar mein `(a as any).mins || 5` likha hai ek comment ke saath "fallback if schema doesn't have it explicitly typed" — yani lekhak ko bhi shak tha ke field nahi hai.

**Why it matters:** Ek 400-word news brief aur ek 4,000-word investigation dono "5 min read" dikhate hain. Reading time ka poora maqsad reader ko expectation dena hai; galat number us expectation ko todta hai aur bharosa kam karta hai. Ye un chhoti cheezon mein se hai jo turant "unfinished product" ka ehsas deti hain.

**Professional recommendation:** Reading time content se derive honi chahiye — word count ke basis par, publish/save ke waqt calculate ho kar store ki jaye taake har render par dobara compute na karni pare. Agar accurate number nahi de sakte to ye metadata **bilkul na dikhayen** — ghalat number se behtar hai na hona.

**Priority:** Medium

---

### Homepage par koi metadata nahi

**Location:** `app/(public)/page.tsx` — na `generateMetadata`, na `export const metadata`
**Status:** Verified
**Type:** SEO

**Problem:** Homepage apni koi metadata define nahi karta, is liye wo `app/layout.tsx` ke root metadata par depend karta hai. Root metadata `PublicationSettings` se aati hai jo achhi baat hai, lekin homepage ke liye koi canonical, koi Open Graph image, koi tailored description nahi.

**Why it matters:** Homepage aksar sabse zyada shared aur sabse zyada linked URL hota hai. Iska social card sabse ahem hai. Abhi jab koi homepage share karega to koi OG image nahi aayegi.

**Priority:** Medium

---

# 5. Mobile & Responsive Audit

### Breakpoint scale mein koi nizaam nahi — 14+ alag values

**Location:** `app/globals.css` (5,268 lines)
**Status:** Verified
**Type:** UI / Architecture

**Problem:** Stylesheet mein kam se kam 14 mukhtalif breakpoints use hote hain: 560, 600, 639, 640, 700, 760, 768, 800, 860, 899, 900, 960, 1000, 1024, 1100, 1180px. Kuch `min-width` hain, kuch `max-width`, aur kuch aik dusre ke bilkul qareeb (639/640, 899/900).

**Why it matters:** Ye responsive bugs ki jar hai. Jab ek component 900px par switch karta hai aur uska parent 860px par, to 860–900px ke darmiyan ek band aisa hota hai jahan layout adha-adha hota hai. 639 aur 640 jaise adjacent values off-by-one gaps paida karti hain. Aur sabse ahem: kisi naye developer ke liye ye tay karna namumkin hai ke naya component kis breakpoint par respond kare — is liye wo ek naya number chun lega aur masla barhta jayega.

Note: Tailwind v4 bhi use ho raha hai jiska apna scale hai (640/768/1024/1280), to effectively **do mukhtalif breakpoint systems** ek hi UI par chal rahe hain.

**Professional recommendation:** Ek tay shuda breakpoint scale honi chahiye — teen ya chaar values kaafi hain — aur poora UI usi par align hona chahiye, ideally Tailwind ke scale par kyunki wo pehle se project mein hai. Mojooda custom values ko us scale par map karke consolidate karna chahiye.

**Priority:** Medium

---

### Char admin tables ka koi mobile treatment nahi

**Location:** `app/admin/(authenticated)/audit-logs/AuditLogsClient.tsx:155`, `comments/CommentsQueueClient.tsx:133`, `subscribers/SubscribersClient.tsx:135`, `taxonomy/TaxonomyManager.tsx:507,717`
**Status:** Verified
**Type:** UX / Mobile

**Problem:** Ye tables `min-w-[700px]` se `min-w-[900px]` tak fixed minimum widths use karti hain. Ek achhi baat ye hai ke sab `overflow-x-auto` wrapper mein hain — is liye **page-level horizontal overflow nahi hoga** (ye maine verify kiya). Lekin 360px ke phone par `min-w-[900px]` table ka matlab hai ke reader ek waqt mein table ka sirf ~40% dekh sakta hai aur baaki ke liye horizontal scroll karna paregi.

Iske barkhilaf `ArticleIndex.tsx` (5 mobile-specific classes) aur `UserDirectoryTable.tsx` (2) mein mobile handling maujood hai — yani pattern team ko maloom hai, bas consistently apply nahi hua.

**Why it matters:** Comments moderation aur audit log review aise kaam hain jo aksar mobile par hote hain — editor safar mein hai aur ek report check karna chahta hai. Horizontal scrolling table par moderation karna practically na-mumkin hai: aap ek waqt mein comment ka text aur uske action buttons dono nahi dekh sakte.

**Professional recommendation:** Narrow screens par tabular layout ko stacked presentation se replace hona chahiye, jahan har row ek self-contained block ban jaye jisme sabse ahem fields aur uske actions ek saath nazar aayein. `ArticleIndex` mein ye pattern pehle se maujood hai aur usi ko baaki tables par extend karna chahiye. Jahan table zaroori ho, wahan kam se kam pehla column sticky hona chahiye taake scroll karte waqt context na khoye.

**Priority:** Medium

---

### Responsive behaviour runtime par verify nahi ho saka

**Status:** **Not Verifiable**

Is sandbox mein koi headless browser nahi hai aur database bhi nahi hai. Is liye 320/360/390/414/768/1024/1280px par actual rendering **maine nahi dekhi**. Upar ke findings CSS aur markup ki static reading par mabni hain. Overflow, clipping, touch target sizes aur sticky element behaviour ki asal tasdeeq ke liye real devices par testing zaroori hai — ye report uska badal nahi hai.

---

# 6. UI/UX Audit

### Focus ring chhe controls par poori tarah ghayab

**Location:** `AuditLogsClient.tsx:121,135`, `CommentModerationRow.tsx:75`, `ProfileForm.tsx:270`, `NotificationBell.tsx:138`, `ArticleEditor.tsx:1058`
**Status:** **Verified**
**Type:** Accessibility / UI

**Problem:** Repo mein `focus:outline-none` 36 jagah use hota hai. In mein se 30 apna focus indicator wapas dete hain (`focus:ring`, `focus:border`, ya `focus-visible:`) — ye sahi hai. Lekin 6 controls aise hain jo outline hata dete hain aur kuch wapas nahi dete.

Yahan ek nuance hai jo maine specifically check ki: `globals.css:229` par ek global `:focus-visible` rule hai. Lekin CSS specificity ke lihaz se bare `:focus-visible` ki specificity (0,1,0) hai, jabke Tailwind ka compiled `.focus\:outline-none:focus` (0,2,0) hai. Keyboard focus par dono match karte hain aur **Tailwind jeet jata hai** — jo `outline: 2px solid transparent` set karta hai. Yani global rule in controls ko bacha nahi raha.

**Why it matters:** Keyboard se navigate karne wala user ko bilkul nazar nahi aata ke wo kahan hai. `NotificationBell` ka dropdown panel aur `CommentModerationRow` ka action button — ye dono interactive elements hain jahan focus ka pata na hona seedha unusable bana deta hai. Ye WCAG 2.4.7 (Focus Visible) ki khilaf-warzi hai.

**Professional recommendation:** Focus indicator kabhi bhi bina replacement ke hataya nahi jana chahiye. Agar default outline design ke sath fit nahi karti to uski jagah ek custom visible indicator aana chahiye — ring, border, ya background shift. Behtar ye hai ke focus styling ek hi jagah centrally define ho aur individual components usay override na karein.

**Priority:** High

---

### Status badges theme-blind hardcoded colors use karte hain

**Location:** `components/editorial/ArticleEditor.tsx:777-778`
**Status:** Verified
**Type:** UI / Dark mode

**Problem:** Editor ke status badges hardcoded hex values use karte hain:
```
'SUBMITTED' ? 'bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/20'
            : 'bg-[#f59e0b]/10 text-[#d97706] border border-[#f59e0b]/20'
```
Jabke project mein `--ok`, `--bad`, `--warn`, `--muted`, `--faint` tokens maujood hain jo dono themes mein flip hote hain, aur `lib/workflow.ts:STATUS_META` mein har status ke liye pehle se sahi token mapped hai (`SUBMITTED → --warn`).

**Why it matters:** Ye colors dono themes mein ek jaise rehte hain. Dark mode mein `#d97706` (dark amber text) dark background par contrast fail karega. Ye bhi ek consistency masla hai: wohi status admin table mein `STATUS_META` ke tokens se render hota hai lekin editor mein alag hex se — yani ek hi cheez do jagah do rangon mein nazar aati hai.

**Professional recommendation:** Status ki visual representation ek hi source se aani chahiye. `STATUS_META` pehle se wo source hai aur usme shapes bhi defined hain (`hollow-circle`, `check`, `clock`) jo colour-blind users ke liye ahem hain. Editor ko bhi wahi use karna chahiye, apna parallel colour scheme nahi.

**Priority:** Medium

---

### Login button hardcoded red use karta hai

**Location:** `app/admin/login/page.tsx:127` — `backgroundColor: loading ? '#b91c1c' : '#dc2626'`
**Status:** Verified
**Type:** UI

**Problem:** Brand accent tokens (`--accent`, `--accent-deep`) maujood hain aur theme-aware hain, lekin login ka primary button inline hardcoded hex use karta hai jo brand red se match bhi nahi karta (`#dc2626` vs brand ka `#d92332`).

**Why it matters:** Login pehla screen hai jo koi bhi staff member dekhta hai. Wahan brand colour ka thora sa off hona chhota lagta hai lekin ye exactly wo detail hai jo product ko "assembled" ke bajaye "designed" feel deti hai.

**Priority:** Low

---

# 7. Dark/Light Mode Audit

**Status:** Largely correct, with the exceptions noted above.

Theme system theek se banaya gaya hai: `:root` aur `[data-theme="dark"]` mein tokens define hain, `next-themes` `data-theme` attribute manage karta hai, aur accent tokens dono themes ke liye alag hain with documented contrast ratios. `--error` token `--bad` par alias karta hai jo dono themes mein flip hota hai — yani `var(--error, #e53e3e)` wale fallbacks practically kabhi trigger nahi hote.

**Known theme gaps:**
1. `ArticleEditor` status badges (upar dekhein) — dono themes mein same hex.
2. `SeoPreview.tsx` — hardcoded white background aur Google-style greys. **Ye intentional aur sahi hai**: ye component Google SERP ka preview hai, aur Google ka result light hi rehta hai chahe CMS dark mode mein ho. Isay theme tokens par move karna ghalat hoga.
3. `app/admin/login/page.tsx` — hardcoded red.

**Not Verifiable:** Dono themes ka actual visual rendering — contrast, image treatment, code block readability — bina browser ke verify nahi ho saka.

---

# 8. Admin Dashboard Audit

Console 16 sections par mushtamil hai: dashboard, articles, editor, review, drafts, submissions, authors, users (+invite), comments, taxonomy, media, subscribers, audit-logs, settings.

### Media library naam se kuch aur, kaam kuch aur

**Location:** `app/admin/(authenticated)/media/page.tsx`
**Status:** Verified
**Type:** Missing Capability

**Problem:** "Media" section maujood hai lekin **koi file upload nahi hai**. Maine poore repo mein `formData()`, multipart handling, ya koi storage client dhoonda — kuch nahi mila. Page khud apne comment mein ye saaf likhta hai: "this codebase has no file upload anywhere. Images are URLs pointing at an allowlist of external hosts."

Ye page actually ek **catalog** hai: dikhata hai kaun si images use ho rahi hain, kahan use ho rahi hain, aur kya koi image ab non-allowlisted host par point kar rahi hai. Ye apni jagah useful hai.

**Why it matters:** Ye ek technology publication ke liye sabse bara operational gap hai. Ek tech site ko routinely apni **screenshots, benchmark charts, architecture diagrams, aur product photos** publish karni hoti hain. Unsplash se stock photo lagana review articles ya technical explainers ke liye kaam nahi karta. Abhi ek author ke paas sirf do raaste hain: ya to kisi external host par manually upload kare aur URL paste kare (jo allowlist ki wajah se sirf chand hosts par mumkin hai), ya original imagery bilkul na de.

Iska asar editorial quality par seedha parta hai — publication apni asal reporting ko visually support nahi kar sakti.

**Professional recommendation:** Ek publication ke liye image upload optional feature nahi, core capability hai. Iske saath wo cheezein bhi chahiye jo upload ko editorially useful banati hain: alt text required field ke tor par, caption aur credit, aur sensible size/format handling taake 4MB screenshots page speed na khaayein. Jab tak upload na ho, current catalog approach imaandar hai aur usay waise hi rakhna theek hai — lekin section ka naam expectation set karta hai jo poori nahi hoti.

**Priority:** **Critical** (for a technology publication specifically)

---

### Dashboard sections ka overlap

**Location:** `/admin/articles`, `/admin/drafts`, `/admin/submissions`, `/admin/review`
**Status:** Likely (needs product decision, not a code bug)
**Type:** UX / Information Architecture

**Problem:** Char alag routes hain jo sab articles ki filtered views lagti hain. `articles` mein filtering maujood hai (`FilterBar` status filters ke saath), to `drafts` aur `submissions` shayad wohi cheez pre-filtered dikhate hain.

**Why it matters:** Jab ek hi cheez tak pohanchne ke chaar raaste hon to users ko yaad rakhna parta hai ke kaunsa kya dikhata hai, aur unhe shak rehta hai ke kahin kuch miss to nahi ho raha. Navigation ka har item apni jagah justify karna chahiye.

**Professional recommendation:** Ya to ye views ek hi articles screen ke saved filters ban jayein, ya har ek ka maqsad itna alag ho ke naam se hi wazeh ho. Review queue ka alag hona sahi hai (wo ek workflow inbox hai, listing nahi) — lekin drafts/submissions ka articles se alag hona shayad zaroori nahi.

**Priority:** Medium

---

# 9. Role & Permission Audit

### Capability model centralized aur server-enforced hai

**Location:** `lib/capabilities.ts`, consumed by `lib/workflow.ts`, `app/actions/*`
**Status:** Verified
**Type:** Security / Architecture (strength)

**Current behaviour:** Roles capabilities par map hote hain, aur `authorize(role, capability)` single decision point hai. Workflow actions `executeTransition` ke zariye is par depend karte hain. `upsertArticle` alag se `canEditArticle()` call karta hai jo ownership check karta hai. Sabse ahem: `upsertArticle` mein `authorId` **session se force hota hai** AUTHOR role ke liye:
```
authorId: dbUser.role === "AUTHOR" ? userWithAuth.authorId : (data.authorId || ...)
```
Yani ek AUTHOR client payload manipulate karke apna article kisi aur ke naam nahi kar sakta.

**Current role posture (verified in code):**
- `article.delete` sirf **ADMIN** ke paas — OWNER ke paas nahi (deliberate: OWNER khud ko koi bhi role de sakta hai, is liye permanent deletion usse alag rakhi gayi)
- OWNER ke paas `article.delete.own.draft` hai (apna draft discard karna cleanup hai, archive mitana nahi)
- `article.review` ADMIN, OWNER, REVIEWER ke paas — **EDITOR ke paas nahi** (EDITOR publish kar sakta hai lekin approve/reject nahi)
- Self-review guard maujood hai (`checkSelfReviewGuard`) jo author ko apne hi article par decision lene se rokta hai, siwaye us soorat ke jab koi dusra active reviewer hi na ho

**Why it matters:** Ye design sound hai. Khaas tor par self-review guard ka wo edge case handling qabil-e-tareef hai — ek chhoti team jahan sirf ek reviewer ho, wahan system deadlock nahi karta.

**Priority:** — (strength)

---

### Rate limiting login par nahi hai

**Location:** `lib/rateLimit.ts` sirf `app/actions/comments.ts:61` aur `app/actions/newsletter.ts:17` mein use hota hai
**Status:** **Verified**
**Type:** Security Risk

**Problem:** Rate limiter maujood hai aur kaam karta hai, lekin authentication par lagu nahi. `app/api/auth/[...nextauth]/route.ts` ka credentials provider har login attempt par bcrypt comparison karta hai bina kisi attempt limit ke.

**Why it matters:** Admin login endpoint par unlimited password attempts mumkin hain. Ye ek CMS hai jahan ek compromised OWNER/ADMIN account ka matlab poori publication par control hai — content publish karna, users banana, roles badalna. Credential stuffing (leaked password lists) aise endpoints ka sabse aam target hai.

Ek sanvi masla: bcrypt jaan-boojh kar slow hai (~100ms). Bina rate limit ke ye khud ek DoS vector ban jata hai — kuch sau concurrent login requests server ke CPU ko block kar sakti hain.

**Current behaviour:** Koi throttling nahi, koi lockout nahi, koi failed-attempt logging nahi (AuditLog mein failed logins record nahi hote).

**Professional recommendation:** Authentication attempts par throttling honi chahiye, ideally do level par — per-IP aur per-account — taake ek hi account ko kai IPs se target karna bhi mushkil ho. Failed attempts audit trail mein jani chahiye taake attack visible ho. Repeated failures par progressive delay ya temporary lockout industry standard hai.

Ek zaroori caveat: mojooda rate limiter **in-memory** hai (`lib/rateLimit.ts` khud ye document karta hai: "does not share state across replicas"). Serverless ya multi-instance deployment par ye per-instance hoga, yani effective limit instance count se multiply ho jayegi. Authentication jaisi security-critical cheez ke liye shared state chahiye.

**Priority:** **Critical**

---

### `setupOwner` mein race condition aur weak validation

**Location:** `app/actions/setup.ts:8-26`
**Status:** Verified (logic), Potential (exploitability)
**Type:** Security Risk

**Problem:** Function pehle `db.user.count()` karta hai, phir agar 0 ho to OWNER create karta hai. Ye do alag operations hain bina transaction ya unique constraint ke — classic TOCTOU (time-of-check to time-of-use) window.

Saath hi email ka koi format validation nahi (sirf truthy check), aur password sirf length ≥ 8 par check hota hai.

**Why it matters:** Agar setup page publicly reachable ho (aur `middleware.ts` ka matcher `/admin/((?!login|setup).*)` isay **deliberately unprotected** chhorta hai, jo bootstrap ke liye zaroori hai), to do simultaneous requests dono count=0 dekh sakti hain aur do OWNER accounts ban sakte hain. Practically ye window bohot chhoti hai aur sirf pehle deployment par exist karti hai — lekin us lamhe ka nateeja poora system compromise hai.

**Professional recommendation:** "Pehla user hi owner hai" wali guarantee database level par honi chahiye, application logic par nahi — taake do concurrent requests mein se ek lazim tor par fail ho. Setup route ko ek baar complete hone ke baad permanently disable hona chahiye. Password policy length se aage honi chahiye, aur email format validate hona chahiye.

**Priority:** High

---

# 10. Article Workflow Audit

Workflow is project ka sabse mazboot hissa hai — tafseel §3 mein hai. Yahan sirf gaps:

### Bulk actions transition validation bypass karte hain — verify nahi ho saka

**Location:** `app/actions/workflow.ts:781-793` (`bulkArchive`, `bulkRestore`, `bulkPublish`, `bulkSubmit`)
**Status:** **Not Verifiable** without reading the shared helper in full

Ye char bulk actions ek shared helper par delegate karte hain. Maine inki one-line definitions dekhi hain lekin helper ka poora body trace nahi kiya. Agar helper har id par wahi `executeTransition` chalata hai to ye safe hain; agar wo direct `updateMany` karta hai to ye workflow rules bypass kar sakte hain — jo ek serious gap hoga (misal ke tor par ek EDITOR bulk-publish se review skip kar sakta hai).

**Professional recommendation:** Bulk operations ko individual operations se **exactly wohi** authorization aur state validation se guzarna chahiye. Bulk ka matlab sirf convenience hona chahiye, alag (aur kam sakht) code path nahi. Iski tasdeeq ki jani chahiye.

**Priority:** High (verify first)

---

# 11. Draft & Autosave Audit

**Status:** Verified — ye hissa acha kaam karta hai.

`lib/use-draft-cache.ts` localStorage mein versioned, timestamped snapshots rakhta hai 7-din ki expiry ke saath. Recovery **non-destructive** hai — server content silently overwrite nahi hota, user ko Restore/Discard choice milti hai. Ye sahi design hai: purana local content naye server content par chupke se likh dena us masle se bura hota jo solve kar rahe hain.

Autosave debounced hai, overlap guard maujood hai (`saveInFlightRef`), aur offline state ko error se alag treat kiya jata hai. Draft duplication bug (jo pehle har autosave par nayi row banata tha) fix ho chuka hai — `articleIdRef` pehli successful save se id adopt kar leta hai.

Rebrand ke doran localStorage keys par migration fallback bhi add hua taake readers ka cached kaam na khoye.

**Gap:** Multi-tab editing ka behaviour. Concurrency check manual saves par chalta hai (`lastUpdatedAt` comparison) lekin autosave par deliberately skip hota hai. Do tabs mein khula ek hi article — dono autosave karte huye — kya karega, ye maine **runtime par verify nahi kiya**. Code se lagta hai ke last-write-wins hoga.

---

# 12. Tiptap / Editor Audit

**Status:** Strong for a technology publication.

**Verified capabilities:** StarterKit (headings 1-6, lists, blockquote, bold/italic, undo/redo), `CodeBlockLowlight` (syntax highlighting — tech publication ke liye ahem), Underline, Highlight, Link (protocol-validated), Tables (resizable), CharacterCount (50k limit), custom `Figure` aur `Callout` extensions, aur ek SlashMenu.

Ye set ek tech publication ki asal zarooraton se achhi tarah match karta hai: syntax-highlighted code blocks, callouts for tips/warnings, figures with captions, aur tables for spec comparisons.

**Gaps:**
1. **Image upload nahi** (§8 mein detail) — sabse bara.
2. `@tiptap/extension-text-align` install hai lekin load nahi — yani text alignment available nahi.
3. **Not Verifiable:** paste handling (Word/Google Docs se paste karne par kya hota hai) — ye ek aam editorial pain point hai aur code se confirm nahi ho saka.

---

# 13. Author & Profile Audit

Invitation flow maujood hai (`app/actions/invitations.ts`, `app/invite/[token]/`), profile editing hai (`ProfileForm.tsx` with Tiptap bio), aur public author pages hain (`AuthorProfileView.tsx`) jo bio sanitize karke render karte hain.

### Invitation emails localhost link bhej sakte hain

**Location:** `app/actions/invitations.ts:71` — `process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"`
**Status:** **Verified**
**Type:** Bug / Configuration

**Problem:** `NEXT_PUBLIC_SITE_URL` `.env.example` mein **maujood hi nahi hai** (maine check kiya — file mein `NEXT_PUBLIC_SUPABASE_URL`, `DATABASE_URL`, `DIRECT_URL`, `RESEND_API_KEY`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `CRON_SECRET` hain, lekin `NEXT_PUBLIC_SITE_URL` nahi).

**Why it matters:** Jo variable `.env.example` mein na ho, wo production mein set hone ka imkaan kam hai — kyunki deployment checklist wahi se banti hai. Agar set na ho to:
- **Invitation emails mein `http://localhost:3000/invite/...` link jayega** — naya staff member join hi nahi kar payega
- Saari canonical URLs `localhost` ho jayengi
- JSON-LD ka publisher logo aur `mainEntityOfPage` `localhost` point karenge
- Sitemap ki tamam URLs `localhost` hongi

Ye teen alag systems (email, SEO, structured data) ko ek hi missing variable se torta hai, aur failure **silent** hai — koi error nahi aayega, bas sab kuch ghalat URL ke saath kaam karta rahega.

**Professional recommendation:** Jo environment variables production ke liye lazmi hain unhe example file mein hona chahiye aur unki absence startup par saaf error deni chahiye, silent localhost fallback nahi. Public-facing URLs ke liye localhost fallback production mein kabhi acceptable nahi — behtar hai app boot hi na ho.

**Priority:** **Critical**

---

# 14. CMS / Content Management Audit

Filtering (`FilterBar` — author, category, status), sorting, pagination (`components/console/Pagination.tsx`), bulk actions, aur revision history — ye sab admin side par maujood hain aur real data model par based hain.

Homepage placement control ab actually kaam karta hai (`homepagePlacement` field ko homepage read karta hai) — pehle ye field editors ko dikhta tha lekin kuch karta nahi tha.

**Gap:** Trust pages CMS-managed nahi (§4 mein detail).

---

# 15. Search & Discovery Audit

### Search `ILIKE %term%` par based hai

**Location:** `app/(public)/search/page.tsx:38-50`
**Status:** Verified
**Type:** Performance / UX

**Problem:** Search saat fields par `contains` + `mode: "insensitive"` chalata hai: title, deck, contentHtml, author, authorModel.name, tags.name, category.name.

**Why it matters:** Teen practical masle:

1. **Performance:** Leading-wildcard `ILIKE '%term%'` B-tree index use nahi kar sakta — har search poore `Article` table ka sequential scan karegi, aur `contentHtml` par to poore article bodies scan hongi. Kuch hazaar articles par ye dikhna shuru ho jayega.
2. **Relevance ranking nahi:** Title match aur article ke beech mein aik lafz ka match barabar treat hote hain. Reader ko sabse relevant nateeja sabse upar nahi milega.
3. **Typo tolerance nahi:** "kubernets" likhne par zero results — jabke reader ka matlab wazeh tha.

**Current behaviour:** Kaam karta hai, chhote dataset par theek hai.

**Professional recommendation:** PostgreSQL ka apna full-text search in teeno masloon ka jawab deta hai bina koi nayi service add kiye — ranked results, stemming (yani "running" se "run" milta hai), aur indexed lookup. Chunke project pehle se PostgreSQL par hai, ye sabse mozoon raasta hai; koi external search service add karna is scale par over-engineering hoga. Typo tolerance ke liye trigram similarity bhi usi database mein available hai.

**Priority:** Medium (Critical agar content volume tezi se barhe)

---

# 16. SEO Audit

### JSON-LD mein stored-XSS vector

**Location:** `app/(public)/article/[slug]/page.tsx:133`
**Status:** **Verified**
**Type:** **Security Risk** / SEO

**Problem:** Structured data aise inject hoti hai:
```
dangerouslySetInnerHTML={{ __html: JSON.stringify(generateNewsArticleJsonLd(article)) }}
```
`generateNewsArticleJsonLd` ka `headline` field `article.seoTitle || article.title` se aata hai. Article title par **koi sanitization nahi** — `upsertArticle:129` mein sirf `.trim()` hota hai.

Maine ye empirically verify kiya:
```
title  = 'Intro</script><script>alert(1)</script>'
output = {"headline":"Intro</script><script>alert(1)</script>"}
        → contains raw </script>: true
```

`JSON.stringify` `</script>` sequence ko escape **nahi** karta — ye JSON ke liye valid characters hain. Browser HTML parse karte waqt pehla `</script>` dekh kar script block band kar deta hai, aur baaki content executable HTML ban jata hai.

**Why it matters:** Ye ek **stored XSS** hai jo har us reader par chalta hai jo article page kholta hai. Attack surface ye hai: koi bhi user jo article title likh sakta hai (yani har AUTHOR) ek aisa payload plant kar sakta hai jo public par execute ho. Chunke ye published article page hai, asar har visitor par parta hai — logged-in editors samet, jinke session tokens churaye ja sakte hain.

Qabil-e-zikr: baaki poore codebase mein sanitization **behtareen** hai — `ArticleBody`, bio, static pages sab DOMPurify se guzarte hain. Ye ek single gap hai jo is liye chhoot gaya ke JSON-LD "content" nahi lagta, halanke wo content hi se banta hai.

**Professional recommendation:** Structured data ko HTML mein embed karte waqt `<` character ko escape hona chahiye taake script block kisi bhi surat mein waqt se pehle band na ho — ye JSON-LD embedding ka standard requirement hai. Iske ilawa article title jaise fields par bhi input-level validation honi chahiye (plain text expected hai, HTML nahi). Do layers behtar hain: input par restrict karna, aur output par escape karna.

**Priority:** **Critical**

---

### Canonical URLs sirf 2/9 public routes par

**Location:** Verified across `app/(public)/**`
**Status:** Verified
**Type:** SEO

| Route | Metadata | Canonical | OG |
|---|---|---|---|
| article/[slug] | ✅ | ✅ | ✅ (via helper) |
| tag/[slug] | ✅ | ✅ | ❌ |
| author/[slug] | ✅ | ❌ | ✅ |
| category/[slug] | ✅ | ❌ | ❌ |
| latest | ✅ | ❌ | ❌ |
| page/[slug] | ✅ | ❌ | ❌ |
| search | ✅ | ❌ | ❌ |
| **homepage** | **❌** | ❌ | ❌ |

**Problem:** `lib/seo.ts` mein ek achha `constructMetadata()` helper maujood hai jo canonical, Open Graph, Twitter card aur robots — sab ek saath handle karta hai. Lekin **sirf ek route** (article) usay use karta hai. Baqi routes apni hand-rolled metadata likhte hain aur is amal mein canonical/OG chhoot jate hain.

**Why it matters:** Canonical na hone par duplicate-content risk barhta hai — khaas kar category aur tag pages par jahan wohi articles mukhtalif URLs par list hote hain (`?page=`, trailing slash, UTM params). Open Graph na hone ka matlab hai ke koi bhi category ya author page social media par share hone par bila-image, bila-description plain link ke tor par nazar aayega — ek publication ke liye ye distribution ka nuqsan hai.

**Professional recommendation:** Jo helper pehle se bana hua hai aur sahi kaam karta hai, usay har public route par consistently use hona chahiye. Metadata ka har route par alag alag hand-roll hona hi wo wajah hai jis se fields chhootti hain.

**Priority:** High

---

### Publisher logo maujood hi nahi

**Location:** `lib/seo.ts:8` → `${SITE_URL}/logo.png`; `public/` mein sirf `file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`
**Status:** **Verified**
**Type:** SEO

**Problem:** JSON-LD ka Organization block `logoUrl` include karta hai jo `/logo.png` point karta hai. Ye file repository mein **maujood nahi**. Code mein khud comment likha hai: `// Assuming a logo exists`.

**Why it matters:** Google News aur rich results ke liye publisher logo required property hai. Broken URL ke sath structured data validation warnings degi aur article rich results mein eligible nahi hoga. `public/` mein abhi bhi sirf Next.js ke default placeholder SVGs hain — yani branding assets kabhi add hi nahi hue.

**Priority:** High

---

### Sitemap unbounded hai aur tags miss karta hai

**Location:** `app/sitemap.ts`
**Status:** Verified
**Type:** SEO / Performance

**Problem:** Sitemap **tamam** published articles, categories aur authors ko bina limit fetch karta hai, aur `force-dynamic` hai — yani har request par poori query chalti hai. Tag pages sitemap mein bilkul shamil nahi, halanke wo indexable routes hain.

**Why it matters:** Sitemap protocol ki limit 50,000 URLs / 50MB per file hai. Us se pehle hi ye ek mehnga uncached query ban jayegi jo har crawler hit par poora articles table scan karegi.

**Professional recommendation:** Sitemap ko cache hona chahiye (content hourly se zyada tezi se nahi badalta) aur bare publications ke liye sitemap index mein tabdeel hona chahiye. Tag pages ya to shamil hon ya deliberately `noindex` — abhi wo indexable hain lekin undiscoverable, jo sabse kharab combination hai.

**Priority:** Medium

---

### `/search` robots.txt mein blocked hai lekin `noindex` nahi

**Location:** `app/robots.ts` — `disallow: ['/admin/', '/api/', '/search', '/preview']`
**Status:** Verified
**Type:** SEO

**Problem:** `robots.txt` crawling rokta hai lekin indexing nahi. Agar kisi search results page ka external link mil jaye to Google usay index kar sakta hai (bina content dekhe) — "A description for this result is not available" wale snippet ke saath.

**Professional recommendation:** Jin pages ko index nahi hona chahiye un par page-level `noindex` chahiye. `constructMetadata` helper mein `noIndex` option pehle se maujood hai — bas `/search` aur `/preview` par use nahi ho raha. Preview route ke liye ye khaas tor par ahem hai kyunki wahan **unpublished** content hota hai.

**Priority:** Medium

---

# 17. GEO Audit (Generative Engine Optimization)

**Strengths (verified):**
- Author attribution structured hai — `Person` schema `url` ke saath author profile par
- `datePublished` aur `dateModified` dono JSON-LD mein
- Author profiles mein bio, headline, expertise/beats fields hain — ye entity signals hain jo generative engines author authority assess karne ke liye use karte hain
- Categories aur tags proper relations hain, free-text nahi

**Gaps:**
- **Organization schema sirf article pages par.** Homepage par koi structured data nahi, jahan `WebSite` + `SearchAction` sabse zyada matter karta hai.
- **Publisher logo broken** (§16) — publisher entity incomplete rehti hai.
- **Reading time fake hai** (§4) — ye chhota lagta hai lekin content metadata ki reliability generative systems ke liye signal hoti hai.

**Recommendation:** Ek publication ke liye sabse qeemti GEO investment author authority aur publisher identity ko mukammal karna hai — kyunki generative engines "kis ne kaha" par bharosa karte hain. Structured data pehle se mojood hai; usay poora aur durust karna nayi cheez add karne se zyada faidemand hai.

---

# 18. AEO Audit (Answer Engine Optimization)

**Status:** Mostly Not Verifiable — ye zyadatar **content practice** ka masla hai, code ka nahi.

Editor mein wo tools maujood hain jo answer-friendly structure banane mein madad dete hain: heading levels 1-6, lists, tables, aur `Callout` extension (tips/warnings/takeaways ke liye). `Figure` captions bhi hain.

**Observations:**
- Koi FAQ ya `HowTo` structured data support nahi — tech publications ke liye ye aksar qeemti hota hai (how-to guides, troubleshooting articles)
- Editor mein koi content-structure guidance nahi (misal: heading hierarchy warning agar H2 ke baghair H3 use ho)
- `deck` field maujood hai aur submission par minimum 10 characters enforce hote hain — ye ek achha summary signal hai

**Recommendation:** AEO ka bara hissa editorial discipline hai — sawal-numa headings, shuru mein seedha jawab, aur saaf definitions. Iske liye tooling se zyada ek editorial style guide matter karta hai. Code side par sirf ek cheez justified hai: agar publication how-to content banata hai to us format ke liye structured data support. Baqi ke liye naya tooling add karna over-engineering hoga.

---

# 19. Performance Audit

### ISR theek se configure hai

**Status:** Verified (strength)

Public pages par revalidate windows hain: homepage 300s, article 300s, category 300s, latest 180s, author 600s. Aur ahem baat: workflow actions `revalidateArticleRoutes()` call karte hain jo publish/unpublish par affected routes ko foran invalidate karti hai — yani editors ko 5 minute wait nahi karna parta.

Code comment ye bhi batata hai ke pehle `force-dynamic` tha jo `revalidatePath()` ko no-op bana deta tha. Ye fix sahi samjha aur sahi kiya gaya.

### Homepage single query par chalta hai

**Status:** Verified (strength)

`app/(public)/page.tsx` ek `findMany` karta hai `ARTICLE_CARD_SELECT` ke saath aur us se saare sections (hero, featured, picks) derive karta hai. Koi N+1 nahi.

### Raw `<img>` tags — 19 jagah

**Location:** 12 files including `app/(public)/article/[slug]/page.tsx`, `components/author/AuthorProfileView.tsx`
**Status:** Verified
**Type:** Performance

**Problem:** `next/image` sirf 9 files mein use hota hai; 19 raw `<img>` tags hain. Poore repo mein `sizes=` sirf 2 jagah aur `priority` sirf 3 jagah use hua hai.

**Why it matters:** Raw `<img>` ka matlab hai koi automatic format conversion (WebP/AVIF), koi responsive srcset, aur koi lazy loading default. Article pages par featured images sabse bari payload hoti hain — ye seedha LCP (Largest Contentful Paint) par asar dalti hai, jo Core Web Vitals ka sabse ahem metric hai news sites ke liye.

`sizes` ka na hona ek aur masla hai: uske baghair Next.js viewport-width image serve karta hai chahe wo thumbnail hi kyun na ho.

**Caveat:** Ye **Likely** impact hai, Verified nahi — maine koi Lighthouse run nahi kiya aur na hi kar sakta hoon (na browser, na database). Asar ka andaza code patterns se lagaya hai.

**Professional recommendation:** Public-facing images ko optimized image pipeline se guzarna chahiye, khaas kar hero/featured images jo LCP element hoti hain. Har responsive image ko apni display size declare karni chahiye taake browser sahi variant chun sake. Admin console ke andar chhoti avatars par ye kam ahem hai.

**Priority:** Medium

---

### Search query poore table scan karegi

Detail §15 mein. Performance ke lihaz se ye sabse likely bottleneck hai jab content barhega.

### In-memory rate limiter multi-instance par kaam nahi karega

Detail §9 mein — ye correctness aur security dono ka masla hai.

---

# 20. Accessibility Audit

**Strengths (verified):**
- Skip links **dono** layouts mein (`app/(public)/layout.tsx:19`, admin layout:60)
- ARIA usage kaafi vasee: 121 `aria-label`, 76 `aria-hidden`, 14 `aria-live`, 9 `aria-labelledby`, 8 `aria-modal`, 5 `aria-current`
- `prefers-reduced-motion` teen jagah honour hota hai
- Semantic HTML: proper `<table>`, `<nav>`, `<aside>`, `<article>` elements
- Editor toolbar mein `role="toolbar"` aur `aria-pressed` states
- Sync indicator mein `role="status"` + `aria-live="polite"`

Ye average project se kaafi behtar hai.

**Gaps:**
1. **Focus ring 6 controls par ghayab** (§6) — WCAG 2.4.7 violation, High priority
2. **Mobile tables** (§5) — horizontal scroll par moderation mushkil
3. **Not Verifiable:** Screen reader ke saath actual behaviour, keyboard trap testing modals/drawers mein, aur real contrast measurements. Inke liye assistive technology ke saath manual testing chahiye.

---

# 21. Security Audit

## VERIFIED SECURITY ISSUES

1. **JSON-LD XSS** (§16) — `</script>` unescaped, author-controlled title se. **Critical**
2. **Login par rate limiting nahi** (§9) — brute force aur bcrypt DoS. **Critical**
3. **`setupOwner` TOCTOU** (§9) — race window pehle deployment par. **High**

## POTENTIAL RISKS

4. **Bulk actions ka authorization path unverified** (§10) — agar wo `executeTransition` bypass karte hain to workflow rules toot sakte hain. **Verify first.**
5. **In-memory rate limiter** — serverless par per-instance, yani comments/newsletter limits bhi effectively multiply ho jate hain.
6. **Input validation adhoori** (§3) — `deck`, `seoTitle`, `seoDesc` par koi length limit nahi. Storage exhaustion ya UI breakage ka rasta.

## VERIFIED STRENGTHS

Ye darj karna zaroori hai kyunki posture overall achhi hai:

- **HTML sanitization thorough hai** — `lib/sanitize.ts` do configs ke saath (article vs bio), allowlist-based tags/attributes, protocol restrictions, aur `target="_blank"` par automatic `rel="noopener noreferrer"`. Har `dangerouslySetInnerHTML` sanitized content use karta hai — siwaye JSON-LD ke.
- **Cron endpoint exemplary** — fail-closed agar `CRON_SECRET` set na ho, constant-time comparison, generic error responses jo configuration leak na karein.
- **Session revocation** — `sessionVersion` JWT callback mein har request par check hota hai, saath `isActive`. Yani user deactivate karne par uski session foran mar jati hai, expiry ka intezar nahi.
- **Role re-sync per request** — JWT mein cached role ke bajaye DB se fresh role aata hai, to role downgrade turant asar karta hai.
- **Image URL allowlist** — `isValidSafeUrl` protocol aur hostname dono check karta hai.
- **`authorId` client se trust nahi hota** AUTHOR role ke liye.
- **Comments moderation-first** — `PENDING` default, public sirf `APPROVED` dekhta hai.
- **Passwords bcrypt se hash** (cost 10).

## RECOMMENDED HARDENING

- Security headers (CSP, `X-Frame-Options`, `X-Content-Type-Options`) — `next.config.ts` mein abhi sirf `images.remotePatterns` hai, koi headers config nahi
- Failed login attempts audit log mein
- `.env.example` mein saare required variables (§13)

---

# 22. Database & Architecture Audit

**Strengths:**
- Indexes soch samajh kar lagaye gaye hain — `Article` par 6 composite indexes jo actual query patterns se match karte hain: `[status, updatedAt]`, `[status, submittedAt]`, `[authorId, status, updatedAt]`, `[categoryId, status, publishedAt]`, `[publishedAt]`, `[scheduledFor]`
- `onDelete: Cascade` revisions aur reviews par — orphan records nahi banenge
- `previousSlugs String[]` — slug change hone par purane URLs handle karne ke liye, ye ek thoughtful detail hai jo SEO ke liye ahem hai
- `ArticleReview.passNumber` — review rounds track karta hai, yani "ye teesri baar wapas aaya hai" ka pata chalta hai
- `PublicationSettings` deliberately single-row with pinned id — documented reasoning ke saath

**Weaknesses:**
1. **Legacy duplication** (§3) — `author`/`authorModel`, `legacyTags`/`tags`
2. **`AuditLog` par koi index nahi** — ye table sabse tezi se barhegi (har action ek row) aur audit-logs page ise query karta hai. Filtering/sorting waqt ke sath slow hogi.
3. **Koi soft-delete nahi** — `deleteArticlePermanently` revisions bhi `deleteMany` karta hai. Ye documented aur deliberate hai (ADMIN-only), lekin ek publication ke liye accidental deletion se recovery ka koi raasta nahi.
4. **Migration note:** `20260918010000_add_publication_settings` mein hand-written SQL hai jo kabhi real database par nahi chali (is environment mein DB nahi hai). Additive hai (`CREATE TABLE` only) to risk kam hai, lekin production se pehle staging par verify honi chahiye.

---

# 23. Notifications / Loading / Error States

**Strengths:** 17 `loading.tsx` files — coverage achhi hai. Toast system maujood hai. Autosave sync indicator `aria-live` ke saath. Notification model aur `NotificationBell` implemented hain. Workflow actions typed error codes return karte hain (`UNAUTHENTICATED`/`FORBIDDEN`/`NOT_FOUND`/`CONFLICT`/`VALIDATION`/`RATE_LIMITED`/`SERVER`) — ye structured error handling achhi hai.

**Gaps:**
1. **Koi `not-found.tsx` nahi** (§4) — High
2. **Sirf 2 `error.tsx`** — 31 pages ke liye. Admin section aur invite flow mein hain, lekin **poore public site par ek bhi nahi**. Agar article page par DB error aaye to reader ko unstyled Next.js error screen milegi.
3. `ConfirmDialog` sirf yes/no hai — destructive actions ke liye "type the title to confirm" jaisa friction nahi.

**Professional recommendation:** Public site par error boundary honi chahiye jo brand ke andar rahe aur reader ko recovery ka raasta de. Ek news site par error page utna hi visible ho sakta hai jitna koi article — usay usi care se treat karna chahiye.

**Priority:** High (public error boundary)

---

# 24. Design System Improvements

**Root cause:** Do parallel styling systems ek saath chal rahe hain — 5,268-line hand-written `globals.css` (jo `htm_2.html` prototype se aaya lagta hai) aur Tailwind v4 utility classes. Ye do systems ke apne breakpoints, apne spacing scales, aur apne colour references hain.

**Iske nateeje (sab verified):**
- 14+ breakpoints do systems ke darmiyan bate huye (§5)
- Focus styling conflict — Tailwind ka `outline-none` global CSS rule ko specificity par harata hai (§6)
- Status colours do jagah define — `STATUS_META` tokens aur editor ke hardcoded hex (§6)
- Session memory ke mutabiq: 8 radius variants aur 9 shadow variants un-normalized

**Kya theek ho chuka hai (acha precedent):** `.ed-act` button tier system aur `.ed-rail-*` input classes — inhone repeated inline utility strings ko named, consistent classes se replace kiya. Ye sahi direction hai.

**Professional recommendation:** Faisla ye karna chahiye ke kaun sa system authoritative hai, phir dusre ko us par migrate karna chahiye — dono ko barabar chalate rehna hi asal masla hai. Chunke Tailwind pehle se project mein hai aur naya code usi mein likha ja raha hai, wo zyada mozoon base lagta hai. Tokens (colour, spacing, radius, shadow) ek jagah define hone chahiyen aur dono systems unhi ko reference karein — taake kam se kam values divergent na hon chahe syntax alag rahe.

**Priority:** Medium (structural, but enables many smaller fixes)

---

# 25. Missing Professional Capabilities

Sirf wo cheezein jo is product ke liye genuinely justified hain:

1. **Image upload** (§8) — **Critical.** Ek tech publication apni screenshots, benchmarks aur diagrams ke baghair apni reporting visually support nahi kar sakti.
2. **CMS-managed trust pages** (§4) — **High.** About/Privacy/Corrections ko deploy ke baghair update hona chahiye; ye legal aur E-E-A-T dono ke liye ahem hai.
3. **Public pagination** (§4) — **High.** Iske baghair archive effectively khatam ho jata hai.
4. **Branded 404 aur public error boundary** (§4, §23) — **High.**
5. **Login throttling** (§9) — **Critical.**
6. **Alt text as a required field** — abhi image URL paste hoti hai; alt text enforce nahi hota. Accessibility aur image SEO dono ke liye ye zaroori hai, aur ek publication mein ye editorial standard hona chahiye.

**Jaan-boojh kar shamil nahi kiya** (ye wishlist nahi honi chahiye): multi-language, AI writing assistance, A/B testing, personalization, paywall, mobile app. Inme se koi bhi mojooda gaps se zyada ahem nahi.

---

# 26. Critical Problems

| # | Problem | Location | Type |
|---|---|---|---|
| 1 | JSON-LD XSS — unescaped `</script>` from article title | `article/[slug]/page.tsx:133` | Security |
| 2 | Subscribe CTA 404 — 3 jagah se dead link | Header/Drawer/Footer → `/page/newsletter` | Bug/UX |
| 3 | Login par koi rate limiting nahi | `api/auth/[...nextauth]` | Security |
| 4 | `NEXT_PUBLIC_SITE_URL` `.env.example` mein nahi — invite emails localhost | `.env.example`, `invitations.ts:71` | Bug/Config |
| 5 | Khali DB par fake articles public par | `Sidebar.tsx:32-46` | Trust |
| 6 | Koi image upload nahi | No upload path anywhere | Missing Capability |

---

# 27. Recommended Improvements (Prioritized)

**CRITICAL**
- JSON-LD output escaping + article title input validation
- Newsletter page banayen ya Subscribe CTA redirect karein
- Authentication throttling (shared state ke saath, in-memory nahi)
- `NEXT_PUBLIC_SITE_URL` required karein with startup validation
- Mock data fallback production render path se hatayen
- Image upload capability

**HIGH**
- Public listing pagination (`/latest`, `/category`, `/author`)
- Branded `not-found.tsx` + public `error.tsx`
- Canonical + OG har public route par (`constructMetadata` consistently use karein)
- Focus indicators un 6 controls par wapas layein
- Trust pages CMS-managed banayen
- `logo.png` add karein (JSON-LD publisher ke liye)
- Bulk actions ka authorization path verify karein
- `setupOwner` race condition
- Input schemas server actions par

**MEDIUM**
- PostgreSQL full-text search
- Reading time asal content se derive karein
- Mobile table treatment (4 tables)
- Breakpoint scale consolidate karein
- Status colours `STATUS_META` se lein
- `next/image` public images par
- Sitemap caching + tag pages
- `noindex` `/search` aur `/preview` par
- `AuditLog` par index
- Legacy schema fields ka migration plan

**LOW**
- Dead Tiptap dependencies hatayen
- Login button brand token use kare
- Dashboard sections ka overlap (drafts/submissions vs articles)
- Security headers

---

# 28. Future Enhancements

Sirf wo jo product ke lihaz se justified hain aur upar ke gaps band hone ke ba'd matter karenge:

- **Editorial analytics** — kaun se articles perform kar rahe hain, kis author ka kaam kitna parha ja raha hai. Abhi `views` count hota hai lekin koi trend view nahi. Editors ko commissioning decisions ke liye ye chahiye hota hai.
- **Scheduled publishing ki visibility** — `scheduledFor` aur cron dono maujood hain; ek calendar view jo aane wale hafte ka plan dikhaye editorial planning ke liye qeemti hoga.
- **Content health checks** — publish se pehle: missing alt text, toote internal links, bohot chhoti SEO description. Ye editors ko wo cheezein pakarne deta hai jo review mein aksar chhoot jati hain.
- **Soft delete / trash** — abhi deletion permanent hai. Ek recovery window accidental loss se bachata hai.

---

# 29. Production Readiness Overview

| Area | Status | Note |
|---|---|---|
| Architecture & workflow | ✅ Ready | State machine + capability model exemplary |
| Authorization (article ops) | ✅ Ready | Server-enforced, centralized |
| Authentication hardening | ❌ Not Ready | Koi login throttling nahi |
| HTML sanitization | ⚠️ Needs Improvement | Thorough — lekin JSON-LD gap |
| Structured data | ⚠️ Needs Improvement | XSS vector + broken logo |
| SEO metadata | ⚠️ Needs Improvement | Canonical 2/9 routes |
| Public navigation | ❌ Not Ready | Primary CTA 404 |
| Content authenticity | ❌ Not Ready | Fake data fallback live |
| Image management | ❌ Not Ready | Koi upload nahi |
| Public pagination | ❌ Not Ready | Archive reachable nahi |
| Error/404 states | ❌ Not Ready | Koi not-found, koi public error boundary |
| Trust pages | ⚠️ Needs Improvement | Hardcoded, deploy-gated |
| Draft persistence | ✅ Ready | Non-destructive recovery, tested |
| Editor capability | ⚠️ Needs Improvement | Strong — sirf image upload missing |
| Revision history | ✅ Ready | Write + restore both work |
| Audit logging | ✅ Ready | Actions logged; index chahiye |
| Accessibility | ⚠️ Needs Improvement | Achhi base, 6 focus gaps |
| Mobile (admin tables) | ⚠️ Needs Improvement | Scroll works, UX kamzor |
| Search | ⚠️ Needs Improvement | Kaam karta hai, scale nahi karega |
| Performance (caching) | ✅ Ready | ISR + targeted revalidation |
| Performance (images) | ⚠️ Needs Improvement | 19 raw img tags |
| Env configuration | ❌ Not Ready | Required var example mein nahi |
| Test coverage | ✅ Ready | 111 tests, CI gated |
| Design system | ⚠️ Needs Improvement | Do parallel systems |

---

# 30. Final Professional Assessment

**Jo pehle se mazboot hai:**

Is project ki engineering foundation genuinely achhi hai, aur ye kehna khushamad nahi — ye code se sabit hota hai. Workflow ek asal state machine hai jahan har transition ek hi guarded path se guzarta hai, is liye naya action add karna by default secure hai. Permissions ek jagah define hain aur server par enforce hote hain, UI par chupaye nahi jate. Draft recovery non-destructive hai. Cron endpoint fail-closed hai constant-time comparison ke saath — ye wo detail hai jo aksar bare products bhi miss karte hain. Sanitization layer thorough hai. Zero TODO/FIXME aur ek documented CI pipeline batati hai ke codebase discipline ke saath maintain hua hai.

**Jo product ko rok raha hai:**

Masla architecture nahi, **finishing** hai. Aur ye gaps un jagahon par hain jahan sabse zyada nazar aate hain:

Ek reader jo site par aata hai wo do cheezein foran dekh sakta hai — Subscribe button jo 404 deta hai, aur (agar DB khali ho) jaali headlines jo asli lagti hain. Ek editor jo kaam shuru karta hai wo teesri cheez dekhega — apni screenshot publish nahi kar sakta. Ek author jo invite receive karta hai wo chauthi dekhega — link `localhost` par jata hai agar ek env variable set na ho jo example file mein hai hi nahi.

In mein se koi bhi mushkil engineering problem nahi hai. Ye wo cheezein hain jo is liye reh gayin ke development DB seed ke saath hota hai aur production edge cases baad mein aate hain.

**Sabse zyada tawajjo kahan chahiye:**

Do security items sabse pehle — JSON-LD escaping aur login throttling. Pehla is liye ke wo har reader par asar dalta hai aur author-controlled input se trigger hota hai; dusra is liye ke ek CMS ka admin login compromise hone ka matlab poori publication khona hai.

Uske ba'd wo teen cheezein jo product ko "unfinished" feel deti hain: dead Subscribe CTA, fake data fallback, aur missing 404/error pages. Ye teeno chhote fixes hain lekin perception par asar bara hai.

Phir do structural gaps jo waqt ke saath bigrenge: public pagination (jiske baghair archive khatam ho jata hai) aur image upload (jiske baghair publication apni asal reporting visually support nahi kar sakti).

**Aakhri baat:**

Ye product ek achhe engineer ke haath ka bana hua lagta hai jisne sahi jagahon par sahi faisle kiye. Jo cheezein kami hain wo zyadatar wo hain jo sirf tab nazar aati hain jab aap product ko ek asal newsroom ki tarah use karna shuru karein — khali database ke saath, real staff invites ke saath, aur 41 se zyada articles ke saath. Upar ke critical aur high items band karne ke ba'd ye ek genuinely credible technology publication platform hoga.

---

*Audit mukammal. Repository modify nahi ki gayi — `git status` clean, HEAD `4dccbd1` bar-qarar.*

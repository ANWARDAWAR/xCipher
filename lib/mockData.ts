export type ArticleBodyItem = [string, ...any[]];

export interface Article {
  id: number | string;
  slug: string;
  cat: string;
  title: string;
  deck: string;
  author: string;
  role: string;
  age: number;
  updated?: string;
  mins: number;
  img: number | string;
  alt: string;
  views: number;
  featured?: boolean;
  trend?: number;
  pick?: number;
  breaking?: boolean;
  most?: number;
  tags?: string[];
  body: ArticleBodyItem[];
  status?: "published" | "draft";
}

export interface Category {
  id?: string;
  name: string;
  full?: string;
  desc?: string;
}

export const ARTICLES: Article[] = [
            {
                id: 1, slug: "ai-reshaping-internet", cat: "ai",
                title: "AI Is Reshaping the Internet — Here Is What Comes Next",
                deck: "The open web was built for humans reading pages. The next one is being negotiated between models, agents and the companies that control both.",
                author: "Ahmed Khan", role: "Technology Editor", age: 140, updated: "2 hours ago", mins: 8, img: 17483873,
                alt: "Abstract visualization of an artificial intelligence neural network", views: 482100, featured: true, trend: 1, pick: 1,
                tags: ["AI", "agents", "publishing", "web"],
                body: [
                    ["p", "For most of its life, the internet ran on one simple assumption: a human would type a query, scan a page of links, click one and read. Every business model on the web — advertising, subscriptions, affiliate commerce, the entire creator economy — was engineered around that loop. In the past eighteen months, the loop has begun to quietly disappear."],
                    ["p", "The numbers are still contested, but the direction is not. Across major publishers, referral traffic from classic search has fallen by double-digit percentages year over year, while queries answered entirely inside AI assistants — summarized, cited, never clicked — are growing faster than any traffic source in the history of the web. The internet is not dying. It is being renegotiated."],
                    ["h2", "The traffic shift nobody talks about"],
                    ["p", "Answer engines changed the economics of attention before most publishers had finished measuring them. When an assistant can read forty pages and produce one competent summary, the fortieth page loses its reader — and its ad impression. What makes this wave different from earlier platform shifts is speed: mobile took a decade to reorder the web; large models took about three years."],
                    ["callout", "By the numbers", "In several major markets, an estimated 60% of searches now end without a single click. AI-mediated referrals are simultaneously the fastest-growing and the smallest traffic source for most large publishers — a preview of the trade every site will soon be forced to price."],
                    ["h2", "Agents change the contract"],
                    ["p", "The second phase is already underway. Software agents don't just summarize the web; they act inside it — comparing prices, filing forms, booking travel, reconciling invoices. For that to work at scale, machines need sanctioned access to live data, and a new negotiation layer is emerging around standards like <a href=\"#/article/passkeys-tipping-point\">machine-readable permissions</a>, licensing APIs and pay-per-use content endpoints. The humble robots.txt file is being quietly retired in everything but name."],
                    ["quote", "We spent twenty years optimizing for crawlers. Now we're negotiating with something that reads, reasons and transacts — and it doesn't need our homepage to do any of it.", "Mira Chen, head of platform research"],
                    ["p", "None of this is hypothetical. At least four major news organizations now earn measurable revenue from licensing their archives to model builders, and two large retailers disclose that agent-initiated checkouts are their fastest-growing sales channel. The infrastructure layer — inference, retrieval, identity for machines — is attracting the majority of this year's venture funding."],
                    ["h2", "What publishers are doing about it"],
                    ["ul", ["Licensing archives to model trainers, converting back catalogs into recurring revenue rather than decaying traffic.", "Building direct relationships — memberships, newsletters, apps — that survive the death of the accidental visitor.", "Publishing structured, machine-readable data so they appear inside answers rather than beneath them.", "Shipping their own assistants, trained on their own reporting, as products in their own right."]],
                    ["p", "None of these strategies fully replaces the old loop, and most executives will say so privately. Licensing revenue is real but concentrated among the largest brands. Memberships work for distinctively voiced outlets and struggle everywhere else. The middle of the market — competent, undifferentiated, ad-dependent — is being hollowed out."],
                    ["h2", "What comes next"],
                    ["p", "The emerging shape is a two-layer internet. A mediated layer, where agents and assistants negotiate access and settle payments automatically — fast, convenient, and controlled by a handful of gatekeepers. And a deliberate layer, where humans still go on purpose: newsletters, communities, live events, trusted mastheads. The middle layer of open, indexable, ad-funded pages shrinks every quarter."],
                    ["img", 17323801, "Rows of network equipment in a blue-lit data center", "The mediated internet runs here: inference clusters are becoming the new points of exchange between content and capital.", "xSypher / datacenter series"],
                    ["p", "The next internet will not be decided by a standard or a startup. It will be decided by thousands of quiet contracts — between models and publishers, agents and merchants, assistants and the people who trust them. The sites that understand they are now negotiating partners, rather than destinations, will write the terms. Everyone else will simply be summarized."]
                ]
            },
            {
                id: 2, slug: "small-ai-models", cat: "ai",
                title: "Why Small AI Models Are Becoming More Important",
                deck: "The frontier race grabs headlines, but the models quietly running on laptops, phones and edge servers are where the industry's economics actually live.",
                author: "Priya Sharma", role: "Senior AI Correspondent", age: 8, updated: "8 minutes ago", mins: 6, img: 8386356,
                alt: "Robotic hand reaching toward glowing light in a dark environment", views: 118400, trend: 4,
                tags: ["AI", "small models", "on-device"],
                body: [
                    ["p", "For three years the AI race was measured in one direction only: bigger models, bigger clusters, bigger rounds. This year the most consequential engineering is happening at the other end of the scale. Small models — typically under eight billion parameters — have crossed a quality threshold that changes what products can ship."],
                    ["p", "The drivers are unglamorous and commercial. A query answered on-device costs a fraction of a cent instead of several cents. It returns in milliseconds instead of seconds. And the data never leaves the user's hardware, which turns out to matter enormously to regulators, enterprises and anyone who has read a privacy policy."],
                    ["h2", "Why small suddenly wins"],
                    ["ul", ["Cost per query: distilled models now handle 70–80% of everyday tasks at roughly 1% of frontier inference cost.", "Latency: on-device inference makes features feel native — live captioning, instant summarization, real-time translation.", "Privacy and regulation: health, finance and legal customers increasingly require data to stay on premises.", "Offline resilience: factories, planes and hospitals do not have reliable gigabit connections — their software needs to work anyway."]],
                    ["quote", "The question shifted from 'how smart is it?' to 'how smart is it per dollar, per watt, per millisecond?' That's a business question — and business questions always get answered.", "Dr. Lena Fischer, ML infrastructure researcher"],
                    ["p", "The technical story behind the shift is a combination of distillation, better synthetic training data and architectures tuned for specific jobs rather than general conversation. The result is a generation of models that are worse at poetry and better at everything a product actually needs."],
                    ["p", "For developers, the practical upshot: the default architecture of 2026 is a router — a cheap classifier that sends most requests to a small local model and escalates the genuinely hard ones to a frontier service. The future of AI, it turns out, is mostly small, local and boring. That is exactly why it will work."]
                ]
            },
            {
                id: 3, slug: "openai-agent-platform", cat: "ai",
                title: "OpenAI Announces a New Generation of AI Tools for Developers",
                deck: "The new platform bundles agent runtimes, long-running memory and a payments layer — an explicit attempt to own the agent economy's plumbing.",
                author: "Ahmed Khan", role: "Technology Editor", age: 32, updated: "32 minutes ago", mins: 4, img: 8386440,
                alt: "Robotic hand pointing at a digital network on a blue background", views: 96700, breaking: true,
                tags: ["OpenAI", "agents", "developer tools"],
                body: [
                    ["p", "OpenAI on Tuesday unveiled a developer platform built around autonomous agents: software that can plan multi-step work, use tools, browse sanctioned sites and — most significantly — spend money within limits set by its owner."],
                    ["p", "The release bundles three components: a managed agent runtime with sandboxed execution, a persistent memory store that survives across sessions, and a payments rail that lets agents complete purchases and subscriptions through a single API. Pricing is usage-based, with free tiers for experimentation."],
                    ["quote", "Every platform shift creates a layer of plumbing that everyone relies on and nobody sees. We intend to be that layer for agent software.", "OpenAI developer relations lead, speaking at the launch event"],
                    ["ul", ["Managed runtimes with per-agent budgets and human-approval checkpoints.", "Cross-session memory with audit logs for enterprise compliance.", "A payments API integrated with major card networks, launching in 12 markets.", "A marketplace for third-party tools that agents can discover and call."]],
                    ["p", "The announcement lands in a crowded field. Browser makers, cloud providers and a swarm of well-funded startups are all racing to define how agents authenticate, pay and get audited. Analysts xSypher spoke with called the payments integration the most consequential piece — whoever standardizes agent checkout stands to sit beneath a meaningful share of commerce. Enterprise availability begins next quarter."]
                ]
            },
            {
                id: 4, slug: "race-to-run-ai-on-phone", cat: "ai",
                title: "The Quiet Race to Run AI on Your Phone",
                deck: "Chipmakers, OS vendors and model labs are converging on the same goal: an assistant that works with the radio off. Whoever wins owns the next interface.",
                author: "Liam Turner", role: "Staff Writer", age: 290, updated: "4 hours ago", mins: 6, img: 8728288,
                alt: "Two people interacting with futuristic digital interfaces", views: 74200,
                tags: ["AI", "mobile", "chips"],
                body: [
                    ["p", "The most interesting AI benchmark of the year isn't on a leaderboard. It's a number every phone maker now tracks obsessively: tokens per second, per watt, on a device that fits in a pocket. On-device inference has gone from marketing slide to engineering battleground in under eighteen months."],
                    ["p", "The motivation is threefold. Latency — a local model responds before a cloud round-trip finishes. Privacy — personal context never leaves the device. And cost — every cloud query subsidized by a hardware maker is a line item that scales brutally with usage."],
                    ["h2", "A three-way squeeze"],
                    ["p", "Chip vendors are redesigning NPUs around transformer workloads; OS vendors are rewriting assistant stacks to prefer local execution; model labs are shipping quantized versions of their best small models specifically for handsets. Each layer is optimizing for the others, which is what makes the race feel less like competition and more like co-evolution."],
                    ["quote", "The phone is the only computer that is always with you, always trusted and always connected to your life. If a model can live there, it becomes the default interface for everything else.", "Mobile silicon architect, speaking on background"],
                    ["p", "The constraint, as ever, is memory bandwidth — moving weights costs more energy than computing with them. Expect the next generation of handsets to be marketed less on camera megapixels and more on a single number: how large a model runs smoothly with the radio off. That number, not the cloud benchmark, will decide whose assistant you talk to in 2027."]
                ]
            },
            {
                id: 5, slug: "ai-transparency-labels", cat: "ai",
                title: "Regulators Push for Mandatory AI Transparency Labels",
                deck: "A draft framework in three jurisdictions would require AI-generated content to declare itself — and require the labels to survive screenshots.",
                author: "Priya Sharma", role: "Senior AI Correspondent", age: 660, updated: "9 hours ago", mins: 5, img: 8721317,
                alt: "Person wearing a VR headset in a dim room with retro technology", views: 61300,
                tags: ["AI", "regulation", "policy"],
                body: [
                    ["p", "Regulators in the EU, UK and Canada published coordinated draft rules this week that would require most AI-generated media to carry machine-readable provenance labels — and, more ambitiously, require those labels to survive re-encoding, cropping and screenshots."],
                    ["p", "The technical mechanism is a two-layer approach: cryptographic content credentials embedded at creation, plus invisible watermarking robust enough to persist through social platforms. Platforms above a defined size would be required to display a visible origin indicator."],
                    ["quote", "Disclosure that disappears the moment a file is re-saved is disclosure in name only. The engineering problem is hard, but it is not harder than the misinformation problem it addresses.", "Draft framework, explanatory memorandum"],
                    ["ul", ["Covers synthetic images, audio and video above a de minimis threshold.", "Machine-readable labels must persist through common transformations.", "Large platforms must surface a visible origin indicator in-feed.", "Fines tiered by platform revenue; two-year implementation window."]],
                    ["p", "Industry reaction split predictably. Camera and software makers — several of whom already ship content-credential tooling — endorsed the framework. Social platforms warned about enforcement at scale. The most contested clause is the screenshot requirement, which researchers call achievable but expensive. Public comment runs through the spring."]
                ]
            },
            {
                id: 6, slug: "ransomware-hospital-nine-days", cat: "cybersecurity",
                title: "Inside the Ransomware Attack That Stopped a Hospital Network for Nine Days",
                deck: "A forgotten VPN account, six weeks of silent lateral movement, and 31,000 rescheduled appointments. xSypher reconstructs how one health network went dark — and what brought it back.",
                author: "Elena Vasquez", role: "Senior Security Correspondent", age: 180, updated: "3 hours ago", mins: 9, img: 5380603,
                alt: "Dark room with code displayed on multiple monitors", views: 391800, trend: 2, most: 1, pick: 1,
                tags: ["ransomware", "healthcare", "incident response"],
                body: [
                    ["p", "At 2:14 a.m. on a Tuesday, every workstation in the emergency department of St. Alder Medical Center went black, then returned with a single message: your files had been encrypted, and the price of getting them back would go up in seventy-two hours. Within forty minutes, three more hospitals in the Meridian Health network showed the same screen. What followed was nine days of paper charts, diverted ambulances and an incident log that xSypher has now reviewed in full."],
                    ["p", "The headline numbers are severe: four hospitals partially offline, 31,000 appointments rescheduled, elective procedures suspended for over a week, and ambulance diversions on four of the nine days. No patient deaths have been attributed to the disruption, though the network's own review describes \"multiple near-misses\" during the diversion period."],
                    ["h2", "Nine days"],
                    ["ol", ["Week −6: attackers compromise a dormant VPN account belonging to a former contractor. No login anomaly alert fires — the account was technically still entitled.", "Week −5 to −1: quiet lateral movement across imaging, lab and scheduling systems; credentials harvested from two unpatched internal tools.", "Day 0, 2:14 a.m.: coordinated encryption across four sites, timed for minimum staffing.", "Day 0, 6:00 a.m.: incident team severs external connectivity and activates the paper-fallback protocol drilled the previous quarter.", "Day 2: forensics confirms a double-extortion intrusion — patient administrative data already exfiltrated.", "Day 4–8: segmented restoration from offline backups, beginning with emergency and ICU systems.", "Day 9: scheduling systems restored; the network declares operational recovery."]],
                    ["callout", "By the numbers", "9 days of partial outage · 31,000 appointments rescheduled · 4 days of ambulance diversions · 0 paid — the network refused to negotiate, a decision its board ratified within six hours."],
                    ["quote", "The tools that saved us were boring: offline backups, network segmentation, and a paper runbook we had drilled six times in two years. Nobody got through this because of a miracle product.", "Tomás Reyes, CISO, Meridian Health"],
                    ["h2", "What the attackers knew"],
                    ["p", "The intrusion follows the now-standard affiliate model: an initial-access crew sold entry, a ransomware brand executed the encryption, and a third party ran the data-leak negotiation. Stolen files included billing records and appointment histories for roughly 210,000 patients; clinical notes were encrypted but, the network says, not exfiltrated."],
                    ["ul", ["Kill dormant accounts on departure — entitlement reviews caught nothing here because nothing reviewed.", "Treat VPN anomalies as first-class alerts; a single contractor account should not be able to touch imaging.", "Segment clinical systems from scheduling and billing — the flat internal network did the attackers' work for them.", "Drill the fallback. Paper charts worked because staff had used them, not because they existed."]],
                    ["img", 1181316, "Engineer with a laptop standing in a mirrored data center corridor", "Health networks are now among the most heavily monitored environments in critical infrastructure — a status earned the hard way.", "xSypher / infrastructure series"],
                    ["p", "Healthcare is now the most-attacked sector in critical infrastructure for the third consecutive year, and Meridian's experience suggests the gap between prepared and unprepared organizations is widening. The network spent roughly $40 million on recovery and hardening. Its post-incident report is unusually candid — worth reading in full by anyone running systems where downtime is measured in patient outcomes, not revenue."]
                ]
            },
            {
                id: 7, slug: "encryption-library-emergency-patch", cat: "cybersecurity",
                title: "A Critical Flaw in a Widely Used Encryption Library Prompts Emergency Patches",
                deck: "The vulnerability in a TLS component present in thousands of enterprise products was fixed within hours — but the exposure window is still being mapped.",
                author: "Elena Vasquez", role: "Senior Security Correspondent", age: 65, updated: "1 hour ago", mins: 5, img: 5935787,
                alt: "Person typing on a laptop with code on screen in darkness", views: 88900, breaking: true,
                tags: ["vulnerability", "TLS", "patching"],
                body: [
                    ["p", "Security researchers disclosed an emergency patch this morning for a memory-handling flaw in a TLS implementation embedded in thousands of commercial and open-source products. The maintainers rated the bug critical and shipped fixes within hours of private report — an unusually fast turnaround that itself signals severity."],
                    ["p", "The flaw sits in certificate-parsing code, a component so foundational that it ships inside load balancers, VPN appliances, container runtimes and embedded devices. Early analysis suggests remote exploitation is feasible in default configurations, though no in-the-wild activity had been confirmed at publication time."],
                    ["ul", ["Patch TLS libraries and base images immediately; assume anything internet-facing is affected.", "Inventory embedded devices — routers, IP cameras, industrial controllers rarely patch themselves.", "Watch for unusual ClientHello traffic; several vendors published detection signatures this morning.", "Assume exposure began at disclosure and rotate long-lived session credentials accordingly."]],
                    ["quote", "The good news is the responsible-disclosure machinery worked exactly as designed. The bad news is 'designed' includes a global scramble to find every appliance that quietly bundles the library.", "Independent security researcher involved in the disclosure"],
                    ["p", "xSypher will update this story as vendors publish affected-product lists. The broader lesson is familiar: modern infrastructure is a dependency graph, and the most dangerous vulnerabilities live in the layers nobody remembers installing."]
                ]
            },
            {
                id: 8, slug: "passkeys-tipping-point", cat: "cybersecurity",
                title: "Passkeys Finally Cross the Tipping Point, Security Researchers Say",
                deck: "New adoption data shows passkey logins overtaking SMS codes at a growing list of major services. The password's replacement stopped being theoretical this year.",
                author: "Elena Vasquez", role: "Senior Security Correspondent", age: 330, updated: "5 hours ago", mins: 6, img: 37709121,
                alt: "Glowing laptop keypad with a digital interface overlay", views: 203400, most: 5,
                tags: ["passkeys", "authentication", "identity"],
                body: [
                    ["p", "For years, passkeys were the authentication industry's favorite promise: phishing-resistant credentials that users would actually like. The annoying part — synchronizing them across devices and ecosystems — kept adoption stuck in the single digits. New data from three major identity providers shows that changed this year, with passkey logins now outnumbering SMS one-time codes at a growing list of large services."],
                    ["p", "The shift has three causes. Cross-device sync finally matured on all major platforms. Regulators in two jurisdictions formally discouraged SMS-based two-factor authentication for financial services. And — underrated — the user experience improved to the point where support tickets for passkey sign-in now run below those for passwords."],
                    ["h2", "What the data shows"],
                    ["p", "Across services that offer both, users presented with a passkey-first login complete authentication faster and abandon less often than with any other method, including passwords plus an authenticator app. Phishing is the metric that matters most: credentials that never exist as a typed secret cannot be phished as one."],
                    ["quote", "We've spent thirty years training people to type secrets into boxes and then blaming them when the box was fake. Passkeys remove the secret. That's not an improvement — it's a category change.", "Authentication researcher, speaking at a security conference this month"],
                    ["ul", ["Cross-device passkey sync is now default on the four largest ecosystems.", "SMS 2FA is formally discouraged for regulated financial logins in two jurisdictions.", "Enterprise directory vendors shipped passkey enforcement controls this year.", "Recovery remains the weak point — account-recovery flows are the new phishing target."]],
                    ["p", "The caveats are real: recovery flows, device loss and enterprise legacy systems keep passwords alive for years yet. But the trajectory is no longer in doubt. Security teams reading this should be planning a passkey-first policy for 2027 — and treating recovery design as the hard part, because it is."]
                ]
            },
            {
                id: 9, slug: "smart-home-spy-networks", cat: "cybersecurity",
                title: "How Attackers Are Turning Smart Home Devices Into Spy Networks",
                deck: "Researchers documented a campaign abusing cameras, baby monitors and robot vacuums — not to steal data from them, but to listen through them.",
                author: "Elena Vasquez", role: "Senior Security Correspondent", age: 560, updated: "Yesterday", mins: 6, img: 1933900,
                alt: "Laptop with red glowing keyboard in a dark room", views: 145700,
                tags: ["IoT", "privacy", "botnets"],
                body: [
                    ["p", "A research team published details this week of a campaign that compromises consumer smart-home devices — cameras, baby monitors, smart displays, even robot vacuums with microphones — and stitches them into rented listening networks. The devices aren't the target. They're the infrastructure."],
                    ["p", "The intrusion method is almost embarrassing: default or reused credentials on internet-exposed administration panels, years after the industry promised secure-by-default. Once inside, the malware disables status LEDs where possible and streams audio to relay servers, with access sold by the hour on closed forums."],
                    ["h2", "Signs a device may be compromised"],
                    ["ul", ["Status lights disabled or behaving inconsistently.", "Unexplained bandwidth usage, particularly uploads, overnight.", "Device warm when it should be idle; fans running on always-on hardware.", "Login notifications from unfamiliar locations — where the device reports them at all."]],
                    ["quote", "We keep treating the smart home as a collection of conveniences. The adversary treats it as a real-estate portfolio of microphones with power supplies.", "Lead researcher on the campaign"],
                    ["p", "The remediation advice is familiar and effective: change default credentials on day one, place IoT devices on an isolated network segment, disable remote administration you don't use, and replace devices that no longer receive firmware updates. None of it is hard. All of it is optional — which is precisely the problem the industry has declined to legislate away."]
                ]
            },
            {
                id: 10, slug: "foldable-phones-growing-up", cat: "gadgets",
                title: "The Foldable Phone Era Is Growing Up — and Prices Are Finally Falling",
                deck: "First-generation foldables cost $1,980 and felt like prototypes. This year's crop starts under $900, survives 500,000 folds, and has fixed the three things that mattered.",
                author: "Daniel Okafor", role: "Gadgets Editor", age: 130, updated: "2 hours ago", mins: 7, img: 207289,
                alt: "Close-up of a smartphone with a textured back cover", views: 167900, trend: 3, pick: 1,
                tags: ["foldables", "smartphones", "hardware"],
                body: [
                    ["p", "The foldable phone spent five years as a luxury proof-of-concept — impressive in a brief hands-on, hard to justify at the register. This year the category quietly became a product line. Prices have fallen below $900 at the entry, hinge ratings have moved from 200,000 to 500,000 certified folds, and the three complaints that defined the first generation have engineering answers now rather than roadmap promises."],
                    ["p", "The crease is the headline. New ultra-thin glass with laser-drilled microstructures distributes stress across the fold instead of concentrating it at a line; under normal lighting the current generation is visible only at an angle you'd never hold a phone. IP ratings have caught up too — the newest hinges carry full dust resistance, historically the foldable's fatal weakness."],
                    ["h2", "What actually changed"],
                    ["ul", ["Hinges: gearless designs with liquid-metal cams cut thickness and eliminated the gap when closed.", "Glass: micro-structured UTG makes the crease optically negligible in daily use.", "Durability: 500,000-fold certifications (~10 years at 100 folds a day) are now standard on flagships.", "Dust: IP58-rated hinges remove the category's oldest excuse.", "Software: proper taskbars, drag-and-drop and app-pairing make the inner screen genuinely productive."]],
                    ["quote", "Foldables stopped being a demo the day the repair quotes got boring. When a hinge swap costs what a screen swap costs, the category is normal.", "Karim Haddad, hardware analyst, Meridian Research"],
                    ["h2", "The software was always the real product"],
                    ["p", "Hardware got the attention, but app continuity decided the category. The current generation of large-screen Android ships with a real taskbar, resizable windows and cross-app drag-and-drop that make the unfolded screen a workspace rather than a zoomed-in phone. Developers have followed: the share of top-500 apps with genuine large-screen layouts tripled in eighteen months."],
                    ["p", "What's next is visible in supply-chain filings: tri-fold devices entering production and early rollable displays from two manufacturers. Our buying advice for now: if you wanted a foldable and waited on price or durability, the objections have been addressed. If you waited because you couldn't name a use for the big screen — that problem is a software story, and it finally has an answer too."]
                ]
            },
            {
                id: 11, slug: "flagship-camera-test-2026", cat: "reviews",
                title: "We Tested 12 Flagship Phone Cameras. The Results Surprised Us.",
                deck: "A month of controlled scenes, low-light runs and 2,400 frames later: hardware gaps have closed, and the winners are decided by decisions, not sensors.",
                author: "Aisha Bello", role: "Reviews Editor", age: 1440, updated: "Yesterday", mins: 10, img: 33210184,
                alt: "Detailed shot of a smartphone camera module", views: 228500,
                tags: ["review", "cameras", "smartphones"],
                body: [
                    ["p", "Every year we run the same test: twelve current flagships, identical scenes, identical light, from studio charts to a genuinely hostile concert-hall gig. Every year the gap narrows. This year it nearly vanished — and what separated the leaders turned out to be something you can't put on a spec sheet."],
                    ["p", "Sensor hardware has converged. The same three foundries make the silicon; the lenses are diffraction-limited at these apertures anyway. At pixel-peeping distance, the twelve phones in this test are within a margin most people will never notice. What diverges — dramatically — is the computational layer: what each camera decides the photo should look like before you see it."],
                    ["ol", ["Best overall: the winner balanced skin tones, motion handling and shutter lag — the three things you actually feel. Its night mode is no longer the brightest, and it's better for it.", "Best low light: a darker, more honest rendering that preserves atmosphere instead of flattening everything into daytime.", "Best video: stabilization and audio both lead, by the widest video margin we've measured in three years."]],
                    ["h2", "The surprise"],
                    ["p", "Two phones costing half the leader's price finished inside the top five. Both made the same choice: less processing, more optics per dollar, and a willingness to leave shadows dark. Meanwhile two of the most expensive flagships oversharpened and overbrightened their way down the table — a reminder that camera marketing still sells brightness as quality."],
                    ["quote", "The best phone camera in 2026 isn't the one that captures the most light. It's the one that makes the fewest bad decisions about what the moment looked like.", "xSypher camera lab, test notes"],
                    ["p", "Full scoring tables, all 2,400 frames and the methodology are on the reviews hub. If you're buying this quarter: spend less on the camera spec sheet and more on whether you like how a phone renders faces — that taste question is the only one the charts can't answer for you."]
                ]
            },
            {
                id: 12, slug: "solid-state-batteries-change-everything", cat: "gadgets",
                title: "Solid-State Batteries Are About to Change Everything You Carry",
                deck: "The first consumer devices with solid-state cells ship this year. The claims — double the density, minutes to charge — survived contact with our test bench.",
                author: "Daniel Okafor", role: "Gadgets Editor", age: 1560, updated: "Yesterday", mins: 6, img: 36068862,
                alt: "Macro shot of electronic circuitry around a camera lens", views: 134600,
                tags: ["batteries", "hardware", "energy"],
                body: [
                    ["p", "Solid-state batteries have spent a decade as the technology that is always five years away. That joke expires this year: two device makers are shipping consumer hardware with solid-state cells this quarter, and three more have confirmed 2027 products. We got early access to one of the first units, and the spec sheet held up."],
                    ["p", "The physics advantage is straightforward. Replacing the liquid electrolyte with a solid ceramic or polymer lets cells pack more energy into less volume, tolerate faster charging without the dendrite growth that causes fires, and operate across a wider temperature range. Our test unit delivered 94% of its claimed density — remarkable for first-generation hardware — and charged to 80% in eleven minutes while staying merely warm."],
                    ["h2", "What it means for your devices"],
                    ["ul", ["Phones: same-size batteries with 40–60% more capacity, or same capacity in a noticeably thinner body.", "Laptops: all-day machines measured in real workdays rather than video-playback fantasy tests.", "Wearables: the category's real constraint — battery volume — relaxes for the first time in a decade.", "EVs: the volume story matters most here, but automotive-grade cells remain 18–24 months behind consumer."]],
                    ["quote", "Every battery breakthrough of the last decade died in manufacturing. This one survived the factory — that's the actual news, and everything else follows from it.", "Battery research lead, speaking at an industry summit"],
                    ["p", "The caveats are real: first-generation cost is high, cold-weather performance still trails claims slightly, and the recycling chain doesn't exist yet. But the direction is irreversible. The devices you buy in 2028 will assume solid-state as a baseline — and today's two-day phone battery will feel as quaint as a week of standby."]
                ]
            },
            {
                id: 13, slug: "return-of-physical-keyboard", cat: "gadgets",
                title: "The Return of the Physical Keyboard (Seriously)",
                deck: "Mechanical keyboard revenue has grown nine quarters straight, and three phone makers are testing click-on keyboard cases. Tactility, it turns out, was a feature.",
                author: "Daniel Okafor", role: "Gadgets Editor", age: 2100, updated: "2 days ago", mins: 5, img: 7915219,
                alt: "Hand on a glowing mechanical keyboard in a dark setting", views: 98400,
                tags: ["keyboards", "hardware", "trends"],
                body: [
                    ["p", "Somewhere between the ninth hour of remote work and the fourteenth revision of a document, a surprising number of people decided the glass rectangle under their fingers was the problem. Mechanical keyboard sales have now grown for nine consecutive quarters, the enthusiast end of the market supports a cottage industry of lubed switches and artisan keycaps, and — the data point that made us pay attention — three phone makers are piloting magnetic keyboard cases."],
                    ["p", "The explanation isn't nostalgia, or not only nostalgia. Haptic research keeps arriving at the same finding: physical confirmation reduces error rates and, more importantly, changes the felt cost of typing, which changes how much people write. A keyboard you can feel is a keyboard you trust, and trust is an input device's most underrated spec."],
                    ["h2", "What changed the math"],
                    ["p", "Low-profile switch designs solved the thickness problem that killed phone keyboards the first time. Hall-effect switches brought adjustable actuation — the same board tuned for gaming at night and essays in the morning. And manufacturers finally priced the mid-market sensibly: the sub-$80 segment now offers what cost $180 five years ago."],
                    ["quote", "Touchscreens won because they were flexible, not because they felt good. Every input modality that survived — mice, trackpads, styluses — survived on feel. Keyboards are just collecting on the same principle.", "Hardware ergonomics researcher"],
                    ["p", "Will keyboard phones return as a category? Probably not beyond a profitable niche. But the broader correction is real: after fifteen years of designing interfaces for manufacturing convenience and calling it minimalism, the industry is remembering that hands have opinions. Tactility wasn't legacy. It was a feature we priced out."]
                ]
            },
            {
                id: 14, slug: "operating-systems-becoming-assistants", cat: "software",
                title: "Operating Systems Are Becoming AI Assistants Whether You Like It or Not",
                deck: "This year's OS releases all shipped the same idea: the interface is now something you talk to. The permission models haven't caught up.",
                author: "Priya Sharma", role: "Senior AI Correspondent", age: 260, updated: "4 hours ago", mins: 7, img: 1181271,
                alt: "Laptop displaying lines of code with soft reflections", views: 267300, most: 3,
                tags: ["operating systems", "AI", "platforms"],
                body: [
                    ["p", "The operating system used to be a place: a desktop, a file system, a set of windows you arranged. Every major release this year shipped the same redefinition — the OS as an assistant that happens to contain a place. You describe an outcome; the system marshals the apps. It is the biggest interface shift since touch, and it arrived with remarkably little public debate."],
                    ["p", "The capabilities are genuinely useful. Cross-app actions that used to require an automation hobbyist — collect these messages, summarize, draft replies, file the attachments — are now one sentence away. System settings, historically buried six menus deep, are increasingly reachable by asking. For accessibility users especially, the change is significant and welcome."],
                    ["h2", "The interface is the agent"],
                    ["p", "Under the hood, each vendor built some version of the same architecture: an on-device model with screen-reading privileges, an action layer that can operate other apps, and a cloud fallback for hard queries. The differentiation is in trust design — what the assistant may do unasked, what requires confirmation, and what it can see while doing it."],
                    ["quote", "Every OS vendor looked at the chatbox and realized it was a launcher that could talk back. The strategic question isn't whether assistants run on top of operating systems. It's whether operating systems survive as anything more than the assistant's body.", "Prof. Elena Brandt, human-computer interaction researcher"],
                    ["ul", ["Permission granularity lags capability: most systems grant app-level access where action-level is what users would consent to.", "Screen-reading assistants create a new telemetry surface — what the model 'sees' is a policy question vendors answer quietly.", "Enterprise management tools are a release behind, as usual.", "Lock-in compounds: your assistant learns your workflows, and that knowledge doesn't migrate."]],
                    ["p", "None of this argues for turning the feature off. It argues for reading the toggles: every vendor ships conservative defaults behind at least one screen of settings. The assistant-era OS is arriving whether anyone votes on it. The least users deserve is to know what they've agreed to — and right now, the honest answer is that the interface makes it easy to say yes and hard to see what yes means."]
                ]
            },
            {
                id: 15, slug: "every-productivity-app-is-an-ai-app", cat: "software",
                title: "Why Every Productivity App Is Suddenly an AI Productivity App",
                deck: "Notes apps, calendars, to-do lists — all of them shipped an assistant this year. We looked at which integrations users actually keep turned on.",
                author: "Liam Turner", role: "Staff Writer", age: 1980, updated: "Yesterday", mins: 5, img: 34803969,
                alt: "Laptop displaying code in a dim room with a coffee mug nearby", views: 87200,
                tags: ["productivity", "apps", "AI"],
                body: [
                    ["p", "Open any productivity app released or updated this year and you will find the same addition: a text field that glows, a sparkle icon, an assistant. Notes apps that summarize. Calendars that negotiate. To-do lists that write themselves. The feature-parity arms race has produced a genuine question: which of these integrations do users actually keep on?"],
                    ["p", "Usage data shared with xSypher by three app makers points to a clear hierarchy. Features that reduce input friction — turning a voice ramble into a structured note, extracting tasks from an email thread — show retention above 60% after thirty days. Features that substitute judgment — auto-prioritizing a task list, auto-declining meetings — see most users disable them within a week."],
                    ["h2", "The pattern"],
                    ["p", "The dividing line is legible: users want a faster version of their own decisions, not someone else's decisions made faster. Summarization is a typewriter; auto-prioritization is a manager. People adopted typewriters. They fired managers they didn't hire."],
                    ["quote", "The apps winning with AI didn't add intelligence. They removed friction at the exact moment of capture — the one moment when users are actually typing.", "Product lead at a major notes app"],
                    ["p", "For buyers drowning in sparkle icons, the heuristic writes itself: keep the features that accelerate what you were already doing, and interrogate anything that claims to know better. The best productivity software of the next few years won't be the smartest. It will be the one that most faithfully amplifies the person using it."]
                ]
            },
            {
                id: 16, slug: "javascript-at-31", cat: "programming",
                title: "JavaScript at 31: The Language That Refuses to Sit Still",
                deck: "Created in ten days in 1995, written off in every era since, JavaScript enters its fourth decade with a type system proposal, three serious runtimes and no retirement plan.",
                author: "Marcus Webb", role: "Programming Editor", age: 390, updated: "6 hours ago", mins: 8, img: 34804011,
                alt: "Laptop screen showing programming code with a reflection", views: 189200, trend: 5, pick: 1,
                tags: ["JavaScript", "languages", "TC39"],
                body: [
                    ["p", "JavaScript turned thirty-one this year, an age at which most programming languages are either institutional or forgotten. It is neither. The language created in ten days in 1995 — famously, by one engineer racing a product deadline — now runs on more devices than any other language in history, and its standards committee is currently debating a feature its critics demanded for twenty years: types."],
                    ["p", "The type-erasure proposal is the state of the ecosystem in miniature. Rather than fork the language or bolt on a compiler — the TypeScript route, now so successful it powers most professional JavaScript — TC39 is working to make type annotations native syntax that engines simply ignore. Pragmatism as identity: the language that absorbed JSON, absorbed async, absorbed modules, prepares to absorb its own most successful dialect."],
                    ["h2", "The runtime wars"],
                    ["p", "Server-side JavaScript is in the middle of its most interesting period since Node. Deno's standards-first approach forced the ecosystem to take Web APIs seriously on the server; Bun's performance claims made startup latency a benchmark everyone now reports. Node responded with its own overhauls. The beneficiary is developers, who now choose runtimes the way they choose databases — based on workload rather than default."],
                    ["pre", "// The modern baseline: top-level await, fetch, structured cloning\nconst deploy = await fetch(\"/api/deploy\", {\n  method: \"POST\",\n  body: JSON.stringify({ env: \"production\" })\n}).then(r => r.json());\n\nconsole.log(`Live in ${deploy.ms}ms — no build step, no polyfills`);"],
                    ["quote", "JavaScript wins by absorption. Every paradigm that threatened it — classes, modules, types, functional patterns — ended up as a feature of it. It's the most successful compatibility layer ever written, and the thing it's compatible with is the entire web.", "Sara Lindqvist, TC39 delegate"],
                    ["img", 34803999, "Close-up of a monitor displaying code and debugging tools", "Thirty-one years on, the debugger is still open — but the stack traces finally have types.", "xSypher / dev series"],
                    ["ul", ["Type annotations as native, erased syntax — the largest proposed change in a decade.", "Signals-style reactivity being standardized rather than left to frameworks.", "WebAssembly carving out the numerical hot paths JS was never built for.", "Edge runtimes making cold-start time a first-class platform metric."]],
                    ["p", "Will JavaScript still be here in another decade? The question has been asked in every decade of its life, usually over the grave of whatever language was supposed to replace it. The smarter bet is the boring one: the language that runs everywhere, hires everywhere and absorbs everything will outlast most of its critics — again."]
                ]
            },
            {
                id: 17, slug: "rust-became-the-default", cat: "programming",
                title: "How Rust Became the Default for Systems Programming",
                deck: "Not the only choice, not the mandated one — just the one teams reach for when failure is expensive. The tipping point arrived quieter than the discourse.",
                author: "Marcus Webb", role: "Programming Editor", age: 1620, updated: "Yesterday", mins: 6, img: 34803966,
                alt: "Computer screen showing code and debugging tools", views: 112800,
                tags: ["Rust", "systems", "open source"],
                body: [
                    ["p", "There was no announcement, and that's the point. Rust's arrival as the default for new systems projects happened the way defaults actually change: a kernel team here, a database there, a procurement policy somewhere else, until the question flipped. Teams no longer ask why they'd write memory-safe systems code in Rust. They ask why they'd write it in anything else."],
                    ["p", "The numbers behind the flip are old news to anyone in infrastructure: roughly 70% of critical security vulnerabilities in large C/C++ codebases trace to memory-safety bugs, and the two governments that publish such statistics have both issued formal guidance toward memory-safe languages. What changed this year is economic rather than technical — the talent pool crossed the threshold where hiring Rust engineers stopped being a project risk."],
                    ["h2", "Where it's landing"],
                    ["ul", ["Operating system kernels: second-language status in Linux, greenfield cores in new systems.", "Infrastructure: proxies, load balancers and the tooling layer of cloud platforms.", "Embedded and automotive: certification pipelines matured this year, unlocking the regulated markets.", "Developer tooling: the fastest CLI tools in every ecosystem are now Rust-written."]],
                    ["quote", "Nobody won a language war. C is still running the world. What happened is that every new system where failure costs money or lives started shipping in Rust by default — and defaults compound.", "Infrastructure engineering lead at a major cloud provider"],
                    ["p", "The honest caveats remain: the learning curve is real, compile times tax CI budgets, and FFI boundaries between old and new code are where the bugs now hide. But the direction of travel is settled. The systems layer of the next decade will be written in a memory-safe language, and the argument about which one is, for most teams, already over."]
                ]
            },
            {
                id: 18, slug: "rise-of-local-first-software", cat: "programming",
                title: "The Rise of Local-First Software and Why Developers Care",
                deck: "CRDTs, sync engines and a quiet revolt against the spinner: the local-first movement is rebuilding the assumptions underneath everyday applications.",
                author: "Marcus Webb", role: "Programming Editor", age: 990, updated: "Yesterday", mins: 7, img: 37880001,
                alt: "Hands typing on a laptop keyboard while coding", views: 176500, most: 4,
                tags: ["local-first", "CRDTs", "architecture"],
                body: [
                    ["p", "Every developer has the same list of embarrassments: the document lost to a network blip, the edit that vanished in a merge, the app that becomes a paperweight on a plane. Local-first software is the architectural answer — an approach where your data lives on your device, the app works fully offline, and synchronization happens in the background as an optimization rather than a precondition."],
                    ["p", "The enabling technology is conflict-free replicated data types — CRDTs — data structures that can be edited independently on multiple devices and merged mathematically, without a server arbitrating. Once exotic research material, CRDTs now ship in production sync engines used by some of the most demanding collaboration apps in the market."],
                    ["h2", "Why it resonates"],
                    ["p", "The appeal is partly experiential: instant loads, zero spinners, and software that survives its vendor's shutdown — your data outlives the service because it never depended on it. It's partly ethical: ownership rather than tenancy. And it's partly commercial; the subscription fatigue that defines this era gives users a concrete reason to prefer apps that work when the billing server doesn't answer."],
                    ["quote", "The cloud taught us to treat the network as reliable. Local-first teaches us to treat the user's data as theirs. Both lessons are about the same thing: where you put your trust.", "Distributed systems engineer and sync-engine maintainer"],
                    ["ul", ["Sync engines matured: several production-grade options with multi-platform clients.", "Database vendors added CRDT replication as a first-class feature this year.", "Enterprise interest is surging — offline-capable field software is the wedge.", "Honest tradeoffs remain: storage duplication, device-to-device sync complexity, and harder server-side analytics."]],
                    ["p", "Local-first will not replace server-backed software; collaboration at scale still needs a backbone. But the default assumption — that an application is a view onto someone else's database — is finally being contested. For developers, that's the exciting part: a genuinely new architectural center of gravity, with real problems still worth solving."]
                ]
            },
            {
                id: 19, slug: "startup-funding-rebound-new-rules", cat: "business",
                title: "The Startup Funding Rebound Is Real — but the Rules Have Changed",
                deck: "Deal volume is back to pre-correction levels. The money is different, though: concentrated, infrastructure-hungry and far less patient with narratives.",
                author: "Hana Yoshida", role: "Business Correspondent", age: 430, updated: "7 hours ago", mins: 6, img: 7550304,
                alt: "Two people working on laptops in an office", views: 94600, breaking: true,
                tags: ["startups", "venture capital", "funding"],
                body: [
                    ["p", "The correction is officially over, by the only measure venture capital respects: money moved. Global startup funding this quarter returned to pre-correction volume, and the mood in founder circles has shifted from survival arithmetic to hiring plans. Anyone expecting a simple return to 2021, however, is reading the wrong chart."],
                    ["p", "The rebound has a shape, and it's a barbell. At one end, enormous rounds concentrated in AI infrastructure — compute, inference, data pipelines — where a dozen companies absorbed a third of all capital. At the other, a revived seed market funding small teams with unfashionable virtues: revenue from month one, narrow scope, and no infrastructure ambitions of their own. The hollow middle — growth-stage companies burning for scale — remains brutally competitive."],
                    ["h2", "What changed at the table"],
                    ["quote", "Founders used to raise on the market they described. Now they raise on the unit economics they prove. The pitch deck got shorter and the data room got longer — and honestly, the companies are better for it.", "Partner at a multi-stage venture firm"],
                    ["ul", ["Revenue multiples replaced user multiples as the default valuation anchor in most sectors.", "AI infrastructure absorbed roughly a third of global venture capital.", "Time-to-term-sheet fell by a third at seed — decisions are faster when the thesis is clearer.", "Down-round protections and structured terms are now standard, not distress signals."]],
                    ["p", "The practical read for founders: the window is open but the bar moved. Capital is available earlier and cheaper for businesses that can show paid demand, and punitively expensive for those that can't. The era of funded potential is over. The era of funded proof — which, founders will note, is simply what 'venture' was always supposed to mean — is back."]
                ]
            },
            {
                id: 20, slug: "big-tech-400-billion-ai-bet", cat: "business",
                title: "Big Tech's $400 Billion Bet on AI Infrastructure, Explained",
                deck: "The four largest platforms will spend more on data centers this year than the GDP of most countries. Here's the math behind the largest capital program in corporate history.",
                author: "Hana Yoshida", role: "Business Correspondent", age: 780, updated: "Yesterday", mins: 8, img: 17489160,
                alt: "Illuminated server racks in a blue-lit data center", views: 356700, most: 2, breaking: true,
                tags: ["AI infrastructure", "capex", "data centers"],
                body: [
                    ["p", "Add up the capital guidance of the four largest platform companies and you reach a number that stops making intuitive sense: roughly $400 billion this year, mostly on AI infrastructure — chips, servers, networking, cooling, and the buildings and power to house them. It is the largest coordinated capital program in corporate history, and it is being financed almost entirely from operating cash flow."],
                    ["p", "The bulls' math is simple: inference demand is compounding faster than any compute supply in history, and every dollar of capacity deployed this year is contracted out before it powers on. The bears' math is equally simple: revenue attributable to AI products currently covers a fraction of the depreciation this spending will generate. Both sides agree on one thing — the outcome hinges on whether AI revenue grows like a platform or like a product."],
                    ["h2", "Where the money goes"],
                    ["callout", "By the numbers", "~$400B combined annual capex · ~70% on compute hardware · multi-year power purchase agreements signed for more than 15 GW · construction timelines, not capital, now the binding constraint."],
                    ["quote", "This isn't a bet on a product category. It's a bet that intelligence becomes a utility — metered, indispensable and boring. Utilities aren't glamorous, but nobody doubts people pay for electricity.", "Infrastructure analyst covering the hyperscalers"],
                    ["p", "The second-order effects are where the story gets concrete for everyone else. Power utilities in three regions have revised decade plans upward. A supply chain spanning advanced packaging, liquid cooling and industrial gas is hiring at rates not seen in a generation. And enterprise buyers are watching the same builds and quietly asking their vendors the uncomfortable question: if this capacity exists, why is inference still priced like it's scarce?"],
                    ["p", "History's infrastructure booms — rail, electrification, fiber — share a pattern: the builders overbuild, the market corrects, and the surplus becomes the foundation of the next economy. The fiber bust of 2001 bankrupted the builders and then powered the web 2.0 era at a discount. Whether AI's boom ends in the same sequence is the defining business question of the decade. The money has already answered. Now the usage has to."]
                ]
            },
            {
                id: 21, slug: "semiconductor-startups-moment", cat: "business",
                title: "Why Semiconductor Startups Are Having a Moment Again",
                deck: "Designing a chip used to cost more than most Series Bs. New tooling, open fabrication access and AI's appetite for weird silicon changed the math.",
                author: "Hana Yoshida", role: "Business Correspondent", age: 2640, updated: "2 days ago", mins: 5, img: 6804068,
                alt: "Team of developers working at computers in a modern office", views: 67900,
                tags: ["semiconductors", "startups", "hardware"],
                body: [
                    ["p", "For twenty years, the semiconductor startup was an endangered species. Mask sets cost eight figures, design cycles took three years, and the graveyard of companies that ran out of money one tape-out short of revenue was long enough to deter most investors. This year, semiconductor startups closed more funding than in any year since the dot-com era. The economics that killed them are quietly being rewritten."],
                    ["p", "Three forces converged. AI workloads need specialized silicon that general-purpose chips serve badly, creating customers with urgent, specific demand. Modern design tooling — much of it itself AI-assisted — has cut engineering effort on common blocks dramatically. And multi-project wafer programs from major fabs now let startups share a mask set, bringing first-silicon costs down from nine figures to seven."],
                    ["h2", "The new shape of chip companies"],
                    ["p", "The archetype is no longer 'the next Intel.' It's a twenty-person team shipping a domain-specific accelerator to one anchor customer under a design partnership — revenue before the second tape-out. Several of this year's largest hardware rounds followed exactly that pattern, with the anchor customer in the cap table."],
                    ["quote", "The question used to be 'who will fund your first fab run?' Now it's 'who is your launch customer?' That's a fundamentally healthier industry — capital follows demand instead of the other way around.", "Deep-tech investor with three semiconductor portfolio companies"],
                    ["p", "Risks remain — fabrication capacity still concentrates in very few hands, and geopolitics is a design constraint now, not a footnote. But the direction is clear: silicon is becoming accessible to software-speed companies, and the next decade's most interesting chips will come from teams that didn't exist three years ago."]
                ]
            },
            {
                id: 22, slug: "handheld-gaming-renaissance", cat: "gaming",
                title: "The Handheld Gaming Renaissance Is Just Getting Started",
                deck: "Three new PC handhelds, two console successors and a phone ecosystem that finally takes games seriously: the couch is no longer the center of gaming.",
                author: "Tom Becker", role: "Gaming Editor", age: 520, updated: "8 hours ago", mins: 6, img: 5713095,
                alt: "Illuminated game controller against a dark background", views: 143200, breaking: true,
                tags: ["handhelds", "gaming hardware"],
                body: [
                    ["p", "The defining hardware story in gaming isn't a console — it's the absence of one. The fastest-growing segment of the market is devices you hold: PC handhelds from three manufacturers, the next generation of dedicated gaming handhelds, and phones that finally treat gaming as a first-class workload rather than an apology. The living-room box isn't dying. It's becoming optional."],
                    ["p", "The enablers are unglamorous: efficient chip designs that deliver console-class performance at a tenth of the power draw, displays that made 120Hz affordable at eight inches, and — the quiet giant — storefronts and cloud saves that let a session resume across devices without friction. The technology existed before; the ecosystem maturity is what's new."],
                    ["h2", "Why now"],
                    ["ul", ["Chip efficiency: current APUs deliver four-year-old console performance under 20 watts.", "Libraries: backward compatibility means a new handheld boots into a 15-year catalog.", "Play patterns: adult gamers have commutes, queues and sleeping partners. Short-session play is the growth segment.", "Publishers noticed: 'handheld-verified' programs now influence what gets ported."]],
                    ["quote", "We used to design a game, then ask whether it would survive a small screen. Now the first design question for half the studios we work with is 'how does this play in a twenty-minute session, held in your hands?'", "Publishing executive at a major studio"],
                    ["p", "The strategic stakes extend beyond hardware margins. Whoever owns the handheld owns the most personal gaming session of the day — and the data that comes with it. Expect the next two years to bring aggressive moves: subscription bundles built around portable play, and at least one acquisition aimed squarely at the handheld stack. The renaissance isn't a trend. It's a reallocation of where gaming lives."]
                ]
            },
            {
                id: 23, slug: "cloud-gaming-what-it-delivered", cat: "gaming",
                title: "Cloud Gaming Promised Everything. Here's What It Actually Delivered.",
                deck: "A decade after the demo that stunned E3, streaming games found its real use case — and it isn't the one anyone pitched.",
                author: "Tom Becker", role: "Gaming Editor", age: 2280, updated: "2 days ago", mins: 6, img: 9071735,
                alt: "Gamer playing in a neon-lit room surrounded by screens", views: 88300,
                tags: ["cloud gaming", "streaming", "industry"],
                body: [
                    ["p", "The cloud gaming pitch, a decade ago, was total: any screen, any game, no hardware, the console obsolete. The industry spent billions on data centers, acquired studios, and demoed a future where latency was a solved problem. Then the future arrived with an invoice, and the math turned out to be less forgiving than the keynote."],
                    ["p", "The honest accounting: cloud gaming failed as a console killer and succeeded as infrastructure. The economics that killed the standalone vision — per-user compute that never amortizes like a $500 box sold at a loss — are exactly the economics that work when streaming is a feature rather than the product: trial-before-install, instant play from a storefront, and continuation across devices."],
                    ["h2", "What survived"],
                    ["p", "Every surviving cloud gaming service converged on the same three use cases. Demos that boot in seconds instead of downloading for an hour. Library access on screens that will never own a console. And save-state continuity — pause in the living room, resume on a handheld or a hotel TV. None of these required the revolution. All of them required the infrastructure the revolution built."],
                    ["quote", "Cloud gaming lost the war everyone was watching and won the one nobody was. The killer app was never 'play Cyberpunk on your fridge.' It was 'the game is already running when you decide to play it.'", "Industry analyst covering platform strategy"],
                    ["p", "The lesson generalizes beyond games. Platform revolutions rarely arrive as advertised; they arrive as components. The data centers built for a console-less future now power trials, streaming and cross-device play across every major storefront. The revolution was real. The product was just mislabeled."]
                ]
            },
            {
                id: 24, slug: "consoles-rebuilding-as-services", cat: "gaming",
                title: "Console Makers Are Quietly Rebuilding Themselves as Services Companies",
                deck: "The box is a loss-leader, the subscription is the business, and the next earnings call will make it official.",
                author: "Tom Becker", role: "Gaming Editor", age: 3100, updated: "3 days ago", mins: 5, img: 12660512,
                alt: "Person holding a game controller under purple light", views: 76400,
                tags: ["consoles", "subscriptions", "industry"],
                body: [
                    ["p", "Read the latest platform-holder earnings closely and you'll find the same quiet reclassification: hardware revenue shrinking as a share of the business, services — subscriptions, storefront cuts, first-party live revenue — doing the growing. The console wars were never really about consoles. They were always about who owns the recurring relationship, and the industry is finally reporting itself that way."],
                    ["p", "The strategic logic is airtight. A console generation lasts seven years; a subscription renews monthly. Hardware is sold at or below cost and depreciates; a storefront take-rate on third-party sales is nearly pure margin. Every platform holder has reached the same conclusion: the box is customer acquisition, and the service is the company."],
                    ["h2", "What it changes for players"],
                    ["p", "Mostly, the incentives. When the subscription is the business, exclusivity wars soften — putting first-party titles in the service on day one makes more sense than defending a hardware moat. Backward compatibility becomes permanent infrastructure rather than a marketing favor. And pricing pressure migrates from the box, which gets cheaper in real terms every generation, to the monthly fee, which has already started climbing."],
                    ["quote", "The question isn't whether consoles become services. They already are. The question is whether players get a services-era deal — real value per dollar — or a cable-bundle-era deal.", "Games industry economist"],
                    ["p", "The next eighteen months will answer that: expect tiered bundles, advertising-supported options, and at least one aggressive cross-platform play. The console generation cycle will keep making headlines. The business underneath it stopped being cyclical years ago."]
                ]
            },
            {
                id: 25, slug: "review-nova-x1-laptop", cat: "reviews",
                title: "Review: The Nova X1 Is the Most Complete Laptop of 2026",
                deck: "Nothing revolutionary, everything resolved. After three weeks of real work, the X1's achievement is that we stopped noticing it — which is the highest compliment a laptop can earn.",
                author: "Aisha Bello", role: "Reviews Editor", age: 1740, updated: "Yesterday", mins: 9, img: 7652541,
                alt: "Sleek laptop on a gray table in a minimalist workspace", views: 154800,
                tags: ["review", "laptops", "Nova"],
                body: [
                    ["p", "The Nova X1 doesn't arrive with a revolution attached, and we suspect that's deliberate. In a market that has spent three years bolting assistants, NPUs and new acronyms onto otherwise familiar clamshells, Nova spent its engineering budget on the dozen small hostilities laptops inflict on their owners — and removed every one of them."],
                    ["p", "The scorecard, after three weeks as our daily machine: a 14-inch 120Hz panel that hits its rated color volume and doesn't PWM at any brightness; 19.5 hours of real mixed-use battery, the first laptop we've tested that survives two transcontinental flights of actual work; a keyboard with 1.6mm of travel that our typing-test panel scored above laptops twice the price; and ports — two USB-C, one USB-A, HDMI, and a headphone jack that works with the lid closed, a detail that sounds trivial until you've presented from a docked laptop."],
                    ["h2", "The details that add up"],
                    ["ul", ["Display: 120Hz, 98% DCI-P3 measured, matte coating that doesn't grain the image.", "Battery: 19.5h mixed-use — our best 14-inch result this year, by 3 hours.", "Thermals: silent below 65% load; audible but unobtrusive under sustained compile.", "Repair: socketed SSD, published service manual, standard drivers on the vendor site.", "Webcam: 1080p with a physical shutter that's actually satisfying."]],
                    ["p", "The AI story is refreshingly restrained. There's an NPU, it accelerates the things an NPU accelerates, and the default software never mentions it. You can enable on-device meeting transcription; you are never prompted to. In the current climate, that restraint is a feature worth listing."],
                    ["callout", "xSypher score", "8.7 / 10 — Editor's Choice. Buy it for the battery and the keyboard; stay for the absence of annoyances. The configuration to get: mid-tier chip, 32GB RAM, skip the OLED unless you do color-critical work."],
                    ["p", "Imperfections exist — the trackpad glass could be larger, and the 90W charger deserves a longer cable — but they're the complaints of a reviewer reaching for material. The X1 is the laptop we'll recommend without caveats this year. After a decade of reviewing machines that excel in the demo and fatigue in month three, 'complete' is the hardest adjective we hand out. The Nova X1 earns it."]
                ]
            },
            {
                id: 26, slug: "review-pulse-buds-pro-2", cat: "reviews",
                title: "Review: Pulse Buds Pro 2 Set a New Bar for Noise Cancellation",
                deck: "Pulse's second generation doesn't just lead the ANC charts — it changes what the charts should measure. Our lab notes, plus three weeks on trains, planes and open offices.",
                author: "Aisha Bello", role: "Reviews Editor", age: 2880, updated: "2 days ago", mins: 7, img: 30981655,
                alt: "White wireless earbuds with charging case lit by red light on black", views: 121300,
                tags: ["review", "earbuds", "audio"],
                body: [
                    ["p", "Noise cancellation reviews have a standard script: measure the low-frequency rumble, declare a winner by decibels, move on. The Pulse Buds Pro 2 forced us to rewrite the script, because its advantage isn't depth — it's bandwidth. Where rivals cancel the drone of an engine and call it done, the Pro 2 attenuates the frequencies where human voices live. Open offices, the hardest environment in audio, become library-quiet."],
                    ["p", "The lab numbers: peak attenuation of 51dB at low frequencies (class-leading by 4dB), and — the chart that matters — 22dB average attenuation across 300Hz–2kHz, nearly double the previous category leader. Subjectively, the difference is the one passengers on our test flights kept describing with the same sentence: 'I forgot people were talking.'"],
                    ["h2", "Everything else"],
                    ["ul", ["Sound: neutral-warm tuning, honest sub-bass, the best codec support in the category.", "Battery: 9.4h buds, 36h with case measured at 50% volume — claims verified.", "Calls: four-mic array with wind handling that finally matches the marketing.", "Comfort: 4.1g per bud, four tip sizes; three-week wear test passed without complaint.", "App: full EQ, adaptive modes that actually adapt, no account required to pair."]],
                    ["p", "Rivals retain edges in specific corners — one sounds better on classical, another integrates deeper with its phone ecosystem. But the Pro 2's combination of cancellation bandwidth, battery honesty and zero-friction software is the most complete package we've tested in the category."],
                    ["callout", "xSypher score", "9.0 / 10 — Editor's Choice. The new reference for ANC earbuds. If your life includes open offices, trains or small children, nothing else comes close to buying you this much quiet."],
                    ["p", "One note for buyers: the case's matte finish attracts pocket lint with almost scientific efficiency, and the wireless-charging coil is picky about placement. Neither matters at 30,000 feet with the world turned down to a whisper — which is, we've decided, the entire point."]
                ]
            },
            {
                id: 27, slug: "lock-down-accounts-under-hour", cat: "howto",
                title: "How to Lock Down Your Online Accounts in Under an Hour",
                deck: "No jargon, no products to buy, no paranoia required. Six steps, in priority order, that close the doors attackers actually use.",
                author: "Nadia Osei", role: "How-To Editor", age: 3400, updated: "3 days ago", mins: 8, img: 37694202,
                alt: "Backlit keyboard with green code symbols on screen", views: 245600,
                tags: ["security", "privacy", "guide"],
                body: [
                    ["p", "Account security advice usually arrives as a wall of anxiety: every breach bulletin implying you're one careless click from ruin. The reality is both calmer and more specific. Attackers overwhelmingly use a handful of techniques — credential stuffing, SIM swaps, recovery-flow abuse, session hijacking — and an hour of focused work closes almost all of those doors. Here are the six steps, in the order that matters."],
                    ["ol", ["Install a password manager and let it generate a unique password for your email first — email is the master key to every reset flow you own. (15 min, then 30 seconds per site forever)", "Turn on two-factor authentication everywhere it's offered, preferring an authenticator app or passkeys over SMS. Where passkeys are offered, use them — they can't be phished. (15 min)", "Generate and store backup codes for your five most important accounts, and put them somewhere offline. A locked-out account with no backup code is how weekends die. (10 min)", "Audit active sessions. Every major service lists devices currently signed in; sign out the ones you don't recognize or no longer own. (10 min)", "Set a dedicated recovery email you check monthly, and remove old phone numbers you no longer control — dead numbers get recycled to strangers. (10 min)", "Enable breach alerts for your primary addresses so leaked credentials find you before attackers do. (5 min)"]],
                    ["callout", "The 15-minute version", "If you have fifteen minutes, do this and only this: unique password on your main email + app-based 2FA on that same account. It eliminates the majority of realistic attack paths against you personally."],
                    ["p", "Notice what's not on this list: antivirus upsells, paid 'identity protection' subscriptions, and any product that advertises during a data breach. The steps above cost nothing because the techniques they defeat are opportunistic — attackers prefer volume over sophistication, and you're not trying to become untargetable. You're trying to be more trouble than the next account."],
                    ["p", "Run this routine once a year — an anniversary is as good a trigger as any — and you'll have done more for your security than most enterprise employees receive in training. Future-proofing note: as services roll out passkeys broadly, this list gets shorter. That's the rare security story with a happy trend line."]
                ]
            },
            {
                id: 28, slug: "choose-phone-that-lasts-five-years", cat: "howto",
                title: "How to Choose a Phone That Will Actually Last Five Years",
                deck: "Update promises, repair scores and battery chemistry: the four numbers that matter, and the spec-sheet filler you can safely ignore.",
                author: "Nadia Osei", role: "How-To Editor", age: 4320, updated: "4 days ago", mins: 6, img: 16229745,
                alt: "Smartphone screen showing a grid of app icons", views: 132400,
                tags: ["smartphones", "buying guide"],
                body: [
                    ["p", "Phone marketing is optimized for a purchase you make once every three to five years, which is exactly why it emphasizes the things that impress in week one — camera modes, finishes, benchmark numbers — and buries the things that decide year four. Here's how to read the spec sheet like someone who's paying for the whole ownership period."],
                    ["ul", ["Update policy: the single most important number. Count years of OS updates and years of security patches separately — they're different promises, and security patches are the ones that keep you safe. Leading makers now offer seven years; accept nothing under five.", "Repairability: check whether batteries and screens are user- or shop-replaceable, and whether parts are sold at sane prices. A $90 battery swap in year three beats a $900 phone in year four.", "Battery chemistry and warranty: look for rated cycle counts (1,000+ cycles to 80% health is the current good standard) and whether battery health is surfaced in settings.", "Storage headroom: buy one tier more storage than you need today. App sizes grow every year, and cloud subscriptions compound."]],
                    ["h2", "The numbers you can ignore"],
                    ["p", "Megapixel counts beyond the main sensor, benchmark deltas under 20%, 'AI features' without named models behind them, and any charging wattage number — fast charging above sane thresholds trades battery longevity for a convenience you'll use twice. None of these change how the phone feels in 2031."],
                    ["ol", ["Write down your three actual daily uses before shopping; buy for those, not the demo.", "Check the update commitment in writing — marketing pages and support pages sometimes disagree.", "Verify parts availability for your region before purchase, not after the first drop.", "Keep the box and buy one official case; resale value in year four is a real rebate."]],
                    ["p", "The uncomfortable truth: any current flagship will physically last five years. The question is whether it will be secure, serviceable and pleasant in year five — and that's decided by policy documents, not processors. Buy the company's promises, verified in writing, and the hardware takes care of itself."]
                ]
            },
            {
                id: 29, slug: "opinion-app-store-showing-age", cat: "opinion",
                title: "Opinion: The App Store Model Is Showing Its Age",
                deck: "Fifteen years on, the walled garden has manicured lawns and a housing crisis. The next decade of software distribution will be negotiated, not dictated.",
                author: "James Whitfield", role: "Opinion Columnist", age: 5200, updated: "5 days ago", mins: 6, img: 5253002,
                alt: "Close-up of a smartphone home screen with applications", views: 104500,
                tags: ["opinion", "app stores", "platforms"],
                body: [
                    ["p", "The app store solved a real problem. In 2008, distributing software to a pocket device meant carrier negotiations, fragmentation hell and payment infrastructure nobody had. One storefront, one review process, one 30% toll — and suddenly a teenager with a Mac could reach a billion people. The model built an industry. My argument is not that it was wrong. It's that it has stayed exactly the same while everything around it grew up."],
                    ["p", "Consider what the model assumes: that a single gatekeeper can review millions of apps by hand-scale process; that 30% of every digital sale is a fair infrastructure fee forever; that the device you paid for should refuse software its manufacturer hasn't approved; and that 'safety' and 'control' remain synonyms fifteen years of evidence in. Every one of those assumptions is now contested — by regulators on three continents, by courts, by developers, and increasingly by users who can't explain why installing software on their own property requires a permission slip."],
                    ["h2", "What should replace it"],
                    ["p", "Not the old chaos — nobody serious wants unreviewed malware back. The emerging alternative is layered trust: certified stores with genuine accountability, sideloading for users who knowingly accept risk, notarization instead of gatekeeping, and fees that reflect actual distribution costs rather than 2008's scarcity of alternatives. Europe's experiments are messy, but messy experimentation beats eternal stasis."],
                    ["quote", "A distribution model designed for the infancy of mobile is now the load-bearing wall of the software economy. You don't demolish load-bearing walls — but you do inspect them, and honestly report the cracks.", "From this column, unfairly quoted back at us by a platform lobbyist"],
                    ["p", "The platforms will adapt — they always do, usually one regulation before they would have chosen. The question is whether the next model distributes trust or merely redistributes tolls. Users, developers and regulators should insist on the difference, because the app store's fifteenth birthday proved one thing conclusively: the garden will not redesign itself."]
                ]
            },
            {
                id: 30, slug: "humanoid-robots-left-the-lab", cat: "science",
                title: "Humanoid Robots Left the Lab. Now Comes the Hard Part.",
                deck: "Pilot deployments in warehouses and factories are real. The gap between a working demo and a reliable coworker turns out to be mostly unglamorous engineering.",
                author: "Liam Turner", role: "Staff Writer", age: 6100, updated: "5 days ago", mins: 7, img: 16544936,
                alt: "Humanoid robot standing in a modern corridor", views: 91800,
                tags: ["robotics", "AI", "manufacturing"],
                body: [
                    ["p", "The footage is always impressive: a humanoid robot walks a warehouse aisle, picks a tote, transfers it to a conveyor, and does it again. What the footage doesn't show is the spreadsheet behind this year's real news — a dozen manufacturers running paid pilots with uptime numbers they're willing to defend. Humanoid robotics has left the demo era. It has not yet entered the appliance era, and the distance between those two things is the story."],
                    ["p", "The pilots share a pattern. Robots work structured shifts in constrained environments — fixed routes, known objects, human supervision nearby. The tasks are deliberately unglamorous: tote moving, machine tending, end-of-line handling. Nobody is deploying humanoids to fold laundry. The economics work first where labor is scarce, turnover is brutal, and the environment can be shaped around the machine rather than the reverse."],
                    ["h2", "The hard part"],
                    ["quote", "We solved walking. Walking was the press release. The real problem is the ninth hour of a twelve-hour shift, under fluorescent light that changes with the weather, when the bin is two centimeters off its mark. Reliability is a thousand boring problems, not one brilliant one.", "Robotics professor advising two humanoid startups"],
                    ["ul", ["Dexterosity: human hands remain unmatched for unstructured objects; expect grippers, not fingers, for years.", "Uptime: current pilots report 85–93% productive time; factories plan around 99%.", "Safety certification: standards for human-scale mobile robots around people are still being written.", "Unit economics: the break-even calculation moves a year closer with every hardware generation — that trajectory, not any demo, is what investors are buying."]],
                    ["img", 8294620, "Close-up of a white robot in studio lighting", "Actuator cost has fallen faster than any component in robotics history — the trend line that matters.", "xSypher / robotics series"],
                    ["p", "The sober forecast: humanoids will be a normal sight in specific industrial settings within five years, and a consumer product in most homes within no honest forecaster's window. The companies that win will be the ones treating this as a reliability engineering problem with a marketing department — not the other way around. The lab is behind them. The hard part is exactly what it sounds like."]
                ]
            }
        ];

export const CATS: Record<string, Category> = {
            ai: { name: "AI", full: "AI & Machine Learning", desc: "Models, agents and the systems being built on top of artificial intelligence — reported without the hype." },
            cybersecurity: { name: "Cybersecurity", full: "Cybersecurity", desc: "Breaches, vulnerabilities, privacy and the people defending the network." },
            gadgets: { name: "Gadgets", full: "Gadgets & Devices", desc: "Smartphones, laptops, wearables and the hardware that carries our digital lives." },
            software: { name: "Software", full: "Software & Apps", desc: "Operating systems, applications and the business of the software we use every day." },
            programming: { name: "Programming", full: "Programming & Dev", desc: "Languages, frameworks, cloud, DevOps and open source — written for people who ship." },
            business: { name: "Business", full: "Tech Business", desc: "Startups, funding rounds, markets and the economics of the technology industry." },
            gaming: { name: "Gaming", full: "Gaming", desc: "Games, hardware, industry moves and esports — covered seriously." },
            reviews: { name: "Reviews", full: "Reviews", desc: "Independent, hands-on reviews. We buy our own test units. No sponsored scores, ever." },
            howto: { name: "How-To", full: "How-To Guides", desc: "Practical, tested guides that respect your time and your data." },
            opinion: { name: "Opinion", full: "Opinion & Analysis", desc: "Arguments and analysis from xSypher writers and guest contributors." },
            science: { name: "Science", full: "Science & Future Tech", desc: "Research, robotics and the technologies that are arriving next." }
        };

export interface PageData {
  t: string;
  h: string;
}

export const PAGES: Record<string, PageData> = {
  about: {
    t: "About xSypher", h: `<h1>About xSypher</h1>
<p>xSypher is an independent technology publication, founded in 2025 and read in more than 140 countries. We cover artificial intelligence, cybersecurity, gadgets, software, programming, startups, gaming and the business of technology — with original reporting, hands-on reviews and analysis written for people who actually use and build this stuff.</p>
<h2>What we believe</h2>
<ul><li><b>Independence.</b> No vendor owns us, funds our coverage or approves our stories. Advertising and editorial are separate departments with a wall between them.</li>
<li><b>Accuracy before speed.</b> We would rather be right second than wrong first, and we correct ourselves loudly when we miss.</li>
<li><b>Respect for readers.</b> No clickbait, no artificial outrage, no dark patterns. Your attention is the product we refuse to abuse.</li>
<li><b>Technical honesty.</b> We run the code, buy the hardware and read the filings. Claims get tested before they get published.</li></ul>
<h2>How xSypher is funded</h2>
<p>xSypher is funded by reader subscriptions, newsletters and clearly labelled advertising. We do not accept payment for coverage, and review units are purchased at retail wherever possible. Sponsored content — rare and always labelled — never touches the editorial desk.</p>`},
  contact: {
    t: "Contact", h: `<h1>Contact xSypher</h1>
<p><b>News tips &amp; corrections:</b> tips@xsypher.news — encrypted contact details available on request.<br><b>Editorial:</b> desk@xsypher.news<br><b>Reviews:</b> lab@xsypher.news<br><b>Advertising:</b> ads@xsypher.news<br><b>Press:</b> press@xsypher.news</p>
<h2>Tips policy</h2>
<p>We protect our sources. If you have information about a technology company, security incident or policy matter, reach out — we respond to every credible tip, and we never name a source without consent.</p>`},
  editorial: {
    t: "Editorial Policy", h: `<h1>Editorial Policy &amp; Standards</h1>
<p>Every xSypher story passes through the same pipeline: reporting, verification, editing and fact-checking. Claims require named sources or documents; anonymous sourcing requires an editor's approval and a stated reason.</p>
<h2>Our rules, in short</h2>
<ul><li>Two independent sources, or one source plus documentation, before any claim of wrongdoing.</li>
<li>Opinion is labelled opinion. Analysis is labelled analysis. News reads like news.</li>
<li>We disclose conflicts. If a writer holds stock in a company they cover, an editor assigns someone else.</li>
<li>Reviews are independent: we buy our own test units, and scores are never discussed with vendors before publication.</li>
<li>AI tools may assist research and production, but no xSypher story is written by an AI without human reporting, and generated media is always labelled.</li></ul>
<h2>Fact-checking</h2>
<p>Statistics, quotes and technical claims are verified against primary sources wherever they exist. Where we rely on a single study or company claim, we say so in the story itself.</p>`},
  corrections: {
    t: "Corrections", h: `<h1>Corrections Policy</h1>
<p>When we make an error, we fix it — visibly. Material corrections are appended to the story with a timestamp; minor fixes are logged in the article's update history.</p>
<h2>Recent corrections</h2>
<ul><li><b>February 2026:</b> An earlier version of a funding story misstated a round size as $120M. The correct figure is $105M. Corrected and noted.</li>
<li><b>January 2026:</b> A review misattributed a display panel supplier. Corrected after reader feedback.</li></ul>
<p>Spotted something? Email corrections@xsypher.news. We read everything, and we thank readers who make us more accurate.</p>`},
  privacy: {
    t: "Privacy Policy", h: `<h1>Privacy Policy</h1>
<p>xSypher collects the minimum data needed to run a publication: basic analytics (aggregated, never sold), newsletter addresses (used only to send the newsletter) and account details where you create them.</p>
<ul><li>We never sell personal data. Ever.</li><li>Advertising is served without cross-site tracking wherever our partners allow it.</li><li>You can request deletion of your data at any time via privacy@xsypher.news.</li><li>This demo build stores newsletter and comment preferences locally in your browser only.</li></ul>
<p>Full policy text is available on request and updated as regulation requires.</p>`},
  terms: {
    t: "Terms of Use", h: `<h1>Terms of Use</h1>
<p>By reading xSypher you agree to the simple version: our content is for personal, non-commercial use; our reporting may not be republished without a licence; and we provide journalism as-is, with corrections published when we err. The complete legal terms govern disputes and liability and are available at legal@xsypher.news.</p>`},
  cookies: {
    t: "Cookie Policy", h: `<h1>Cookie Policy</h1>
<p>xSypher uses essential cookies for theme and reading preferences (stored locally), aggregate analytics to understand which stories serve readers, and advertising cookies only where consent is given. You can clear all locally stored preferences from your browser at any time — this demo edition stores nothing server-side.</p>`},
  advertising: {
    t: "Advertising", h: `<h1>Advertising on xSypher</h1>
<p>xSypher carries clearly labelled, non-intrusive advertising in standard IAB placements — leaderboards, in-feed units and sidebar placements. We do not run native ads disguised as editorial, and our ad slots are structured for responsible programmatic partners (Google AdSense-ready).</p>
<p>Rate cards and availability: ads@xsypher.news. Editorial never sees, approves or knows about advertising bookings before publication.</p>`},
  careers: {
    t: "Careers", h: `<h1>Careers at xSypher</h1>
<p>We hire reporters, editors, engineers and designers who care about accuracy as much as speed. Open roles are posted here; speculative applications with published clips are always read. Remote-first, honest salaries, no crunch culture — the newsroom we always wanted to work in.</p>`},
    newsletter: {
    t: "Newsletters", h: `<h1>xSypher Newsletters</h1>
<p><b>The Daily Brief</b> — every morning, the five stories that matter, in five minutes. <b>The Weekend Build</b> — long reads, reviews and analysis for Saturday coffee. Both free, both ad-light, both unsubscribe-in-one-click.</p>`}
};

export const DRAFTS: Article[] = [
  {
    id: "draft-1",
    slug: "draft-ai-agents",
    title: "The Next Era of AI Agents: When LLMs Start Taking Action",
    deck: "Language models have been largely conversational, but a new wave of autonomous agents aims to turn them into active workers that browse the web, write code, and manage infrastructure.",
    author: "Ahmed Khan",
    role: "Senior AI Correspondent",
    age: 0,
    mins: 7,
    cat: "ai",
    img: "https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg",
    alt: "Abstract representation of AI networks",
    views: 0,
    status: "draft",
    body: []
  },
  {
    id: "draft-2",
    slug: "draft-apple-vision-pro",
    title: "Six Months With Vision Pro: The Spatial Computing Reality Check",
    deck: "Apple's $3,500 headset promised a revolution in how we work and play. Half a year later, the hardware remains stunning, but the software ecosystem is struggling to justify the price tag.",
    author: "Aisha Bello",
    role: "Reviews Editor",
    age: 0,
    mins: 12,
    cat: "reviews",
    img: "https://images.pexels.com/photos/19665099/pexels-photo-19665099.jpeg",
    alt: "Person wearing a VR headset",
    views: 0,
    status: "draft",
    body: []
  }
];


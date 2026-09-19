import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, SearchCheck, Bot, BadgeDollarSign, FileWarning } from "lucide-react";

export const metadata: Metadata = {
  title: "Editorial Policy & Ethics — xSypher",
  description:
    "Explore xSypher's commitment to accuracy, transparency, and strictly independent tech journalism.",
};

export default function EditorialPolicyPage() {
  return (
    <div className="w-full bg-[var(--paper)] min-h-screen text-[var(--ink)]">
      {/* ─────────────────────────────────────────────────────────────
          1. HERO SECTION
          ───────────────────────────────────────────────────────────── */}
      <section className="w-full border-b border-[var(--line)] bg-[var(--surface)] relative overflow-hidden">
        {/* Subtle grid background */}
        <div 
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(var(--ink) 1px, transparent 1px), linear-gradient(90deg, var(--ink) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
          aria-hidden="true"
        />
        
        <div className="max-w-3xl mx-auto px-4 sm:px-8 pt-32 pb-16 sm:pt-40 sm:pb-24 relative z-10 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 mb-6">
            Transparency &amp; Trust
          </span>
          <h1 className="font-[family:var(--f-display)] text-3xl sm:text-5xl font-extrabold tracking-tight text-[var(--ink)] leading-tight">
            Our Editorial Guidelines &amp; Ethics
          </h1>
          <p className="mt-6 text-base sm:text-lg text-[var(--muted)] font-[family:var(--f-body)] leading-relaxed">
            At xSypher, we hold ourselves to the highest standards of accuracy, transparency, and independent tech journalism. Below is our unyielding commitment to our readers.
          </p>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. POLICY SECTIONS
          ───────────────────────────────────────────────────────────── */}
      <section className="w-full py-12 sm:py-16 lg:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 flex flex-col gap-8 sm:gap-10">
          
          {/* Section 1: Editorial Independence */}
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-6 sm:p-10 shadow-sm transition-all hover:border-[var(--line-2)] hover:shadow-md">
            <div className="flex items-start gap-5">
              <div className="w-12 h-12 shrink-0 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] flex items-center justify-center text-[var(--accent)]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h2 className="font-[family:var(--f-display)] text-xl sm:text-2xl font-bold text-[var(--ink)] mb-3">
                  Editorial Independence
                </h2>
                <div className="font-[family:var(--f-body)] text-sm sm:text-base text-[var(--muted)] leading-relaxed space-y-4">
                  <p>
                    xSypher&apos;s coverage is strictly unbiased and editorially independent. We do not accept payment, gifts, or favors in exchange for positive reviews or favorable coverage. 
                  </p>
                  <p>
                    Our editorial decisions—including what we cover, how we rate products, and the conclusions we draw—are completely separate from advertising or partnerships. No vendor or investor has prior review or veto power over any piece of our journalism.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Fact-Checking & Sourcing */}
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-6 sm:p-10 shadow-sm transition-all hover:border-[var(--line-2)] hover:shadow-md">
            <div className="flex items-start gap-5">
              <div className="w-12 h-12 shrink-0 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] flex items-center justify-center text-[var(--accent)]">
                <SearchCheck className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h2 className="font-[family:var(--f-display)] text-xl sm:text-2xl font-bold text-[var(--ink)] mb-3">
                  Fact-Checking &amp; Sourcing
                </h2>
                <div className="font-[family:var(--f-body)] text-sm sm:text-base text-[var(--muted)] leading-relaxed space-y-4">
                  <p>
                    Every story passes through a rigorous fact-checking process. We rely heavily on primary sources, official documentation, direct interviews, and hands-on testing. We verify technical claims by reproducing setups and running local benchmarks whenever possible.
                  </p>
                  <p>
                    We actively avoid unverified rumors or speculation. If we do report on unconfirmed information (such as hardware leaks or industry rumors), it is explicitly stated as such, with clear context on why we believe the information is credible enough to publish.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: AI & Automation Policy */}
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-6 sm:p-10 shadow-sm transition-all hover:border-[var(--line-2)] hover:shadow-md relative overflow-hidden">
            {/* Subtle highlight accent for AI policy */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--accent)]" aria-hidden="true" />
            
            <div className="flex items-start gap-5">
              <div className="w-12 h-12 shrink-0 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] flex items-center justify-center text-[var(--accent)]">
                <Bot className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h2 className="font-[family:var(--f-display)] text-xl sm:text-2xl font-bold text-[var(--ink)] mb-3">
                  AI &amp; Automation Policy
                </h2>
                <div className="font-[family:var(--f-body)] text-sm sm:text-base text-[var(--muted)] leading-relaxed space-y-4">
                  <p>
                    Because we cover artificial intelligence deeply, we must be completely transparent about how we use it. <strong>All xSypher articles are researched, written, and edited by human journalists.</strong>
                  </p>
                  <p>
                    Our staff may use AI tools (like LLMs) as assistants for brainstorming, summarizing extensive technical whitepapers, or performing grammar checks. However, AI-generated articles or synthetic reporting are strictly prohibited on our platform without prominent, explicit disclosure. We believe human critical thinking is irreplaceable in evaluating technology.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Affiliate & Advertising Disclosure */}
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-6 sm:p-10 shadow-sm transition-all hover:border-[var(--line-2)] hover:shadow-md">
            <div className="flex items-start gap-5">
              <div className="w-12 h-12 shrink-0 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] flex items-center justify-center text-[var(--accent)]">
                <BadgeDollarSign className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h2 className="font-[family:var(--f-display)] text-xl sm:text-2xl font-bold text-[var(--ink)] mb-3">
                  Affiliate &amp; Advertising Disclosure
                </h2>
                <div className="font-[family:var(--f-body)] text-sm sm:text-base text-[var(--muted)] leading-relaxed space-y-4">
                  <p>
                    xSypher is funded through a combination of reader subscriptions and carefully vetted advertising. We may occasionally earn commissions through affiliate links included in our hardware and gadget reviews.
                  </p>
                  <p>
                    This affiliate revenue <strong>never</strong> impacts our editorial verdicts, scores, or product recommendations. If a product falls short of our standards, we say so, regardless of any potential commission. Sponsored content, when present, is visibly labeled at the top of the page.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Corrections Policy */}
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-6 sm:p-10 shadow-sm transition-all hover:border-[var(--line-2)] hover:shadow-md">
            <div className="flex items-start gap-5">
              <div className="w-12 h-12 shrink-0 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] flex items-center justify-center text-[var(--accent)]">
                <FileWarning className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h2 className="font-[family:var(--f-display)] text-xl sm:text-2xl font-bold text-[var(--ink)] mb-3">
                  Corrections Policy
                </h2>
                <div className="font-[family:var(--f-body)] text-sm sm:text-base text-[var(--muted)] leading-relaxed space-y-4">
                  <p>
                    We are fiercely committed to fixing our mistakes openly. If we publish an error, we correct it as quickly as possible.
                  </p>
                  <p>
                    Any material changes made to an article post-publication (such as correcting technical inaccuracies or updating factual claims) will be clearly noted with a timestamp at the bottom of the piece. Minor typo fixes may not always receive a log entry, but substantive edits will never be quietly swept under the rug.
                  </p>
                  <p className="pt-2">
                    <Link 
                      href="/page/corrections" 
                      className="inline-flex items-center gap-1 text-[var(--accent)] font-semibold hover:underline"
                    >
                      Read our full Corrections Log &rarr;
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>
      
      {/* ─────────────────────────────────────────────────────────────
          3. BOTTOM CTA / FOOTNOTE
          ───────────────────────────────────────────────────────────── */}
      <section className="w-full py-10 sm:py-12 border-t border-[var(--line)] bg-[var(--surface)] text-center">
        <p className="text-xs sm:text-sm text-[var(--faint)] font-[family:var(--f-ui)] max-w-lg mx-auto px-4">
          If you have questions about our ethics policies or wish to report an editorial concern, please <Link href="/page/contact" className="text-[var(--accent)] hover:underline">contact the newsroom</Link>.
        </p>
      </section>
    </div>
  );
}

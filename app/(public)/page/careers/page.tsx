import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Globe, Laptop, HeartPulse, ArrowRight, Zap, Briefcase, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Careers | xSypher",
  description: "Join the xSypher Desk and help us decode the future of technology.",
};

export default function CareersPage() {
  return (
    <div className="bg-[var(--surface)] min-h-screen">
      {/* HEADER HERO */}
      <header className="border-b border-[var(--line)] bg-[var(--surface-2)]">
        <div className="max-w-7xl mx-auto px-4 pt-32 pb-16 sm:pt-40 sm:px-8 lg:pt-44 lg:px-12">
          <div className="max-w-3xl">
            <span className="text-[var(--accent)] font-bold text-xs uppercase tracking-widest mb-3 block">
              We're Hiring
            </span>
            <h1 className="font-[family:var(--f-display)] text-4xl sm:text-5xl font-bold mb-4 text-[var(--ink)] tracking-tight">
              Join the xSypher Desk
            </h1>
            <p className="font-[family:var(--f-body)] text-lg text-[var(--muted)] leading-relaxed">
              We are looking for passionate journalists, sharp engineers, and curious tech analysts to help us decode the future of technology.
            </p>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT WRAPPER */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-8 lg:px-12 flex flex-col lg:flex-row gap-12">
        
        {/* SIDEBAR NAVIGATION (Sticky on Desktop) */}
        <aside className="lg:w-1/4 hidden lg:block shrink-0">
          <div className="sticky top-32">
            <h4 className="font-[family:var(--f-display)] font-bold text-sm text-[var(--ink)] uppercase tracking-wider mb-4 border-b border-[var(--line)] pb-2">
              Directory
            </h4>
            <nav className="flex flex-col font-[family:var(--f-ui)] text-sm border-l-2 border-[var(--line-2)]">
              <a href="#culture" className="-ml-[2px] py-2 pl-4 border-l-2 border-transparent text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--accent)] transition-all font-medium">1. Our Culture</a>
              <a href="#perks" className="-ml-[2px] py-2 pl-4 border-l-2 border-transparent text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--accent)] transition-all font-medium">2. Perks & Benefits</a>
              <a href="#open-roles" className="-ml-[2px] py-2 pl-4 border-l-2 border-transparent text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--accent)] transition-all font-medium">3. Open Positions</a>
              <a href="#apply" className="-ml-[2px] py-2 pl-4 border-l-2 border-transparent text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--accent)] transition-all font-medium">4. General Application</a>
            </nav>
          </div>
        </aside>

        {/* CONTENT AREA */}
        <article className="lg:w-3/4 max-w-3xl text-[var(--ink)] space-y-16">
          
          {/* SECTION 1: CULTURE */}
          <section id="culture" className="scroll-mt-28">
            <div className="flex items-center gap-3 mb-6">
              <Zap className="w-6 h-6 text-[var(--accent)]" />
              <h2 className="font-[family:var(--f-display)] text-2xl sm:text-3xl font-bold text-[var(--ink)]">
                1. Our Culture
              </h2>
            </div>
            <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-[var(--muted)] font-[family:var(--f-body)]">
              <p className="mb-4">
                At xSypher, our culture is built on deep technical curiosity, rigorous verification, and a relentless pursuit of the truth. We operate at the intersection of complex software engineering and high-stakes global cyber-politics.
              </p>
              <p>
                We do not do "fluff." We believe that our readers are highly intelligent professionals who deserve uncompromising, in-depth analysis. If you love diving into dense documentation, interviewing security researchers, or building extremely fast web applications, you will find a home here.
              </p>
            </div>
          </section>

          {/* SECTION 2: PERKS & BENEFITS */}
          <section id="perks" className="scroll-mt-28">
            <div className="flex items-center gap-3 mb-6">
              <HeartPulse className="w-6 h-6 text-[var(--accent)]" />
              <h2 className="font-[family:var(--f-display)] text-2xl sm:text-3xl font-bold text-[var(--ink)]">
                2. Perks & Benefits
              </h2>
            </div>
            <p className="text-[var(--muted)] font-[family:var(--f-body)] mb-8">
              We expect top-tier work, and we provide top-tier support. Our benefits package is designed to give you the flexibility and resources you need to do the best work of your career.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[var(--surface-2)] border border-[var(--line)] rounded-2xl p-6">
                <div className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--line)] flex items-center justify-center text-[var(--accent)] mb-4">
                  <Globe className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-[var(--ink)] mb-2">100% Remote-First</h4>
                <p className="text-sm text-[var(--muted)] font-[family:var(--f-body)] leading-relaxed">
                  Work from anywhere in the world. We care about the quality of your output, not your timezone or commute. We operate asynchronously by default.
                </p>
              </div>

              <div className="bg-[var(--surface-2)] border border-[var(--line)] rounded-2xl p-6">
                <div className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--line)] flex items-center justify-center text-[var(--accent)] mb-4">
                  <Laptop className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-[var(--ink)] mb-2">Elite Tech Stipend</h4>
                <p className="text-sm text-[var(--muted)] font-[family:var(--f-body)] leading-relaxed">
                  Generous annual budget to upgrade your home office, buy the latest gadgets, and fund your deep-dive technical research and server costs.
                </p>
              </div>

              <div className="bg-[var(--surface-2)] border border-[var(--line)] rounded-2xl p-6 md:col-span-2">
                <h4 className="font-bold text-[var(--ink)] mb-2">Health & Wellness</h4>
                <p className="text-sm text-[var(--muted)] font-[family:var(--f-body)] leading-relaxed">
                  Comprehensive global health coverage, flexible mental health days, and an unlimited PTO policy that our leadership team actively encourages you to use. Burnout is the enemy of good journalism and good code.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 3: OPEN ROLES */}
          <section id="open-roles" className="scroll-mt-28">
            <div className="flex items-center gap-3 mb-6">
              <Briefcase className="w-6 h-6 text-[var(--accent)]" />
              <h2 className="font-[family:var(--f-display)] text-2xl sm:text-3xl font-bold text-[var(--ink)]">
                3. Open Positions
              </h2>
            </div>
            
            <div className="space-y-4">
              {/* Job Card 1 */}
              <Link href="mailto:careers@xsypher.com?subject=Application:%20Senior%20Cybersecurity%20Reporter" className="block bg-[var(--surface-2)] border border-[var(--line)] rounded-xl p-6 shadow-sm hover:shadow-md hover:border-[var(--accent)] transition-all group">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-[family:var(--f-display)] text-xl font-bold text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors mb-2">
                      Senior Cybersecurity Reporter
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-[family:var(--f-body)] text-[var(--muted)] uppercase tracking-wider font-semibold">
                      <span className="px-2 py-1 rounded bg-[var(--surface)] border border-[var(--line)]">Full-time</span>
                      <span className="px-2 py-1 rounded bg-[var(--surface)] border border-[var(--line)]">Remote</span>
                      <span className="px-2 py-1 rounded bg-[var(--surface)] border border-[var(--line)]">Editorial</span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--line)] group-hover:bg-[var(--accent)] group-hover:border-[var(--accent)] group-hover:text-white text-[var(--muted)] transition-all">
                      <ArrowRight className="w-5 h-5" />
                    </span>
                  </div>
                </div>
              </Link>

              {/* Job Card 2 */}
              <Link href="mailto:careers@xsypher.com?subject=Application:%20Next.js%20Frontend%20Engineer" className="block bg-[var(--surface-2)] border border-[var(--line)] rounded-xl p-6 shadow-sm hover:shadow-md hover:border-[var(--accent)] transition-all group">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-[family:var(--f-display)] text-xl font-bold text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors mb-2">
                      Next.js Frontend Engineer
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-[family:var(--f-body)] text-[var(--muted)] uppercase tracking-wider font-semibold">
                      <span className="px-2 py-1 rounded bg-[var(--surface)] border border-[var(--line)]">Full-time</span>
                      <span className="px-2 py-1 rounded bg-[var(--surface)] border border-[var(--line)]">Remote</span>
                      <span className="px-2 py-1 rounded bg-[var(--surface)] border border-[var(--line)]">Engineering</span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--line)] group-hover:bg-[var(--accent)] group-hover:border-[var(--accent)] group-hover:text-white text-[var(--muted)] transition-all">
                      <ArrowRight className="w-5 h-5" />
                    </span>
                  </div>
                </div>
              </Link>

              {/* Job Card 3 */}
              <Link href="mailto:careers@xsypher.com?subject=Application:%20AI%20&%20Automation%20Analyst" className="block bg-[var(--surface-2)] border border-[var(--line)] rounded-xl p-6 shadow-sm hover:shadow-md hover:border-[var(--accent)] transition-all group">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-[family:var(--f-display)] text-xl font-bold text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors mb-2">
                      AI & Automation Analyst
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-[family:var(--f-body)] text-[var(--muted)] uppercase tracking-wider font-semibold">
                      <span className="px-2 py-1 rounded bg-[var(--surface)] border border-[var(--line)]">Contract</span>
                      <span className="px-2 py-1 rounded bg-[var(--surface)] border border-[var(--line)]">Remote</span>
                      <span className="px-2 py-1 rounded bg-[var(--surface)] border border-[var(--line)]">Research</span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--line)] group-hover:bg-[var(--accent)] group-hover:border-[var(--accent)] group-hover:text-white text-[var(--muted)] transition-all">
                      <ArrowRight className="w-5 h-5" />
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          </section>

          {/* SECTION 4: GENERAL APPLICATION */}
          <section id="apply" className="scroll-mt-28 pb-12">
            <div className="bg-[var(--surface-2)] border border-[var(--line)] rounded-2xl p-8 sm:p-10 text-center relative overflow-hidden shadow-sm">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-50"></div>
              <div className="w-14 h-14 rounded-full bg-[var(--surface)] border border-[var(--line)] flex items-center justify-center text-[var(--accent)] mx-auto mb-5 shadow-sm">
                <Mail className="w-7 h-7" />
              </div>
              <h2 className="font-[family:var(--f-display)] font-bold text-2xl sm:text-3xl text-[var(--ink)] mb-3">
                Don't see a perfect fit?
              </h2>
              <p className="font-[family:var(--f-body)] text-sm sm:text-base text-[var(--muted)] mb-8 max-w-lg mx-auto leading-relaxed">
                We are always looking for exceptional talent. If you believe you can bring something unique to xSypher, send your resume, portfolio, and a brief note about why you want to join us.
              </p>
              <a
                href="mailto:careers@xsypher.com"
                className="group relative w-full sm:w-auto inline-flex overflow-hidden py-3.5 px-8 !bg-[var(--accent)] dark:!bg-[var(--accent)] !text-white dark:!text-white font-[family:var(--f-ui)] font-bold tracking-wide rounded-xl items-center justify-center transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Email Careers Desk
                </span>
                <div className="absolute inset-0 -translate-x-[150%] bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out z-0"></div>
              </a>
            </div>
          </section>

        </article>
      </div>
    </div>
  );
}

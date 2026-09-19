import { Info, Scale, Copyright, MessageSquare, AlertTriangle, ScrollText } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Use | xSypher',
  description: 'Read the terms, conditions, and guidelines governing your use of the xSypher platform.',
};

export default function TermsOfUsePage() {
  return (
    <div className="bg-[var(--surface)] min-h-screen">
      {/* HEADER HERO */}
      <header className="border-b border-[var(--line)] bg-[var(--surface-2)]">
        <div className="max-w-7xl mx-auto px-4 pt-32 pb-16 sm:pt-40 sm:px-8 lg:pt-44 lg:px-12">
          <div className="max-w-3xl">
            <span className="text-[var(--accent)] font-bold text-xs uppercase tracking-widest mb-3 block">
              Legal & Compliance
            </span>
            <h1 className="font-[family:var(--f-display)] text-4xl sm:text-5xl font-bold mb-4 text-[var(--ink)] tracking-tight">
              Terms of Use
            </h1>
            <p className="font-[family:var(--f-body)] text-lg text-[var(--muted)] leading-relaxed">
              These terms govern your access to and use of xSypher. By using our platform, you agree to be bound by these conditions.
            </p>
            <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-[var(--faint)]">
              <span className="w-2 h-2 rounded-full bg-[var(--accent)]"></span>
              Last Updated: September 19, 2026
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT WRAPPER */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-8 lg:px-12 flex flex-col lg:flex-row gap-12">
        
        {/* SIDEBAR NAVIGATION (Sticky on Desktop) */}
        <aside className="lg:w-1/4 hidden lg:block shrink-0">
          <div className="sticky top-32">
            <h4 className="font-[family:var(--f-display)] font-bold text-sm text-[var(--ink)] uppercase tracking-wider mb-4 border-b border-[var(--line)] pb-2">
              Table of Contents
            </h4>
            <nav className="flex flex-col font-[family:var(--f-ui)] text-sm border-l-2 border-[var(--line-2)]">
              <a href="#tldr" className="-ml-[2px] py-2 pl-4 border-l-2 border-transparent text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--accent)] transition-all font-medium">0. TL;DR Summary</a>
              <a href="#acceptance" className="-ml-[2px] py-2 pl-4 border-l-2 border-transparent text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--accent)] transition-all font-medium">1. Acceptance of Terms</a>
              <a href="#intellectual-property" className="-ml-[2px] py-2 pl-4 border-l-2 border-transparent text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--accent)] transition-all font-medium">2. Intellectual Property</a>
              <a href="#user-conduct" className="-ml-[2px] py-2 pl-4 border-l-2 border-transparent text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--accent)] transition-all font-medium">3. User Conduct & Comments</a>
              <a href="#disclaimers" className="-ml-[2px] py-2 pl-4 border-l-2 border-transparent text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--accent)] transition-all font-medium">4. Disclaimers & Liability</a>
              <a href="#governing-law" className="-ml-[2px] py-2 pl-4 border-l-2 border-transparent text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--accent)] transition-all font-medium">5. Governing Law</a>
            </nav>
          </div>
        </aside>

        {/* CONTENT AREA */}
        <article className="lg:w-3/4 max-w-3xl text-[var(--ink)] space-y-12">
          
          {/* TL;DR BOX */}
          <section id="tldr" className="scroll-mt-28 bg-[var(--surface-2)] border border-[var(--line)] rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
              <div className="p-3 bg-[var(--surface)] rounded-xl text-[var(--accent)] shadow-sm shrink-0">
                <Info className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-[family:var(--f-display)] font-bold text-[var(--ink)] text-xl mb-3">TL;DR: The Short Version</h3>
                <ul className="list-none space-y-3 font-[family:var(--f-body)] text-[var(--muted)] leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--accent)] font-bold mt-0.5 shrink-0">•</span>
                    <span className="text-[var(--muted)] leading-relaxed">By accessing xSypher, you agree to follow these rules and our community guidelines.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--accent)] font-bold mt-0.5 shrink-0">•</span>
                    <span className="text-[var(--muted)] leading-relaxed">All original content is copyrighted by xSypher and cannot be republished or scraped without permission.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--accent)] font-bold mt-0.5 shrink-0">•</span>
                    <span className="text-[var(--muted)] leading-relaxed">We enforce strict zero-tolerance rules for hate speech, spam, and harassment in our community sections.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--accent)] font-bold mt-0.5 shrink-0">•</span>
                    <span className="text-[var(--muted)] leading-relaxed">Your use of the site and its informational content is at your own risk.</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* SECTION 1 */}
          <section id="acceptance" className="scroll-mt-28">
            <div className="flex items-center gap-3 mb-6">
              <ScrollText className="w-6 h-6 text-[var(--accent)]" />
              <h2 className="font-[family:var(--f-display)] text-2xl sm:text-3xl font-bold text-[var(--ink)]">
                1. Acceptance of Terms
              </h2>
            </div>
            <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-[var(--muted)] font-[family:var(--f-body)]">
              <p className="mb-4">
                By accessing, browsing, or using the xSypher website, newsletters, or any related services, you acknowledge that you have read, understood, and agree to be bound by these Terms of Use. If you do not agree to these terms, you must not use our platform.
              </p>
              <p className="mb-4">
                We reserve the right to update or modify these terms at any time without prior notice. Your continued use of the platform following any changes constitutes your acceptance of the new terms.
              </p>
            </div>
          </section>

          {/* SECTION 2 */}
          <section id="intellectual-property" className="scroll-mt-28">
            <div className="flex items-center gap-3 mb-6">
              <Copyright className="w-6 h-6 text-[var(--accent)]" />
              <h2 className="font-[family:var(--f-display)] text-2xl sm:text-3xl font-bold text-[var(--ink)]">
                2. Intellectual Property
              </h2>
            </div>
            <div className="text-[var(--muted)] font-[family:var(--f-body)] leading-relaxed space-y-4">
              <p>
                All content published on xSypher—including articles, code snippets, graphics, logos, videos, and interface design—is the exclusive intellectual property of xSypher or its licensors and is protected by international copyright laws.
              </p>
              <h3 className="text-[var(--ink)] font-bold text-lg mt-6 mb-3">Permitted Use</h3>
              <ul className="list-disc pl-5 mb-4 space-y-2">
                <li>You may read and share our content for personal, non-commercial purposes.</li>
                <li>You may quote short excerpts under the doctrine of Fair Use, provided you clearly attribute xSypher as the source and include a direct backlink to the original article.</li>
              </ul>
              <h3 className="text-[var(--ink)] font-bold text-lg mt-6 mb-3">Prohibited Use</h3>
              <ul className="list-disc pl-5 mb-4 space-y-2">
                <li>You may not scrape, crawl, or use automated bots to extract our data for training AI models without explicit, written commercial licensing.</li>
                <li>You may not reproduce, syndicate, or create derivative works from full articles without prior written permission.</li>
              </ul>
            </div>
          </section>

          {/* SECTION 3 */}
          <section id="user-conduct" className="scroll-mt-28">
            <div className="flex items-center gap-3 mb-6">
              <MessageSquare className="w-6 h-6 text-[var(--accent)]" />
              <h2 className="font-[family:var(--f-display)] text-2xl sm:text-3xl font-bold text-[var(--ink)]">
                3. User Conduct & Comments
              </h2>
            </div>
            <div className="text-[var(--muted)] font-[family:var(--f-body)] leading-relaxed space-y-4">
              <p>
                We value our community and encourage rigorous, respectful debate. However, to maintain a safe environment, you agree not to use xSypher to post, transmit, or share content that:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <div className="p-5 border border-l-4 border-[var(--line)] border-l-[var(--accent)] rounded-r-xl bg-[var(--surface-2)]">
                  <h4 className="font-bold text-[var(--ink)] mb-2">Is Harmful or Abusive</h4>
                  <p className="text-sm">Defamatory, threatening, hateful, discriminatory, or harassing behavior will result in an immediate and permanent ban.</p>
                </div>
                <div className="p-5 border border-l-4 border-[var(--line)] border-l-[var(--accent)] rounded-r-xl bg-[var(--surface-2)]">
                  <h4 className="font-bold text-[var(--ink)] mb-2">Contains Spam or Malware</h4>
                  <p className="text-sm">Posting unauthorized advertisements, phishing links, or malicious code is strictly prohibited.</p>
                </div>
              </div>
              <p className="mt-4">
                We actively moderate discussions and reserve the right, at our sole discretion, to remove any comments and terminate user accounts without warning if these guidelines are violated.
              </p>
            </div>
          </section>

          {/* SECTION 4 */}
          <section id="disclaimers" className="scroll-mt-28">
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="w-6 h-6 text-[var(--accent)]" />
              <h2 className="font-[family:var(--f-display)] text-2xl sm:text-3xl font-bold text-[var(--ink)]">
                4. Disclaimers & Liability
              </h2>
            </div>
            <div className="text-[var(--muted)] font-[family:var(--f-body)] leading-relaxed space-y-4">
              <p>
                The information provided on xSypher, particularly regarding cybersecurity, software engineering, and technology analysis, is for educational and informational purposes only.
              </p>
              <div className="mt-6 p-5 bg-[var(--surface-2)] border border-[var(--line)] rounded-xl">
                <p className="text-[var(--ink)] text-sm italic">
                  "xSypher provides all content on an 'as is' and 'as available' basis. While we strive for absolute editorial accuracy, we make no warranties, express or implied, regarding the completeness, reliability, or suitability of the information. Any action you take upon the information on this website is strictly at your own risk."
                </p>
              </div>
              <p>
                xSypher and its writers, editors, or affiliates shall not be liable for any direct, indirect, incidental, consequential, or punitive damages arising out of your access to or use of the platform.
              </p>
            </div>
          </section>

          {/* SECTION 5 */}
          <section id="governing-law" className="scroll-mt-28 pb-12">
            <div className="flex items-center gap-3 mb-6">
              <Scale className="w-6 h-6 text-[var(--accent)]" />
              <h2 className="font-[family:var(--f-display)] text-2xl sm:text-3xl font-bold text-[var(--ink)]">
                5. Governing Law
              </h2>
            </div>
            <div className="text-[var(--muted)] font-[family:var(--f-body)] leading-relaxed space-y-4">
              <p>
                These Terms of Use and any disputes arising out of or related to the platform shall be governed by and construed in accordance with the laws of the jurisdiction in which xSypher's primary operating entity is based, without regard to its conflict of law principles.
              </p>
              <p>
                For further legal inquiries or to report a violation of these terms, please contact our legal desk via the <a href="/page/contact" className="text-[var(--accent)] hover:underline">Contact</a> page.
              </p>
            </div>
          </section>

        </article>
      </div>
    </div>
  );
}

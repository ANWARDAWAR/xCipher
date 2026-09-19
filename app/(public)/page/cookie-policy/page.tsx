import { Info, Cookie, ShieldCheck, BarChart3, Settings, RefreshCw } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy | xSypher',
  description: 'Learn about the cookies we use, why we use them, and how you can manage your preferences on xSypher.',
};

export default function CookiePolicyPage() {
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
              Cookie Policy
            </h1>
            <p className="font-[family:var(--f-body)] text-lg text-[var(--muted)] leading-relaxed">
              Transparency is our default. This policy explains how and why we use cookies and similar tracking technologies to improve your experience.
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
              <a href="#what-are-cookies" className="-ml-[2px] py-2 pl-4 border-l-2 border-transparent text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--accent)] transition-all font-medium">1. What Exactly Are Cookies?</a>
              <a href="#types-of-cookies" className="-ml-[2px] py-2 pl-4 border-l-2 border-transparent text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--accent)] transition-all font-medium">2. Types of Cookies We Use</a>
              <a href="#third-party" className="-ml-[2px] py-2 pl-4 border-l-2 border-transparent text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--accent)] transition-all font-medium">3. Third-Party Analytics</a>
              <a href="#manage-preferences" className="-ml-[2px] py-2 pl-4 border-l-2 border-transparent text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--accent)] transition-all font-medium">4. Managing Your Preferences</a>
              <a href="#updates" className="-ml-[2px] py-2 pl-4 border-l-2 border-transparent text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--accent)] transition-all font-medium">5. Policy Updates & Contact</a>
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
                    <span className="text-[var(--muted)] leading-relaxed">We use <strong>essential cookies</strong> to keep the site secure, functional, and to remember your light/dark mode preference.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--accent)] font-bold mt-0.5 shrink-0">•</span>
                    <span className="text-[var(--muted)] leading-relaxed">We use <strong>analytics cookies</strong> to understand what content our readers enjoy most, helping us improve our journalism.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--accent)] font-bold mt-0.5 shrink-0">•</span>
                    <span className="text-[var(--muted)] leading-relaxed">We respect your privacy: we do <strong>not</strong> use intrusive, cross-site third-party advertising trackers.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--accent)] font-bold mt-0.5 shrink-0">•</span>
                    <span className="text-[var(--muted)] leading-relaxed">You retain full control and can clear or block non-essential cookies directly from your browser settings.</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* SECTION 1 */}
          <section id="what-are-cookies" className="scroll-mt-28">
            <div className="flex items-center gap-3 mb-6">
              <Cookie className="w-6 h-6 text-[var(--accent)]" />
              <h2 className="font-[family:var(--f-display)] text-2xl sm:text-3xl font-bold text-[var(--ink)]">
                1. What Exactly Are Cookies?
              </h2>
            </div>
            <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-[var(--muted)] font-[family:var(--f-body)]">
              <p className="mb-4">
                Cookies are small text files that are placed on your computer, smartphone, or other device when you visit a website. They are widely used by website owners in order to make their websites work, or to work more efficiently, as well as to provide reporting information.
              </p>
              <p className="mb-4">
                Cookies set by the website owner (in this case, xSypher) are called "first-party cookies". Cookies set by parties other than the website owner are called "third-party cookies". We use both types to ensure our platform functions correctly and to deliver a seamless reading experience.
              </p>
            </div>
          </section>

          {/* SECTION 2 */}
          <section id="types-of-cookies" className="scroll-mt-28">
            <div className="flex items-center gap-3 mb-6">
              <ShieldCheck className="w-6 h-6 text-[var(--accent)]" />
              <h2 className="font-[family:var(--f-display)] text-2xl sm:text-3xl font-bold text-[var(--ink)]">
                2. Types of Cookies We Use
              </h2>
            </div>
            <div className="text-[var(--muted)] font-[family:var(--f-body)] leading-relaxed space-y-6">
              <p>
                Our platform utilizes different categories of cookies, each serving a distinct and necessary purpose:
              </p>
              
              <div className="p-5 border border-l-4 border-[var(--line)] border-l-[var(--accent)] rounded-r-xl bg-[var(--surface-2)]">
                <h4 className="font-bold text-[var(--ink)] mb-2 flex items-center gap-2">
                  Essential / Strictly Necessary Cookies
                </h4>
                <p className="text-sm mb-3">These cookies are critical for xSypher to function correctly. Without them, core services cannot be provided.</p>
                <ul className="text-sm list-disc pl-5 space-y-1">
                  <li><strong>Authentication:</strong> Keeping you logged in to your account securely.</li>
                  <li><strong>Security:</strong> Detecting malicious activity and preventing CSRF attacks.</li>
                  <li><strong>Preferences:</strong> Remembering your theme choice (Light vs. Dark mode) to prevent flashing screens on load.</li>
                </ul>
              </div>

              <div className="p-5 border border-l-4 border-[var(--line)] border-l-[var(--muted)] rounded-r-xl bg-[var(--surface-2)]">
                <h4 className="font-bold text-[var(--ink)] mb-2 flex items-center gap-2">
                  Performance & Functionality Cookies
                </h4>
                <p className="text-sm mb-3">These cookies are used to enhance the performance and functionality of our platform but are non-essential to its core use.</p>
                <ul className="text-sm list-disc pl-5 space-y-1">
                  <li><strong>Session State:</strong> Remembering where you left off in an article or if you dismissed a banner.</li>
                  <li><strong>Load Balancing:</strong> Distributing traffic across servers to ensure fast load times.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* SECTION 3 */}
          <section id="third-party" className="scroll-mt-28">
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="w-6 h-6 text-[var(--accent)]" />
              <h2 className="font-[family:var(--f-display)] text-2xl sm:text-3xl font-bold text-[var(--ink)]">
                3. Third-Party Analytics
              </h2>
            </div>
            <div className="text-[var(--muted)] font-[family:var(--f-body)] leading-relaxed space-y-4">
              <p>
                We use privacy-respecting analytics tools to collect aggregated, anonymous data about our traffic. This helps us see which articles are most popular, how fast our pages are loading, and where we can improve the reading experience. 
              </p>
              <p>
                <strong>No Cross-Site Tracking:</strong> Unlike many modern platforms, we do not utilize invasive advertising trackers (like Meta Pixels or aggressive ad-network cookies) that follow you across the internet to build advertising profiles. 
              </p>
            </div>
          </section>

          {/* SECTION 4 */}
          <section id="manage-preferences" className="scroll-mt-28">
            <div className="flex items-center gap-3 mb-6">
              <Settings className="w-6 h-6 text-[var(--accent)]" />
              <h2 className="font-[family:var(--f-display)] text-2xl sm:text-3xl font-bold text-[var(--ink)]">
                4. Managing Your Preferences
              </h2>
            </div>
            <div className="text-[var(--muted)] font-[family:var(--f-body)] leading-relaxed space-y-4">
              <p>
                You have the right to decide whether to accept or reject non-essential cookies. You can set or amend your web browser controls to accept or refuse cookies entirely.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <div className="p-4 bg-[var(--surface-2)] border border-[var(--line)] rounded-xl">
                  <h4 className="font-bold text-[var(--ink)] mb-1 text-sm">Browser Settings</h4>
                  <p className="text-xs">Navigate to the privacy or security settings in your browser (Chrome, Firefox, Safari, Edge) to clear existing cookies or block future ones.</p>
                </div>
                <div className="p-4 bg-[var(--surface-2)] border border-[var(--line)] rounded-xl">
                  <h4 className="font-bold text-[var(--ink)] mb-1 text-sm">Important Note</h4>
                  <p className="text-xs">If you choose to reject essential cookies, you may still use our website, but your access to some functionality and areas (like logging in) may be restricted or broken.</p>
                </div>
              </div>
              <p className="mt-4">
                To find out more about how to manage and delete cookies, visit <a href="https://aboutcookies.org" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">aboutcookies.org</a> or <a href="https://www.allaboutcookies.org" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">allaboutcookies.org</a>.
              </p>
            </div>
          </section>

          {/* SECTION 5 */}
          <section id="updates" className="scroll-mt-28 pb-12">
            <div className="flex items-center gap-3 mb-6">
              <RefreshCw className="w-6 h-6 text-[var(--accent)]" />
              <h2 className="font-[family:var(--f-display)] text-2xl sm:text-3xl font-bold text-[var(--ink)]">
                5. Policy Updates & Contact
              </h2>
            </div>
            <div className="text-[var(--muted)] font-[family:var(--f-body)] leading-relaxed space-y-4">
              <p>
                We may update this Cookie Policy from time to time in order to reflect changes to the cookies we use or for other operational, legal, or regulatory reasons. Please revisit this page regularly to stay informed about our use of cookies and related technologies.
              </p>
              <p>
                If you have any questions regarding our use of cookies or other technologies, please email our team at <a href="mailto:privacy@xsypher.com" className="text-[var(--accent)] hover:underline font-semibold">privacy@xsypher.com</a>.
              </p>
            </div>
          </section>

        </article>
      </div>
    </div>
  );
}

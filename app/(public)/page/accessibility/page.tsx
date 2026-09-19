import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Accessibility Statement | xSypher',
  description: 'xSypher\'s commitment to digital accessibility and WCAG compliance.',
};

export default function AccessibilityPage() {
  return (
    <div className="bg-[var(--surface)] min-h-screen">
      <header className="border-b border-[var(--line)] bg-[var(--surface-2)]">
        <div className="max-w-7xl mx-auto px-4 pt-32 pb-16 sm:pt-40 sm:px-8 lg:pt-44 lg:px-12 relative z-10">
          <div className="max-w-3xl">
            <span className="text-[var(--accent)] font-bold text-xs uppercase tracking-widest mb-3 block">
              Legal & Compliance
            </span>
            <h1 className="font-[family:var(--f-display)] text-4xl sm:text-5xl font-bold mb-4 text-[var(--ink)] tracking-tight">
              Accessibility Statement
            </h1>
            <p className="font-[family:var(--f-body)] text-lg text-[var(--muted)] leading-relaxed">
              Our ongoing commitment to ensuring our journalism and platform are accessible to everyone, including users with disabilities.
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-8 lg:px-12 flex flex-col lg:flex-row gap-12">
        <aside className="lg:w-1/4 hidden lg:block shrink-0">
          <div className="sticky top-32">
            <h4 className="font-[family:var(--f-display)] font-bold text-sm text-[var(--ink)] uppercase tracking-wider mb-4 border-b border-[var(--line)] pb-2">
              Table of Contents
            </h4>
            <nav className="flex flex-col font-[family:var(--f-ui)] text-sm border-l-2 border-[var(--line-2)]">
              <a href="#commitment" className="-ml-[2px] py-2 pl-4 border-l-2 border-transparent text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--accent)] transition-all font-medium">1. Commitment to Accessibility</a>
              <a href="#assistive" className="-ml-[2px] py-2 pl-4 border-l-2 border-transparent text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--accent)] transition-all font-medium">2. Supported Assistive Technologies</a>
              <a href="#keyboard" className="-ml-[2px] py-2 pl-4 border-l-2 border-transparent text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--accent)] transition-all font-medium">3. Keyboard Navigation</a>
              <a href="#reporting" className="-ml-[2px] py-2 pl-4 border-l-2 border-transparent text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--accent)] transition-all font-medium">4. Reporting Issues</a>
            </nav>
          </div>
        </aside>

        <article className="lg:w-3/4 max-w-3xl text-[var(--ink)] space-y-12">
          
          <section id="commitment" className="scroll-mt-28">
            <h2 className="font-[family:var(--f-display)] text-2xl sm:text-3xl font-bold text-[var(--ink)] mb-6">
              1. Commitment to Accessibility
            </h2>
            <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-[var(--muted)] font-[family:var(--f-body)]">
              <p>
                xSypher is committed to providing a website that is accessible to the widest possible audience, regardless of technology or ability. We are actively working to increase the accessibility and usability of our website and in doing so adhere to many of the available standards and guidelines, including the Web Content Accessibility Guidelines (WCAG) 2.1 level AA.
              </p>
            </div>
          </section>

          <section id="assistive" className="scroll-mt-28">
            <h2 className="font-[family:var(--f-display)] text-2xl sm:text-3xl font-bold text-[var(--ink)] mb-6">
              2. Supported Assistive Technologies
            </h2>
            <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-[var(--muted)] font-[family:var(--f-body)]">
              <p>
                We aim to support a variety of assistive technologies. Our site structure utilizes semantic HTML5 to ensure compatibility with screen readers (like VoiceOver, JAWS, and NVDA). We also support OS-level preferences, including Reduced Motion and High Contrast/Dark Mode settings, allowing users to consume content comfortably.
              </p>
            </div>
          </section>

          <section id="keyboard" className="scroll-mt-28">
            <h2 className="font-[family:var(--f-display)] text-2xl sm:text-3xl font-bold text-[var(--ink)] mb-6">
              3. Keyboard Navigation
            </h2>
            <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-[var(--muted)] font-[family:var(--f-body)]">
              <p>
                Our platform is designed to be fully navigable via keyboard. We provide "Skip to Content" links at the top of the page, visible focus rings on interactive elements, and logical tab ordering to ensure users who cannot use a mouse have full access to our journalism.
              </p>
            </div>
          </section>

          <section id="reporting" className="scroll-mt-28">
            <h2 className="font-[family:var(--f-display)] text-2xl sm:text-3xl font-bold text-[var(--ink)] mb-6">
              4. Reporting Issues
            </h2>
            <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-[var(--muted)] font-[family:var(--f-body)]">
              <p>
                We are continually seeking out solutions that will bring all areas of the site up to the same level of overall web accessibility. In the meantime, should you experience any difficulty in accessing the xSypher website, please don't hesitate to contact us.
              </p>
              <p>
                Email us at: <a href="mailto:accessibility@xsypher.com" className="text-[var(--accent)] hover:underline">accessibility@xsypher.com</a>
              </p>
            </div>
          </section>

        </article>
      </div>
    </div>
  );
}

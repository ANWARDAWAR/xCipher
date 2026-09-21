import Link from 'next/link';
import type { Metadata } from 'next';
import { Map } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Site Directory | xSypher',
  description: 'Navigate xSypher - Advanced Tech & Security Insights.',
};

export default function SitemapPage() {
  return (
    <div className="bg-[var(--surface)] min-h-screen">
      <header className="border-b border-[var(--line)] bg-[var(--surface-2)]">
        <div className="max-w-7xl mx-auto px-4 pt-32 pb-16 sm:pt-40 sm:px-8 lg:pt-44 lg:px-12 relative z-10">
          <div className="max-w-3xl">
            <span className="text-[var(--accent)] font-bold text-xs uppercase tracking-widest mb-3 block">
              Directory
            </span>
            <h1 className="font-[family:var(--f-display)] text-4xl sm:text-5xl font-bold mb-4 text-[var(--ink)] tracking-tight">
              Site Map
            </h1>
            <p className="font-[family:var(--f-body)] text-lg text-[var(--muted)] leading-relaxed">
              Navigate our entire intelligence database and publication resources.
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Editorial Categories */}
          <div className="bg-[var(--surface-2)] border border-[var(--line)] rounded-2xl p-8 shadow-sm">
            <h2 className="font-[family:var(--f-display)] font-bold text-xl text-[var(--ink)] mb-6 flex items-center gap-2 border-b border-[var(--line)] pb-4">
              <Map className="w-5 h-5 text-[var(--accent)]" />
              Editorial Categories
            </h2>
            <ul className="space-y-3 font-[family:var(--f-ui)]">
              <li><Link href="/" className="text-[var(--muted)] hover:text-[var(--accent)] transition-colors">Home</Link></li>
              <li><Link href="/latest" className="text-[var(--muted)] hover:text-[var(--accent)] transition-colors">Latest Intelligence</Link></li>
              <li><Link href="/category/ai" className="text-[var(--muted)] hover:text-[var(--accent)] transition-colors">Artificial Intelligence</Link></li>
              <li><Link href="/category/cybersecurity" className="text-[var(--muted)] hover:text-[var(--accent)] transition-colors">Cybersecurity</Link></li>
              <li><Link href="/category/gadgets" className="text-[var(--muted)] hover:text-[var(--accent)] transition-colors">Gadgets & Hardware</Link></li>
              <li><Link href="/category/software" className="text-[var(--muted)] hover:text-[var(--accent)] transition-colors">Software</Link></li>
              <li><Link href="/category/programming" className="text-[var(--muted)] hover:text-[var(--accent)] transition-colors">Programming</Link></li>
              <li><Link href="/category/business" className="text-[var(--muted)] hover:text-[var(--accent)] transition-colors">Startups & Business</Link></li>
              <li><Link href="/category/gaming" className="text-[var(--muted)] hover:text-[var(--accent)] transition-colors">Gaming</Link></li>
              <li><Link href="/series" className="text-[var(--muted)] hover:text-[var(--accent)] transition-colors">Series & Collections</Link></li>
            </ul>
          </div>

          {/* Publication & Company */}
          <div className="bg-[var(--surface-2)] border border-[var(--line)] rounded-2xl p-8 shadow-sm">
            <h2 className="font-[family:var(--f-display)] font-bold text-xl text-[var(--ink)] mb-6 flex items-center gap-2 border-b border-[var(--line)] pb-4">
              <Map className="w-5 h-5 text-[var(--accent)]" />
              Publication & Company
            </h2>
            <ul className="space-y-3 font-[family:var(--f-ui)]">
              <li><Link href="/page/about" className="text-[var(--muted)] hover:text-[var(--accent)] transition-colors">About xSypher</Link></li>
              <li><Link href="/page/contact" className="text-[var(--muted)] hover:text-[var(--accent)] transition-colors">Contact Us</Link></li>
              <li><Link href="/page/careers" className="text-[var(--muted)] hover:text-[var(--accent)] transition-colors">Careers</Link></li>
              <li><Link href="/page/advertising" className="text-[var(--muted)] hover:text-[var(--accent)] transition-colors">Advertising & Partnerships</Link></li>
              <li><Link href="/page/media-kit" className="text-[var(--muted)] hover:text-[var(--accent)] transition-colors">Media Kit & Brand Assets</Link></li>
              <li><Link href="/page/newsletters" className="text-[var(--muted)] hover:text-[var(--accent)] transition-colors">Newsletters</Link></li>
            </ul>
          </div>

          {/* Legal & Policies */}
          <div className="bg-[var(--surface-2)] border border-[var(--line)] rounded-2xl p-8 shadow-sm">
            <h2 className="font-[family:var(--f-display)] font-bold text-xl text-[var(--ink)] mb-6 flex items-center gap-2 border-b border-[var(--line)] pb-4">
              <Map className="w-5 h-5 text-[var(--accent)]" />
              Legal & Policies
            </h2>
            <ul className="space-y-3 font-[family:var(--f-ui)]">
              <li><Link href="/page/privacy-policy" className="text-[var(--muted)] hover:text-[var(--accent)] transition-colors">Privacy Policy</Link></li>
              <li><Link href="/page/terms-of-use" className="text-[var(--muted)] hover:text-[var(--accent)] transition-colors">Terms of Use</Link></li>
              <li><Link href="/page/cookie-policy" className="text-[var(--muted)] hover:text-[var(--accent)] transition-colors">Cookie Policy</Link></li>
              <li><Link href="/page/disclaimer" className="text-[var(--muted)] hover:text-[var(--accent)] transition-colors">Technical Disclaimer</Link></li>
              <li><Link href="/page/accessibility" className="text-[var(--muted)] hover:text-[var(--accent)] transition-colors">Accessibility Statement</Link></li>
              <li><Link href="/page/editorial-policy" className="text-[var(--muted)] hover:text-[var(--accent)] transition-colors">Editorial Policy</Link></li>
              <li><Link href="/page/editorial-standards" className="text-[var(--muted)] hover:text-[var(--accent)] transition-colors">Editorial Standards</Link></li>
              <li><Link href="/page/corrections" className="text-[var(--muted)] hover:text-[var(--accent)] transition-colors">Corrections Policy</Link></li>
              <li><Link href="/page/transparency" className="text-[var(--muted)] hover:text-[var(--accent)] transition-colors">Transparency Report</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

import Image from 'next/image';
import { Download, Palette, Type, ShieldCheck, User } from 'lucide-react';
import type { Metadata } from 'next';
import CopyButton from './CopyButton';
import DownloadAssetCard from './DownloadAssetCard';

export const metadata: Metadata = {
  title: 'Media Kit & Brand Assets | xSypher',
  description: 'Download official xSypher logos, brand guidelines, and press assets.',
};

export default function MediaKitPage() {
  return (
    <div className="bg-[var(--surface)] min-h-screen">
      <header className="border-b border-[var(--line)] bg-[var(--surface-2)]">
        <div className="max-w-7xl mx-auto px-4 pt-32 pb-16 sm:pt-40 sm:px-8 lg:pt-44 lg:px-12 relative z-10">
          <div className="max-w-3xl">
            <span className="text-[var(--accent)] font-bold text-xs uppercase tracking-widest mb-3 block">
              Press &amp; Partners
            </span>
            <h1 className="font-[family:var(--f-display)] text-4xl sm:text-5xl font-bold mb-4 text-[var(--ink)] tracking-tight">
              Media Kit
            </h1>
            <p className="font-[family:var(--f-body)] text-lg text-[var(--muted)] leading-relaxed">
              Official brand assets, typography guidelines, and corporate boilerplate for press, conference organizers, and syndication partners.
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-8 lg:px-12">
        
        {/* Boilerplate Copy */}
        <section className="mb-16">
          <h2 className="font-[family:var(--f-display)] text-2xl font-bold text-[var(--ink)] mb-6 border-b border-[var(--line)] pb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[var(--accent)]" />
            Corporate Boilerplate
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-[var(--surface-2)] border border-[var(--line)] rounded-sm p-6 shadow-sm">
              <h3 className="font-bold text-[var(--ink)] mb-3 text-sm uppercase tracking-wider">50-Word Standard</h3>
              <p className="text-[var(--muted)] font-[family:var(--f-body)] text-sm leading-relaxed mb-4">
                xSypher is an independent technology and cybersecurity publication dedicated to high-fidelity intelligence, zero-day research, and deep-dive technical analysis. Designed for engineers and security professionals, xSypher rejects surveillance capitalism in favor of a 100% reader-funded, privacy-first infrastructure that respects technical authority.
              </p>
              <CopyButton text="xSypher is an independent technology and cybersecurity publication dedicated to high-fidelity intelligence, zero-day research, and deep-dive technical analysis. Designed for engineers and security professionals, xSypher rejects surveillance capitalism in favor of a 100% reader-funded, privacy-first infrastructure that respects technical authority." />
            </div>
            <div className="bg-[var(--surface-2)] border border-[var(--line)] rounded-sm p-6 shadow-sm">
              <h3 className="font-bold text-[var(--ink)] mb-3 text-sm uppercase tracking-wider">100-Word Expanded</h3>
              <p className="text-[var(--muted)] font-[family:var(--f-body)] text-sm leading-relaxed mb-4">
                xSypher is an independent technology and cybersecurity publication dedicated to high-fidelity intelligence, zero-day research, and deep-dive technical analysis. Built by engineers for engineers, xSypher provides uncompromising coverage of the software, hardware, and threat actors shaping modern digital infrastructure. <br/><br/>
                Operating under a strict mandate of editorial independence, the publication rejects surveillance capitalism, programmatic advertising, and venture capital influence. Instead, xSypher relies on a 100% privacy-first, reader-funded model, ensuring our loyalty remains exclusively with the technical professionals who rely on our reporting.
              </p>
              <CopyButton text="xSypher is an independent technology and cybersecurity publication dedicated to high-fidelity intelligence, zero-day research, and deep-dive technical analysis. Built by engineers for engineers, xSypher provides uncompromising coverage of the software, hardware, and threat actors shaping modern digital infrastructure. Operating under a strict mandate of editorial independence, the publication rejects surveillance capitalism, programmatic advertising, and venture capital influence. Instead, xSypher relies on a 100% privacy-first, reader-funded model, ensuring our loyalty remains exclusively with the technical professionals who rely on our reporting." />
            </div>
          </div>
        </section>

        {/* Executive Bios */}
        <section className="mb-16">
          <h2 className="font-[family:var(--f-display)] text-2xl font-bold text-[var(--ink)] mb-6 border-b border-[var(--line)] pb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-[var(--accent)]" />
            Executive Profiles
          </h2>
          <div className="bg-[var(--surface-2)] border border-[var(--line)] rounded-sm p-6 sm:p-8 flex flex-col md:flex-row gap-8 items-start shadow-sm">
            <div className="w-32 h-32 shrink-0 border-2 border-[var(--accent)] rounded-full overflow-hidden mt-2 bg-white p-1">
              <Image
                src="/anwar.webp"
                alt="Anwar Iqbal Dawar"
                width={128}
                height={128}
                className="w-full h-full object-cover object-[50%_10%] scale-[1.15] translate-y-2 rounded-full"
                priority
              />
            </div>
            <div>
              <h3 className="font-[family:var(--f-display)] text-2xl font-bold text-[var(--ink)] mb-1">Anwar Iqbal Dawar</h3>
              <p className="text-sm font-bold uppercase tracking-widest text-[var(--accent)] mb-4">Founder &amp; Lead Editor</p>
              <p className="text-[var(--muted)] font-[family:var(--f-body)] text-sm sm:text-base leading-relaxed mb-4">
                Anwar Iqbal Dawar is the founder and Lead Editor of xSypher. As a Computer Engineering scholar with a deep focus on systems architecture and structural vulnerability research, Anwar established xSypher to bridge the gap between academic security research and frontline engineering application. Under his leadership, the publication delivers noise-free, rigorous intelligence across artificial intelligence and cybersecurity with unyielding technical independence.
              </p>
              <a href="mailto:press@xsypher.com" className="text-sm font-bold text-[var(--ink)] hover:text-[var(--accent)] transition-colors">Request Interview &rarr;</a>
            </div>
          </div>
        </section>

        {/* Brand Guidelines */}
        <section className="mb-16">
          <h2 className="font-[family:var(--f-display)] text-2xl font-bold text-[var(--ink)] mb-6 border-b border-[var(--line)] pb-4">
            Logo Usage &amp; Brand Constraints
          </h2>
          <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-4xl text-[var(--muted)] font-[family:var(--f-body)]">
            <p>
              The xSypher logomark is an essential part of our brand identity. It represents our commitment to precision, cryptography, and structural integrity.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-8 not-prose">
              <div className="border border-green-500/30 bg-green-500/5 rounded-sm p-6">
                <h4 className="font-bold text-green-500 mb-2 uppercase text-sm tracking-wide">Do:</h4>
                <ul className="text-sm space-y-2 text-[var(--ink)] list-disc pl-4">
                  <li>Maintain strict clear-space padding (at least 1/2 the width of the logo mark).</li>
                  <li>Use the high-contrast white variant on dark backgrounds.</li>
                  <li>Scale the logo proportionally.</li>
                </ul>
              </div>
              <div className="border border-red-500/30 bg-red-500/5 rounded-sm p-6">
                <h4 className="font-bold text-red-500 mb-2 uppercase text-sm tracking-wide">Don't:</h4>
                <ul className="text-sm space-y-2 text-[var(--ink)] list-disc pl-4">
                  <li>Do not apply drop shadows, glows, or gradients to the logo.</li>
                  <li>Do not skew, stretch, or compress the logo dimensions.</li>
                  <li>Do not recolor the logo outside of the approved brand palette.</li>
                  <li>Do not embed the logo in a busy or low-contrast background.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Typography */}
        <section className="mb-16">
          <h2 className="font-[family:var(--f-display)] text-2xl font-bold text-[var(--ink)] mb-6 border-b border-[var(--line)] pb-4 flex items-center gap-2">
            <Type className="w-5 h-5 text-[var(--accent)]" />
            Brand Typography
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-[var(--surface-2)] border border-[var(--line)] rounded-sm">
              <div className="text-4xl mb-4 text-[var(--ink)] font-normal font-kremlin">Kremlin</div>
              <h3 className="font-bold text-[var(--ink)] mb-2">Display &amp; Branding</h3>
              <p className="text-sm text-[var(--muted)]">Our custom display face is used exclusively for the xSypher logo mark and highly specific editorial feature headers. It represents the brutalist, unapologetic nature of our cybersecurity reporting.</p>
            </div>
            <div className="p-6 bg-[var(--surface-2)] border border-[var(--line)] rounded-sm">
              <div className="text-4xl mb-4 text-[var(--ink)] font-bold tracking-tight" style={{ fontFamily: 'var(--f-display)' }}>Inter</div>
              <h3 className="font-bold text-[var(--ink)] mb-2">Primary UI &amp; Prose</h3>
              <p className="text-sm text-[var(--muted)]">Inter is utilized for all interface elements and long-form article prose. It was selected for its exceptional legibility at small sizes, optimal x-height, and neutral technical aesthetic.</p>
            </div>
          </div>
        </section>

        {/* Color Palette */}
        <section className="mb-16">
          <h2 className="font-[family:var(--f-display)] text-2xl font-bold text-[var(--ink)] mb-6 border-b border-[var(--line)] pb-4 flex items-center gap-2">
            <Palette className="w-5 h-5 text-[var(--accent)]" />
            Brand Colors
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-[var(--surface-2)] border border-[var(--line)] rounded-sm overflow-hidden shadow-sm flex flex-col">
              <div className="h-32 w-full" style={{ backgroundColor: 'var(--accent)' }}></div>
              <div className="p-4">
                <h3 className="font-bold text-[var(--ink)] mb-1">Primary Accent (Red)</h3>
                <code className="text-xs text-[var(--muted)] bg-[var(--surface)] px-2 py-1 rounded">HEX: #EF4444 (Approx)</code>
              </div>
            </div>
            <div className="bg-[var(--surface-2)] border border-[var(--line)] rounded-sm overflow-hidden shadow-sm flex flex-col">
              <div className="h-32 w-full" style={{ backgroundColor: 'var(--ink)' }}></div>
              <div className="p-4">
                <h3 className="font-bold text-[var(--ink)] mb-1">Ink (Text)</h3>
                <code className="text-xs text-[var(--muted)] bg-[var(--surface)] px-2 py-1 rounded">HEX: #F8FAFC / #0F172A</code>
              </div>
            </div>
            <div className="bg-[var(--surface-2)] border border-[var(--line)] rounded-sm overflow-hidden shadow-sm flex flex-col">
              <div className="h-32 w-full border-b border-[var(--line)]" style={{ backgroundColor: 'var(--surface)' }}></div>
              <div className="p-4">
                <h3 className="font-bold text-[var(--ink)] mb-1">Surface (Bg)</h3>
                <code className="text-xs text-[var(--muted)] bg-[var(--surface)] px-2 py-1 rounded">HEX: #020617 / #FFFFFF</code>
              </div>
            </div>
          </div>
        </section>

        {/* Downloadable Assets */}
        <section>
          <h2 className="font-[family:var(--f-display)] text-2xl font-bold text-[var(--ink)] mb-6 border-b border-[var(--line)] pb-4 flex items-center gap-2">
            <Download className="w-5 h-5 text-[var(--accent)]" />
            Downloadable Assets
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <DownloadAssetCard 
              title="xSypher Logo (SVG)"
              desc="Vector format, ideal for print and high-res web."
              type="svg"
            />
            <DownloadAssetCard 
              title="xSypher Logo (PNG)"
              desc="Raster format with transparent background."
              type="png"
            />
          </div>
        </section>

      </div>
    </div>
  );
}

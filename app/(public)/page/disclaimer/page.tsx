import { ShieldAlert, AlertTriangle, Scale, Cpu, TerminalSquare } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Technical Disclaimer | xSypher',
  description: 'Liability and safety disclaimer for xSypher\'s technical, coding, hardware modifications, and cybersecurity content.',
};

export default function DisclaimerPage() {
  return (
    <div className="bg-[var(--surface)] min-h-screen">
      <header className="border-b border-[var(--line)] bg-[var(--surface-2)]">
        <div className="max-w-7xl mx-auto px-4 pt-32 pb-16 sm:pt-40 sm:px-8 lg:pt-44 lg:px-12 relative z-10">
          <div className="max-w-3xl">
            <span className="text-[var(--accent)] font-bold text-xs uppercase tracking-widest mb-3 block">
              Legal &amp; Compliance
            </span>
            <h1 className="font-[family:var(--f-display)] text-4xl sm:text-5xl font-bold mb-4 text-[var(--ink)] tracking-tight">
              Technical Disclaimer
            </h1>
            <p className="font-[family:var(--f-body)] text-lg text-[var(--muted)] leading-relaxed">
              Limits of liability regarding zero-day research, dual-use technology, hardware reverse engineering, and exploit documentation published on xSypher.
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
              <a href="#educational" className="-ml-[2px] py-2 pl-4 border-l-2 border-transparent text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--accent)] transition-all font-medium">1. Educational Purposes Only</a>
              <a href="#dual-use" className="-ml-[2px] py-2 pl-4 border-l-2 border-transparent text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--accent)] transition-all font-medium">2. Dual-Use Technology Clause</a>
              <a href="#hardware-liability" className="-ml-[2px] py-2 pl-4 border-l-2 border-transparent text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--accent)] transition-all font-medium">3. Hardware &amp; Modification Liability</a>
              <a href="#safe-harbor" className="-ml-[2px] py-2 pl-4 border-l-2 border-transparent text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--accent)] transition-all font-medium">4. Safe Harbor for Researchers</a>
              <a href="#no-warranties" className="-ml-[2px] py-2 pl-4 border-l-2 border-transparent text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--accent)] transition-all font-medium">5. General Warranties</a>
            </nav>
          </div>
        </aside>

        <article className="lg:w-3/4 max-w-3xl text-[var(--ink)] space-y-16">
          
          <section id="educational" className="scroll-mt-28">
            <div className="flex items-center gap-3 mb-6">
              <ShieldAlert className="w-6 h-6 text-[var(--accent)]" />
              <h2 className="font-[family:var(--f-display)] text-2xl sm:text-3xl font-bold text-[var(--ink)] m-0">
                1. Educational Purposes Only
              </h2>
            </div>
            <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-[var(--muted)] font-[family:var(--f-body)]">
              <p>
                All cybersecurity tutorials, exploit breakdowns, reverse engineering concepts, and code snippets published on xSypher are provided strictly for <strong>educational and defensive purposes only</strong>. We share this knowledge to help security researchers, system administrators, and developers patch vulnerabilities and protect their infrastructure.
              </p>
              <p>
                Do not execute any provided code, scripts, or payloads against systems you do not own, or systems where you lack explicit, written authorization to conduct penetration testing.
              </p>
            </div>
          </section>

          <section id="dual-use" className="scroll-mt-28">
            <div className="flex items-center gap-3 mb-6">
              <TerminalSquare className="w-6 h-6 text-[var(--accent)]" />
              <h2 className="font-[family:var(--f-display)] text-2xl sm:text-3xl font-bold text-[var(--ink)] m-0">
                2. Dual-Use Technology Clause
              </h2>
            </div>
            <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-[var(--muted)] font-[family:var(--f-body)]">
              <p>
                Cybersecurity tools and knowledge are inherently dual-use; the same techniques used to audit and secure a network can be used to compromise it. The publication of Proof of Concept (PoC) exploits and vulnerability methodologies on xSypher is protected under the First Amendment (freedom of the press and publication of code as speech).
              </p>
              <p>
                However, xSypher vehemently opposes the weaponization of our research for unauthorized disruption, data theft, or state-sponsored cyber warfare. We are not legally or ethically liable for the misuse of our published defensive research by malicious actors.
              </p>
            </div>
          </section>

          <section id="hardware-liability" className="scroll-mt-28">
            <div className="flex items-center gap-3 mb-6">
              <Cpu className="w-6 h-6 text-[var(--accent)]" />
              <h2 className="font-[family:var(--f-display)] text-2xl sm:text-3xl font-bold text-[var(--ink)] m-0">
                3. Hardware &amp; Modification Liability
              </h2>
            </div>
            <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-[var(--muted)] font-[family:var(--f-body)]">
              <p>
                In addition to software engineering, xSypher frequently covers hardware reverse engineering, firmware flashing, and physical teardowns of IoT and networking devices. 
              </p>
              <p>
                If you choose to follow hardware guides, jumper configurations, or voltage modifications discussed on this platform, you assume total responsibility and risk. xSypher and its authors shall not be held liable for:
              </p>
              <ul>
                <li>Bricked or permanently damaged silicon and microcontrollers.</li>
                <li>Voided manufacturer warranties.</li>
                <li>Electrical hazards, fires, or physical injuries resulting from improper handling of hardware.</li>
              </ul>
            </div>
          </section>

          <section id="safe-harbor" className="scroll-mt-28">
            <div className="flex items-center gap-3 mb-6">
              <Scale className="w-6 h-6 text-[var(--accent)]" />
              <h2 className="font-[family:var(--f-display)] text-2xl sm:text-3xl font-bold text-[var(--ink)] m-0">
                4. Safe Harbor &amp; Responsible Disclosure
              </h2>
            </div>
            <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-[var(--muted)] font-[family:var(--f-body)]">
              <p>
                We routinely collaborate with independent security researchers who provide tips or datasets regarding zero-day vulnerabilities. xSypher operates under a strict journalistic standard:
              </p>
              <ul>
                <li><strong>Source Protection:</strong> We will not voluntarily disclose the identity of any confidential source or whistleblower to corporate entities or law enforcement.</li>
                <li><strong>Responsible Disclosure:</strong> Before publishing details of a critical, unpatched vulnerability, xSypher enforces a standard 90-day embargo to notify the affected vendor, allowing them time to develop a patch. We reserve the right to shorten this embargo to 7 days if the vulnerability is being actively exploited in the wild.</li>
              </ul>
            </div>
          </section>

          <section id="no-warranties" className="scroll-mt-28">
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="w-6 h-6 text-[var(--accent)]" />
              <h2 className="font-[family:var(--f-display)] text-2xl sm:text-3xl font-bold text-[var(--ink)] m-0">
                5. General Warranties
              </h2>
            </div>
            <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-[var(--muted)] font-[family:var(--f-body)]">
              <p>
                The information provided on xSypher is provided on an "as is" and "as available" basis without any warranties of any kind. We make no guarantees regarding the accuracy, reliability, or completeness of the technical information, code, or tutorials. Technologies and vulnerabilities evolve rapidly; content may become outdated or inaccurate over time.
              </p>
              <p>
                By using our platform and reading our research, you signify your acceptance of this disclaimer. If you do not agree, you must immediately cease using xSypher.
              </p>
            </div>
          </section>

        </article>
      </div>
    </div>
  );
}

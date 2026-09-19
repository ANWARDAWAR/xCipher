import { Info, Shield, Lock, FileText, Globe } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | xSypher',
  description: 'Understand how xSypher collects, uses, and protects your personal data under GDPR and CCPA guidelines.',
};

export default function PrivacyPolicyPage() {
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
              Privacy Policy
            </h1>
            <p className="font-[family:var(--f-body)] text-lg text-[var(--muted)] leading-relaxed">
              We believe in digital transparency. This policy outlines exactly how we handle your data, your privacy rights, and how we protect your information.
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
              <a href="#information-collection" className="-ml-[2px] py-2 pl-4 border-l-2 border-transparent text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--accent)] transition-all font-medium">1. Information We Collect</a>
              <a href="#how-we-use" className="-ml-[2px] py-2 pl-4 border-l-2 border-transparent text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--accent)] transition-all font-medium">2. How We Use Your Data</a>
              <a href="#data-sharing" className="-ml-[2px] py-2 pl-4 border-l-2 border-transparent text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--accent)] transition-all font-medium">3. Data Sharing & Disclosure</a>
              <a href="#your-rights" className="-ml-[2px] py-2 pl-4 border-l-2 border-transparent text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--accent)] transition-all font-medium">4. Your Privacy Rights (GDPR/CCPA)</a>
              <a href="#security" className="-ml-[2px] py-2 pl-4 border-l-2 border-transparent text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--accent)] transition-all font-medium">5. Data Security & Retention</a>
              <a href="#contact" className="-ml-[2px] py-2 pl-4 border-l-2 border-transparent text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--accent)] transition-all font-medium">6. Contact Information</a>
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
                    <span className="text-[var(--muted)] leading-relaxed">We only collect data necessary to provide and improve our journalism and services.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--accent)] font-bold mt-0.5 shrink-0">•</span>
                    <span className="text-[var(--muted)] leading-relaxed"><strong>We do not sell your personal data to third parties. Ever.</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--accent)] font-bold mt-0.5 shrink-0">•</span>
                    <span className="text-[var(--muted)] leading-relaxed">Newsletter emails are strictly opt-in, and you can unsubscribe with one click.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--accent)] font-bold mt-0.5 shrink-0">•</span>
                    <span className="text-[var(--muted)] leading-relaxed">We use standard analytics (like Google Analytics or Plausible) to optimize your reading experience without tracking you across the wider web.</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* SECTION 1 */}
          <section id="information-collection" className="scroll-mt-28">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="w-6 h-6 text-[var(--accent)]" />
              <h2 className="font-[family:var(--f-display)] text-2xl sm:text-3xl font-bold text-[var(--ink)]">
                1. Information We Collect
              </h2>
            </div>
            <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-[var(--muted)] font-[family:var(--f-body)]">
              <p className="mb-4">
                We collect information in three primary ways: information you provide directly to us, information we collect automatically when you use our platform, and information we may receive from third parties.
              </p>
              <h3 className="text-[var(--ink)] font-bold text-lg mt-6 mb-3">A. Information You Provide</h3>
              <p className="mb-4">
                When you sign up for the xSypher Daily Brief, register for an account, or contact our editorial desk, we collect:
              </p>
              <ul className="list-disc pl-5 mb-4 space-y-1">
                <li>Your name and email address.</li>
                <li>Account credentials (hashed passwords).</li>
                <li>Communications and correspondence sent to our support or editorial teams.</li>
              </ul>
              <h3 className="text-[var(--ink)] font-bold text-lg mt-6 mb-3">B. Automatically Collected Information</h3>
              <p className="mb-4">
                To ensure platform security and optimize delivery, our servers automatically record standard log data:
              </p>
              <ul className="list-disc pl-5 mb-4 space-y-1">
                <li>Device and browser type (e.g., Chrome on macOS).</li>
                <li>IP address (anonymized where required by local law).</li>
                <li>Referring URLs, pages viewed, and reading duration.</li>
              </ul>
            </div>
          </section>

          {/* SECTION 2 */}
          <section id="how-we-use" className="scroll-mt-28">
            <h2 className="font-[family:var(--f-display)] text-2xl sm:text-3xl font-bold text-[var(--ink)] mb-6">
              2. How We Use Your Data
            </h2>
            <div className="text-[var(--muted)] font-[family:var(--f-body)] leading-relaxed space-y-4">
              <p>
                The data we gather is strictly used to deliver, maintain, and enhance the xSypher platform. We rely on your consent and our legitimate business interests to process this data.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <div className="p-5 border border-[var(--line)] rounded-xl bg-[var(--surface-2)]">
                  <h4 className="font-bold text-[var(--ink)] mb-2">Service Delivery</h4>
                  <p className="text-sm">To send newsletters, authenticate your account, and provide access to premium content.</p>
                </div>
                <div className="p-5 border border-[var(--line)] rounded-xl bg-[var(--surface-2)]">
                  <h4 className="font-bold text-[var(--ink)] mb-2">Platform Security</h4>
                  <p className="text-sm">To detect malicious activity, prevent DDoS attacks, and enforce our Terms of Use.</p>
                </div>
                <div className="p-5 border border-[var(--line)] rounded-xl bg-[var(--surface-2)]">
                  <h4 className="font-bold text-[var(--ink)] mb-2">Editorial Analytics</h4>
                  <p className="text-sm">To understand which topics our audience cares about most, helping us direct our investigative resources.</p>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 3 */}
          <section id="data-sharing" className="scroll-mt-28">
            <h2 className="font-[family:var(--f-display)] text-2xl sm:text-3xl font-bold text-[var(--ink)] mb-6">
              3. Data Sharing & Disclosure
            </h2>
            <div className="text-[var(--muted)] font-[family:var(--f-body)] leading-relaxed space-y-4">
              <p>
                <strong>We do not sell, rent, or trade your personal information.</strong> We only share data with trusted third-party vendors who assist us in operating our platform (e.g., Vercel for hosting, Resend for emails). These vendors are legally bound by strict data processing agreements.
              </p>
              <p>
                We may also disclose information if required to do so by law, such as to comply with a subpoena or similar legal process, or when we believe in good faith that disclosure is necessary to protect our rights, protect your safety, investigate fraud, or respond to a government request.
              </p>
            </div>
          </section>

          {/* SECTION 4 */}
          <section id="your-rights" className="scroll-mt-28">
            <div className="flex items-center gap-3 mb-6">
              <Globe className="w-6 h-6 text-[var(--accent)]" />
              <h2 className="font-[family:var(--f-display)] text-2xl sm:text-3xl font-bold text-[var(--ink)]">
                4. Your Privacy Rights (GDPR & CCPA)
              </h2>
            </div>
            <div className="text-[var(--muted)] font-[family:var(--f-body)] leading-relaxed space-y-4">
              <p>
                Depending on your location (such as the EU/EEA, UK, or California), you are granted specific legal rights regarding your data:
              </p>
              <ul className="list-disc pl-5 mb-4 space-y-2">
                <li><strong>Right to Access:</strong> You can request a copy of the personal data we hold about you.</li>
                <li><strong>Right to Rectification:</strong> You can ask us to correct inaccurate or incomplete data.</li>
                <li><strong>Right to Erasure ("Right to be Forgotten"):</strong> You can request that we delete your personal data from our systems.</li>
                <li><strong>Right to Restrict Processing:</strong> You can ask us to pause processing your data under certain conditions.</li>
                <li><strong>Right to Data Portability:</strong> You can request your data in a structured, machine-readable format.</li>
              </ul>
              <div className="mt-6 p-4 bg-[var(--accent)]/10 border border-[var(--accent)]/30 rounded-xl">
                <p className="text-[var(--ink)] text-sm font-semibold">
                  To exercise any of these rights, please email our Data Protection Officer at <a href="mailto:privacy@xsypher.com" className="text-[var(--accent)] hover:underline">privacy@xsypher.com</a>. We will respond to your request within 30 days.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 5 */}
          <section id="security" className="scroll-mt-28">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-6 h-6 text-[var(--accent)]" />
              <h2 className="font-[family:var(--f-display)] text-2xl sm:text-3xl font-bold text-[var(--ink)]">
                5. Data Security & Retention
              </h2>
            </div>
            <div className="text-[var(--muted)] font-[family:var(--f-body)] leading-relaxed space-y-4">
              <p>
                We implement state-of-the-art cryptographic and structural security measures to protect your data. All data transmitted between your browser and our servers is encrypted using TLS 1.3. User passwords are computationally hashed using Bcrypt/Argon2.
              </p>
              <p>
                We retain your personal information only for as long as necessary to fulfill the purposes outlined in this policy, unless a longer retention period is required by law. When data is no longer needed, it is securely destroyed or irreversibly anonymized.
              </p>
            </div>
          </section>

          {/* SECTION 6 */}
          <section id="contact" className="scroll-mt-28 pb-12">
            <h2 className="font-[family:var(--f-display)] text-2xl sm:text-3xl font-bold text-[var(--ink)] mb-6">
              6. Contact Information
            </h2>
            <div className="text-[var(--muted)] font-[family:var(--f-body)] leading-relaxed space-y-4">
              <p>
                If you have any questions, concerns, or requests regarding this Privacy Policy, our privacy practices, or your dealings with the xSypher platform, please contact us.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <a 
                  href="mailto:privacy@xsypher.com"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 !bg-[var(--accent)] dark:!bg-[var(--accent)] !text-white dark:!text-white font-[family:var(--f-ui)] font-bold rounded-lg shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 group relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Email Privacy Team
                  </span>
                </a>
                <a 
                  href="/page/contact"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[var(--surface-2)] text-[var(--ink)] border border-[var(--line)] font-[family:var(--f-ui)] font-bold rounded-lg hover:bg-[var(--surface-3)] transition-all"
                >
                  General Contact
                </a>
              </div>
            </div>
          </section>

        </article>
      </div>
    </div>
  );
}

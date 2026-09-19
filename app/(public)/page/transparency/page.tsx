import { Metadata } from 'next';
import Link from 'next/link';
import { Lock, FileSignature, Landmark, Activity } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Transparency Report | xSypher',
  description: 'xSypher\'s commitment to editorial independence, reader privacy, and cryptographically verified data security.',
};

export default function TransparencyReportPage() {
  return (
    <div className="bg-[var(--paper)] min-h-screen">
      <header className="border-b border-[var(--line)] bg-[var(--surface-2)]">
        <div className="max-w-7xl mx-auto px-4 pt-32 pb-16 sm:pt-40 sm:px-8 lg:pt-44 lg:px-12 relative z-10">
          <div className="max-w-3xl">
            <span className="text-[var(--accent)] font-bold text-xs uppercase tracking-widest mb-3 block">
              Corporate Compliance
            </span>
            <h1 className="font-[family:var(--f-display)] text-4xl sm:text-5xl font-bold mb-4 text-[var(--ink)] tracking-tight">
              Transparency Report
            </h1>
            <p className="font-[family:var(--f-body)] text-lg text-[var(--muted)] leading-relaxed">
              Our formal disclosure of funding sources, government data requests, privacy telemetry metrics, and journalistic conflict-of-interest policies. We believe technical journalism requires uncompromising independence.
            </p>
          </div>
        </div>
      </header>

      {/* METRICS STRIP */}
      <div className="border-b border-[var(--line)] bg-[var(--surface)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[var(--line)]">
            <div className="py-6 sm:py-8 sm:pr-8 flex flex-col items-start">
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--muted)] mb-2">Funding Model</span>
              <span className="font-[family:var(--f-display)] text-2xl font-bold text-[var(--accent)]">100% Independent</span>
              <span className="text-sm font-[family:var(--f-body)] text-[var(--ink)] mt-1">Zero VC or corporate backing.</span>
            </div>
            <div className="py-6 sm:py-8 sm:px-8 flex flex-col items-start">
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--muted)] mb-2">Data Requests</span>
              <span className="font-[family:var(--f-display)] text-2xl font-bold text-[var(--accent)]">0 Subpoenas</span>
              <span className="text-sm font-[family:var(--f-body)] text-[var(--ink)] mt-1">No user data handed to authorities.</span>
            </div>
            <div className="py-6 sm:py-8 sm:px-8 flex flex-col items-start">
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--muted)] mb-2">Telemetry</span>
              <span className="font-[family:var(--f-display)] text-2xl font-bold text-[var(--accent)]">0 Trackers</span>
              <span className="text-sm font-[family:var(--f-body)] text-[var(--ink)] mt-1">No third-party analytics scripts.</span>
            </div>
            <div className="py-6 sm:py-8 sm:pl-8 flex flex-col items-start">
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--muted)] mb-2">Canary Status</span>
              <span className="font-[family:var(--f-display)] text-2xl font-bold text-green-500">Verified Alive</span>
              <span className="text-sm font-[family:var(--f-body)] text-[var(--ink)] mt-1">Updated every 14 days.</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-16 sm:px-8 sm:py-20">
        <div className="prose">
          <div className="flex items-center gap-3 mb-6 not-prose">
            <Landmark className="w-6 h-6 text-[var(--accent)]" />
            <h2 className="font-[family:var(--f-display)] text-2xl sm:text-3xl font-bold text-[var(--ink)] m-0">
              1. Editorial Independence &amp; Financial Breakdown
            </h2>
          </div>
          <p>
            xSypher operates on a strict model of financial and editorial independence. We do not accept funding, grants, or venture capital from technology conglomerates, defense contractors, or state-affiliated entities.
          </p>
          <p>
            To maintain operations while refusing invasive programmatic advertising, our revenue model is structurally diverse and transparent:
          </p>
          <ul>
            <li><strong>Reader Subscriptions (65%):</strong> Direct support from security professionals and engineers.</li>
            <li><strong>Verified Contextual Advertising (25%):</strong> Direct-sold, highly vetted sponsorships that do not rely on tracking pixels or user profiling.</li>
            <li><strong>Syndication Licensing (10%):</strong> Licensing our high-fidelity research to enterprise threat-intelligence platforms.</li>
          </ul>
          <p>
            No external entity—including our advertisers—is granted pre-publication review rights, editorial influence, or insight into our upcoming investigations.
          </p>

          <hr className="my-12 border-[var(--line)]" />

          <div className="flex items-center gap-3 mb-6 not-prose">
            <Lock className="w-6 h-6 text-[var(--accent)]" />
            <h2 className="font-[family:var(--f-display)] text-2xl sm:text-3xl font-bold text-[var(--ink)] m-0">
              2. Government Data Requests &amp; Warrant Canary
            </h2>
          </div>
          <p>
            As a journalistic entity covering cybersecurity, zero-day vulnerabilities, and state-sponsored espionage, we operate under the assumption that our infrastructure may be targeted by legal or government bodies seeking to uncover the identities of whistleblowers, confidential sources, or site visitors.
          </p>
          <div className="tableWrapper my-8">
            <table>
              <thead>
                <tr>
                  <th>Request Type</th>
                  <th>Received (YTD)</th>
                  <th>Complied With</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>National Security Letters (NSL)</td>
                  <td>0</td>
                  <td>0</td>
                </tr>
                <tr>
                  <td>FISA Court Orders</td>
                  <td>0</td>
                  <td>0</td>
                </tr>
                <tr>
                  <td>Subpoenas for Source Identity</td>
                  <td>0</td>
                  <td>0</td>
                </tr>
                <tr>
                  <td>Gag Orders</td>
                  <td>0</td>
                  <td>0</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <h3>Cryptographic Warrant Canary Verification</h3>
          <p>
            Because federal gag orders may legally prohibit us from disclosing that we have received a subpoena, xSypher utilizes a Cryptographic Warrant Canary. Below is a cryptographically signed PGP message. It states that as of the date signed, we have not received any secret warrants. 
          </p>
          <p>
            If this canary is removed, fails to update within 14 days, or fails PGP signature verification, <strong>you must assume we have been compromised by a secret subpoena and a gag order.</strong>
          </p>
          
          <div className="bg-[var(--surface-2)] border border-[var(--line)] rounded-sm p-4 my-6 overflow-x-auto text-xs font-mono text-[var(--muted)]">
<pre className="!bg-transparent !p-0 !m-0">
{`-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA256

I, Ahmad Khan, Editor-in-Chief of xSypher, confirm that as of
[October 15, 2026], xSypher has not received any National Security 
Letters, FISA orders, or any other classified requests for user data.

We maintain absolute control of our infrastructure.

-----BEGIN PGP SIGNATURE-----

iQIzBAEBCAAdFiEE... [SIGNATURE TRUNCATED FOR DISPLAY]
-----END PGP SIGNATURE-----`}
</pre>
          </div>
          <p className="text-sm text-[var(--muted)]">
            <em>You can verify this signature using our official Public PGP Key hosted on our <Link href="/page/contact">Contact Desk</Link> page.</em>
          </p>

          <hr className="my-12 border-[var(--line)]" />

          <div className="flex items-center gap-3 mb-6 not-prose">
            <FileSignature className="w-6 h-6 text-[var(--accent)]" />
            <h2 className="font-[family:var(--f-display)] text-2xl sm:text-3xl font-bold text-[var(--ink)] m-0">
              3. Journalistic Conflict of Interest Policy
            </h2>
          </div>
          <p>
            To ensure the integrity of our technical analysis, all xSypher staff, freelance researchers, and editors are bound by a strict conflict-of-interest contract:
          </p>
          <ul>
            <li><strong>Financial Holdings:</strong> Journalists may not own individual stock, cryptocurrency, or equity in any technology or security company they cover. (Broad-market index funds are exempt).</li>
            <li><strong>Gifts &amp; Travel:</strong> xSypher strictly prohibits accepting paid travel, hardware gifts, review units (that are not returned), or vendor hospitality. All conference travel is funded internally.</li>
            <li><strong>Bounties:</strong> If our staff uncovers a zero-day vulnerability during the course of reporting, they are barred from claiming financial bug bounties from the affected vendor to prevent perverse incentives.</li>
          </ul>

          <hr className="my-12 border-[var(--line)]" />

          <div className="flex items-center gap-3 mb-6 not-prose">
            <Activity className="w-6 h-6 text-[var(--accent)]" />
            <h2 className="font-[family:var(--f-display)] text-2xl sm:text-3xl font-bold text-[var(--ink)] m-0">
              4. Infrastructure Privacy &amp; Telemetry
            </h2>
          </div>
          <p>
            We actively reject the surveillance-capitalism model utilized by legacy media. The xSypher platform is engineered to function perfectly without extracting your personal data.
          </p>
          <ul>
            <li><strong>Third-Party Trackers:</strong> Zero. We do not use Google Analytics, Meta Pixels, or equivalent tracking scripts.</li>
            <li><strong>Self-Hosted Analytics:</strong> We use an anonymized, self-hosted analytics instance that records page views without using cookies or storing IP addresses.</li>
            <li><strong>Log Retention:</strong> Standard web server access logs are aggressively purged every 7 days and are never shared.</li>
          </ul>

          <p>
            For a full breakdown of how we handle standard operational data (like newsletter signups or payment processing), please read our <Link href="/page/privacy-policy">Privacy Policy</Link>.
          </p>
          
          <hr className="my-12 border-[var(--line)]" />
          
          <p>
            <strong>Last Updated:</strong> October 2026<br />
            <strong>Compliance Officer:</strong> Legal Desk, xSypher Media
          </p>
        </div>
      </div>
    </div>
  );
}

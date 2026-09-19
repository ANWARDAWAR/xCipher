import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Scale, UserCheck, LaptopMinimal, Quote } from "lucide-react";

export const metadata: Metadata = {
  title: "Editorial Standards — xSypher",
  description: "Truth, transparency, and deep technical accuracy. Our core rulebook for journalism.",
};

export default function EditorialStandardsPage() {
  return (
    <div className="w-full min-h-screen bg-[var(--surface)] text-[var(--ink)] selection:bg-[var(--accent)]/20">
      {/* HERO SECTION */}
      <section className="w-full border-b border-[var(--line)] relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(var(--ink) 1px, transparent 1px), linear-gradient(90deg, var(--ink) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
          aria-hidden="true"
        />
        <div className="max-w-3xl mx-auto px-4 sm:px-8 pt-32 pb-20 sm:pt-40 sm:pb-28 relative z-10 text-center">
          <span className="inline-block px-3 py-1 mb-6 rounded text-xs font-bold uppercase tracking-[0.2em] bg-[var(--ink)] text-[var(--surface)]">
            The Manifesto
          </span>
          <h1 className="font-[family:var(--f-display)] text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-[var(--ink)]">
            Our Editorial Standards
          </h1>
          <p className="mt-8 text-lg sm:text-xl font-[family:var(--f-body)] text-[var(--muted)] leading-relaxed">
            Truth, transparency, and deep technical accuracy.
          </p>
        </div>
      </section>

      {/* CORE PRINCIPLES CONTENT */}
      <section className="w-full py-16 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 flex flex-col space-y-16">
          
          {/* Principle 1 */}
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
            <div className="shrink-0 mt-1">
              <div className="w-12 h-12 rounded-lg bg-[var(--surface-2)] border border-[var(--line)] flex items-center justify-center text-[var(--accent)]">
                <Scale className="w-6 h-6" />
              </div>
            </div>
            <div>
              <h2 className="font-[family:var(--f-display)] text-2xl font-bold text-[var(--ink)] mb-4">
                Uncompromised Objectivity
              </h2>
              <div className="font-[family:var(--f-body)] text-[var(--muted)] leading-relaxed space-y-4">
                <p>
                  We report the facts. Our editorial process is entirely shielded from corporate influence, advertising partnerships, or investor pressures.
                </p>
                <p>
                  If a major tech conglomerate makes a misstep, we cover it critically and fairly. Our loyalty lies exclusively with our readers—to provide them with accurate, noise-free analysis so they can form their own conclusions.
                </p>
              </div>
            </div>
          </div>

          <hr className="border-[var(--line)]" />

          {/* Principle 2 */}
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
            <div className="shrink-0 mt-1">
              <div className="w-12 h-12 rounded-lg bg-[var(--surface-2)] border border-[var(--line)] flex items-center justify-center text-[var(--accent)]">
                <UserCheck className="w-6 h-6" />
              </div>
            </div>
            <div>
              <h2 className="font-[family:var(--f-display)] text-2xl font-bold text-[var(--ink)] mb-4">
                Sourcing &amp; Anonymous Tips
              </h2>
              <div className="font-[family:var(--f-body)] text-[var(--muted)] leading-relaxed space-y-4">
                <p>
                  We aggressively verify leaks and protect our whistleblowers. We grant anonymity to sources only when their physical, financial, or professional safety is at risk, and only when the information they provide is highly newsworthy and verifiable.
                </p>
                <p>
                  For highly sensitive information, our newsroom utilizes secure channels like PGP encryption and SecureDrop to ensure the identities of our sources are protected from end to end.
                </p>
              </div>
            </div>
          </div>

          <hr className="border-[var(--line)]" />

          {/* Principle 3 */}
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
            <div className="shrink-0 mt-1">
              <div className="w-12 h-12 rounded-lg bg-[var(--surface-2)] border border-[var(--line)] flex items-center justify-center text-[var(--accent)]">
                <LaptopMinimal className="w-6 h-6" />
              </div>
            </div>
            <div>
              <h2 className="font-[family:var(--f-display)] text-2xl font-bold text-[var(--ink)] mb-4">
                Review Ethics
              </h2>
              <div className="font-[family:var(--f-body)] text-[var(--muted)] leading-relaxed space-y-4">
                <p>
                  Gadgets and software are reviewed honestly. We do not do paid positive reviews or "sponsored reviews" disguised as editorial content. 
                </p>
                <p>
                  Hardware sent to us by manufacturers is either returned after the review period or kept purely in a secure editorial vault for future benchmark comparisons. We never sell review units, and accepting a review unit never guarantees coverage—let alone positive coverage.
                </p>
              </div>
            </div>
          </div>

          <hr className="border-[var(--line)]" />

          {/* Principle 4 */}
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
            <div className="shrink-0 mt-1">
              <div className="w-12 h-12 rounded-lg bg-[var(--surface-2)] border border-[var(--line)] flex items-center justify-center text-[var(--accent)]">
                <Quote className="w-6 h-6" />
              </div>
            </div>
            <div>
              <h2 className="font-[family:var(--f-display)] text-2xl font-bold text-[var(--ink)] mb-4">
                Plagiarism &amp; Attribution
              </h2>
              <div className="font-[family:var(--f-body)] text-[var(--muted)] leading-relaxed space-y-4">
                <p>
                  We maintain a strict zero-tolerance policy for plagiarism. We always credit original reporting and aim to link directly to the primary source whenever we are building upon another publication's breaking news.
                </p>
                <p>
                  Our goal is to elevate the technology journalism ecosystem, and that starts with respecting the hard work of our peers.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* BACK TO CONTACT CTA */}
      <section className="w-full py-16 sm:py-24 border-t border-[var(--line)] text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 flex flex-col items-center">
          <p className="font-[family:var(--f-body)] text-[var(--muted)] mb-8 max-w-lg">
            Have questions about our standards or need to reach our editorial team?
          </p>
          <Link 
            href="/page/contact"
            className="py-3 px-6 bg-[var(--accent)] hover:opacity-90 text-white font-[family:var(--f-ui)] font-bold rounded-lg inline-flex items-center justify-center transition-all shadow-sm"
          >
            Return to Contact Desk
          </Link>
        </div>
      </section>
    </div>
  );
}

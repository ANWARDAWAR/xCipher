"use client";

import React, { useState } from "react";
import { FileWarning, CheckCircle2, AlertOctagon, RefreshCw } from "lucide-react";

export default function CorrectionsPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    url: "",
    description: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder for actual submission logic
    alert("Correction report submitted successfully.");
    setFormData({ name: "", email: "", url: "", description: "" });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-[var(--surface)] min-h-screen">
      {/* HEADER HERO */}
      <header className="border-b border-[var(--line)] bg-[var(--surface-2)]">
        <div className="max-w-7xl mx-auto px-4 pt-32 pb-16 sm:pt-40 sm:px-8 lg:pt-44 lg:px-12">
          <div className="max-w-3xl">
            <span className="text-[var(--accent)] font-bold text-xs uppercase tracking-widest mb-3 block">
              Editorial Accountability
            </span>
            <h1 className="font-[family:var(--f-display)] text-4xl sm:text-5xl font-bold mb-4 text-[var(--ink)] tracking-tight">
              Corrections Policy
            </h1>
            <p className="font-[family:var(--f-body)] text-lg text-[var(--muted)] leading-relaxed">
              We are fiercely committed to fixing our mistakes openly. If we publish an error, we correct it as quickly as possible and ensure transparency with our readers.
            </p>
            <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-[var(--faint)]">
              <span className="w-2 h-2 rounded-full bg-[var(--accent)]"></span>
              Last Updated: September 19, 2026
            </div>
          </div>
        </div>
      </header>

      {/* CONTENT & FORM SECTION */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-8 lg:px-12 flex flex-col lg:flex-row gap-12 lg:gap-16 items-start">
        
        {/* Left Column: Detailed Policy (Scrollable) */}
        <article className="lg:w-7/12 text-[var(--ink)] space-y-12">
          
          <section>
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle2 className="w-6 h-6 text-[var(--accent)]" />
              <h2 className="font-[family:var(--f-display)] text-2xl sm:text-3xl font-bold text-[var(--ink)]">
                Our Commitment to Accuracy
              </h2>
            </div>
            <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-[var(--muted)] font-[family:var(--f-body)]">
              <p className="mb-4">
                At xSypher, accuracy is the bedrock of our journalism. Our reporters and editors work tirelessly to verify facts, cross-reference technical claims, and authenticate documents before publication. However, in the fast-paced environment of technical reporting, mistakes can occasionally slip through. 
              </p>
              <p>
                When they do, we do not hide them. We believe that acknowledging and correcting errors is the only way to build and maintain trust with our highly technical audience.
              </p>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-6">
              <RefreshCw className="w-6 h-6 text-[var(--accent)]" />
              <h2 className="font-[family:var(--f-display)] text-2xl sm:text-3xl font-bold text-[var(--ink)]">
                The Correction Process
              </h2>
            </div>
            <div className="text-[var(--muted)] font-[family:var(--f-body)] leading-relaxed space-y-6">
              <div className="p-5 border border-l-4 border-[var(--line)] border-l-[var(--accent)] rounded-r-xl bg-[var(--surface-2)]">
                <h4 className="font-bold text-[var(--ink)] mb-2 text-lg">Substantive Errors</h4>
                <p className="text-sm">
                  If a factual error significantly alters the context, meaning, or technical accuracy of an article, we will immediately update the text. A clear, timestamped <strong>Correction Note</strong> will be appended to the bottom of the article explaining exactly what was changed and why.
                </p>
              </div>
              <div className="p-5 border border-l-4 border-[var(--line)] border-l-[var(--muted)] rounded-r-xl bg-[var(--surface-2)]">
                <h4 className="font-bold text-[var(--ink)] mb-2 text-lg">Typographical & Minor Errors</h4>
                <p className="text-sm">
                  For minor typos, grammatical mistakes, or broken links that do not impact the factual integrity or technical claims of the story, we will update the text silently without appending a formal correction note.
                </p>
              </div>
            </div>
          </section>

          <section className="pb-12 border-b border-[var(--line)] lg:border-none">
            <div className="flex items-center gap-3 mb-6">
              <AlertOctagon className="w-6 h-6 text-[var(--accent)]" />
              <h2 className="font-[family:var(--f-display)] text-2xl sm:text-3xl font-bold text-[var(--ink)]">
                Retractions & Editor's Notes
              </h2>
            </div>
            <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-[var(--muted)] font-[family:var(--f-body)]">
              <p className="mb-4">
                In rare cases where an article is fundamentally flawed, based on fabricated information, or violates our core editorial standards, the piece may be retracted. A retraction will completely replace the article text with a detailed explanation of why the story was pulled.
              </p>
              <p>
                An <strong>Editor's Note</strong> may be used when an article requires significant contextual updates, clarifications, or apologies that go beyond a simple factual correction. These notes are placed at the very top of the article for maximum visibility.
              </p>
            </div>
          </section>

        </article>

        {/* Right Column: Sticky Report Form */}
        <aside className="lg:w-5/12 w-full lg:sticky lg:top-24">
          <div className="bg-[var(--surface-2)] border border-[var(--line)] rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 shrink-0 rounded-xl bg-[var(--surface)] border border-[var(--line)] flex items-center justify-center text-[var(--accent)] shadow-sm">
                <FileWarning className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-[family:var(--f-display)] text-2xl font-bold text-[var(--ink)]">
                  Report an Error
                </h2>
                <p className="text-[var(--muted)] font-[family:var(--f-body)] text-sm mt-1">
                  Found a mistake? Let our editorial desk know immediately.
                </p>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5 font-[family:var(--f-body)]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="name" className="block text-xs font-semibold text-[var(--ink)] uppercase tracking-wider mb-1">Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-xl px-4 py-3 text-[var(--ink)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/30 transition-all text-sm shadow-sm"
                    placeholder="Jane Doe"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-xs font-semibold text-[var(--ink)] uppercase tracking-wider mb-1">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-xl px-4 py-3 text-[var(--ink)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/30 transition-all text-sm shadow-sm"
                    placeholder="jane@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="url" className="block text-xs font-semibold text-[var(--ink)] uppercase tracking-wider mb-1">Article URL <span className="text-[var(--accent)]">*</span></label>
                <input
                  type="url"
                  id="url"
                  name="url"
                  value={formData.url}
                  onChange={handleChange}
                  required
                  className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-xl px-4 py-3 text-[var(--ink)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/30 transition-all text-sm shadow-sm"
                  placeholder="https://xsypher.com/article/..."
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-xs font-semibold text-[var(--ink)] uppercase tracking-wider mb-1">Description of Error <span className="text-[var(--accent)]">*</span></label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-xl px-4 py-3 text-[var(--ink)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/30 transition-all resize-y text-sm shadow-sm"
                  placeholder="Please describe what is factually incorrect..."
                ></textarea>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="group relative w-full overflow-hidden py-4 px-8 !bg-[var(--accent)] dark:!bg-[var(--accent)] !text-white dark:!text-white font-[family:var(--f-ui)] font-bold tracking-wide rounded-xl flex items-center justify-center transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Submit Report
                    <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </span>
                  <div className="absolute inset-0 -translate-x-[150%] bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out z-0"></div>
                </button>
              </div>
            </form>
          </div>
        </aside>

      </div>
    </div>
  );
}

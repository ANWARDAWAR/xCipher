"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Mail,
  Send,
  MessageSquare,
  Briefcase,
  Bug,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Lock,
  Clock,
  HelpCircle,
  Sparkles,
  FileText
} from "lucide-react";

export default function ContactPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("editorial");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !message.trim()) return;

    setIsSubmitting(true);
    // Simulate immediate client submission handling
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 600);
  };

  const handleReset = () => {
    setFullName("");
    setEmail("");
    setDepartment("editorial");
    setMessage("");
    setIsSubmitted(false);
  };

  return (
    <div className="w-full bg-[var(--paper)] text-[var(--ink)] min-h-screen">
      {/* ─────────────────────────────────────────────────────────────
          1. HERO SECTION
          ───────────────────────────────────────────────────────────── */}
      <section className="relative w-full border-b border-[var(--line)] bg-[var(--surface)] overflow-hidden">
        {/* Subtle decorative background grid */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(var(--ink) 1px, transparent 1px), linear-gradient(90deg, var(--ink) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
          aria-hidden="true"
        />

        {/* Ambient subtle glow */}
        <div
          className="absolute -top-28 -right-28 w-80 h-80 rounded-full bg-[var(--accent)] opacity-10 blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 pt-32 pb-14 sm:pt-40 sm:pb-20 relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/20">
              <Sparkles className="w-3.5 h-3.5" />
              Direct Communication Channel
            </span>
          </div>

          <h1 className="font-[family:var(--f-display)] text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[var(--ink)] leading-tight">
            Get in <span className="text-[var(--accent)]">Touch</span>.
          </h1>

          <p className="mt-4 text-base sm:text-lg lg:text-xl text-[var(--muted)] font-[family:var(--f-body)] max-w-2xl leading-relaxed">
            Have a breaking security vulnerability, investigative tip, PR inquiry, or technical feedback? The xSypher newsroom and engineering desks are listening.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-6 text-xs sm:text-sm text-[var(--muted)] font-[family:var(--f-ui)]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[var(--accent)]" />
              <span>Editorial Tip Response: &lt; 4 hours</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-[var(--accent)]" />
              <span>Encrypted Source Anonymity Protected</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. MAIN CONTENT: CONTACT METHODS + FORM (SIDE-BY-SIDE ON LG)
          ───────────────────────────────────────────────────────────── */}
      <section className="w-full py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

            {/* LEFT COLUMN: CONTACT METHODS GRID (5 COLS ON LG) */}
            <div className="lg:col-span-5 flex flex-col gap-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[var(--accent)] block mb-1">
                  Department Directory
                </span>
                <h2 className="font-[family:var(--f-display)] text-xl sm:text-2xl font-bold text-[var(--ink)]">
                  Reach the Right Desk
                </h2>
                <p className="text-xs sm:text-sm text-[var(--muted)] font-[family:var(--f-body)] mt-1 mb-6">
                  Select a department below to ensure your message lands with the dedicated editor or engineer.
                </p>
              </div>

              {/* Method 1: Editorial & Tips */}
              <div className="group p-5 sm:p-6 rounded-2xl bg-[var(--surface)] border border-[var(--line)] hover:border-[var(--accent)] transition-all duration-200 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] group-hover:border-[var(--accent)]/40 flex items-center justify-center text-[var(--accent)] shrink-0 transition-colors">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-[family:var(--f-display)] text-base font-bold text-[var(--ink)]">
                      Editorial &amp; News Tips
                    </h3>
                    <p className="text-xs sm:text-sm text-[var(--muted)] font-[family:var(--f-body)] mt-1 mb-2 leading-relaxed">
                      For article pitches, security disclosures, zero-day research, and confidential leaks.
                    </p>
                    <a
                      href="mailto:editor@xsypher.com"
                      className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[var(--accent)] hover:underline break-all"
                    >
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      editor@xsypher.com
                    </a>
                  </div>
                </div>
              </div>

              {/* Method 2: Partnerships & PR */}
              <div className="group p-5 sm:p-6 rounded-2xl bg-[var(--surface)] border border-[var(--line)] hover:border-[var(--accent)] transition-all duration-200 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] group-hover:border-[var(--accent)]/40 flex items-center justify-center text-[var(--accent)] shrink-0 transition-colors">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-[family:var(--f-display)] text-base font-bold text-[var(--ink)]">
                      Partnerships &amp; PR
                    </h3>
                    <p className="text-xs sm:text-sm text-[var(--muted)] font-[family:var(--f-body)] mt-1 mb-2 leading-relaxed">
                      For corporate press releases, media syndication, and conference appearances.
                    </p>
                    <a
                      href="mailto:press@xsypher.com"
                      className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[var(--accent)] hover:underline break-all"
                    >
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      press@xsypher.com
                    </a>
                  </div>
                </div>
              </div>

              {/* Method 3: Technical Support */}
              <div className="group p-5 sm:p-6 rounded-2xl bg-[var(--surface)] border border-[var(--line)] hover:border-[var(--accent)] transition-all duration-200 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] group-hover:border-[var(--accent)]/40 flex items-center justify-center text-[var(--accent)] shrink-0 transition-colors">
                    <Bug className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-[family:var(--f-display)] text-base font-bold text-[var(--ink)]">
                      Technical Support &amp; Bugs
                    </h3>
                    <p className="text-xs sm:text-sm text-[var(--muted)] font-[family:var(--f-body)] mt-1 mb-2 leading-relaxed">
                      Encountered broken layout, RSS feed failures, or platform bugs? Notify our web engineering team.
                    </p>
                    <a
                      href="mailto:support@xsypher.com"
                      className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[var(--accent)] hover:underline break-all"
                    >
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      support@xsypher.com
                    </a>
                  </div>
                </div>
              </div>

              {/* Method 4: Secure Drop Note */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[var(--surface-2)] border border-[var(--line)] flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[var(--accent)] shrink-0 mt-0.5" />
                <div className="text-xs text-[var(--muted)] font-[family:var(--f-body)] leading-relaxed">
                  <strong className="text-[var(--ink)] block mb-0.5">Whistleblower &amp; Source Security:</strong>
                  Need end-to-end cryptographic protection? Encrypted PGP public keys and SecureDrop details are available upon request via our editorial desk.
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: CONTACT FORM (7 COLS ON LG) */}
            <div className="lg:col-span-7">
              <div className="rounded-2xl bg-[var(--surface)] border border-[var(--line)] p-6 sm:p-8 lg:p-10 shadow-md relative">

                {isSubmitted ? (
                  /* Form Submission Confirmation State */
                  <div className="text-center py-10 px-4">
                    <div className="w-16 h-16 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/20 flex items-center justify-center mx-auto mb-5 shadow-sm">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h3 className="font-[family:var(--f-display)] text-2xl font-bold text-[var(--ink)]">
                      Message Dispatched
                    </h3>
                    <p className="mt-2 text-sm sm:text-base text-[var(--muted)] font-[family:var(--f-body)] max-w-md mx-auto leading-relaxed">
                      Thank you, <span className="font-semibold text-[var(--ink)]">{fullName}</span>. Your transmission has been queued for review by our {department} desk. We will respond to <span className="font-semibold text-[var(--ink)]">{email}</span> shortly.
                    </p>

                    <div className="mt-8">
                      <button
                        type="button"
                        onClick={handleReset}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-[var(--ink)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--line)] transition-colors"
                      >
                        Send Another Inquiry
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Active Form Layout */
                  <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent)] block mb-1">
                        Direct Transmission
                      </span>
                      <h2 className="font-[family:var(--f-display)] text-xl sm:text-2xl font-bold text-[var(--ink)]">
                        Send a Message
                      </h2>
                      <p className="text-xs sm:text-sm text-[var(--muted)] font-[family:var(--f-body)] mt-1">
                        Fill out the details below. We prioritize verified tips and structured inquiries.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-2">
                      {/* Full Name */}
                      <div className="flex flex-col gap-2">
                        <label
                          htmlFor="fullName"
                          className="text-xs font-semibold text-[var(--ink)] uppercase tracking-wider"
                        >
                          Full Name <span className="text-[var(--accent)]">*</span>
                        </label>
                        <input
                          id="fullName"
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Ahmad Khan"
                          className="w-full px-4 py-3 rounded-xl bg-[var(--surface-2)] text-[var(--ink)] border border-[var(--line)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/30 transition-colors font-[family:var(--f-body)] text-sm sm:text-base placeholder:text-[var(--faint)]"
                        />
                      </div>

                      {/* Email Address */}
                      <div className="flex flex-col gap-2">
                        <label
                          htmlFor="email"
                          className="text-xs font-semibold text-[var(--ink)] uppercase tracking-wider"
                        >
                          Email Address <span className="text-[var(--accent)]">*</span>
                        </label>
                        <input
                          id="email"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="ahmad@example.com"
                          className="w-full px-4 py-3 rounded-xl bg-[var(--surface-2)] text-[var(--ink)] border border-[var(--line)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/30 transition-colors font-[family:var(--f-body)] text-sm sm:text-base placeholder:text-[var(--faint)]"
                        />
                      </div>
                    </div>

                    {/* Department / Subject Dropdown */}
                    <div className="flex flex-col gap-2">
                      <label
                        htmlFor="department"
                        className="text-xs font-semibold text-[var(--ink)] uppercase tracking-wider"
                      >
                        Department / Subject <span className="text-[var(--accent)]">*</span>
                      </label>
                      <select
                        id="department"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-[var(--surface-2)] text-[var(--ink)] border border-[var(--line)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/30 transition-colors font-[family:var(--f-body)] text-sm sm:text-base cursor-pointer"
                      >
                        <option value="editorial">Editorial Desk &amp; News Tips</option>
                        <option value="partnerships">Partnerships, Press &amp; PR</option>
                        <option value="support">Technical Support &amp; Bug Report</option>
                        <option value="general">General Inquiries &amp; Feedback</option>
                      </select>
                    </div>

                    {/* Message Area */}
                    <div className="flex flex-col gap-2">
                      <label
                        htmlFor="message"
                        className="text-xs font-semibold text-[var(--ink)] uppercase tracking-wider"
                      >
                        Message <span className="text-[var(--accent)]">*</span>
                      </label>
                      <textarea
                        id="message"
                        required
                        rows={5}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Provide relevant details, CVE references, reproduction steps, or context..."
                        className="w-full px-4 py-3 rounded-xl bg-[var(--surface-2)] text-[var(--ink)] border border-[var(--line)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/30 transition-colors font-[family:var(--f-body)] text-sm sm:text-base placeholder:text-[var(--faint)] resize-y"
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="group relative w-full md:w-auto overflow-hidden py-4 px-8 !bg-[var(--accent)] dark:!bg-[var(--accent)] !text-white dark:!text-white font-[family:var(--f-ui)] font-bold tracking-wide rounded-lg flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-[var(--accent)]/20 hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-lg"
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        {isSubmitting ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Dispatching Transmission...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                            <span>Transmit Message</span>
                          </>
                        )}
                      </span>
                      {/* Shine effect on hover */}
                      {!isSubmitting && (
                        <div className="absolute inset-0 -translate-x-[150%] bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out z-0"></div>
                      )}
                    </button>

                    <p className="text-[11px] text-[var(--faint)] text-center font-[family:var(--f-ui)] mt-1">
                      By submitting this form, you acknowledge that communications comply with our editorial standards.
                    </p>
                  </form>
                )}

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. FAQ / QUICK LINKS SECTION
          ───────────────────────────────────────────────────────────── */}
      <section className="w-full py-12 sm:py-16 border-t border-[var(--line)] bg-[var(--surface)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--accent)] block mb-1">
                Transparency &amp; Resources
              </span>
              <h2 className="font-[family:var(--f-display)] text-xl sm:text-2xl font-bold text-[var(--ink)]">
                Frequently Needed Links &amp; Policies
              </h2>
            </div>
            <Link
              href="/page/about"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[var(--accent)] hover:underline"
            >
              Explore our full Story
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">

            {/* Link 1: About Us */}
            <Link
              href="/page/about"
              className="p-5 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] hover:border-[var(--accent)] transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-[var(--surface)] border border-[var(--line)] flex items-center justify-center text-[var(--accent)] mb-3">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <h3 className="font-[family:var(--f-display)] text-sm font-bold text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors">
                  About xSypher
                </h3>
                <p className="text-xs text-[var(--muted)] font-[family:var(--f-body)] mt-1">
                  Learn about our mission, core pillars, and editorial staff led by Ahmad Khan.
                </p>
              </div>
              <span className="mt-4 text-xs font-semibold text-[var(--accent)] inline-flex items-center gap-1">
                Read About Us &rarr;
              </span>
            </Link>

            {/* Link 2: Editorial Policy */}
            <Link
              href="/page/editorial-standards"
              className="p-5 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] hover:border-[var(--accent)] transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-[var(--surface)] border border-[var(--line)] flex items-center justify-center text-[var(--accent)] mb-3">
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className="font-[family:var(--f-display)] text-sm font-bold text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors">
                  Editorial Standards
                </h3>
                <p className="text-xs text-[var(--muted)] font-[family:var(--f-body)] mt-1">
                  Our verification pipeline, source protection protocols, and ethics codes.
                </p>
              </div>
              <span className="mt-4 text-xs font-semibold text-[var(--accent)] inline-flex items-center gap-1">
                View Policy &rarr;
              </span>
            </Link>

            {/* Link 3: Corrections */}
            <Link
              href="/page/corrections"
              className="p-5 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] hover:border-[var(--accent)] transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-[var(--surface)] border border-[var(--line)] flex items-center justify-center text-[var(--accent)] mb-3">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="font-[family:var(--f-display)] text-sm font-bold text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors">
                  Corrections Policy
                </h3>
                <p className="text-xs text-[var(--muted)] font-[family:var(--f-body)] mt-1">
                  How we visibly and promptly rectify errors in reporting and technical analyses.
                </p>
              </div>
              <span className="mt-4 text-xs font-semibold text-[var(--accent)] inline-flex items-center gap-1">
                View Standards &rarr;
              </span>
            </Link>

            {/* Link 4: Privacy Policy */}
            <Link
              href="/page/privacy-policy"
              className="p-5 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] hover:border-[var(--accent)] transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-[var(--surface)] border border-[var(--line)] flex items-center justify-center text-[var(--accent)] mb-3">
                  <Lock className="w-4 h-4" />
                </div>
                <h3 className="font-[family:var(--f-display)] text-sm font-bold text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors">
                  Privacy &amp; Data
                </h3>
                <p className="text-xs text-[var(--muted)] font-[family:var(--f-body)] mt-1">
                  Our strict zero-tracker philosophy, cookie policy, and reader telemetry rules.
                </p>
              </div>
              <span className="mt-4 text-xs font-semibold text-[var(--accent)] inline-flex items-center gap-1">
                Read Privacy &rarr;
              </span>
            </Link>

          </div>
        </div>
      </section>
    </div>
  );
}

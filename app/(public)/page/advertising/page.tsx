"use client";

import React, { useState } from "react";
import { Users, Mail, TrendingUp, MonitorSmartphone, MailOpen, PenTool } from "lucide-react";

export default function AdvertisingPage() {
  const [formData, setFormData] = useState({
    companyName: "",
    contactPerson: "",
    email: "",
    budget: "",
    details: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Partnership inquiry submitted successfully.");
    setFormData({ companyName: "", contactPerson: "", email: "", budget: "", details: "" });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="w-full min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      {/* HERO SECTION */}
      <section className="w-full border-b border-[var(--line)] bg-[var(--surface)] relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(var(--ink) 1px, transparent 1px), linear-gradient(90deg, var(--ink) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
          aria-hidden="true"
        />
        <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-32 pb-20 sm:pt-40 sm:pb-28 relative z-10 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 mb-6">
            Grow With Us
          </span>
          <h1 className="font-[family:var(--f-display)] text-4xl sm:text-6xl font-extrabold tracking-tight text-[var(--ink)] leading-tight max-w-4xl mx-auto">
            Partner with xSypher
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-[var(--muted)] font-[family:var(--f-body)] leading-relaxed max-w-2xl mx-auto">
            Reach a highly engaged, premium audience of tech enthusiasts, developers, and industry leaders who shape the future of technology.
          </p>
        </div>
      </section>

      {/* STATS GRID SECTION */}
      <section className="w-full py-16 sm:py-24 border-b border-[var(--line)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <div className="text-center mb-12">
            <h2 className="font-[family:var(--f-display)] text-3xl font-bold text-[var(--ink)]">
              Why Advertise With Us?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Stat Card 1 */}
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-8 flex flex-col items-center text-center shadow-sm hover:shadow-md hover:-translate-y-1 transition-transform duration-300">
              <div className="w-14 h-14 rounded-full bg-[var(--surface-2)] border border-[var(--line)] flex items-center justify-center text-[var(--accent)] mb-6">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="font-[family:var(--f-display)] text-4xl font-extrabold text-[var(--ink)] mb-2">1M+</h3>
              <p className="font-[family:var(--f-body)] text-[var(--muted)] font-medium">Monthly Readers</p>
            </div>

            {/* Stat Card 2 */}
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-8 flex flex-col items-center text-center shadow-sm hover:shadow-md hover:-translate-y-1 transition-transform duration-300">
              <div className="w-14 h-14 rounded-full bg-[var(--surface-2)] border border-[var(--line)] flex items-center justify-center text-[var(--accent)] mb-6">
                <Mail className="w-7 h-7" />
              </div>
              <h3 className="font-[family:var(--f-display)] text-4xl font-extrabold text-[var(--ink)] mb-2">250k</h3>
              <p className="font-[family:var(--f-body)] text-[var(--muted)] font-medium">Newsletter Audience</p>
            </div>

            {/* Stat Card 3 */}
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-8 flex flex-col items-center text-center shadow-sm hover:shadow-md hover:-translate-y-1 transition-transform duration-300">
              <div className="w-14 h-14 rounded-full bg-[var(--surface-2)] border border-[var(--line)] flex items-center justify-center text-[var(--accent)] mb-6">
                <TrendingUp className="w-7 h-7" />
              </div>
              <h3 className="font-[family:var(--f-display)] text-4xl font-extrabold text-[var(--ink)] mb-2">80%</h3>
              <p className="font-[family:var(--f-body)] text-[var(--muted)] font-medium">Tech Professionals</p>
            </div>
          </div>
        </div>
      </section>

      {/* FORMATS & CONTACT FORM SECTION */}
      <section className="w-full py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

            {/* Left Column: Ad Formats */}
            <div className="flex flex-col space-y-10">
              <div>
                <h2 className="font-[family:var(--f-display)] text-3xl font-bold text-[var(--ink)] mb-6">
                  Our Ad Formats
                </h2>
                <p className="font-[family:var(--f-body)] text-[var(--muted)] text-lg mb-8">
                  We offer premium, native-feeling integrations that respect our readers while delivering exceptional ROI for our partners.
                </p>
              </div>

              <div className="space-y-6">
                {/* Format 1 */}
                <div className="flex gap-4">
                  <div className="w-12 h-12 shrink-0 rounded-xl bg-[var(--surface)] border border-[var(--line)] flex items-center justify-center text-[var(--accent)]">
                    <MonitorSmartphone className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-[family:var(--f-display)] text-lg font-bold text-[var(--ink)] mb-1">Display Ads</h4>
                    <p className="font-[family:var(--f-body)] text-[var(--muted)]">Clean, non-intrusive high-impact banners across desktop and mobile viewing experiences.</p>
                  </div>
                </div>

                {/* Format 2 */}
                <div className="flex gap-4">
                  <div className="w-12 h-12 shrink-0 rounded-xl bg-[var(--surface)] border border-[var(--line)] flex items-center justify-center text-[var(--accent)]">
                    <MailOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-[family:var(--f-display)] text-lg font-bold text-[var(--ink)] mb-1">Newsletter Sponsorships</h4>
                    <p className="font-[family:var(--f-body)] text-[var(--muted)]">Direct to inbox placement in our highly engaged daily and weekly technology briefings.</p>
                  </div>
                </div>

                {/* Format 3 */}
                <div className="flex gap-4">
                  <div className="w-12 h-12 shrink-0 rounded-xl bg-[var(--surface)] border border-[var(--line)] flex items-center justify-center text-[var(--accent)]">
                    <PenTool className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-[family:var(--f-display)] text-lg font-bold text-[var(--ink)] mb-1">Sponsored Content</h4>
                    <p className="font-[family:var(--f-body)] text-[var(--muted)]">Clearly labeled, high-quality native articles crafted in collaboration with our brand studio.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Partnership Form */}
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-8 sm:p-10 shadow-lg">
              <h3 className="font-[family:var(--f-display)] text-2xl font-bold text-[var(--ink)] mb-2">
                Partnership Inquiry
              </h3>
              <p className="font-[family:var(--f-body)] text-[var(--muted)] mb-8 text-sm">
                Fill out the form below and our partnerships team will reach out within 24 hours.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5 font-[family:var(--f-body)]">

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="companyName" className="block text-sm font-semibold text-[var(--ink)] mb-1">Company Name <span className="text-[var(--accent)]">*</span></label>
                    <input
                      type="text"
                      id="companyName"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      required
                      className="w-full bg-[var(--surface-2)] border border-[var(--line)] rounded-lg px-4 py-3 text-[var(--ink)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/30 transition-all"
                      placeholder="Acme Corp"
                    />
                  </div>
                  <div>
                    <label htmlFor="contactPerson" className="block text-sm font-semibold text-[var(--ink)] mb-1">Contact Person <span className="text-[var(--accent)]">*</span></label>
                    <input
                      type="text"
                      id="contactPerson"
                      name="contactPerson"
                      value={formData.contactPerson}
                      onChange={handleChange}
                      required
                      className="w-full bg-[var(--surface-2)] border border-[var(--line)] rounded-lg px-4 py-3 text-[var(--ink)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/30 transition-all"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-[var(--ink)] mb-1">Work Email <span className="text-[var(--accent)]">*</span></label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full bg-[var(--surface-2)] border border-[var(--line)] rounded-lg px-4 py-3 text-[var(--ink)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/30 transition-all"
                    placeholder="john@acmecorp.com"
                  />
                </div>

                <div>
                  <label htmlFor="budget" className="block text-sm font-semibold text-[var(--ink)] mb-1">Budget Range <span className="text-[var(--accent)]">*</span></label>
                  <div className="relative">
                    <select
                      id="budget"
                      name="budget"
                      value={formData.budget}
                      onChange={handleChange}
                      required
                      className="w-full bg-[var(--surface-2)] border border-[var(--line)] rounded-lg px-4 py-3 text-[var(--ink)] appearance-none focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/30 transition-all cursor-pointer"
                    >
                      <option value="" disabled>Select a budget range...</option>
                      <option value="5k-10k">$5,000 - $10,000</option>
                      <option value="10k-25k">$10,000 - $25,000</option>
                      <option value="25k-50k">$25,000 - $50,000</option>
                      <option value="50k+">$50,000+</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-[var(--muted)]">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="details" className="block text-sm font-semibold text-[var(--ink)] mb-1">Campaign Details</label>
                  <textarea
                    id="details"
                    name="details"
                    value={formData.details}
                    onChange={handleChange}
                    rows={4}
                    className="w-full bg-[var(--surface-2)] border border-[var(--line)] rounded-lg px-4 py-3 text-[var(--ink)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/30 transition-all resize-none"
                    placeholder="Tell us about your goals, target audience, and preferred timeline..."
                  ></textarea>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="group relative w-full md:w-auto overflow-hidden py-4 px-8 !bg-[var(--accent)] dark:!bg-[var(--accent)] !text-white dark:!text-white font-[family:var(--f-ui)] font-bold tracking-wide rounded-lg flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-[var(--accent)]/20 hover:-translate-y-0.5"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Submit Inquiry
                      <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </span>
                    {/* Shine effect on hover */}
                    <div className="absolute inset-0 -translate-x-[150%] bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out z-0"></div>
                  </button>
                </div>

              </form>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}

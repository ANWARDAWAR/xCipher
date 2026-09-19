import { Metadata } from "next";
import Link from "next/link";
import { Layers, ArrowRight, Server, Shield, Brain } from "lucide-react";

export const metadata: Metadata = {
  title: "Series & Collections | xSypher",
  description: "Deep-dive technical guides, investigative series, and editorial collections.",
};

const collections = [
  {
    title: "The Linux Kernel Defense Guide",
    description: "A comprehensive teardown of modern kernel-level exploitation and mitigation techniques, from eBPF monitoring to memory safety.",
    parts: "5-Part Series",
    icon: Server,
    href: "/category/cybersecurity",
    status: "Completed",
  },
  {
    title: "LLM Prompt Injection Masterclass",
    description: "Analyzing the anatomy of language model attacks, bypasses, and red-teaming methodologies for production AI systems.",
    parts: "3-Part Series",
    icon: Brain,
    href: "/category/ai",
    status: "Ongoing",
  },
  {
    title: "Zero-Day Exploits Uncovered",
    description: "Investigating the most sophisticated zero-day chains deployed in the wild over the last decade, and the threat actors behind them.",
    parts: "4-Part Series",
    icon: Shield,
    href: "/category/cybersecurity",
    status: "Upcoming",
  },
];

export default function SeriesHub() {
  return (
    <div className="w-full bg-[var(--paper)] text-[var(--ink)] min-h-screen">
      {/* HERO SECTION */}
      <section className="relative w-full border-b border-[var(--line)] bg-[var(--surface)] overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(var(--ink) 1px, transparent 1px), linear-gradient(90deg, var(--ink) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
          aria-hidden="true"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 pt-32 pb-14 sm:pt-40 sm:pb-20 relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm text-xs font-bold uppercase tracking-widest bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/20">
              <Layers className="w-3.5 h-3.5" />
              Editorial Hub
            </span>
          </div>

          <h1 className="font-[family:var(--f-display)] text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[var(--ink)] leading-tight">
            Series &amp; <span className="text-[var(--accent)]">Collections</span>
          </h1>

          <p className="mt-4 text-base sm:text-lg lg:text-xl text-[var(--muted)] font-[family:var(--f-body)] max-w-2xl leading-relaxed">
            Multi-part investigations, deep-dive technical guides, and curated reporting tracks from the xSypher newsroom.
          </p>
        </div>
      </section>

      {/* COLLECTIONS GRID */}
      <section className="w-full py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {collections.map((collection, idx) => {
              const Icon = collection.icon;
              return (
                <div key={idx} className="flex flex-col h-full bg-[var(--surface-2)] border border-[var(--line)] rounded-sm overflow-hidden group hover:border-[var(--accent)] transition-colors">
                  {/* Card Header Strip */}
                  <div className="px-5 py-3 border-b border-[var(--line)] bg-[var(--surface)] flex justify-between items-center">
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[var(--accent)]">
                      {collection.parts}
                    </span>
                    <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                      {collection.status}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 sm:p-8 flex flex-col flex-1">
                    <div className="w-12 h-12 rounded-sm bg-[var(--surface)] border border-[var(--line)] flex items-center justify-center text-[var(--ink)] mb-6 group-hover:text-[var(--accent)] transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    
                    <h3 className="font-[family:var(--f-display)] text-xl font-bold text-[var(--ink)] mb-3 leading-snug group-hover:text-[var(--accent)] transition-colors">
                      {collection.title}
                    </h3>
                    
                    <p className="text-sm text-[var(--muted)] font-[family:var(--f-body)] leading-relaxed flex-1 mb-6">
                      {collection.description}
                    </p>
                    
                    <Link
                      href={collection.href}
                      className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--accent)] hover:underline mt-auto uppercase tracking-wide"
                    >
                      Read Series
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>
    </div>
  );
}

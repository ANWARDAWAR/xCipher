import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { 
  Brain, 
  Terminal, 
  ShieldCheck, 
  Code2, 
  Cpu, 
  Sparkles, 
  CheckCircle2, 
  Scale, 
  FileCheck, 
  Lock, 
  ArrowUpRight, 
  Mail, 
  Layers, 
  Award, 
  Globe2, 
  Zap, 
  Compass,
  FileCode2
} from "lucide-react";
import { SocialIcon } from "@/components/author/AuthorProfileView";

export const metadata: Metadata = {
  title: "About xSypher — Decoding the Future of Technology",
  description:
    "xSypher is an independent technology publication dedicated to deep technical analysis, noise-free reporting, and investigative journalism across AI, Cybersecurity, Software, and Next-Gen Systems.",
};

export default function AboutPage() {
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

        {/* Ambient accent glow */}
        <div 
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[var(--accent)] opacity-10 blur-3xl pointer-events-none" 
          aria-hidden="true" 
        />
        <div 
          className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-[var(--accent)] opacity-5 blur-3xl pointer-events-none" 
          aria-hidden="true" 
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 pt-32 pb-16 sm:pt-40 sm:pb-24 lg:pt-44 lg:pb-28 relative z-10">
          {/* Kicker badge */}
          <div className="flex items-center gap-2 mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
              Inside xSypher // Editorial Manifesto
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="font-[family:var(--f-display)] text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-[var(--ink)] max-w-4xl text-balance">
            Decoding the Future of <span className="text-[var(--accent)]">Technology</span>.
          </h1>

          {/* Short Sub-headline */}
          <p className="mt-6 text-lg sm:text-xl lg:text-2xl text-[var(--muted)] font-[family:var(--f-body)] max-w-3xl leading-relaxed">
            An independent publication delivering noise-free, rigorous analysis across Artificial Intelligence, Offensive &amp; Defensive Cybersecurity, and Next-Generation Systems.
          </p>

          {/* Key Metrics Strip */}
          <div className="mt-12 pt-8 border-t border-[var(--line)] grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div className="flex flex-col">
              <span className="font-[family:var(--f-display)] text-2xl sm:text-3xl font-bold text-[var(--ink)]">
                2019
              </span>
              <span className="text-xs sm:text-sm text-[var(--muted)] font-[family:var(--f-ui)] mt-1">
                Founded &amp; Independent
              </span>
            </div>

            <div className="flex flex-col">
              <span className="font-[family:var(--f-display)] text-2xl sm:text-3xl font-bold text-[var(--ink)]">
                140+
              </span>
              <span className="text-xs sm:text-sm text-[var(--muted)] font-[family:var(--f-ui)] mt-1">
                Countries Reached
              </span>
            </div>

            <div className="flex flex-col">
              <span className="font-[family:var(--f-display)] text-2xl sm:text-3xl font-bold text-[var(--ink)]">
                100%
              </span>
              <span className="text-xs sm:text-sm text-[var(--muted)] font-[family:var(--f-ui)] mt-1">
                Technical Provenance
              </span>
            </div>

            <div className="flex flex-col">
              <span className="font-[family:var(--f-display)] text-2xl sm:text-3xl font-bold text-[var(--accent)]">
                Zero
              </span>
              <span className="text-xs sm:text-sm text-[var(--muted)] font-[family:var(--f-ui)] mt-1">
                Sponsored Clickbait
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. OUR STORY / MISSION
          ───────────────────────────────────────────────────────────── */}
      <section className="w-full py-16 sm:py-20 lg:py-24 border-b border-[var(--line)] bg-[var(--paper)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            
            {/* Left Header / Hook */}
            <div className="lg:col-span-4 flex flex-col">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--accent)] mb-3">
                <Compass className="w-4 h-4" />
                <span>Our Story &amp; Mission</span>
              </div>
              <h2 className="font-[family:var(--f-display)] text-2xl sm:text-4xl font-bold tracking-tight text-[var(--ink)] leading-snug">
                Why We Built xSypher: Separating Signal From the Noise.
              </h2>
              <p className="mt-4 text-sm sm:text-base text-[var(--muted)] font-[family:var(--f-body)] leading-relaxed">
                Technology is moving faster than human attention can filter. In an industry flooded with PR hype cycles and synthetic summaries, we champion verified technical truth.
              </p>

              {/* Quote / Highlight Card */}
              <div className="mt-8 p-6 rounded-lg bg-[var(--surface)] border border-[var(--line)] border-l-4 border-l-[var(--accent)] shadow-sm">
                <p className="text-sm font-medium italic text-[var(--ink)] leading-relaxed">
                  &ldquo;We don&apos;t write for algorithms or venture capitalists. We write for the engineers, security analysts, and curious minds who build and break systems in the real world.&rdquo;
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-[var(--surface-2)] flex items-center justify-center font-bold text-xs text-[var(--accent)] border border-[var(--line)]">
                    xS
                  </span>
                  <div className="text-xs">
                    <strong className="block font-semibold text-[var(--ink)]">xSypher Editorial Council</strong>
                    <span className="text-[var(--faint)]">Published Standard</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Detailed Narrative */}
            <div className="lg:col-span-8 flex flex-col gap-6 text-[var(--ink)] font-[family:var(--f-body)] text-base sm:text-lg leading-relaxed">
              <p>
                xSypher was founded at a crucial historical inflection point. The digital world is experiencing unprecedented transformation: artificial intelligence is disrupting decades of software paradigms, decentralized protocols are testing the foundations of data sovereignty, and cyber warfare has graduated from hypothetical threat models to daily geopolitical reality.
              </p>

              <p>
                Yet, as computing became more critical to human civilization, mainstream tech reporting became shallower. The modern media machine incentivizes breathless press release rewrites, speculative rumors, and sensational headlines manufactured to farm clicks rather than deliver insight. Crucial questions—<em>How does this neural architecture actually compute weights? What zero-day attack vector was leveraged? Can this hardware handle edge inference without throttling?</em>—were constantly glossed over.
              </p>

              <p>
                We launched xSypher to be the antidote to that superficiality. Our mission is direct and uncompromising: <strong>deliver noise-free, mathematically grounded, and empirically tested technology journalism</strong>. We believe you deserve reporting written by people who open the terminal, inspect the bytecode, compile the binaries, and audit the packets before putting pen to paper.
              </p>

              <p>
                The name <strong>xSypher</strong> is deliberate. Rooted in the word <em>cipher</em>—the fundamental cryptographic algorithm used to encrypt and decrypt data—it reflects our core mandate. The &apos;x&apos; represents the unknown frontier of next-generation technology, while &apos;Sypher&apos; embodies the complex, often opaque systems we investigate. We exist to decrypt the industry&apos;s noise, translating cryptic machine-level mechanics, neural architectures, and zero-day vulnerabilities into clear, verified intelligence.
              </p>

              {/* Three Core Tenets Sub-block */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-[var(--line)]">
                <div className="p-4 rounded-lg bg-[var(--surface)] border border-[var(--line)]">
                  <div className="w-8 h-8 rounded-md bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center mb-3">
                    <Zap className="w-4 h-4" />
                  </div>
                  <h3 className="font-[family:var(--f-display)] font-semibold text-sm text-[var(--ink)] mb-1">
                    Accuracy Over Speed
                  </h3>
                  <p className="text-xs text-[var(--muted)] leading-normal">
                    We would rather be second and thoroughly accurate than first with unverified vendor marketing claims.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-[var(--surface)] border border-[var(--line)]">
                  <div className="w-8 h-8 rounded-md bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center mb-3">
                    <FileCode2 className="w-4 h-4" />
                  </div>
                  <h3 className="font-[family:var(--f-display)] font-semibold text-sm text-[var(--ink)] mb-1">
                    Code-Level Audits
                  </h3>
                  <p className="text-xs text-[var(--muted)] leading-normal">
                    Every software and security story is backed by reproduced setups, local benchmarks, and GitHub artifacts.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-[var(--surface)] border border-[var(--line)]">
                  <div className="w-8 h-8 rounded-md bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center mb-3">
                    <Scale className="w-4 h-4" />
                  </div>
                  <h3 className="font-[family:var(--f-display)] font-semibold text-sm text-[var(--ink)] mb-1">
                    Complete Independence
                  </h3>
                  <p className="text-xs text-[var(--muted)] leading-normal">
                    No hardware manufacturer or venture fund dictates our tone. We test units purchased at retail.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. WHAT WE COVER (CORE PILLARS)
          ───────────────────────────────────────────────────────────── */}
      <section className="w-full py-16 sm:py-20 lg:py-24 border-b border-[var(--line)] bg-[var(--surface)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
          
          {/* Section Heading */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 lg:mb-16 gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--accent)] mb-2">
                <Layers className="w-4 h-4" />
                <span>Our Editorial Coverage</span>
              </div>
              <h2 className="font-[family:var(--f-display)] text-2xl sm:text-4xl font-bold tracking-tight text-[var(--ink)]">
                The Core Pillars of xSypher
              </h2>
            </div>
            <p className="text-sm sm:text-base text-[var(--muted)] font-[family:var(--f-ui)] max-w-md">
              Specialized research desks dedicated to unraveling technical complexity into clear, actionable intelligence.
            </p>
          </div>

          {/* Pillars Grid: Responsive 1 col -> 2 cols -> 3 cols */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            
            {/* Pillar 1: AI */}
            <div className="group relative p-6 sm:p-8 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--accent)] hover:shadow-lg flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-lg bg-[var(--surface)] border border-[var(--line)] group-hover:border-[var(--accent)]/50 flex items-center justify-center text-[var(--accent)] transition-colors mb-6 shadow-sm">
                  <Brain className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent)]">
                  Pillar 01
                </span>
                <h3 className="font-[family:var(--f-display)] text-xl font-bold text-[var(--ink)] mt-1 mb-3">
                  Artificial Intelligence
                </h3>
                <p className="text-sm text-[var(--muted)] font-[family:var(--f-body)] leading-relaxed">
                  Deep technical dives into frontier model architectures, transformer attention mechanics, neural network weight pruning, autonomous agentic loops, and open-weights quantization.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[var(--line)] group-hover:border-[var(--line-2)] flex flex-wrap gap-2 text-xs text-[var(--faint)]">
                <span className="px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--line)]">LLMs</span>
                <span className="px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--line)]">Multi-Modal</span>
                <span className="px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--line)]">Local Weights</span>
              </div>
            </div>

            {/* Pillar 2: Prompt Engineering */}
            <div className="group relative p-6 sm:p-8 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--accent)] hover:shadow-lg flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-lg bg-[var(--surface)] border border-[var(--line)] group-hover:border-[var(--accent)]/50 flex items-center justify-center text-[var(--accent)] transition-colors mb-6 shadow-sm">
                  <Terminal className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent)]">
                  Pillar 02
                </span>
                <h3 className="font-[family:var(--f-display)] text-xl font-bold text-[var(--ink)] mt-1 mb-3">
                  Prompt Engineering
                </h3>
                <p className="text-sm text-[var(--muted)] font-[family:var(--f-body)] leading-relaxed">
                  Treating prompt orchestration as strict systems design. Structured context steering, few-shot reasoning topologies, semantic caching, jailbreak mitigation, and output schema validation.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[var(--line)] group-hover:border-[var(--line-2)] flex flex-wrap gap-2 text-xs text-[var(--faint)]">
                <span className="px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--line)]">Context Routing</span>
                <span className="px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--line)]">Chain-of-Thought</span>
                <span className="px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--line)]">JSON Mode</span>
              </div>
            </div>

            {/* Pillar 3: Cybersecurity */}
            <div className="group relative p-6 sm:p-8 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--accent)] hover:shadow-lg flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-lg bg-[var(--surface)] border border-[var(--line)] group-hover:border-[var(--accent)]/50 flex items-center justify-center text-[var(--accent)] transition-colors mb-6 shadow-sm">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent)]">
                  Pillar 03
                </span>
                <h3 className="font-[family:var(--f-display)] text-xl font-bold text-[var(--ink)] mt-1 mb-3">
                  Cybersecurity &amp; Threat Intel
                </h3>
                <p className="text-sm text-[var(--muted)] font-[family:var(--f-body)] leading-relaxed">
                  Offensive and defensive security reporting. Dissecting zero-day CVEs, memory corruption exploits, APT telemetry, Kali Linux methodology, cryptographic breakthroughs, and threat modeling.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[var(--line)] group-hover:border-[var(--line-2)] flex flex-wrap gap-2 text-xs text-[var(--faint)]">
                <span className="px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--line)]">Zero-Day CVEs</span>
                <span className="px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--line)]">Kali Linux</span>
                <span className="px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--line)]">Penetration Testing</span>
              </div>
            </div>

            {/* Pillar 4: Software */}
            <div className="group relative p-6 sm:p-8 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--accent)] hover:shadow-lg flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-lg bg-[var(--surface)] border border-[var(--line)] group-hover:border-[var(--accent)]/50 flex items-center justify-center text-[var(--accent)] transition-colors mb-6 shadow-sm">
                  <Code2 className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent)]">
                  Pillar 04
                </span>
                <h3 className="font-[family:var(--f-display)] text-xl font-bold text-[var(--ink)] mt-1 mb-3">
                  Software Architecture
                </h3>
                <p className="text-sm text-[var(--muted)] font-[family:var(--f-body)] leading-relaxed">
                  Full-stack engineering decomposed. Dissecting modern frameworks like Next.js, React Server Components, TypeScript runtime guarantees, high-performance Python backends, and Rust tooling.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[var(--line)] group-hover:border-[var(--line-2)] flex flex-wrap gap-2 text-xs text-[var(--faint)]">
                <span className="px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--line)]">Next.js &amp; RSC</span>
                <span className="px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--line)]">Python Systems</span>
                <span className="px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--line)]">Distributed DBs</span>
              </div>
            </div>

            {/* Pillar 5: Gadgets & Silicon */}
            <div className="group relative p-6 sm:p-8 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--accent)] hover:shadow-lg flex flex-col justify-between md:col-span-2 lg:col-span-1">
              <div>
                <div className="w-12 h-12 rounded-lg bg-[var(--surface)] border border-[var(--line)] group-hover:border-[var(--accent)]/50 flex items-center justify-center text-[var(--accent)] transition-colors mb-6 shadow-sm">
                  <Cpu className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent)]">
                  Pillar 05
                </span>
                <h3 className="font-[family:var(--f-display)] text-xl font-bold text-[var(--ink)] mt-1 mb-3">
                  Next-Gen Gadgets &amp; Silicon
                </h3>
                <p className="text-sm text-[var(--muted)] font-[family:var(--f-body)] leading-relaxed">
                  Hardware teardowns, Neural Processing Unit (NPU) benchmarks, edge AI accelerators, RISC-V developments, and hands-on reviews of hardware built for developers and power users.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[var(--line)] group-hover:border-[var(--line-2)] flex flex-wrap gap-2 text-xs text-[var(--faint)]">
                <span className="px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--line)]">NPUs &amp; ASICs</span>
                <span className="px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--line)]">Hardware Teardowns</span>
                <span className="px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--line)]">Edge Compute</span>
              </div>
            </div>

            {/* Bonus Card: Investigative Dispatch */}
            <div className="group relative p-6 sm:p-8 rounded-xl bg-[var(--surface-3)] border border-[var(--line)] flex flex-col justify-between md:col-span-2 lg:col-span-1">
              <div>
                <div className="w-12 h-12 rounded-lg bg-[var(--surface)] border border-[var(--line)] flex items-center justify-center text-[var(--accent)] mb-6 shadow-sm">
                  <Sparkles className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent)]">
                  Exclusive Reports
                </span>
                <h3 className="font-[family:var(--f-display)] text-xl font-bold text-[var(--ink)] mt-1 mb-3">
                  Investigative Dispatches
                </h3>
                <p className="text-sm text-[var(--muted)] font-[family:var(--f-body)] leading-relaxed">
                  Original reporting on data breaches, covert surveillance protocols, regulatory battles, and internal corporate engineering maneuvers that shape tech geopolitics.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[var(--line)] flex items-center justify-between text-xs font-semibold text-[var(--accent)]">
                <Link href="/latest" className="inline-flex items-center gap-1 hover:underline">
                  Explore Latest Reports
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. OUR TEAM SECTION
          ───────────────────────────────────────────────────────────── */}
      <section className="w-full py-16 sm:py-20 lg:py-24 border-b border-[var(--line)] bg-[var(--paper)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
          
          {/* Section Header */}
          <div className="max-w-3xl mb-12 sm:mb-16">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--accent)] mb-2">
              <Award className="w-4 h-4" />
              <span>Editorial Leadership &amp; Analysts</span>
            </div>
            <h2 className="font-[family:var(--f-display)] text-2xl sm:text-4xl font-bold tracking-tight text-[var(--ink)]">
              Meet the Minds Behind xSypher
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[var(--muted)] font-[family:var(--f-ui)]">
              Engineers, penetration testers, and investigative researchers committed to fearless technical accuracy.
            </p>
          </div>

          {/* PROMINENT CARD: Anwar Iqbal Dawar (Founder & Lead Editor) */}
          <div className="mb-12 p-6 sm:p-8 lg:p-10 rounded-2xl bg-[var(--surface)] border-2 border-[var(--line)] hover:border-[var(--accent)] transition-all duration-300 shadow-md relative overflow-hidden group">
            {/* Top Accent Strip */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[var(--accent)]" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Avatar / Portrait Column */}
              <div className="lg:col-span-4 flex flex-col items-center lg:items-start text-center lg:text-left lg:-ml-3">
                <div className="relative w-fit mx-auto lg:mx-0 lg:mr-auto lg:w-full lg:max-w-[300px] mt-2 lg:-mt-6">
                  {/* Avatar Frame with Cyber Glow */}
                  <div className="relative mx-auto lg:mx-0 w-52 h-52 sm:w-64 sm:h-64 lg:w-full lg:max-w-[300px] lg:h-auto lg:aspect-[4/5] rounded-2xl bg-[var(--surface-2)] lg:bg-transparent border-2 border-[var(--accent)] lg:border-none overflow-hidden flex items-center justify-center shadow-md lg:shadow-none transition-colors">
                    <Image
                      src="/anwar.webp"
                      alt="Anwar Iqbal Dawar"
                      width={360}
                      height={450}
                      className="w-full h-full object-cover object-top lg:object-center origin-bottom lg:origin-center scale-[0.92] lg:scale-100 -translate-x-2.5 lg:translate-x-0 translate-y-1 lg:translate-y-0 rounded-2xl"
                      priority
                    />
                    {/* Desktop Bottom Fade Overlay */}
                    <div 
                      className="hidden lg:block absolute bottom-0 left-0 w-full h-14 bg-gradient-to-t from-[var(--surface)] to-transparent pointer-events-none" 
                      aria-hidden="true" 
                    />
                  </div>
                  {/* Verified Badge */}
                  <div 
                    className="absolute -bottom-2 -right-2 p-1.5 rounded-full bg-[var(--accent)] text-white shadow-md lg:hidden"
                    title="Verified Founder & Editor"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>

                <div className="mt-5 lg:mt-2.5 relative z-10">
                  <span className="inline-block px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/20 mb-2">
                    Founder &amp; Lead Editor
                  </span>
                  <h3 className="font-[family:var(--f-display)] text-2xl sm:text-3xl font-bold text-[var(--ink)]">
                    Anwar Iqbal Dawar
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--muted)] font-[family:var(--f-ui)] mt-0.5">
                    Computer Engineering Scholar &bull; Future Cyber Cloud Engineer
                  </p>
                </div>

                {/* Social & Contact Buttons */}
                <div className="flex items-center gap-3 mt-4 lg:mt-4 relative z-10">
                  <a 
                    href="https://github.com" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    aria-label="Anwar Iqbal Dawar on GitHub"
                    className="p-2 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--ink)] border border-[var(--line)] transition-colors"
                  >
                    <SocialIcon platform="github" />
                  </a>
                  <a 
                    href="https://twitter.com" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    aria-label="Anwar Iqbal Dawar on X"
                    className="p-2 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--ink)] border border-[var(--line)] transition-colors"
                  >
                    <SocialIcon platform="x" />
                  </a>
                  <a 
                    href="https://linkedin.com" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    aria-label="Anwar Iqbal Dawar on LinkedIn"
                    className="p-2 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--ink)] border border-[var(--line)] transition-colors"
                  >
                    <SocialIcon platform="linkedin" />
                  </a>
                  <a 
                    href="mailto:anwar@xsypher.news" 
                    aria-label="Email Anwar Iqbal Dawar"
                    className="p-2 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--ink)] border border-[var(--line)] transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Bio & Philosophy Column */}
              <div className="lg:col-span-8 flex flex-col justify-between">
                <div>
                  <h4 className="font-[family:var(--f-display)] text-base sm:text-lg font-bold text-[var(--ink)] mb-3">
                    Biography &amp; Technical Stance
                  </h4>
                  <p className="text-sm sm:text-base text-[var(--muted)] font-[family:var(--f-body)] leading-relaxed mb-4">
                    Anwar Iqbal Dawar built his foundational expertise while pursuing a <strong>BS in Computer Engineering</strong> at <strong>CECOS University Peshawar</strong>. Driven by an intense curiosity for how complex networks and software systems operate at a hardware level, Anwar focuses on identifying structural vulnerabilities before they can be exploited. His engineering background provides a rigorous, math-and-logic-driven approach to solving modern security challenges.
                  </p>
                  <p className="text-sm sm:text-base text-[var(--muted)] font-[family:var(--f-body)] leading-relaxed">
                    Looking ahead, Anwar is actively shaping his trajectory toward an <strong>MS in Cybersecurity</strong>, with the ultimate goal of becoming a <strong>Cyber Cloud Engineer</strong>. He believes the future of technology lies in securing decentralized, cloud-native infrastructures. At xSypher, Anwar ensures that every piece of technical journalism is grounded in authentic engineering principles, bridging the gap between academic research and frontline cloud defense.
                  </p>
                </div>

                {/* Anwar's Technical Stack Badges */}
                <div className="mt-6 pt-5 border-t border-[var(--line)]">
                  <span className="text-xs font-semibold text-[var(--ink)] uppercase tracking-wider block mb-2.5">
                    Core Specializations &amp; Tools:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-[var(--surface-2)] text-[var(--ink)] border border-[var(--line)]">
                      C++ &amp; Python
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-[var(--surface-2)] text-[var(--ink)] border border-[var(--line)]">
                      Full-Stack Web Development
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-[var(--surface-2)] text-[var(--ink)] border border-[var(--line)]">
                      Next.js &amp; React Architecture
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-[var(--surface-2)] text-[var(--ink)] border border-[var(--line)]">
                      Linux OS Administration
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-[var(--surface-2)] text-[var(--ink)] border border-[var(--line)]">
                      Cloud Infrastructure Security
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-[var(--surface-2)] text-[var(--ink)] border border-[var(--line)]">
                      Penetration Testing
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3 ADDITIONAL TEAM MEMBERS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            
            {/* Team Member 1 */}
            <div className="group p-6 rounded-xl bg-[var(--surface)] border border-[var(--line)] hover:border-[var(--accent)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-16 h-16 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] group-hover:border-[var(--accent)]/50 flex items-center justify-center font-[family:var(--f-display)] font-bold text-xl text-[var(--ink)] transition-colors">
                    ER
                  </div>
                  <div>
                    <h3 className="font-[family:var(--f-display)] text-lg font-bold text-[var(--ink)]">
                      Dr. Elena Rostova
                    </h3>
                    <p className="text-xs text-[var(--accent)] font-semibold uppercase tracking-wider">
                      Chief AI Research Analyst
                    </p>
                    <p className="text-[11px] text-[var(--faint)]">ex-Neural Systems Researcher</p>
                  </div>
                </div>
                <p className="text-sm text-[var(--muted)] font-[family:var(--f-body)] leading-relaxed">
                  Specializes in transformer attention mechanics, LLM alignment benchmarking, and synthetic data auditing. Leads our evaluation laboratory for generative models.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[var(--line)] flex items-center justify-between">
                <div className="flex gap-1.5 text-xs text-[var(--faint)]">
                  <span className="px-2 py-0.5 rounded bg-[var(--surface-2)]">PyTorch</span>
                  <span className="px-2 py-0.5 rounded bg-[var(--surface-2)]">Transformers</span>
                </div>
                <div className="flex gap-2">
                  <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="text-[var(--muted)] hover:text-[var(--ink)] transition-colors">
                    <SocialIcon platform="github" />
                  </a>
                  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="X" className="text-[var(--muted)] hover:text-[var(--ink)] transition-colors">
                    <SocialIcon platform="x" />
                  </a>
                </div>
              </div>
            </div>

            {/* Team Member 2 */}
            <div className="group p-6 rounded-xl bg-[var(--surface)] border border-[var(--line)] hover:border-[var(--accent)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-16 h-16 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] group-hover:border-[var(--accent)]/50 flex items-center justify-center font-[family:var(--f-display)] font-bold text-xl text-[var(--ink)] transition-colors">
                    MV
                  </div>
                  <div>
                    <h3 className="font-[family:var(--f-display)] text-lg font-bold text-[var(--ink)]">
                      Marcus Vance
                    </h3>
                    <p className="text-xs text-[var(--accent)] font-semibold uppercase tracking-wider">
                      Lead Vulnerability Analyst
                    </p>
                    <p className="text-[11px] text-[var(--faint)]">OSCP &bull; Security Researcher</p>
                  </div>
                </div>
                <p className="text-sm text-[var(--muted)] font-[family:var(--f-body)] leading-relaxed">
                  Focuses on zero-day vulnerability discovery, kernel exploit chains, memory corruption mitigations, and red team methodologies across distributed networks.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[var(--line)] flex items-center justify-between">
                <div className="flex gap-1.5 text-xs text-[var(--faint)]">
                  <span className="px-2 py-0.5 rounded bg-[var(--surface-2)]">Kernel</span>
                  <span className="px-2 py-0.5 rounded bg-[var(--surface-2)]">Exploit Dev</span>
                </div>
                <div className="flex gap-2">
                  <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="text-[var(--muted)] hover:text-[var(--ink)] transition-colors">
                    <SocialIcon platform="github" />
                  </a>
                  <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-[var(--muted)] hover:text-[var(--ink)] transition-colors">
                    <SocialIcon platform="linkedin" />
                  </a>
                </div>
              </div>
            </div>

            {/* Team Member 3 */}
            <div className="group p-6 rounded-xl bg-[var(--surface)] border border-[var(--line)] hover:border-[var(--accent)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-16 h-16 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] group-hover:border-[var(--accent)]/50 flex items-center justify-center font-[family:var(--f-display)] font-bold text-xl text-[var(--ink)] transition-colors">
                    SL
                  </div>
                  <div>
                    <h3 className="font-[family:var(--f-display)] text-lg font-bold text-[var(--ink)]">
                      Sophia Lin
                    </h3>
                    <p className="text-xs text-[var(--accent)] font-semibold uppercase tracking-wider">
                      Systems &amp; Hardware Editor
                    </p>
                    <p className="text-[11px] text-[var(--faint)]">Embedded Systems Engineer</p>
                  </div>
                </div>
                <p className="text-sm text-[var(--muted)] font-[family:var(--f-body)] leading-relaxed">
                  Covers edge silicon architectures, RISC-V developments, firmware forensics, and the physical engineering behind next-generation consumer and developer gadgets.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[var(--line)] flex items-center justify-between">
                <div className="flex gap-1.5 text-xs text-[var(--faint)]">
                  <span className="px-2 py-0.5 rounded bg-[var(--surface-2)]">Rust</span>
                  <span className="px-2 py-0.5 rounded bg-[var(--surface-2)]">RISC-V</span>
                </div>
                <div className="flex gap-2">
                  <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="text-[var(--muted)] hover:text-[var(--ink)] transition-colors">
                    <SocialIcon platform="github" />
                  </a>
                  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="X" className="text-[var(--muted)] hover:text-[var(--ink)] transition-colors">
                    <SocialIcon platform="x" />
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. OUR EDITORIAL PROMISE
          ───────────────────────────────────────────────────────────── */}
      <section className="w-full py-16 sm:py-20 lg:py-24 border-b border-[var(--line)] bg-[var(--surface)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
          
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--accent)] mb-3">
              <Scale className="w-4 h-4" />
              <span>Ethical Standards</span>
            </div>
            <h2 className="font-[family:var(--f-display)] text-2xl sm:text-4xl font-bold tracking-tight text-[var(--ink)]">
              Our Unyielding Editorial Promise
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[var(--muted)] font-[family:var(--f-ui)] leading-relaxed">
              Every word we publish is anchored by four foundational covenants to our readers. Trust is easy to forfeit and impossible to buy back.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            
            {/* Promise 1 */}
            <div className="p-6 sm:p-8 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] hover:border-[var(--line-2)] transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-[var(--surface)] border border-[var(--line)] flex items-center justify-center text-[var(--accent)] shrink-0 shadow-sm">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-[family:var(--f-display)] text-lg font-bold text-[var(--ink)] mb-2">
                    1. Empirical Fact-Checking &amp; Primary Verification
                  </h3>
                  <p className="text-sm text-[var(--muted)] font-[family:var(--f-body)] leading-relaxed">
                    We do not rely on second-hand regurgitations or vendor claims. Technical statements, performance claims, and vulnerability disclosures are tested in controlled sandboxes and verified against primary code repositories and raw packet captures.
                  </p>
                </div>
              </div>
            </div>

            {/* Promise 2 */}
            <div className="p-6 sm:p-8 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] hover:border-[var(--line-2)] transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-[var(--surface)] border border-[var(--line)] flex items-center justify-center text-[var(--accent)] shrink-0 shadow-sm">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-[family:var(--f-display)] text-lg font-bold text-[var(--ink)] mb-2">
                    2. Strict Separation of Editorial and Commercial
                  </h3>
                  <p className="text-sm text-[var(--muted)] font-[family:var(--f-body)] leading-relaxed">
                    No advertiser, corporate sponsor, or investor has preview access or editorial influence over our coverage. Sponsored content is exceptionally rare, always prominently labelled, and never produced by our editorial reporting staff.
                  </p>
                </div>
              </div>
            </div>

            {/* Promise 3 */}
            <div className="p-6 sm:p-8 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] hover:border-[var(--line-2)] transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-[var(--surface)] border border-[var(--line)] flex items-center justify-center text-[var(--accent)] shrink-0 shadow-sm">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-[family:var(--f-display)] text-lg font-bold text-[var(--ink)] mb-2">
                    3. Transparent, Unapologetic Corrections
                  </h3>
                  <p className="text-sm text-[var(--muted)] font-[family:var(--f-body)] leading-relaxed">
                    When we make an error, we correct it visibly and quickly. Substantive corrections are appended directly to the top of articles with clear changelogs and timestamps. We never quietly edit away errors to save face.
                  </p>
                </div>
              </div>
            </div>

            {/* Promise 4 */}
            <div className="p-6 sm:p-8 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] hover:border-[var(--line-2)] transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-[var(--surface)] border border-[var(--line)] flex items-center justify-center text-[var(--accent)] shrink-0 shadow-sm">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-[family:var(--f-display)] text-lg font-bold text-[var(--ink)] mb-2">
                    4. Ironclad Source Protection &amp; OpSec
                  </h3>
                  <p className="text-sm text-[var(--muted)] font-[family:var(--f-body)] leading-relaxed">
                    We safeguard our sources using PGP encryption, zero-log communication channels, and secure drop techniques. If you share confidential intelligence on critical vulnerabilities or corporate misconduct, your identity is shielded at all costs.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          6. INTERACTIVE CTA / CONTACT & NEWSLETTER SECTION
          ───────────────────────────────────────────────────────────── */}
      <section className="w-full py-16 sm:py-20 lg:py-24 bg-[var(--paper)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 lg:px-12">
          <div className="rounded-2xl bg-[var(--surface)] border border-[var(--line)] p-8 sm:p-12 text-center shadow-md relative overflow-hidden">
            {/* Glow effect */}
            <div 
              className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-[var(--accent)] opacity-10 blur-2xl pointer-events-none" 
              aria-hidden="true" 
            />

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[var(--surface-2)] text-[var(--ink)] border border-[var(--line)] mb-4">
              <Globe2 className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>Connect With The Newsroom</span>
            </div>

            <h2 className="font-[family:var(--f-display)] text-2xl sm:text-4xl font-extrabold text-[var(--ink)] tracking-tight">
              Have a Security Tip or Want to Join the Conversation?
            </h2>

            <p className="mt-4 text-sm sm:text-base text-[var(--muted)] font-[family:var(--f-body)] max-w-2xl mx-auto leading-relaxed">
              We respond to every credible intelligence lead, technical inquiry, and research collaboration. Explore our latest investigations or reach our editorial desk directly.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/latest"
                className="group relative w-full sm:w-auto inline-flex items-center justify-center overflow-hidden px-6 py-3.5 rounded-xl font-semibold text-sm !bg-[var(--accent)] dark:!bg-[var(--accent)] !text-white dark:!text-white hover:brightness-110 active:scale-95 transition-all shadow-sm"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Read Latest Stories
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </Link>
              <Link
                href="/page/contact"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm text-[var(--ink)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--line)] transition-all"
              >
                Submit a News Tip
                <Mail className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

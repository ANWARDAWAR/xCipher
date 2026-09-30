import Link from "next/link";
import { Terminal, Search, ArrowRight } from "lucide-react";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import ScrollReveal from "@/components/common/ScrollReveal";

export default function GlobalNotFound() {
  return (
    <>
      <ScrollReveal />
      <SiteHeader />
      <main id="view" tabIndex={-1} className="flex-1 flex flex-col items-center justify-center min-h-[70vh] px-4 py-12">
        <div className="max-w-2xl w-full mx-auto text-center border border-[var(--line)] bg-[var(--surface-2)] rounded-xl p-8 sm:p-12 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-[var(--accent)]" />
          
          <div className="mx-auto w-16 h-16 rounded-full bg-[var(--accent)]/10 flex items-center justify-center mb-6">
            <Terminal className="w-8 h-8 text-[var(--accent)]" />
          </div>

          <h1 className="font-[family:var(--f-display)] text-5xl sm:text-7xl font-extrabold text-[var(--ink)] mb-4 tracking-tight">
            404
          </h1>
          <h2 className="font-[family:var(--f-display)] text-xl sm:text-2xl font-bold text-[var(--ink)] mb-4 tracking-wide uppercase">
            // Packet Lost
          </h2>
          
          <p className="font-[family:var(--f-ui)] text-[var(--muted)] text-base sm:text-lg mb-10 max-w-lg mx-auto">
            The requested intelligence or resource could not be located on our servers. The endpoint may have been moved, deleted, or you might lack the necessary clearance.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm !bg-[var(--accent)] dark:!bg-[var(--accent)] !text-white dark:!text-white hover:brightness-110 active:scale-95 transition-all w-full sm:w-auto"
            >
              Return to Base
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              href="/latest"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-[var(--ink)] bg-transparent border border-[var(--line)] hover:bg-[var(--surface-3)] transition-all w-full sm:w-auto"
            >
              <Search className="w-4 h-4" />
              Latest Intelligence
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

import Link from "next/link";
import AdUnit from "@/components/common/AdUnit";
import Logo from "@/components/common/Logo";

export default function SiteFooter() {
  return (
    <footer className="site-foot">
      <div className="wrap">
        <AdUnit location="footer" size="728 × 90" slotClass="ad-leaderboard" style={{ paddingTop: "34px" }} />
        <div className="foot-grid">
          <div className="foot-brand">
            <Link className="logo" href="/" aria-label="xSypher — home">
              <Logo variant="brand" className="text-[26px] text-white" />
            </Link>
            <p>
              xSypher is an independent technology publication. We cover the companies, code and ideas shaping
              modern life — with original reporting, hands-on reviews and analysis that respects your time.
            </p>
            <div className="foot-social">
              <Link href="/page/about" aria-label="X" target="_blank" rel="noopener noreferrer">
                <svg className="ic-s" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.9 2H22l-6.8 7.8L23.3 22h-6.3l-4.9-6.4L6.4 22H3.3l7.3-8.3L1 2h6.5l4.4 5.9L18.9 2zm-1.1 18h1.7L7.1 3.9H5.3L17.8 20z" />
                </svg>
              </Link>
              <Link href="/page/about" aria-label="Facebook" target="_blank" rel="noopener noreferrer">
                <svg className="ic-s" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.7c0-.9.3-1.6 1.6-1.6h1.6V4.2c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1v2.6H7.5V14h2.8v8h3.2z" />
                </svg>
              </Link>
              <Link href="/page/about" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
                <svg className="ic-s" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
                </svg>
              </Link>
              <Link href="/page/about" aria-label="YouTube" target="_blank" rel="noopener noreferrer">
                <svg className="ic-s" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23 12s0-3.3-.4-4.9c-.2-.9-.9-1.6-1.8-1.8C19.2 5 12 5 12 5s-7.2 0-8.8.3c-.9.2-1.6.9-1.8 1.8C1 8.7 1 12 1 12s0 3.3.4 4.9c.2.9.9 1.6 1.8 1.8 1.6.3 8.8.3 8.8.3s7.2 0 8.8-.3c-.9-.2 1.6-.9 1.8-1.8.4-1.6.4-4.9.4-4.9zM9.8 15.5v-7l6 3.5-6 3.5z" />
                </svg>
              </Link>
              <Link href="/page/about" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer">
                <svg className="ic-s" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8h4V24h-4V8zm7.5 0h3.8v2.2h.1c.5-1 1.8-2.2 3.8-2.2 4 0 4.8 2.7 4.8 6.1V24h-4v-8.5c0-2-.4-3.5-2.1-3.5-1.7 0-2.4 1.2-2.4 3.4V24h-4V8z" />
                </svg>
              </Link>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold tracking-widest uppercase !text-red-500 mb-4 block">Coverage</h4>
            <Link href="/latest">Latest Intelligence</Link>
            <Link href="/category/ai">AI & Machine Learning</Link>
            <Link href="/category/cybersecurity">Cybersecurity</Link>
            <Link href="/category/software">Software Architecture</Link>
            <Link href="/category/gadgets">Hardware & Gadgets</Link>
            <Link href="/category/business">Tech Business</Link>
            <Link href="/series">Editorial Collections</Link>
          </div>
          <div>
            <h4 className="text-xs font-bold tracking-widest uppercase !text-red-500 mb-4 block">The Newsroom</h4>
            <Link href="/page/about">About xSypher</Link>
            <Link href="/page/contact">Contact Desk</Link>
            <Link href="/page/advertising">Advertising & Partnerships</Link>
            <Link href="/page/careers">Careers</Link>
            <Link href="/page/media-kit">Media Kit</Link>
            <Link href="/page/newsletters#subscribe">Newsletters</Link>
            <Link href="/feed.xml">RSS Feed</Link>
          </div>
          <div>
            <h4 className="text-xs font-bold tracking-widest uppercase !text-red-500 mb-4 block">Standards & Legal</h4>
            <Link href="/page/editorial-standards">Editorial Standards</Link>
            <Link href="/page/corrections">Corrections Policy</Link>
            <Link href="/page/transparency">Transparency Report</Link>
            <Link href="/page/privacy-policy">Privacy Policy</Link>
            <Link href="/page/terms-of-use">Terms of Use</Link>
            <Link href="/page/cookie-policy">Cookie Policy</Link>
            <Link href="/page/disclaimer">Technical Disclaimer</Link>
          </div>
        </div>
        <div className="foot-bottom flex items-center justify-center w-full">
          <span className="text-center">© 2026 xSypher. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}

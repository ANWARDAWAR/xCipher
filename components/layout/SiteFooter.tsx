import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="site-foot">
      <div className="wrap">
        <div className="ad-wrap" style={{ paddingTop: "34px" }}>
          <div className="ad-label">Advertisement</div>
          <div className="ad-slot ad-leaderboard" data-ad-location="footer" data-size="728 × 90"></div>
        </div>
        <div className="foot-grid">
          <div className="foot-brand">
            <Link className="logo" href="/" aria-label="xSypher — home">
              <svg width="24" height="24" viewBox="0 0 26 26" aria-hidden="true" style={{ color: "#fff" }}>
                <rect x="1" y="1" width="10" height="10" fill="currentColor" />
                <rect x="15" y="1" width="10" height="10" fill="currentColor" opacity=".32" />
                <rect x="1" y="15" width="10" height="10" fill="currentColor" opacity=".32" />
                <path d="M15.5 15.5 24.5 24.5M24.5 15.5l-9 9" stroke="var(--accent)" strokeWidth="3.2" strokeLinecap="round" />
              </svg>
              <span className="wm" style={{ color: "#fff" }}>x<span className="wm-x">Sypher</span></span>
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
            <h4>Sections</h4>
            <Link href="/category/ai">AI & Machine Learning</Link>
            <Link href="/category/cybersecurity">Cybersecurity</Link>
            <Link href="/category/gadgets">Gadgets</Link>
            <Link href="/category/software">Software</Link>
            <Link href="/category/programming">Programming</Link>
            <Link href="/category/business">Tech Business</Link>
            <Link href="/category/gaming">Gaming</Link>
            <Link href="/category/reviews">Reviews</Link>
          </div>
          <div>
            <h4>xSypher</h4>
            <Link href="/page/about">About xSypher</Link>
            <Link href="/page/contact">Contact</Link>
            <Link href="/page/editorial">Editorial Policy</Link>
            <Link href="/page/corrections">Corrections</Link>
            <Link href="/page/advertising">Advertising</Link>
            <Link href="/page/careers">Careers</Link>
            <Link href="/latest">Latest Stories</Link>
          </div>
          <div>
            <h4>Legal</h4>
            <Link href="/page/privacy">Privacy Policy</Link>
            <Link href="/page/terms">Terms of Use</Link>
            <Link href="/page/cookies">Cookie Policy</Link>
            <Link href="/page/newsletter">Newsletters</Link>
          </div>
        </div>
        <div className="foot-bottom">
          <span>© 2026 xSypher. All rights reserved.</span>
          <span>xSypher is an independent technology publication.</span>
          <span className="spacer"></span>
          <button id="consoleLink" title="Editorial console (Ctrl+Shift+E)">Staff · Editorial Console</button>
        </div>
      </div>
    </footer>
  );
}

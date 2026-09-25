"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import Logo from "@/components/common/Logo";

export default function MobileDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Close drawer on navigation
  useEffect(() => {
    setIsOpen(false);
    // Optional: Collapse "More" section on navigation so it is fresh next time
    setShowMore(false);
  }, [pathname]);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <>
      <button 
        className="icon-btn menu-btn" 
        onClick={() => setIsOpen(true)}
        aria-label="Open menu" 
        aria-expanded={isOpen} 
        aria-controls="drawer"
      >
        <svg className="w-5 h-5 md:w-6 md:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <div 
        className={`overlay ${isOpen ? "open" : ""}`} 
        id="drawerBack" 
        hidden={!isOpen}
        onClick={() => setIsOpen(false)}
      ></div>

      <aside 
        className={`drawer ${isOpen ? "open" : ""}`} 
        id="drawer" 
        role="dialog" 
        aria-modal="true" 
        aria-label="Menu"
        aria-hidden={!isOpen}
      >
        <div className="drawer-head sticky top-0 z-50 bg-[var(--surface)] border-b border-[var(--line)]">
          <Link className="logo" href="/" aria-label="xSypher — home" onClick={() => setIsOpen(false)}>
            <Logo variant="brand" className="text-[22px]" />
            <div className="flex flex-col text-[8px] font-bold tracking-widest text-[var(--muted)] uppercase leading-tight ml-3 border-l border-[var(--line)] pl-3">
              <span>ADVANCED TECH &</span>
              <span>SECURITY INSIGHTS</span>
            </div>
          </Link>
          <button className="icon-btn" aria-label="Close menu" onClick={() => setIsOpen(false)}>
            <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
              <path d="M5 5l14 14M19 5 5 19" />
            </svg>
          </button>
        </div>
        <nav id="drawerNav" aria-label="Sections">
          <div className="dr-group">BROWSE</div>
          <Link href="/" className={pathname === "/" ? "bg-[var(--accent)] !text-white font-semibold" : ""}>Home</Link>
          <Link href="/latest" className={pathname === "/latest" ? "bg-[var(--accent)] !text-white font-semibold" : ""}>Latest</Link>
          
          <div className="dr-group">SECTIONS</div>
          <Link href="/category/ai" className={pathname.startsWith("/category/ai") ? "bg-[var(--accent)] !text-white font-semibold" : ""}>AI & Machine Learning</Link>
          <Link href="/category/cybersecurity" className={pathname.startsWith("/category/cybersecurity") ? "bg-[var(--accent)] !text-white font-semibold" : ""}>Cybersecurity</Link>
          <Link href="/category/gadgets" className={pathname.startsWith("/category/gadgets") ? "bg-[var(--accent)] !text-white font-semibold" : ""}>Gadgets</Link>
          <Link href="/category/software" className={pathname.startsWith("/category/software") ? "bg-[var(--accent)] !text-white font-semibold" : ""}>Software</Link>
          <Link href="/category/programming" className={pathname.startsWith("/category/programming") ? "bg-[var(--accent)] !text-white font-semibold" : ""}>Programming</Link>
          <Link href="/category/business" className={pathname.startsWith("/category/business") ? "bg-[var(--accent)] !text-white font-semibold" : ""}>Startups & Business</Link>
          <Link href="/category/gaming" className={pathname.startsWith("/category/gaming") ? "bg-[var(--accent)] !text-white font-semibold" : ""}>Gaming</Link>
          <Link href="/category/reviews" className={pathname.startsWith("/category/reviews") ? "bg-[var(--accent)] !text-white font-semibold" : ""}>Reviews</Link>
          <Link href="/category/howto" className={pathname.startsWith("/category/howto") ? "bg-[var(--accent)] !text-white font-semibold" : ""}>How-To</Link>
          <Link href="/category/opinion" className={pathname.startsWith("/category/opinion") ? "bg-[var(--accent)] !text-white font-semibold" : ""}>Opinion</Link>
          <Link href="/category/science" className={pathname.startsWith("/category/science") ? "bg-[var(--accent)] !text-white font-semibold" : ""}>Science</Link>
          
          <div className="dr-group">COMPANY / INFO</div>
          <Link href="/page/about">About</Link>
          <Link href="/page/contact">Contact</Link>

          <button 
            onClick={() => setShowMore(!showMore)}
            className="flex items-center justify-between w-full text-left py-2 px-4 mt-2 text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] transition-colors rounded-sm"
            aria-expanded={showMore}
          >
            <span className="font-semibold text-sm">More Resources</span>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showMore ? "rotate-180" : ""}`} />
          </button>
          
          <div 
            className={`overflow-hidden transition-all duration-300 ease-in-out ${showMore ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0"}`}
          >
            <ul className="flex flex-col pl-4 border-l-2 border-[var(--line)] ml-4 mt-1 mb-2 space-y-1">
              <li><Link href="/page/media-kit" className="block py-1.5 text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors">Media Kit</Link></li>
              <li><Link href="/page/careers" className="block py-1.5 text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors">Careers</Link></li>
              <li><Link href="/page/newsletters#subscribe" className="block py-1.5 text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors">Newsletters</Link></li>
              <li><Link href="/page/editorial-standards" className="block py-1.5 text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors">Editorial Standards</Link></li>
              <li><Link href="/page/privacy-policy" className="block py-1.5 text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors">Privacy Policy</Link></li>
              <li><Link href="/page/terms-of-use" className="block py-1.5 text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors">Terms of Use</Link></li>
            </ul>
          </div>
        </nav>
        <div className="drawer-foot">
          <Link className="btn btn-solid" href="/page/newsletters#subscribe">Subscribe to the daily brief</Link>
          <button 
            className="btn" 
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label="Toggle dark mode"
          >
            {mounted && isDark ? (
              <svg className="ic-s" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              <svg className="ic-s" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z" />
              </svg>
            )}
            <span>Toggle dark mode</span>
          </button>
        </div>
      </aside>
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";

export default function MobileDrawer() {
  const [isOpen, setIsOpen] = useState(false);
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
            <svg width="23" height="23" viewBox="0 0 26 26" aria-hidden="true">
              <rect x="1" y="1" width="10" height="10" fill="currentColor" />
              <rect x="15" y="1" width="10" height="10" fill="currentColor" opacity=".32" />
              <rect x="1" y="15" width="10" height="10" fill="currentColor" opacity=".32" />
              <path d="M15.5 15.5 24.5 24.5M24.5 15.5l-9 9" stroke="var(--accent)" strokeWidth="3.2" strokeLinecap="round" />
            </svg>
            <span className="wm flex items-baseline" style={{ fontSize: "22px" }}><span>x</span><span className="wm-x font-kremlin font-normal tracking-wide">Sypher</span></span>
            <div className="flex flex-col text-[8px] font-bold tracking-widest text-[var(--muted)] uppercase leading-tight ml-2 border-l border-[var(--line)] pl-2">
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
          <div className="dr-group">Browse</div>
          <Link href="/" className={pathname === "/" ? "on" : ""}>Home</Link>
          <Link href="/latest" className={pathname === "/latest" ? "on" : ""}>Latest</Link>
          <div className="dr-group">Sections</div>
          <Link href="/category/ai" className={pathname.startsWith("/category/ai") ? "on" : ""}>AI & Machine Learning</Link>
          <Link href="/category/cybersecurity" className={pathname.startsWith("/category/cybersecurity") ? "on" : ""}>Cybersecurity</Link>
          <Link href="/category/gadgets" className={pathname.startsWith("/category/gadgets") ? "on" : ""}>Gadgets</Link>
          <Link href="/category/software" className={pathname.startsWith("/category/software") ? "on" : ""}>Software</Link>
          <Link href="/category/programming" className={pathname.startsWith("/category/programming") ? "on" : ""}>Programming</Link>
          <Link href="/category/business" className={pathname.startsWith("/category/business") ? "on" : ""}>Startups & Business</Link>
          <Link href="/category/gaming" className={pathname.startsWith("/category/gaming") ? "on" : ""}>Gaming</Link>
          <Link href="/category/reviews" className={pathname.startsWith("/category/reviews") ? "on" : ""}>Reviews</Link>
          <Link href="/category/howto" className={pathname.startsWith("/category/howto") ? "on" : ""}>How-To</Link>
          <div className="dr-group">More</div>
          <Link href="/category/opinion" className={pathname.startsWith("/category/opinion") ? "on" : ""}>Opinion</Link>
          <Link href="/page/about">About</Link>
          <Link href="/page/contact">Contact</Link>
        </nav>
        <div className="drawer-foot">
          <Link className="btn btn-solid" href="/page/newsletter">Subscribe to the daily brief</Link>
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

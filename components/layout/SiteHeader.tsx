"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import MobileDrawer from "./MobileDrawer";
import { usePathname } from "next/navigation";
import { SearchProvider, SearchButton } from "../search/SearchOverlay";
import { SocialIcon } from "@/components/author/AuthorProfileView";
import { Home, Info, Mail } from "lucide-react";

const NAV_ROW = [
  { name: "Home", href: "/", className: "nr-home" },
  { name: "Latest", href: "/latest" },
  { name: "AI", href: "/category/ai" },
  { name: "Cybersecurity", href: "/category/cybersecurity" },
  { name: "Gadgets", href: "/category/gadgets" },
  { name: "Software", href: "/category/software" },
  { name: "Programming", href: "/category/programming" },
  { name: "Startups", href: "/category/business" },
  { name: "Gaming", href: "/category/gaming" },
  { name: "Reviews", href: "/category/reviews" },
  { name: "How-To", href: "/category/howto" },
  { name: "Opinion", href: "/category/opinion" },
  { name: "Science", href: "/category/science" },
];

export default function SiteHeader() {
  const pathname = usePathname() || "";
  const now = new Date();
  const todayDateFull = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const todayDateCompact = now.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  useEffect(() => {

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const y = window.scrollY;
          
          const navrow = document.getElementById("navrow");
          if (y > 140) {
            navrow?.classList.add("stuck");
          } else if (y < 120) {
            navrow?.classList.remove("stuck");
          }
          
          if (y > 100) {
            document.body.classList.add("scrolled");
          } else if (y < 20) {
            document.body.classList.remove("scrolled");
          }
          
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.body.classList.remove("scrolled");
    };
  }, []);

  const isLinkActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <SearchProvider>
      <header className="site-head">
        <div className="utility border-b border-[var(--line)] text-[10px]">
          <div className="wrap utility-in flex items-center justify-between w-full">
            {/* Left: Date */}
            <div className="flex-1 flex justify-start overflow-hidden">
              <span id="todayDate" className="util-date !font-mono font-medium tracking-tight normal-case truncate">
                <span className="date-full" suppressHydrationWarning>{todayDateFull}</span>
                <span className="date-compact" suppressHydrationWarning>{todayDateCompact}</span>
              </span>
            </div>

            {/* Center: Quick Links with Separators */}
            <div className="flex items-center justify-center shrink-0 px-1 sm:px-2 text-[var(--muted)]">
              <span className="text-[var(--line-2)] opacity-70 mr-2.5 sm:mr-6 text-xs">|</span>
              <div className="flex items-center gap-2.5 sm:gap-6">
                <Link href="/" className="hover:text-[var(--accent)] transition-colors" aria-label="Home">
                  <Home className="w-3.5 h-3.5 sm:w-[14px] sm:h-[14px]" strokeWidth={2.5} />
                </Link>
                <Link href="https://github.com/xSypher" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--accent)] transition-colors" aria-label="About">
                  <Info className="w-3.5 h-3.5 sm:w-[14px] sm:h-[14px]" strokeWidth={2.5} />
                </Link>
                <Link href="/page/contact" className="hover:text-[var(--accent)] transition-colors" aria-label="Contact">
                  <Mail className="w-3.5 h-3.5 sm:w-[14px] sm:h-[14px]" strokeWidth={2.5} />
                </Link>
              </div>
              <span className="text-[var(--line-2)] opacity-70 ml-2.5 sm:ml-6 text-xs">|</span>
            </div>

            {/* Right: 3 Social Icons + Elegant Separator + Dark Mode Toggle */}
            <div className="flex-1 flex justify-end items-center gap-1 sm:gap-2.5">
              <div className="util-social flex items-center gap-1 sm:gap-2.5">
                <Link href="https://facebook.com/xSypher" target="_blank" rel="noopener noreferrer" aria-label="xSypher on Facebook">
                  <svg className="ic-s" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </Link>
                <Link href="https://twitter.com/xSypher" target="_blank" rel="noopener noreferrer" aria-label="xSypher on X">
                  <svg className="ic-s" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.9 2H22l-6.8 7.8L23.3 22h-6.3l-4.9-6.4L6.4 22H3.3l7.3-8.3L1 2h6.5l4.4 5.9L18.9 2zm-1.1 18h1.7L7.1 3.9H5.3L17.8 20z" />
                  </svg>
                </Link>
                <Link href="https://linkedin.com/company/xSypher" target="_blank" rel="noopener noreferrer" aria-label="xSypher on LinkedIn">
                  <svg className="ic-s" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8h4V24h-4V8zm7.5 0h3.8v2.2h.1c.5-1 1.8-2.2 3.8-2.2 4 0 4.8 2.7 4.8 6.1V24h-4v-8.5c0-2-.4-3.5-2.1-3.5-1.7 0-2.4 1.2-2.4 3.4V24h-4V8z" />
                  </svg>
                </Link>
              </div>

              {/* Beautiful Vertical Separator */}
              <span className="inline-block w-[1px] h-3.5 bg-[var(--line-2)] opacity-70 mx-0.5" aria-hidden="true" />

              {/* Dark Mode Toggle */}
              <ThemeToggle />
            </div>
          </div>
        </div>
        <div className="wrap masthead relative">
          <MobileDrawer />
          <Link className="logo" href="/" aria-label="xSypher — home">
            <svg width="27" height="27" viewBox="0 0 26 26" aria-hidden="true">
              <rect x="1" y="1" width="10" height="10" fill="currentColor" />
              <rect x="15" y="1" width="10" height="10" fill="currentColor" opacity=".32" />
              <rect x="1" y="15" width="10" height="10" fill="currentColor" opacity=".32" />
              <path d="M15.5 15.5 24.5 24.5M24.5 15.5l-9 9" stroke="var(--accent)" strokeWidth="3.2" strokeLinecap="round" />
            </svg>
            <span className="wm flex items-baseline"><span>x</span><span className="wm-x font-kremlin font-normal tracking-wide">Sypher</span></span>
          </Link>
          <div className="hidden sm:block border-l border-[var(--line)] pl-3 ml-1 text-[9px] uppercase tracking-[0.15em] font-bold text-[var(--muted)] leading-tight">
            ADVANCED TECH &<br />SECURITY INSIGHTS
          </div>
          
          <nav className="primary-nav flex-1" id="primaryNav" aria-label="Primary"></nav>

          {/* Desktop Centered Minimalist Navigation */}
          {/* Desktop Centered Minimalist Navigation */}
          <nav className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center gap-3 font-bold text-[12px] tracking-tight" style={{ fontFamily: "var(--f-display)" }}>
            <Link href="/" className="group relative inline-flex flex-col items-center justify-center py-1 text-[var(--ink)] hover:text-[var(--accent)] transition-colors" aria-label="Home">
              H
              <span className="absolute bottom-0 left-1/2 h-[2px] w-0 -translate-x-1/2 bg-[var(--accent)] transition-all duration-150 ease-out group-hover:w-full rounded-full" />
            </Link>
            <Link href="/category/ai" className="group relative inline-flex flex-col items-center justify-center py-1 text-[var(--ink)] hover:text-[var(--accent)] transition-colors" aria-label="AI">
              A
              <span className="absolute bottom-0 left-1/2 h-[2px] w-0 -translate-x-1/2 bg-[var(--accent)] transition-all duration-150 ease-out group-hover:w-full rounded-full" />
            </Link>
            <Link href="/category/cybersecurity" className="group relative inline-flex flex-col items-center justify-center py-1 text-[var(--ink)] hover:text-[var(--accent)] transition-colors" aria-label="Cybersecurity">
              C
              <span className="absolute bottom-0 left-1/2 h-[2px] w-0 -translate-x-1/2 bg-[var(--accent)] transition-all duration-150 ease-out group-hover:w-full rounded-full" />
            </Link>
            <Link href="/category/gadgets" className="group relative inline-flex flex-col items-center justify-center py-1 text-[var(--ink)] hover:text-[var(--accent)] transition-colors" aria-label="Gadgets">
              G
              <span className="absolute bottom-0 left-1/2 h-[2px] w-0 -translate-x-1/2 bg-[var(--accent)] transition-all duration-150 ease-out group-hover:w-full rounded-full" />
            </Link>
            <Link href="/category/software" className="group relative inline-flex flex-col items-center justify-center py-1 text-[var(--ink)] hover:text-[var(--accent)] transition-colors" aria-label="Software">
              S
              <span className="absolute bottom-0 left-1/2 h-[2px] w-0 -translate-x-1/2 bg-[var(--accent)] transition-all duration-150 ease-out group-hover:w-full rounded-full" />
            </Link>
            <Link href="/category/programming" className="group relative inline-flex flex-col items-center justify-center py-1 text-[var(--ink)] hover:text-[var(--accent)] transition-colors" aria-label="Programming">
              P
              <span className="absolute bottom-0 left-1/2 h-[2px] w-0 -translate-x-1/2 bg-[var(--accent)] transition-all duration-150 ease-out group-hover:w-full rounded-full" />
            </Link>
            <Link href="/category/business" className="group relative inline-flex flex-col items-center justify-center py-1 text-[var(--ink)] hover:text-[var(--accent)] transition-colors" aria-label="Business">
              B
              <span className="absolute bottom-0 left-1/2 h-[2px] w-0 -translate-x-1/2 bg-[var(--accent)] transition-all duration-150 ease-out group-hover:w-full rounded-full" />
            </Link>
            <Link href="/category/gaming" className="group relative inline-flex flex-col items-center justify-center py-1 text-[var(--ink)] hover:text-[var(--accent)] transition-colors" aria-label="Gaming">
              G
              <span className="absolute bottom-0 left-1/2 h-[2px] w-0 -translate-x-1/2 bg-[var(--accent)] transition-all duration-150 ease-out group-hover:w-full rounded-full" />
            </Link>
            <Link href="/category/reviews" className="group relative inline-flex flex-col items-center justify-center py-1 text-[var(--ink)] hover:text-[var(--accent)] transition-colors" aria-label="Reviews">
              R
              <span className="absolute bottom-0 left-1/2 h-[2px] w-0 -translate-x-1/2 bg-[var(--accent)] transition-all duration-150 ease-out group-hover:w-full rounded-full" />
            </Link>
            <Link href="/category/howto" className="group relative inline-flex flex-col items-center justify-center py-1 text-[var(--ink)] hover:text-[var(--accent)] transition-colors" aria-label="How-To">
              H
              <span className="absolute bottom-0 left-1/2 h-[2px] w-0 -translate-x-1/2 bg-[var(--accent)] transition-all duration-150 ease-out group-hover:w-full rounded-full" />
            </Link>
            <Link href="/category/opinion" className="group relative inline-flex flex-col items-center justify-center py-1 text-[var(--ink)] hover:text-[var(--accent)] transition-colors" aria-label="Opinion">
              O
              <span className="absolute bottom-0 left-1/2 h-[2px] w-0 -translate-x-1/2 bg-[var(--accent)] transition-all duration-150 ease-out group-hover:w-full rounded-full" />
            </Link>
            <Link href="/category/science" className="group relative inline-flex flex-col items-center justify-center py-1 text-[var(--ink)] hover:text-[var(--accent)] transition-colors" aria-label="Science">
              S
              <span className="absolute bottom-0 left-1/2 h-[2px] w-0 -translate-x-1/2 bg-[var(--accent)] transition-all duration-150 ease-out group-hover:w-full rounded-full" />
            </Link>
          </nav>

          <div className="mast-actions ml-auto">
            <SearchButton />
            <Link className="btn btn-solid" href="/page/newsletters#subscribe" id="subscribeBtn">Subscribe</Link>
          </div>
        </div>
        <div className="navrow" id="navrow">
          <div className="wrap navrow-in md:justify-center h-8.5 lg:h-[44px]" id="navrowIn" role="navigation" aria-label="Sections">
            {NAV_ROW.map((item) => {
              const active = isLinkActive(item.href);
              const classes = [
                item.className, 
                active ? "on" : "",
                "py-1 lg:py-1.5 px-2.5 lg:px-3 text-[11px] lg:text-xs"
              ].filter(Boolean).join(" ");
              return (
                <Link
                  key={`${item.name}-${item.href}`}
                  href={item.href}
                  className={classes}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </header>
    </SearchProvider>
  );
}
